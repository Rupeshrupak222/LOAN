import { Decimal } from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { generatePaymentNo } from '../shared/codes';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { communicationService } from '../communication/communication.service';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import { generalLedgerService } from '../finance/gl.service';
import { SandboxPaymentProvider } from './sandbox-payment-provider';
import { SandboxPayoutProvider } from './sandbox-payout-provider';
import { paymentAllocationService } from './payment-allocation.service';
import type { RecordPaymentInput } from './payment.schema';
import type {
  PaymentTransaction,
  PayoutTransaction,
  RefundRecord,
  ReversalRecord,
  InitiatePaymentDto,
  ConfirmPaymentDto,
  RefundPaymentDto,
  ReversePaymentDto,
  InitiatePayoutDto,
  CustomerSafePaymentSummary,
  PartnerSafePaymentSummary,
  PaymentTimelineEvent,
} from './payment.types';

export interface PaymentActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

// In-memory extension stores for rich Phase 10 entities
const paymentTimelines = new Map<string, PaymentTimelineEvent[]>();
const refundRecords: RefundRecord[] = [];
const reversalRecords: ReversalRecord[] = [];
const payoutRecords: PayoutTransaction[] = [];

const sandboxPaymentProvider = new SandboxPaymentProvider();
const sandboxPayoutProvider = new SandboxPayoutProvider();

function addTimelineEvent(paymentId: string, event: Omit<PaymentTimelineEvent, 'id' | 'timestamp'>) {
  const current = paymentTimelines.get(paymentId) || [];
  current.push({
    id: `EV-${uuid().slice(0, 6)}`,
    status: event.status,
    timestamp: new Date().toISOString(),
    note: event.note,
    actorId: event.actorId,
    actorName: event.actorName,
  });
  paymentTimelines.set(paymentId, current);
}

// ---------------------------------------------------------------------------
// 1. QUERY SERVICES
// ---------------------------------------------------------------------------

export async function listPayments(
  params: PageParams,
  loanId?: string,
  customerId?: string,
  userId?: string,
  actor?: PaymentActorContext
) {
  const where: any = {};
  if (loanId) where.loanId = loanId;
  if (customerId) where.customerId = customerId;
  if (userId) where.customer = { userId };

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId) {
      where.loan = { ...where.loan, branchId: actor.branchId };
    }
  }

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

export async function listTransactions(
  params: PageParams,
  type?: string,
  loanId?: string,
  actor?: PaymentActorContext
) {
  const where: any = {};
  if (type) where.type = type;
  if (loanId) where.loanId = loanId;

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.loan = { ...where.loan, tenantId: actor.tenantId };
    }
    if (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId) {
      where.loan = { ...where.loan, branchId: actor.branchId };
    }
  }

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

export async function getPaymentDetail(id: string, actor?: PaymentActorContext) {
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

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && payment.tenantId && payment.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Payment record belongs to another institution');
    }
  }

  const timeline = paymentTimelines.get(payment.id) || [
    {
      id: `EV-INIT`,
      status: payment.status as any,
      timestamp: payment.paidAt.toISOString(),
      note: `Payment recorded via ${payment.method}`,
      actorName: 'System',
    },
  ];

  return {
    ...payment,
    timeline,
    refunds: refundRecords.filter((r) => r.paymentId === payment.id),
    reversals: reversalRecords.filter((r) => r.paymentId === payment.id),
  };
}

// ---------------------------------------------------------------------------
// 2. PAYMENT INITIATION & CHECKOUT
// ---------------------------------------------------------------------------

export async function initiatePayment(
  input: InitiatePaymentDto,
  actor?: PaymentActorContext
) {
  if (input.amount <= 0) {
    throw new BadRequestError('Payment amount must be greater than zero.');
  }

  let loan: any = null;
  if (input.loanId) {
    loan = await prisma.loan.findUnique({
      where: { id: input.loanId },
      include: { customer: true },
    });
    if (!loan) throw new NotFoundError(`Loan not found: ${input.loanId}`);
    if (loan.status === 'CLOSED') {
      throw new BadRequestError('Cannot initiate payment for an already closed loan.');
    }
  }

  const customerId = input.customerId || loan?.customerId;
  if (!customerId) {
    throw new BadRequestError('A valid customerId or loanId is required to initiate payment.');
  }

  const paymentNo = generatePaymentNo();
  const idempotencyKey = input.idempotencyKey || `idem-${Date.now()}-${uuid().slice(0, 8)}`;

  // Provider Order Creation
  const order = await sandboxPaymentProvider.createOrder({
    amount: input.amount,
    currency: 'INR',
    receipt: paymentNo,
    customerId,
    notes: {
      loanId: loan?.id,
      loanNo: loan?.loanNo,
      customerId,
      paymentType: input.type || 'EMI',
    },
  });

  // Create PENDING payment in DB
  const created = await prisma.payment.create({
    data: {
      paymentNo,
      loanId: loan?.id || '',
      customerId,
      tenantId: loan?.tenantId || actor?.tenantId,
      amount: Money.toDb(input.amount),
      method: input.method || 'GATEWAY',
      reference: order.orderId,
      idempotencyKey,
      status: 'PENDING',
    },
  });

  addTimelineEvent(created.id, {
    status: 'INITIATED',
    note: `Payment initiated for ₹${input.amount}. Gateway Order ID: ${order.orderId}`,
    actorId: actor?.id,
    actorName: actor?.email || 'Customer/LSP',
  });

  await logAudit({
    userId: actor?.id,
    action: 'PAYMENT_INITIATED',
    entity: 'Payment',
    entityId: created.id,
    newValue: {
      paymentNo,
      amount: input.amount,
      orderId: order.orderId,
      checkoutUrl: order.checkoutUrl,
    },
  });

  return {
    paymentId: created.id,
    paymentNo,
    amount: input.amount,
    currency: 'INR',
    status: 'INITIATED',
    providerOrderId: order.orderId,
    checkoutUrl: order.checkoutUrl,
    idempotencyKey,
  };
}

// ---------------------------------------------------------------------------
// 3. PAYMENT CONFIRMATION & WATERFALL ALLOCATION
// ---------------------------------------------------------------------------

export async function confirmPayment(
  paymentId: string,
  input: ConfirmPaymentDto,
  actor?: PaymentActorContext
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { loan: true, customer: true, allocations: true },
  });
  if (!payment) throw new NotFoundError(`Payment not found: ${paymentId}`);

  if (payment.status === 'SUCCESS') {
    return {
      message: 'Payment already confirmed and allocated successfully.',
      payment,
    };
  }

  // Gateway Verification
  const verifyResult = await sandboxPaymentProvider.verifyPayment({
    orderId: payment.reference || '',
    providerPaymentId: input.providerPaymentId || `pay_sbx_${Date.now()}`,
  });

  if (!verifyResult.verified || verifyResult.status === 'FAILED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    addTimelineEvent(payment.id, {
      status: 'FAILED',
      note: `Payment gateway verification failed: ${verifyResult.errorDescription || 'Declined'}`,
      actorId: actor?.id,
      actorName: actor?.email || 'Gateway Webhook',
    });

    throw new BadRequestError(`Payment verification failed: ${verifyResult.errorDescription || 'Transaction declined.'}`);
  }

  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();

  // Pure Decimal.js Waterfall Allocation
  const allocation = await paymentAllocationService.allocatePayment({
    paymentId: payment.id,
    paymentNo: payment.paymentNo,
    loanId: payment.loanId,
    amount: payment.amount.toNumber(),
  });

  // Post Double-Entry General Ledger Journal Entry
  await generalLedgerService.postRepaymentJournal({
    loanId: payment.loanId,
    loanNo: payment.loan.loanNo,
    paymentNo: payment.paymentNo,
    tenantId: payment.tenantId || undefined,
    totalAmount: payment.amount.toNumber(),
    allocatedPrincipal: allocation.allocatedPrincipal,
    allocatedInterest: allocation.allocatedInterest,
    allocatedFees: allocation.allocatedFees,
    allocatedPenalties: allocation.allocatedPenalties,
    excessRefund: allocation.allocatedExcess,
    receivedBy: actor?.email || 'PAYMENT_GATEWAY',
  });

  // Phase 5 Credit Line Restoration
  if (allocation.allocatedPrincipal > 0) {
    try {
      creditLimitsService.applyRepaymentLimitRestoration(
        payment.customerId,
        allocation.allocatedPrincipal,
        input.utrNumber || payment.paymentNo,
        payment.id
      );
    } catch (e) {
      console.warn('Non-fatal error restoring credit limit:', e);
    }
  }

  // Update Payment Status in DB
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESS',
      paidAt,
      reference: input.utrNumber || verifyResult.providerPaymentId,
    },
    include: { allocations: true },
  });

  addTimelineEvent(payment.id, {
    status: 'SUCCESS',
    note: `Payment confirmed. UTR: ${input.utrNumber || verifyResult.providerPaymentId}. Allocated: Principal ₹${allocation.allocatedPrincipal}, Interest ₹${allocation.allocatedInterest}, Fees ₹${allocation.allocatedFees}.`,
    actorId: actor?.id,
    actorName: actor?.email || 'Payment Service',
  });

  await logAudit({
    userId: actor?.id,
    action: 'PAYMENT_CONFIRMED',
    entity: 'Payment',
    entityId: payment.id,
    newValue: {
      paymentNo: payment.paymentNo,
      amount: payment.amount.toNumber(),
      allocation,
    },
  });

  // Async Notifications
  void sendNotification({
    customerId: payment.customerId,
    channel: 'IN_APP',
    type: 'SUCCESS',
    title: `Payment Received: ₹${payment.amount.toNumber().toLocaleString('en-IN')}`,
    message: `Receipt #${payment.paymentNo} confirmed. Remaining balance: ₹${allocation.remainingDue.toFixed(2)}.`,
  }).catch(() => {});

  return {
    payment: updatedPayment,
    allocation,
  };
}

// ---------------------------------------------------------------------------
// 4. REFUND PROCESSING
// ---------------------------------------------------------------------------

export async function processRefund(
  paymentId: string,
  input: RefundPaymentDto,
  actor?: PaymentActorContext
): Promise<RefundRecord> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { loan: true },
  });
  if (!payment) throw new NotFoundError(`Payment record not found: ${paymentId}`);

  if (payment.status !== 'SUCCESS') {
    throw new BadRequestError('Only successful payments can be refunded.');
  }

  const existingRefunds = refundRecords.filter((r) => r.paymentId === payment.id && r.status === 'PROCESSED');
  const alreadyRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);
  const remainingRefundable = new Decimal(payment.amount.toNumber()).minus(alreadyRefunded);

  if (new Decimal(input.amount).greaterThan(remainingRefundable)) {
    throw new BadRequestError(
      `Requested refund of ₹${input.amount} exceeds remaining refundable balance of ₹${remainingRefundable.toFixed(2)}.`
    );
  }

  const refundNo = `REF-${Date.now().toString().slice(-8)}`;

  // Post Double-Entry Refund Journal
  await generalLedgerService.postRefundJournal({
    paymentId: payment.id,
    refundId: refundNo,
    tenantId: payment.tenantId || undefined,
    loanId: payment.loanId,
    loanNo: payment.loan.loanNo,
    refundAmount: input.amount,
    reason: input.reason,
    postedBy: actor?.email || 'FINANCE_OFFICER',
  });

  const record: RefundRecord = {
    id: `REF-${uuid().slice(0, 8)}`,
    refundNo,
    paymentId: payment.id,
    paymentNo: payment.paymentNo,
    tenantId: payment.tenantId || 'tenant-adyapan-default',
    amount: input.amount,
    reason: input.reason,
    status: 'PROCESSED',
    providerRefundId: `rfnd_sbx_${Date.now()}`,
    requestedBy: actor?.email || 'FINANCE_OPERATIONS',
    comments: input.comments,
    createdAt: new Date().toISOString(),
  };

  refundRecords.push(record);

  const isFullRefund = remainingRefundable.minus(input.amount).isZero();
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: isFullRefund ? 'REFUNDED' : 'SUCCESS' },
  });

  addTimelineEvent(payment.id, {
    status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    note: `Refund of ₹${input.amount} processed: ${input.reason}`,
    actorId: actor?.id,
    actorName: actor?.email || 'Finance Officer',
  });

  await logAudit({
    userId: actor?.id,
    action: 'PAYMENT_REFUND_PROCESSED',
    entity: 'RefundRecord',
    entityId: record.id,
    newValue: record,
  });

  return record;
}

// ---------------------------------------------------------------------------
// 5. PAYMENT REVERSAL (BOUNCED / REVOKED)
// ---------------------------------------------------------------------------

export async function reversePayment(
  paymentId: string,
  input: ReversePaymentDto,
  actor?: PaymentActorContext
): Promise<ReversalRecord> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { loan: { include: { schedule: true } }, allocations: true },
  });
  if (!payment) throw new NotFoundError(`Payment record not found: ${paymentId}`);

  if (payment.status === 'REVERSED') {
    throw new BadRequestError('This payment has already been reversed.');
  }

  // Calculate allocation totals to reverse
  const principalAllocated = payment.allocations
    .filter((a) => a.bucket === 'PRINCIPAL')
    .reduce((sum, a) => sum.plus(a.amount.toNumber()), new Decimal(0));

  const interestAllocated = payment.allocations
    .filter((a) => a.bucket === 'INTEREST')
    .reduce((sum, a) => sum.plus(a.amount.toNumber()), new Decimal(0));

  const feesAllocated = payment.allocations
    .filter((a) => a.bucket === 'FEES')
    .reduce((sum, a) => sum.plus(a.amount.toNumber()), new Decimal(0));

  const penaltiesAllocated = payment.allocations
    .filter((a) => a.bucket === 'PENALTY')
    .reduce((sum, a) => sum.plus(a.amount.toNumber()), new Decimal(0));

  const excessAllocated = payment.allocations
    .filter((a) => a.bucket === 'EXCESS')
    .reduce((sum, a) => sum.plus(a.amount.toNumber()), new Decimal(0));

  const reversalNo = `REV-${Date.now().toString().slice(-8)}`;

  // Reopen and adjust schedule items & loan balances
  await prisma.$transaction(async (tx) => {
    // Re-open schedule items
    const scheduleItems = await tx.repaymentScheduleItem.findMany({
      where: { loanId: payment.loanId, paidAmount: { gt: 0 } },
      orderBy: { emiNumber: 'desc' },
    });

    let unreversed = new Decimal(payment.amount.toNumber());

    for (const item of scheduleItems) {
      if (unreversed.isZero()) break;

      const paid = new Decimal(item.paidAmount);
      const rollbackAmount = Decimal.min(unreversed, paid);

      const newPaid = paid.minus(rollbackAmount);
      const newOutstanding = Decimal.max(0, new Decimal(item.totalDue).minus(newPaid));

      await tx.repaymentScheduleItem.update({
        where: { id: item.id },
        data: {
          paidAmount: Money.toDb(newPaid),
          outstanding: Money.toDb(newOutstanding),
          status: newOutstanding.isZero() ? 'PAID' : 'OVERDUE',
        },
      });

      unreversed = unreversed.minus(rollbackAmount);
    }

    // Restore loan balances
    const newOutstandingPrincipal = new Decimal(payment.loan.outstandingPrincipal).plus(principalAllocated);
    const newOutstandingInterest = new Decimal(payment.loan.outstandingInterest).plus(interestAllocated);
    const newOutstandingFees = new Decimal(payment.loan.outstandingFees).plus(feesAllocated).plus(penaltiesAllocated);

    await tx.loan.update({
      where: { id: payment.loanId },
      data: {
        outstandingPrincipal: Money.toDb(newOutstandingPrincipal),
        outstandingInterest: Money.toDb(newOutstandingInterest),
        outstandingFees: Money.toDb(newOutstandingFees),
        status: 'ACTIVE',
        closedAt: null,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'REVERSED' },
    });
  });

  // Post Compensating General Ledger Reversal Journal
  const journal = await generalLedgerService.postReversalJournal({
    paymentId: payment.id,
    reversalId: reversalNo,
    tenantId: payment.tenantId || undefined,
    loanId: payment.loanId,
    loanNo: payment.loan.loanNo,
    reversalAmount: payment.amount.toNumber(),
    originalPrincipal: principalAllocated.toNumber(),
    originalInterest: interestAllocated.toNumber(),
    originalFees: feesAllocated.toNumber(),
    originalPenalties: penaltiesAllocated.toNumber(),
    originalExcess: excessAllocated.toNumber(),
    reason: input.reason,
    postedBy: actor?.email || 'REVERSAL_ENGINE',
  });

  const reversalRecord: ReversalRecord = {
    id: `REV-${uuid().slice(0, 8)}`,
    reversalNo,
    paymentId: payment.id,
    paymentNo: payment.paymentNo,
    tenantId: payment.tenantId || 'tenant-adyapan-default',
    loanId: payment.loanId,
    loanNo: payment.loan.loanNo,
    reversalAmount: payment.amount.toNumber(),
    reason: input.reason,
    compensatingJournalId: journal.id,
    executedBy: actor?.email || 'SYSTEM_OPERATOR',
    createdAt: new Date().toISOString(),
  };

  reversalRecords.push(reversalRecord);

  addTimelineEvent(payment.id, {
    status: 'REVERSED',
    note: `Payment reversed: ${input.reason}. Compensating Journal: ${journal.entryNumber}. Schedule items restored.`,
    actorId: actor?.id,
    actorName: actor?.email || 'Finance Operations',
  });

  await logAudit({
    userId: actor?.id,
    action: 'PAYMENT_REVERSED',
    entity: 'Payment',
    entityId: payment.id,
    newValue: reversalRecord,
  });

  return reversalRecord;
}

// ---------------------------------------------------------------------------
// 6. PAYOUTS & DISBURSEMENT ENGINE
// ---------------------------------------------------------------------------

export async function initiatePayout(
  input: InitiatePayoutDto,
  actor?: PaymentActorContext
): Promise<PayoutTransaction> {
  let loan: any = null;
  if (input.loanId) {
    loan = await prisma.loan.findUnique({
      where: { id: input.loanId },
      include: { customer: true, product: true },
    });
    if (!loan) throw new NotFoundError(`Loan not found: ${input.loanId}`);
  }

  const grossAmount = input.amount || loan?.principal?.toNumber() || 10000;
  const processingFee = 500;
  const gst = processingFee * 0.18;
  const netDisbursedAmount = grossAmount - processingFee - gst;

  const payoutNo = `POUT-${Date.now().toString().slice(-8)}`;

  // Sandbox payout provider call
  const payoutResult = await sandboxPayoutProvider.initiatePayout({
    payoutNo,
    amount: netDisbursedAmount,
    currency: 'INR',
    beneficiaryAccountNo: input.beneficiaryAccountNo || loan?.customer?.bankAccountNo || '112233445566',
    beneficiaryIfsc: input.beneficiaryIfsc || loan?.customer?.bankIfsc || 'HDFC0000001',
    beneficiaryName: input.beneficiaryName || (loan ? `${loan.customer.firstName} ${loan.customer.lastName}` : 'Beneficiary'),
  });

  const payout: PayoutTransaction = {
    id: `POUT-${uuid().slice(0, 8)}`,
    payoutNo,
    tenantId: loan?.tenantId || actor?.tenantId || 'tenant-adyapan-default',
    customerId: loan?.customerId || 'cust-direct',
    customerName: loan ? `${loan.customer.firstName} ${loan.customer.lastName}` : input.beneficiaryName,
    loanId: loan?.id,
    loanNo: loan?.loanNo,
    amount: grossAmount,
    netDisbursedAmount,
    deductedFees: processingFee,
    deductedGst: gst,
    currency: 'INR',
    status: payoutResult.status,
    beneficiaryName: input.beneficiaryName || (loan ? `${loan.customer.firstName} ${loan.customer.lastName}` : 'Beneficiary'),
    beneficiaryAccountMasked: `XXXX${(input.beneficiaryAccountNo || '5566').slice(-4)}`,
    beneficiaryIfsc: input.beneficiaryIfsc || 'HDFC0000001',
    provider: 'SANDBOX',
    providerPayoutId: payoutResult.providerPayoutId,
    utrNumber: payoutResult.utrNumber,
    retryCount: 0,
    maxRetries: 3,
    initiatedBy: actor?.email || 'DISBURSEMENT_OFFICER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  payoutRecords.push(payout);

  // If payout succeeded, activate loan and post GL disbursement journal
  if (payout.status === 'SUCCESS' && loan) {
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: 'ACTIVE',
        disbursementDate: new Date(),
      },
    });

    await generalLedgerService.postDisbursementJournal({
      loanId: loan.id,
      loanNo: loan.loanNo,
      tenantId: loan.tenantId || undefined,
      principalAmount: grossAmount,
      netDisbursedAmount,
      processingFee,
      gstAmount: gst,
      disbursedBy: actor?.email || 'DISBURSEMENT_ENGINE',
    });
  }

  await logAudit({
    userId: actor?.id,
    action: 'PAYOUT_INITIATED',
    entity: 'PayoutTransaction',
    entityId: payout.id,
    newValue: payout,
  });

  return payout;
}

export function listPayouts(params?: { tenantId?: string; loanId?: string; status?: string }) {
  let list = [...payoutRecords];
  if (params?.tenantId) {
    list = list.filter((p) => p.tenantId === params.tenantId);
  }
  if (params?.loanId) {
    list = list.filter((p) => p.loanId === params.loanId);
  }
  if (params?.status) {
    list = list.filter((p) => p.status === params.status);
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPayoutDetail(id: string): PayoutTransaction {
  const payout = payoutRecords.find((p) => p.id === id || p.payoutNo === id);
  if (!payout) throw new NotFoundError(`Payout record not found: ${id}`);
  return payout;
}

// ---------------------------------------------------------------------------
// 7. SAFE VIEWS (BORROWER & PARTNER PORTALS)
// ---------------------------------------------------------------------------

export async function getCustomerSafePayment(
  paymentId: string,
  actor?: PaymentActorContext
): Promise<CustomerSafePaymentSummary> {
  const detail = await getPaymentDetail(paymentId, actor);

  const principalPaid = detail.allocations
    .filter((a) => a.bucket === 'PRINCIPAL')
    .reduce((sum, a) => sum + a.amount.toNumber(), 0);

  const interestPaid = detail.allocations
    .filter((a) => a.bucket === 'INTEREST')
    .reduce((sum, a) => sum + a.amount.toNumber(), 0);

  const feesPaid = detail.allocations
    .filter((a) => a.bucket === 'FEES' || a.bucket === 'PENALTY')
    .reduce((sum, a) => sum + a.amount.toNumber(), 0);

  const remainingLoanBalance = detail.loan
    ? new Decimal(detail.loan.outstandingPrincipal.toNumber())
        .plus(detail.loan.outstandingInterest.toNumber())
        .plus(detail.loan.outstandingFees.toNumber())
        .toNumber()
    : 0;

  return {
    paymentId: detail.id,
    paymentNo: detail.paymentNo,
    loanNo: detail.loan?.loanNo,
    amount: detail.amount.toNumber(),
    method: detail.method,
    status: detail.status as any,
    paidAt: detail.paidAt.toISOString(),
    receiptNumber: `RCPT-${detail.paymentNo}`,
    principalPaid,
    interestPaid,
    feesPaid,
    remainingLoanBalance,
  };
}

export async function getPartnerSafePayment(
  paymentId: string,
  actor?: PaymentActorContext
): Promise<PartnerSafePaymentSummary> {
  const detail = await getPaymentDetail(paymentId, actor);

  return {
    paymentId: detail.id,
    paymentNo: detail.paymentNo,
    loanReference: detail.loan?.loanNo || 'N/A',
    amount: detail.amount.toNumber(),
    status: detail.status as any,
    paidAt: detail.paidAt.toISOString(),
    settlementStatus: 'SETTLED',
  };
}

// Backward compatibility for existing direct processPayment call
export async function processPayment(
  input: RecordPaymentInput,
  actorUserId?: string,
  actor?: PaymentActorContext
) {
  if (Number(input.amount) <= 0) {
    throw new BadRequestError('Payment amount must be greater than 0');
  }

  const result = await initiatePayment(
    {
      loanId: input.loanId,
      amount: Number(input.amount),
      method: input.method as any,
      reference: input.reference,
      idempotencyKey: input.idempotencyKey,
    },
    actor
  );

  const confirmed = await confirmPayment(
    result.paymentId,
    {
      utrNumber: input.reference || `UTR-${Date.now()}`,
      paidAt: input.paidAt ? input.paidAt.toISOString() : undefined,
    },
    actor
  );

  return confirmed.payment;
}
