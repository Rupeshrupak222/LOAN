import { prisma } from '../../config/prisma';
import { RepeatBorrowingEvaluation } from './direct-lending.types';
import { dpdService } from '../collections/dpd.service';

export class RepeatBorrowingService {
  /**
   * Evaluates an existing customer's eligibility for an instant repeat loan.
   */
  public async evaluateRepeatBorrower(
    customerId: string,
    tenantId?: string
  ): Promise<RepeatBorrowingEvaluation> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        loans: {
          include: {
            payments: true,
            schedule: true,
            product: true,
          },
        },
      },
    });

    if (!customer) {
      return {
        isEligibleForRepeatLoan: false,
        customerId,
        currentActiveLoansCount: 0,
        totalOutstandingAmount: 0,
        historicalOnTimePaymentCount: 0,
        currentDpd: 0,
        maxRepeatLoanLimit: 0,
        eligibleProducts: [],
        reasons: ['Customer record not found'],
        safeCustomerMessage: 'Customer profile incomplete. Please complete registration.',
      };
    }

    const loans = customer.loans || [];
    const activeLoans = loans.filter(
      (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'
    );
    const closedLoans = loans.filter((l) => l.status === 'CLOSED');

    // Calculate total outstanding
    const totalOutstanding = activeLoans.reduce(
      (sum, l) =>
        sum +
        Number(l.outstandingPrincipal) +
        Number(l.outstandingInterest) +
        Number(l.outstandingFees),
      0
    );

    // Calculate maximum DPD across all active loans
    let maxDpd = 0;
    for (const loan of activeLoans) {
      const dpdResult = await dpdService.calculateLoanDpd(loan.id);
      if (dpdResult.dpd > maxDpd) {
        maxDpd = dpdResult.dpd;
      }
    }

    // Count on-time historical payments
    let onTimePayments = 0;
    for (const loan of loans) {
      for (const item of loan.schedule) {
        if (item.status === 'PAID') {
          if (!item.paidDate || new Date(item.paidDate) <= new Date(item.dueDate)) {
            onTimePayments++;
          }
        }
      }
    }

    const reasons: string[] = [];
    let isEligible = true;

    // Rule 1: Cannot have DPD > 0
    if (maxDpd > 0) {
      isEligible = false;
      reasons.push(`Active delinquency detected (DPD: ${maxDpd})`);
    }

    // Rule 2: Cannot have more than 2 active loans simultaneously
    if (activeLoans.length >= 2) {
      isEligible = false;
      reasons.push('Maximum concurrent active loan limit reached (2)');
    }

    // Rule 3: Customer must be KYC Verified
    if (customer.kycStatus !== 'VERIFIED') {
      isEligible = false;
      reasons.push('KYC is not verified');
    }

    // Determine max limit enhancement based on track record
    const baseIncome = Number(customer.monthlyIncome || 25000);
    let limitMultiplier = 1.5;

    if (closedLoans.length >= 2 && onTimePayments >= 6) {
      limitMultiplier = 2.5; // Premier repeat borrower
    } else if (closedLoans.length >= 1 || onTimePayments >= 3) {
      limitMultiplier = 2.0; // Proven repeat borrower
    }

    const maxRepeatLoanLimit = Math.min(
      200000,
      Math.max(10000, Math.round((baseIncome * limitMultiplier) / 1000) * 1000)
    );

    // Fetch active products
    const products = await prisma.loanProduct.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    const eligibleProducts = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      maxLimit: Math.min(Number(p.maxAmount), maxRepeatLoanLimit),
      interestRate: Number(p.interestRate),
      tenures: Array.from(
        { length: p.maxTenureMonths - p.minTenureMonths + 1 },
        (_, i) => p.minTenureMonths + i
      ).filter((t) => t === 3 || t === 6 || t === 9 || t === 12 || t === 18 || t === 24),
    }));

    let safeMessage = '';
    if (isEligible) {
      safeMessage = `You are pre-qualified for an instant repeat loan up to ₹${maxRepeatLoanLimit.toLocaleString(
        'en-IN'
      )} with instant disbursement.`;
    } else if (maxDpd > 0) {
      safeMessage =
        'Please clear your current outstanding dues to become eligible for repeat borrowing offers.';
    } else if (activeLoans.length >= 2) {
      safeMessage =
        'You have reached the maximum number of simultaneous active loans. Pay off an existing loan to unlock a new loan.';
    } else {
      safeMessage =
        'Repeat loan pre-qualification unavailable at this time. Please check back soon.';
    }

    return {
      isEligibleForRepeatLoan: isEligible,
      customerId,
      currentActiveLoansCount: activeLoans.length,
      totalOutstandingAmount: totalOutstanding,
      historicalOnTimePaymentCount: onTimePayments,
      currentDpd: maxDpd,
      maxRepeatLoanLimit: isEligible ? maxRepeatLoanLimit : 0,
      eligibleProducts: isEligible ? eligibleProducts : [],
      reasons,
      safeCustomerMessage: safeMessage,
    };
  }
}

export const repeatBorrowingService = new RepeatBorrowingService();
