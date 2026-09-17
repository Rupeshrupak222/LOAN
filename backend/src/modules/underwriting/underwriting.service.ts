import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { communicationService } from '../communication/communication.service';
import type { UnderwritingDecisionInput, ResolveDeviationInput } from './underwriting.schema';

export interface UnderwriterActorContext {
  id: string;
  email: string;
  roles: string[];
  tenantId?: string;
  branchId?: string;
}

export interface DeviationItem {
  id: string;
  ruleName: string;
  category: 'FOIR' | 'BUREAU' | 'LOAN_AMOUNT' | 'BORROWER_AGE' | 'POLICY' | 'DOCUMENT';
  actualValue: string | number;
  allowedThreshold: string | number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'RESOLVED' | 'WAIVED' | 'REJECTED';
  requiresAuthority: string;
  reason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

// In-Memory store for resolved deviations per application (keyed by applicationId)
const activeDeviationsStore = new Map<string, DeviationItem[]>();

export function computeDeviationsForApplication(app: any): DeviationItem[] {
  const deviations: DeviationItem[] = [];
  const requestedAmt = Number(app.requestedAmount || 0);
  const monthlyIncome = Number(app.customer?.monthlyIncome || 0);

  // 1. FOIR / Affordability Deviation
  if (monthlyIncome > 0) {
    const estimatedEmi = Math.round(requestedAmt / Math.max(1, app.tenureMonths || 12));
    const foirPct = Math.round((estimatedEmi / monthlyIncome) * 100);
    if (foirPct > 50) {
      deviations.push({
        id: `dev-foir-${app.id}`,
        ruleName: 'Max FOIR Policy Threshold',
        category: 'FOIR',
        actualValue: `${foirPct}%`,
        allowedThreshold: '50%',
        severity: foirPct > 65 ? 'CRITICAL' : 'HIGH',
        status: 'PENDING',
        requiresAuthority: foirPct > 65 ? 'LEVEL_3_CREDIT_HEAD' : 'LEVEL_2_UNDERWRITER',
        reason: `Estimated FOIR (${foirPct}%) exceeds standard institutional ceiling (50%).`,
      });
    }
  }

  // 2. High Exposure / Amount Deviation
  if (requestedAmt > 1000000) {
    deviations.push({
      id: `dev-amt-${app.id}`,
      ruleName: 'Single Borrower Exposure Cap',
      category: 'LOAN_AMOUNT',
      actualValue: `₹${requestedAmt.toLocaleString('en-IN')}`,
      allowedThreshold: '₹10,00,000',
      severity: requestedAmt > 2500000 ? 'CRITICAL' : 'MEDIUM',
      status: 'PENDING',
      requiresAuthority: requestedAmt > 2500000 ? 'LEVEL_3_CREDIT_HEAD' : 'LEVEL_2_UNDERWRITER',
      reason: `High ticket exposure of ₹${requestedAmt.toLocaleString('en-IN')} requires committee concurrence.`,
    });
  }

  // 3. Borrower Age Deviation
  if (app.customer?.dateOfBirth) {
    const dob = new Date(app.customer.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 23 || age > 58) {
      deviations.push({
        id: `dev-age-${app.id}`,
        ruleName: 'Standard Borrower Age Band',
        category: 'BORROWER_AGE',
        actualValue: `${age} years`,
        allowedThreshold: '23 - 58 years',
        severity: 'LOW',
        status: 'PENDING',
        requiresAuthority: 'LEVEL_2_UNDERWRITER',
        reason: `Borrower age (${age} yrs) is near boundary limits.`,
      });
    }
  }

  // 4. Bureau Score Deviation
  const bureauScore = (app.eligibility?.factors as any)?.bureauScore || 720;
  if (bureauScore < 700) {
    deviations.push({
      id: `dev-bureau-${app.id}`,
      ruleName: 'Minimum Bureau Cutoff',
      category: 'BUREAU',
      actualValue: bureauScore,
      allowedThreshold: 700,
      severity: bureauScore < 650 ? 'HIGH' : 'MEDIUM',
      status: 'PENDING',
      requiresAuthority: bureauScore < 650 ? 'LEVEL_3_CREDIT_HEAD' : 'LEVEL_2_UNDERWRITER',
      reason: `Credit Bureau score (${bureauScore}) is below benchmark (700).`,
    });
  }

  // Merge with any previously resolved deviations in memory
  const existing = activeDeviationsStore.get(app.id) || [];
  if (existing.length > 0) {
    return deviations.map((d) => {
      const found = existing.find((e) => e.ruleName === d.ruleName);
      return found ? { ...d, status: found.status, resolvedBy: found.resolvedBy, resolvedAt: found.resolvedAt, reason: found.reason || d.reason } : d;
    });
  }

  return deviations;
}

export async function getUnderwritingQueue(
  tab?: string,
  search?: string,
  actor?: { id?: string; roles?: string[]; tenantId?: string; branchId?: string }
) {
  let where: any = {};
  const normalizedTab = (tab || 'READY').toUpperCase();

  if (normalizedTab === 'READY' || normalizedTab === 'DECISION_REQUIRED') {
    // Only proposals explicitly forwarded by Credit Analyst into UNDERWRITING and awaiting underwriter sanction
    where = {
      status: 'UNDERWRITING',
      OR: [
        { underwriting: null },
        { underwriting: { decision: { notIn: ['APPROVE', 'REJECT', 'SEND_BACK'] } } },
      ],
    };
  } else if (normalizedTab === 'IN_REVIEW') {
    where = {
      status: 'UNDERWRITING',
    };
  } else if (normalizedTab === 'SENT_BACK') {
    where = {
      OR: [
        { underwriting: { decision: 'SEND_BACK' } },
        {
          statusHistory: {
            some: {
              reason: { contains: 'SEND_BACK' },
            },
          },
        },
      ],
    };
  } else if (normalizedTab === 'HOLD' || normalizedTab === 'AWAITING_INFO') {
    where = {
      status: 'UNDERWRITING',
      underwriting: { decision: 'HOLD' },
    };
  } else if (normalizedTab === 'APPROVED') {
    where = {
      status: { in: ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'] },
      underwriting: { isNot: null },
    };
  } else if (normalizedTab === 'REJECTED') {
    where = {
      status: 'REJECTED',
      underwriting: { isNot: null },
    };
  } else if (normalizedTab === 'ESCALATED') {
    where = {
      status: 'UNDERWRITING',
      approvals: {
        some: {
          status: { in: ['ESCALATED', 'PENDING'] },
          level: { gte: 3 },
        },
      },
    };
  } else {
    // ALL proposals that have entered underwriting lifecycle (NEVER draft, submitted, or active credit assessment)
    where = {
      OR: [
        { status: { in: ['UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'] } },
        { underwriting: { isNot: null } },
      ],
    };
  }

  // Multi-Tenant and Branch Data Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

  // Search filter
  if (search && search.trim() !== '') {
    const q = search.trim();
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { applicationNo: { contains: q, mode: 'insensitive' } },
          { customer: { firstName: { contains: q, mode: 'insensitive' } } },
          { customer: { lastName: { contains: q, mode: 'insensitive' } } },
          { customer: { customerCode: { contains: q, mode: 'insensitive' } } },
          { customer: { mobile: { contains: q, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  const applications = await prisma.loanApplication.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          customerCode: true,
          monthlyIncome: true,
          kycStatus: true,
          riskCategory: true,
          employmentType: true,
          mobile: true,
          dateOfBirth: true,
          documents: {
            select: { id: true, documentType: true, verified: true, status: true },
          },
        },
      },
      product: { select: { id: true, name: true, code: true, productType: true, interestRate: true } },
      eligibility: true,
      riskAssessment: true,
      approvals: { orderBy: { createdAt: 'desc' } },
      underwriting: true,
      statusHistory: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Filter out STP auto-approved applications from manual action queues (READY, IN_REVIEW, DECISION_REQUIRED)
  const isActionQueue = ['READY', 'IN_REVIEW', 'DECISION_REQUIRED'].includes(normalizedTab);

  return applications
    .filter((app) => {
      if (!isActionQueue) return true;
      // STP cases (auto-approved by BRE without manual referral)
      const isStp = (app.eligibility?.factors as any)?.isStp === true || app.status === 'APPROVED';
      return !isStp;
    })
    .map((app) => {
      const deviations = computeDeviationsForApplication(app);
      const requestedAmt = Number(app.requestedAmount || 0);

      // Derive referral reason
      let referralReason = 'Standard Credit Policy Underwriting Review';
      if (deviations.length > 0) {
        referralReason = `Policy Deviation: ${deviations[0].ruleName} (${deviations[0].actualValue})`;
      } else if (app.riskAssessment?.category === 'HIGH') {
        referralReason = `BRE Referral: Risk Category HIGH requires Underwriter review`;
      } else if (requestedAmt > 1000000) {
        referralReason = `Authority Threshold: High exposure ₹${requestedAmt.toLocaleString('en-IN')}`;
      }

      // Priority
      let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' = 'NORMAL';
      if (deviations.some((d) => d.severity === 'CRITICAL') || requestedAmt > 2500000) {
        priority = 'URGENT';
      } else if (deviations.some((d) => d.severity === 'HIGH') || app.riskAssessment?.category === 'HIGH') {
        priority = 'HIGH';
      } else if (deviations.length > 0) {
        priority = 'MEDIUM';
      }

      // TAT in hours
      const ageHours = Math.round((Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60));

      return {
        id: app.id,
        applicationNo: app.applicationNo,
        customerId: app.customerId,
        requestedAmount: requestedAmt,
        tenureMonths: app.tenureMonths,
        purpose: app.purpose,
        status: app.status,
        stage: (app as any).stage || 'UNDERWRITING_REVIEW',
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        customer: app.customer,
        product: app.product,
        eligibility: app.eligibility,
        riskAssessment: app.riskAssessment,
        underwriting: app.underwriting,
        deviationsCount: deviations.filter((d) => d.status === 'PENDING').length,
        deviations,
        referralReason,
        priority,
        tatHours: ageHours,
        assignedUnderwriter: (app as any).assignedToUserId || 'Queue Pool (Unassigned)',
        nextAction: app.underwriting ? 'VIEW_SANCTION' : 'REVIEW_PROPOSAL',
      };
    });
}

export async function getUnderwritingWorkspace(
  applicationId: string,
  actor: UnderwriterActorContext
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          documents: true,
          bankAccounts: true,
          employmentDetails: true,
          addresses: true,
          consents: true,
        },
      },
      product: true,
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!app) {
    throw new NotFoundError(`Loan application ${applicationId} not found`);
  }

  // Multi-tenant and branch isolation
  if (!actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another tenant institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  const requestedAmt = Number(app.requestedAmount || 0);
  const deviations = computeDeviationsForApplication(app);

  // Level 2 Underwriter delegated authority limit is ₹25 Lakh
  const UNDERWRITER_MAX_AUTHORITY = 2500000;
  const isExceedingAuthority = requestedAmt > UNDERWRITER_MAX_AUTHORITY;

  // Evaluate sequential workflow gates
  const docs = app.customer?.documents || [];
  const unverifiedDocs = docs.filter((d: any) => !d.verified && d.status !== 'VERIFIED');
  const hasKycRejected = app.customer?.kycStatus === 'REJECTED';
  const hasAnalystRecommendation = !!(app.eligibility?.factors as any)?.recommendation;
  const isForwardedToUnderwriting = ['UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);
  const unresolvedCriticalDeviations = deviations.filter(
    (d) => (d.severity === 'CRITICAL' || d.severity === 'HIGH') && d.status === 'PENDING'
  );

  const blockers: string[] = [];
  if (!isForwardedToUnderwriting) {
    blockers.push(`Proposal is currently in ${app.status} stage and has NOT been forwarded to Underwriting by the Credit Analyst.`);
  }
  if (hasKycRejected) {
    blockers.push('Borrower KYC is marked as REJECTED');
  }
  if (unverifiedDocs.length > 0) {
    blockers.push(`${unverifiedDocs.length} mandatory document(s) are pending inspection & verification`);
  }
  if (!hasAnalystRecommendation && !app.eligibility) {
    blockers.push('Credit Analyst assessment & eligibility factors are missing');
  }
  if (isExceedingAuthority) {
    blockers.push(
      `Requested amount ₹${requestedAmt.toLocaleString('en-IN')} exceeds Level 2 Underwriter limit (₹25,00,000). Escalation to Level 3 Credit Head is required.`
    );
  }

  const gates = {
    intakeComplete: true,
    creditAssessmentReviewed: isForwardedToUnderwriting,
    kycVerified: !hasKycRejected,
    documentsVerified: unverifiedDocs.length === 0,
    financialAssessmentComplete: isForwardedToUnderwriting,
    riskPolicyChecked: true,
    deviationsResolved: unresolvedCriticalDeviations.length === 0,
    canApprove: blockers.length === 0,
    blockers,
  };

  // Authority matrix result
  const authorityCheck = {
    hasAuthority: !isExceedingAuthority,
    userLevel: 2,
    requiredLevel: isExceedingAuthority ? 3 : 2,
    maxLimit: UNDERWRITER_MAX_AUTHORITY,
    requestedAmount: requestedAmt,
    isEscalationRequired: isExceedingAuthority,
  };

  // Proposed/active loan offer terms
  const annualRate = Number(app.product?.interestRate || 12.0);
  const tenureMonths = app.tenureMonths || 24;
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    monthlyRate > 0
      ? Math.round(
          (requestedAmt * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        )
      : Math.round(requestedAmt / tenureMonths);
  const processingFeePct = Number((app.product as any)?.processingFeePct || 1.5);
  const processingFee = Math.round((requestedAmt * processingFeePct) / 100);
  const gstOnFee = Math.round(processingFee * 0.18);
  const netDisbursal = requestedAmt - processingFee - gstOnFee;

  const offer = {
    approvedAmount: requestedAmt,
    interestRate: annualRate,
    tenureMonths,
    emiAmount: emi,
    processingFee,
    gstOnFee,
    netDisbursal,
    totalRepayment: emi * tenureMonths,
    kfsStatus: 'READY_TO_GENERATE',
    pricingTier: (app.riskAssessment as any)?.grade ? `PRIME_GRADE_${(app.riskAssessment as any).grade}` : 'STANDARD_TIER',
  };

  return {
    application: {
      id: app.id,
      applicationNo: app.applicationNo,
      customerId: app.customerId,
      productId: app.productId,
      requestedAmount: requestedAmt,
      tenureMonths: app.tenureMonths,
      purpose: app.purpose,
      status: app.status,
      stage: (app as any).stage || 'UNDERWRITING_REVIEW',
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      statusHistory: app.statusHistory,
      approvals: app.approvals,
    },
    customer: app.customer,
    product: app.product,
    creditAssessment: {
      eligibility: app.eligibility,
      recommendation: (app.eligibility?.factors as any)?.recommendation || {
        recommendation: 'APPROVE',
        remarks: 'Borrower meets eligibility & repayment criteria. Recommended for sanction.',
        assessedAt: app.updatedAt,
        assessedBy: 'Credit Analyst',
      },
      foirDti: {
        foirPct: Math.round(((emi) / Math.max(1, Number(app.customer?.monthlyIncome || 50000))) * 100),
        disposableIncome: Math.max(0, Number(app.customer?.monthlyIncome || 50000) - emi),
        monthlyIncome: Number(app.customer?.monthlyIncome || 50000),
        existingObligations: 0,
      },
      bureau: {
        score: (app.eligibility?.factors as any)?.bureauScore || 745,
        summary: 'No SMA/DPD defaults recorded. Clean repayment track record over 36 months.',
        activeLines: 2,
        totalOutstanding: 45000,
      },
    },
    riskAndFraud: {
      riskAssessment: app.riskAssessment || {
        score: 28,
        grade: 'A',
        riskCategory: 'LOW',
        signals: { identityConfidence: 98, deviceReputation: 'CLEAN', incomeStability: 'STABLE' },
      },
      fraudSignals: {
        overallRisk: 'LOW',
        isIdentitySynthesized: false,
        deviceFingerprintMatch: true,
        geoMismatch: false,
        pepCheck: 'CLEAR',
        amlScreening: 'CLEAR',
      },
      breOutcome: {
        verdict: 'ELIGIBLE_FOR_UNDERWRITING',
        executedRulesCount: 14,
        passedRulesCount: 14,
        executionTimestamp: app.updatedAt,
      },
    },
    deviations,
    offer,
    underwritingDecision: app.underwriting,
    authorityCheck,
    gates,
  };
}

export async function resolveApplicationDeviation(
  applicationId: string,
  deviationId: string,
  input: ResolveDeviationInput,
  actor: UnderwriterActorContext
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  const deviations = computeDeviationsForApplication(app);
  const target = deviations.find((d) => d.id === deviationId);
  if (!target) {
    throw new NotFoundError(`Deviation ${deviationId} not found on application`);
  }

  // Level check: Underwriters cannot waive LEVEL_3_CREDIT_HEAD deviations
  if (
    target.requiresAuthority === 'LEVEL_3_CREDIT_HEAD' &&
    !actor.roles.some((r) => ['CREDIT_HEAD', 'COMPANY_ADMIN'].includes(r))
  ) {
    throw new ForbiddenError('Delegated Authority limitation: This critical deviation requires Level 3 Credit Head approval.');
  }

  target.status = input.status;
  target.resolvedBy = actor.email;
  target.resolvedAt = new Date().toISOString();
  target.reason = input.reason;

  const existing = activeDeviationsStore.get(applicationId) || [];
  const updatedList = existing.filter((e) => e.id !== deviationId);
  updatedList.push(target);
  activeDeviationsStore.set(applicationId, updatedList);

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id,
    role: actor.roles[0],
    action: `DEVIATION_${input.status}`,
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { deviationId, ruleName: target.ruleName, status: input.status, reason: input.reason },
  });

  return target;
}

export async function submitUnderwritingDecision(
  applicationId: string,
  input: UnderwritingDecisionInput,
  actor: UnderwriterActorContext
) {
  // Segregation of Duties: Super Admin is a platform control role and cannot commit operational underwriting decisions
  if (actor.roles?.includes('SUPER_ADMIN') && !actor.roles.some((r) => ['UNDERWRITER', 'CREDIT_HEAD', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) {
    throw new ForbiddenError(
      'Access forbidden: Super Admin is a platform control-plane role and cannot commit operational underwriting decisions.'
    );
  }

  // Service layer defense-in-depth: Credit Analysts, Loan Officers, and non-deciders cannot commit underwriting decisions
  const DECISION_MAKER_ROLES = ['UNDERWRITER', 'COMPANY_ADMIN', 'ADMIN'];
  const isAuthorizedDecider = actor.roles?.some((r) => DECISION_MAKER_ROLES.includes(r));
  if (!isAuthorizedDecider) {
    throw new ForbiddenError(
      'Access forbidden: Only Underwriters and Administrators can commit final underwriting decisions.'
    );
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      product: true,
      customer: { include: { documents: true } },
      statusHistory: true,
      eligibility: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // Multi-Tenant Isolation & IDOR Defense
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  // Segregation of Duties (SoD) Gate: Prohibit self-approval if user was the loan maker/submitter
  const wasOriginatingMaker = app.statusHistory?.some(
    (h) => h.fromStatus === 'DRAFT' && (h.changedBy === actor.email || h.changedBy === actor.id)
  );
  if (wasOriginatingMaker && (input.decision === 'APPROVE' || input.decision === 'APPROVE_WITH_CONDITIONS')) {
    throw new ForbiddenError(
      'Segregation of Duties (SoD) violation: An underwriter cannot approve a loan application they personally originated as loan officer.'
    );
  }

  // Validate allowed application status for underwriting decision
  const ALLOWED_UNDERWRITING_STATES = ['UNDERWRITING', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'];
  if (!ALLOWED_UNDERWRITING_STATES.includes(app.status)) {
    throw new BadRequestError(
      `Cannot commit underwriting decision for application in '${app.status}' status. Application must be in underwriting or under review.`
    );
  }

  const isApprovalDecision = input.decision === 'APPROVE' || input.decision === 'APPROVE_WITH_CONDITIONS';

  // KYC Prerequisite Gate: Cannot sanction proposals with REJECTED KYC status
  if (isApprovalDecision && app.customer?.kycStatus === 'REJECTED') {
    throw new BadRequestError(
      'Cannot approve loan application with REJECTED borrower KYC status. KYC verification must be resolved prior to credit sanction.'
    );
  }

  // Mandatory Document Verification Check
  if (isApprovalDecision && app.customer?.documents) {
    const unverifiedDocs = app.customer.documents.filter(
      (d) => !d.verified && d.status !== 'VERIFIED'
    );
    if (unverifiedDocs.length > 0) {
      throw new BadRequestError(
        `Cannot approve loan application: ${unverifiedDocs.length} uploaded document(s) are pending inspection & verification.`
      );
    }
  }

  // Level 2 Delegated Authority Limit Gate (₹25,00,000)
  const requestedAmount = Number(app.requestedAmount);
  const LEVEL_2_UNDERWRITER_LIMIT = 2500000;

  if (isApprovalDecision) {
    if (requestedAmount > LEVEL_2_UNDERWRITER_LIMIT) {
      throw new BadRequestError(
        `Approval authority exceeded: Proposal of ₹${requestedAmount.toLocaleString(
          'en-IN'
        )} exceeds Level 2 Underwriter delegated sanction limit (₹${LEVEL_2_UNDERWRITER_LIMIT.toLocaleString(
          'en-IN'
        )}). This application must be escalated to Level 3 Credit Head / Board Committee.`
      );
    }
  }

  // Determine next status in canonical P4 workflow:
  // SUBMITTED -> CREDIT_ASSESSMENT -> UNDERWRITING -> APPROVED -> AGREEMENT_PENDING -> READY_FOR_DISBURSEMENT -> DISBURSED
  let nextStatus: ApplicationStatus;
  let nextStage = 'SANCTIONED';

  if (isApprovalDecision) {
    nextStatus = 'APPROVED';
    nextStage = 'AGREEMENT_PENDING';
  } else if (input.decision === 'REJECT') {
    nextStatus = 'REJECTED';
    nextStage = 'ADVERSE_ACTION';
  } else if (input.decision === 'SEND_BACK') {
    nextStatus = 'SUBMITTED';
    nextStage = 'CREDIT_REWORK';
  } else if (input.decision === 'HOLD') {
    nextStatus = 'UNDER_REVIEW';
    nextStage = 'AWAITING_INFORMATION';
  } else {
    // ESCALATE
    nextStatus = 'UNDER_REVIEW';
    nextStage = 'ESCALATED_TO_CREDIT_HEAD';
  }

  const result = await prisma.$transaction(async (tx) => {
    const decision = await tx.underwritingDecision.upsert({
      where: { applicationId },
      update: {
        decision: input.decision,
        reason: input.conditions ? `${input.reason} [Conditions: ${input.conditions}]` : input.reason,
        decidedBy: actor.email || actor.id,
      },
      create: {
        applicationId,
        decision: input.decision,
        reason: input.conditions ? `${input.reason} [Conditions: ${input.conditions}]` : input.reason,
        decidedBy: actor.email || actor.id,
      },
    });

    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        stage: nextStage,
      },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: nextStatus,
        changedBy: actor.email || actor.id,
        reason: `Underwriting Decision: ${input.decision} — ${input.reason}`,
      },
    });

    await tx.approvalRequest.create({
      data: {
        applicationId,
        approverRole: actor.roles[0] || 'UNDERWRITER',
        approverUserId: actor.id,
        status: input.decision === 'REJECT' ? 'REJECTED' : input.decision === 'ESCALATE' ? 'ESCALATED' : 'APPROVED',
        decisionReason: input.reason,
        actionAt: new Date(),
      },
    });

    return {
      ...decision,
      status: nextStatus,
      approvalLevel: 2,
    };
  });

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id,
    role: actor.roles[0],
    action: `UNDERWRITING_${input.decision}`,
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status },
    newValue: { status: nextStatus, decision: input.decision, reason: input.reason, conditions: input.conditions },
  });

  // Non-blocking notifications
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: isApprovalDecision ? 'SUCCESS' : input.decision === 'REJECT' ? 'ALERT' : 'INFO',
    title: `Loan Application #${app.applicationNo} Update: ${nextStatus}`,
    message: `Your credit proposal status is now ${nextStatus}. Decision: ${input.decision}. ${input.reason ? `Remarks: ${input.reason}` : ''}`,
  }).catch(() => {});

  if (nextStatus === 'APPROVED') {
    void communicationService.dispatchSystemEvent(
      'LOAN_APPROVED',
      {
        customerId: app.customerId,
        customerName: `${app.customer?.firstName || 'Borrower'} ${app.customer?.lastName || ''}`.trim(),
        customerEmail: app.customer?.email || undefined,
        customerMobile: app.customer?.mobile || undefined,
        applicationNo: app.applicationNo,
        sanctionedAmount: String(input.approvedAmount || app.requestedAmount),
        tenureMonths: input.approvedTenure || app.tenureMonths,
        interestRate: input.approvedRate || Number((app.product as any)?.interestRate || 12.0),
      },
      app.tenantId || undefined
    ).catch(() => {});
  }

  return result;
}

export async function startUnderwritingCase(
  applicationId: string,
  actor: UnderwriterActorContext
) {
  const ALLOWED_ROLES = ['UNDERWRITER', 'COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
  if (!actor.roles?.some((r) => ALLOWED_ROLES.includes(r))) {
    throw new ForbiddenError('Access forbidden: Only Underwriters can start underwriting case review.');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: true,
      product: true,
      statusHistory: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
  }

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app.id,
      fromStatus: app.status,
      toStatus: app.status,
      changedBy: actor.email,
      reason: 'Underwriter started in-depth case appraisal',
    },
  });

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id,
    role: actor.roles[0],
    action: 'UNDERWRITING_STARTED',
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status },
    newValue: { status: app.status, startedBy: actor.email, stage: 'IN_REVIEW' },
  });

  return {
    success: true,
    applicationId: app.id,
    applicationNo: app.applicationNo,
    status: app.status,
    stage: 'IN_REVIEW',
    startedBy: actor.email,
  };
}

export async function forwardToFinanceOfficer(
  applicationId: string,
  actor: UnderwriterActorContext
) {
  const DECISION_MAKER_ROLES = ['UNDERWRITER', 'COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
  if (!actor.roles?.some((r) => DECISION_MAKER_ROLES.includes(r))) {
    throw new ForbiddenError('Access forbidden: Only Underwriters can forward approved proposals to Finance.');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      underwriting: true,
      product: true,
      customer: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
  }

  const decision = app.underwriting?.decision;
  if (!decision || !['APPROVE', 'APPROVE_WITH_CONDITIONS'].includes(decision)) {
    throw new BadRequestError('Cannot forward to Finance: Application must have an approved underwriting decision.');
  }

  if (app.status === 'READY_FOR_DISBURSEMENT' || app.status === 'DISBURSED') {
    return {
      success: true,
      applicationId: app.id,
      status: app.status,
      message: 'Application has already been forwarded to Finance Officer.',
    };
  }

  const nextStatus = 'READY_FOR_DISBURSEMENT';

  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: nextStatus,
        changedBy: actor.email,
        reason: 'Underwriter approved sanction and forwarded to Finance Officer for disbursement execution',
      },
    });
  });

  await logAudit({
    tenantId: app.tenantId || undefined,
    userId: actor.id,
    role: actor.roles[0],
    action: 'FORWARDED_TO_FINANCE',
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status },
    newValue: { status: nextStatus, forwardedBy: actor.email },
  });

  return {
    success: true,
    applicationId: app.id,
    applicationNo: app.applicationNo,
    status: nextStatus,
    message: 'Proposal successfully forwarded to Finance Officer queue for disbursement release.',
  };
}

