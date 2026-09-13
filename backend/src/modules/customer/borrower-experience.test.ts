import { describe, it, expect } from 'vitest';
import {
  BorrowerJourneyService,
  borrowerJourneyService,
} from './borrower-journey.service';
import { ScopeResolver } from '../roles/scope-resolver';

describe('Phase P6: Borrower & Direct Lending Experience Polish', () => {
  const customerAlpha = 'cust-alpha-001';
  const customerBeta = 'cust-beta-002';

  const borrowerActorAlpha = {
    id: customerAlpha,
    email: 'borrower.alpha@adyapan.com',
    roles: ['CUSTOMER'],
    tenantId: 'tenant-adyapan-default',
    customerId: customerAlpha,
  };

  const borrowerActorBeta = {
    id: customerBeta,
    email: 'borrower.beta@adyapan.com',
    roles: ['CUSTOMER'],
    tenantId: 'tenant-adyapan-default',
    customerId: customerBeta,
  };

  // ---------------------------------------------------------------------------
  // 1. CUSTOMER-SAFE DATA SANITIZATION (ZERO INTERNAL TERM LEAKAGE)
  // ---------------------------------------------------------------------------
  describe('1. Customer-Safe Data Sanitization & Language Normalization', () => {
    it('should project clean customer-friendly statuses without internal terminology', () => {
      const rawInternalApplication = {
        id: 'app-999',
        applicationNo: 'APP-2026-999',
        requestedAmount: 50000,
        tenureMonths: 12,
        status: 'UNDERWRITING',
        product: { name: 'Instant Personal Loan', interestRate: 16.5 },
        customer: {
          panStatus: 'VERIFIED',
          aadhaarStatus: 'VERIFIED',
          bankAccountNo: '1234567890',
        },
        // Internal fields that MUST NOT leak to borrower
        internalUnderwriterNotes: 'High FOIR exception approved by Level 2 authority',
        breDecisionRules: ['RULE_FOIR_MAX_55', 'RULE_BUREAU_MIN_700'],
        fraudScore: 12,
        riskGrade: 'B',
        sodPolicyVersion: 'v2.1',
        glSuspenseAccount: '9999-SUSPENSE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(rawInternalApplication);

      // Verify customer-friendly status
      expect(safeView.customerStatusLabel).toBe('Application Under Review');
      expect(safeView.currentStage).toBe('UNDER_REVIEW');
      expect(safeView.nextStepLabel).toBe('Loan assessment in progress');
      expect(safeView.progressPercent).toBe(60);

      // Verify absolute zero leakage of internal scoring/notes/GL
      expect((safeView as any).internalUnderwriterNotes).toBeUndefined();
      expect((safeView as any).breDecisionRules).toBeUndefined();
      expect((safeView as any).fraudScore).toBeUndefined();
      expect((safeView as any).riskGrade).toBeUndefined();
      expect((safeView as any).sodPolicyVersion).toBeUndefined();
      expect((safeView as any).glSuspenseAccount).toBeUndefined();
    });

    it('should format transparent Key Fact Statement (KFS) summary when offer is approved', () => {
      const approvedApplication = {
        id: 'app-approved-001',
        applicationNo: 'APP-OFFER-001',
        requestedAmount: 100000,
        tenureMonths: 12,
        status: 'APPROVED',
        product: { name: 'Personal Loan', interestRate: 15.0, processingFeePct: 2.0 },
        customer: { panStatus: 'VERIFIED', aadhaarStatus: 'VERIFIED', bankAccountNo: '9876543210' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(approvedApplication);

      expect(safeView.customerStatusLabel).toBe('Loan Approved — Offer Ready');
      expect(safeView.currentStage).toBe('OFFER_READY');
      expect(safeView.offerSummary).toBeDefined();
      expect(safeView.offerSummary?.approvedAmount).toBe(100000);
      expect(safeView.offerSummary?.tenureMonths).toBe(12);
      expect(safeView.offerSummary?.netDisbursementAmount).toBe(98000);
      expect(safeView.offerSummary?.apr).toBeGreaterThan(15.0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. INCOMPLETE APPLICATION RESUME & DEEP LINK RESOLUTION
  // ---------------------------------------------------------------------------
  describe('2. Authoritative Resume Routes & Action Resolution', () => {
    it('should route DRAFT applications to profile completion page', () => {
      const draftApp = {
        id: 'app-draft-001',
        applicationNo: 'APP-DRAFT-001',
        requestedAmount: 25000,
        tenureMonths: 6,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(draftApp);
      expect(safeView.resumeRoute).toBe('/customer/applications/app-draft-001');
      expect(safeView.currentStage).toBe('PROFILE_PENDING');
      expect(safeView.isActionRequired).toBe(true);
    });

    it('should route KYC_PENDING applications to document upload page', () => {
      const kycApp = {
        id: 'app-kyc-001',
        applicationNo: 'APP-KYC-001',
        requestedAmount: 50000,
        tenureMonths: 12,
        status: 'KYC_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(kycApp);
      expect(safeView.resumeRoute).toBe('/customer/documents');
      expect(safeView.currentStage).toBe('KYC_PENDING');
    });

    it('should route APPROVED applications to offer review page', () => {
      const approvedApp = {
        id: 'app-appr-001',
        applicationNo: 'APP-APPR-001',
        requestedAmount: 75000,
        tenureMonths: 12,
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(approvedApp);
      expect(safeView.resumeRoute).toBe('/customer/offers');
      expect(safeView.currentStage).toBe('OFFER_READY');
    });

    it('should route AGREEMENT_PENDING applications to eSign contract page', () => {
      const agreementApp = {
        id: 'app-sign-001',
        applicationNo: 'APP-SIGN-001',
        requestedAmount: 75000,
        tenureMonths: 12,
        status: 'AGREEMENT_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(agreementApp);
      expect(safeView.resumeRoute).toBe('/customer/documents');
      expect(safeView.currentStage).toBe('AGREEMENT_PENDING');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ZERO-TRUST IDOR PROTECTION ACROSS BORROWER RESOURCES
  // ---------------------------------------------------------------------------
  describe('3. Customer Isolation & Zero-Trust IDOR Defense', () => {
    it('should REJECT Borrower Alpha accessing Borrower Beta journey overview', async () => {
      await expect(
        borrowerJourneyService.getBorrowerJourneyOverview(customerBeta, borrowerActorAlpha)
      ).rejects.toThrow(/Customer access violation/);
    });

    it('should REJECT Borrower Alpha viewing Borrower Beta notifications', () => {
      expect(() => {
        borrowerJourneyService.getCustomerNotifications(customerBeta, borrowerActorAlpha);
      }).toThrow(/Customer access violation/);
    });

    it('should REJECT Borrower Alpha creating support ticket under Borrower Beta account', () => {
      expect(() => {
        borrowerJourneyService.createCustomerTicket(
          customerBeta,
          'Fraudulent Ticket',
          'BILLING',
          'Attempted spoof',
          borrowerActorAlpha
        );
      }).toThrow(/Customer access violation/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. NOTIFICATIONS & CUSTOMER SUPPORT DESK
  // ---------------------------------------------------------------------------
  describe('4. Notification Center & Customer Support Tickets', () => {
    it('should create and retrieve customer support tickets with customer-safe timestamps', () => {
      const ticket = borrowerJourneyService.createCustomerTicket(
        customerAlpha,
        'Question about EMI date',
        'REPAYMENT',
        'Can I change my repayment date to the 5th of every month?',
        borrowerActorAlpha
      );

      expect(ticket.id).toBeDefined();
      expect(ticket.ticketNo).toContain('TCK-');
      expect(ticket.status).toBe('OPEN');
      expect(ticket.statusLabel).toBe('Ticket Received');
      expect(ticket.messages).toHaveLength(1);
      expect(ticket.messages[0].sender).toBe('CUSTOMER');

      const allTickets = borrowerJourneyService.getCustomerTickets(customerAlpha, borrowerActorAlpha);
      expect(allTickets.length).toBeGreaterThanOrEqual(1);
    });

    it('should add and retrieve customer actionable notifications', () => {
      borrowerJourneyService.addCustomerNotification(customerAlpha, {
        title: 'Offer Ready for Acceptance',
        message: 'Your instant loan offer of ₹50,000 is ready for review.',
        category: 'ACTION_REQUIRED',
        deepLinkRoute: '/customer/offers',
      });

      const notifs = borrowerJourneyService.getCustomerNotifications(customerAlpha, borrowerActorAlpha);
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      const actionNotif = notifs.find((n) => n.title === 'Offer Ready for Acceptance');
      expect(actionNotif).toBeDefined();
      expect(actionNotif?.category).toBe('ACTION_REQUIRED');
      expect(actionNotif?.deepLinkRoute).toBe('/customer/offers');
    });
  });
});
