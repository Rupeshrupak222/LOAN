import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type { BranchManagerDecisionInput } from './branch-manager.schema';

export const BRANCH_MANAGER_LIMIT = 500000; // ₹5,00,000 (₹5 Lakhs) Delegated Approval Authority Limit

/**
 * Returns Branch Applications Queue with live management-level metrics
 */
export async function getBranchManagerQueue(
  actor: { id: string; email: string; roles: string[] },
  tab?: string
) {
  // Identify user's branch
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { branchId: true },
  });

  const isGlobalAdmin = actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
  const branchId = user?.branchId;

  const whereClause: any = {
    status: {
      notIn: ['DRAFT', 'CANCELLED'],
    },
  };

  // If Branch Manager is tied to a specific branch, filter by branch (including unassigned)
  if (!isGlobalAdmin && branchId) {
    whereClause.OR = [
      { branchId },
      { customer: { branchId } },
      { branchId: null },
    ];
  }

  const allApps = await prisma.loanApplication.findMany({
    where: whereClause,
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
          mobile: true,
          email: true,
          branchId: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              status: true,
              category: true,
              fileName: true,
              storageKey: true,
              contentType: true,
              sizeBytes: true,
              createdAt: true,
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
      underwriting: true,
      approvals: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Helper predicates matching specification
  const isTerminal = (a: any) => ['APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED'].includes(a.status);

  const isPendingReview = (a: any) => {
    if (isTerminal(a)) return false;
    if (!a.eligibility) return false;
    const latestBmApproval = a.approvals?.find((app: any) => app.approverRole === 'BRANCH_MANAGER');
    if (latestBmApproval && ['APPROVED', 'ESCALATED', 'SENT_BACK'].includes(latestBmApproval.status)) {
      return false;
    }
    return true;
  };

  const isApprovedWithinLimit = (a: any) =>
    a.approvals?.some((app: any) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'APPROVED');

  const isSentBack = (a: any) => {
    const latestBmApproval = a.approvals?.find((app: any) => app.approverRole === 'BRANCH_MANAGER');
    return latestBmApproval?.status === 'SENT_BACK';
  };

  const isEscalated = (a: any) =>
    a.approvals?.some((app: any) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'ESCALATED');

  const isAwaitingCredit = (a: any) => {
    if (isTerminal(a)) return false;
    return !a.eligibility;
  };

  // Calculate live management-level metrics
  const totalBranchApplications = allApps.length;
  const pendingManagerReview = allApps.filter(isPendingReview).length;
  const approvedWithinLimit = allApps.filter(isApprovedWithinLimit).length;
  const sentBackForCorrection = allApps.filter(isSentBack).length;
  const escalatedToUnderwriter = allApps.filter(isEscalated).length;

  const awaitingDocuments = allApps.filter(
    (a) =>
      a.customer?.kycStatus === 'PENDING' ||
      a.customer?.documents?.some(
        (d: any) => d.status === 'PENDING' || (d.status as string) === 'REQUIRES_CORRECTION'
      )
  ).length;

  const awaitingCreditAssessment = allApps.filter(isAwaitingCredit).length;

  // Filter items by tab
  let items = allApps;
  if (tab === 'PENDING') {
    items = allApps.filter(isPendingReview);
  } else if (tab === 'APPROVED') {
    items = allApps.filter(isApprovedWithinLimit);
  } else if (tab === 'SENT_BACK') {
    items = allApps.filter(isSentBack);
  } else if (tab === 'ESCALATED') {
    items = allApps.filter(isEscalated);
  } else if (tab === 'AWAITING_CREDIT') {
    items = allApps.filter(isAwaitingCredit);
  }

  // Enrich each item with computed reviewStatus, FOIR/DTI, risk metrics, and delegated authority checks
  const enrichedItems = items.map((app) => {
    const monthlyIncome = Number(app.customer?.monthlyIncome || 0);
    const existingDebt = Number(app.customer?.existingObligations || 0);
    const eligibilityFactors = (app.eligibility?.factors as any) || {};

    const foirPct =
      eligibilityFactors.foirPct != null
        ? Number(eligibilityFactors.foirPct)
        : monthlyIncome > 0
        ? Math.round((existingDebt / monthlyIncome) * 100)
        : 0;

    const dtiPct =
      eligibilityFactors.dtiPct != null
        ? Number(eligibilityFactors.dtiPct)
        : foirPct;

    let creditScore = 750;
    if (app.riskAssessment?.score != null) {
      creditScore = 500 + Math.round((app.riskAssessment.score / 100) * 350);
    } else if (eligibilityFactors.creditScore != null) {
      creditScore = Number(eligibilityFactors.creditScore);
    }

    const riskGrade =
      app.riskAssessment?.category ||
      app.customer?.riskCategory ||
      eligibilityFactors.riskGrade ||
      'LOW';

    const bmApproval = app.approvals?.find((ap: any) => ap.approverRole === 'BRANCH_MANAGER');

    let reviewStatus = 'PENDING_BRANCH_MANAGER_REVIEW';
    if (bmApproval?.status === 'APPROVED') {
      reviewStatus = 'BRANCH_MANAGER_APPROVED';
    } else if (bmApproval?.status === 'SENT_BACK') {
      reviewStatus = 'RETURNED_FOR_CORRECTION';
    } else if (bmApproval?.status === 'ESCALATED') {
      reviewStatus = 'ESCALATED_TO_UNDERWRITER';
    } else if (!app.eligibility) {
      reviewStatus = 'AWAITING_CREDIT_ASSESSMENT';
    } else if (!['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(app.status)) {
      reviewStatus = app.status;
    }

    const requestedAmountNum = Number(app.requestedAmount || 0);
    const isWithinLimit = requestedAmountNum <= BRANCH_MANAGER_LIMIT;
    const isTerminalStatus = ['APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED'].includes(app.status);
    const creditAssessmentCompleted = !!app.eligibility;
    const isAlreadyReviewed = !!bmApproval && ['APPROVED', 'ESCALATED', 'SENT_BACK'].includes(bmApproval.status);
    const canApprove =
      isWithinLimit &&
      creditAssessmentCompleted &&
      !isTerminalStatus &&
      !isAlreadyReviewed &&
      reviewStatus === 'PENDING_BRANCH_MANAGER_REVIEW';

    return {
      ...app,
      creditScore,
      riskGrade,
      foirPct,
      dtiPct,
      creditAnalystRecommendation:
        (app.eligibility as any)?.recommendation ||
        app.eligibility?.result ||
        'AWAITING_ASSESSMENT',
      reviewStatus,
      isWithinLimit,
      canApprove,
      delegatedApprovalLimit: BRANCH_MANAGER_LIMIT,
    };
  });

  return {
    metrics: {
      totalBranchApplications,
      pendingManagerReview,
      approvedWithinLimit,
      sentBackForCorrection,
      escalatedToUnderwriter,
      awaitingDocuments,
      awaitingCreditAssessment,
      delegatedLimit: BRANCH_MANAGER_LIMIT,
    },
    items: enrichedItems,
  };
}

/**
 * Submits a Branch Manager decision (APPROVE, SEND_BACK, or ESCALATE)
 */
export async function submitBranchManagerDecision(
  applicationId: string,
  input: BranchManagerDecisionInput,
  actor: { id: string; email: string; roles: string[] }
) {
  // 1. RBAC Verification
  const isAuthorized = actor.roles.some((r) =>
    ['BRANCH_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      'Access forbidden: Only Branch Managers or Administrators can record branch management decisions.'
    );
  }

  // 2. Fetch actor branch & application
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { branchId: true },
  });

  const isGlobalAdmin = actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: true,
      product: true,
      eligibility: true,
      riskAssessment: true,
      approvals: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!app) {
    throw new NotFoundError(`Loan application with ID '${applicationId}' not found.`);
  }

  // 3. Strict Branch Scoping Check
  // The Branch Manager must NOT see or act on applications belonging to unauthorized branches
  if (!isGlobalAdmin && user?.branchId) {
    const appBranchId = app.branchId || app.customer?.branchId;
    if (appBranchId && appBranchId !== user.branchId) {
      throw new ForbiddenError(
        'Access forbidden: This application belongs to another branch and is outside your authorized jurisdiction.'
      );
    }
  }

  // 4. Workflow Stage Verification
  const terminalStages: ApplicationStatus[] = ['APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED'];
  if (terminalStages.includes(app.status)) {
    throw new BadRequestError(
      `Application is in terminal '${app.status}' state and cannot receive branch management review actions.`
    );
  }

  // Check if a Branch Manager decision has already been recorded (Prevent duplicate decisions)
  const existingApproval = app.approvals?.find(
    (a) => a.approverRole === 'BRANCH_MANAGER' && ['APPROVED', 'ESCALATED'].includes(a.status)
  );
  if (existingApproval) {
    throw new BadRequestError(
      `A Branch Manager review decision (${existingApproval.status}) has already been recorded for this application.`
    );
  }

  // 5. Evaluate Decision & Enforce Delegated Authority
  const requestedAmount = Number(app.requestedAmount);
  let nextApplicationStatus: ApplicationStatus = app.status;
  let nextStage = 'UNDERWRITING';
  let historyReason = '';
  let approvalRequestStatus = '';
  let auditAction = '';

  const remarksText = (input.remarks || input.reason || input.managerRemarks || '').trim();
  if (remarksText.length < 10) {
    throw new BadRequestError('A mandatory remark/reason (minimum 10 characters) is required to record a Branch Manager decision.');
  }

  if (input.decision === 'APPROVE') {
    // 5a. Delegated Limit Validation
    if (requestedAmount > BRANCH_MANAGER_LIMIT) {
      throw new ForbiddenError(
        `Loan amount (₹${requestedAmount.toLocaleString('en-IN')}) exceeds your delegated approval limit of ₹${BRANCH_MANAGER_LIMIT.toLocaleString('en-IN')}. Please escalate this proposal to the Underwriter.`
      );
    }

    // 5b. Prerequisite: Credit Analyst evaluation must be completed
    if (!app.eligibility) {
      throw new BadRequestError(
        'Credit Analyst assessment must be completed before Branch Manager approval can be recorded.'
      );
    }

    if (['DRAFT', 'SUBMITTED'].includes(app.status)) {
      throw new BadRequestError(
        'Application has not completed the prerequisite Credit Assessment stage. Approval is not permitted.'
      );
    }

    nextApplicationStatus = 'UNDERWRITING';
    nextStage = 'UNDERWRITING';
    historyReason = `Branch Manager Approved (Within Delegated Limit ₹${BRANCH_MANAGER_LIMIT.toLocaleString('en-IN')}) — Forwarded to Underwriter: ${remarksText}`;
    approvalRequestStatus = 'APPROVED';
    auditAction = 'BRANCH_MANAGER_APPROVED';
  } else if (input.decision === 'SEND_BACK') {
    nextApplicationStatus = 'SUBMITTED';
    nextStage = 'REWORK';
    historyReason = `Sent Back for Correction by Branch Manager: ${remarksText}`;
    approvalRequestStatus = 'SENT_BACK';
    auditAction = 'BRANCH_MANAGER_SENT_BACK';
  } else if (input.decision === 'ESCALATE') {
    nextApplicationStatus = 'UNDERWRITING';
    nextStage = 'UNDERWRITING';
    historyReason = `Escalated to Underwriter by Branch Manager: ${remarksText}`;
    approvalRequestStatus = 'ESCALATED';
    auditAction = 'BRANCH_MANAGER_ESCALATED';
  }

  // 6. Concurrently execute updates
  const [approvalReq] = await Promise.all([
    prisma.approvalRequest.create({
      data: {
        applicationId,
        approverRole: 'BRANCH_MANAGER',
        approverUserId: actor.id,
        level: 2,
        status: approvalRequestStatus,
        decisionReason: remarksText,
        actionAt: new Date(),
      },
    }),

    prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: nextApplicationStatus,
        stage: nextStage,
      },
    }),

    prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: nextApplicationStatus,
        changedBy: actor.email,
        reason: historyReason,
      },
    }),

    logAudit({
      userId: actor.id,
      role: 'BRANCH_MANAGER',
      action: auditAction,
      entity: 'LoanApplication',
      entityId: applicationId,
      previousValue: {
        status: app.status,
        stage: app.stage,
      },
      newValue: {
        decision: input.decision,
        status: nextApplicationStatus,
        stage: nextStage,
        requestedAmount,
        delegatedLimit: BRANCH_MANAGER_LIMIT,
        remarks: remarksText,
      },
    }),
  ]);

  // 5. Async notification
  void sendNotification({
    customerId: app.customerId,
    title: `Branch Management Review: ${input.decision.replace(/_/g, ' ')}`,
    message: historyReason,
    type: input.decision === 'APPROVE' ? 'SUCCESS' : input.decision === 'SEND_BACK' ? 'ALERT' : 'INFO',
    metadata: { applicationId, link: `/applications/${applicationId}` },
  });

  return {
    success: true,
    applicationId,
    decision: input.decision,
    applicationStatus: nextApplicationStatus,
    approvalRequestId: approvalReq.id,
    delegatedLimit: BRANCH_MANAGER_LIMIT,
    requestedAmount,
  };
}
