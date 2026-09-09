import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { generateLoanNo } from '../shared/codes';
import { logAudit } from '../audit/audit.service';
import { sendNotification } from '../notifications/notification.service';
import type { ExecuteDisbursementInput } from './disbursement.schema';

export async function getReadyForDisbursementQueue(actor?: {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}) {
  const where: any = {
    status: { in: ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT'] },
  };

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

  return prisma.loanApplication.findMany({
    where,
    include: {
      customer: {
        include: {
          bankAccounts: true,
        },
      },
      product: true,
      branch: true,
      underwriting: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getDisbursementHistory(actor?: {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}) {
  const where: any = {};

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.loan = { tenantId: actor.tenantId };
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.loan = { ...where.loan, branchId: actor.branchId };
    }
  }

  return prisma.disbursement.findMany({
    where,
    include: {
      loan: {
        include: {
          customer: {
            include: {
              bankAccounts: true,
            },
          },
          product: true,
          application: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function executeDisbursement(
  input: ExecuteDisbursementInput,
  actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string }
) {
  if (
    actor.roles.includes('BRANCH_MANAGER') &&
    !actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r))
  ) {
    throw new ForbiddenError('Branch Manager role is strictly prohibited from releasing funds or executing loan disbursements.');
  }

  const isAuthorized = actor.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError('Access forbidden: You do not have permission to disburse loans.');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: input.applicationId },
    include: {
      customer: { include: { bankAccounts: true } },
      product: true,
      branch: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  // Multi-Tenant Isolation & Anti-IDOR Check
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

  // Pre-Disbursement Mandatory Checklist
  if (!['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT'].includes(app.status)) {
    throw new BadRequestError(`Cannot disburse loan application in status ${app.status}. Must be APPROVED or READY_FOR_DISBURSEMENT.`);
  }

  if (app.customer.kycStatus !== 'VERIFIED') {
    throw new BadRequestError(`Pre-disbursement check failed: Customer KYC status is ${app.customer.kycStatus}. Must be VERIFIED before fund release.`);
  }

  if (app.customer.status === 'BLOCKED' || app.customer.status === 'INACTIVE') {
    throw new BadRequestError(`Pre-disbursement check failed: Customer account is ${app.customer.status}.`);
  }

  const hasBankAccount = (app.customer.bankAccounts && app.customer.bankAccounts.length > 0) || Boolean(app.customer.bankAccountNo);
  if (!hasBankAccount) {
    throw new BadRequestError(`Pre-disbursement check failed: No valid bank account on record for fund release.`);
  }

  if (app.product.isActive === false) {
    throw new BadRequestError(`Pre-disbursement check failed: Loan product ${app.product.code} is inactive.`);
  }

  const principalNum = Number(app.requestedAmount);

  // Enforce Payout Limits
  const isSuperAdmin = actor.roles?.some((r) => r === 'SUPER_ADMIN');
  if (!isSuperAdmin) {
    let payoutLimit = 10000000; // Default ₹1 Crore for Finance Officer
    if (actor.roles?.includes('DISBURSEMENT_OFFICER') && !actor.roles?.includes('FINANCE_OFFICER')) {
      payoutLimit = 5000000; // ₹50 Lakhs for junior Disbursement Officer
    }
    if (principalNum > payoutLimit) {
      throw new BadRequestError(
        `Payout amount of ₹${principalNum.toLocaleString('en-IN')} exceeds authorized officer payout limit of ₹${payoutLimit.toLocaleString('en-IN')}. Requires senior committee authorization.`
      );
    }
  }

  const rateNum = Number(app.product.interestRate);
  const tenure = app.tenureMonths;

  // Calculate EMI & schedule
  const emiResult = calculateEmi(principalNum, rateNum, tenure);
  const emiAmount = emiResult.emi;
  const loanNo = generateLoanNo();
  const disbursementDate = new Date();
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + tenure);

  const firstDueDate = new Date();
  firstDueDate.setMonth(firstDueDate.getMonth() + 1);

  // Atomic database transaction for financial integrity
  const loan = await prisma.$transaction(async (tx) => {
    // 1. Create Loan Account
    const createdLoan = await tx.loan.create({
      data: {
        loanNo,
        applicationId: app.id,
        customerId: app.customerId,
        productId: app.productId,
        branchId: app.branchId || app.customer.branchId,
        tenantId: app.tenantId || actor.tenantId,
        principal: Money.toDb(principalNum),
        interestRate: Money.round(rateNum).toFixed(3),
        tenureMonths: tenure,
        emiAmount,
        disbursementDate,
        maturityDate,
        outstandingPrincipal: Money.toDb(principalNum),
        outstandingInterest: '0.00',
        outstandingFees: '0.00',
        nextDueDate: firstDueDate,
        status: 'ACTIVE',
      },
    });

    // 2. Generate and persist Repayment Schedule
    const scheduleData = emiResult.schedule.map((row) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + row.emiNumber);

      return {
        loanId: createdLoan.id,
        emiNumber: row.emiNumber,
        dueDate,
        principal: row.principal,
        interest: row.interest,
        fees: '0.00',
        totalDue: row.emi,
        paidAmount: '0.00',
        outstanding: row.emi,
        status: 'UPCOMING' as const,
      };
    });

    await tx.repaymentScheduleItem.createMany({ data: scheduleData });

    // 3. Create Disbursement Record
    const disbMethod = input.disbursementMethod || 'IMPS';
    const disbRef = input.referenceNumber || (input as any).reference || `DISB-TXN-${Date.now()}`;

    await tx.disbursement.create({
      data: {
        loanId: createdLoan.id,
        amount: Money.toDb(principalNum),
        method: disbMethod,
        reference: disbRef,
        status: 'COMPLETED',
        disbursedBy: actor.email,
      },
    });

    // 4. Create Transaction Ledger Entry (DEBIT for fund release)
    await tx.transaction.create({
      data: {
        loanId: createdLoan.id,
        type: 'DISBURSEMENT',
        direction: 'DEBIT',
        amount: Money.toDb(principalNum),
        reference: disbRef,
        description: `Disbursement of principal via ${disbMethod}. Ref: ${disbRef}`,
      },
    });

    // 5. Update Application Status to DISBURSED
    await tx.loanApplication.update({
      where: { id: app.id },
      data: { status: 'DISBURSED' },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: 'DISBURSED',
        changedBy: actor.email,
        reason: `Loan disbursed with account #${loanNo}. Ref: ${input.referenceNumber}`,
      },
    });

    return createdLoan;
  }, { maxWait: 10000, timeout: 30000 });

  await logAudit({
    userId: actor.id,
    role: actor.roles[0],
    action: 'LOAN_DISBURSED',
    entity: 'Loan',
    entityId: loan.id,
    newValue: {
      loanNo,
      amount: principalNum,
      method: input.disbursementMethod,
      reference: input.referenceNumber,
    },
  });

  // Async non-blocking notification
  void sendNotification({
    customerId: app.customerId,
    channel: 'IN_APP',
    type: 'SUCCESS',
    title: `Loan #${loanNo} Disbursed Successfully`,
    message: `Principal amount of ₹${principalNum.toLocaleString('en-IN')} has been transferred via ${input.disbursementMethod}. Ref: ${input.referenceNumber}. First EMI is scheduled for ${firstDueDate.toLocaleDateString()}.`,
  }).catch(() => {});

  return loan;
}
