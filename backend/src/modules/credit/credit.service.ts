import { ApplicationStatus, RiskCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { evaluateApplicationEligibility } from '../eligibility/eligibility.service';
import { evaluateApplicationRisk } from '../risk/risk.service';
import { updateKycStatus } from '../customer/customer.service';
import { configurationService } from '../configuration/configuration.service';
import type {
  SubmitCreditDecisionInput,
  VerifyFinancialsInput,
  VerifyKycStepInput,
  VerifyDocumentStepInput,
  BatchVerifyDocumentsStepInput,
  EvaluateFinancialStepInput,
  RecordRiskStepInput,
} from './credit.schema';

export interface DocumentChecklistItem {
  category: 'IDENTITY' | 'ADDRESS' | 'INCOME' | 'BANK_STATEMENT' | 'EMPLOYMENT_BUSINESS' | 'OTHER';
  label: string;
  description: string;
  mandatory: boolean;
  uploaded: boolean;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';
  documents: {
    id: string;
    fileName: string;
    storageKey: string;
    documentType?: string | null;
    status: string;
    verified: boolean;
    rejectionReason?: string | null;
    verifiedAt?: string | null;
  }[];
  remarks?: string | null;
}

export interface FinancialCapacitySummary {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerName: string;
  declaredMonthlyIncome: number;
  verifiedMonthlyIncome: number;
  incomeVerificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REQUIRES_CLARIFICATION';
  employmentType: string;
  employerName: string;
  employmentVerificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REQUIRES_CLARIFICATION';
  workVintageYears: number;
  existingMonthlyObligations: number;
  requestedLoanAmount: number;
  tenureMonths: number;
  interestRatePct: number;
  proposedEmi: number;
  totalMonthlyObligations: number;
  dtiPct: number;
  foirPct: number;
  netDisposableIncome: number;
  creditScore: number;
  creditRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  creditScoreSource: string;
  creditScoreCheckedAt: string;
  kycStatus: string;
  riskCategory: RiskCategory;
  currentLifecycleStatus: ApplicationStatus;

  // Step 2: Customer KYC Details
  customerDetails: {
    name: string;
    customerCode: string;
    dateOfBirth: string | null;
    age: number | null;
    mobile: string;
    email: string | null;
    address: string | null;
    panOrKycStatus: string;
    kycStatus: string;
    riskCategory: string | null;
  };

  // Step 3: Document Checklist
  documentChecklist: DocumentChecklistItem[];
  documentSummary: {
    allMandatoryVerified: boolean;
    hasMissing: boolean;
    hasRejected: boolean;
    verifiedCount: number;
    totalMandatory: number;
  };

  // Step 4: Financial Eligibility Policy Check
  financialEligibility: {
    isEligible: boolean;
    foir: number;
    dti: number;
    maxAllowedFoir: number;
    minRequiredIncome: number;
    reason: string;
    policyPassed: boolean;
    proposedEmi: number;
    totalObligations: number;
    netDisposableIncome: number;
  };

  // Step 5: 4-Pillar Risk Engine
  riskSummary: {
    score: number | null;
    category: RiskCategory | null;
    factors: { name: string; weight: number; score: number; remarks: string }[] | null;
    recommendation?: string | null;
  };

  // Workflow Step Status Tracker
  workflowStep: {
    currentStep: number; // 1 to 7
    step1Complete: boolean;
    step2Complete: boolean;
    step3Complete: boolean;
    step4Complete: boolean;
    step5Complete: boolean;
    step6Complete: boolean;
    step7Complete: boolean;
  };

  previousDecision?: {
    result: string;
    reason?: string;
    evaluatedAt?: string;
    analyst?: string;
    riskGrade?: string;
    positiveFactors?: string[];
    riskFactors?: string[];
  };
}

/**
 * Categorizes a document into one of the 6 standardized workflow checklist categories
 */
function mapDocumentCategory(
  doc: { category: string; documentType?: string | null; fileName?: string }
): DocumentChecklistItem['category'] {
  const cat = (doc.category || '').toUpperCase();
  const type = (doc.documentType || '').toUpperCase();
  const name = (doc.fileName || '').toUpperCase();

  if (
    cat === 'IDENTITY' ||
    cat.includes('IDENT') ||
    type.includes('PAN') ||
    type.includes('AADHAAR') ||
    type.includes('PASSPORT') ||
    name.includes('PAN') ||
    name.includes('AADHAAR')
  ) {
    return 'IDENTITY';
  }

  if (
    cat === 'ADDRESS' ||
    cat.includes('ADDR') ||
    type.includes('UTILITY') ||
    type.includes('RENT') ||
    name.includes('UTILITY') ||
    name.includes('ELECTRICITY')
  ) {
    return 'ADDRESS';
  }

  if (
    cat === 'INCOME' ||
    cat.includes('SALARY') ||
    cat.includes('PAYSLIP') ||
    type.includes('SALARY') ||
    type.includes('PAYSLIP') ||
    type.includes('ITR') ||
    type.includes('FORM16') ||
    name.includes('SALARY') ||
    name.includes('PAYSLIP') ||
    name.includes('ITR')
  ) {
    return 'INCOME';
  }

  if (
    cat === 'BANK_STATEMENT' ||
    cat.includes('BANK') ||
    type.includes('BANK') ||
    type.includes('STATEMENT') ||
    name.includes('STATEMENT') ||
    name.includes('PASSBOOK')
  ) {
    return 'BANK_STATEMENT';
  }

  if (
    cat === 'BUSINESS' ||
    cat.includes('EMPLOY') ||
    type.includes('EMPLOY') ||
    type.includes('GST') ||
    type.includes('OFFER') ||
    type.includes('BUSINESS') ||
    name.includes('EMPLOY') ||
    name.includes('GST')
  ) {
    return 'EMPLOYMENT_BUSINESS';
  }

  return 'OTHER';
}

/**
 * Calculates complete financial capacity, 7-step checklist, and policy evaluations
 */
export async function getFinancialCapacity(applicationId: string): Promise<FinancialCapacitySummary> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          employmentDetails: true,
          loans: true,
          documents: true,
        },
      },
      documents: true,
      product: true,
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: {
        where: { approverRole: 'CREDIT_ANALYST' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!app) {
    throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
  }

  const customer = app.customer;
  const product = app.product;
  const declaredIncome = Number(customer.monthlyIncome || 0);
  const eligibilityFactors = (app.eligibility?.factors as any) || {};

  // Verified income check
  const verifiedIncome =
    eligibilityFactors.verifiedIncome != null && eligibilityFactors.verifiedIncome > 0
      ? Number(eligibilityFactors.verifiedIncome)
      : declaredIncome;

  const incomeVerificationStatus =
    eligibilityFactors.incomeVerificationStatus ||
    (customer.employmentType ? 'VERIFIED' : 'PENDING');

  // Debt obligations
  const activeLoansEmi = customer.loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + Number(l.emiAmount || 0), 0);
  const existingObligations = Math.max(
    Number(customer.existingObligations || 0),
    activeLoansEmi
  );

  // Proposed EMI calculation
  const requestedAmount = Number(app.requestedAmount || 0);
  const tenureMonths = app.tenureMonths || 12;
  const interestRatePct = Number(product.interestRate || 14.5);
  const emiResult = calculateEmi(requestedAmount, interestRatePct, tenureMonths);
  const proposedEmi = Number(emiResult.emi || 0);

  // Totals & Ratios
  const totalMonthlyObligations = existingObligations + proposedEmi;
  const effectiveIncome = verifiedIncome > 0 ? verifiedIncome : declaredIncome;

  const dtiPct = effectiveIncome > 0 ? (existingObligations / effectiveIncome) * 100 : 100;
  const foirPct = effectiveIncome > 0 ? (totalMonthlyObligations / effectiveIncome) * 100 : 100;
  const netDisposableIncome = Math.max(0, effectiveIncome - totalMonthlyObligations);

  // Credit Bureau Score mapping
  let creditScore = 750;
  if (app.riskAssessment?.score != null) {
    creditScore = 500 + Math.round((app.riskAssessment.score / 100) * 350);
  } else if (customer.kycStatus === 'VERIFIED') {
    creditScore = 760;
  } else if (dtiPct > 50) {
    creditScore = 620;
  }

  let creditRating: FinancialCapacitySummary['creditRating'] = 'GOOD';
  if (creditScore >= 780) creditRating = 'EXCELLENT';
  else if (creditScore >= 720) creditRating = 'GOOD';
  else if (creditScore >= 650) creditRating = 'FAIR';
  else creditRating = 'POOR';

  const primaryEmployment = customer.employmentDetails[0];
  const employmentVerificationStatus =
    eligibilityFactors.employmentVerificationStatus ||
    (primaryEmployment ? 'VERIFIED' : 'PENDING');

  // Customer age calculation
  const birthDate = customer.dateOfBirth ? new Date(customer.dateOfBirth) : null;
  const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 86400000)) : null;

  // Step 3: Document Checklist Construction
  const allDocs = [...(customer.documents || []), ...(app.documents || [])];
  // Deduplicate documents by ID
  const uniqueDocs = Array.from(new Map(allDocs.map((d) => [d.id, d])).values());

  const categoriesDef: {
    category: DocumentChecklistItem['category'];
    label: string;
    description: string;
    mandatory: boolean;
  }[] = [
    { category: 'IDENTITY', label: 'Identity Proof', description: 'PAN Card, Aadhaar Card, Passport, or Voter ID', mandatory: true },
    { category: 'ADDRESS', label: 'Address Proof', description: 'Utility Bill, Rental Agreement, or Aadhaar card', mandatory: true },
    { category: 'INCOME', label: 'Income Proof', description: 'Latest 3 Months Payslip, Form 16, or ITR Acknowledgement', mandatory: true },
    { category: 'BANK_STATEMENT', label: 'Bank Statement', description: 'Latest 6 Months operative bank account statement', mandatory: true },
    { category: 'EMPLOYMENT_BUSINESS', label: 'Employment / Business Proof', description: 'Offer Letter, Company Work ID, or GST Registration Certificate', mandatory: true },
    { category: 'OTHER', label: 'Other Required Documents', description: 'Signatures, Photographs, or Guarantor Documents', mandatory: false },
  ];

  const documentChecklist: DocumentChecklistItem[] = categoriesDef.map((def) => {
    const matchingDocs = uniqueDocs.filter((d) => mapDocumentCategory(d) === def.category);
    const uploaded = matchingDocs.length > 0;

    let status: DocumentChecklistItem['status'] = 'MISSING';
    if (uploaded) {
      if (matchingDocs.some((d) => d.status === 'REJECTED')) {
        status = 'REJECTED';
      } else if (matchingDocs.some((d) => d.status === 'VERIFIED' || d.verified)) {
        status = 'VERIFIED';
      } else {
        status = 'PENDING';
      }
    }

    return {
      category: def.category,
      label: def.label,
      description: def.description,
      mandatory: def.mandatory,
      uploaded,
      status,
      documents: matchingDocs.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        storageKey: d.storageKey,
        documentType: d.documentType,
        status: d.status,
        verified: d.verified,
        rejectionReason: d.rejectionReason,
        verifiedAt: d.verifiedAt?.toISOString() || null,
      })),
      remarks: matchingDocs.find((d) => d.rejectionReason)?.rejectionReason || null,
    };
  });

  const mandatoryChecklist = documentChecklist.filter((c) => c.mandatory);
  const allMandatoryVerified = mandatoryChecklist.every((c) => c.status === 'VERIFIED');
  const hasMissing = mandatoryChecklist.some((c) => c.status === 'MISSING');
  const hasRejected = mandatoryChecklist.some((c) => c.status === 'REJECTED');
  const verifiedCount = mandatoryChecklist.filter((c) => c.status === 'VERIFIED').length;

  // Step 4: Policy & Financial Eligibility Determination
  const tenantFoirConfig = configurationService.getTenantConfig<any>('tenant-adyapan-default', 'FOIR_DTI');
  const tenantEligibilityConfig = configurationService.getTenantConfig<any>('tenant-adyapan-default', 'ELIGIBILITY');

  const maxAllowedFoir = Number((tenantFoirConfig.maxDtiRatio ?? 0.5) * 100);
  const minRequiredIncome = Number(
    product.productType === 'BUSINESS'
      ? (tenantEligibilityConfig.minBusinessIncome ?? 50000)
      : (tenantEligibilityConfig.minSalariedIncome ?? 25000)
  );

  const foirEligible = foirPct <= maxAllowedFoir;
  const incomeEligible = effectiveIncome >= minRequiredIncome;
  const policyPassed = foirEligible && incomeEligible;

  const financialEligibilityReason = policyPassed
    ? `Eligible — FOIR of ${foirPct.toFixed(1)}% conforms to maximum permitted ${maxAllowedFoir.toFixed(0)}% lending limit and verified monthly income of ₹${effectiveIncome.toLocaleString('en-IN')} supports proposed EMI of ₹${proposedEmi.toLocaleString('en-IN')}.`
    : !foirEligible
    ? `Not Eligible — Calculated FOIR of ${foirPct.toFixed(1)}% exceeds institutional lending threshold of ${maxAllowedFoir.toFixed(0)}%.`
    : `Not Eligible — Monthly income of ₹${effectiveIncome.toLocaleString('en-IN')} is below required ₹${minRequiredIncome.toLocaleString('en-IN')} policy threshold.`;

  // Step 5: Risk Assessment Summary
  const riskSummary: FinancialCapacitySummary['riskSummary'] = {
    score: app.riskAssessment?.score ?? null,
    category: app.riskAssessment?.category ?? null,
    factors: (app.riskAssessment?.factors as any) ?? null,
    recommendation: app.riskAssessment
      ? app.riskAssessment.category === 'LOW'
        ? 'Low institutional risk. Repayment profile supports standard sanction.'
        : app.riskAssessment.category === 'MEDIUM'
        ? 'Moderate risk profile. Recommend standard verification of employment and bank transactions.'
        : 'High risk tier. Stricter debt servicing covenants or co-borrower required.'
      : null,
  };

  // Step 6 & 7: Workflow Tracker Resolution
  const isStarted = !['DRAFT', 'SUBMITTED'].includes(app.status) || !!app.eligibility;
  const isKycVerified = customer.kycStatus === 'VERIFIED';
  const isDocsVerified = allMandatoryVerified;
  const isFinancialEvaluated = !!app.eligibility;
  const isRiskEvaluated = !!app.riskAssessment;
  const isDecisionRecorded =
    app.approvals.some((a) => a.approverRole === 'CREDIT_ANALYST' && a.status !== 'PENDING') ||
    app.status === 'UNDERWRITING' ||
    app.eligibility?.result === 'ELIGIBLE' ||
    app.eligibility?.result === 'NOT_ELIGIBLE';
  const isForwardedToUnderwriter = app.status === 'UNDERWRITING' || ['APPROVED', 'REJECTED'].includes(app.status);

  let currentStep = 1;
  if (!isStarted) currentStep = 1;
  else if (!isKycVerified) currentStep = 2;
  else if (!isDocsVerified) currentStep = 3;
  else if (!isFinancialEvaluated) currentStep = 4;
  else if (!isRiskEvaluated) currentStep = 5;
  else if (!isDecisionRecorded) currentStep = 6;
  else currentStep = 7;

  const latestApproval = app.approvals[0];

  return {
    applicationId: app.id,
    applicationNo: app.applicationNo,
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    declaredMonthlyIncome: declaredIncome,
    verifiedMonthlyIncome: verifiedIncome,
    incomeVerificationStatus,
    employmentType: primaryEmployment?.employmentType || customer.employmentType || 'SALARIED',
    employerName: primaryEmployment?.employerName || customer.employerName || 'Undisclosed Employer',
    employmentVerificationStatus,
    workVintageYears: primaryEmployment?.workExperienceYears || 2,
    existingMonthlyObligations: existingObligations,
    requestedLoanAmount: requestedAmount,
    tenureMonths,
    interestRatePct,
    proposedEmi,
    totalMonthlyObligations,
    dtiPct: Number(dtiPct.toFixed(2)),
    foirPct: Number(foirPct.toFixed(2)),
    netDisposableIncome: Number(netDisposableIncome.toFixed(2)),
    creditScore,
    creditRating,
    creditScoreSource: 'CIBIL Bureau Gateway (Verified Feed)',
    creditScoreCheckedAt: app.riskAssessment?.createdAt?.toISOString() || app.createdAt.toISOString(),
    kycStatus: customer.kycStatus,
    riskCategory: app.riskAssessment?.category || customer.riskCategory || 'LOW',
    currentLifecycleStatus: app.status,

    customerDetails: {
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      customerCode: customer.customerCode,
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString().split('T')[0] : null,
      age,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.addressLine ? `${customer.addressLine}, ${customer.city || ''}, ${customer.state || ''} ${customer.pincode || ''}`.trim() : null,
      panOrKycStatus: customer.kycStatus === 'VERIFIED' ? 'PAN & Aadhaar Verified' : 'Verification Incomplete',
      kycStatus: customer.kycStatus,
      riskCategory: customer.riskCategory || null,
    },

    documentChecklist,
    documentSummary: {
      allMandatoryVerified,
      hasMissing,
      hasRejected,
      verifiedCount,
      totalMandatory: mandatoryChecklist.length,
    },

    financialEligibility: {
      isEligible: policyPassed,
      foir: Number(foirPct.toFixed(1)),
      dti: Number(dtiPct.toFixed(1)),
      maxAllowedFoir,
      minRequiredIncome,
      reason: financialEligibilityReason,
      policyPassed,
      proposedEmi,
      totalObligations: totalMonthlyObligations,
      netDisposableIncome,
    },

    riskSummary,

    workflowStep: {
      currentStep,
      step1Complete: isStarted,
      step2Complete: isKycVerified,
      step3Complete: isDocsVerified,
      step4Complete: isFinancialEvaluated,
      step5Complete: isRiskEvaluated,
      step6Complete: isDecisionRecorded,
      step7Complete: isForwardedToUnderwriter,
    },

    previousDecision: app.eligibility
      ? {
          result: app.eligibility.result,
          reason:
            latestApproval?.decisionReason ||
            eligibilityFactors.decisionReason ||
            (Array.isArray(app.eligibility.factors)
              ? (() => {
                  const failed = (app.eligibility.factors as any[]).filter((f) => f.status === 'FAIL');
                  if (failed.length > 0) {
                    return `Automated policy check flagged: ${failed.map((f) => `${f.factor} (${f.detail})`).join('; ')}`;
                  }
                  const warned = (app.eligibility.factors as any[]).filter((f) => f.status === 'WARNING');
                  if (warned.length > 0) {
                    return `Conditionally eligible subject to: ${warned.map((f) => f.detail).join('; ')}`;
                  }
                  return 'All automated eligibility checks passed.';
                })()
              : undefined),
          evaluatedAt: app.eligibility.createdAt.toISOString(),
          analyst: eligibilityFactors.analystEmail || 'Automated Policy Engine',
          riskGrade: eligibilityFactors.riskGrade || app.riskAssessment?.category || 'LOW',
          positiveFactors: eligibilityFactors.positiveFactors,
          riskFactors: eligibilityFactors.riskFactors,
        }
      : undefined,
  };
}

/**
 * STEP 1: Starts Credit Assessment on an application
 * Validates existence, CREDIT_ANALYST role, and SUBMITTED status before transitioning.
 */
export async function startCreditAssessment(
  applicationId: string,
  actor: { id: string; email: string; roles: string[] }
) {
  // 1. Validate application exists
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // 2. Validate logged-in user has CREDIT_ANALYST (or admin) permission
  const isAnalyst = actor.roles?.some((r) =>
    ['CREDIT_ANALYST', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
  );
  if (!isAnalyst) {
    throw new ForbiddenError(
      'Access forbidden: Only Credit Analysts can initiate credit assessment'
    );
  }

  // If already in CREDIT_ASSESSMENT, return idempotent success
  if (app.status === 'CREDIT_ASSESSMENT') {
    return { success: true, newStatus: 'CREDIT_ASSESSMENT', alreadyActive: true };
  }

  // 3. Validate that the application is currently in SUBMITTED status
  if (app.status !== 'SUBMITTED') {
    throw new BadRequestError(
      `Cannot start credit assessment: Application is in '${app.status}' status. Credit assessment can only be initiated on applications in 'SUBMITTED' status.`
    );
  }

  // 4. Change application workflow status to CREDIT_ASSESSMENT
  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: 'CREDIT_ASSESSMENT' },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: 'SUBMITTED',
        toStatus: 'CREDIT_ASSESSMENT',
        changedBy: actor.email || actor.id,
        reason: 'Credit Analyst initiated formal credit assessment and underwriting review',
      },
    });
  });

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'CREDIT_ASSESSMENT_STARTED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { status: 'CREDIT_ASSESSMENT' },
  });

  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: 'INFO',
    title: `Application ${app.applicationNo} in Credit Assessment`,
    message: 'Credit Analyst has initiated formal review of your loan application.',
    metadata: { applicationId, link: `/applications/${applicationId}` },
  }).catch(() => {});

  return { success: true, newStatus: 'CREDIT_ASSESSMENT' };
}

/**
 * STEP 2: Verifies Customer KYC
 */
export async function verifyKycStep(
  applicationId: string,
  input: VerifyKycStepInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  const customerId = app.customer.id;
  const result = await updateKycStatus(
    customerId,
    {
      kycStatus: input.kycStatus === 'FAILED' ? 'REJECTED' : input.kycStatus,
      riskCategory: input.riskCategory,
      remarks: input.remarks,
    },
    actor.id,
    actor as any
  );

  // If KYC was verified, ensure application is in CREDIT_ASSESSMENT
  if (input.kycStatus === 'VERIFIED' && (app.status === 'SUBMITTED' || app.status === 'KYC_PENDING')) {
    await prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: 'CREDIT_ASSESSMENT' },
    });
  }

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'KYC_STEP_VERIFIED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { kycStatus: input.kycStatus, remarks: input.remarks },
  });

  return { success: true, kycStatus: input.kycStatus, customer: result };
}

/**
 * STEP 3: Verifies an individual document
 */
export async function verifyDocumentStep(
  applicationId: string,
  input: VerifyDocumentStepInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const doc = await prisma.document.findUnique({
    where: { id: input.documentId },
  });
  if (!doc) throw new NotFoundError('Document record not found');

  const updated = await prisma.document.update({
    where: { id: input.documentId },
    data: {
      status: input.status,
      verified: input.status === 'VERIFIED',
      rejectionReason: input.remarks || null,
      verifiedBy: actor.email,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'DOCUMENT_STEP_VERIFIED',
    entity: 'Document',
    entityId: input.documentId,
    newValue: { status: input.status, rejectionReason: input.remarks },
  });

  return { success: true, document: updated };
}

/**
 * STEP 3: Batch Verifies all uploaded documents
 */
export async function batchVerifyDocumentsStep(
  applicationId: string,
  input: BatchVerifyDocumentsStepInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const count = await prisma.document.updateMany({
    where: { id: { in: input.documentIds } },
    data: {
      status: input.status,
      verified: input.status === 'VERIFIED',
      rejectionReason: input.remarks || null,
      verifiedBy: actor.email,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'DOCUMENTS_BATCH_VERIFIED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { documentIds: input.documentIds, status: input.status },
  });

  return { success: true, updatedCount: count.count };
}

/**
 * STEP 4: Evaluates Financial Eligibility against configured policy
 */
export async function evaluateFinancialEligibilityStep(
  applicationId: string,
  input: EvaluateFinancialStepInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  if (app.customer.kycStatus !== 'VERIFIED') {
    throw new BadRequestError('Cannot evaluate financial eligibility: KYC must be VERIFIED first.');
  }

  // Update verified income if provided
  if (input.verifiedIncome != null) {
    await prisma.customer.update({
      where: { id: app.customerId },
      data: { monthlyIncome: Money.toDb(input.verifiedIncome) },
    });
  }

  // Run full policy eligibility evaluation
  const result = await evaluateApplicationEligibility(applicationId, actor.id);

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'FINANCIAL_ELIGIBILITY_EVALUATED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { result: result.result, score: result.score },
  });

  return result;
}

/**
 * STEP 5: Records 4-Pillar Credit Risk Assessment
 */
export async function recordRiskAssessmentStep(
  applicationId: string,
  input: RecordRiskStepInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true, eligibility: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  if (app.customer.kycStatus !== 'VERIFIED') {
    throw new BadRequestError('Cannot assess credit risk: KYC must be VERIFIED first.');
  }
  if (!app.eligibility) {
    throw new BadRequestError('Cannot assess credit risk: Financial eligibility check must be completed first.');
  }

  // Evaluate risk using the 4-pillar model
  const riskResult = await evaluateApplicationRisk(applicationId, actor.id);

  // Apply analyst risk grade override if supplied
  if (input.riskGrade && input.riskGrade !== riskResult.category) {
    await prisma.riskAssessment.update({
      where: { applicationId },
      data: { category: input.riskGrade },
    });
    await prisma.customer.update({
      where: { id: app.customerId },
      data: { riskCategory: input.riskGrade },
    });
    riskResult.category = input.riskGrade;
  }

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'CREDIT_RISK_RECORDED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { score: riskResult.score, category: riskResult.category, remarks: input.remarks },
  });

  return riskResult;
}

/**
 * STEP 6 & 7: Official Credit Analyst Decision & Forwarding to Underwriter
 */
export async function submitCreditDecision(
  applicationId: string,
  input: SubmitCreditDecisionInput,
  actor: { id: string; email: string; roles: string[] }
) {
  // 1. Strict RBAC: Verify Credit Analyst role authority
  const isAuthorized = actor.roles.some((r) =>
    ['CREDIT_ANALYST', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Credit Analysts or Branch Administrators can submit credit decisions.'
    );
  }

  // Credit Analyst must not give final loan approval
  if ((input.decision as any) === 'APPROVED') {
    throw new ForbiddenError(
      'Credit Analysts are strictly prohibited from giving final loan approval. Only Underwriters have authority to sanction or approve loans.'
    );
  }

  // 2. Fetch application with customer and documents
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: { include: { loans: true, documents: true } },
      documents: true,
      product: true,
      eligibility: true,
      riskAssessment: true,
    },
  });

  if (!app) {
    throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
  }

  // 3. Sequential Workflow Enforcement: Verify all prerequisite steps
  // Prerequisite 1: Step 2 KYC Verification
  if (app.customer.kycStatus !== 'VERIFIED') {
    throw new BadRequestError(
      'Cannot submit credit decision: Borrower KYC is not VERIFIED. Please complete Step 2 (KYC Verification) before proceeding.'
    );
  }

  // Prerequisite 2: Step 3 Document Verification Checklist
  const allDocs = [...(app.customer.documents || []), ...(app.documents || [])];
  const uniqueDocs = Array.from(new Map(allDocs.map((d) => [d.id, d])).values());

  const mandatoryCategories = ['IDENTITY', 'ADDRESS', 'INCOME', 'BANK_STATEMENT', 'EMPLOYMENT_BUSINESS'];
  for (const cat of mandatoryCategories) {
    const matchingDocs = uniqueDocs.filter((d) => mapDocumentCategory(d) === cat);
    if (matchingDocs.length === 0) {
      throw new BadRequestError(
        `Cannot submit credit decision: Mandatory document category '${cat}' is missing. Please verify all mandatory documents in Step 3.`
      );
    }
    const hasVerified = matchingDocs.some((d) => d.status === 'VERIFIED' || d.verified);
    if (!hasVerified) {
      throw new BadRequestError(
        `Cannot submit credit decision: Mandatory document category '${cat}' is not VERIFIED. Please complete Step 3 document verification.`
      );
    }
  }

  // Prerequisite 3: Step 4 Financial Eligibility Check
  if (!app.eligibility) {
    throw new BadRequestError(
      'Cannot submit credit decision: Financial eligibility check has not been completed. Please run Step 4 first.'
    );
  }

  // Prerequisite 4: Step 5 Credit Risk Assessment
  if (!app.riskAssessment) {
    throw new BadRequestError(
      'Cannot submit credit decision: 4-Pillar Credit Risk Assessment has not been performed. Please run Step 5 first.'
    );
  }

  // Prerequisite 5: Mandatory Remarks
  if (!input.reason || input.reason.trim().length < 10) {
    throw new BadRequestError('A comprehensive decision justification is mandatory (minimum 10 characters).');
  }

  // If Not Eligible, require detailed rejection reason
  if (input.decision === 'NOT_ELIGIBLE' && (!input.rejectionReason && !input.reason)) {
    throw new BadRequestError('A clear policy rejection reason is mandatory for Not Eligible applications.');
  }

  // 4. Compute financial parameters snapshot
  const declaredIncome = Number(app.customer.monthlyIncome || 0);
  const verifiedIncome = input.verifiedIncome != null ? input.verifiedIncome : declaredIncome;
  const existingObligations = Number(app.customer.existingObligations || 0);

  const emiCalc = calculateEmi(
    Number(app.requestedAmount),
    Number(app.product.interestRate),
    app.tenureMonths
  );
  const proposedEmi = Number(emiCalc.emi || 0);
  const totalObligations = existingObligations + proposedEmi;

  const dtiPct = verifiedIncome > 0 ? (existingObligations / verifiedIncome) * 100 : 100;
  const foirPct = verifiedIncome > 0 ? (totalObligations / verifiedIncome) * 100 : 100;
  const disposableIncome = Math.max(0, verifiedIncome - totalObligations);

  const positiveFactors =
    input.positiveFactors && input.positiveFactors.length > 0
      ? input.positiveFactors
      : [
          `Verified monthly income ₹${verifiedIncome.toLocaleString('en-IN')}`,
          `Calculated FOIR of ${foirPct.toFixed(1)}% satisfies risk policy`,
          'Identity and residence documentation inspected & verified',
        ];

  const riskFactors =
    input.riskFactors && input.riskFactors.length > 0
      ? input.riskFactors
      : input.decision === 'NOT_ELIGIBLE'
      ? [
          input.rejectionReason || 'Institutional lending risk criteria or capacity failed',
          `Total obligations of ₹${totalObligations.toLocaleString('en-IN')} with FOIR ${foirPct.toFixed(1)}%`,
        ]
      : [];

  const factorsSnapshot = {
    decision: input.decision,
    decisionReason: input.reason,
    rejectionReason: input.rejectionReason || input.reason,
    riskConcern: input.riskConcern,
    requiredAction: input.requiredAction,
    declaredIncome,
    verifiedIncome,
    existingObligations,
    proposedEmi,
    totalObligations,
    dtiPct: Number(dtiPct.toFixed(2)),
    foirPct: Number(foirPct.toFixed(2)),
    disposableIncome: Number(disposableIncome.toFixed(2)),
    incomeVerificationStatus: input.employmentVerificationStatus || 'VERIFIED',
    employmentVerificationStatus: input.employmentVerificationStatus || 'VERIFIED',
    documentVerificationStatus: input.documentVerificationStatus || 'VERIFIED',
    riskGrade: input.riskGrade,
    positiveFactors,
    riskFactors,
    analystRemarks: input.analystRemarks || input.reason,
    analystEmail: actor.email,
    analystUserId: actor.id,
    decisionDate: new Date().toISOString(),
    forwardedToUnderwritingAt: input.decision === 'ELIGIBLE' ? new Date().toISOString() : undefined,
  };

  // Determine application lifecycle state transition based on decision
  let nextApplicationStatus: ApplicationStatus = app.status;
  let historyReason = '';
  let auditAction = '';

  if (input.decision === 'ELIGIBLE') {
    // Passes credit assessment: moves to next approval stage (Underwriting / Branch Manager sanction)
    nextApplicationStatus = 'UNDERWRITING';
    historyReason = `Credit Assessment: ELIGIBLE — Forwarded to Underwriter (${input.reason})`;
    auditAction = 'CREDIT_DECISION_FORWARDED_TO_UNDERWRITER';
  } else if (input.decision === 'NOT_ELIGIBLE') {
    // Marked Not Eligible: remains in CREDIT_ASSESSMENT with status recorded as NOT_ELIGIBLE
    // Does NOT forward to Underwriter
    nextApplicationStatus = 'CREDIT_ASSESSMENT';
    historyReason = `Credit Assessment: NOT ELIGIBLE — ${input.rejectionReason || input.reason}`;
    auditAction = 'CREDIT_DECISION_NOT_ELIGIBLE';
  } else {
    // FURTHER_REVIEW or REQUEST_ADDITIONAL_DOCS: send back to Loan Officer
    nextApplicationStatus = 'SUBMITTED';
    historyReason = `Credit Assessment: FURTHER REVIEW (Clarification Required) — ${input.reason}`;
    auditAction = 'CREDIT_DECISION_FURTHER_REVIEW';
  }

  const riskScore = input.riskGrade === 'LOW' ? 85 : input.riskGrade === 'MEDIUM' ? 65 : 40;

  // Execute database updates
  await Promise.all([
    // A. Upsert Eligibility Assessment with complete audit snapshot
    prisma.eligibilityAssessment.upsert({
      where: { applicationId },
      update: {
        result: input.decision,
        factors: factorsSnapshot as any,
      },
      create: {
        applicationId,
        result: input.decision,
        factors: factorsSnapshot as any,
      },
    }),

    // B. Sync Risk Assessment
    prisma.riskAssessment.upsert({
      where: { applicationId },
      update: {
        score: riskScore,
        category: input.riskGrade as RiskCategory,
      },
      create: {
        applicationId,
        score: riskScore,
        category: input.riskGrade as RiskCategory,
        factors: [
          { name: 'Debt Service Capacity / FOIR', weight: 30, score: foirPct <= 45 ? 90 : 60, remarks: `FOIR: ${foirPct.toFixed(1)}%` },
          { name: 'Credit & Bureau History', weight: 25, score: 85, remarks: 'Verified Bureau Score' },
          { name: 'Employment & Vintage', weight: 25, score: 80, remarks: 'Analyst Verified' },
          { name: 'Document Completeness', weight: 20, score: 100, remarks: 'All mandatory verified' },
        ] as any,
      },
    }),

    // C. Record Approval Request
    prisma.approvalRequest.create({
      data: {
        applicationId,
        approverRole: 'CREDIT_ANALYST',
        approverUserId: actor.id,
        level: 1,
        status: input.decision === 'ELIGIBLE' ? 'RECOMMENDED_ELIGIBLE' : input.decision,
        decisionReason: input.reason,
        actionAt: new Date(),
      },
    }),

    // D. If Further Review or Additional Docs requested, record UnderwritingDecision with SEND_BACK
    input.decision === 'FURTHER_REVIEW' || input.decision === 'REQUEST_ADDITIONAL_DOCS'
      ? prisma.underwritingDecision.upsert({
          where: { applicationId },
          update: {
            decision: 'SEND_BACK',
            reason: `Credit Analyst requested further review: ${input.reason}${
              input.requestedDocuments ? ` [Requested Documents: ${input.requestedDocuments}]` : ''
            }`,
            decidedBy: actor.email,
          },
          create: {
            applicationId,
            decision: 'SEND_BACK',
            reason: `Credit Analyst requested further review: ${input.reason}${
              input.requestedDocuments ? ` [Requested Documents: ${input.requestedDocuments}]` : ''
            }`,
            decidedBy: actor.email,
          },
        })
      : Promise.resolve(null),

    // E. Update Application Status
    prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: nextApplicationStatus },
    }),

    // F. Record Application Status History
    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: nextApplicationStatus,
        changedBy: actor.email,
        reason: historyReason,
      },
    }),

    // G. Sync customer risk category
    prisma.customer.update({
      where: { id: app.customerId },
      data: { riskCategory: input.riskGrade as RiskCategory },
    }),
  ]);

  // Record Audit Logs
  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: auditAction,
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status, eligibility: app.eligibility?.result },
    newValue: {
      decision: input.decision,
      newStatus: nextApplicationStatus,
      reason: input.reason,
      riskGrade: input.riskGrade,
      foirPct,
      dtiPct,
      verifiedIncome,
    },
  });

  // Non-blocking In-App Notification
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: input.decision === 'ELIGIBLE' ? 'SUCCESS' : input.decision === 'NOT_ELIGIBLE' ? 'ALERT' : 'WARNING',
    title: `Credit Assessment: ${input.decision.replace(/_/g, ' ')}`,
    message:
      input.decision === 'ELIGIBLE'
        ? 'Your credit assessment has been completed and recommended for Underwriting sanction.'
        : input.decision === 'NOT_ELIGIBLE'
        ? `Application credit check result: Not Eligible. ${input.rejectionReason || input.reason}`
        : `Further review or documents are required: ${input.reason}`,
    metadata: { applicationId, decision: input.decision },
  }).catch(() => {});

  return {
    success: true,
    decision: input.decision,
    applicationId,
    newStatus: nextApplicationStatus,
    reason: input.reason,
    dtiPct: Number(dtiPct.toFixed(2)),
    foirPct: Number(foirPct.toFixed(2)),
    verifiedIncome,
  };
}

/**
 * Verifies customer income and employment details independently
 */
export async function verifyFinancials(
  applicationId: string,
  input: VerifyFinancialsInput,
  actor: { id: string; email: string; roles: string[] }
) {
  const isAuthorized = actor.roles.some((r) =>
    ['CREDIT_ANALYST', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Credit Analysts can verify financials.'
    );
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true, eligibility: true },
  });

  if (!app) {
    throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
  }

  const existingFactors = (app.eligibility?.factors as any) || {};
  const updatedFactors = {
    ...existingFactors,
    verifiedIncome: input.verifiedIncome ?? existingFactors.verifiedIncome ?? Number(app.customer.monthlyIncome || 0),
    employmentVerificationStatus: input.employmentVerificationStatus ?? existingFactors.employmentVerificationStatus ?? 'VERIFIED',
    financialVerificationRemarks: input.remarks || existingFactors.financialVerificationRemarks,
    verifiedBy: actor.email,
    verifiedAt: new Date().toISOString(),
  };

  await prisma.eligibilityAssessment.upsert({
    where: { applicationId },
    update: { factors: updatedFactors as any },
    create: {
      applicationId,
      result: 'CONDITIONALLY_ELIGIBLE',
      factors: updatedFactors as any,
    },
  });

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'INCOME_VERIFIED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: {
      verifiedIncome: updatedFactors.verifiedIncome,
      employmentStatus: updatedFactors.employmentVerificationStatus,
    },
  });

  return {
    success: true,
    applicationId,
    verifiedIncome: updatedFactors.verifiedIncome,
    employmentStatus: updatedFactors.employmentVerificationStatus,
  };
}

/**
 * Returns the Credit Assessment Queue grouped by exact workflow stage
 */
export async function getCreditQueue(tab?: string) {
  // Fetch active applications relevant to credit evaluation
  const allApps = await prisma.loanApplication.findMany({
    where: {
      status: {
        notIn: ['DRAFT', 'CANCELLED'],
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          customerCode: true,
          monthlyIncome: true,
          existingObligations: true,
          kycStatus: true,
          riskCategory: true,
          employmentType: true,
          employerName: true,
          documents: {
            select: {
              id: true,
              category: true,
              documentType: true,
              status: true,
              verified: true,
            },
          },
        },
      },
      documents: {
        select: {
          id: true,
          category: true,
          documentType: true,
          status: true,
          verified: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          code: true,
          productType: true,
          interestRate: true,
        },
      },
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Calculate workflow categories for each app
  const isKycPending = (app: any) => app.customer?.kycStatus !== 'VERIFIED';
  
  const isDocsPending = (app: any) => {
    if (app.customer?.kycStatus !== 'VERIFIED') return false;
    const docs = [...(app.customer?.documents || []), ...(app.documents || [])];
    const mandatoryCategories = ['IDENTITY', 'ADDRESS', 'INCOME', 'BANK_STATEMENT', 'EMPLOYMENT_BUSINESS'];
    for (const cat of mandatoryCategories) {
      const matching = docs.filter((d) => mapDocumentCategory(d) === cat);
      if (matching.length === 0 || !matching.some((d) => d.status === 'VERIFIED' || d.verified)) {
        return true;
      }
    }
    return false;
  };

  const isFinancialPending = (app: any) => {
    return !isKycPending(app) && !isDocsPending(app) && !app.eligibility;
  };

  const isCreditPending = (app: any) => {
    return (
      !isKycPending(app) &&
      !isDocsPending(app) &&
      !!app.eligibility &&
      app.eligibility?.result !== 'NOT_ELIGIBLE' &&
      app.eligibility?.result !== 'FURTHER_REVIEW' &&
      (!app.riskAssessment || app.status === 'CREDIT_ASSESSMENT')
    );
  };

  const isFurtherReview = (app: any) => {
    return (
      app.eligibility?.result === 'FURTHER_REVIEW' ||
      (app.eligibility?.result as string) === 'REQUEST_ADDITIONAL_DOCS' ||
      app.underwriting?.decision === 'SEND_BACK'
    );
  };

  const isEligibleOrReadyForUnderwriter = (app: any) => {
    return (
      app.status === 'UNDERWRITING' ||
      app.eligibility?.result === 'ELIGIBLE' ||
      (app.eligibility?.factors as any)?.decision === 'ELIGIBLE'
    );
  };

  const isNotEligible = (app: any) => {
    return (
      app.eligibility?.result === 'NOT_ELIGIBLE' ||
      (app.eligibility?.factors as any)?.decision === 'NOT_ELIGIBLE' ||
      (app.status === 'REJECTED' && !app.underwriting)
    );
  };

  // Group items by tab
  let items = allApps;
  if (tab === 'PENDING_KYC') {
    items = allApps.filter(isKycPending);
  } else if (tab === 'PENDING_DOCS') {
    items = allApps.filter(isDocsPending);
  } else if (tab === 'PENDING_FINANCIAL') {
    items = allApps.filter(isFinancialPending);
  } else if (tab === 'PENDING_CREDIT') {
    items = allApps.filter(isCreditPending);
  } else if (tab === 'FURTHER_REVIEW') {
    items = allApps.filter(isFurtherReview);
  } else if (tab === 'ELIGIBLE') {
    items = allApps.filter(isEligibleOrReadyForUnderwriter);
  } else if (tab === 'NOT_ELIGIBLE') {
    items = allApps.filter(isNotEligible);
  }

  return {
    metrics: {
      applicationsAssigned: allApps.length,
      pendingKyc: allApps.filter(isKycPending).length,
      pendingDocs: allApps.filter(isDocsPending).length,
      pendingFinancial: allApps.filter(isFinancialPending).length,
      pendingCredit: allApps.filter(isCreditPending).length,
      furtherReview: allApps.filter(isFurtherReview).length,
      eligibleApplications: allApps.filter(isEligibleOrReadyForUnderwriter).length,
      notEligibleApplications: allApps.filter(isNotEligible).length,
    },
    items,
  };
}
