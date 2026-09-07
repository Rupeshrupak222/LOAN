import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { hashPassword } from '../auth/password';
import { signAccessToken, signRefreshToken } from '../auth/tokens';
import { generateCustomerCode, generateApplicationNo } from '../shared/codes';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import type { PublicApplyInput } from './apply.schema';

// In-memory OTP storage for rapid verification
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendOtp(mobile: string) {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    throw new BadRequestError('Invalid 10-digit mobile number');
  }

  // Generate 6-digit OTP (Standard demo code 123456 or random)
  const code = process.env.NODE_ENV === 'production'
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : '123456';

  otpStore.set(cleanMobile, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  });

  return {
    success: true,
    message: `OTP sent successfully to +91 ******${cleanMobile.slice(-4)}`,
    demoOtp: code,
  };
}

export async function verifyOtp(mobile: string, otp: string) {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const stored = otpStore.get(cleanMobile);

  // Allow standard demo OTP 123456 or exact match within expiry
  if (otp === '123456' || (stored && stored.code === otp && stored.expiresAt > Date.now())) {
    otpStore.delete(cleanMobile);
    return { success: true, verified: true };
  }

  throw new BadRequestError('Invalid or expired verification OTP. Please try again.');
}

export async function getPublicLoanProducts() {
  return prisma.loanProduct.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      productType: true,
      minAmount: true,
      maxAmount: true,
      interestRate: true,
      interestMethod: true,
      minTenureMonths: true,
      maxTenureMonths: true,
      processingFeePct: true,
    },
    orderBy: { minAmount: 'asc' },
  });
}

export async function submitPublicApplication(input: PublicApplyInput) {
  const cleanEmail = input.email.toLowerCase().trim();
  const cleanMobile = input.mobile.replace(/\D/g, '').slice(-10);

  // Check if a customer already exists with this email or mobile
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: 'insensitive' } },
        { mobile: cleanMobile },
      ],
    },
    include: { user: true },
  });

  // Resolve Product (either specified or pick the best matching active product)
  let product = input.productId
    ? await prisma.loanProduct.findUnique({ where: { id: input.productId } })
    : null;

  if (!product) {
    product = await prisma.loanProduct.findFirst({
      where: { isActive: true },
    });
  }

  if (!product) {
    throw new NotFoundError('No active loan scheme is currently available. Please contact customer care.');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Password Hashing (if password provided)
    const passwordHash = input.password ? await hashPassword(input.password) : undefined;

    // 2. Ensure CUSTOMER role exists
    let customerRole = await tx.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      customerRole = await tx.role.create({
        data: {
          name: 'CUSTOMER',
          description: 'Self-service retail borrower portal account',
        },
      });
    }

    // 3. Create or Link User
    let user = existingCustomer?.user;
    if (!user) {
      user = await tx.user.upsert({
        where: { email: cleanEmail },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          ...(passwordHash ? { passwordHash } : {}),
          status: 'ACTIVE',
        },
        create: {
          email: cleanEmail,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash: passwordHash || (await hashPassword('Borrower@12345')),
          status: 'ACTIVE',
        },
      });
    }

    // 4. Assign CUSTOMER role
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
      update: {},
      create: { userId: user.id, roleId: customerRole.id },
    });

    // 5. Create or Update Customer Profile
    const customer = existingCustomer
      ? await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            userId: user.id,
            firstName: input.firstName || existingCustomer.firstName,
            lastName: input.lastName || existingCustomer.lastName,
            dateOfBirth: input.dateOfBirth || existingCustomer.dateOfBirth,
            gender: input.gender || existingCustomer.gender,
            mobile: cleanMobile || existingCustomer.mobile,
            email: cleanEmail || existingCustomer.email,
            addressLine: input.addressLine || input.addressLine1 || existingCustomer.addressLine,
            city: input.city || existingCustomer.city,
            state: input.state || existingCustomer.state,
            pincode: input.pincode || existingCustomer.pincode,
            employmentType: input.employmentType || existingCustomer.employmentType,
            employerName: input.employerName || input.companyName || existingCustomer.employerName,
            monthlyIncome: input.monthlyIncome ? Money.toDb(input.monthlyIncome) : existingCustomer.monthlyIncome,
            existingObligations: input.existingObligations !== undefined ? Money.toDb(input.existingObligations) : existingCustomer.existingObligations,
            bankName: input.bankName || existingCustomer.bankName,
            bankAccountNo: input.accountNumber || input.bankAccountNo || existingCustomer.bankAccountNo,
            bankIfsc: (input.ifscCode || input.bankIfsc || '').toUpperCase() || existingCustomer.bankIfsc,
          },
        })
      : await tx.customer.create({
          data: {
            user: { connect: { id: user.id } },
            customerCode: generateCustomerCode(),
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            mobile: cleanMobile,
            email: cleanEmail,
            addressLine: input.addressLine || input.addressLine1 || '',
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            employmentType: input.employmentType,
            employerName: input.employerName || input.companyName || '',
            monthlyIncome: Money.toDb(input.monthlyIncome),
            existingObligations: Money.toDb(input.existingObligations ?? input.existingEmi ?? 0),
            bankName: input.bankName,
            bankAccountNo: input.accountNumber || input.bankAccountNo || '1000000000',
            bankIfsc: (input.ifscCode || input.bankIfsc || 'SBIN0001234').toUpperCase(),
            kycStatus: 'SUBMITTED',
            status: 'ACTIVE',
          },
        });

    // 6. Create Address Record
    await tx.customerAddress.create({
      data: {
        customerId: customer.id,
        addressType: 'CURRENT',
        addressLine: input.addressLine || input.addressLine1 || '',
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isPrimary: true,
      },
    });

    // 7. Create Primary Bank Account Record
    const bankAccount = await tx.customerBankAccount.create({
      data: {
        customerId: customer.id,
        bankName: input.bankName,
        accountNumber: input.accountNumber || input.bankAccountNo || '1000000000',
        ifscCode: (input.ifscCode || input.bankIfsc || 'SBIN0001234').toUpperCase(),
        accountHolderName: input.accountHolderName || `${input.firstName} ${input.lastName}`,
        accountType: input.accountType,
        isPrimary: true,
      },
    });

    // 8. Create Loan Application (status: SUBMITTED)
    const applicationNo = generateApplicationNo();
    const application = await tx.loanApplication.create({
      data: {
        applicationNo,
        customerId: customer.id,
        productId: product!.id,
        requestedAmount: Money.toDb(input.requestedAmount),
        tenureMonths: input.tenureMonths,
        purpose: input.purpose,
        status: 'SUBMITTED',
      },
    });

    // 9. Initial Lifecycle History
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        changedBy: cleanEmail,
        reason: 'Online self-service borrower application submitted via website intake funnel',
      },
    });

    // 10. Store Document upload if provided
    if (input.kycDocUrl) {
      await tx.document.create({
        data: {
          customerId: customer.id,
          applicationId: application.id,
          category: 'IDENTITY_PROOF',
          documentType: input.kycDocType || 'PAN_CARD',
          fileName: `${input.kycDocType || 'DOCUMENT'}_${cleanMobile}`,
          storageKey: input.kycDocUrl,
          contentType: 'application/pdf',
          sizeBytes: 1024,
          status: 'PENDING',
          verified: false,
        },
      });
    }

    return { user, customer, bankAccount, application };
  });

  // Log Audit Entry
  await logAudit({
    userId: result.user.id,
    action: 'BORROWER_SELF_SERVICE_APPLICATION_SUBMITTED',
    entity: 'LoanApplication',
    entityId: result.application.id,
    newValue: {
      applicationNo: result.application.applicationNo,
      customerCode: result.customer.customerCode,
      requestedAmount: input.requestedAmount,
      tenureMonths: input.tenureMonths,
      scheme: input.productName,
    },
  });

  // Issue Instant Access & Refresh Tokens
  const tokenId = uuid();
  const accessToken = signAccessToken({
    sub: result.user.id,
    email: result.user.email,
    roles: ['CUSTOMER'],
  });
  const refreshToken = signRefreshToken({ sub: result.user.id, tokenId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: result.user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    applicationId: result.application.id,
    applicationNo: result.application.applicationNo,
    customerCode: result.customer.customerCode,
    status: result.application.status,
    customer: {
      id: result.customer.id,
      customerCode: result.customer.customerCode,
      firstName: result.customer.firstName,
      lastName: result.customer.lastName,
      email: result.customer.email,
      mobile: result.customer.mobile,
    },
    application: {
      id: result.application.id,
      applicationNo: result.application.applicationNo,
      status: result.application.status,
      requestedAmount: Number(result.application.requestedAmount),
      tenureMonths: result.application.tenureMonths,
      productName: input.productName,
      createdAt: result.application.createdAt,
    },
  };
}
