import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';
import { sendNotification } from '../notifications/notification.service';
import type { CreateApplicationInput } from './application.schema';

export interface ApplicationActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

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

export async function listApplications(
  params: PageParams,
  status?: string,
  userId?: string,
  actor?: ApplicationActorContext
) {
  const where: any = {};
  if (status) where.status = status as ApplicationStatus;
  if (userId) where.customer = { userId };

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { applicationNo: { contains: q, mode: 'insensitive' } },
      { customer: { firstName: { contains: q, mode: 'insensitive' } } },
      { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      { customer: { email: { contains: q, mode: 'insensitive' } } },
      { customer: { mobile: { contains: q } } },
      { customer: { customerCode: { contains: q, mode: 'insensitive' } } },
      { product: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

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
      kycStatus: a.customer?.kycStatus || 'NOT_STARTED',
      riskCategory: a.customer?.riskCategory || 'PENDING',
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

const appCache = new Map<string, { data: any; expiresAt: number }>();

export function invalidateAppCache(id?: string) {
  if (id) appCache.delete(id);
  else appCache.clear();
}

export async function getApplication(id: string, actor?: ApplicationActorContext) {
  const cached = appCache.get(id);
  let app = cached && cached.expiresAt > Date.now() ? cached.data : null;

  if (!app) {
    app = await prisma.loanApplication.findUnique({
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
    appCache.set(id, { data: app, expiresAt: Date.now() + 30_000 }); // 30s cache
  }

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  return app;
}

export async function createApplication(
  input: CreateApplicationInput,
  actor?: ApplicationActorContext
) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const effectiveTenantId = customer.tenantId || actor?.tenantId;

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && customer.tenantId && customer.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Customer belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      customer.branchId &&
      customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Customer belongs to another branch');
    }
  }

  let product = input.productId
    ? await prisma.loanProduct.findUnique({ where: { id: input.productId } })
    : null;

  // If custom interest rate or product name provided or product doesn't exist
  if (input.interestRate != null || !product) {
    const rate = input.interestRate != null ? Number(input.interestRate) : (product ? Number(product.interestRate) : 14.5);
    const prodName = input.productName || (product ? product.name : `Custom Loan (${rate}% p.a.)`);
    const prodCode = `CUST-${rate.toString().replace('.', '_')}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    product = await prisma.loanProduct.create({
      data: {
        code: prodCode,
        name: prodName,
        tenantId: effectiveTenantId,
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
      tenantId: effectiveTenantId,
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
  actor?: ApplicationActorContext
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!app) throw new NotFoundError('Application not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId && app.tenantId && app.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Application belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) &&
      actor.branchId &&
      app.customer?.branchId &&
      app.customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Application belongs to another branch');
    }
  }

  // Role-state authorization: Loan Officer, Credit Analyst, and Underwriter transition boundaries
  const isPrivilegedAdmin = actor?.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
  );
  const isPrivilegedDecider = actor?.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER'].includes(r)
  );
  if (actor?.roles?.includes('LOAN_OFFICER') && !isPrivilegedDecider) {
    const allowedForLoanOfficer: ApplicationStatus[] = ['SUBMITTED', 'CANCELLED'];
    if (!allowedForLoanOfficer.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Loan Officer can only submit or cancel applications, not transition to '${toStatus}'.`
      );
    }
  }

  if (actor?.roles?.includes('CREDIT_ANALYST') && !isPrivilegedDecider) {
    const allowedForCreditAnalyst: ApplicationStatus[] = [
      'UNDER_REVIEW',
      'CREDIT_ASSESSMENT',
      'UNDERWRITING',
      'SUBMITTED',
    ];
    if (!allowedForCreditAnalyst.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Credit Analysts cannot approve, reject, sanction, or disburse loans. Allowed transitions: ${allowedForCreditAnalyst.join(', ')}.`
      );
    }
  }

  if (actor?.roles?.includes('UNDERWRITER') && !isPrivilegedAdmin) {
    const forbiddenForUnderwriter: ApplicationStatus[] = [
      'DISBURSED',
      'READY_FOR_DISBURSEMENT',
      'AGREEMENT_PENDING',
    ];
    if (forbiddenForUnderwriter.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Underwriters cannot transition applications to '${toStatus}'. Post-sanction agreement processing and disbursement execution must be conducted by authorized Finance Officers.`
      );
    }
  }

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

  invalidateAppCache(id);

  // Async non-blocking notification to applicant
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: ['APPROVED', 'DISBURSED'].includes(toStatus)
      ? 'SUCCESS'
      : toStatus === 'REJECTED'
      ? 'ALERT'
      : 'INFO',
    title: `Application ${app.applicationNo} Status: ${toStatus}`,
    message: reason || `Your loan application has progressed to ${toStatus}.`,
    metadata: { applicationId: id, link: `/applications/${id}` },
  }).catch(() => {});

  return result;
}
