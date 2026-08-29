import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateCustomerCode } from '../shared/codes';
import { Money } from '../finance/money';
import type { CreateCustomerInput } from './customer.schema';

export async function listCustomers(params: PageParams) {
  const where: Prisma.CustomerWhereInput = params.search
    ? {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { mobile: { contains: params.search } },
          { customerCode: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: { _count: { select: { loans: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: rows.map((c) => ({
      id: c.id,
      customerCode: c.customerCode,
      name: `${c.firstName} ${c.lastName}`,
      mobile: c.mobile,
      email: c.email,
      kycStatus: c.kycStatus,
      riskCategory: c.riskCategory,
      status: c.status,
      activeLoans: c._count.loans,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      loans: true,
      applications: { include: { product: true } },
      documents: true,
    },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const totalOutstanding = customer.loans.reduce(
    (acc, l) => Money.add(acc, l.outstandingPrincipal),
    Money.of(0),
  );

  return {
    ...customer,
    summary: {
      activeLoans: customer.loans.filter((l) => l.status === 'ACTIVE').length,
      closedLoans: customer.loans.filter((l) => l.status === 'CLOSED').length,
      currentOutstanding: Money.toDb(totalOutstanding),
    },
  };
}

export async function createCustomer(input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      customerCode: generateCustomerCode(),
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      mobile: input.mobile,
      email: input.email?.toLowerCase(),
      addressLine: input.addressLine,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      employmentType: input.employmentType,
      employerName: input.employerName,
      monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : null,
      existingObligations:
        input.existingObligations != null ? Money.toDb(input.existingObligations) : null,
      bankName: input.bankName,
      bankAccountNo: input.bankAccountNo,
      bankIfsc: input.bankIfsc,
      branchId: input.branchId,
      status: 'KYC_PENDING',
    },
  });
}

export async function updateCustomer(id: string, input: Partial<CreateCustomerInput>) {
  await getCustomer(id);
  const data: Prisma.CustomerUpdateInput = { ...input };
  if (input.monthlyIncome != null) data.monthlyIncome = Money.toDb(input.monthlyIncome);
  if (input.existingObligations != null)
    data.existingObligations = Money.toDb(input.existingObligations);
  if (input.email) data.email = input.email.toLowerCase();
  delete (data as Record<string, unknown>).branchId;
  return prisma.customer.update({ where: { id }, data });
}
