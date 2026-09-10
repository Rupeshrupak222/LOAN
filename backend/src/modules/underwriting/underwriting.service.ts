import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { communicationService } from '../communication/communication.service';
import type { UnderwritingDecisionInput } from './underwriting.schema';

export async function getUnderwritingQueue(
  tab?: string,
  actor?: { id?: string; roles?: string[]; tenantId?: string; branchId?: string }
) {
  let where: any = {};
  if (tab === 'PENDING') {
    where = { status: 'UNDERWRITING' };
  } else if (tab === 'APPROVED') {
    where = { status: { in: ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'] } };
  } else if (tab === 'REJECTED') {
    where = { status: 'REJECTED' };
  } else {
    // Default: fetch all applications that have been forwarded to Underwriting or have Underwriting records
    where = {
      OR: [
        { status: 'UNDERWRITING' },
        { underwriting: { isNot: null } },
        { status: { in: ['APPROVED', 'REJECTED'] } },
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

  return prisma.loanApplication.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, customerCode: true, monthlyIncome: true, kycStatus: true, riskCategory: true } },
      product: { select: { name: true, code: true, productType: true, interestRate: true } },
      eligibility: true,
      riskAssessment: true,
      approvals: { orderBy: { createdAt: 'desc' } },
      underwriting: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function submitUnderwritingDecision(
  applicationId: string,
  input: UnderwritingDecisionInput,
  actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string }
) {
  // Service layer defense-in-depth: Credit Analysts, System Admins, Super Admins, Branch Managers, and non-deciders cannot commit underwriting decisions
  const DECISION_MAKER_ROLES = ['UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'];
  const isAuthorizedDecider = actor.roles?.some((r) => DECISION_MAKER_ROLES.includes(r));
  if (!isAuthorizedDecider) {
    throw new ForbiddenError(
      'Access forbidden: Only Underwriters and Administrators can commit final underwriting decisions.'
    );
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { product: true, customer: { include: { documents: true } } },
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

  // Validate allowed application status for underwriting decision
  const ALLOWED_UNDERWRITING_STATES = ['UNDERWRITING', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'];
  if (!ALLOWED_UNDERWRITING_STATES.includes(app.status)) {
    throw new BadRequestError(
      `Cannot commit underwriting decision for application in '${app.status}' status. Application must be under review or in underwriting queue.`
    );
  }

  const isApprovalDecision = input.decision === 'APPROVE' || input.decision === 'APPROVE_WITH_CONDITIONS';

  // KYC Prerequisite Gate: Cannot sanction proposals with REJECTED KYC status
  if (isApprovalDecision && app.customer?.kycStatus === 'REJECTED') {
    throw new BadRequestError(
      'Cannot approve loan application with REJECTED borrower KYC status. KYC verification must be resolved prior to credit sanction.'
    );
  }

  // Mandatory Document Verification Check for Forwarding to Finance Officer
  if (isApprovalDecision && app.customer?.documents) {
    const unverifiedDocs = app.customer.documents.filter(
      (d) => !d.verified && d.status !== 'VERIFIED'
    );
    if (unverifiedDocs.length > 0) {
      throw new BadRequestError(
        `Cannot approve & forward loan application to Finance Officer. ${unverifiedDocs.length} uploaded document(s) are pending verification. Please verify all borrower documents first.`
      );
    }
  }

  // Verify approval limits from SystemSetting (applies strictly to both APPROVE and APPROVE_WITH_CONDITIONS)
  const requestedAmount = Number(app.requestedAmount);
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'approval_limits' } });
  const limits = (setting?.value as any[]) || [];

  const matchedTier = limits.find(
    (l) => l.maxAmount === null || requestedAmount <= Number(l.maxAmount)
  );
  if (matchedTier && isApprovalDecision) {
    const requiredRoles: string[] = matchedTier.chain || [];
    const hasAuthority = actor.roles?.some((r) => requiredRoles.includes(r));
    if (!hasAuthority) {
      throw new BadRequestError(
        `Your role does not have approval limit authority for ₹${requestedAmount.toLocaleString(
          'en-IN'
        )}. Required roles: ${requiredRoles.join(', ')}`
      );
    }
  }

  let nextStatus: ApplicationStatus;
  if (input.decision === 'APPROVE' || input.decision === 'APPROVE_WITH_CONDITIONS') {
    nextStatus = 'APPROVED';
  } else if (input.decision === 'REJECT') {
    nextStatus = 'REJECTED';
  } else {
    // SEND_BACK
    nextStatus = 'SUBMITTED';
  }

  const result = await prisma.$transaction(async (tx) => {
    const decision = await tx.underwritingDecision.upsert({
      where: { applicationId },
      update: {
        decision: input.decision,
        reason: input.conditions ? `${input.reason} [Conditions: ${input.conditions}]` : input.reason,
        decidedBy: actor.email,
      },
      create: {
        applicationId,
        decision: input.decision,
        reason: input.conditions ? `${input.reason} [Conditions: ${input.conditions}]` : input.reason,
        decidedBy: actor.email,
      },
    });

    await tx.loanApplication.update({
      where: { id: applicationId },
      data: { status: nextStatus },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: nextStatus,
        changedBy: actor.email,
        reason: `Underwriting Decision: ${input.decision} — ${input.reason}`,
      },
    });

    await tx.approvalRequest.create({
      data: {
        applicationId,
        approverRole: actor.roles[0] || 'UNDERWRITER',
        approverUserId: actor.id,
        status: input.decision === 'REJECT' ? 'REJECTED' : 'APPROVED',
        decisionReason: input.reason,
        actionAt: new Date(),
      },
    });

    return decision;
  });

  await logAudit({
    userId: actor.id,
    role: actor.roles[0],
    action: `UNDERWRITING_${input.decision}`,
    entity: 'LoanApplication',
    entityId: applicationId,
    previousValue: { status: app.status },
    newValue: { status: nextStatus, decision: input.decision, reason: input.reason },
  });

  // Async non-blocking notification to applicant
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: input.decision === 'APPROVE' || input.decision === 'APPROVE_WITH_CONDITIONS' ? 'SUCCESS' : input.decision === 'REJECT' ? 'ALERT' : 'INFO',
    title: `Loan Application #${app.applicationNo} Update: ${nextStatus}`,
    message: `Your credit proposal has been updated to ${nextStatus}. Decision: ${input.decision}. ${input.reason ? `Remarks: ${input.reason}` : ''}`,
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
        sanctionedAmount: String(app.requestedAmount),
        tenureMonths: app.tenureMonths,
        interestRate: Number((app.product as any)?.interestRate || 12.0),
        emiAmount: String(app.requestedAmount ? Math.round(Number(app.requestedAmount) / (app.tenureMonths || 12)) : '4730'),
      },
      app.tenantId || undefined
    ).catch(() => {});
  } else if (nextStatus === 'REJECTED') {
    void communicationService.dispatchSystemEvent(
      'LOAN_REJECTED',
      {
        customerId: app.customerId,
        customerName: `${app.customer?.firstName || 'Borrower'} ${app.customer?.lastName || ''}`.trim(),
        customerEmail: app.customer?.email || undefined,
        customerMobile: app.customer?.mobile || undefined,
        applicationNo: app.applicationNo,
        rejectionReason: input.reason || 'Credit policy threshold criteria not met',
      },
      app.tenantId || undefined
    ).catch(() => {});
  }

  return result;
}
