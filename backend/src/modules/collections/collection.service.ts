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

import { resolveDateRange } from '../reports/report.service';

export interface CollectionDashboardOptions {
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
}

export function calculateAgingBucket(dpd: number): string {
  if (dpd <= 30) return '0-30';
  if (dpd <= 60) return '31-60';
  if (dpd <= 90) return '61-90';
  if (dpd <= 180) return '91-180';
  return '180+';
}

export function calculatePriority(dpd: number, overdueAmount: number, hasBrokenPtp: boolean): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (dpd > 60 || hasBrokenPtp || overdueAmount >= 100000) return 'CRITICAL';
  if (dpd > 30 || overdueAmount >= 50000) return 'HIGH';
  if (dpd > 15 || overdueAmount >= 10000) return 'MEDIUM';
  return 'LOW';
}

/**
 * Automatically inspects active loans with overdue installments and ensures an active
 * CollectionCase is synced with exact DPD, aging bucket, overdue amount, and priority.
 */
export async function syncDelinquentCases(actor?: CollectionActorContext): Promise<number> {
  const scopeFilter = buildCollectionCaseScopeFilter(actor);
  const now = new Date();

  // Find loans that have overdue installments
  const loansWithOverdue = await prisma.loan.findMany({
    where: {
      status: { in: ['ACTIVE', 'OVERDUE'] },
      ...(scopeFilter.loan || {}),
      schedule: {
        some: {
          status: { in: ['OVERDUE', 'DUE'] },
          dueDate: { lt: now },
          outstanding: { gt: 0 },
        },
      },
    },
    include: {
      schedule: {
        where: {
          status: { in: ['OVERDUE', 'DUE'] },
          dueDate: { lt: now },
          outstanding: { gt: 0 },
        },
        orderBy: { dueDate: 'asc' },
      },
      collectionCases: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] } },
        include: {
          promises: { where: { status: 'BROKEN' } },
        },
      },
    },
  });

  let synced = 0;
  for (const loan of loansWithOverdue) {
    const overdueAmount = loan.schedule.reduce(
      (sum, s) => sum.plus(new Decimal(s.outstanding)),
      new Decimal(0)
    );
    if (overdueAmount.isZero()) continue;

    const oldestDue = new Date(loan.schedule[0].dueDate);
    const dpd = Math.max(1, Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24)));
    const agingBucket = calculateAgingBucket(dpd);

    const activeCase = loan.collectionCases[0];
    const hasBrokenPtp = activeCase?.promises ? activeCase.promises.length > 0 : false;
    const priority = calculatePriority(dpd, overdueAmount.toNumber(), hasBrokenPtp);

    if (activeCase) {
      await prisma.collectionCase.update({
        where: { id: activeCase.id },
        data: {
          overdueAmount: Money.toDb(overdueAmount),
          dpd,
          agingBucket,
          priority: priority as any,
        },
      });
    } else {
      const caseNo = `CC-${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.collectionCase.create({
        data: {
          caseNo,
          loanId: loan.id,
          customerId: loan.customerId,
          dpd,
          agingBucket,
          overdueAmount: Money.toDb(overdueAmount),
          priority: priority as any,
          status: 'OPEN',
        },
      });
    }

    if (loan.status !== 'OVERDUE') {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'OVERDUE' },
      });
    }
    synced++;
  }

  return synced;
}

export async function getCollectionDashboard(
  actor?: CollectionActorContext,
  options?: CollectionDashboardOptions
) {
  // 1. Synchronize overdue PTPs (mark expired as BROKEN)
  await syncOverduePtps(
    actor?.tenantId,
    isBranchScopedRole(actor?.roles) ? actor?.branchId : undefined
  ).catch(() => {});

  // 2. Synchronize active loans with overdue EMIs into collection cases
  await syncDelinquentCases(actor).catch(() => {});

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

  // Detailed PTP breakdown
  const [pendingPtps, brokenPtps, keptPtps] = await Promise.all([
    prisma.promiseToPay.count({
      where: {
        status: 'PENDING',
        collectionCase: scopeFilter,
      },
    }),
    prisma.promiseToPay.count({
      where: {
        status: 'BROKEN',
        collectionCase: scopeFilter,
      },
    }),
    prisma.promiseToPay.count({
      where: {
        status: 'KEPT',
        collectionCase: scopeFilter,
      },
    }),
  ]);

  // Count PTPs due today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const dueTodayPtps = await prisma.promiseToPay.count({
    where: {
      status: 'PENDING',
      promisedDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
      collectionCase: scopeFilter,
    },
  });

  // Calculate collections recovered in the active period
  const { from, to } = resolveDateRange(options?.dateFilter, options?.startDate, options?.endDate);
  const paymentDateFilter = from || to ? {
    paidAt: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {};

  const recoveredAggregate = await prisma.payment.aggregate({
    where: {
      status: 'SUCCESS',
      ...paymentDateFilter,
      ...(actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId ? { tenantId: actor.tenantId } : {}),
      ...(scopeFilter.loan?.branchId ? { loan: { branchId: scopeFilter.loan.branchId } } : {}),
    },
    _sum: { amount: true },
  });
  const collectionsRecovered = Number(recoveredAggregate._sum.amount || 0);

  return {
    summary: {
      activeCases: cases.length,
      totalOverdueAmount: Money.toDb(totalOverdue),
      pendingPtps,
      dueTodayPtps,
      brokenPtps,
      keptPtps,
      collectionsRecovered,
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

  await syncDelinquentCases(actor).catch(() => {});
  await syncOverduePtps(
    actor?.tenantId,
    isBranchScopedRole(actor?.roles) ? actor?.branchId : undefined
  ).catch(() => {});

  const [rows, total] = await Promise.all([
    prisma.collectionCase.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { dpd: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true, city: true } },
        loan: { select: { id: true, loanNo: true, emiAmount: true, nextDueDate: true, tenantId: true, branchId: true } },
        activities: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { activityType: true, outcome: true, notes: true, nextFollowUpDate: true, createdAt: true },
        },
        promises: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { promisedAmount: true, promisedDate: true, paymentMode: true, status: true, createdAt: true },
        },
        _count: { select: { activities: true, promises: true } },
      },
    }),
    prisma.collectionCase.count({ where }),
  ]);

  return {
    data: rows.map((c) => ({
      id: c.id,
      caseNo: c.caseNo,
      loanId: c.loan.id,
      loanNo: c.loan.loanNo,
      emiAmount: c.loan.emiAmount ? Number(c.loan.emiAmount).toFixed(2) : '0.00',
      nextDueDate: c.loan.nextDueDate,
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
      lastActivityDate: c.activities[0]?.createdAt || null,
      lastActivityOutcome: c.activities[0]?.outcome || null,
      lastActivityNotes: c.activities[0]?.notes || null,
      nextFollowUpDate: c.activities[0]?.nextFollowUpDate || c.promises[0]?.promisedDate || null,
      latestPtpAmount: c.promises[0]?.promisedAmount ? Number(c.promises[0].promisedAmount).toFixed(2) : null,
      latestPtpDate: c.promises[0]?.promisedDate || null,
      latestPtpStatus: c.promises[0]?.status || null,
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
