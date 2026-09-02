import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import type { LogActivityInput, RecordPtpInput } from './collection.schema';

export async function getCollectionDashboard() {
  const cases = await prisma.collectionCase.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED', 'ESCALATED'] } },
    include: {
      loan: { select: { loanNo: true, principal: true } },
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
    where: { status: 'PENDING' },
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

export async function listCollectionCases(params: PageParams, bucket?: string, status?: string) {
  const where: any = {};
  if (bucket) where.agingBucket = bucket;
  if (status) where.status = status;

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
        loan: { select: { loanNo: true, emiAmount: true, nextDueDate: true } },
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

export async function getCollectionCaseDetail(id: string) {
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
  return colCase;
}

export async function logCollectionActivity(
  input: LogActivityInput,
  actor: { email: string; id: string }
) {
  const colCase = await prisma.collectionCase.findUnique({ where: { id: input.caseId } });
  if (!colCase) throw new NotFoundError('Collection case not found');

  const activity = await prisma.collectionActivity.create({
    data: {
      caseId: input.caseId,
      activityType: input.activityType,
      outcome: input.outcome,
      notes: input.notes,
      nextFollowUpDate: input.nextFollowUpDate,
      performedBy: actor.email,
    },
  });

  await logAudit({
    userId: actor.id,
    action: 'COLLECTION_ACTIVITY_LOGGED',
    entity: 'CollectionCase',
    entityId: input.caseId,
    newValue: { type: input.activityType, outcome: input.outcome, notes: input.notes },
  });

  return activity;
}

export async function recordPromiseToPay(
  input: RecordPtpInput,
  actor: { email: string; id: string }
) {
  const colCase = await prisma.collectionCase.findUnique({ where: { id: input.caseId } });
  if (!colCase) throw new NotFoundError('Collection case not found');

  const ptp = await prisma.$transaction(async (tx) => {
    const promise = await tx.promiseToPay.create({
      data: {
        caseId: input.caseId,
        promisedAmount: Money.toDb(input.promisedAmount),
        promisedDate: input.promisedDate,
        paymentMode: input.paymentMode,
        status: 'PENDING',
        recordedBy: actor.email,
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
        performedBy: actor.email,
      },
    });

    return promise;
  });

  await logAudit({
    userId: actor.id,
    action: 'PROMISE_TO_PAY_RECORDED',
    entity: 'PromiseToPay',
    entityId: ptp.id,
    newValue: { amount: input.promisedAmount, date: input.promisedDate },
  });

  return ptp;
}
