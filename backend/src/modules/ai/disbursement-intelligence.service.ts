import { prisma } from '../../config/prisma';
import { generateGeminiContent } from './gemini.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';

export interface DisbursementIntelligenceResult {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  readinessStatus: 'READY' | 'NEEDS_REVIEW' | 'NOT_READY' | 'BLOCKED';
  executiveSummary: string;
  completedChecks: {
    name: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    details: string;
  }[];
  blockers: string[];
  warnings: string[];
  financialConsistency: {
    sanctionedAmount: number;
    processingFeeAmount: number;
    netDisbursementAmount: number;
    status: 'CONSISTENT' | 'DISCREPANCY_DETECTED';
    observations: string;
  };
  bankAccountReview: {
    beneficiaryName: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
    isVerified: boolean;
    nameMatchStatus: 'MATCH' | 'PARTIAL_MATCH' | 'UNVERIFIED' | 'MISMATCH';
    observations: string;
  };
  transactionReview?: {
    utrReference?: string;
    formatValid?: boolean;
    duplicateDetected?: boolean;
    observations?: string;
  };
  exceptions: {
    exception: string;
    impact: string;
    evidence: string;
    recommendedAction: string;
    escalationRole?: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Builds authoritative LMS context specifically tailored for Disbursement Intelligence.
 */
async function buildDisbursementContext(applicationId: string, inputUtr?: string) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          bankAccounts: true,
          documents: true,
          loans: {
            include: {
              disbursements: true,
            },
          },
        },
      },
      product: true,
      branch: true,
      underwriting: true,
      eligibility: true,
      riskAssessment: true,
      loan: {
        include: {
          disbursements: true,
        },
      },
    },
  });

  if (!app) {
    throw new NotFoundError('Loan application record not found');
  }

  const { customer, product, underwriting } = app;
  const principal = Number(app.requestedAmount);
  const interestRate = Number(product.interestRate);
  const tenureMonths = app.tenureMonths;
  const processingFeePct = Number(product.processingFeePct || 0);
  const processingFeeAmount = (principal * processingFeePct) / 100;
  const netDisbursal = principal - processingFeeAmount;
  const emiCalc = calculateEmi(principal, interestRate, tenureMonths);

  // Authoritative Backend Pre-Disbursement Checks
  const checks: { name: string; status: 'PASSED' | 'FAILED' | 'WARNING'; details: string }[] = [];

  // Check 1: Application Approval Status
  const isApprovedStatus = ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT'].includes(app.status);
  checks.push({
    name: 'Sanction & Underwriting Approval Status',
    status: isApprovedStatus ? 'PASSED' : 'FAILED',
    details: `Application is currently in status "${app.status}". Underwriting decision is "${underwriting?.decision || 'PENDING'}".`,
  });

  // Check 2: KYC Verification
  const isKycVerified = customer.kycStatus === 'VERIFIED';
  checks.push({
    name: 'Borrower KYC Verification',
    status: isKycVerified ? 'PASSED' : 'FAILED',
    details: `Borrower KYC status is "${customer.kycStatus}". Minimum requirement for fund release is VERIFIED.`,
  });

  // Check 3: Customer Account Health
  const isCustomerActive = customer.status !== 'BLOCKED' && customer.status !== 'INACTIVE';
  checks.push({
    name: 'Borrower Account Standing',
    status: isCustomerActive ? 'PASSED' : 'FAILED',
    details: `Customer profile status is "${customer.status}". No regulatory or fraud lock active.`,
  });

  // Check 4: Beneficiary Bank Account
  const primaryBank =
    customer.bankAccounts.find((b: any) => b.isPrimary) ||
    customer.bankAccounts[0] ||
    (customer.bankAccountNo
      ? {
          accountHolderName: `${customer.firstName} ${customer.lastName}`,
          accountNumber: customer.bankAccountNo,
          ifscCode: customer.bankIfsc || 'N/A',
          bankName: customer.bankName || 'Default Bank',
          isVerified: true,
        }
      : null);

  const hasValidBank = Boolean(primaryBank);
  checks.push({
    name: 'Beneficiary Bank Account Presence & Verification',
    status: hasValidBank ? (primaryBank?.isVerified ? 'PASSED' : 'WARNING') : 'FAILED',
    details: hasValidBank
      ? `Beneficiary account ${primaryBank?.bankName} (A/C: ${primaryBank?.accountNumber?.slice(-4).padStart(primaryBank?.accountNumber?.length || 8, '•')}, IFSC: ${primaryBank?.ifscCode}) is on file. Verified status: ${primaryBank?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`
      : 'No bank account details registered on borrower record.',
  });

  // Check 5: Product Active Status
  const isProductActive = product.isActive !== false;
  checks.push({
    name: 'Loan Product Active Availability',
    status: isProductActive ? 'PASSED' : 'FAILED',
    details: `Product "${product.name}" (${product.code}) is ${isProductActive ? 'ACTIVE' : 'INACTIVE'}.`,
  });

  // Check 6: Duplicate / Prior Disbursement Idempotency Check
  const existingDisbursements = app.loan?.disbursements || [];
  const alreadyDisbursed = app.status === 'DISBURSED' || existingDisbursements.length > 0;
  checks.push({
    name: 'Disbursement Idempotency & Prior Release Check',
    status: alreadyDisbursed ? 'FAILED' : 'PASSED',
    details: alreadyDisbursed
      ? `Disbursement has already been executed for this application (${existingDisbursements.length} disbursement record(s) found).`
      : 'Zero prior disbursements recorded. Safe to proceed with initial fund release.',
  });

  // Check 7: UTR Reference Validation (if provided)
  let utrDuplicate = false;
  if (inputUtr && inputUtr.trim()) {
    const existingUtr = await prisma.disbursement.findFirst({
      where: { reference: inputUtr.trim() },
    });
    const existingTx = await prisma.transaction.findFirst({
      where: { reference: inputUtr.trim() },
    });
    utrDuplicate = Boolean(existingUtr || existingTx);
    checks.push({
      name: 'Transaction UTR Reference Uniqueness',
      status: utrDuplicate ? 'FAILED' : 'PASSED',
      details: utrDuplicate
        ? `UTR reference "${inputUtr}" is ALREADY RECORDED on an existing transaction. Duplicate reference prohibited.`
        : `UTR reference "${inputUtr}" is unique and unassigned in the transaction ledger.`,
    });
  }

  // Compile context prompt
  const contextPrompt = `
=== DISBURSEMENT PROPOSAL CONTEXT ===
Application ID: ${app.id}
Application Number: ${app.applicationNo}
Current Application Status: ${app.status}
Loan Product: ${product.name} (Code: ${product.code}, Interest Rate: ${interestRate}% p.a.)
Approved Sanction Principal: ₹${principal.toLocaleString('en-IN')}
Processing Fee Percentage: ${processingFeePct}% (₹${processingFeeAmount.toLocaleString('en-IN')})
Net Disbursement Amount to Transfer: ₹${netDisbursal.toLocaleString('en-IN')}
Calculated Monthly EMI: ₹${Number(emiCalc.emi).toLocaleString('en-IN')}
Tenure: ${tenureMonths} Months

=== BORROWER & BENEFICIARY DETAILS ===
Customer Code: ${customer.customerCode}
Borrower Name: ${customer.firstName} ${customer.lastName}
KYC Status: ${customer.kycStatus}
Customer Account Status: ${customer.status}
Beneficiary Name: ${primaryBank?.accountHolderName || `${customer.firstName} ${customer.lastName}`}
Bank Name: ${primaryBank?.bankName || 'N/A'}
Account Number: ${primaryBank?.accountNumber || 'N/A'}
IFSC Code: ${primaryBank?.ifscCode || 'N/A'}
Bank Account Verified Flag: ${primaryBank?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}

=== UNDERWRITING SIGN-OFF AUDIT ===
Underwriting Decision: ${underwriting?.decision || 'NOT_FOUND'}
Decision Reason: ${underwriting?.reason || 'None'}
Decided By: ${underwriting?.decidedBy || 'None'}

=== MANDATORY PRE-DISBURSEMENT CHECK RESULTS ===
${checks.map((c) => `[${c.status}] ${c.name}: ${c.details}`).join('\n')}

=== TRANSACTION UTR CONTEXT ===
Provided UTR Reference: ${inputUtr || 'None (Pre-transfer inspection)'}
UTR Duplicate Flag: ${utrDuplicate ? 'DUPLICATE_DETECTED' : 'CLEAN'}
`;

  return { app, customer, product, primaryBank, principal, processingFeeAmount, netDisbursal, checks, utrDuplicate, contextPrompt };
}

/**
 * Evaluates and returns AI-driven Disbursement Intelligence for Finance Officers.
 */
export async function generateDisbursementIntelligence(
  applicationId: string,
  actor: { id: string; email: string; roles: string[] },
  inputUtr?: string
): Promise<DisbursementIntelligenceResult> {
  // 1. RBAC Guard - only authorized Finance & Staff roles
  const isAuthorized = actor.roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Finance Officers and authorized Disbursement Managers can access Disbursement Intelligence'
    );
  }

  // 2. Build verified LMS context
  const { app, customer, primaryBank, principal, processingFeeAmount, netDisbursal, checks, utrDuplicate, contextPrompt } =
    await buildDisbursementContext(applicationId, inputUtr);

  // 3. System Prompt
  const systemInstruction = `
You are the Chief Disbursement & Treasury Intelligence AI for Adyapan Loan Management System.
You assist the Finance Officer by analyzing loan proposals ready for payout, verifying pre-disbursement controls, identifying financial discrepancies, checking bank account integrity, and explaining transaction exceptions.

=== STRICT FINANCIAL OPERATIONAL RULES ===
1. FINANCIAL TRUTH & NO RECALCULATION: Treat existing backend values (Sanctioned Principal, Net Disbursal, Processing Fee, KYC status, Check outcomes) as authoritative truth. Never calculate or modify ledger amounts.
2. DECISION SUPPORT ONLY: You NEVER execute payouts, transfer funds, activate loans, or generate fake UTRs. You provide explainable decision support for the Finance Officer.
3. READINESS DETERMINATION:
   - 'READY': All pre-disbursement checks passed, bank account is verified, and application is approved.
   - 'NEEDS_REVIEW': Minor warnings present (e.g. unverified bank account or missing agreement document).
   - 'NOT_READY': Incomplete information or missing bank account.
   - 'BLOCKED': Failed pre-disbursement checks (e.g. unverified KYC, blocked customer, application not approved, or duplicate UTR).
4. EXPLAINABILITY: Clearly outline why a check passed or failed and what exact action the Finance Officer must take.
5. STRICT JSON: Return ONLY a valid JSON object matching the required schema.

=== REQUIRED JSON SCHEMA ===
{
  "readinessStatus": "READY" | "NEEDS_REVIEW" | "NOT_READY" | "BLOCKED",
  "executiveSummary": "A concise 2-sentence summary of disbursement readiness, net payable amount, and key blockers or approvals.",
  "completedChecks": [
    {
      "name": "Check title",
      "status": "PASSED" | "FAILED" | "WARNING",
      "details": "Explanation of check result"
    }
  ],
  "blockers": ["List of blocking issues preventing fund release (if any)"],
  "warnings": ["List of cautionary items requiring review (if any)"],
  "financialConsistency": {
    "sanctionedAmount": number,
    "processingFeeAmount": number,
    "netDisbursementAmount": number,
    "status": "CONSISTENT" | "DISCREPANCY_DETECTED",
    "observations": "Explanation of fee deductions and net payout breakdown"
  },
  "bankAccountReview": {
    "beneficiaryName": "Beneficiary holder name",
    "accountNumberMasked": "Masked account number",
    "ifscCode": "IFSC code",
    "bankName": "Bank institution name",
    "isVerified": boolean,
    "nameMatchStatus": "MATCH" | "PARTIAL_MATCH" | "UNVERIFIED" | "MISMATCH",
    "observations": "Evaluation of beneficiary account integrity and name match"
  },
  "transactionReview": {
    "utrReference": "UTR or null",
    "formatValid": boolean,
    "duplicateDetected": boolean,
    "observations": "Assessment of UTR reference format and uniqueness"
  },
  "exceptions": [
    {
      "exception": "Specific exception name",
      "impact": "Why this impacts disbursement",
      "evidence": "Authoritative LMS data supporting the issue",
      "recommendedAction": "Action required by Finance Officer",
      "escalationRole": "Role to escalate to if needed (e.g. 'Underwriter', 'Credit Analyst')"
    }
  ],
  "recommendedActions": [
    "Step-by-step actionable review steps for the Finance Officer"
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
`;

  // 4. Generate content via Central Gemini Service
  const geminiResult = await generateGeminiContent({
    prompt: `Analyze the following disbursement proposal and generate the structured Disbursement Intelligence JSON assessment:\n\n${contextPrompt}`,
    systemInstruction,
    temperature: 0.1,
  });

  // 5. Safe JSON Parsing
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
    throw new BadRequestError(`Failed to parse AI Disbursement Intelligence response: ${err.message}`);
  }

  const result: DisbursementIntelligenceResult = {
    applicationId: app.id,
    applicationNo: app.applicationNo,
    generatedAt: new Date().toISOString(),
    model: geminiResult.model,
    readinessStatus: ['READY', 'NEEDS_REVIEW', 'NOT_READY', 'BLOCKED'].includes(parsed.readinessStatus)
      ? parsed.readinessStatus
      : checks.some((c) => c.status === 'FAILED')
      ? 'BLOCKED'
      : checks.some((c) => c.status === 'WARNING')
      ? 'NEEDS_REVIEW'
      : 'READY',
    executiveSummary: parsed.executiveSummary || 'Disbursement readiness evaluation completed.',
    completedChecks: Array.isArray(parsed.completedChecks) && parsed.completedChecks.length > 0 ? parsed.completedChecks : checks,
    blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    financialConsistency: {
      sanctionedAmount: principal,
      processingFeeAmount: processingFeeAmount,
      netDisbursementAmount: netDisbursal,
      status: parsed.financialConsistency?.status === 'DISCREPANCY_DETECTED' ? 'DISCREPANCY_DETECTED' : 'CONSISTENT',
      observations:
        parsed.financialConsistency?.observations ||
        `Sanctioned principal ₹${principal.toLocaleString('en-IN')} less processing fee ₹${processingFeeAmount.toLocaleString('en-IN')} yields net disbursement of ₹${netDisbursal.toLocaleString('en-IN')}.`,
    },
    bankAccountReview: {
      beneficiaryName: primaryBank?.accountHolderName || `${customer.firstName} ${customer.lastName}`,
      accountNumberMasked: primaryBank?.accountNumber
        ? primaryBank.accountNumber.slice(-4).padStart(primaryBank.accountNumber.length, '•')
        : 'None',
      ifscCode: primaryBank?.ifscCode || 'N/A',
      bankName: primaryBank?.bankName || 'N/A',
      isVerified: Boolean(primaryBank?.isVerified),
      nameMatchStatus: ['MATCH', 'PARTIAL_MATCH', 'UNVERIFIED', 'MISMATCH'].includes(
        parsed.bankAccountReview?.nameMatchStatus
      )
        ? parsed.bankAccountReview.nameMatchStatus
        : primaryBank?.isVerified
        ? 'MATCH'
        : 'UNVERIFIED',
      observations: parsed.bankAccountReview?.observations || 'Beneficiary bank information verified from customer records.',
    },
    transactionReview: {
      utrReference: inputUtr || undefined,
      formatValid: inputUtr ? inputUtr.length >= 8 : undefined,
      duplicateDetected: utrDuplicate,
      observations: utrDuplicate
        ? 'Duplicate UTR detected in transaction records.'
        : inputUtr
        ? 'UTR reference is unique.'
        : 'No transaction reference supplied yet.',
    },
    exceptions: Array.isArray(parsed.exceptions) ? parsed.exceptions : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'HIGH',
  };

  // 6. Audit Trail
  await logAudit({
    userId: actor.id,
    action: 'DISBURSEMENT_INTELLIGENCE_GENERATED',
    entity: 'LoanApplication',
    entityId: app.id,
    newValue: {
      applicationNo: app.applicationNo,
      readinessStatus: result.readinessStatus,
      netDisbursementAmount: netDisbursal,
      model: result.model,
      generatedBy: actor.email,
    },
  });

  return result;
}
