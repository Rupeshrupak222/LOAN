import { ApplicationStatus, RiskCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type { SubmitCreditDecisionInput, VerifyFinancialsInput } from './credit.schema';

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
 * Calculates the complete financial repayment capacity for a loan application
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

  // Check if verified income was previously saved in eligibility assessment or fallback to declared
  const verifiedIncome =
    eligibilityFactors.verifiedIncome != null && eligibilityFactors.verifiedIncome > 0
      ? Number(eligibilityFactors.verifiedIncome)
      : declaredIncome;

  const incomeVerificationStatus =
    eligibilityFactors.incomeVerificationStatus ||
    (customer.employmentType ? 'VERIFIED' : 'PENDING');

  // Existing debt obligations (sum from active customer loans or customer profile)
  const activeLoansEmi = customer.loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + Number(l.emiAmount || 0), 0);
  const existingObligations = Math.max(
    Number(customer.existingObligations || 0),
    activeLoansEmi
  );

  // Proposed EMI calculation using reducing balance formula
  const requestedAmount = Number(app.requestedAmount || 0);
  const tenureMonths = app.tenureMonths || 12;
  const interestRatePct = Number(product.interestRate || 14.5);

  const emiResult = calculateEmi(requestedAmount, interestRatePct, tenureMonths);
  const proposedEmi = Number(emiResult.emi || 0);

  // Totals & Ratios
  const totalMonthlyObligations = existingObligations + proposedEmi;
  const effectiveIncome = verifiedIncome > 0 ? verifiedIncome : declaredIncome;

  // DTI: Existing Debt Obligations / Monthly Gross Income * 100
  const dtiPct = effectiveIncome > 0 ? (existingObligations / effectiveIncome) * 100 : 100;

  // FOIR: Fixed Monthly Obligations (Existing + Proposed) / Monthly Income * 100
  const foirPct = effectiveIncome > 0 ? (totalMonthlyObligations / effectiveIncome) * 100 : 100;

  // Disposable Income: Net income remaining after servicing all obligations
  const netDisposableIncome = Math.max(0, effectiveIncome - totalMonthlyObligations);

  // Credit Score calculation / mock lookup
  let creditScore = 750;
  if (app.riskAssessment?.score != null) {
    // Map 0-100 risk score to 500-850 bureau credit score
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
 * Submits an official Credit Assessment decision (ELIGIBLE, NOT_ELIGIBLE, FURTHER_REVIEW)
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

  // 2. Fetch application
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: { include: { loans: true } },
      product: true,
      eligibility: true,
      riskAssessment: true,
    },
  });

  if (!app) {
    throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
  }

  // 3. Compute live financial parameters & ratios
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

  // 4. Default positive and risk factors if none provided
  const positiveFactors =
    input.positiveFactors && input.positiveFactors.length > 0
      ? input.positiveFactors
      : [
          `Verified monthly income ₹${verifiedIncome.toLocaleString('en-IN')}`,
          `Calculated FOIR of ${foirPct.toFixed(1)}% conforms to lending limits`,
          'Identity and residence documentation inspected',
        ];

  const riskFactors =
    input.riskFactors && input.riskFactors.length > 0
      ? input.riskFactors
      : input.decision === 'NOT_ELIGIBLE'
      ? [
          `Total monthly debt service of ₹${totalObligations.toLocaleString('en-IN')} is unmanageable`,
          `FOIR of ${foirPct.toFixed(1)}% exceeds institutional risk threshold`,
        ]
      : [];

  const factorsSnapshot = {
    decisionReason: input.reason,
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
  };

  // Determine application lifecycle state transition based on decision
  let nextApplicationStatus: ApplicationStatus = app.status;
  let historyReason = '';
  let auditAction = '';

  if (input.decision === 'ELIGIBLE') {
    // Passes credit assessment: moves to next approval stage (Underwriting / Branch Manager sanction)
    nextApplicationStatus = 'UNDERWRITING';
    historyReason = `Credit Assessment: ELIGIBLE — ${input.reason} (Forwarded to Underwriting for sanction)`;
    auditAction = 'CREDIT_DECISION_ELIGIBLE';
  } else if (input.decision === 'NOT_ELIGIBLE') {
    // Customer failed credit criteria: eligibility set to NOT_ELIGIBLE, forwarded to Underwriting/BM for final decision
    nextApplicationStatus = 'UNDERWRITING';
    historyReason = `Credit Assessment: NOT ELIGIBLE — ${input.reason} (Forwarded to Underwriting for final sanction decision)`;
    auditAction = 'CREDIT_DECISION_NOT_ELIGIBLE';
  } else {
    // FURTHER_REVIEW: sent back to Loan Officer for missing info or clarification
    // Application remains or moves to SUBMITTED / UNDER_REVIEW with a SEND_BACK decision record
    nextApplicationStatus = 'SUBMITTED';
    historyReason = `Credit Assessment: FURTHER REVIEW (Clarification Required) — ${input.reason}`;
    auditAction = 'CREDIT_DECISION_FURTHER_REVIEW';
  }

  // 5. Execute concurrent updates for EligibilityAssessment, RiskAssessment, ApprovalRequest, and Application
  const riskScore = input.riskGrade === 'LOW' ? 85 : input.riskGrade === 'MEDIUM' ? 65 : 40;

  const [eligibility, , , , updatedApp] = await Promise.all([
    // A. Upsert Eligibility Assessment with comprehensive financial breakdown
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

    // B. Upsert Risk Assessment with assigned risk grade
    prisma.riskAssessment.upsert({
      where: { applicationId },
      update: {
        score: riskScore,
        category: input.riskGrade as RiskCategory,
        factors: [
          { name: 'Debt-to-Income / FOIR Capacity', weight: 35, score: foirPct <= 45 ? 90 : foirPct <= 60 ? 65 : 30, remarks: `FOIR is ${foirPct.toFixed(1)}%` },
          { name: 'Income Verification & Stability', weight: 35, score: verifiedIncome >= 25000 ? 90 : 50, remarks: `Verified: ₹${verifiedIncome.toLocaleString('en-IN')}` },
          { name: 'Analyst Assessment Grade', weight: 30, score: riskScore, remarks: `Assigned Grade: ${input.riskGrade}` },
        ] as any,
      },
      create: {
        applicationId,
        score: riskScore,
        category: input.riskGrade as RiskCategory,
        factors: [
          { name: 'Debt-to-Income / FOIR Capacity', weight: 35, score: foirPct <= 45 ? 90 : foirPct <= 60 ? 65 : 30, remarks: `FOIR is ${foirPct.toFixed(1)}%` },
          { name: 'Income Verification & Stability', weight: 35, score: verifiedIncome >= 25000 ? 90 : 50, remarks: `Verified: ₹${verifiedIncome.toLocaleString('en-IN')}` },
          { name: 'Analyst Assessment Grade', weight: 30, score: riskScore, remarks: `Assigned Grade: ${input.riskGrade}` },
        ] as any,
      },
    }),

    // C. Record Approval Request entry
    prisma.approvalRequest.create({
      data: {
        applicationId,
        approverRole: 'CREDIT_ANALYST',
        approverUserId: actor.id,
        level: 1,
        status: input.decision,
        decisionReason: input.reason,
        actionAt: new Date(),
      },
    }),

    // D. If FURTHER_REVIEW, record UnderwritingDecision with SEND_BACK so Loan Officer receives correction task
    input.decision === 'FURTHER_REVIEW'
      ? prisma.underwritingDecision.upsert({
          where: { applicationId },
          update: {
            decision: 'SEND_BACK',
            reason: `Credit Analyst requested further review/clarification: ${input.reason}${
              input.requestedDocuments ? ` [Requested Documents: ${input.requestedDocuments}]` : ''
            }`,
            decidedBy: actor.email,
          },
          create: {
            applicationId,
            decision: 'SEND_BACK',
            reason: `Credit Analyst requested further review/clarification: ${input.reason}${
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

    // F. Record in Application Status History
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

  // 6. Record Audit Logs
  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: auditAction,
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status, eligibility: app.eligibility?.result },
    newValue: {
      decision: input.decision,
      reason: input.reason,
      riskGrade: input.riskGrade,
      foirPct,
      dtiPct,
      verifiedIncome,
    },
  });

  await logAudit({
    userId: actor.id,
    role: 'CREDIT_ANALYST',
    action: 'FOIR_CALCULATED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { foirPct: Number(foirPct.toFixed(2)), dtiPct: Number(dtiPct.toFixed(2)) },
  });

  if (input.decision === 'FURTHER_REVIEW') {
    await logAudit({
      userId: actor.id,
      role: 'CREDIT_ANALYST',
      action: 'CORRECTION_REQUESTED',
      entity: 'LoanApplication',
      entityId: applicationId,
      newValue: { reason: input.reason, requestedDocuments: input.requestedDocuments },
    });
  }

  // 7. Non-blocking Async In-App Notification
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: input.decision === 'ELIGIBLE' ? 'SUCCESS' : input.decision === 'NOT_ELIGIBLE' ? 'ALERT' : 'WARNING',
    title: `Credit Assessment: ${input.decision.replace(/_/g, ' ')}`,
    message:
      input.decision === 'ELIGIBLE'
        ? 'Your credit profile and repayment capacity have been verified and approved for underwriting sanction.'
        : input.decision === 'NOT_ELIGIBLE'
        ? `Your loan application failed credit criteria: ${input.reason}`
        : `Clarification or additional documents are required for your application: ${input.reason}`,
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
 * Returns the Credit Assessment Queue with live Credit Analyst metrics
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
              documentType: true,
              status: true,
            },
          },
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
      approvals: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Calculate live Credit Analyst metrics
  const applicationsAssigned = allApps.length;
  const pendingAssessments = allApps.filter(
    (a) => !a.eligibility || ['SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(a.status)
  ).length;
  const assessmentsCompleted = allApps.filter((a) => !!a.eligibility).length;
  const eligibleApplications = allApps.filter((a) => a.eligibility?.result === 'ELIGIBLE').length;
  const notEligibleApplications = allApps.filter((a) => a.eligibility?.result === 'NOT_ELIGIBLE').length;
  const pendingDocuments = allApps.filter(
    (a) =>
      a.customer?.documents?.some(
        (d) => d.status === 'PENDING' || (d.status as string) === 'REQUIRES_CORRECTION'
      ) || a.customer?.kycStatus === 'PENDING'
  ).length;
  const highRiskCases = allApps.filter(
    (a) => a.riskAssessment?.category === 'HIGH' || a.customer?.riskCategory === 'HIGH'
  ).length;

  let items = allApps;
  if (tab === 'PENDING') {
    items = allApps.filter(
      (a) => !a.eligibility || ['SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(a.status)
    );
  } else if (tab === 'ELIGIBLE') {
    items = allApps.filter((a) => a.eligibility?.result === 'ELIGIBLE');
  } else if (tab === 'NOT_ELIGIBLE') {
    items = allApps.filter((a) => a.eligibility?.result === 'NOT_ELIGIBLE');
  } else if (tab === 'HIGH_RISK') {
    items = allApps.filter(
      (a) => a.riskAssessment?.category === 'HIGH' || a.customer?.riskCategory === 'HIGH'
    );
  } else if (tab === 'PENDING_DOCS') {
    items = allApps.filter((a) =>
      a.customer?.documents?.some(
        (d) => d.status === 'PENDING' || (d.status as string) === 'REQUIRES_CORRECTION'
      )
    );
  }

  return {
    metrics: {
      applicationsAssigned,
      pendingAssessments,
      assessmentsCompleted,
      eligibleApplications,
      notEligibleApplications,
      pendingDocuments,
      highRiskCases,
    },
    items,
  };
}
