import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import type { LogActivityInput, RecordPtpInput } from './collection.schema';
import type {
  BorrowerSafeCollectionSummary,
  CollectionActorContext,
  ContactabilitySignals,
  PartnerSafeCollectionSummary,
} from './collection.types';
import { dpdService } from './dpd.service';
import { collectionStrategyService } from './collection-strategy.service';
import { collectionPtpService } from './collection-ptp.service';
import { collectionEscalationService } from './collection-escalation.service';
import { collectionSettlementService } from './collection-settlement.service';
import { collectionWriteOffService } from './collection-writeoff.service';

export interface CollectionDashboardOptions {
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
}

export { CollectionActorContext };

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

export function maskCustomerInfo(customer: any) {
  if (!customer) return customer;
  return {
    ...customer,
    pan: customer.pan ? `${customer.pan.slice(0, 2)}*****${customer.pan.slice(-2)}` : undefined,
    aadhaarNumber: customer.aadhaarNumber ? `********${customer.aadhaarNumber.slice(-4)}` : undefined,
    bankAccountNo: customer.bankAccountNo ? `*****${customer.bankAccountNo.slice(-4)}` : undefined,
  };
}


/**
 * Log an immutable Collection Case Event into collectionActivity and auditLog
 */
export async function logCaseEvent(params: {
  caseId: string;
  eventType: string;
  actor?: CollectionActorContext;
  notes?: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, any>;
}) {
  await prisma.collectionActivity.create({
    data: {
      caseId: params.caseId,
      activityType: 'EVENT',
      outcome: params.eventType,
      notes: params.notes || `Event: ${params.eventType}`,
      performedBy: params.actor?.email || 'system',
    },
  });

  await logAudit({
    userId: params.actor?.id,
    action: `COLLECTION_${params.eventType}`,
    entity: 'CollectionCase',
    entityId: params.caseId,
    newValue: {
      eventType: params.eventType,
      previousState: params.previousState,
      newState: params.newState,
      actor: params.actor?.email,
      notes: params.notes,
      ...(params.metadata || {}),
    },
  }).catch(() => {});
}

/**
 * Authoritatively inspects active loans with overdue installments and ensures an active
 * CollectionCase is synced with exact DPD, aging bucket, overdue amount, priority score, and strategy.
 */
export async function syncDelinquentCases(actor?: CollectionActorContext): Promise<number> {
  const scopeFilter = buildCollectionCaseScopeFilter(actor);
  const now = new Date();

  // Find active loans that have overdue installments
  const loansWithOverdue = await prisma.loan.findMany({
    where: {
      status: { in: ['ACTIVE', 'OVERDUE'] },
      ...(scopeFilter.loan || {}),
      schedule: {
        some: {
          status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] },
          dueDate: { lt: now },
          outstanding: { gt: 0 },
        },
      },
    },
    include: {
      schedule: {
        where: {
          status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] },
          dueDate: { lt: now },
          outstanding: { gt: 0 },
        },
        orderBy: { dueDate: 'asc' },
      },
      collectionCases: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED', 'ON_HOLD', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW'] } },
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
    const agingBucket = dpdService.calculateAgingBucket(dpd);

    const activeCase = loan.collectionCases[0];
    const brokenPtpCount = activeCase?.promises ? activeCase.promises.length : 0;

    // Evaluate multi-factor priority score
    const priorityCalc = collectionStrategyService.calculatePriorityScore({
      dpd,
      overdueAmount: overdueAmount.toNumber(),
      brokenPtpCount,
    });

    if (activeCase) {
      await prisma.collectionCase.update({
        where: { id: activeCase.id },
        data: {
          overdueAmount: Money.toDb(overdueAmount),
          dpd,
          agingBucket,
          priority: priorityCalc.band as any,
        },
      });
    } else {
      const caseNo = `CC-${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await prisma.collectionCase.create({
        data: {
          caseNo,
          loanId: loan.id,
          customerId: loan.customerId,
          dpd,
          agingBucket,
          overdueAmount: Money.toDb(overdueAmount),
          priority: priorityCalc.band as any,
          status: dpd > 60 ? 'ESCALATED' : 'OPEN',
        },
      });

      await logCaseEvent({
        caseId: created.id,
        eventType: 'CASE_CREATED',
        actor,
        notes: `System created collection case due to ${dpd} DPD and ₹${overdueAmount.toFixed(2)} overdue.`,
        metadata: { dpd, overdueAmount: overdueAmount.toNumber() },
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

/**
 * Manually create a collection case with full validation & duplicate prevention
 */
export async function createManualCollectionCase(
  input: { loanId: string; priority?: string; notes?: string },
  actor: CollectionActorContext
) {
  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    include: {
      customer: true,
      collectionCases: {
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED', 'ON_HOLD', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW'] },
        },
      },
      schedule: {
        where: { status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] } },
      },
    },
  });

  if (!loan) throw new NotFoundError('Loan not found');

  // Anti-IDOR Check
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (loan.tenantId && actor.tenantId && loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Loan belongs to another institution');
    }
    if (isBranchScopedRole(actor.roles) && actor.branchId && loan.branchId && loan.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Loan belongs to a different branch');
    }
  }

  // Prevent duplicate active cases
  if (loan.collectionCases.length > 0) {
    throw new BadRequestError(`An active collection case (${loan.collectionCases[0].caseNo}) already exists for this loan.`);
  }

  const dpdCalc = await dpdService.calculateLoanDpd(loan.id);
  const caseNo = `CC-${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const createdCase = await prisma.collectionCase.create({
    data: {
      caseNo,
      loanId: loan.id,
      customerId: loan.customerId,
      dpd: dpdCalc.dpd,
      agingBucket: dpdCalc.agingBucket,
      overdueAmount: Money.toDb(dpdCalc.totalOverdueAmount),
      priority: (input.priority as any) || 'MEDIUM',
      status: 'OPEN',
    },
  });

  await logCaseEvent({
    caseId: createdCase.id,
    eventType: 'CASE_CREATED',
    actor,
    notes: input.notes || 'Collection case manually initiated by officer.',
    metadata: { dpd: dpdCalc.dpd, overdueAmount: dpdCalc.totalOverdueAmount },
  });

  return createdCase;
}

/**
 * Update case status with backend workflow state-machine validation
 */
export async function updateCollectionCaseStatus(
  caseId: string,
  input: { status: string; notes: string },
  actor: CollectionActorContext
) {
  const colCase = await prisma.collectionCase.findUnique({
    where: { id: caseId },
    include: { loan: true },
  });

  if (!colCase) throw new NotFoundError('Collection case not found');

  // Anti-IDOR Check
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Case belongs to another institution');
    }
    if (isBranchScopedRole(actor.roles) && actor.branchId && colCase.loan.branchId && colCase.loan.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Case belongs to a different branch');
    }
  }

  const allowedTransitions: Record<string, string[]> = {
    OPEN: ['IN_PROGRESS', 'PROMISED', 'ON_HOLD', 'ESCALATED', 'RESOLVED'],
    IN_PROGRESS: ['PROMISED', 'ON_HOLD', 'ESCALATED', 'RESOLVED', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW'],
    PROMISED: ['IN_PROGRESS', 'ON_HOLD', 'ESCALATED', 'RESOLVED'],
    ON_HOLD: ['IN_PROGRESS', 'OPEN', 'ESCALATED', 'RESOLVED'],
    ESCALATED: ['IN_PROGRESS', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW', 'RESOLVED', 'ON_HOLD'],
    RESOLVED: ['CLOSED', 'IN_PROGRESS', 'OPEN'],
    CLOSED: [],
  };

  const currentStatus = colCase.status;
  const targetStatus = input.status;

  if (currentStatus === 'CLOSED') {
    throw new BadRequestError('Cannot modify a closed collection case.');
  }

  if (targetStatus === 'RESOLVED') {
    return resolveCollectionCase(caseId, { resolutionReason: 'ADMINISTRATIVE_RESOLUTION', notes: input.notes }, actor);
  }

  if (targetStatus === 'CLOSED') {
    return closeCollectionCase(caseId, { closureReason: input.notes }, actor);
  }

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new BadRequestError(`Invalid case status transition from '${currentStatus}' to '${targetStatus}'.`);
  }

  const updated = await prisma.collectionCase.update({
    where: { id: caseId },
    data: { status: targetStatus },
  });

  const eventType = targetStatus === 'ON_HOLD' ? 'CASE_ON_HOLD' : targetStatus === 'ESCALATED' ? 'ESCALATED' : 'STATUS_CHANGED';

  await logCaseEvent({
    caseId,
    eventType,
    actor,
    previousState: currentStatus,
    newState: targetStatus,
    notes: input.notes,
  });

  return updated;
}

/**
 * Gated Case Resolution strictly validating Phase 9F authoritative servicing state
 */
export async function resolveCollectionCase(
  caseId: string,
  input: { resolutionReason: string; notes: string },
  actor: CollectionActorContext
) {
  const colCase = await prisma.collectionCase.findUnique({
    where: { id: caseId },
    include: {
      loan: {
        include: {
          schedule: {
            where: {
              status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] },
              dueDate: { lt: new Date() },
              outstanding: { gt: 0 },
            },
          },
        },
      },
    },
  });

  if (!colCase) throw new NotFoundError('Collection case not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Case belongs to another institution');
    }
  }

  // Strict verification if DUES_CLEARED: Overdue amount on schedule must be zero
  if (input.resolutionReason === 'DUES_CLEARED') {
    const overdueSum = colCase.loan.schedule.reduce(
      (acc, s) => acc.plus(new Decimal(s.outstanding)),
      new Decimal(0)
    );
    if (overdueSum.greaterThan(0)) {
      throw new BadRequestError(`Cannot resolve case with DUES_CLEARED: Account still has ₹${overdueSum.toFixed(2)} in overdue installments.`);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.collectionCase.update({
      where: { id: caseId },
      data: {
        status: 'RESOLVED',
        overdueAmount: 0,
        dpd: 0,
      },
    });

    await tx.promiseToPay.updateMany({
      where: { caseId, status: 'PENDING' },
      data: { status: 'KEPT' },
    });

    return c;
  });

  await logCaseEvent({
    caseId,
    eventType: 'CASE_RESOLVED',
    actor,
    previousState: colCase.status,
    newState: 'RESOLVED',
    notes: `Resolved (${input.resolutionReason}): ${input.notes}`,
    metadata: { resolutionReason: input.resolutionReason },
  });

  return updated;
}

/**
 * Close a collection case after resolution or write-off
 */
export async function closeCollectionCase(
  caseId: string,
  input: { closureReason: string; notes?: string },
  actor: CollectionActorContext
) {
  const colCase = await prisma.collectionCase.findUnique({
    where: { id: caseId },
    include: { loan: true },
  });

  if (!colCase) throw new NotFoundError('Collection case not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Case belongs to another institution');
    }
  }

  if (colCase.status !== 'RESOLVED' && colCase.status !== 'SETTLEMENT_REVIEW' && colCase.status !== 'WRITTEN_OFF') {
    throw new BadRequestError(`Cannot close case in '${colCase.status}' status. Case must be RESOLVED, SETTLED, or WRITTEN_OFF before closing.`);
  }

  const updated = await prisma.collectionCase.update({
    where: { id: caseId },
    data: { status: 'CLOSED' },
  });

  await logCaseEvent({
    caseId,
    eventType: 'CASE_CLOSED',
    actor,
    previousState: colCase.status,
    newState: 'CLOSED',
    notes: `Closed (${input.closureReason}): ${input.notes || ''}`,
    metadata: { closureReason: input.closureReason },
  });

  return updated;
}


/**
 * Get Collection Dashboard KPIs & Aging Distribution
 */
export async function getCollectionDashboard(
  actor?: CollectionActorContext,
  options?: CollectionDashboardOptions
) {
  // 1. Synchronize overdue PTPs (mark expired as BROKEN)
  await collectionPtpService.syncOverduePtps(
    actor?.tenantId,
    isBranchScopedRole(actor?.roles) ? actor?.branchId : undefined
  ).catch(() => {});

  // 2. Synchronize active loans with overdue EMIs into collection cases
  await syncDelinquentCases(actor).catch(() => {});

  const scopeFilter = buildCollectionCaseScopeFilter(actor);
  const cases = await prisma.collectionCase.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW'] },
      ...scopeFilter,
    },
    include: {
      loan: { select: { loanNo: true, principal: true, tenantId: true, branchId: true } },
      customer: { select: { firstName: true, lastName: true, mobile: true, customerCode: true } },
    },
  });

  const totalOverdue = cases.reduce((acc, c) => acc.plus(c.overdueAmount), new Decimal(0));

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

  const recoveredAggregate = await prisma.payment.aggregate({
    where: {
      status: 'SUCCESS',
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

/**
 * List Collection Cases with full queue metadata and explanations
 */
export async function listCollectionCases(
  params: PageParams,
  bucket?: string,
  status?: string,
  actor?: CollectionActorContext,
  queueType?: 'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED'
) {
  const where: any = {};
  if (bucket) where.agingBucket = bucket;
  if (status) where.status = status;

  if (queueType === 'MY_QUEUE' && actor?.id) {
    where.assignedOfficerId = actor.id;
  } else if (queueType === 'UNASSIGNED') {
    where.assignedOfficerId = null;
  }

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
  await collectionPtpService.syncOverduePtps(
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
        customer: { select: { id: true, firstName: true, lastName: true, customerCode: true, mobile: true, city: true } },
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
    data: rows.map((c) => {
      const priorityCalc = collectionStrategyService.calculatePriorityScore({
        dpd: c.dpd,
        overdueAmount: Number(c.overdueAmount),
      });

      return {
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
        overdueAmount: Number(c.overdueAmount).toFixed(2),
        status: c.status,
        priority: c.priority,
        priorityScore: priorityCalc.score,
        recommendedAction: priorityCalc.recommendedAction,
        strategyPhase: priorityCalc.strategyPhase,
        assignedOfficerId: c.assignedOfficerId,
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
      };
    }),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

/**
 * Get Comprehensive Collection Case Detail with Timeline, PTP, Follow-ups, and Escalations
 */
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
            where: { status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] } },
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

  // Load in-memory follow-ups, escalations, and settlements
  const followUps = collectionEscalationService.listFollowUps(id);
  const escalations = collectionEscalationService.listEscalations(id);
  const settlements = collectionSettlementService.listSettlements(id);
  const writeOffs = collectionWriteOffService.listWriteOffs(id);

  // Compute contactability signals
  const successfulContacts = colCase.activities.filter((a) => a.outcome === 'CONTACTED' || a.outcome === 'PROMISE_TO_PAY').length;
  const failedContacts = colCase.activities.filter((a) => a.outcome === 'NO_ANSWER' || a.outcome === 'WRONG_NUMBER' || a.outcome === 'REFUSED').length;
  const brokenPtps = colCase.promises.filter((p) => p.status === 'BROKEN').length;
  const keptPtps = colCase.promises.filter((p) => p.status === 'KEPT').length;

  const contactability: ContactabilitySignals = {
    lastContactDate: colCase.activities[0]?.createdAt.toISOString() || null,
    lastContactOutcome: (colCase.activities[0]?.outcome as any) || null,
    totalContactAttempts: colCase.activities.length,
    successfulContactsCount: successfulContacts,
    failedContactsCount: failedContacts,
    preferredChannel: 'PHONE',
    preferredContactTime: '10:00 AM - 01:00 PM',
    brokenPtpCount: brokenPtps,
    keptPtpCount: keptPtps,
  };

  const priorityCalc = collectionStrategyService.calculatePriorityScore({
    dpd: colCase.dpd,
    overdueAmount: Number(colCase.overdueAmount),
    brokenPtpCount: brokenPtps,
    failedContactsCount: failedContacts,
  });

  return {
    ...colCase,
    customer: maskCustomerInfo(colCase.customer),
    priorityScore: priorityCalc.score,
    recommendedAction: priorityCalc.recommendedAction,
    strategyPhase: priorityCalc.strategyPhase,
    contactability,
    followUps,
    escalations,
    settlements,
    writeOffs,
    timeline: colCase.activities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      outcome: a.outcome,
      notes: a.notes,
      performedBy: a.performedBy,
      createdAt: a.createdAt,
    })),
  };
}


/**
 * Log Customer Contact Activity
 */
export async function logCollectionActivity(
  input: LogActivityInput,
  actor: CollectionActorContext
) {
  if (actor.roles && actor.roles.length > 0) {
    const isAuthorized = actor.roles.some((r: string) =>
      ['COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
    );
    if (!isAuthorized) {
      throw new ForbiddenError('Access forbidden: Unauthorized to log collection activity');
    }
  }

  const colCase = await prisma.collectionCase.findUnique({
    where: { id: input.caseId },
    include: { loan: true },
  });
  if (!colCase) throw new NotFoundError('Collection case not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Cannot log activity on another institution case');
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

/**
 * Record Promise to Pay
 */
export async function recordPromiseToPay(
  input: RecordPtpInput,
  actor: CollectionActorContext
) {
  return collectionPtpService.createPtp(
    {
      caseId: input.caseId,
      promisedAmount: input.promisedAmount,
      promisedDate: input.promisedDate,
      paymentMode: input.paymentMode,
    },
    actor
  );
}

/**
 * Automatically called upon authoritative payment processing via Phase 10 Payment Engine.
 * Evaluates active PTPs and cures delinquent collection cases if all overdue schedules are cleared.
 */
export async function resolveCollectionCasesOnPayment(loanId: string, tx?: any): Promise<void> {
  const db = tx || prisma;
  const overdueItemsCount = await db.repaymentScheduleItem.count({
    where: { loanId, status: { in: ['OVERDUE', 'DUE'] } },
  });

  if (overdueItemsCount === 0) {
    const activeCases = await db.collectionCase.findMany({
      where: { loanId, status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED', 'LEGAL_REVIEW', 'SETTLEMENT_REVIEW'] } },
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

/**
 * Borrower Safe Collection View — Redacts all internal priority scores, fraud signals, and agent notes
 */
export async function getBorrowerSafeCollection(loanId: string): Promise<BorrowerSafeCollectionSummary> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      schedule: {
        where: { status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] } },
        orderBy: { dueDate: 'asc' },
      },
      collectionCases: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          promises: {
            where: { status: 'PENDING' },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!loan) throw new NotFoundError('Loan not found');

  const dpdCalc = await dpdService.calculateLoanDpd(loanId);
  const activePtp = loan.collectionCases[0]?.promises[0];

  let statusMessage = 'Your account is in good standing.';
  if (dpdCalc.dpd > 0) {
    statusMessage = `Your payment of ₹${dpdCalc.totalOverdueAmount.toFixed(2)} is overdue by ${dpdCalc.dpd} day${dpdCalc.dpd > 1 ? 's' : ''}. Please clear your pending dues to avoid late fees.`;
  }

  return {
    loanId: loan.id,
    loanNo: loan.loanNo,
    totalDueAmount: dpdCalc.totalOverdueAmount,
    nextDueDate: dpdCalc.oldestOverdueDate || (loan.nextDueDate ? loan.nextDueDate.toISOString() : null),
    dpd: dpdCalc.dpd,
    statusMessage,
    isOverdue: dpdCalc.isDelinquent,
    activePtp: activePtp ? {
      promisedAmount: Number(activePtp.promisedAmount),
      promisedDate: activePtp.promisedDate.toISOString(),
      status: activePtp.status,
    } : null,
    paymentLinkAvailable: true,
    supportContact: 'support@adyapan.io | 1800-123-4567',
  };
}

/**
 * Partner Safe Collection View — Sanitized summary for LSP and Co-Lending partners
 */
export async function getPartnerSafeCollection(loanId: string): Promise<PartnerSafeCollectionSummary> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      collectionCases: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: { promises: { where: { status: 'PENDING' } } },
      },
      payments: {
        where: { status: 'SUCCESS' },
        orderBy: { paidAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!loan) throw new NotFoundError('Loan not found');

  const dpdCalc = await dpdService.calculateLoanDpd(loanId);
  const activeCase = loan.collectionCases[0];

  return {
    loanId: loan.id,
    loanNo: loan.loanNo,
    partnerId: (loan as any).partnerId || undefined,
    dpd: dpdCalc.dpd,
    agingBucket: dpdCalc.agingBucket,
    overdueAmount: dpdCalc.totalOverdueAmount,
    collectionStatus: activeCase?.status || (dpdCalc.isDelinquent ? 'OVERDUE' : 'CURRENT'),
    hasActivePtp: (activeCase?.promises?.length || 0) > 0,
    lastPaymentDate: loan.payments[0]?.paidAt.toISOString() || null,
  };
}
