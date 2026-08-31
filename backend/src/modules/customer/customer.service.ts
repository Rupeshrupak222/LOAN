import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateCustomerCode } from '../shared/codes';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import type {
  CreateCustomerInput,
  UpdateKycStatusInput,
  CreateAddressInput,
  CreateBankAccountInput,
} from './customer.schema';

export async function listCustomers(params: PageParams, status?: string, kycStatus?: string) {
  const where: Prisma.CustomerWhereInput = {};
  if (status) where.status = status as any;
  if (kycStatus) where.kycStatus = kycStatus as any;

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { mobile: { contains: params.search } },
      { customerCode: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { city: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: {
        branch: { select: { name: true, code: true } },
        _count: { select: { loans: true, applications: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: rows.map((c) => ({
      id: c.id,
      customerCode: c.customerCode,
      name: `${c.firstName} ${c.lastName}`,
      firstName: c.firstName,
      lastName: c.lastName,
      mobile: c.mobile,
      email: c.email,
      city: c.city,
      state: c.state,
      branchName: c.branch?.name,
      kycStatus: c.kycStatus,
      riskCategory: c.riskCategory,
      status: c.status,
      activeLoans: c._count.loans,
      totalApplications: c._count.applications,
      createdAt: c.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      branch: true,
      addresses: true,
      employmentDetails: true,
      bankAccounts: true,
      loans: {
        include: {
          product: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      applications: {
        include: {
          product: { select: { name: true, code: true } },
          eligibility: true,
          riskAssessment: true,
          underwriting: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      collectionCases: { orderBy: { createdAt: 'desc' } },
      payments: {
        include: { allocations: true },
        orderBy: { paidAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const totalOutstanding = customer.loans.reduce(
    (acc, l) => Money.add(acc, l.outstandingPrincipal),
    Money.of(0)
  );

  const totalBorrowed = customer.loans.reduce(
    (acc, l) => Money.add(acc, l.principal),
    Money.of(0)
  );

  const totalRepaid = customer.payments.reduce(
    (acc, p) => (p.status === 'SUCCESS' ? Money.add(acc, p.amount) : acc),
    Money.of(0)
  );

  return {
    ...customer,
    summary: {
      totalBorrowed: Money.toDb(totalBorrowed),
      totalRepaid: Money.toDb(totalRepaid),
      activeLoans: customer.loans.filter((l) => l.status === 'ACTIVE').length,
      closedLoans: customer.loans.filter((l) => l.status === 'CLOSED').length,
      overdueLoans: customer.loans.filter((l) => l.status === 'OVERDUE').length,
      currentOutstanding: Money.toDb(totalOutstanding),
    },
  };
}

export async function createCustomer(input: CreateCustomerInput, actorUserId?: string) {
  const customer = await prisma.$transaction(async (tx) => {
    const cust = await tx.customer.create({
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
        kycStatus: 'NOT_STARTED',
        status: 'DRAFT',
      },
    });

    if (input.addressLine && input.city) {
      await tx.customerAddress.create({
        data: {
          customerId: cust.id,
          addressType: 'CURRENT',
          addressLine: input.addressLine,
          city: input.city,
          state: input.state || '',
          pincode: input.pincode || '',
          isPrimary: true,
        },
      });
    }

    if (input.bankAccountNo && input.bankName) {
      await tx.customerBankAccount.create({
        data: {
          customerId: cust.id,
          accountHolderName: `${input.firstName} ${input.lastName}`,
          bankName: input.bankName,
          accountNumber: input.bankAccountNo,
          ifscCode: input.bankIfsc || '',
          accountType: 'SAVINGS',
          isPrimary: true,
        },
      });
    }

    if (input.employerName) {
      await tx.customerEmployment.create({
        data: {
          customerId: cust.id,
          employmentType: input.employmentType || 'SALARIED',
          employerName: input.employerName,
          designation: input.designation,
          monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : '0.00',
        },
      });
    }

    return cust;
  });

  await logAudit({
    userId: actorUserId,
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer.id,
    newValue: { code: customer.customerCode, name: `${customer.firstName} ${customer.lastName}` },
  });

  return customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput>,
  actorUserId?: string
) {
  const existing = await getCustomer(id);
  const data: Prisma.CustomerUpdateInput = { ...input };
  if (input.monthlyIncome != null) data.monthlyIncome = Money.toDb(input.monthlyIncome);
  if (input.existingObligations != null)
    data.existingObligations = Money.toDb(input.existingObligations);
  if (input.email) data.email = input.email.toLowerCase();

  const updated = await prisma.customer.update({ where: { id }, data });

  await logAudit({
    userId: actorUserId,
    action: 'CUSTOMER_UPDATED',
    entity: 'Customer',
    entityId: id,
    previousValue: { name: `${existing.firstName} ${existing.lastName}`, status: existing.status },
    newValue: data,
  });

  return updated;
}

export async function updateKycStatus(
  id: string,
  input: UpdateKycStatusInput,
  actorUserId?: string
) {
  const existing = await getCustomer(id);

  let newCustomerStatus = existing.status;
  if (input.kycStatus === 'VERIFIED') newCustomerStatus = 'ACTIVE';
  else if (input.kycStatus === 'REJECTED') newCustomerStatus = 'BLOCKED';
  else if (input.kycStatus === 'PENDING' || input.kycStatus === 'SUBMITTED')
    newCustomerStatus = 'KYC_PENDING';

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      kycStatus: input.kycStatus,
      riskCategory: input.riskCategory || existing.riskCategory,
      status: newCustomerStatus,
    },
  });

  await logAudit({
    userId: actorUserId,
    action: 'KYC_STATUS_UPDATED',
    entity: 'Customer',
    entityId: id,
    previousValue: { kycStatus: existing.kycStatus, status: existing.status },
    newValue: { kycStatus: input.kycStatus, status: newCustomerStatus, remarks: input.remarks },
  });

  return updated;
}

export async function addCustomerAddress(
  customerId: string,
  input: CreateAddressInput,
  actorUserId?: string
) {
  await getCustomer(customerId);
  if (input.isPrimary) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }
  const address = await prisma.customerAddress.create({
    data: { customerId, ...input },
  });

  await logAudit({
    userId: actorUserId,
    action: 'CUSTOMER_ADDRESS_ADDED',
    entity: 'CustomerAddress',
    entityId: address.id,
    newValue: input,
  });

  return address;
}

export async function addCustomerBankAccount(
  customerId: string,
  input: CreateBankAccountInput,
  actorUserId?: string
) {
  await getCustomer(customerId);
  if (input.isPrimary) {
    await prisma.customerBankAccount.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }
  const account = await prisma.customerBankAccount.create({
    data: { customerId, ...input },
  });

  await logAudit({
    userId: actorUserId,
    action: 'CUSTOMER_BANK_ACCOUNT_ADDED',
    entity: 'CustomerBankAccount',
    entityId: account.id,
    newValue: { bank: input.bankName, account: input.accountNumber },
  });

  return account;
}
