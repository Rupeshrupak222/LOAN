import { prisma } from '../../config/prisma';
import {
  CustomerLifecycleState,
  NextActionRecommendation,
} from './direct-lending.types';
import { Decimal } from '@prisma/client/runtime/library';

export class CustomerLifecycleService {
  /**
   * Computes the authoritative deterministic customer lifecycle state.
   */
  public async computeLifecycleState(
    customerId: string,
    tenantId?: string
  ): Promise<CustomerLifecycleState> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        bankAccounts: true,
        addresses: true,
        employmentDetails: true,
        applications: {
          orderBy: { createdAt: 'desc' },
          include: { eligibility: true },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return CustomerLifecycleState.NEW;
    }

    if (customer.status === 'BLOCKED' || customer.status === 'INACTIVE') {
      return CustomerLifecycleState.SUSPENDED;
    }

    // Check loans
    const loans = customer.loans || [];
    const activeLoans = loans.filter(
      (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'
    );
    const closedLoans = loans.filter((l) => l.status === 'CLOSED');

    if (closedLoans.length > 0 && activeLoans.length > 0) {
      return CustomerLifecycleState.REPEAT_BORROWER;
    }

    if (activeLoans.length > 0) {
      return CustomerLifecycleState.ACTIVE_BORROWER;
    }

    if (closedLoans.length > 0 && activeLoans.length === 0) {
      return CustomerLifecycleState.REPEAT_BORROWER;
    }

    // Check profile completion
    const hasBasicInfo = Boolean(
      customer.firstName &&
        customer.lastName &&
        customer.mobile &&
        customer.email
    );
    const hasAddress = customer.addresses.length > 0;
    const hasEmployment =
      customer.employmentDetails.length > 0 ||
      Boolean(customer.monthlyIncome && customer.employmentType);
    const hasBank = customer.bankAccounts.length > 0;

    if (!hasBasicInfo || !hasAddress || !hasEmployment) {
      return CustomerLifecycleState.PROFILE_INCOMPLETE;
    }

    // Check KYC
    if (customer.kycStatus !== 'VERIFIED') {
      return CustomerLifecycleState.KYC_PENDING;
    }

    // Check Applications
    const applications = customer.applications || [];
    if (applications.length === 0) {
      return CustomerLifecycleState.KYC_VERIFIED;
    }

    const latestApp = applications[0];
    if (
      latestApp.status === 'APPROVED' ||
      latestApp.status === 'AGREEMENT_PENDING' ||
      latestApp.status === 'READY_FOR_DISBURSEMENT'
    ) {
      return CustomerLifecycleState.ELIGIBLE;
    }

    if (
      latestApp.status === 'DRAFT' ||
      latestApp.status === 'SUBMITTED' ||
      latestApp.status === 'UNDER_REVIEW' ||
      latestApp.status === 'CREDIT_ASSESSMENT' ||
      latestApp.status === 'UNDERWRITING'
    ) {
      return CustomerLifecycleState.ELIGIBILITY_PENDING;
    }

    return CustomerLifecycleState.ELIGIBLE;
  }

  /**
   * Records a lifecycle state transition if changed.
   */
  public async syncLifecycleState(
    customerId: string,
    actorId?: string,
    reason?: string
  ): Promise<CustomerLifecycleState> {
    const currentState = await this.computeLifecycleState(customerId);

    const lastHistory = await prisma.customerLifecycleHistory.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastHistory || lastHistory.toState !== currentState) {
      await prisma.customerLifecycleHistory.create({
        data: {
          customerId,
          fromState: lastHistory?.toState || null,
          toState: currentState,
          actorId: actorId || null,
          reason: reason || `Automatic lifecycle state transition to ${currentState}`,
        },
      });
    }

    return currentState;
  }

  /**
   * Derives the personalized Next Action for the borrower with highest priority.
   */
  public async deriveNextAction(
    customerId: string,
    tenantId?: string
  ): Promise<NextActionRecommendation> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        bankAccounts: true,
        addresses: true,
        employmentDetails: true,
        applications: {
          orderBy: { createdAt: 'desc' },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
          include: {
            schedule: {
              where: {
                status: { in: ['DUE', 'OVERDUE', 'UPCOMING'] },
              },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
    });

    if (!customer) {
      return {
        actionType: 'COMPLETE_PROFILE',
        title: 'Create Your Borrower Profile',
        description: 'Register and fill in basic information to get started with instant digital loans.',
        buttonText: 'Complete Profile',
        targetUrl: '/customer/applications/new',
        isUrgent: false,
        stageName: 'PROFILE_CREATION',
      };
    }

    // 1. Check if an active loan has an immediate/overdue EMI
    const activeLoans = (customer.loans || []).filter(
      (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'
    );

    for (const loan of activeLoans) {
      const nextDue = loan.schedule[0];
      if (nextDue) {
        const isOverdue =
          nextDue.status === 'OVERDUE' ||
          new Date(nextDue.dueDate).getTime() < Date.now();
        const dueAmount = Number(nextDue.totalDue) - Number(nextDue.paidAmount);

        return {
          actionType: 'PAY_EMI',
          title: isOverdue ? 'Overdue EMI Payment Required' : 'Upcoming EMI Due',
          description: `Loan ${loan.loanNo}: ₹${dueAmount.toLocaleString('en-IN')} due on ${new Date(
            nextDue.dueDate
          ).toLocaleDateString('en-IN')}.`,
          buttonText: `Pay ₹${dueAmount.toLocaleString('en-IN')} Now`,
          targetUrl: `/customer/loans/${loan.id}`,
          isUrgent: isOverdue,
          stageName: 'REPAYMENT',
          metadata: {
            loanId: loan.id,
            loanNo: loan.loanNo,
            dueAmount,
            dueDate: nextDue.dueDate,
          },
        };
      }
    }

    // 2. Check pending in-flight applications
    const applications = customer.applications || [];
    const inFlightApp = applications.find(
      (a) =>
        a.status !== 'DISBURSED' &&
        a.status !== 'REJECTED' &&
        a.status !== 'CANCELLED'
    );

    if (inFlightApp) {
      if (inFlightApp.status === 'AGREEMENT_PENDING') {
        return {
          actionType: 'SIGN_AGREEMENT',
          title: 'Sign Digital Loan Agreement',
          description: 'Your loan offer is accepted. Complete eSign to unlock instant disbursement.',
          buttonText: 'Sign Loan Agreement',
          targetUrl: `/customer/applications/${inFlightApp.id}`,
          isUrgent: true,
          stageName: 'ESIGN_AGREEMENT',
          metadata: { applicationId: inFlightApp.id },
        };
      }

      if (inFlightApp.status === 'APPROVED') {
        return {
          actionType: 'REVIEW_OFFER',
          title: 'Review Approved Loan Offer',
          description: 'Congratulations! Your loan has been approved. Review terms and Key Fact Statement (KFS).',
          buttonText: 'Review Offer & KFS',
          targetUrl: `/customer/offers?applicationId=${inFlightApp.id}`,
          isUrgent: true,
          stageName: 'OFFER_ACCEPTANCE',
          metadata: { applicationId: inFlightApp.id },
        };
      }

      if (
        inFlightApp.status === 'KYC_PENDING' ||
        customer.kycStatus !== 'VERIFIED'
      ) {
        return {
          actionType: 'COMPLETE_KYC',
          title: 'Complete Identity Verification (eKYC)',
          description: 'Verify your Aadhaar and PAN securely to proceed with credit assessment.',
          buttonText: 'Verify Identity (eKYC)',
          targetUrl: `/customer/documents`,
          isUrgent: true,
          stageName: 'KYC_VERIFICATION',
          metadata: { applicationId: inFlightApp.id },
        };
      }

      if (
        inFlightApp.status === 'SUBMITTED' ||
        inFlightApp.status === 'UNDER_REVIEW' ||
        inFlightApp.status === 'CREDIT_ASSESSMENT' ||
        inFlightApp.status === 'UNDERWRITING'
      ) {
        return {
          actionType: 'NO_ACTION_REQUIRED',
          title: 'Application Under Automated Review',
          description: 'Our automated decision engine is reviewing your application. You will be notified shortly.',
          buttonText: 'Track Status',
          targetUrl: `/customer/applications`,
          isUrgent: false,
          stageName: 'CREDIT_ASSESSMENT',
          metadata: { applicationId: inFlightApp.id },
        };
      }

      if (inFlightApp.status === 'DRAFT') {
        return {
          actionType: 'COMPLETE_PROFILE',
          title: 'Complete Your Loan Application',
          description: `Resume your draft application for ₹${Number(
            inFlightApp.requestedAmount
          ).toLocaleString('en-IN')}.`,
          buttonText: 'Resume Application',
          targetUrl: `/customer/applications/new?draftId=${inFlightApp.id}`,
          isUrgent: false,
          stageName: 'APPLICATION_DRAFT',
          metadata: { applicationId: inFlightApp.id },
        };
      }
    }

    // 3. KYC Status check
    if (customer.kycStatus !== 'VERIFIED') {
      return {
        actionType: 'COMPLETE_KYC',
        title: 'Verify Your KYC Documents',
        description: 'Complete digital KYC to unlock pre-approved loan offers and credit lines.',
        buttonText: 'Start eKYC',
        targetUrl: '/customer/documents',
        isUrgent: false,
        stageName: 'KYC',
      };
    }

    // 4. Bank account check
    if (!customer.bankAccounts || customer.bankAccounts.length === 0) {
      return {
        actionType: 'VERIFY_BANK',
        title: 'Add Bank Account for Disbursement',
        description: 'Link your savings bank account for direct disbursement and automated repayments.',
        buttonText: 'Add Bank Account',
        targetUrl: '/customer/profile',
        isUrgent: false,
        stageName: 'BANK_LINKING',
      };
    }

    // 5. Eligible for repeat / instant loan
    const closedLoans = (customer.loans || []).filter(
      (l) => l.status === 'CLOSED'
    );
    if (closedLoans.length > 0 && activeLoans.length === 0) {
      return {
        actionType: 'APPLY_REPEAT_LOAN',
        title: 'Apply for Instant Repeat Loan',
        description: 'You have a great repayment record! Get instant pre-approved repeat loans with lower rates.',
        buttonText: 'Get Repeat Loan',
        targetUrl: '/customer/applications/new',
        isUrgent: false,
        stageName: 'REPEAT_BORROWING',
      };
    }

    // Default: Check eligibility or discover products
    return {
      actionType: 'CHECK_ELIGIBILITY',
      title: 'Discover Pre-Approved Loan Offers',
      description: 'Check your instant credit eligibility and customized repayment plans.',
      buttonText: 'Check Eligibility',
      targetUrl: '/customer/applications/new',
      isUrgent: false,
      stageName: 'PRE_QUALIFICATION',
    };
  }
}

export const customerLifecycleService = new CustomerLifecycleService();
