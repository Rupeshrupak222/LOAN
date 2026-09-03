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

  return { app, customer, product, contextPrompt };
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
  const { app, customer, product, contextPrompt } = await buildCreditApplicationContext(applicationId);

  // 3. System Prompt with strict JSON output instructions
  const systemInstruction = `
You are the Chief Credit Intelligence AI for Adyapan Loan Management System.
You assist human Credit Analysts and Underwriters with structured, evidence-based decision support.

=== STRICT OPERATIONAL PRINCIPLES ===
1. TRUTHFULNESS: Base all observations, numbers, dates, statuses, and calculations SOLELY on the verified LMS Context provided.
2. NO HALLUCINATIONS: Never invent or assume facts, salaries, scores, or document types not present in the data.
3. DECISION-SUPPORT ONLY: Do NOT approve or reject the loan. Do NOT make final credit sanctions. Provide clear, explainable decision support.
4. DISTINGUISH FACTS VS RECOMMENDATIONS: Separate what is verified from what requires human review.
5. NO RECALCULATION: Treat existing backend values (Income, Obligations, EMI, DTI, Risk Score, Eligibility Result) as authoritative.
6. MISSING INFORMATION: Only list items under missingInformation if they are genuinely absent or unverified in the LMS data.
7. STRICT JSON FORMAT: You MUST return ONLY a valid JSON object matching the schema below without any wrapping text or markdown ticks.

=== REQUIRED JSON SCHEMA ===
{
  "overallSummary": "A concise 2-3 sentence assessment of the applicant's overall credit profile and supportability.",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidenceReason": "Brief explanation of information completeness (e.g., 'All KYC, income, and risk pillars verified')",
  "positiveFactors": [
    "List of 2-5 verified strengths based strictly on actual data"
  ],
  "riskFactors": [
    {
      "issue": "Specific concern or vulnerability",
      "whyItMatters": "Why this affects repayment or credit risk",
      "severity": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "missingInformation": [
    "List of missing documents, unverified fields, or unexecuted engine checks (if any)"
  ],
  "policyObservations": [
    "List of 1-3 policy/eligibility observations based on engine output"
  ],
  "financialAnalysis": {
    "incomeVsObligations": "Explanation of monthly cashflow and declared income vs existing debt",
    "repaymentCapacity": "Explanation of affordability for the requested EMI",
    "dtiAssessment": "Interpretation of current vs proposed DTI percentage"
  },
  "riskPillarAnalysis": {
    "employmentStability": "Interpretation of employment vintage score and role",
    "debtServiceCapacity": "Interpretation of debt capacity pillar score",
    "kycCompleteness": "Interpretation of KYC/document completeness pillar score",
    "creditHistory": "Interpretation of past credit performance score"
  },
  "recommendedReviewActions": [
    "Actionable, numbered steps the Credit Analyst should take next (e.g. 'Verify bank statement credit entries', 'Confirm PAN authenticity')"
  ]
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Analyze the following loan application and generate the structured Credit Intelligence JSON assessment:\n\n${contextPrompt}`,
    systemInstruction,
    temperature: 0.1, // High precision
  });

  // 5. Parse and validate JSON safely
  let parsed: any;
  try {
    const rawText = geminiResult.text.trim();
    // Remove markdown code fences if present (e.g. ```json ... ```)
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err: any) {
    throw new BadRequestError(`Failed to parse AI Credit Intelligence response: ${err.message}`);
  }

  const result: CreditIntelligenceResult = {
    applicationId: app.id,
    applicationNo: app.applicationNo,
    generatedAt: new Date().toISOString(),
    model: geminiResult.model,
    overallSummary: parsed.overallSummary || 'Credit assessment completed based on available LMS records.',
    confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'MEDIUM',
    confidenceReason: parsed.confidenceReason || 'Based on available application records.',
    positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : [],
    riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
    policyObservations: Array.isArray(parsed.policyObservations) ? parsed.policyObservations : [],
    financialAnalysis: parsed.financialAnalysis || {
      incomeVsObligations: 'N/A',
      repaymentCapacity: 'N/A',
      dtiAssessment: 'N/A',
    },
    riskPillarAnalysis: parsed.riskPillarAnalysis || {
      employmentStability: 'N/A',
      debtServiceCapacity: 'N/A',
      kycCompleteness: 'N/A',
      creditHistory: 'N/A',
    },
    recommendedReviewActions: Array.isArray(parsed.recommendedReviewActions)
      ? parsed.recommendedReviewActions
      : ['Review loan proposal before forwarding to underwriting.'],
  };

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'CREDIT_INTELLIGENCE_GENERATED',
    entity: 'LoanApplication',
    entityId: app.id,
    newValue: {
      applicationNo: app.applicationNo,
      confidence: result.confidence,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
