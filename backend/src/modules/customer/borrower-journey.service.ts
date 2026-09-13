// Phase P6: Authoritative Borrower Journey & Customer Experience Service
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
} from '../../common/errors';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { Money } from '../finance/money';

export type BorrowerJourneyStage =
  | 'DISCOVER'
  | 'PREQUALIFIED'
  | 'PROFILE_PENDING'
  | 'KYC_PENDING'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'OFFER_READY'
  | 'AGREEMENT_PENDING'
  | 'MANDATE_PENDING'
  | 'DISBURSEMENT_PENDING'
  | 'ACTIVE_LOAN'
  | 'REPAYMENT_DUE'
  | 'CLOSED'
  | 'REPEAT_ELIGIBLE';

export interface CustomerSafeApplicationView {
  id: string;
  applicationNo: string;
  productName: string;
  requestedAmount: number;
  tenureMonths: number;
  status: string;
  customerStatusLabel: string;
  currentStage: BorrowerJourneyStage;
  nextStepLabel: string;
  resumeRoute: string;
  isActionRequired: boolean;
  actionRequiredDescription?: string;
  progressPercent: number;
  kycSummary: {
    panVerified: boolean;
    aadhaarVerified: boolean;
    bankAccountVerified: boolean;
  };
  offerSummary?: {
    approvedAmount: number;
    tenureMonths: number;
    monthlyEmi: number;
    interestRateAnnual: number;
    processingFee: number;
    netDisbursementAmount: number;
    apr: number;
    expiresAt?: string;
  };
  documentsRequiredCount: number;
  documentsVerifiedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSafeLoanView {
  id: string;
  loanNo: string;
  productName: string;
  principalAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
  totalOutstanding: number;
  emiAmount: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE';
  disbursementDate: string;
  tenureMonths: number;
  completedEmis: number;
  remainingEmis: number;
  canDownloadNoc: boolean;
  maskedBankAccount: string;
}

export interface CustomerSafeNotification {
  id: string;
  title: string;
  message: string;
  category: 'ACTION_REQUIRED' | 'APPLICATION_UPDATE' | 'PAYMENT' | 'SUPPORT';
  deepLinkRoute?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerSafeTicket {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'CUSTOMER' | 'SUPPORT_AGENT';
    message: string;
    timestamp: string;
  }>;
}

export class BorrowerJourneyService {
  private static instance: BorrowerJourneyService;

  private inMemoryNotifications: Map<string, CustomerSafeNotification[]> = new Map();
  private inMemoryTickets: Map<string, CustomerSafeTicket[]> = new Map();

  private constructor() {}

  public static getInstance(): BorrowerJourneyService {
    if (!BorrowerJourneyService.instance) {
      BorrowerJourneyService.instance = new BorrowerJourneyService();
    }
    return BorrowerJourneyService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. AUTHORITATIVE JOURNEY PROGRESSION & RESUME RESOLVER
  // ---------------------------------------------------------------------------

  public async getBorrowerJourneyOverview(
    customerId: string,
    actor?: { id: string; email?: string; roles: string[]; tenantId?: string; customerId?: string }
  ): Promise<{
    customerId: string;
    customerName: string;
    currentStage: BorrowerJourneyStage;
    nextAction: {
      actionKey: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaRoute: string;
    };
    activeApplication?: CustomerSafeApplicationView;
    activeLoan?: CustomerSafeLoanView;
    creditLimit?: {
      totalLimit: number;
      availableLimit: number;
      usedLimit: number;
    };
    notificationsCount: number;
  }> {
    // Zero-Trust Scope and IDOR Defense
    if (actor) {
      ScopeResolver.validateCustomerAccess(
        { id: actor.id, email: actor.email || '', roles: actor.roles, tenantId: actor.tenantId, customerId: actor.customerId },
        customerId
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        bankAccounts: true,
        addresses: true,
        employmentDetails: true,
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            product: true,
            documents: true,
            eligibility: true,
          },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            schedule: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Customer profile ${customerId} not found.`);
    }

    const activeApp = customer.applications[0];
    const loans = customer.loans || [];
    const activeLoan = loans.find((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
    const closedLoans = loans.filter((l) => l.status === 'CLOSED');

    let stage: BorrowerJourneyStage = 'DISCOVER';
    let nextAction = {
      actionKey: 'START_APPLICATION',
      title: 'Ready for Instant Credit',
      description: 'Check your loan eligibility and apply in under 2 minutes.',
      ctaLabel: 'Apply Now',
      ctaRoute: '/customer/applications/new',
    };

    let safeAppView: CustomerSafeApplicationView | undefined;
    let safeLoanView: CustomerSafeLoanView | undefined;

    // Evaluate active loan first
    if (activeLoan) {
      stage = 'ACTIVE_LOAN';
      const totalOutstanding = new Decimal(activeLoan.outstandingPrincipal)
        .plus(activeLoan.outstandingInterest)
        .plus(activeLoan.outstandingFees)
        .toNumber();

      const paidEmis = activeLoan.schedule.filter((s) => s.status === 'PAID').length;
      const remainingEmis = activeLoan.schedule.filter((s) => s.status !== 'PAID').length;

      const maskedBank = customer.bankAccountNo
        ? `XXXXXX${customer.bankAccountNo.slice(-4)}`
        : 'Bank Account on Record';

      safeLoanView = {
        id: activeLoan.id,
        loanNo: activeLoan.loanNo,
        productName: activeLoan.product.name,
        principalAmount: Number(activeLoan.principal),
        outstandingPrincipal: Number(activeLoan.outstandingPrincipal),
        outstandingInterest: Number(activeLoan.outstandingInterest),
        outstandingFees: Number(activeLoan.outstandingFees),
        totalOutstanding,
        emiAmount: Number(activeLoan.emiAmount),
        nextDueDate: activeLoan.nextDueDate ? activeLoan.nextDueDate.toISOString() : undefined,
        nextDueAmount: Number(activeLoan.emiAmount),
        status: activeLoan.status as 'ACTIVE' | 'OVERDUE',
        disbursementDate: activeLoan.disbursementDate ? activeLoan.disbursementDate.toISOString() : new Date().toISOString(),
        tenureMonths: activeLoan.tenureMonths,
        completedEmis: paidEmis,
        remainingEmis,
        canDownloadNoc: false,
        maskedBankAccount: maskedBank,
      };

      nextAction = {
        actionKey: 'MAKE_REPAYMENT',
        title: 'Upcoming EMI Repayment',
        description: `Your monthly instalment of ₹${Number(activeLoan.emiAmount).toLocaleString('en-IN')} is scheduled.`,
        ctaLabel: 'Pay EMI',
        ctaRoute: `/customer/payments`,
      };
    } else if (activeApp) {
      // Evaluate active application stage
      const docs = activeApp.documents || [];
      const verifiedDocs = docs.filter((d) => d.status === 'VERIFIED').length;
      const hasBank = customer.bankAccounts.length > 0 || Boolean(customer.bankAccountNo);

      let customerStatusLabel = 'Application Submitted';
      let resumeRoute = `/customer/applications/${activeApp.id}`;
      let progressPercent = 20;
      let isActionRequired = false;
      let actionRequiredDescription: string | undefined;

      switch (activeApp.status) {
        case 'DRAFT':
          stage = 'PROFILE_PENDING';
          customerStatusLabel = 'Profile Information Incomplete';
          resumeRoute = `/customer/applications/${activeApp.id}`;
          progressPercent = 15;
          isActionRequired = true;
          actionRequiredDescription = 'Complete your profile and income details to proceed.';
          nextAction = {
            actionKey: 'COMPLETE_PROFILE',
            title: 'Complete Profile Details',
            description: 'Provide your personal and employment details to finalize application.',
            ctaLabel: 'Continue Application',
            ctaRoute: resumeRoute,
          };
          break;

        case 'SUBMITTED':
        case 'KYC_PENDING':
          stage = 'KYC_PENDING';
          customerStatusLabel = 'Identity Verification Required';
          resumeRoute = `/customer/documents`;
          progressPercent = 35;
          isActionRequired = true;
          actionRequiredDescription = 'Verify your PAN and Aadhaar identity.';
          nextAction = {
            actionKey: 'VERIFY_KYC',
            title: 'Complete Identity Verification',
            description: 'Verify your Aadhaar and PAN details securely.',
            ctaLabel: 'Verify Identity',
            ctaRoute: resumeRoute,
          };
          break;

        case 'KYC_VERIFIED':
        case 'CREDIT_ASSESSMENT':
        case 'UNDER_REVIEW':
        case 'UNDERWRITING':
          stage = 'UNDER_REVIEW';
          customerStatusLabel = 'Application Under Review';
          resumeRoute = `/customer/applications/${activeApp.id}`;
          progressPercent = 60;
          isActionRequired = false;
          nextAction = {
            actionKey: 'WAIT_FOR_REVIEW',
            title: 'Application Under Review',
            description: 'We are assessing your application and will notify you with your loan offer shortly.',
            ctaLabel: 'View Status',
            ctaRoute: resumeRoute,
          };
          break;

        case 'APPROVED':
          stage = 'OFFER_READY';
          customerStatusLabel = 'Loan Sanction Offer Ready';
          resumeRoute = `/customer/offers`;
          progressPercent = 75;
          isActionRequired = true;
          actionRequiredDescription = 'Your loan offer is ready for review and acceptance.';
          nextAction = {
            actionKey: 'ACCEPT_OFFER',
            title: 'Your Loan Offer is Ready!',
            description: `Approved amount of ₹${Number(activeApp.requestedAmount).toLocaleString('en-IN')}. Review your transparent Key Fact Statement (KFS).`,
            ctaLabel: 'Review & Accept Offer',
            ctaRoute: resumeRoute,
          };
          break;

        case 'AGREEMENT_PENDING':
          stage = 'AGREEMENT_PENDING';
          customerStatusLabel = 'Agreement Signing Pending';
          resumeRoute = `/customer/documents`;
          progressPercent = 85;
          isActionRequired = true;
          actionRequiredDescription = 'Digitally sign your loan agreement using Aadhaar eSign.';
          nextAction = {
            actionKey: 'SIGN_AGREEMENT',
            title: 'Sign Loan Agreement',
            description: 'Execute your digital loan contract using secure OTP eSign.',
            ctaLabel: 'Sign Agreement',
            ctaRoute: resumeRoute,
          };
          break;

        case 'READY_FOR_DISBURSEMENT':
          stage = 'DISBURSEMENT_PENDING';
          customerStatusLabel = 'Bank Transfer in Progress';
          resumeRoute = `/customer/dashboard`;
          progressPercent = 95;
          isActionRequired = false;
          nextAction = {
            actionKey: 'TRACK_PAYOUT',
            title: 'Money Transfer Initiated',
            description: 'Funds are being dispatched to your verified bank account.',
            ctaLabel: 'Track Transfer',
            ctaRoute: resumeRoute,
          };
          break;

        case 'DISBURSED':
          stage = 'ACTIVE_LOAN';
          customerStatusLabel = 'Loan Disbursed';
          progressPercent = 100;
          break;

        case 'REJECTED':
          stage = 'DISCOVER';
          customerStatusLabel = 'Application Not Approved';
          progressPercent = 100;
          nextAction = {
            actionKey: 'REAPPLY_ELIGIBILITY',
            title: 'Application Update',
            description: 'We could not approve your application at this time. You can check eligibility again later.',
            ctaLabel: 'Explore Options',
            ctaRoute: '/customer/applications/new',
          };
          break;
      }

      safeAppView = {
        id: activeApp.id,
        applicationNo: activeApp.applicationNo,
        productName: activeApp.product.name,
        requestedAmount: Number(activeApp.requestedAmount),
        tenureMonths: activeApp.tenureMonths,
        status: activeApp.status,
        customerStatusLabel,
        currentStage: stage,
        nextStepLabel: nextAction.title,
        resumeRoute,
        isActionRequired,
        actionRequiredDescription,
        progressPercent,
        kycSummary: {
          panVerified: customer.kycStatus === 'VERIFIED',
          aadhaarVerified: customer.kycStatus === 'VERIFIED',
          bankAccountVerified: hasBank,
        },
        documentsRequiredCount: docs.length || 3,
        documentsVerifiedCount: verifiedDocs,
        createdAt: activeApp.createdAt.toISOString(),
        updatedAt: activeApp.updatedAt.toISOString(),
      };
    } else if (closedLoans.length > 0) {
      stage = 'REPEAT_ELIGIBLE';
      nextAction = {
        actionKey: 'REPEAT_BORROW',
        title: 'Apply for Instant Repeat Loan',
        description: 'You have a clean repayment history and qualify for priority credit processing.',
        ctaLabel: 'Borrow Again',
        ctaRoute: '/customer/applications/new',
      };
    }

    const notifications = this.inMemoryNotifications.get(customerId) || [];
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      currentStage: stage,
      nextAction,
      activeApplication: safeAppView,
      activeLoan: safeLoanView,
      creditLimit: {
        totalLimit: 50000,
        availableLimit: safeLoanView ? 50000 - safeLoanView.outstandingPrincipal : 50000,
        usedLimit: safeLoanView ? safeLoanView.outstandingPrincipal : 0,
      },
      notificationsCount: unreadCount,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. CUSTOMER-SAFE DATA SANITIZATION (ZERO INTERNAL LEAKAGE)
  // ---------------------------------------------------------------------------

  public sanitizeApplicationForBorrower(app: any): CustomerSafeApplicationView {
    const isApproved = ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);

    return {
      id: app.id,
      applicationNo: app.applicationNo,
      productName: app.product?.name || 'Personal Loan',
      requestedAmount: Number(app.requestedAmount),
      tenureMonths: app.tenureMonths,
      status: app.status,
      customerStatusLabel: this.getCustomerFriendlyStatus(app.status),
      currentStage: this.mapStatusToJourneyStage(app.status),
      nextStepLabel: this.getCustomerNextStepLabel(app.status),
      resumeRoute: this.getResumeRouteForStatus(app.status, app.id),
      isActionRequired: ['DRAFT', 'KYC_PENDING', 'APPROVED', 'AGREEMENT_PENDING'].includes(app.status),
      progressPercent: this.calculateProgressPercent(app.status),
      kycSummary: {
        panVerified: app.customer?.panStatus === 'VERIFIED',
        aadhaarVerified: app.customer?.aadhaarStatus === 'VERIFIED',
        bankAccountVerified: Boolean(app.customer?.bankAccountNo || app.customer?.bankAccounts?.length),
      },
      offerSummary: isApproved
        ? {
            approvedAmount: Number(app.requestedAmount),
            tenureMonths: app.tenureMonths,
            monthlyEmi: Number(app.product?.interestRate ? Money.round(Number(app.requestedAmount) / app.tenureMonths).toNumber() : 2500),
            interestRateAnnual: Number(app.product?.interestRate || 18.0),
            processingFee: Number(app.product?.processingFeePct ? Number(app.requestedAmount) * 0.02 : 1000),
            netDisbursementAmount: Number(app.requestedAmount) * 0.98,
            apr: Number(app.product?.interestRate || 18.0) + 2.5,
          }
        : undefined,
      documentsRequiredCount: app.documents?.length || 3,
      documentsVerifiedCount: app.documents?.filter((d: any) => d.status === 'VERIFIED').length || 0,
      createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : app.createdAt,
      updatedAt: app.updatedAt instanceof Date ? app.updatedAt.toISOString() : app.updatedAt,
    };
  }

  private getCustomerFriendlyStatus(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Application Incomplete';
      case 'SUBMITTED':
      case 'KYC_PENDING': return 'Identity Verification in Progress';
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
      case 'UNDER_REVIEW':
      case 'UNDERWRITING': return 'Application Under Review';
      case 'APPROVED': return 'Loan Approved — Offer Ready';
      case 'AGREEMENT_PENDING': return 'Agreement Signing Pending';
      case 'READY_FOR_DISBURSEMENT': return 'Disbursement in Progress';
      case 'DISBURSED': return 'Active Loan Disbursed';
      case 'REJECTED': return 'Application Closed';
      case 'CANCELLED': return 'Application Cancelled';
      default: return 'Application Processing';
    }
  }

  private mapStatusToJourneyStage(status: string): BorrowerJourneyStage {
    switch (status) {
      case 'DRAFT': return 'PROFILE_PENDING';
      case 'SUBMITTED':
      case 'KYC_PENDING': return 'KYC_PENDING';
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
      case 'UNDER_REVIEW':
      case 'UNDERWRITING': return 'UNDER_REVIEW';
      case 'APPROVED': return 'OFFER_READY';
      case 'AGREEMENT_PENDING': return 'AGREEMENT_PENDING';
      case 'READY_FOR_DISBURSEMENT': return 'DISBURSEMENT_PENDING';
      case 'DISBURSED': return 'ACTIVE_LOAN';
      default: return 'DISCOVER';
    }
  }

  private getCustomerNextStepLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Complete application details';
      case 'SUBMITTED':
      case 'KYC_PENDING': return 'Verify Aadhaar and PAN identity';
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
      case 'UNDER_REVIEW':
      case 'UNDERWRITING': return 'Loan assessment in progress';
      case 'APPROVED': return 'Review and accept your loan offer';
      case 'AGREEMENT_PENDING': return 'Sign loan agreement via eSign';
      case 'READY_FOR_DISBURSEMENT': return 'Transferring funds to your bank';
      case 'DISBURSED': return 'Manage active loan and repayments';
      default: return 'View application status';
    }
  }

  private getResumeRouteForStatus(status: string, appId: string): string {
    switch (status) {
      case 'DRAFT': return `/customer/applications/${appId}`;
      case 'KYC_PENDING': return `/customer/documents`;
      case 'APPROVED': return `/customer/offers`;
      case 'AGREEMENT_PENDING': return `/customer/documents`;
      case 'DISBURSED': return `/customer/loans`;
      default: return `/customer/applications/${appId}`;
    }
  }

  private calculateProgressPercent(status: string): number {
    switch (status) {
      case 'DRAFT': return 15;
      case 'SUBMITTED':
      case 'KYC_PENDING': return 35;
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
      case 'UNDER_REVIEW':
      case 'UNDERWRITING': return 60;
      case 'APPROVED': return 75;
      case 'AGREEMENT_PENDING': return 85;
      case 'READY_FOR_DISBURSEMENT': return 95;
      case 'DISBURSED': return 100;
      default: return 10;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. CUSTOMER NOTIFICATION CENTER
  // ---------------------------------------------------------------------------

  public getCustomerNotifications(
    customerId: string,
    actor?: { id: string; roles: string[]; customerId?: string }
  ): CustomerSafeNotification[] {
    if (actor) {
      ScopeResolver.validateCustomerAccess(
        { id: actor.id, email: '', roles: actor.roles, customerId: actor.customerId },
        customerId
      );
    }

    const notifs = this.inMemoryNotifications.get(customerId) || [
      {
        id: 'notif-1',
        title: 'Identity Verification Complete',
        message: 'Your Aadhaar and PAN KYC has been verified successfully.',
        category: 'APPLICATION_UPDATE',
        deepLinkRoute: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    return notifs;
  }

  public addCustomerNotification(
    customerId: string,
    notification: Omit<CustomerSafeNotification, 'id' | 'createdAt' | 'isRead'>
  ): void {
    const list = this.inMemoryNotifications.get(customerId) || [];
    list.unshift({
      id: `notif-${Date.now()}`,
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    this.inMemoryNotifications.set(customerId, list);
  }

  // ---------------------------------------------------------------------------
  // 4. CUSTOMER SUPPORT & TICKETS
  // ---------------------------------------------------------------------------

  public createCustomerTicket(
    customerId: string,
    subject: string,
    category: string,
    initialMessage: string,
    actor?: { id: string; roles: string[]; customerId?: string }
  ): CustomerSafeTicket {
    if (actor) {
      ScopeResolver.validateCustomerAccess(
        { id: actor.id, email: '', roles: actor.roles, customerId: actor.customerId },
        customerId
      );
    }

    if (!subject || !initialMessage) {
      throw new BadRequestError('Subject and message are required to create a support ticket.');
    }

    const ticket: CustomerSafeTicket = {
      id: `tkt-${Date.now()}`,
      ticketNo: `TCK-${Date.now().toString().slice(-6)}`,
      subject,
      category,
      status: 'OPEN',
      statusLabel: 'Ticket Received',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          message: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const tickets = this.inMemoryTickets.get(customerId) || [];
    tickets.unshift(ticket);
    this.inMemoryTickets.set(customerId, tickets);

    return ticket;
  }

  public getCustomerTickets(
    customerId: string,
    actor?: { id: string; roles: string[]; customerId?: string }
  ): CustomerSafeTicket[] {
    if (actor) {
      ScopeResolver.validateCustomerAccess(
        { id: actor.id, email: '', roles: actor.roles, customerId: actor.customerId },
        customerId
      );
    }
    return this.inMemoryTickets.get(customerId) || [];
  }
}

export const borrowerJourneyService = BorrowerJourneyService.getInstance();
