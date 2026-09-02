import { Decimal } from 'decimal.js';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import { processPayment } from './payment.service';

export function generateSubmissionNo(): string {
  const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PAY-SUB-${yearMonth}${randomSuffix}`;
}

export interface CreatePaymentSubmissionInput {
  loanId: string;
  amount: number | string;
  method: string;
  reference: string;
  payerMobile?: string;
  paidAt?: Date | string;
  notes?: string;
}

export async function createPaymentSubmission(
  input: CreatePaymentSubmissionInput,
  actorUser: { id: string; roles: string[]; email?: string }
) {
  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    include: {
      customer: true,
      product: true,
    },
  });

  if (!loan) {
    throw new NotFoundError('Loan account not found');
  }

  // Check if customer is making submission for their own loan
  const isStaff = actorUser.roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
  );

  if (!isStaff && loan.customer.userId !== actorUser.id) {
    throw new BadRequestError('You can only submit payment details for your own active loan account');
  }

  const submissionNo = generateSubmissionNo();
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();

  // Insert into database
  const created = await prisma.paymentSubmission.create({
    data: {
      submissionNo,
      loanId: loan.id,
      customerId: loan.customerId,
      amount: Money.toDb(input.amount),
      method: input.method || 'UPI',
      reference: input.reference,
      payerMobile: input.payerMobile || loan.customer.mobile,
      paidAt,
      notes: input.notes,
      status: 'PENDING_VERIFICATION',
    },
    include: {
      loan: {
        include: {
          customer: true,
          product: true,
        },
      },
      customer: true,
    },
  });

  // Notify all Staff Roles
  const staffRoles = [
    'COLLECTION_OFFICER',
    'FINANCE_OFFICER',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
  ];

  void sendNotification({
    channel: 'IN_APP',
    type: 'INFO',
    title: `Payment Intimation: ₹${Number(input.amount).toLocaleString('en-IN')}`,
    message: `Borrower ${loan.customer.firstName} ${loan.customer.lastName} submitted payment reference #${input.reference} for Loan #${loan.loanNo}. Verification required.`,
    metadata: {
      submissionId: created.id,
      loanId: loan.id,
      submissionNo,
      targetRoles: staffRoles,
    },
  }).catch(() => {});

  // Notify Borrower Confirmation
  void sendNotification({
    userId: actorUser.id,
    customerId: loan.customerId,
    channel: 'IN_APP',
    type: 'SUCCESS',
    title: `Payment Details Submitted: ₹${Number(input.amount).toLocaleString('en-IN')}`,
    message: `Your payment reference #${input.reference} (Ref #${submissionNo}) has been submitted for verification. Staff will confirm and update your loan schedule shortly.`,
  }).catch(() => {});

  await logAudit({
    userId: actorUser.id,
    action: 'PAYMENT_SUBMISSION_CREATED',
    entity: 'PaymentSubmission',
    entityId: created.id,
    newValue: {
      submissionNo,
      amount: input.amount,
      reference: input.reference,
      method: input.method,
      loanNo: loan.loanNo,
    },
  });

  return created;
}

export async function listPaymentSubmissions(
  params: PageParams,
  status?: string,
  loanId?: string,
  customerId?: string,
  userIdFilter?: string
) {
  const where: any = {};
  if (status) where.status = status;
  if (loanId) where.loanId = loanId;
  if (customerId) where.customerId = customerId;
  if (userIdFilter) where.customer = { userId: userIdFilter };

  if (params.search) {
    where.OR = [
      { submissionNo: { contains: params.search, mode: 'insensitive' } },
      { reference: { contains: params.search, mode: 'insensitive' } },
      { payerMobile: { contains: params.search } },
      { loan: { loanNo: { contains: params.search, mode: 'insensitive' } } },
      { customer: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.paymentSubmission.findMany({
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
        customer: true,
      },
    }),
    prisma.paymentSubmission.count({ where }),
  ]);

  return {
    data: rows.map((s) => ({
      id: s.id,
      submissionNo: s.submissionNo,
      loanId: s.loanId,
      loanNo: s.loan.loanNo,
      customerId: s.customerId,
      customerName: `${s.customer.firstName} ${s.customer.lastName}`,
      customerCode: s.customer.customerCode,
      productName: s.loan.product.name,
      amount: s.amount.toFixed(2),
      method: s.method,
      reference: s.reference,
      payerMobile: s.payerMobile,
      notes: s.notes,
      status: s.status,
      paidAt: s.paidAt,
      verifiedByUserId: s.verifiedByUserId,
      verifiedAt: s.verifiedAt,
      rejectionReason: s.rejectionReason,
      paymentId: s.paymentId,
      createdAt: s.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function verifyPaymentSubmission(
  submissionId: string,
  actorUser: { id: string; email?: string; roles: string[] }
) {
  const submission = await prisma.paymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      loan: {
        include: {
          customer: true,
        },
      },
      customer: true,
    },
  });

  if (!submission) {
    throw new NotFoundError('Payment submission not found');
  }

  if (submission.status !== 'PENDING_VERIFICATION') {
    throw new BadRequestError(`Payment submission is already ${submission.status}`);
  }

  // 1. Process payment in accounting ledger
  const payment = await processPayment(
    {
      loanId: submission.loanId,
      amount: Number(submission.amount),
      method: submission.method as any,
      reference: submission.reference,
      paidAt: submission.paidAt,
    },
    actorUser.id
  );

  // 2. Mark submission as VERIFIED
  const updated = await prisma.paymentSubmission.update({
    where: { id: submission.id },
    data: {
      status: 'VERIFIED',
      verifiedByUserId: actorUser.id,
      verifiedAt: new Date(),
      paymentId: payment.id,
    },
  });

  // 3. Notify Borrower
  void sendNotification({
    userId: submission.customer.userId || undefined,
    customerId: submission.customerId,
    channel: 'IN_APP',
    type: 'SUCCESS',
    title: `EMI Payment Verified: ₹${Number(submission.amount).toLocaleString('en-IN')}`,
    message: `Your payment (Ref #${submission.reference}) for Loan #${submission.loan.loanNo} has been verified and settled in full.`,
  }).catch(() => {});

  await logAudit({
    userId: actorUser.id,
    action: 'PAYMENT_SUBMISSION_VERIFIED',
    entity: 'PaymentSubmission',
    entityId: submission.id,
    newValue: {
      submissionNo: submission.submissionNo,
      paymentId: payment.id,
      paymentNo: payment.paymentNo,
      amount: submission.amount,
      verifiedBy: actorUser.email,
    },
  });

  return updated;
}

export async function rejectPaymentSubmission(
  submissionId: string,
  reason: string,
  actorUser: { id: string; email?: string; roles: string[] }
) {
  const submission = await prisma.paymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      loan: true,
      customer: true,
    },
  });

  if (!submission) {
    throw new NotFoundError('Payment submission not found');
  }

  if (submission.status !== 'PENDING_VERIFICATION') {
    throw new BadRequestError(`Payment submission is already ${submission.status}`);
  }

  const updated = await prisma.paymentSubmission.update({
    where: { id: submission.id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason || 'Payment details could not be verified with banking records',
      verifiedByUserId: actorUser.id,
      verifiedAt: new Date(),
    },
  });

  // Notify Borrower
  void sendNotification({
    userId: submission.customer.userId || undefined,
    customerId: submission.customerId,
    channel: 'IN_APP',
    type: 'WARNING',
    title: `Payment Verification Rejected: Ref #${submission.reference}`,
    message: `Your payment submission #${submission.submissionNo} for Loan #${submission.loan.loanNo} was rejected: ${reason || 'Details could not be verified'}.`,
  }).catch(() => {});

  await logAudit({
    userId: actorUser.id,
    action: 'PAYMENT_SUBMISSION_REJECTED',
    entity: 'PaymentSubmission',
    entityId: submission.id,
    newValue: {
      submissionNo: submission.submissionNo,
      reason,
      rejectedBy: actorUser.email,
    },
  });

  return updated;
}
