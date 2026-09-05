import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { generatePaymentNo } from '../shared/codes';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type { RecordPaymentInput } from './payment.schema';

export async function listPayments(params: PageParams, loanId?: string, customerId?: string, userId?: string) {
  const where: any = {};
  if (loanId) where.loanId = loanId;
  if (customerId) where.customerId = customerId;
  if (userId) where.customer = { userId };

  if (params.search) {
    where.OR = [
      { paymentNo: { contains: params.search, mode: 'insensitive' } },
      { reference: { contains: params.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: params.search, mode: 'insensitive' } } },
      { loan: { loanNo: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { paidAt: params.sortDir },
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true } },
        loan: { select: { loanNo: true } },
        allocations: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: rows.map((p) => ({
      id: p.id,
      paymentNo: p.paymentNo,
      loanNo: p.loan.loanNo,
      customerName: `${p.customer.firstName} ${p.customer.lastName}`,
      customerCode: p.customer.customerCode,
      amount: p.amount.toFixed(2),
      method: p.method,
      reference: p.reference,
      status: p.status,
      allocations: p.allocations.map((a) => ({ bucket: a.bucket, amount: a.amount.toFixed(2) })),
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function listTransactions(params: PageParams, type?: string, loanId?: string) {
  const where: any = {};
  if (type) where.type = type;
  if (loanId) where.loanId = loanId;
  if (params.search) {
    where.OR = [
      { reference: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { loan: { loanNo: { contains: params.search, mode: 'insensitive' } } },
      { loan: { customer: { firstName: { contains: params.search, mode: 'insensitive' } } } },
      { loan: { customer: { lastName: { contains: params.search, mode: 'insensitive' } } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: {
        loan: {
          include: {
            customer: true,
            product: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: rows.map((t) => ({
      id: t.id,
      loanId: t.loanId,
      loanNo: t.loan?.loanNo || '-',
      customerName: t.loan?.customer ? `${t.loan.customer.firstName} ${t.loan.customer.lastName}` : 'N/A',
      customerCode: t.loan?.customer?.customerCode || '-',
      productName: t.loan?.product?.name || 'Loan',
      type: t.type,
      direction: t.direction,
      amount: t.amount.toFixed(2),
      reference: t.reference,
      description: t.description,
      createdAt: t.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getPaymentDetail(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: true,
      loan: {
        include: { product: true },
      },
      allocations: true,
    },
  });
  if (!payment) throw new NotFoundError('Payment record not found');
  return payment;
}

export async function processPayment(
  input: RecordPaymentInput,
  actorUserId?: string
) {
  if (Number(input.amount) <= 0) {
    throw new BadRequestError('Payment amount must be greater than 0');
  }

  // 1. Idempotency Check
  if (input.idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { allocations: true },
    });
    if (existing) return existing;
  }

  // 2. Fetch Loan & unpaid schedule items
  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    include: {
      customer: true,
      schedule: {
        where: { status: { not: 'PAID' } },
        orderBy: { emiNumber: 'asc' },
      },
    },
  });
  if (!loan) throw new NotFoundError('Loan account not found');

  if (loan.status === 'CLOSED') {
    throw new BadRequestError('Loan is already closed with zero outstanding balance');
  }

  // 3. Fetch Configurable Allocation Order from SystemSetting
  const allocSetting = await prisma.systemSetting.findUnique({
    where: { key: 'payment_allocation_order' },
  });
  const allocationBuckets: string[] = (allocSetting?.value as string[]) || [
    'FEES',
    'PENALTY',
    'INTEREST',
    'PRINCIPAL',
  ];

  let unallocated = new Decimal(input.amount);
  const paymentNo = generatePaymentNo();
  const paidAt = input.paidAt || new Date();

  const bucketTotals: Record<string, Decimal> = {
    FEES: new Decimal(0),
    PENALTY: new Decimal(0),
    INTEREST: new Decimal(0),
    PRINCIPAL: new Decimal(0),
  };

  // Perform allocation in a strict database transaction
  const result = await prisma.$transaction(async (tx) => {
    for (const item of loan.schedule) {
      if (unallocated.isZero()) break;

      const itemPrincipal = new Decimal(item.principal);
      const itemInterest = new Decimal(item.interest);
      const itemFees = new Decimal(item.fees);
      const itemPenalty = new Decimal(item.penaltyAmount);
      const alreadyPaid = new Decimal(item.paidAmount);

      // Remaining due on this specific installment
      let itemDue = new Decimal(item.totalDue).minus(alreadyPaid);
      if (itemDue.isNegative()) itemDue = new Decimal(0);

      const allocationForThisItem = Decimal.min(unallocated, itemDue);
      let itemRemainder = allocationForThisItem;

      // Distribute according to configured bucket priority
      for (const bucket of allocationBuckets) {
        if (itemRemainder.isZero()) break;

        let bucketDue = new Decimal(0);
        if (bucket === 'FEES') bucketDue = itemFees;
        else if (bucket === 'PENALTY') bucketDue = itemPenalty;
        else if (bucket === 'INTEREST') bucketDue = itemInterest;
        else if (bucket === 'PRINCIPAL') bucketDue = itemPrincipal;

        const allocatedToBucket = Decimal.min(itemRemainder, bucketDue);
        bucketTotals[bucket] = (bucketTotals[bucket] || new Decimal(0)).plus(allocatedToBucket);
        itemRemainder = itemRemainder.minus(allocatedToBucket);
      }

      // If there was extra in this installment, allocate to principal
      if (!itemRemainder.isZero()) {
        bucketTotals['PRINCIPAL'] = (bucketTotals['PRINCIPAL'] || new Decimal(0)).plus(itemRemainder);
      }

      const newPaidAmount = alreadyPaid.plus(allocationForThisItem);
      const newOutstanding = Decimal.max(0, new Decimal(item.totalDue).minus(newPaidAmount));
      const newStatus = newOutstanding.isZero() ? 'PAID' : 'PARTIALLY_PAID';

      await tx.repaymentScheduleItem.update({
        where: { id: item.id },
        data: {
          paidAmount: Money.toDb(newPaidAmount),
          outstanding: Money.toDb(newOutstanding),
          status: newStatus as any,
          paidDate: newStatus === 'PAID' ? paidAt : item.paidDate,
        },
      });

      unallocated = unallocated.minus(allocationForThisItem);
    }

    // Any remaining surplus goes straight to reducing principal
    if (unallocated.greaterThan(0)) {
      bucketTotals['PRINCIPAL'] = (bucketTotals['PRINCIPAL'] || new Decimal(0)).plus(unallocated);
      unallocated = new Decimal(0);
    }

    // 4. Update Loan balances
    const allocatedPrincipal = bucketTotals['PRINCIPAL'] || new Decimal(0);
    const allocatedInterest = bucketTotals['INTEREST'] || new Decimal(0);
    const allocatedFees = (bucketTotals['FEES'] || new Decimal(0)).plus(bucketTotals['PENALTY'] || new Decimal(0));

    const newOutstandingPrincipal = Decimal.max(0, new Decimal(loan.outstandingPrincipal).minus(allocatedPrincipal));
    const newOutstandingInterest = Decimal.max(0, new Decimal(loan.outstandingInterest).minus(allocatedInterest));
    const newOutstandingFees = Decimal.max(0, new Decimal(loan.outstandingFees).minus(allocatedFees));

    // Next due date lookup
    const nextUnpaid = await tx.repaymentScheduleItem.findFirst({
      where: { loanId: loan.id, status: { not: 'PAID' } },
      orderBy: { emiNumber: 'asc' },
    });

    const isFullyPaid = newOutstandingPrincipal.isZero() && !nextUnpaid;
    const newLoanStatus = isFullyPaid ? 'CLOSED' : loan.status === 'OVERDUE' ? 'ACTIVE' : loan.status;

    await tx.loan.update({
      where: { id: loan.id },
      data: {
        outstandingPrincipal: Money.toDb(newOutstandingPrincipal),
        outstandingInterest: Money.toDb(newOutstandingInterest),
        outstandingFees: Money.toDb(newOutstandingFees),
        nextDueDate: nextUnpaid ? nextUnpaid.dueDate : null,
        status: newLoanStatus as any,
        closedAt: isFullyPaid ? paidAt : null,
      },
    });

    // 5. Create Payment record
    const createdPayment = await tx.payment.create({
      data: {
        paymentNo,
        loanId: loan.id,
        customerId: loan.customerId,
        amount: Money.toDb(input.amount),
        method: input.method,
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        status: 'SUCCESS',
        paidAt,
      },
    });

    // 6. Create Payment Allocation records
    const allocationEntries = Object.entries(bucketTotals).map(([bucket, amount]) => ({
      paymentId: createdPayment.id,
      bucket,
      amount: Money.toDb(amount),
    }));

    await tx.paymentAllocation.createMany({ data: allocationEntries });

    // 7. Create Ledger Transaction (CREDIT for repayment)
    await tx.transaction.create({
      data: {
        loanId: loan.id,
        type: 'PAYMENT',
        direction: 'CREDIT',
        amount: Money.toDb(input.amount),
        reference: input.reference,
        description: `Repayment received via ${input.method}. Ref: ${input.reference}. P:#${paymentNo}`,
      },
    });

    // 8. Update active collection case if any
    const activeCase = await tx.collectionCase.findFirst({
      where: { loanId: loan.id, status: { in: ['OPEN', 'IN_PROGRESS', 'PROMISED'] } },
    });
    if (activeCase) {
      const remainingOverdue = Decimal.max(0, new Decimal(activeCase.overdueAmount).minus(input.amount));
      await tx.collectionCase.update({
        where: { id: activeCase.id },
        data: {
          overdueAmount: Money.toDb(remainingOverdue),
          status: remainingOverdue.isZero() ? 'RESOLVED' : activeCase.status,
        },
      });

      await tx.collectionActivity.create({
        data: {
          caseId: activeCase.id,
          activityType: 'SMS',
          outcome: 'PROMISE_TO_PAY',
          notes: `Payment of ₹${input.amount} received. Remaining overdue: ₹${remainingOverdue.toFixed(2)}`,
          performedBy: 'System',
        },
      });
    }

    return createdPayment;
  }, { maxWait: 10000, timeout: 30000 });

  await logAudit({
    userId: actorUserId,
    action: 'PAYMENT_RECORDED',
    entity: 'Payment',
    entityId: result.id,
    newValue: {
      paymentNo,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      allocations: bucketTotals,
    },
  });

  // Async non-blocking notification
  void sendNotification({
    customerId: loan.customerId,
    channel: 'IN_APP',
    type: 'SUCCESS',
    title: `Payment Received: ₹${Number(input.amount).toLocaleString('en-IN')}`,
    message: `Receipt #${paymentNo} recorded for Loan #${loan.loanNo}. Allocations: Principal ₹${bucketTotals.PRINCIPAL.toFixed(2)}, Interest ₹${bucketTotals.INTEREST.toFixed(2)}, Fees ₹${bucketTotals.FEES.toFixed(2)}.`,
  }).catch(() => {});

  return result;
}
