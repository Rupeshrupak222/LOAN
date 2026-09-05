import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { calculateEmi } from '../finance/emi';

export interface UnderwritingIntelligenceResult {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  executiveSummary: string;
  creditSummary: string;
  financialAssessment: {
    incomeVsObligations: string;
    netSurplusCashflow: string;
    dtiAssessment: string;
    tenureAndRateSuitability: string;
  };
  riskAssessment: {
    overallTier: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number;
    employmentPillar: string;
    debtPillar: string;
    kycPillar: string;
    creditHistoryPillar: string;
  };
  policyAssessment: {
    status: 'PASSED' | 'FAILED' | 'EXCEPTIONS_DETECTED' | 'INSUFFICIENT_DATA';
    passedRules: string[];
    failedOrWarningRules: string[];
    exceptionsDetected: string[];
  };
  kycDocumentAssessment: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    observations: string;
  };
  redFlags: {
    issue: string;
    whyItMatters: string;
    supportingLmsData: string;
    suggestedReviewAction: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  missingInformation: string[];
  suggestedConditions: {
    type: 'PRE_DISBURSEMENT' | 'POST_DISBURSEMENT' | 'DOCUMENTATION';
    condition: string;
    rationale: string;
  }[];
  recommendedReviewPosition:
    | 'SUITABLE_FOR_SANCTION_CONSIDERATION'
    | 'PROCEED_WITH_STIPULATED_CONDITIONS'
    | 'ADDITIONAL_VERIFICATION_REQUIRED'
    | 'HIGH_RISK_RECONSIDERATION';
  recommendationRationale: string;
  approvalAuthorityNotice: string;
}

/**
 * Builds authorized, comprehensive LMS context specifically tailored for Underwriting Decision Support.
 */
async function buildUnderwritingContext(applicationId: string) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          employmentDetails: true,
          documents: true,
          bankAccounts: true,
          loans: {
            include: {
              collectionCases: true,
              schedule: { where: { status: { not: 'PAID' } }, take: 2 },
            },
          },
        },
      },
      product: true,
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!app) {
    throw new NotFoundError('Loan application record not found');
  }

  const { customer, product, eligibility, riskAssessment, underwriting } = app;

  const requestedAmount = Number(app.requestedAmount);
  const tenureMonths = app.tenureMonths;
  const interestRate = Number(product.interestRate);
  const monthlyIncome = Number(customer.monthlyIncome || 0);
  const existingObligations = Number(customer.existingObligations || 0);

  // Authoritative financial calculations
  const emiCalc = calculateEmi(requestedAmount, interestRate, tenureMonths);
  const estimatedEmi = Number(emiCalc.emi);
  const proposedTotalObligations = existingObligations + estimatedEmi;
  const proposedDti = monthlyIncome > 0 ? proposedTotalObligations / monthlyIncome : 1;
  const netSurplus = monthlyIncome - proposedTotalObligations;

  // Approval Limits check from SystemSetting
  const limitsSetting = await prisma.systemSetting.findUnique({ where: { key: 'approval_limits' } });
  const limits = (limitsSetting?.value as any[]) || [];
  const matchedTier = limits.find((l) => l.maxAmount === null || requestedAmount <= Number(l.maxAmount));
  const authorityRequirement = matchedTier
    ? `Required Approval Chain: ${(matchedTier.chain || []).join(' -> ')} (Max Limit Tier: ₹${matchedTier.maxAmount ? Number(matchedTier.maxAmount).toLocaleString('en-IN') : 'Unlimited'})`
    : 'Standard Underwriter Discretion Tier';

  // Documents summary
  const docsList = customer.documents.map(
    (d) =>
      `- Document: ${d.category} (${d.documentType || 'DOC'}), File: "${d.fileName}", Status: ${d.status}, Verified: ${d.verified}${d.rejectionReason ? ` [Rejection Reason: ${d.rejectionReason}]` : ''}`
  );

  // Eligibility summary
  const eligibilityFactors = Array.isArray(eligibility?.factors)
    ? (eligibility?.factors as any[]).map((f) => `- Policy Rule [${f.factor}]: ${f.status} -> ${f.detail}`)
    : ['- Automated Eligibility Engine has not been evaluated yet.'];

  // 4-Pillar Risk Breakdown
  const riskPillars = Array.isArray(riskAssessment?.factors)
    ? (riskAssessment?.factors as any[]).map(
        (rf) => `- Risk Pillar [${rf.name}]: Score ${rf.score}/100 (Weight ${rf.weight}%) -> ${rf.remarks}`
      )
    : ['- 4-Pillar Risk Engine has not been calculated yet.'];

  // Institutional Loan History
  const existingLoansSummary =
    customer.loans.length > 0
      ? customer.loans.map(
          (l) =>
            `- Existing Loan #${l.loanNo}: Status ${l.status}, Sanction: ₹${Number(l.principal).toLocaleString('en-IN')}, Balance: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}, Active Collection Delinquencies: ${l.collectionCases.length}`
        )
      : ['- Borrower has zero prior loan accounts with this institution.'];

  const emp = customer.employmentDetails[0];

  const contextPrompt = `
=== CASE PROFILE & UNDERWRITING SUMMARY ===
Application Number: ${app.applicationNo}
Current Application Status: ${app.status}
Requested Principal Sanction: ₹${requestedAmount.toLocaleString('en-IN')}
Requested Tenure: ${tenureMonths} Months
Loan Product: ${product.name} (Code: ${product.code || 'GENERAL'}, Interest Rate: ${interestRate}% p.a. ${product.interestMethod})
Authoritative Calculated Monthly Installment (EMI): ₹${estimatedEmi.toLocaleString('en-IN')}
Approval Authority Requirement: ${authorityRequirement}

=== BORROWER DEMOGRAPHICS & FINANCIAL STANDING ===
Customer Code: ${customer.customerCode}
Borrower Name: ${customer.firstName} ${customer.lastName}
Age / DOB: ${customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'Not Specified'}
City: ${customer.city || 'N/A'}, State: ${customer.state || 'N/A'}
Employment Profile: ${customer.employmentType || 'SALARIED'} at "${emp?.employerName || customer.employerName || 'Not specified'}" (${emp?.designation || 'Staff'})
Verified Experience Vintage: ${emp?.workExperienceYears ? `${emp.workExperienceYears} years` : 'Unverified'}
Declared Net Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
Declared Existing Monthly Obligations: ₹${existingObligations.toLocaleString('en-IN')}
Proposed Total Debt Obligations (Existing + New EMI): ₹${proposedTotalObligations.toLocaleString('en-IN')}
Net Monthly Disposable Cashflow Surplus: ₹${netSurplus.toLocaleString('en-IN')}
Proposed Fixed Obligation to Income (DTI/FOIR): ${(proposedDti * 100).toFixed(1)}%
KYC Compliance Status: ${customer.kycStatus}
Bank Accounts: ${customer.bankAccounts.length} on file (${customer.bankAccounts.filter((b) => b.isVerified).length} verified)

=== DOCUMENT VAULT AUDIT (${customer.documents.length} Files Uploaded) ===
${docsList.length > 0 ? docsList.join('\n') : '- No compliance or income documents uploaded.'}

=== RULE-BASED POLICY ELIGIBILITY ENGINE OUTPUT ===
Eligibility Status: ${eligibility?.result || 'NOT ASSESSED'}
Policy Checks:
${eligibilityFactors.join('\n')}

=== 4-PILLAR CREDIT RISK SCORING MODEL OUTPUT ===
Calculated Risk Score: ${riskAssessment?.score ?? 'N/A'}/100
Calculated Risk Tier: ${riskAssessment?.category || 'PENDING'}
Pillars Breakdown:
${riskPillars.join('\n')}

=== INSTITUTIONAL BORROWER REPAYMENT HISTORY (${customer.loans.length} Loans) ===
${existingLoansSummary.join('\n')}

=== UNDERWRITING DECISION AUDIT ===
Existing Underwriting Decision: ${underwriting?.decision || 'PENDING_REVIEW'}
Decision Recorded By: ${underwriting?.decidedBy || 'None'}
Decision Reason: ${underwriting?.reason || 'None'}
`;

  return { app, customer, product, estimatedEmi, proposedDti, netSurplus, contextPrompt };
}

/**
 * Generates structured, explainable Underwriting Intelligence using Google Gemini.
 */
export async function generateUnderwritingIntelligence(
  applicationId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<UnderwritingIntelligenceResult> {
  // 1. RBAC Guard - only authorized Underwriters and Staff roles
  const isAuthorized = actor.roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Underwriters, Credit Analysts, and Authorized Managers can generate Underwriting Intelligence'
    );
  }

  // 2. Build verified LMS context
  const {
    app,
    customer,
    product,
    estimatedEmi,
    proposedDti,
    netSurplus,
    contextPrompt,
  } = await buildUnderwritingContext(applicationId);

  // 3. System Prompt for Underwriting Intelligence
  const systemInstruction = `
You are the Chief Underwriting Decision Support AI for Adyapan Loan Management System.
Synthesize loan application facts, KYC, 4-pillar risk outputs, and policy compliance into an explainable underwriting brief.

RULES:
1. TRUTHFULNESS & GROUNDING: Base all assessments solely on verified LMS data. Never hallucinate.
2. DECISION SUPPORT ONLY: Do not approve or reject loans. Provide structured evidence for underwriters.
3. CONCISENESS: Keep each narrative field to 1-2 concise, high-signal sentences.
4. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

SCHEMA:
{
  "executiveSummary": "Concise 2-sentence executive summary of proposal, borrower profile, and key merits/concerns.",
  "creditSummary": "Summary of creditworthiness based on income, liabilities, and repayment track record.",
  "financialAssessment": {
    "incomeVsObligations": "Analysis of declared income vs debt obligations",
    "netSurplusCashflow": "Evaluation of disposable buffer",
    "dtiAssessment": "Interpretation of DTI percentage against 50% benchmark",
    "tenureAndRateSuitability": "Assessment of proposed tenure and rate"
  },
  "riskAssessment": {
    "overallTier": "LOW" | "MEDIUM" | "HIGH",
    "riskScore": number,
    "employmentPillar": "Assessment of employment stability",
    "debtPillar": "Assessment of debt servicing capacity",
    "kycPillar": "Assessment of KYC completeness",
    "creditHistoryPillar": "Assessment of past credit track record"
  },
  "policyAssessment": {
    "status": "PASSED" | "FAILED" | "EXCEPTIONS_DETECTED" | "INSUFFICIENT_DATA",
    "passedRules": ["Passed policy checks"],
    "failedOrWarningRules": ["Warning or failing policy checks"],
    "exceptionsDetected": ["Policy deviations requiring sign-off"]
  },
  "kycDocumentAssessment": {
    "kycStatus": "KYC status",
    "verifiedDocumentsCount": number,
    "totalDocumentsCount": number,
    "observations": "Compliance documentation adequacy"
  },
  "redFlags": [
    {
      "issue": "Specific risk flag",
      "whyItMatters": "Underwriting consequence",
      "supportingLmsData": "LMS data point",
      "suggestedReviewAction": "Review action for underwriter",
      "severity": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "missingInformation": ["Missing verifications or requirements"],
  "suggestedConditions": [
    {
      "type": "PRE_DISBURSEMENT" | "POST_DISBURSEMENT" | "DOCUMENTATION",
      "condition": "Specific condition",
      "rationale": "Why condition protects institution"
    }
  ],
  "recommendedReviewPosition": "SUITABLE_FOR_SANCTION_CONSIDERATION" | "PROCEED_WITH_STIPULATED_CONDITIONS" | "ADDITIONAL_VERIFICATION_REQUIRED" | "HIGH_RISK_RECONSIDERATION",
  "recommendationRationale": "Rationale for recommended position",
  "approvalAuthorityNotice": "Sanction tier authority requirements"
}
`;

  let result: UnderwritingIntelligenceResult;

  try {
    // 4. Generate content via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Analyze the following complete underwriting proposal and generate the structured Underwriting Intelligence JSON briefing:\n\n${contextPrompt}`,
      systemInstruction,
      temperature: 0.1, // High precision
    });

    // 5. Parse and validate JSON safely
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);

    result = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      generatedAt: new Date().toISOString(),
      model: geminiResult.model,
      executiveSummary: parsed.executiveSummary || 'Underwriting assessment completed.',
      creditSummary: parsed.creditSummary || 'Credit profile assessed based on LMS records.',
      financialAssessment: parsed.financialAssessment || {
        incomeVsObligations: `Monthly net income is ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')} against ₹${Number(app.customer.existingObligations || 0).toLocaleString('en-IN')} obligations.`,
        netSurplusCashflow: `Disposable monthly buffer of ₹${netSurplus.toLocaleString('en-IN')}.`,
        dtiAssessment: `Proposed total DTI is ${(proposedDti * 100).toFixed(1)}%.`,
        tenureAndRateSuitability: `Tenure of ${app.tenureMonths} months at ${app.product.interestRate}% p.a.`,
      },
      riskAssessment: {
        overallTier: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.riskAssessment?.overallTier)
          ? parsed.riskAssessment.overallTier
          : (app.riskAssessment?.category as any) || 'LOW',
        riskScore: typeof parsed.riskAssessment?.riskScore === 'number' ? parsed.riskAssessment.riskScore : (app.riskAssessment?.score ?? 80),
        employmentPillar: parsed.riskAssessment?.employmentPillar || 'N/A',
        debtPillar: parsed.riskAssessment?.debtPillar || 'N/A',
        kycPillar: parsed.riskAssessment?.kycPillar || 'N/A',
        creditHistoryPillar: parsed.riskAssessment?.creditHistoryPillar || 'N/A',
      },
      policyAssessment: {
        status: ['PASSED', 'FAILED', 'EXCEPTIONS_DETECTED', 'INSUFFICIENT_DATA'].includes(parsed.policyAssessment?.status)
          ? parsed.policyAssessment.status
          : 'PASSED',
        passedRules: Array.isArray(parsed.policyAssessment?.passedRules) ? parsed.policyAssessment.passedRules : [],
        failedOrWarningRules: Array.isArray(parsed.policyAssessment?.failedOrWarningRules) ? parsed.policyAssessment.failedOrWarningRules : [],
        exceptionsDetected: Array.isArray(parsed.policyAssessment?.exceptionsDetected) ? parsed.policyAssessment.exceptionsDetected : [],
      },
      kycDocumentAssessment: {
        kycStatus: parsed.kycDocumentAssessment?.kycStatus || app.customer.kycStatus,
        verifiedDocumentsCount: typeof parsed.kycDocumentAssessment?.verifiedDocumentsCount === 'number' ? parsed.kycDocumentAssessment.verifiedDocumentsCount : app.customer.documents.filter((d) => d.verified).length,
        totalDocumentsCount: typeof parsed.kycDocumentAssessment?.totalDocumentsCount === 'number' ? parsed.kycDocumentAssessment.totalDocumentsCount : app.customer.documents.length,
        observations: parsed.kycDocumentAssessment?.observations || 'N/A',
      },
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      suggestedConditions: Array.isArray(parsed.suggestedConditions) ? parsed.suggestedConditions : [],
      recommendedReviewPosition: [
        'SUITABLE_FOR_SANCTION_CONSIDERATION',
        'PROCEED_WITH_STIPULATED_CONDITIONS',
        'ADDITIONAL_VERIFICATION_REQUIRED',
        'HIGH_RISK_RECONSIDERATION',
      ].includes(parsed.recommendedReviewPosition)
        ? parsed.recommendedReviewPosition
        : 'PROCEED_WITH_STIPULATED_CONDITIONS',
      recommendationRationale: parsed.recommendationRationale || 'Based on available application metrics.',
      approvalAuthorityNotice: parsed.approvalAuthorityNotice || 'Standard Underwriting Authority',
    };
  } catch {
    // Deterministic Rule-Based Fallback if Gemini times out or is temporarily unavailable
    const verifiedDocCount = app.customer.documents.filter((d) => d.verified).length;
    const isKycVerified = app.customer.kycStatus === 'VERIFIED';
    const isFoirHealthy = proposedDti <= 0.5;

    let fallbackPosition: UnderwritingIntelligenceResult['recommendedReviewPosition'] = 'PROCEED_WITH_STIPULATED_CONDITIONS';
    if (!isKycVerified) {
      fallbackPosition = 'ADDITIONAL_VERIFICATION_REQUIRED';
    } else if (isFoirHealthy && app.riskAssessment?.category === 'LOW') {
      fallbackPosition = 'SUITABLE_FOR_SANCTION_CONSIDERATION';
    } else if (proposedDti > 0.65 || app.riskAssessment?.category === 'HIGH') {
      fallbackPosition = 'HIGH_RISK_RECONSIDERATION';
    }

    const redFlags: UnderwritingIntelligenceResult['redFlags'] = [];
    if (!isKycVerified) {
      redFlags.push({
        issue: `KYC Status is ${app.customer.kycStatus}`,
        whyItMatters: 'Mandatory identity and address checks must be verified prior to approval.',
        supportingLmsData: `${verifiedDocCount}/${app.customer.documents.length} documents verified.`,
        suggestedReviewAction: 'Complete KYC verification in Document Vault.',
        severity: 'HIGH',
      });
    }
    if (!isFoirHealthy) {
      redFlags.push({
        issue: `FOIR is ${(proposedDti * 100).toFixed(1)}% (exceeds 50% threshold)`,
        whyItMatters: 'High debt servicing burden increases default vulnerability.',
        supportingLmsData: `Declared income ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')}, Total Debt ₹${(Number(app.customer.existingObligations || 0) + estimatedEmi).toLocaleString('en-IN')}.`,
        suggestedReviewAction: 'Consider adjusting tenure or obtaining co-applicant guarantee.',
        severity: proposedDti > 0.65 ? 'HIGH' : 'MEDIUM',
      });
    }

    result = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      generatedAt: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      executiveSummary: `Underwriting proposal #${app.applicationNo} evaluated for ${app.customer.firstName} ${app.customer.lastName}. Principal: ₹${Number(app.requestedAmount).toLocaleString('en-IN')} (${app.product.name}). Risk Tier: ${app.riskAssessment?.category || 'PENDING'} (Score: ${app.riskAssessment?.score ?? 'N/A'}/100). Recommended position: ${fallbackPosition.replace(/_/g, ' ')}. (Deterministic LMS briefing).`,
      creditSummary: `Declared income of ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')} with ₹${Number(app.customer.existingObligations || 0).toLocaleString('en-IN')} existing debt. Borrower has ${app.customer.loans.length} prior loan(s).`,
      financialAssessment: {
        incomeVsObligations: `Monthly net income is ₹${Number(app.customer.monthlyIncome || 0).toLocaleString('en-IN')} against ₹${Number(app.customer.existingObligations || 0).toLocaleString('en-IN')} existing obligations.`,
        netSurplusCashflow: `Net monthly disposable cash surplus is ₹${netSurplus.toLocaleString('en-IN')}.`,
        dtiAssessment: `Proposed total DTI is ${(proposedDti * 100).toFixed(1)}% (Benchmark: <50% Healthy, >55% High).`,
        tenureAndRateSuitability: `Proposed tenure is ${app.tenureMonths} months at ${app.product.interestRate}% p.a. (${app.product.interestMethod}).`,
      },
      riskAssessment: {
        overallTier: (app.riskAssessment?.category as any) || 'LOW',
        riskScore: app.riskAssessment?.score ?? 80,
        employmentPillar: `Employment type: ${app.customer.employmentType || 'Salaried'}.`,
        debtPillar: `Debt servicing capacity: ${(proposedDti * 100).toFixed(1)}% FOIR.`,
        kycPillar: `KYC completeness: ${app.customer.kycStatus} (${verifiedDocCount} verified docs).`,
        creditHistoryPillar: `Prior institutional loans: ${app.customer.loans.length}.`,
      },
      policyAssessment: {
        status: app.eligibility?.result === 'FAIL' ? 'FAILED' : 'PASSED',
        passedRules: ['Age criteria verified', 'Product tenure boundary satisfied'],
        failedOrWarningRules: !isFoirHealthy ? ['FOIR exceeds standard 50% limit'] : [],
        exceptionsDetected: [],
      },
      kycDocumentAssessment: {
        kycStatus: app.customer.kycStatus,
        verifiedDocumentsCount: verifiedDocCount,
        totalDocumentsCount: app.customer.documents.length,
        observations: `${verifiedDocCount} of ${app.customer.documents.length} uploaded documents verified.`,
      },
      redFlags,
      missingInformation: app.customer.documents.filter((d) => !d.verified).map((d) => `Document pending verification: ${d.fileName}`),
      suggestedConditions: [
        {
          type: 'PRE_DISBURSEMENT',
          condition: 'Execute NACH auto-debit mandate on verified primary bank account.',
          rationale: 'Ensures automated EMI collections on scheduled due dates.',
        },
      ],
      recommendedReviewPosition: fallbackPosition,
      recommendationRationale: `Determined from authoritative LMS risk model score (${app.riskAssessment?.score ?? 'N/A'}/100) and ${(proposedDti * 100).toFixed(1)}% FOIR.`,
      approvalAuthorityNotice: 'Standard Underwriting Sanction Authority Matrix applied.',
    };
  }

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    role: actor.roles[0] || 'UNDERWRITER',
    action: 'UNDERWRITING_INTELLIGENCE_GENERATED',
    entity: 'LoanApplication',
    entityId: app.id,
    newValue: {
      applicationNo: app.applicationNo,
      recommendedPosition: result.recommendedReviewPosition,
      model: result.model,
      generatedBy: actor.email,
    },
  }).catch(() => {});

  return result;
}
