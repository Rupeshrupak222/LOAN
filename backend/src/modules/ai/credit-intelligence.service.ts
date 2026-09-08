import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { calculateEmi } from '../finance/emi';

export interface CreditIntelligenceResult {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  overallSummary: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  positiveFactors: string[];
  riskFactors: {
    issue: string;
    whyItMatters: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  missingInformation: string[];
  policyObservations: string[];
  financialAnalysis: {
    incomeVsObligations: string;
    repaymentCapacity: string;
    dtiAssessment: string;
  };
  riskPillarAnalysis: {
    employmentStability: string;
    debtServiceCapacity: string;
    kycCompleteness: string;
    creditHistory: string;
  };
  recommendedReviewActions: string[];
}

/**
 * Builds the authorized, compact LMS credit application context for Gemini.
 */
async function buildCreditApplicationContext(applicationId: string) {
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

  // Calculate estimated EMI using authoritative backend formula
  const emiCalc = calculateEmi(requestedAmount, interestRate, tenureMonths);
  const estimatedEmi = Number(emiCalc.emi);
  const proposedDti = monthlyIncome > 0 ? (existingObligations + estimatedEmi) / monthlyIncome : 1;
  const currentDti = monthlyIncome > 0 ? existingObligations / monthlyIncome : 1;

  // Documents summary
  const docsList = customer.documents.map(
    (d) => `- ${d.category} (${d.documentType || 'DOCUMENT'}): ${d.fileName} [Status: ${d.status}, Verified: ${d.verified}]`
  );

  // Eligibility summary
  const eligibilityFactors = Array.isArray(eligibility?.factors)
    ? (eligibility?.factors as any[]).map((f) => `- ${f.factor}: ${f.status} (${f.detail})`)
    : ['- Automated Eligibility Engine has not been evaluated yet.'];

  // Risk Pillars summary
  const riskPillars = Array.isArray(riskAssessment?.factors)
    ? (riskAssessment?.factors as any[]).map(
        (rf) => `- Pillar: ${rf.name} (Weight: ${rf.weight}%, Score: ${rf.score}/100) -> ${rf.remarks}`
      )
    : ['- 4-Pillar Risk Engine has not been calculated yet.'];

  // Previous Loans & Delinquency summary
  const existingLoansSummary =
    customer.loans.length > 0
      ? customer.loans.map(
          (l) =>
            `- Loan #${l.loanNo}: Status ${l.status}, Principal: ₹${Number(l.principal).toLocaleString('en-IN')}, Outstanding: ₹${Number(l.outstandingPrincipal).toLocaleString('en-IN')}, Overdue Cases: ${l.collectionCases.length}`
        )
      : ['- No prior loans on record with the institution.'];

  // Employment details
  const emp = customer.employmentDetails[0];

  const contextPrompt = `
=== AUTHORIZED LMS APPLICATION DATA ===
Application Number: ${app.applicationNo}
Application Status: ${app.status}
Requested Principal: ₹${requestedAmount.toLocaleString('en-IN')}
Tenure: ${tenureMonths} Months
Loan Product: ${product.name} (${product.code || 'GENERAL'}, Interest Rate: ${interestRate}% p.a. ${product.interestMethod})
Authoritative Estimated Monthly EMI: ₹${estimatedEmi.toLocaleString('en-IN')}

=== APPLICANT PROFILE & FINANCIAL CAPACITY ===
Customer Code: ${customer.customerCode}
Full Name: ${customer.firstName} ${customer.lastName}
Date of Birth: ${customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'Not Provided'}
Gender: ${customer.gender || 'Not Provided'}
City: ${customer.city || 'N/A'}, State: ${customer.state || 'N/A'}
Employment Type: ${customer.employmentType || 'SALARIED'}
Employer Name: ${emp?.employerName || customer.employerName || 'Not specified'}
Designation: ${emp?.designation || 'Not specified'}
Work Experience: ${emp?.workExperienceYears ? `${emp.workExperienceYears} years` : 'Not verified'}
Declared Monthly Net Income: ₹${monthlyIncome.toLocaleString('en-IN')}
Declared Existing Monthly Debt Obligations: ₹${existingObligations.toLocaleString('en-IN')}
Existing Debt-to-Income (DTI) Ratio: ${(currentDti * 100).toFixed(1)}%
Proposed Total DTI Ratio (including new EMI): ${(proposedDti * 100).toFixed(1)}%
KYC Compliance Status: ${customer.kycStatus}
Risk Category: ${customer.riskCategory || 'PENDING'}
Bank Accounts on file: ${customer.bankAccounts.length} (${customer.bankAccounts.filter((b) => b.isVerified).length} Verified)

=== UPLOADED COMPLIANCE DOCUMENTS (${customer.documents.length} Total) ===
${docsList.length > 0 ? docsList.join('\n') : '- No compliance documents uploaded yet.'}

=== RULE-BASED ELIGIBILITY ENGINE OUTPUT ===
Eligibility Status: ${eligibility?.result || 'NOT ASSESSED'}
Policy Factor Checks:
${eligibilityFactors.join('\n')}

=== 4-PILLAR RISK SCORING MODEL OUTPUT ===
Overall Risk Score: ${riskAssessment?.score ?? 'N/A'}/100
Assigned Risk Tier: ${riskAssessment?.category || 'PENDING'}
Pillars Breakdown:
${riskPillars.join('\n')}

=== INSTITUTIONAL BORROWER CREDIT HISTORY (${customer.loans.length} Loans) ===
${existingLoansSummary.join('\n')}

=== CURRENT UNDERWRITING STATE ===
Underwriting Decision: ${underwriting?.decision || 'PENDING_REVIEW'}
Decision Remarks: ${underwriting?.reason || 'None'}
`;

  return {
    app,
    customer,
    product,
    requestedAmount,
    tenureMonths,
    interestRate,
    monthlyIncome,
    existingObligations,
    estimatedEmi,
    proposedDti,
    currentDti,
    contextPrompt,
  };
}

/**
 * Executes AI Credit Intelligence assessment using Google Gemini.
 */
export async function generateCreditIntelligence(
  applicationId: string,
  actor: { id: string; email: string; roles: string[] }
): Promise<CreditIntelligenceResult> {
  // 1. Enforce RBAC - only staff can generate/view credit intelligence
  const isStaff = actor.roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR'].includes(r)
  );
  if (!isStaff) {
    throw new ForbiddenError('Access forbidden: Only authorized credit analysts and underwriters can run Credit Intelligence');
  }

  // 2. Build verified LMS context
  const {
    app,
    customer,
    product,
    requestedAmount,
    monthlyIncome,
    existingObligations,
    estimatedEmi,
    proposedDti,
    currentDti,
    contextPrompt,
  } = await buildCreditApplicationContext(applicationId);

  // 3. System Prompt with concise, high-signal JSON output instructions
  const systemInstruction = `
You are the Chief Credit Intelligence AI for Adyapan Loan Management System.
You assist human Credit Analysts and Underwriters with concise, evidence-based decision support.

RULES:
1. TRUTHFULNESS: Base all observations strictly on provided LMS context. Never invent facts.
2. ADVISORY ONLY: Decision-support only. Do NOT make final credit sanctions.
3. CONCISENESS: Keep each assessment field to 1-2 concise, impactful sentences.
4. STRICT JSON: Return ONLY a valid JSON object matching the schema below.

SCHEMA:
{
  "overallSummary": "Concise 2-sentence assessment of applicant credit profile and viability.",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidenceReason": "Brief explanation of data completeness.",
  "positiveFactors": ["2-4 verified strengths from actual LMS data"],
  "riskFactors": [{"issue": "Concern", "whyItMatters": "Impact", "severity": "HIGH" | "MEDIUM" | "LOW"}],
  "missingInformation": ["Missing verifications or documents (if any)"],
  "policyObservations": ["1-2 eligibility policy observations"],
  "financialAnalysis": {
    "incomeVsObligations": "Brief evaluation of declared income vs liabilities",
    "repaymentCapacity": "Brief evaluation of proposed EMI affordability",
    "dtiAssessment": "Interpretation of current vs proposed DTI ratio"
  },
  "riskPillarAnalysis": {
    "employmentStability": "Interpretation of employment stability score",
    "debtServiceCapacity": "Interpretation of debt capacity score",
    "kycCompleteness": "Interpretation of KYC completeness score",
    "creditHistory": "Interpretation of borrower credit track record"
  },
  "recommendedReviewActions": ["2-3 specific action items for the credit analyst"]
}
`;

  let result: CreditIntelligenceResult;

  try {
    // 4. Generate content via Central Gemini Service
    const geminiResult = await generateGeminiContent({
      prompt: `Analyze the following loan application and generate the structured Credit Intelligence JSON assessment:\n\n${contextPrompt}`,
      systemInstruction,
      temperature: 0.1, // High precision
    });

    // 5. Parse and validate JSON safely
    const rawText = geminiResult.text.trim();
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    result = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      generatedAt: new Date().toISOString(),
      model: geminiResult.model,
      overallSummary: parsed.overallSummary || 'Credit assessment completed based on available LMS records.',
      confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
      confidenceReason: parsed.confidenceReason || 'Based on verified LMS application records.',
      positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : ['Valid KYC profile recorded.'],
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      policyObservations: Array.isArray(parsed.policyObservations) ? parsed.policyObservations : [],
      financialAnalysis: parsed.financialAnalysis || {
        incomeVsObligations: `Monthly net income is ₹${Number(customer.monthlyIncome || 0).toLocaleString('en-IN')} against ₹${Number(customer.existingObligations || 0).toLocaleString('en-IN')} declared debt.`,
        repaymentCapacity: `Proposed EMI of ₹${estimatedEmi.toLocaleString('en-IN')} results in total debt service of ₹${(Number(customer.existingObligations || 0) + estimatedEmi).toLocaleString('en-IN')}.`,
        dtiAssessment: `Proposed DTI is ${(proposedDti * 100).toFixed(1)}% compared to current ${(currentDti * 100).toFixed(1)}%.`,
      },
      riskPillarAnalysis: parsed.riskPillarAnalysis || {
        employmentStability: `${customer.employmentType || 'Salaried'} profile with ${customer.employmentDetails?.[0]?.workExperienceYears || 0} years vintage.`,
        debtServiceCapacity: `Debt servicing capacity evaluated at ${(proposedDti * 100).toFixed(1)}% proposed FOIR.`,
        kycCompleteness: `KYC status is ${customer.kycStatus} with ${customer.documents.filter((d) => d.verified).length} verified documents.`,
        creditHistory: `Borrower has ${customer.loans.length} prior loan accounts with the institution.`,
      },
      recommendedReviewActions: Array.isArray(parsed.recommendedReviewActions)
        ? parsed.recommendedReviewActions
        : ['Verify income document credits against bank statements.'],
    };
  } catch {
    // Deterministic Rule-Based Fallback if Gemini times out or is temporarily unavailable
    const positiveFactors: string[] = [];
    if (customer.kycStatus === 'VERIFIED') positiveFactors.push('KYC status is fully verified.');
    if (proposedDti <= 0.5) positiveFactors.push(`Healthy proposed DTI ratio of ${(proposedDti * 100).toFixed(1)}%.`);
    if (customer.bankAccounts.some((b) => b.isVerified)) positiveFactors.push('Bank account verified via penny-drop.');
    if (positiveFactors.length === 0) positiveFactors.push('Application submitted with complete demographic details.');

    const riskFactors: { issue: string; whyItMatters: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }[] = [];
    if (proposedDti > 0.55) {
      riskFactors.push({
        issue: `Elevated proposed DTI of ${(proposedDti * 100).toFixed(1)}%`,
        whyItMatters: 'Higher proportion of disposable income committed to debt servicing.',
        severity: proposedDti > 0.65 ? 'HIGH' : 'MEDIUM',
      });
    }
    if (customer.kycStatus !== 'VERIFIED') {
      riskFactors.push({
        issue: `KYC status is ${customer.kycStatus}`,
        whyItMatters: 'Requires complete identity verification before sanction consideration.',
        severity: 'HIGH',
      });
    }

    result = {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      generatedAt: new Date().toISOString(),
      model: 'deterministic-rules-engine',
      overallSummary: `Application #${app.applicationNo} evaluated for ${customer.firstName} ${customer.lastName}. Requested amount is ₹${requestedAmount.toLocaleString('en-IN')} with estimated EMI of ₹${estimatedEmi.toLocaleString('en-IN')}. Proposed DTI is ${(proposedDti * 100).toFixed(1)}%. (Deterministic LMS synthesis).`,
      confidence: customer.kycStatus === 'VERIFIED' ? 'HIGH' : 'MEDIUM',
      confidenceReason: 'Synthesized directly from authoritative LMS borrower and eligibility records.',
      positiveFactors,
      riskFactors,
      missingInformation: customer.documents.filter((d) => !d.verified).map((d) => `Unverified document: ${d.fileName}`),
      policyObservations: [
        `Eligibility Engine Result: ${app.eligibility?.result || 'PENDING'}`,
        `Assessed 4-Pillar Risk Tier: ${app.riskAssessment?.category || 'PENDING'} (Score: ${app.riskAssessment?.score ?? 'N/A'}/100)`,
      ],
      financialAnalysis: {
        incomeVsObligations: `Monthly net income is ₹${monthlyIncome.toLocaleString('en-IN')} against ₹${existingObligations.toLocaleString('en-IN')} declared debt.`,
        repaymentCapacity: `Proposed EMI of ₹${estimatedEmi.toLocaleString('en-IN')} leaves estimated net monthly surplus of ₹${Math.max(0, monthlyIncome - existingObligations - estimatedEmi).toLocaleString('en-IN')}.`,
        dtiAssessment: `Proposed DTI is ${(proposedDti * 100).toFixed(1)}% (Institutional threshold standard is 50%).`,
      },
      riskPillarAnalysis: {
        employmentStability: `${customer.employmentType || 'Salaried'} profile with ${customer.employmentDetails?.[0]?.workExperienceYears ? `${customer.employmentDetails[0].workExperienceYears} years vintage` : 'pending verification'}.`,
        debtServiceCapacity: `Debt servicing capacity evaluated at ${(proposedDti * 100).toFixed(1)}% proposed FOIR.`,
        kycCompleteness: `KYC status is ${customer.kycStatus} with ${customer.documents.filter((d) => d.verified).length} of ${customer.documents.length} documents verified.`,
        creditHistory: `Borrower has ${customer.loans.length} prior loan account(s) on record.`,
      },
      recommendedReviewActions: [
        'Verify bank statement salary credit entries against declared net income.',
        'Review 4-pillar risk breakdown before final sanction review.',
      ],
    };
  }

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    role: actor.roles[0] || 'CREDIT_ANALYST',
    action: 'CREDIT_INTELLIGENCE_GENERATED',
    entity: 'LoanApplication',
    entityId: app.id,
    newValue: {
      applicationNo: app.applicationNo,
      confidence: result.confidence,
      model: result.model,
      generatedBy: actor.email,
    },
  }).catch(() => {});

  return result;
}
