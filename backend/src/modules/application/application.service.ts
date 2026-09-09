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
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  KYC_PENDING: ['KYC_VERIFIED', 'REJECTED', 'CANCELLED'],
  KYC_VERIFIED: ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['CREDIT_ASSESSMENT', 'UNDERWRITING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  CREDIT_ASSESSMENT: ['UNDERWRITING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDERWRITING: ['APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED'],
  APPROVED: ['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'UNDERWRITING', 'SUBMITTED', 'CANCELLED'],
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

export async function getApplication(id: string, actor?: ApplicationActorContext) {
  const app = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          bankAccounts: { orderBy: { createdAt: 'desc' } },
          employmentDetails: { orderBy: { createdAt: 'desc' } },
          addresses: { orderBy: { createdAt: 'desc' } },
        },
      },
      product: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
      eligibility: true,
      riskAssessment: true,
      underwriting: true,
      approvals: { orderBy: { createdAt: 'desc' } },
    },
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

  // Role-state authorization: Loan Officer, Credit Analyst, Underwriter, and Branch Manager transition boundaries
  if (actor?.roles?.includes('AUDITOR')) {
    throw new ForbiddenError('Access forbidden: Auditors have read-only access and cannot transition application statuses');
  }

  // Branch Manager cannot force final credit approval, rejection, agreement pending, or disbursement states
  if (actor?.roles?.includes('BRANCH_MANAGER')) {
    const forbiddenForBranchManager: ApplicationStatus[] = [
      'APPROVED',
      'REJECTED',
      'READY_FOR_DISBURSEMENT',
      'DISBURSED',
      'AGREEMENT_PENDING',
    ];
    if (forbiddenForBranchManager.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Branch Manager cannot transition applications to '${toStatus}'. Credit decisions and financial disbursements require Underwriter and Finance Officer authorization.`
      );
    }
  }

  if (actor?.roles?.includes('LOAN_OFFICER')) {
    const allowedForLoanOfficer: ApplicationStatus[] = ['SUBMITTED', 'CANCELLED'];
    if (!allowedForLoanOfficer.includes(toStatus)) {
      throw new ForbiddenError(
        `Access forbidden: Loan Officer can only submit or cancel applications, not transition to '${toStatus}'.`
      );
    }
  }

  if (actor?.roles?.includes('CREDIT_ANALYST')) {
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

  if (toStatus === 'CREDIT_ASSESSMENT') {
    const canStartCredit = actor?.roles?.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CREDIT_ANALYST'].includes(r)
    );
    if (!canStartCredit) {
      throw new ForbiddenError(
        'Access forbidden: Only Credit Analysts can initiate credit assessment'
      );
    }
    if (app.status !== 'SUBMITTED') {
      throw new BadRequestError(
        `Cannot start credit assessment: Application is in '${app.status}' status (must be in 'SUBMITTED' status).`
      );
    }
  }

  if (actor?.roles?.includes('UNDERWRITER')) {
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

  const isPrivilegedAdmin = actor?.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
  );

  if (
    (actor?.roles?.includes('COLLECTION_OFFICER') || actor?.roles?.includes('FINANCE_OFFICER')) &&
    !isPrivilegedAdmin
  ) {
    throw new ForbiddenError(
      'Access forbidden: Neither Collection Officers nor Finance Officers have authority to transition loan applications or modify credit/underwriting decisions.'
    );
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
