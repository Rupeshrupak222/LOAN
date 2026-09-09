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

  // Calculate live management-level metrics
  const totalBranchApplications = allApps.length;

  const pendingManagerReview = allApps.filter((a) => {
    const hasBmApproval = a.approvals?.some(
      (app) => app.approverRole === 'BRANCH_MANAGER' && ['APPROVED', 'ESCALATED'].includes(app.status)
    );
    return (
      !hasBmApproval &&
      !!a.eligibility &&
      ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(a.status)
    );
  }).length;

  const approvedWithinLimit = allApps.filter((a) =>
    a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'APPROVED')
  ).length;

  const sentBackForCorrection = allApps.filter((a) =>
    a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'SENT_BACK')
  ).length;

  const escalatedToUnderwriter = allApps.filter((a) =>
    a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'ESCALATED')
  ).length;

  const awaitingDocuments = allApps.filter(
    (a) =>
      a.customer?.kycStatus === 'PENDING' ||
      a.customer?.documents?.some(
        (d) => d.status === 'PENDING' || (d.status as string) === 'REQUIRES_CORRECTION'
      )
  ).length;

  const awaitingCreditAssessment = allApps.filter((a) => !a.eligibility).length;

  // Filter items by tab
  let items = allApps;
  if (tab === 'PENDING') {
    items = allApps.filter((a) => {
      const hasBmApproval = a.approvals?.some(
        (app) => app.approverRole === 'BRANCH_MANAGER' && ['APPROVED', 'ESCALATED'].includes(app.status)
      );
      return (
        !hasBmApproval &&
        !!a.eligibility &&
        ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(a.status)
      );
    });
  } else if (tab === 'APPROVED') {
    items = allApps.filter((a) =>
      a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'APPROVED')
    );
  } else if (tab === 'SENT_BACK') {
    items = allApps.filter((a) =>
      a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'SENT_BACK')
    );
  } else if (tab === 'ESCALATED') {
    items = allApps.filter((a) =>
      a.approvals?.some((app) => app.approverRole === 'BRANCH_MANAGER' && app.status === 'ESCALATED')
    );
  } else if (tab === 'AWAITING_CREDIT') {
    items = allApps.filter((a) => !a.eligibility);
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

    const bmApproval = app.approvals?.find((ap) => ap.approverRole === 'BRANCH_MANAGER');

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
    const previousStageCompleted = !['DRAFT', 'SUBMITTED', 'CANCELLED', 'REJECTED', 'APPROVED', 'DISBURSED'].includes(app.status);
    const creditAssessmentCompleted = !!app.eligibility;
    const canApprove =
      isWithinLimit &&
      creditAssessmentCompleted &&
      previousStageCompleted &&
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
    ['BRANCH_MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes(r)
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

  // 5. Evaluate Decision & Enforce Delegated Authority
  const requestedAmount = Number(app.requestedAmount);
  let nextApplicationStatus: ApplicationStatus = app.status;
  let historyReason = '';
  let approvalRequestStatus = '';
  let auditAction = '';

  const remarksText = (input.remarks || input.reason || input.managerRemarks || '').trim();

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
    historyReason = `Branch Approved Within Delegated Limit (₹${BRANCH_MANAGER_LIMIT.toLocaleString('en-IN')}) & Sent to Underwriter${
      remarksText ? ': ' + remarksText : ''
    }`;
    approvalRequestStatus = 'APPROVED';
    auditAction = 'BRANCH_MANAGER_APPROVED_AND_FORWARDED_TO_UNDERWRITER';
  } else if (input.decision === 'SEND_BACK') {
    if (remarksText.length < 10) {
      throw new BadRequestError('A mandatory reason/remark (at least 10 characters) is required to send back an application for correction.');
    }
    nextApplicationStatus = 'SUBMITTED';
    historyReason = `Sent Back for Correction by Branch Manager — ${remarksText}`;
    approvalRequestStatus = 'SENT_BACK';
    auditAction = 'BRANCH_MANAGER_SENT_BACK';
  } else if (input.decision === 'ESCALATE') {
    if (remarksText.length < 10) {
      throw new BadRequestError('A mandatory escalation reason/remark (at least 10 characters) is required to escalate to Underwriting.');
    }
    nextApplicationStatus = 'UNDERWRITING';
    historyReason = `Escalated to Underwriter by Branch Manager — ${remarksText}`;
    approvalRequestStatus = 'ESCALATED';
    auditAction = 'BRANCH_MANAGER_ESCALATED_TO_UNDERWRITER';
  }

  // 4. Concurrently execute updates
  const [approvalReq, updatedApp] = await Promise.all([
    prisma.approvalRequest.create({
      data: {
        applicationId,
        approverRole: 'BRANCH_MANAGER',
        approverUserId: actor.id,
        level: 2,
        status: approvalRequestStatus,
        decisionReason: remarksText || 'Management approval within limit',
        actionAt: new Date(),
      },
    }),

    prisma.loanApplication.update({
      where: { id: applicationId },
      data: { status: nextApplicationStatus },
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
      newValue: {
        decision: input.decision,
        status: nextApplicationStatus,
        requestedAmount,
        delegatedLimit: BRANCH_MANAGER_LIMIT,
        reason: input.reason,
        remarks: input.managerRemarks,
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
