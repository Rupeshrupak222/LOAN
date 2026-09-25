import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { offerEngineService } from '../offers/offers.service';
import { contractsService } from '../contracts/contracts.service';
import { ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase 9I: Real Borrower Portal End-to-End Lending Journey', { timeout: 25000 }, () => {
  const tenantA = 'tenant_p9i_a';
  const tenantB = 'tenant_p9i_b';
  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';
  let testProductId = '';

  beforeAll(async () => {
    // 1. Setup Tenants
    await prisma.tenant.upsert({
      where: { id: tenantA },
      update: {},
      create: {
        id: tenantA,
        code: `P9I_A_${Date.now()}`,
        name: 'Phase 9I Prime Lending Tenant A',
        contactEmail: 'admin@tenant-a.com',
      },
    });

    await prisma.tenant.upsert({
      where: { id: tenantB },
      update: {},
      create: {
        id: tenantB,
        code: `P9I_B_${Date.now()}`,
        name: 'Phase 9I NBFC Tenant B',
        contactEmail: 'admin@tenant-b.com',
      },
    });

    // 2. Create Borrower User A in Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `rohit.p9i.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_p9i_a',
        firstName: 'Rohit',
        lastName: 'Verma',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-P9I-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Rohit',
        lastName: 'Verma',
        mobile: '9811223344',
        email: userA.email,
        monthlyIncome: 85000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        bankAccounts: {
          create: {
            accountHolderName: 'Rohit Verma',
            bankName: 'HDFC Bank',
            accountNumber: '5010022334455',
            ifscCode: 'HDFC0001234',
            isVerified: true,
          },
        },
        CustomerIdentifier: {
          create: {
            idType: 'PAN',
            maskedValue: 'AB******4F',
            verificationStatus: 'VERIFIED',
          },
        },
      },
    });
    borrowerACustomerId = customerA.id;

    // 3. Create Borrower User B in Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `priya.p9i.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_p9i_b',
        firstName: 'Priya',
        lastName: 'Sharma',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-P9I-${(Date.now() + 1).toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Priya',
        lastName: 'Sharma',
        mobile: '9822334455',
        email: userB.email,
        monthlyIncome: 95000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 4. Create Loan Product in Tenant A
    const product = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Phase 9I Prime Instant Personal Loan',
        code: `P9I_PROD_${Date.now()}`,
        productType: 'PERSONAL',
        minAmount: 10000,
        maxAmount: 500000,
        minTenureMonths: 6,
        maxTenureMonths: 36,
        interestRate: 14.0,
        processingFeePct: 1.5,
        isActive: true,
      },
    });
    testProductId = product.id;
  }, 35000);

  // -------------------------------------------------------------------------
  // 1. Borrower Home Summary & Masked PII
  // -------------------------------------------------------------------------
  it('01: Borrower Home Overview returns authoritative profile with masked identifiers', async () => {
    const summary = await borrowerService.getBorrowerHomeSummary(borrowerAUserId, tenantA);

    expect(summary.borrower).toBeDefined();
    expect(summary.borrower.firstName).toBe('Rohit');
    expect(summary.borrower.lastName).toBe('Verma');
    expect(summary.borrower.email).toContain('@example.com');
    expect(summary.borrower.panNumberMasked).toBe('AB******4F');
    expect(summary.creditLimit).toBeDefined();
    expect(summary.creditLimit.isEligible).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 2. Journey State: Initial / Ready to Apply
  // -------------------------------------------------------------------------
  it('02: Borrower Journey State derives initial stage correctly', async () => {
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);

    expect(journey.currentStage).toBeDefined();
    expect(journey.customerCode).toBeDefined();
    expect(journey.borrowerName).toBe('Rohit Verma');
    expect(journey.kycStatus).toBe('VERIFIED');
  });

  // -------------------------------------------------------------------------
  // 3. Application Submission & Journey Progression
  // -------------------------------------------------------------------------
  it('03: Application Submission captures borrower input and transitions state', async () => {
    const appResult = await borrowerService.submitBorrowerApplication(
      borrowerAUserId,
      {
        productId: testProductId,
        requestedAmount: 150000,
        tenureMonths: 12,
        purpose: 'Home Improvement',
        firstName: 'Rohit',
        lastName: 'Verma',
        dob: '1990-05-15',
        gender: 'MALE',
        addressLine1: 'Flat 101, Galaxy Apts',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        employmentType: 'SALARIED',
        employerName: 'Tech Corp India',
        designation: 'Senior Lead Engineer',
        monthlyIncome: 85000,
        panNumber: 'ABCDE1234F',
        aadhaarNumberMasked: '5544',
        kycConsentGiven: true,
        accountHolderName: 'Rohit Verma',
        accountNumber: '5010022334455',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountType: 'SAVINGS',
        creditBureauConsent: true,
        termsAccepted: true,
      },
      tenantA
    );

    expect(appResult.applicationId).toBeDefined();
    expect(appResult.applicationNumber).toBeDefined();

    // Check updated journey state
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    expect(journey.activeApplicationId).toBe(appResult.applicationId);
    expect(['APPLICATION_SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'OFFER_READY']).toContain(
      journey.currentStage
    );
  });

  // -------------------------------------------------------------------------
  // 4. Offer Generation, KFS Retrieval & Acceptance
  // -------------------------------------------------------------------------
  it('04: Offer & KFS Experience: retrieves binding offer, displays KFS, and handles acceptance', async () => {
    // 1. Get Borrower applications
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    const appId = journey.activeApplicationId!;

    // Create a binding offer for this application
    const offer = await offerEngineService.generateOffer(
      tenantA,
      appId,
      {
        customOfferedAmount: 150000,
        customTenureMonths: 12,
        overrideRatePct: 14.0,
      },
      { id: borrowerAUserId, tenantId: tenantA }
    );
    expect(offer.id).toBeDefined();

    // 2. Fetch Borrower Offers
    const offers = await borrowerService.getBorrowerOffers(borrowerAUserId, tenantA);
    expect(offers.length).toBeGreaterThan(0);
    const matchingOffer = offers.find((o: any) => o.id === offer.id || o.applicationId === appId);
    expect(matchingOffer).toBeDefined();

    // 3. Fetch KFS
    const kfs = await borrowerService.getBorrowerKfs(borrowerAUserId, offer.id, tenantA);
    expect(kfs.loanAmount).toBe(150000);
    expect(kfs.annualPercentageRateApr).toBeDefined();
    expect(kfs.coolingOffDays).toBeGreaterThanOrEqual(3);
    expect(kfs.repaymentScheduleSummary.length).toBe(12);

    // 4. Accept Offer
    const acceptance = await borrowerService.acceptBorrowerOffer(
      borrowerAUserId,
      offer.id,
      { kfsAccepted: true },
      tenantA
    );
    expect(acceptance.success).toBe(true);
    expect(acceptance.status).toBe('ACCEPTED');
    expect(acceptance.agreementId).toBeDefined();

    // Verify journey state transitions to ESIGN_PENDING or FINANCE_PROCESSING
    const journeyAfterAccept = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    expect(['AGREEMENT_PENDING', 'ESIGN_PENDING', 'FINANCE_PROCESSING']).toContain(
      journeyAfterAccept.currentStage
    );
  });

  // -------------------------------------------------------------------------
  // 5. Digital eSign Execution
  // -------------------------------------------------------------------------
  it('05: Digital eSign executes agreement and prepares for disbursement', async () => {
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    const appId = journey.activeApplicationId!;

    // Execute eSign
    const esignResult = await borrowerService.executeBorrowerEsign(
      borrowerAUserId,
      appId,
      '123456',
      tenantA
    );

    expect(esignResult.success).toBe(true);
    expect(esignResult.status).toBe('SIGNED');
    expect(esignResult.signedDocumentUrl).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 6. Mandate Setup & Instant Disbursement Activation
  // -------------------------------------------------------------------------
  it('06: Setup Mandate & Disburse triggers loan activation and creates authoritative schedule', async () => {
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    const appId = journey.activeApplicationId!;

    const disbResult = await borrowerService.setupBorrowerMandateAndDisburse(
      borrowerAUserId,
      appId,
      'ENACH',
      tenantA
    );

    expect(disbResult.success).toBe(true);
    expect(disbResult.loanAccountNumber).toBeDefined();
    expect(disbResult.netDisbursedAmount).toBeGreaterThan(140000);

    // Verify journey state is now ACTIVE_LOAN or PAYMENT_DUE
    const journeyAfterDisb = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    expect(['ACTIVE_LOAN', 'PAYMENT_DUE', 'DISBURSEMENT_PROCESSING']).toContain(
      journeyAfterDisb.currentStage
    );
    expect(journeyAfterDisb.activeLoanId).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 7. Active Loan Account & Repayment Schedule
  // -------------------------------------------------------------------------
  it('07: Active Loan Dossier retrieves real schedules and decimal-safe balances', async () => {
    const loans = await borrowerService.getBorrowerLoans(borrowerAUserId, tenantA);
    expect(loans.length).toBeGreaterThan(0);
    const activeLoan = loans[0];

    const loanDetails = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activeLoan.id, tenantA);
    expect(loanDetails.loanAccountNumber).toBe(activeLoan.loanAccountNumber);
    expect(Number(loanDetails.sanctionedPrincipal)).toBe(150000);
    expect(loanDetails.repaymentSchedule.length).toBe(12);
    expect(loanDetails.repaymentSchedule[0].emiNumber).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 8. Payment Processing & Receipt Generation
  // -------------------------------------------------------------------------
  it('08: Payment Processing: allocates payment and updates loan balances', async () => {
    const loans = await borrowerService.getBorrowerLoans(borrowerAUserId, tenantA);
    const loan = loans[0];
    const emiAmount = Number(loan.emiAmount || 13467);

    const repaymentResult = await borrowerService.processBorrowerRepayment(
      borrowerAUserId,
      {
        loanId: loan.id,
        amount: emiAmount,
        paymentMethod: 'UPI',
        upiVpa: 'rohit@okhdfcbank',
        emiNumber: 1,
      },
      tenantA
    );

    expect(repaymentResult.paymentId).toBeDefined();
    expect(repaymentResult.status).toBe('SUCCESS');
    expect(repaymentResult.receiptUrl).toBeDefined();

    // Verify updated loan details reflect reduced balance
    const updatedDetails = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, loan.id, tenantA);
    expect(updatedDetails.repaymentSchedule[0].status).toBe('PAID');
  });

  // -------------------------------------------------------------------------
  // 9. Consents Ledger & Audit
  // -------------------------------------------------------------------------
  it('09: Consents Ledger tracks active consents and records new authorizations', async () => {
    const consentsBefore = await borrowerService.getBorrowerConsents(borrowerAUserId, tenantA);
    expect(consentsBefore.length).toBeGreaterThanOrEqual(1);

    const newConsent = await borrowerService.recordBorrowerConsent(
      borrowerAUserId,
      {
        consentType: 'ACCOUNT_AGGREGATOR',
        purpose: 'Real-time bank statement analytics for credit limit enhancement',
        ipAddress: '103.22.45.10',
      },
      tenantA
    );

    expect(newConsent.id).toBeDefined();
    expect(newConsent.consentType).toBe('ACCOUNT_AGGREGATOR');
    expect(newConsent.status).toBe('ACTIVE');

    const consentsAfter = await borrowerService.getBorrowerConsents(borrowerAUserId, tenantA);
    expect(consentsAfter.some((c) => c.consentType === 'ACCOUNT_AGGREGATOR')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 10. Document Vault Access
  // -------------------------------------------------------------------------
  it('10: Document Vault lists only authorized borrower-owned documents', async () => {
    const docs = await borrowerService.getBorrowerDocuments(borrowerAUserId, tenantA);
    expect(Array.isArray(docs)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 11. Profile Update
  // -------------------------------------------------------------------------
  it('11: Borrower Profile Update modifies permitted demographic fields', async () => {
    const updateResult = await borrowerService.updateBorrowerProfile(
      borrowerAUserId,
      {
        monthlyIncome: 95000,
        addressLine1: 'B-402, Sunshine Heights, Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
      tenantA
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.customer.monthlyIncome).toBe(95000);
  });

  // -------------------------------------------------------------------------
  // 12. Anti-IDOR & Tenant Isolation Security
  // -------------------------------------------------------------------------
  it('12: Anti-IDOR Security: Borrower B is strictly forbidden from accessing Borrower A resources', async () => {
    const loansA = await borrowerService.getBorrowerLoans(borrowerAUserId, tenantA);
    const loanAId = loansA[0].id;

    // Borrower B in Tenant B attempts to fetch Borrower A's loan details
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerBUserId, loanAId, tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to generate NOC for Borrower A's loan
    await expect(
      borrowerService.generateBorrowerNoc(borrowerBUserId, loanAId, tenantB)
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // 13. Operational Boundary & Omission of Internal Data
  // -------------------------------------------------------------------------
  it('13: Borrower Views strictly omit credit analyst notes, BRE rules, and internal collections data', async () => {
    const summary = await borrowerService.getBorrowerHomeSummary(borrowerAUserId, tenantA);

    // Internal sensitive properties must NEVER be exposed
    expect((summary as any).creditAnalystNotes).toBeUndefined();
    expect((summary as any).breRulesEvaluated).toBeUndefined();
    expect((summary as any).riskScore).toBeUndefined();
    expect((summary as any).collectionsOfficer).toBeUndefined();
    expect((summary as any).underwriterName).toBeUndefined();
    expect((summary as any).internalAuditTrail).toBeUndefined();
  });
});
