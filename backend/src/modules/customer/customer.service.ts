import { Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { generateCustomerCode } from '../shared/codes';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type {
  CreateCustomerInput,
  UpdateKycStatusInput,
  CreateAddressInput,
  CreateBankAccountInput,
} from './customer.schema';

export interface CustomerActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export async function listCustomers(
  params: PageParams,
  status?: string,
  kycStatus?: string,
  actor?: CustomerActorContext
) {
  const where: Prisma.CustomerWhereInput = {};
  if (status) where.status = status as any;
  if (kycStatus) where.kycStatus = kycStatus as any;

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

export async function getCustomerByUserId(userId: string, actor?: CustomerActorContext) {
  const cust = await prisma.customer.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!cust) {
    throw new NotFoundError('Customer profile not found for current user account');
  }
  return getCustomer(cust.id, actor);
}

export async function getCustomer(id: string, actor?: CustomerActorContext) {
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

  // Anti-IDOR: Enforce Tenant Isolation
  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (customer.tenantId && actor.tenantId && customer.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Customer belongs to another institution');
    }
    if (
      (actor.roles?.includes('BRANCH_MANAGER') ||
        actor.roles?.includes('LOAN_OFFICER') ||
        actor.roles?.includes('COLLECTION_OFFICER') ||
        actor.roles?.includes('COLLECTION_AGENT')) &&
      actor.branchId &&
      customer.branchId &&
      customer.branchId !== actor.branchId
    ) {
      throw new ForbiddenError('Access forbidden: Customer belongs to a different branch');
    }
  }

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

  // If structured addresses array is empty but customer record has address data, ensure it is populated
  let addresses = customer.addresses || [];
  if (addresses.length === 0 && (customer.addressLine || customer.city || customer.state || customer.pincode)) {
    const fallbackLine = customer.addressLine || (customer.city ? `${customer.city}, ${customer.state || ''}`.trim() : 'Primary Address');
    try {
      const autoCreated = await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          addressType: 'CURRENT',
          addressLine: fallbackLine,
          city: customer.city || '',
          state: customer.state || '',
          pincode: customer.pincode || '',
          isPrimary: true,
        },
      });
      addresses = [autoCreated];
    } catch {
      addresses = [
        {
          id: `addr-legacy-${customer.id.slice(0, 8)}`,
          customerId: customer.id,
          addressType: 'CURRENT',
          addressLine: fallbackLine,
          city: customer.city || '',
          state: customer.state || '',
          pincode: customer.pincode || '',
          isPrimary: true,
          createdAt: customer.createdAt,
        } as any,
      ];
    }
  }

  // Deduplicate bank accounts to guarantee no duplicate cards are shown
  const rawBankAccounts = customer.bankAccounts || [];
  const seenBankKeys = new Set<string>();
  const bankAccounts = [];
  const sortedBanks = [...rawBankAccounts].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  for (const b of sortedBanks) {
    const key = `${b.accountNumber?.trim()}_${b.ifscCode?.trim()}`;
    if (!seenBankKeys.has(key)) {
      seenBankKeys.add(key);
      bankAccounts.push(b);
    }
  }

  return {
    ...customer,
    addresses,
    bankAccounts,
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

export async function createCustomer(
  input: CreateCustomerInput & { phone?: string; address?: any; bankAccount?: any; tenantId?: string },
  actorUserId?: string,
  actorOrTenantId?: string | CustomerActorContext
) {
  const tenantFromActor = typeof actorOrTenantId === 'string'
    ? actorOrTenantId
    : (actorOrTenantId as CustomerActorContext)?.tenantId;
  const effectiveTenantId = tenantFromActor || input.tenantId || 'tenant-adyapan-default';
  const mobile = input.mobile || input.phone || '';
  const addressLine = input.addressLine || input.address?.addressLine || null;
  const city = input.city || input.address?.city || null;
  const state = input.state || input.address?.state || null;
  const pincode = input.pincode || input.address?.pincode || null;

  const bankName = input.bankName || input.bankAccount?.bankName || null;
  const bankAccountNo = input.bankAccountNo || input.bankAccount?.accountNumber || input.bankAccount?.bankAccountNo || null;
  const bankIfsc = input.bankIfsc || input.bankAccount?.ifscCode || input.bankAccount?.bankIfsc || null;

  // Compute password hash outside transaction
  const rawPassword =
    input.password && input.password.trim().length >= 6
      ? input.password.trim()
      : process.env.DEFAULT_USER_PASSWORD || 'TemporarySetup@2026';
  const passwordHash = input.email ? await argon2.hash(rawPassword, { type: argon2.argon2id }) : null;

  const customer = await prisma.$transaction(async (tx) => {
    let customerUserId: string | undefined = undefined;

    // If email is provided, create linked User account with CUSTOMER role and hashed password
    if (input.email && passwordHash) {
      const cleanEmail = input.email.toLowerCase().trim();
      const customerRole = await tx.role.findUnique({ where: { name: 'CUSTOMER' } });

      const user = await tx.user.upsert({
        where: { email: cleanEmail },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          status: 'ACTIVE',
          tenantId: effectiveTenantId,
          ...(input.branchId ? { branchId: input.branchId } : {}),
        },
        create: {
          email: cleanEmail,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          status: 'ACTIVE',
          tenantId: effectiveTenantId,
          branchId: input.branchId,
        },
      });

      if (customerRole) {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
          update: {},
          create: { userId: user.id, roleId: customerRole.id },
        });
      }

      customerUserId = user.id;
    }

    const cleanEmail = input.email ? input.email.toLowerCase().trim() : undefined;

    // Check if a Customer profile already exists for this userId, email, or mobile
    const existingCust = await tx.customer.findFirst({
      where: {
        OR: [
          ...(customerUserId ? [{ userId: customerUserId }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          { mobile: mobile || input.mobile },
        ],
      },
    });

    let cust;
    if (existingCust) {
      cust = await tx.customer.update({
        where: { id: existingCust.id },
        data: {
          userId: customerUserId || existingCust.userId,
          tenantId: effectiveTenantId,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth || existingCust.dateOfBirth,
          gender: input.gender || existingCust.gender,
          mobile: mobile || input.mobile,
          email: cleanEmail || existingCust.email,
          addressLine: addressLine || input.addressLine || existingCust.addressLine,
          city: city || input.city || existingCust.city,
          state: state || input.state || existingCust.state,
          pincode: pincode || input.pincode || existingCust.pincode,
          employmentType: input.employmentType || existingCust.employmentType,
          employerName: input.employerName || existingCust.employerName,
          monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : existingCust.monthlyIncome,
          bankName: bankName || input.bankName || existingCust.bankName,
          bankAccountNo: bankAccountNo || input.bankAccountNo || existingCust.bankAccountNo,
          bankIfsc: bankIfsc || input.bankIfsc || existingCust.bankIfsc,
        },
      });
    } else {
      cust = await tx.customer.create({
        data: {
          userId: customerUserId,
          tenantId: effectiveTenantId,
          customerCode: generateCustomerCode(),
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          mobile: mobile || input.mobile,
          email: cleanEmail,
          addressLine: addressLine || input.addressLine,
          city: city || input.city,
          state: state || input.state,
          pincode: pincode || input.pincode,
          employmentType: input.employmentType,
          employerName: input.employerName,
          monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : null,
          existingObligations:
            input.existingObligations != null ? Money.toDb(input.existingObligations) : null,
          bankName: bankName || input.bankName,
          bankAccountNo: bankAccountNo || input.bankAccountNo,
          bankIfsc: bankIfsc || input.bankIfsc,
          branchId: input.branchId,
          kycStatus: 'NOT_STARTED',
          status: 'DRAFT',
        },
      });
    }

    if (addressLine || city || input.addressLine || input.city) {
      const existingAddr = await tx.customerAddress.findFirst({ where: { customerId: cust.id } });
      if (!existingAddr) {
        await tx.customerAddress.create({
          data: {
            customerId: cust.id,
            addressType: 'CURRENT',
            addressLine: (addressLine || input.addressLine) || (city || input.city ? `${city || input.city}, ${state || input.state || ''}`.trim() : 'Primary Address'),
            city: (city || input.city) || '',
            state: (state || input.state) || '',
            pincode: (pincode || input.pincode) || '',
            isPrimary: true,
          },
        });
      }
    }

    if ((bankAccountNo || input.bankAccountNo) && (bankName || input.bankName)) {
      const accNo = (bankAccountNo || input.bankAccountNo)!.trim();
      const bName = (bankName || input.bankName)!.trim();
      const existingBank = await tx.customerBankAccount.findFirst({
        where: { customerId: cust.id, accountNumber: accNo },
      });
      if (!existingBank) {
        await tx.customerBankAccount.create({
          data: {
            customerId: cust.id,
            accountHolderName: `${input.firstName} ${input.lastName}`.trim(),
            bankName: bName,
            accountNumber: accNo,
            ifscCode: (bankIfsc || input.bankIfsc || '')!.trim(),
            accountType: input.employmentType === 'SALARIED' ? 'SALARY' : 'SAVINGS',
            isPrimary: true,
          },
        });
      }
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
  }, { maxWait: 20000, timeout: 60000 });

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: effectiveTenantId,
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer.id,
    newValue: { code: customer.customerCode, name: `${customer.firstName} ${customer.lastName}` },
  }).catch(() => {});

  return customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput> & { phone?: string; address?: any; bankAccount?: any },
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const existing = await getCustomer(id, actor);

  const mobile = input.mobile !== undefined ? input.mobile : input.phone;
  const addressLine = input.addressLine !== undefined ? input.addressLine : input.address?.addressLine;
  const city = input.city !== undefined ? input.city : input.address?.city;
  const state = input.state !== undefined ? input.state : input.address?.state;
  const pincode = input.pincode !== undefined ? input.pincode : input.address?.pincode;

  const bankName = input.bankName !== undefined ? input.bankName : input.bankAccount?.bankName;
  const bankAccountNo = input.bankAccountNo !== undefined ? input.bankAccountNo : (input.bankAccount?.accountNumber || input.bankAccount?.bankAccountNo);
  const bankIfsc = input.bankIfsc !== undefined ? input.bankIfsc : (input.bankAccount?.ifscCode || input.bankAccount?.bankIfsc);

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.CustomerUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (mobile !== undefined) data.mobile = mobile;
    if (input.email !== undefined) data.email = input.email ? input.email.toLowerCase().trim() : null;
    if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth;
    if (input.gender !== undefined) data.gender = input.gender;
    if (addressLine !== undefined) data.addressLine = addressLine;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (pincode !== undefined) data.pincode = pincode;
    if (input.employmentType !== undefined) data.employmentType = input.employmentType;
    if (input.employerName !== undefined) data.employerName = input.employerName;
    if (input.monthlyIncome !== undefined) {
      data.monthlyIncome = input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : null;
    }
    if (input.existingObligations !== undefined) {
      data.existingObligations = input.existingObligations != null ? Money.toDb(input.existingObligations) : null;
    }
    if (bankName !== undefined) data.bankName = bankName;
    if (bankAccountNo !== undefined) data.bankAccountNo = bankAccountNo;
    if (bankIfsc !== undefined) data.bankIfsc = bankIfsc;

    // 1. If password or user details updated, sync with User table
    if (existing.userId) {
      const userUpdate: Prisma.UserUpdateInput = {};
      if (input.firstName) userUpdate.firstName = input.firstName;
      if (input.lastName) userUpdate.lastName = input.lastName;
      if (input.email) userUpdate.email = input.email.toLowerCase().trim();
      if (input.password && input.password.trim().length >= 6) {
        userUpdate.passwordHash = await argon2.hash(input.password.trim(), { type: argon2.argon2id });
      }
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: existing.userId }, data: userUpdate });
      }
    } else if (input.email) {
      // Create user if not linked previously
      const customerRole = await tx.role.findUnique({ where: { name: 'CUSTOMER' } });
      const rawPassword = input.password && input.password.trim().length >= 6 ? input.password.trim() : (process.env.DEFAULT_USER_PASSWORD || 'TemporarySetup@2026');
      const passwordHash = await argon2.hash(rawPassword, { type: argon2.argon2id });
      const newUser = await tx.user.upsert({
        where: { email: input.email.toLowerCase().trim() },
        update: {
          firstName: input.firstName || existing.firstName,
          lastName: input.lastName || existing.lastName,
          passwordHash,
          status: 'ACTIVE',
          tenantId: existing.tenantId,
        },
        create: {
          email: input.email.toLowerCase().trim(),
          firstName: input.firstName || existing.firstName,
          lastName: input.lastName || existing.lastName,
          passwordHash,
          status: 'ACTIVE',
          tenantId: existing.tenantId,
        },
      });
      if (customerRole) {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId: newUser.id, roleId: customerRole.id } },
          update: {},
          create: { userId: newUser.id, roleId: customerRole.id },
        });
      }
      data.user = { connect: { id: newUser.id } };
    }

    // 2. Sync Address table if address updated
    if (addressLine !== undefined || city !== undefined || state !== undefined || pincode !== undefined) {
      const primaryAddr = await tx.customerAddress.findFirst({ where: { customerId: id, isPrimary: true } });
      if (primaryAddr) {
        await tx.customerAddress.update({
          where: { id: primaryAddr.id },
          data: {
            addressLine: addressLine !== undefined ? (addressLine || primaryAddr.addressLine) : primaryAddr.addressLine,
            city: city !== undefined ? (city || primaryAddr.city) : primaryAddr.city,
            state: state !== undefined ? (state || primaryAddr.state) : primaryAddr.state,
            pincode: pincode !== undefined ? (pincode || primaryAddr.pincode) : primaryAddr.pincode,
          },
        });
      } else if (addressLine || city || state || pincode) {
        await tx.customerAddress.create({
          data: {
            customerId: id,
            addressType: 'CURRENT',
            addressLine: addressLine || (city ? `${city}, ${state || ''}`.trim() : 'Primary Address'),
            city: city || '',
            state: state || '',
            pincode: pincode || '',
            isPrimary: true,
          },
        });
      }
    }

    // 3. Sync Bank Account table if bank details updated
    if (bankName || bankAccountNo) {
      const primaryBank = await tx.customerBankAccount.findFirst({ where: { customerId: id, isPrimary: true } });
      if (primaryBank) {
        await tx.customerBankAccount.update({
          where: { id: primaryBank.id },
          data: {
            bankName: bankName ?? primaryBank.bankName,
            accountNumber: bankAccountNo ?? primaryBank.accountNumber,
            ifscCode: bankIfsc ?? primaryBank.ifscCode,
          },
        });
      } else if (bankName && bankAccountNo) {
        await tx.customerBankAccount.create({
          data: {
            customerId: id,
            bankName,
            accountNumber: bankAccountNo,
            ifscCode: bankIfsc || '',
            accountHolderName: `${input.firstName || existing.firstName} ${input.lastName || existing.lastName}`,
            accountType: 'SAVINGS',
            isPrimary: true,
          },
        });
      }
    }

    // 4. Sync Employment table if employment details updated
    if (input.employerName || input.employmentType || input.monthlyIncome) {
      const primaryEmp = await tx.customerEmployment.findFirst({ where: { customerId: id } });
      if (primaryEmp) {
        await tx.customerEmployment.update({
          where: { id: primaryEmp.id },
          data: {
            employerName: input.employerName ?? primaryEmp.employerName,
            employmentType: input.employmentType ?? primaryEmp.employmentType,
            designation: input.designation ?? primaryEmp.designation,
            monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : primaryEmp.monthlyIncome,
          },
        });
      } else if (input.employerName) {
        await tx.customerEmployment.create({
          data: {
            customerId: id,
            employerName: input.employerName,
            employmentType: input.employmentType || 'SALARIED',
            designation: input.designation,
            monthlyIncome: input.monthlyIncome != null ? Money.toDb(input.monthlyIncome) : '0.00',
          },
        });
      }
    }

    // 5. Update customer record
    return tx.customer.update({ where: { id }, data });
  });

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: existing.tenantId || undefined,
    action: 'CUSTOMER_UPDATED',
    entity: 'Customer',
    entityId: id,
    previousValue: { name: `${existing.firstName} ${existing.lastName}`, status: existing.status },
    newValue: input,
  }).catch(() => {});

  return updated;
}

export async function updateKycStatus(
  id: string,
  input: UpdateKycStatusInput,
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const existing = await getCustomer(id, actor);

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

  // Synchronize related pending loan applications if KYC status is VERIFIED
  if (input.kycStatus === 'VERIFIED') {
    const pendingApps = await prisma.loanApplication.findMany({
      where: {
        customerId: id,
        status: { in: ['KYC_PENDING', 'DRAFT'] },
      },
    });
    for (const app of pendingApps) {
      if (app.status === 'KYC_PENDING') {
        await prisma.loanApplication.update({
          where: { id: app.id },
          data: { status: 'KYC_VERIFIED' },
        });
        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: app.status,
            toStatus: 'KYC_VERIFIED',
            changedBy: actorUserId || 'Credit Analyst / KYC Compliance',
            reason: input.remarks || 'Customer identity & KYC compliance successfully verified',
          },
        });
      }
    }
  }

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: existing.tenantId || undefined,
    action: 'KYC_STATUS_UPDATED',
    entity: 'Customer',
    entityId: id,
    previousValue: { kycStatus: existing.kycStatus, status: existing.status },
    newValue: { kycStatus: input.kycStatus, status: newCustomerStatus, remarks: input.remarks },
  }).catch(() => {});

  // Async non-blocking notification
  void sendNotification({
    customerId: id,
    channel: 'IN_APP',
    type: input.kycStatus === 'VERIFIED' ? 'SUCCESS' : input.kycStatus === 'REJECTED' ? 'ALERT' : 'INFO',
    title: `KYC Compliance Status: ${input.kycStatus}`,
    message: input.kycStatus === 'VERIFIED'
      ? 'Your identity documents and KYC verification have been approved.'
      : `Your KYC status was updated to ${input.kycStatus}. ${input.remarks ? `Remarks: ${input.remarks}` : ''}`,
  }).catch(() => {});

  return updated;
}

export async function addCustomerAddress(
  customerId: string,
  input: CreateAddressInput,
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const existing = await getCustomer(customerId, actor);
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
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: existing.tenantId || undefined,
    action: 'CUSTOMER_ADDRESS_ADDED',
    entity: 'CustomerAddress',
    entityId: address.id,
    newValue: input,
  }).catch(() => {});

  return address;
}

export async function addCustomerBankAccount(
  customerId: string,
  input: CreateBankAccountInput,
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const existing = await getCustomer(customerId, actor);
  const cleanAccountNo = input.accountNumber.trim();
  const cleanIfsc = input.ifscCode.toUpperCase().trim();

  if (input.isPrimary) {
    await prisma.customerBankAccount.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }

  const existingBank = await prisma.customerBankAccount.findFirst({
    where: {
      customerId,
      accountNumber: cleanAccountNo,
    },
  });

  if (existingBank) {
    const updated = await prisma.customerBankAccount.update({
      where: { id: existingBank.id },
      data: {
        bankName: input.bankName.trim(),
        ifscCode: cleanIfsc,
        accountHolderName: input.accountHolderName.trim(),
        accountType: input.accountType || existingBank.accountType,
        isPrimary: input.isPrimary ?? existingBank.isPrimary,
      },
    });

    await logAudit({
      userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
      tenantId: existing.tenantId || undefined,
      action: 'CUSTOMER_BANK_ACCOUNT_UPDATED',
      entity: 'CustomerBankAccount',
      entityId: updated.id,
      newValue: { bank: input.bankName, account: cleanAccountNo },
    }).catch(() => {});

    return updated;
  }

  const account = await prisma.customerBankAccount.create({
    data: {
      customerId,
      bankName: input.bankName.trim(),
      accountNumber: cleanAccountNo,
      ifscCode: cleanIfsc,
      accountHolderName: input.accountHolderName.trim(),
      accountType: input.accountType || 'SAVINGS',
      isPrimary: input.isPrimary ?? true,
    },
  });

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: existing.tenantId || undefined,
    action: 'CUSTOMER_BANK_ACCOUNT_ADDED',
    entity: 'CustomerBankAccount',
    entityId: account.id,
    newValue: { bank: input.bankName, account: cleanAccountNo },
  }).catch(() => {});

  return account;
}

export async function deleteCustomerBankAccount(
  customerId: string,
  bankAccountId: string,
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const existing = await getCustomer(customerId, actor);
  const account = await prisma.customerBankAccount.findFirst({
    where: { id: bankAccountId, customerId },
  });
  if (!account) throw new NotFoundError('Bank account record not found');

  await prisma.customerBankAccount.delete({
    where: { id: bankAccountId },
  });

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: existing.tenantId || undefined,
    action: 'CUSTOMER_BANK_ACCOUNT_DELETED',
    entity: 'CustomerBankAccount',
    entityId: bankAccountId,
    newValue: { bank: account.bankName, account: account.accountNumber },
  }).catch(() => {});

  return { success: true, message: 'Bank account record deleted successfully' };
}

export async function deleteCustomer(
  id: string,
  actorUserId?: string,
  actor?: CustomerActorContext
) {
  const customer = await getCustomer(id, actor);

  // Perform cascading deletion in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Delete notifications
    await tx.notification.deleteMany({ where: { customerId: id } });

    // 2. Delete collection cases & activities
    const caseIds = (await tx.collectionCase.findMany({ where: { customerId: id }, select: { id: true } })).map((c) => c.id);
    if (caseIds.length > 0) {
      await tx.collectionActivity.deleteMany({ where: { caseId: { in: caseIds } } });
      await tx.promiseToPay.deleteMany({ where: { caseId: { in: caseIds } } });
      await tx.collectionCase.deleteMany({ where: { id: { in: caseIds } } });
    }

    // 3. Delete payments & allocations
    const paymentIds = (await tx.payment.findMany({ where: { customerId: id }, select: { id: true } })).map((p) => p.id);
    if (paymentIds.length > 0) {
      await tx.paymentAllocation.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }

    // 4. Delete loans and related records
    const loanIds = customer.loans.map((l) => l.id);
    if (loanIds.length > 0) {
      await tx.loanClosure.deleteMany({ where: { loanId: { in: loanIds } } });
      await tx.settlement.deleteMany({ where: { loanId: { in: loanIds } } });
      await tx.loanRestructure.deleteMany({ where: { loanId: { in: loanIds } } });
      await tx.disbursement.deleteMany({ where: { loanId: { in: loanIds } } });
      await tx.repaymentScheduleItem.deleteMany({ where: { loanId: { in: loanIds } } });
      await tx.loan.deleteMany({ where: { id: { in: loanIds } } });
    }

    // 5. Delete loan applications and underwriting records
    const appIds = customer.applications.map((a) => a.id);
    if (appIds.length > 0) {
      await tx.underwritingDecision.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.riskAssessment.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.eligibilityAssessment.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.applicationStatusHistory.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.loanApplication.deleteMany({ where: { id: { in: appIds } } });
    }

    // 6. Delete documents, addresses, bank accounts, employment
    await tx.document.deleteMany({ where: { customerId: id } });
    await tx.customerAddress.deleteMany({ where: { customerId: id } });
    await tx.customerBankAccount.deleteMany({ where: { customerId: id } });
    await tx.customerEmployment.deleteMany({ where: { customerId: id } });

    // 7. Delete customer record
    await tx.customer.delete({ where: { id } });

    // 8. Delete linked User login account if exists
    if (customer.userId) {
      await tx.userRole.deleteMany({ where: { userId: customer.userId } });
      await tx.notification.deleteMany({ where: { userId: customer.userId } });
      await tx.refreshToken.deleteMany({ where: { userId: customer.userId } });
      await tx.user.delete({ where: { id: customer.userId } }).catch(() => {});
    }
  });

  await logAudit({
    userId: actorUserId?.startsWith('usr-') ? actorUserId : undefined,
    tenantId: customer.tenantId || undefined,
    action: 'CUSTOMER_DELETED',
    entity: 'Customer',
    entityId: id,
    previousValue: {
      code: customer.customerCode,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
    },
  }).catch(() => {});

  return { success: true, message: `Customer ${customer.customerCode} permanently deleted from database` };
}
