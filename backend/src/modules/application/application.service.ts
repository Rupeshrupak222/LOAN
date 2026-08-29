import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';
import type { CreateApplicationInput } from './application.schema';

// Allowed status transitions (guards the loan lifecycle).
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['KYC_PENDING', 'UNDER_REVIEW', 'CANCELLED'],
  KYC_PENDING: ['KYC_VERIFIED', 'REJECTED', 'CANCELLED'],
  KYC_VERIFIED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['CREDIT_ASSESSMENT', 'REJECTED', 'CANCELLED'],
  CREDIT_ASSESSMENT: ['UNDERWRITING', 'REJECTED', 'CANCELLED'],
  UNDERWRITING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['AGREEMENT_PENDING', 'CANCELLED'],
  REJECTED: [],
  AGREEMENT_PENDING: ['READY_FOR_DISBURSEMENT', 'CANCELLED'],
  READY_FOR_DISBURSEMENT: ['DISBURSED', 'CANCELLED'],
  DISBURSED: [],
  CANCELLED: [],
};

export async function listApplications(params: PageParams, status?: string) {
  const where = status ? { status: status as ApplicationStatus } : {};
  const [rows, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: { customer: true, product: true },
    }),
    prisma.loanApplication.count({ where }),
  ]);
  return {
    data: rows.map((a) => ({
      id: a.id,
      applicationNo: a.applicationNo,
      customerName: `${a.customer.firstName} ${a.customer.lastName}`,
      product: a.product.name,
      requestedAmount: a.requestedAmount.toFixed(2),
      tenureMonths: a.tenureMonths,
      status: a.status,
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
  const product = await prisma.loanProduct.findUnique({ where: { id: input.productId } });
  if (!product) throw new NotFoundError('Loan product not found');

  const amount = Money.of(input.requestedAmount);
  if (amount.lessThan(product.minAmount) || amount.greaterThan(product.maxAmount)) {
    throw new BadRequestError(
      `Amount must be between ${product.minAmount.toFixed(2)} and ${product.maxAmount.toFixed(2)}`,
    );
  }
  if (
    input.tenureMonths < product.minTenureMonths ||
    input.tenureMonths > product.maxTenureMonths
  ) {
    throw new BadRequestError(
      `Tenure must be between ${product.minTenureMonths} and ${product.maxTenureMonths} months`,
    );
  }

  return prisma.loanApplication.create({
    data: {
      applicationNo: generateApplicationNo(),
      customerId: input.customerId,
      productId: input.productId,
      requestedAmount: Money.toDb(input.requestedAmount),
      tenureMonths: input.tenureMonths,
      purpose: input.purpose,
      status: 'DRAFT',
      statusHistory: { create: { toStatus: 'DRAFT', reason: 'Application created' } },
    },
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loanApplication.update({
      where: { id },
      data: { status: toStatus },
    });
    await tx.applicationStatusHistory.create({
      data: { applicationId: id, fromStatus: app.status, toStatus, changedBy, reason },
    });
    return updated;
  });
}
