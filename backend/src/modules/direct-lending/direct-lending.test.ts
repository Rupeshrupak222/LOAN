import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { directLendingService } from './direct-lending.service';
import { customerLifecycleService } from './customer-lifecycle.service';
import { repeatBorrowingService } from './repeat-borrowing.service';
import { creditReassessmentService } from './credit-reassessment.service';
import { consentService } from './consent.service';
import { CustomerLifecycleState } from './direct-lending.types';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import { offerEngineService } from '../offers/offers.service';

describe('Phase 15: Direct Lending & mPokket-Grade Instant Loan Suite', () => {
  let testTenantId: string;
  let testCustomerId: string;
  let testUserId: string;
  let testProductId: string;
  let testApplicationId: string;

  beforeAll(async () => {
    // 1. Create Test Tenant
    const tenant = await prisma.tenant.create({
      data: {
        code: `TNT-DL-${Date.now().toString().slice(-6)}`,
        name: 'Direct Lending Test NBFC',
        contactEmail: `dl-test-${Date.now()}@adyapan.com`,
      },
    });
    testTenantId = tenant.id;

    // 2. Create Test User
    const user = await prisma.user.create({
      data: {
        email: `borrower-${Date.now()}@adyapan.com`,
        passwordHash: 'dummy-hash',
        firstName: 'Amit',
        lastName: 'Sharma',
        tenantId: testTenantId,
      },
    });
    testUserId = user.id;

    // 3. Create Test Customer
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-DL-${Date.now().toString().slice(-4)}`,
        userId: testUserId,
        tenantId: testTenantId,
        firstName: 'Amit',
        lastName: 'Sharma',
        mobile: '9876543210',
        email: user.email,
        monthlyIncome: 45000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        bankAccounts: {
          create: {
            accountHolderName: 'Amit Sharma',
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            ifscCode: 'HDFC0001234',
            isVerified: true,
          },
        },
        addresses: {
          create: {
            addressLine: '123 Tech Park, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            isPrimary: true,
          },
        },
        employmentDetails: {
          create: {
            employmentType: 'SALARIED',
            employerName: 'Infosys Ltd',
            monthlyIncome: 45000,
          },
        },
      },
    });
    testCustomerId = customer.id;

    // 4. Create Test Product
    const product = await prisma.loanProduct.create({
      data: {
        code: `PROD-INSTANT-${Date.now().toString().slice(-4)}`,
        name: 'Instant Salary Loan',
        productType: 'PERSONAL',
        tenantId: testTenantId,
        minAmount: 5000,
        maxAmount: 100000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        interestRate: 18.0,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up
    try {
      await prisma.customerConsent.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.creditReassessment.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.customerLifecycleHistory.deleteMany({
        where: { customer: { tenantId: testTenantId } },
      });
      await prisma.repaymentScheduleItem.deleteMany({
        where: { loan: { tenantId: testTenantId } },
      });
      await prisma.loan.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.loanApplication.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.customerBankAccount.deleteMany({
        where: { customer: { tenantId: testTenantId } },
      });
      await prisma.customerAddress.deleteMany({
        where: { customer: { tenantId: testTenantId } },
      });
      await prisma.customerEmployment.deleteMany({
        where: { customer: { tenantId: testTenantId } },
      });
      await prisma.customer.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.loanProduct.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.tenant.deleteMany({ where: { id: testTenantId } });
    } catch {
      // Ignore cleanup error
    }
  });

  // -------------------------------------------------------------------------
  // 1. Digital Consent Registry
  // -------------------------------------------------------------------------
  describe('[TEST 1] Auditable Digital Consent Registry', () => {
    it('should record an auditable digital consent with IP, channel and version', async () => {
      const consent = await consentService.recordConsent(testCustomerId, testTenantId, {
        consentType: 'AADHAAR_KYC',
        purpose: 'UIDAI biometric/OTP verification for digital onboarding',
        version: 'v1.2',
        channel: 'DIRECT_WEB',
        ipAddress: '127.0.0.1',
      });

      expect(consent.id).toBeDefined();
      expect(consent.consentType).toBe('AADHAAR_KYC');
      expect(consent.granted).toBe(true);
      expect(consent.version).toBe('v1.2');
    });

    it('should validate required consents correctly', async () => {
      await consentService.recordConsent(testCustomerId, testTenantId, {
        consentType: 'CREDIT_BUREAU',
        purpose: 'Credit Bureau Score extraction',
      });

      const validation = await consentService.validateConsents(
        testCustomerId,
        ['AADHAAR_KYC', 'CREDIT_BUREAU'],
        testTenantId
      );

      expect(validation.isValid).toBe(true);
      expect(validation.missingTypes.length).toBe(0);

      const invalidValidation = await consentService.validateConsents(
        testCustomerId,
        ['AADHAAR_KYC', 'ENACH_MANDATE'],
        testTenantId
      );

      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.missingTypes).toContain('ENACH_MANDATE');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Pre-qualification & Instant Pricing Calculator
  // -------------------------------------------------------------------------
  describe('[TEST 2] Pre-qualification & Transparent Pricing Calculator', () => {
    it('should pre-qualify customer with transparent EMI, fees and APR estimation', async () => {
      const preQual = await directLendingService.preQualifyCustomer(
        {
          requestedAmount: 25000,
          tenureMonths: 6,
          monthlyIncome: 45000,
        },
        testCustomerId,
        testTenantId
      );

      expect(preQual.isEligible).toBe(true);
      expect(preQual.requestedAmount).toBe(25000);
      expect(preQual.availableProducts.length).toBeGreaterThan(0);

      const prod = preQual.availableProducts[0];
      expect(prod.estimatedEmi).toBeGreaterThan(0);
      expect(prod.estimatedTotalRepayment).toBeGreaterThan(25000);
      expect(prod.aprEstimated).toBeGreaterThan(0);
      expect(prod.isPreQualified).toBe(true);
    });

    it('should flag unmet criteria when requested amount exceeds product limits', async () => {
      const preQual = await directLendingService.preQualifyCustomer(
        {
          requestedAmount: 500000, // exceeds max 100k
          tenureMonths: 6,
          monthlyIncome: 45000,
        },
        testCustomerId,
        testTenantId
      );

      expect(preQual.availableProducts[0].isPreQualified).toBe(false);
      expect(preQual.availableProducts[0].unmetCriteria?.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Customer Lifecycle State & Personalized Next Action
  // -------------------------------------------------------------------------
  describe('[TEST 3] Customer Lifecycle State & Personalized Next Action', () => {
    it('should compute deterministic customer lifecycle state', async () => {
      const state = await customerLifecycleService.computeLifecycleState(
        testCustomerId,
        testTenantId
      );
      expect(state).toBe(CustomerLifecycleState.KYC_VERIFIED);
    });

    it('should recommend actionable next step on borrower portal', async () => {
      const action = await customerLifecycleService.deriveNextAction(
        testCustomerId,
        testTenantId
      );
      expect(action.actionType).toBeDefined();
      expect(action.buttonText).toBeDefined();
      expect(action.targetUrl).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Instant Loan Application & Automated Decisioning
  // -------------------------------------------------------------------------
  describe('[TEST 4] Instant Loan Application & Decisioning', () => {
    it('should submit direct loan application and advance lifecycle state', async () => {
      const app = await directLendingService.applyDirectLoan(testCustomerId, testTenantId, {
        productId: testProductId,
        requestedAmount: 20000,
        tenureMonths: 6,
        purpose: 'Medical emergency',
      });

      testApplicationId = app.id;
      expect(app.id).toBeDefined();
      expect(app.applicationNo).toContain('APP-DL-');
      expect(app.status).toBe('SUBMITTED');
    });

    it('should execute automated instant decision and format safe customer response', async () => {
      const decision = await directLendingService.evaluateInstantDecision(
        testApplicationId,
        testCustomerId,
        testTenantId
      );

      expect(decision.applicationId).toBe(testApplicationId);
      expect(['APPROVED', 'REFER', 'REJECT']).toContain(decision.decision);
      expect(decision.safeMessage).toBeDefined();
      // Verify no internal secret scores leaked in customer response
      expect((decision as any).fraudScore).toBeUndefined();
      expect((decision as any).internalRiskWeights).toBeUndefined();
    }, 20000);
  });

  // -------------------------------------------------------------------------
  // 5. Repeat Borrowing Intelligence Engine
  // -------------------------------------------------------------------------
  describe('[TEST 5] Repeat Borrowing Intelligence Engine', () => {
    it('should evaluate repeat borrowing eligibility with DPD and exposure checks', async () => {
      const evalResult = await repeatBorrowingService.evaluateRepeatBorrower(
        testCustomerId,
        testTenantId
      );

      expect(evalResult.customerId).toBe(testCustomerId);
      expect(evalResult.currentDpd).toBe(0);
      expect(evalResult.safeCustomerMessage).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Credit Limit Reassessment Mechanism
  // -------------------------------------------------------------------------
  describe('[TEST 6] Credit Limit Reassessment Mechanism', () => {
    it('should evaluate and propose credit limit enhancement based on track record', async () => {
      const reassessment = await creditReassessmentService.requestLimitReassessment(
        testCustomerId,
        testTenantId,
        {
          requestedLimit: 85000,
          reassessmentType: 'PERIODIC_PERFORMANCE',
        }
      );

      expect(reassessment.reassessmentId).toBeDefined();
      expect(reassessment.currentLimit).toBeGreaterThan(0);
      expect(reassessment.proposedLimit).toBeGreaterThan(reassessment.currentLimit);
      expect(reassessment.evaluationScore).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Revolving Credit Line Drawdown
  // -------------------------------------------------------------------------
  describe('[TEST 7] Revolving Credit Line Drawdown & Fee Deductions', () => {
    it('should execute instantaneous drawdown from credit facility with fee and GST', async () => {
      // 1. Create offer
      const offer = await offerEngineService.generateOffer(
        testTenantId,
        testApplicationId,
        {
          customOfferedAmount: 20000,
          customTenureMonths: 6,
          overrideRatePct: 18.0,
        },
        {
          id: 'SYSTEM',
          tenantId: testTenantId,
          roles: ['SYSTEM'],
        }
      );

      // 2. Accept offer
      const acceptedOffer = await offerEngineService.acceptOffer(
        testTenantId,
        offer.id,
        {
          acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
          termsAccepted: true,
          kfsAccepted: true,
        },
        {
          id: testCustomerId,
          tenantId: testTenantId,
          roles: ['CUSTOMER'],
        }
      );

      // 3. Create facility
      const facility = creditLimitsService.createFacilityFromOffer(acceptedOffer.id, {
        tenantId: testTenantId,
      });

      const drawdown = await directLendingService.drawdownRevolvingCredit(
        facility.id,
        5000,
        testCustomerId,
        testTenantId
      );

      expect(drawdown.id).toBeDefined();
      expect(drawdown.requestedAmount).toBe(5000);
      expect(drawdown.netDisbursedAmount).toBeLessThan(5000); // Net = Amount - Fee - GST
      expect(drawdown.status).toBe('DISBURSED');
    }, 20000);
  });

  // -------------------------------------------------------------------------
  // 8. Safe Borrower Loan Detail View (Redaction & IDOR Isolation)
  // -------------------------------------------------------------------------
  describe('[TEST 8] Safe Borrower Loan Detail View & Redaction', () => {
    it('should provide sanitized loan detail with schedule and KFS terms', async () => {
      // Create active loan
      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-SAFE-${Date.now().toString().slice(-4)}`,
          customerId: testCustomerId,
          productId: testProductId,
          tenantId: testTenantId,
          principal: 20000,
          interestRate: 18.0,
          tenureMonths: 6,
          emiAmount: 3512,
          outstandingPrincipal: 20000,
          status: 'ACTIVE',
        },
      });

      const safeView = await directLendingService.getSafeBorrowerLoanDetail(
        loan.id,
        testCustomerId,
        testTenantId
      );

      expect(safeView.id).toBe(loan.id);
      expect(safeView.principalAmount).toBe(20000);
      expect(safeView.emiAmount).toBe(3512);
      expect(safeView.lenderName).toBe('Direct Lending Test NBFC');
      // Verify internal underwriting/fraud fields are completely absent
      expect((safeView as any).fraudScore).toBeUndefined();
      expect((safeView as any).underwritingNotes).toBeUndefined();
      expect((safeView as any).collectorNotes).toBeUndefined();
    });

    it('should block unauthorized cross-customer loan access (IDOR Prevention)', async () => {
      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-IDOR-${Date.now().toString().slice(-4)}`,
          customerId: testCustomerId,
          productId: testProductId,
          tenantId: testTenantId,
          principal: 10000,
          interestRate: 18.0,
          tenureMonths: 3,
          emiAmount: 3434,
          outstandingPrincipal: 10000,
          status: 'ACTIVE',
        },
      });

      // Attempt access by different customer
      await expect(
        directLendingService.getSafeBorrowerLoanDetail(
          loan.id,
          'different-customer-id',
          testTenantId
        )
      ).rejects.toThrow();
    });
  });
});
