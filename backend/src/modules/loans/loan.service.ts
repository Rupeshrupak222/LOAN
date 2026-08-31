import { Prisma, LoanStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';

export async function listLoans(params: PageParams, status?: string, branchId?: string, customerId?: string) {
  const where: Prisma.LoanWhereInput = {};
  if (status) where.status = status as LoanStatus;
  if (branchId) where.branchId = branchId;
  if (customerId) where.customerId = customerId;

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

export async function getLoanDetail(id: string) {
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
    },
  });
  if (!loan) throw new NotFoundError('Loan account not found');

  const totalPaid = loan.payments.reduce(
    (acc, p) => (p.status === 'SUCCESS' ? Money.add(acc, p.amount) : acc),
    Money.of(0)
  );

  const totalDueInstallments = loan.schedule.filter(
    (s) => s.status === 'DUE' || s.status === 'OVERDUE'
  ).length;

  const totalPaidInstallments = loan.schedule.filter((s) => s.status === 'PAID').length;

  return {
    ...loan,
    metrics: {
      totalPaid: Money.toDb(totalPaid),
      totalInstallments: loan.schedule.length,
      paidInstallments: totalPaidInstallments,
      dueInstallments: totalDueInstallments,
      progressPercent: loan.schedule.length > 0 ? Math.round((totalPaidInstallments / loan.schedule.length) * 100) : 0,
    },
  };
}
