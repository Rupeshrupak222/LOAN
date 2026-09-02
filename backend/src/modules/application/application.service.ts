import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';
import { sendNotification } from '../notifications/notification.service';
import type { CreateApplicationInput } from './application.schema';

// Allowed status transitions (guards the loan lifecycle).
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  SUBMITTED: ['KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  KYC_PENDING: ['KYC_VERIFIED', 'REJECTED', 'CANCELLED'],
  KYC_VERIFIED: ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['CREDIT_ASSESSMENT', 'UNDERWRITING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  CREDIT_ASSESSMENT: ['UNDERWRITING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDERWRITING: ['APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED'],
  APPROVED: ['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'CANCELLED'],
  REJECTED: [],
  AGREEMENT_PENDING: ['READY_FOR_DISBURSEMENT', 'CANCELLED'],
  READY_FOR_DISBURSEMENT: ['DISBURSED', 'CANCELLED'],
  DISBURSED: [],
  CANCELLED: [],
};

export async function listApplications(params: PageParams, status?: string, userId?: string) {
  const where: any = {};
  if (status) where.status = status as ApplicationStatus;
  if (userId) where.customer = { userId };

  const [rows, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: { customer: true, product: true, eligibility: true, riskAssessment: true, underwriting: true },
    }),
    prisma.loanApplication.count({ where }),
  ]);
  return {
    data: rows.map((a) => ({
      id: a.id,
      applicationNo: a.applicationNo,
      customerId: a.customerId,
      customer: a.customer,
      customerName: `${a.customer.firstName} ${a.customer.lastName}`,
      product: a.product.name,
      productDetail: a.product,
      requestedAmount: a.requestedAmount.toFixed(2),
      tenureMonths: a.tenureMonths,
      purpose: a.purpose,
      status: a.status,
      eligibility: a.eligibility,
      riskAssessment: a.riskAssessment,
      underwriting: a.underwriting,
      createdAt: a.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getApplication(id: string) {
  const app = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
    },
  });
  if (!app) throw new NotFoundError('Application not found');
  return app;
}

export async function createApplication(input: CreateApplicationInput) {
  let product = input.productId
    ? await prisma.loanProduct.findUnique({ where: { id: input.productId } })
    : null;

  // If custom interest rate or product name provided or product doesn't exist
  if (input.interestRate != null || !product) {
    const rate = input.interestRate != null ? Number(input.interestRate) : (product ? Number(product.interestRate) : 14.5);
    const prodName = input.productName || (product ? product.name : `Custom Loan (${rate}% p.a.)`);
    const prodCode = `CUST-${rate.toString().replace('.', '_')}-${Date.now().toString().slice(-4)}`;

    product = await prisma.loanProduct.create({
      data: {
        code: prodCode,
        name: prodName,
        productType: 'PERSONAL',
        interestRate: Money.round(rate).toFixed(3),
        minAmount: Money.toDb(100),
        maxAmount: Money.toDb(1000000000),
        minTenureMonths: 1,
        maxTenureMonths: 360,
        isActive: true,
      },
    });
  }

  return prisma.loanApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      customerId: input.customerId,
      productId: product.id,
      requestedAmount: Money.toDb(input.requestedAmount),
      tenureMonths: input.tenureMonths,
      purpose: input.purpose,
      status: 'DRAFT',
      statusHistory: { create: { toStatus: 'DRAFT', reason: 'Application created' } },
    },
    include: { customer: true, product: true },
  });
}

export async function transition(
  id: string,
  toStatus: ApplicationStatus,
  changedBy?: string,
  reason?: string,
) {
  const app = await prisma.loanApplication.findUnique({ where: { id } });
  if (!app) throw new NotFoundError('Application not found');

  const allowed = TRANSITIONS[app.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new BadRequestError(`Cannot move application from ${app.status} to ${toStatus}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.loanApplication.update({
      where: { id },
      data: { status: toStatus },
    });
    await tx.applicationStatusHistory.create({
      data: { applicationId: id, fromStatus: app.status, toStatus, changedBy, reason },
    });
    return updated;
  });

  // Async non-blocking notification to applicant
  void sendNotification({
    customerId: app.customerId,
    title: `Application ${app.applicationNo} Status: ${toStatus}`,
    message: reason || `Your loan application has progressed to ${toStatus}.`,
    type: ['APPROVED', 'DISBURSED'].includes(toStatus)
      ? 'SUCCESS'
      : toStatus === 'REJECTED'
      ? 'ALERT'
      : 'INFO',
    metadata: { applicationId: id, link: `/applications/${id}` },
  });

  return result;
}
