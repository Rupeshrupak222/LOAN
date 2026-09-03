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
  const { app, contextPrompt } = await buildUnderwritingContext(applicationId);

  // 3. System Prompt for Underwriting Intelligence
  const systemInstruction = `
You are the Chief Underwriting Decision Support AI for Adyapan Loan Management System.
You assist human Underwriters by synthesizing loan application facts, KYC status, 4-pillar risk outputs, and policy compliance into an explainable underwriting brief.

=== STRICT UNDERWRITING RULES ===
1. TRUTHFULNESS & FACT GROUNDING: Base all assessments, figures, ratios, dates, and names SOLELY on the verified LMS Context provided.
2. NO HALLUCINATION: Never invent fake salaries, employer names, document numbers, or risk scores.
3. DECISION-SUPPORT ONLY: You do NOT approve, reject, or sanction loans. You provide clear, evidence-based decision support for the human Underwriter.
4. EXPLAINABILITY: Every red flag and observation must clearly link a Finding -> LMS Evidence -> Why it matters -> Suggested Underwriter Action.
5. CONDITIONS: Suggest practical, actionable pre/post-disbursement underwriting conditions where appropriate (e.g. NACH mandate, verified salary credit proof). Do not claim conditions were automatically applied.
6. NO RECALCULATION: Treat existing backend values (EMI, DTI, Risk Score, Eligibility Result) as authoritative truth.
7. STRICT JSON: Return ONLY a valid JSON object matching the required schema without any markdown wrapping or commentary.

=== REQUIRED JSON SCHEMA ===
{
  "executiveSummary": "A concise executive briefing (3-4 sentences) summarizing the loan proposal, borrower profile, key merits, and critical concerns.",
  "creditSummary": "A summary of creditworthiness based on declared income, existing liabilities, and institutional repayment track record.",
  "financialAssessment": {
    "incomeVsObligations": "Analysis of declared net income versus existing obligations and proposed EMI",
    "netSurplusCashflow": "Evaluation of disposable income buffer and safety cushion",
    "dtiAssessment": "Interpretation of the total DTI percentage against institutional benchmarks (<45% healthy, >55% high)",
    "tenureAndRateSuitability": "Assessment of proposed tenure and interest rate structure"
  },
  "riskAssessment": {
    "overallTier": "LOW" | "MEDIUM" | "HIGH",
    "riskScore": number,
    "employmentPillar": "Interpretation of employment stability score and job profile",
    "debtPillar": "Interpretation of debt service capacity pillar score",
    "kycPillar": "Interpretation of KYC/document completeness score",
    "creditHistoryPillar": "Interpretation of past borrowing and default risk score"
  },
  "policyAssessment": {
    "status": "PASSED" | "FAILED" | "EXCEPTIONS_DETECTED" | "INSUFFICIENT_DATA",
    "passedRules": ["List of policy checks that passed cleanly"],
    "failedOrWarningRules": ["List of policy checks with warnings or failures"],
    "exceptionsDetected": ["List of policy deviations requiring underwriter exception sign-off"]
  },
  "kycDocumentAssessment": {
    "kycStatus": "Overall KYC compliance status",
    "verifiedDocumentsCount": number,
    "totalDocumentsCount": number,
    "observations": "Assessment of compliance documentation adequacy"
  },
  "redFlags": [
    {
      "issue": "Specific risk flag or discrepancy",
      "whyItMatters": "Credit or underwriting consequence",
      "supportingLmsData": "Specific verified fact from LMS context",
      "suggestedReviewAction": "Exact step the Underwriter should verify",
      "severity": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "missingInformation": [
    "List of missing verifications, documents, or data points"
  ],
  "suggestedConditions": [
    {
      "type": "PRE_DISBURSEMENT" | "POST_DISBURSEMENT" | "DOCUMENTATION",
      "condition": "Specific condition stipulation (e.g. 'Obtain 3-month salary credit bank statement')",
      "rationale": "Why this condition protects the lending institution"
    }
  ],
  "recommendedReviewPosition": "SUITABLE_FOR_SANCTION_CONSIDERATION" | "PROCEED_WITH_STIPULATED_CONDITIONS" | "ADDITIONAL_VERIFICATION_REQUIRED" | "HIGH_RISK_RECONSIDERATION",
  "recommendationRationale": "Clear rationale explaining the recommended review position",
  "approvalAuthorityNotice": "Notice regarding required sanction limits or committee approval"
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Analyze the following complete underwriting proposal and generate the structured Underwriting Intelligence JSON briefing:\n\n${contextPrompt}`,
    systemInstruction,
    temperature: 0.1, // High precision
  });

  // 5. Parse and validate JSON safely
  let parsed: any;
  try {
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleanJson);
  } catch (err: any) {
    throw new BadRequestError(`Failed to parse AI Underwriting Intelligence response: ${err.message}`);
  }

  const result: UnderwritingIntelligenceResult = {
    applicationId: app.id,
    applicationNo: app.applicationNo,
    generatedAt: new Date().toISOString(),
    model: geminiResult.model,
    executiveSummary: parsed.executiveSummary || 'Underwriting assessment completed.',
    creditSummary: parsed.creditSummary || 'Credit profile assessed based on LMS records.',
    financialAssessment: parsed.financialAssessment || {
      incomeVsObligations: 'N/A',
      netSurplusCashflow: 'N/A',
      dtiAssessment: 'N/A',
      tenureAndRateSuitability: 'N/A',
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

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'UNDERWRITING_INTELLIGENCE_GENERATED',
    entity: 'LoanApplication',
    entityId: app.id,
    newValue: {
      applicationNo: app.applicationNo,
      recommendedPosition: result.recommendedReviewPosition,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
