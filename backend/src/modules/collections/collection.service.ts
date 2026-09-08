import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import type { LogActivityInput, RecordPtpInput } from './collection.schema';

export interface CollectionActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

function isBranchScopedRole(roles?: string[]): boolean {
  if (!roles) return false;
  return roles.some((r) =>
    ['BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'COLLECTION_AGENT'].includes(r)
  );
}

function buildCollectionCaseScopeFilter(actor?: CollectionActorContext) {
  const loanFilter: any = {};
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      loanFilter.tenantId = actor.tenantId;
    }
    if (isBranchScopedRole(actor.roles) && actor.branchId) {
      loanFilter.branchId = actor.branchId;
    }
  }
  return Object.keys(loanFilter).length > 0 ? { loan: loanFilter } : {};
}

export async function getCollectionDashboard(actor?: CollectionActorContext) {
  const scopeFilter = buildCollectionCaseScopeFilter(actor);
  const cases = await prisma.collectionCase.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] },
      ...scopeFilter,
    },
    include: {
      loan: { select: { loanNo: true, principal: true, tenantId: true, branchId: true } },
      customer: { select: { firstName: true, lastName: true, mobile: true, customerCode: true } },
    },
  });

  const totalOverdue = cases.reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0));

  // Aging distribution breakdown
  const buckets: Record<string, { count: number; totalAmount: Decimal }> = {
    '0-30': { count: 0, totalAmount: new Decimal(0) },
    '31-60': { count: 0, totalAmount: new Decimal(0) },
    '61-90': { count: 0, totalAmount: new Decimal(0) },
    '91-180': { count: 0, totalAmount: new Decimal(0) },
    '180+': { count: 0, totalAmount: new Decimal(0) },
  };

  cases.forEach((c) => {
    const b = buckets[c.agingBucket] || buckets['0-30'];
    b.count += 1;
    b.totalAmount = b.totalAmount.plus(c.overdueAmount);
  });

  const ptpCount = await prisma.promiseToPay.count({
    where: {
      status: 'PENDING',
      collectionCase: scopeFilter,
    },
  });

  return {
    summary: {
      activeCases: cases.length,
      totalOverdueAmount: Money.toDb(totalOverdue),
      pendingPtps: ptpCount,
    },
    agingBuckets: Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      count: data.count,
      totalAmount: Money.toDb(data.totalAmount),
    })),
  };
}

export async function listCollectionCases(
  params: PageParams,
  bucket?: string,
  status?: string,
  actor?: CollectionActorContext
) {
  const where: any = {};
  if (bucket) where.agingBucket = bucket;
  if (status) where.status = status;

  const scopeFilter = buildCollectionCaseScopeFilter(actor);
  if (scopeFilter.loan) {
    where.loan = { ...(where.loan || {}), ...scopeFilter.loan };
  }

  if (params.search) {
    where.OR = [
      { caseNo: { contains: params.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { mobile: { contains: params.search } } },
      { loan: { loanNo: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.collectionCase.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { dpd: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true, city: true } },
        loan: { select: { loanNo: true, emiAmount: true, nextDueDate: true, tenantId: true, branchId: true } },
        _count: { select: { activities: true, promises: true } },
      },
    }),
    prisma.collectionCase.count({ where }),
  ]);

  return {
    data: rows.map((c) => ({
      id: c.id,
      caseNo: c.caseNo,
      loanNo: c.loan.loanNo,
      customerName: `${c.customer.firstName} ${c.customer.lastName}`,
      customerCode: c.customer.customerCode,
      mobile: c.customer.mobile,
      city: c.customer.city,
      dpd: c.dpd,
      agingBucket: c.agingBucket,
      overdueAmount: c.overdueAmount.toFixed(2),
      status: c.status,
      priority: c.priority,
      activitiesCount: c._count.activities,
      promisesCount: c._count.promises,
      createdAt: c.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getCollectionCaseDetail(id: string, actor?: CollectionActorContext) {
  const colCase = await prisma.collectionCase.findUnique({
    where: { id },
    include: {
      customer: {
        include: { addresses: true, employmentDetails: true },
      },
      loan: {
        include: {
          product: true,
          schedule: {
            where: { status: { in: ['OVERDUE', 'DUE'] } },
            orderBy: { emiNumber: 'asc' },
          },
        },
      },
      activities: { orderBy: { createdAt: 'desc' } },
      promises: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!colCase) throw new NotFoundError('Collection case not found');

  // Anti-IDOR: Enforce Tenant & Branch Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Collection case belongs to another institution');
    }
    if (
      isBranchScopedRole(actor.roles) &&
      actor.branchId &&
      colCase.loan.branchId &&
      colCase.loan.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Collection case belongs to a different branch');
    }
  }

  return colCase;
}

export async function logCollectionActivity(
  input: LogActivityInput,
  actor: CollectionActorContext
) {
  if (actor.roles && actor.roles.length > 0) {
    const isAuthorized = actor.roles.some((r) =>
      ['COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
    );
    if (!isAuthorized) {
      throw new ForbiddenError('Access forbidden: Only Collection Officers, Agents, Branch Managers, or Administrators can log recovery activities');
    }
  }

  const colCase = await prisma.collectionCase.findUnique({
    where: { id: input.caseId },
    include: { loan: true },
  });
  if (!colCase) throw new NotFoundError('Collection case not found');

  // Anti-IDOR: Enforce Tenant & Branch Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Cannot log activity on another institution collection case');
    }
    if (
      isBranchScopedRole(actor.roles) &&
      actor.branchId &&
      colCase.loan.branchId &&
      colCase.loan.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Cannot log activity on a different branch collection case');
    }
  }

  const activity = await prisma.collectionActivity.create({
    data: {
      caseId: input.caseId,
      activityType: input.activityType,
      outcome: input.outcome,
      notes: input.notes,
      nextFollowUpDate: input.nextFollowUpDate,
      performedBy: actor.email || 'system',
    },
  });

  await logAudit({
    userId: actor.id,
    action: 'COLLECTION_ACTIVITY_LOGGED',
    entity: 'CollectionCase',
    entityId: input.caseId,
    newValue: {
      type: input.activityType,
      outcome: input.outcome,
      notes: input.notes,
      tenantId: colCase.loan.tenantId,
      branchId: colCase.loan.branchId,
      performedBy: actor.email,
    },
  });

  return activity;
}

export async function recordPromiseToPay(
  input: RecordPtpInput,
  actor: CollectionActorContext
) {
  if (actor.roles && actor.roles.length > 0) {
    const isAuthorized = actor.roles.some((r) =>
      ['COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
    );
    if (!isAuthorized) {
      throw new ForbiddenError('Access forbidden: Only Collection Officers, Agents, Branch Managers, or Administrators can record promises to pay');
    }
  }

  const colCase = await prisma.collectionCase.findUnique({
    where: { id: input.caseId },
    include: { loan: true },
  });
  if (!colCase) throw new NotFoundError('Collection case not found');

  // Anti-IDOR: Enforce Tenant & Branch Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Cannot record PTP on another institution collection case');
    }
    if (
      isBranchScopedRole(actor.roles) &&
      actor.branchId &&
      colCase.loan.branchId &&
      colCase.loan.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Cannot record PTP on a different branch collection case');
    }
  }

  const ptp = await prisma.$transaction(async (tx) => {
    const promise = await tx.promiseToPay.create({
      data: {
        caseId: input.caseId,
        promisedAmount: Money.toDb(input.promisedAmount),
        promisedDate: input.promisedDate,
        paymentMode: input.paymentMode,
        status: 'PENDING',
        recordedBy: actor.email || 'system',
      },
    });

    await tx.collectionCase.update({
      where: { id: input.caseId },
      data: { status: 'PROMISED' },
    });

    await tx.collectionActivity.create({
      data: {
        caseId: input.caseId,
        activityType: 'CALL',
        outcome: 'PROMISE_TO_PAY',
        notes: `Promise To Pay recorded for ₹${input.promisedAmount} on ${new Date(
          input.promisedDate
        ).toLocaleDateString()}`,
        nextFollowUpDate: input.promisedDate,
        performedBy: actor.email || 'system',
      },
    });

    return promise;
  });

  await logAudit({
    userId: actor.id,
    action: 'PROMISE_TO_PAY_RECORDED',
    entity: 'PromiseToPay',
    entityId: ptp.id,
    newValue: {
      amount: input.promisedAmount,
      date: input.promisedDate,
      tenantId: colCase.loan.tenantId,
      branchId: colCase.loan.branchId,
      recordedBy: actor.email,
    },
  });

  return ptp;
}

/**
 * Evaluates pending PTPs and marks any whose promised date has passed without settlement as BROKEN.
 */
export async function syncOverduePtps(tenantId?: string, branchId?: string): Promise<{ brokenCount: number }> {
  const now = new Date();
  const where: any = {
    status: 'PENDING',
    promisedDate: { lt: now },
  };
  if (tenantId) {
    where.collectionCase = { loan: { tenantId } };
    if (branchId) {
      where.collectionCase.loan.branchId = branchId;
    }
  }

  const expiredPtps = await prisma.promiseToPay.findMany({
    where,
    select: { id: true, caseId: true },
  });

  if (expiredPtps.length === 0) return { brokenCount: 0 };

  await prisma.promiseToPay.updateMany({
    where: { id: { in: expiredPtps.map((p) => p.id) } },
    data: { status: 'BROKEN' },
  });

  // Update parent cases from PROMISED to IN_PROGRESS if they have no other pending PTP
  for (const ptp of expiredPtps) {
    const remainingPending = await prisma.promiseToPay.count({
      where: { caseId: ptp.caseId, status: 'PENDING' },
    });
    if (remainingPending === 0) {
      await prisma.collectionCase.update({
        where: { id: ptp.caseId },
        data: { status: 'IN_PROGRESS' },
      });
    }
  }

  return { brokenCount: expiredPtps.length };
}

/**
 * Automatically called upon authoritative payment processing.
 * If all overdue schedule items for the loan are cleared, marks collection case RESOLVED and pending PTPs KEPT.
 */
export async function resolveCollectionCasesOnPayment(loanId: string, tx?: any): Promise<void> {
  const db = tx || prisma;
  const overdueItemsCount = await db.repaymentScheduleItem.count({
    where: { loanId, status: { in: ['OVERDUE', 'DUE'] } },
  });

  if (overdueItemsCount === 0) {
    const activeCases = await db.collectionCase.findMany({
      where: { loanId, status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] } },
      select: { id: true },
    });

    if (activeCases.length > 0) {
      const caseIds = activeCases.map((c: any) => c.id);
      await db.collectionCase.updateMany({
        where: { id: { in: caseIds } },
        data: { status: 'RESOLVED', overdueAmount: 0, dpd: 0 },
      });

      await db.promiseToPay.updateMany({
        where: { caseId: { in: caseIds }, status: 'PENDING' },
        data: { status: 'KEPT' },
      });
    }
  }
}
