import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type { UnderwritingDecisionInput } from './underwriting.schema';

export async function getUnderwritingQueue(tab?: string) {
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
  actor: { id: string; email: string; roles: string[] }
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { product: true, customer: true },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // Verify approval limits from SystemSetting
  const requestedAmount = Number(app.requestedAmount);
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'approval_limits' } });
  const limits = (setting?.value as any[]) || [];

  const matchedTier = limits.find(
    (l) => l.maxAmount === null || requestedAmount <= Number(l.maxAmount)
  );
  if (matchedTier && input.decision === 'APPROVE') {
    const requiredRoles: string[] = matchedTier.chain || [];
    const isSuper = actor.roles?.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    const hasAuthority = isSuper || actor.roles?.some((r) => requiredRoles.includes(r));
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

  return result;
}
