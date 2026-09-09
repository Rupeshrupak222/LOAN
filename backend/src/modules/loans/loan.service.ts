import { Prisma, LoanStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';

export interface LoanActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export async function listLoans(
  params: PageParams,
  status?: string,
  branchId?: string,
  customerId?: string,
  userId?: string,
  actor?: LoanActorContext
) {
  const where: Prisma.LoanWhereInput = {};
  if (status) where.status = status as LoanStatus;
  if (branchId) where.branchId = branchId;
  if (customerId) where.customerId = customerId;
  if (userId) where.customer = { userId };

  // Enforce Tenant & Branch Scoping
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') ||
        actor.roles?.includes('LOAN_OFFICER') ||
        actor.roles?.includes('COLLECTION_OFFICER') ||
        actor.roles?.includes('COLLECTION_AGENT')) &&
      actor.branchId
    ) {
      where.branchId = actor.branchId;
    }
  }

  if (params.search) {
    where.OR = [
      { loanNo: { contains: params.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: params.search, mode: 'insensitive' } } },
      { customer: { customerCode: { contains: params.search, mode: 'insensitive' } } },
      { customer: { mobile: { contains: params.search } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: {
        customer: { select: { firstName: true, lastName: true, customerCode: true, mobile: true } },
        product: { select: { name: true, code: true, productType: true } },
        branch: { select: { name: true, code: true } },
      },
    }),
    prisma.loan.count({ where }),
  ]);

  return {
    data: rows.map((l) => ({
      id: l.id,
      loanNo: l.loanNo,
      customerName: `${l.customer.firstName} ${l.customer.lastName}`,
      customerCode: l.customer.customerCode,
      mobile: l.customer.mobile,
      productName: l.product.name,
      branchName: l.branch?.name,
      principal: l.principal.toFixed(2),
      interestRate: l.interestRate.toFixed(2),
      tenureMonths: l.tenureMonths,
      emiAmount: l.emiAmount.toFixed(2),
      outstandingPrincipal: l.outstandingPrincipal.toFixed(2),
      outstandingInterest: l.outstandingInterest.toFixed(2),
      nextDueDate: l.nextDueDate,
      status: l.status,
      disbursementDate: l.disbursementDate,
      createdAt: l.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getLoanDetail(id: string, actor?: LoanActorContext) {
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          bankAccounts: true,
          addresses: true,
        },
      },
      product: true,
      branch: true,
      application: {
        include: {
          eligibility: true,
          riskAssessment: true,
          underwriting: true,
        },
      },
      schedule: {
        orderBy: { emiNumber: 'asc' },
      },
      disbursements: {
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        include: { allocations: true },
        orderBy: { paidAt: 'desc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
      collectionCases: {
        include: { activities: true, promises: true },
        orderBy: { createdAt: 'desc' },
      },
      restructures: {
        orderBy: { createdAt: 'desc' },
      },
      settlements: true,
      closure: true,
      paymentSubmissions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!loan) throw new NotFoundError('Loan account not found');

  // Anti-IDOR: Enforce Tenant Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (loan.tenantId && actor.tenantId && loan.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Loan account belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') ||
        actor.roles?.includes('LOAN_OFFICER') ||
        actor.roles?.includes('COLLECTION_OFFICER') ||
        actor.roles?.includes('COLLECTION_AGENT')) &&
      actor.branchId &&
      loan.branchId &&
      loan.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Loan belongs to a different branch');
    }
  }

  const totalPaid = loan.payments.reduce(
    (acc, p) => (p.status === 'SUCCESS' ? Money.add(acc, p.amount) : acc),
    Money.of(0)
  );

  const totalDueInstallments = loan.schedule.filter(
    (s) => s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const totalPaidInstallments = loan.schedule.filter((s) => s.status === 'PAID').length;

  // Calculate Overdue Amount and Days Past Due (DPD)
  const now = new Date();
  const overdueItems = loan.schedule.filter(
    (s) => (s.status === 'OVERDUE' || (s.status === 'DUE' && new Date(s.dueDate) < now)) && Number(s.outstanding) > 0
  );
  const overdueAmount = overdueItems.reduce(
    (acc, s) => Money.add(acc, s.outstanding),
    Money.of(0)
  );
  let dpd = 0;
  if (overdueItems.length > 0) {
    const oldestDue = new Date(Math.min(...overdueItems.map((s) => new Date(s.dueDate).getTime())));
    dpd = Math.max(0, Math.floor((now.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24)));
  }
  if (loan.collectionCases?.[0]?.dpd && loan.collectionCases[0].dpd > dpd) {
    dpd = loan.collectionCases[0].dpd;
  }

  return {
    ...loan,
    metrics: {
      totalPaid: Money.toDb(totalPaid),
      totalInstallments: loan.schedule.length,
      paidInstallments: totalPaidInstallments,
      dueInstallments: totalDueInstallments,
      overdueAmount: Money.toDb(overdueAmount),
      dpd,
      progressPercent: loan.schedule.length > 0 ? Math.round((totalPaidInstallments / loan.schedule.length) * 100) : 0,
    },
  };
}
