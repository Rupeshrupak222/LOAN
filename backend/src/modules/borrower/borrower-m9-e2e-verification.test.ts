import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from '../../common/errors';

describe('Phase M9: Complete Borrower E2E Verification & Production Readiness', { timeout: 60000 }, () => {
  const tenantA = `tenant_m9_alpha_${Date.now()}`;
  const tenantB = `tenant_m9_beta_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let productId = '';
  let createdApplicationId = '';
  let generatedOfferId = '';
  let activatedLoanId = '';

  beforeAll(async () => {
    // 1. Create Tenant A (Primary) & Tenant B (Isolation Boundary)
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M9_A_${Date.now().toString().slice(-6)}`,
        name: 'Adyapan Digital Lending Alpha Corp',
        contactEmail: `compliance_${Date.now()}@adyapan-alpha.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M9_B_${Date.now().toString().slice(-6)}`,
        name: 'Adyapan Beta Finance Ltd',
        contactEmail: `compliance_${Date.now()}@adyapan-beta.com`,
      },
    });

    // 2. Create Dynamic Product
    const product = await prisma.loanProduct.create({
      data: {
        code: `M9_FLEXI_${Date.now().toString().slice(-5)}`,
        name: 'Flexi Consumer Credit M9',
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 100000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        interestRate: 14.5,
        processingFeePct: 2.0,
        tenantId: tenantA,
        isActive: true,
      },
    });
    productId = product.id;

    // 3. Create User & Customer A (Primary Borrower)
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m9.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m9_a',
        firstName: 'Devendra',
        lastName: 'Sharma',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M9A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Devendra',
        lastName: 'Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 75000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerACustomerId = customerA.id;

    // 4. Create User & Customer B (Tenant B Isolation Actor)
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m9.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m9_b',
        firstName: 'Kavita',
        lastName: 'Patel',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M9B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Kavita',
        lastName: 'Patel',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 65000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;
  });

  // =========================================================================
  // SUITE 1: End-to-End Borrower Lifecycle (M1 -> M8 Complete Sequential Flow)
  // =========================================================================

  it('E2E-1 (M1 & M2): Profile Setup & Completeness Calculation', async () => {
    // 1. Fetch initial profile
    const initialProfile = await borrowerService.getBorrowerDetailedProfile(borrowerAUserId, tenantA);
    expect(initialProfile).toBeDefined();
    expect(initialProfile.firstName).toBe('Devendra');
    expect(initialProfile.completion).toBeDefined();

    // 2. Update address & employment details
    const updated = await borrowerService.updateBorrowerProfile(
      borrowerAUserId,
      {
        addressLine1: 'Flat 402, Green Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        employmentType: 'SALARIED',
        employerName: 'Tech Innovations Corp',
        designation: 'Senior Engineer',
        monthlyIncome: 85000,
        workExperienceYears: 5,
      },
      tenantA
    );
    expect(updated.profile?.firstName || updated.customer?.firstName).toBe('Devendra');

    const verifiedProfile = await borrowerService.getBorrowerDetailedProfile(borrowerAUserId, tenantA);
    expect(verifiedProfile.primaryAddress?.city).toBe('Bengaluru');
    expect(verifiedProfile.primaryEmployment?.employerName).toBe('Tech Innovations Corp');
    expect(verifiedProfile.completion.percentage).toBeGreaterThanOrEqual(60);
  });

  it('E2E-2 (M3): Product Discovery, Draft Management & Application Submission', async () => {
    // 1. Discover products
    const products = await borrowerService.getConsumerProducts(tenantA);
    expect(products.length).toBeGreaterThanOrEqual(1);
    const selectedProd = products.find((p) => p.id === productId);
    expect(selectedProd).toBeDefined();

    // 2. Save draft application
    const draft = await borrowerService.saveBorrowerDraftApplication(
      borrowerAUserId,
      {
        productId,
        requestedAmount: 30000,
        tenureMonths: 6,
        purpose: 'Personal Equipment Upgrade',
        firstName: 'Devendra',
        lastName: 'Sharma',
        employmentType: 'SALARIED',
        employerName: 'Tech Innovations Corp',
        monthlyIncome: 85000,
        accountHolderName: 'Devendra Sharma',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
      },
      tenantA
    );
    expect(draft.applicationId).toBeDefined();
    expect(draft.status).toBe('DRAFT');

    // 3. Submit complete application
    const app = await borrowerService.submitBorrowerApplication(
      borrowerAUserId,
      {
        productId,
        requestedAmount: 30000,
        tenureMonths: 6,
        purpose: 'Personal Equipment Upgrade',
        firstName: 'Devendra',
        lastName: 'Sharma',
        dob: '1992-05-15',
        gender: 'MALE',
        addressLine1: 'Flat 402, Green Avenue',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        employmentType: 'SALARIED',
        employerName: 'Tech Innovations Corp',
        designation: 'Senior Engineer',
        workExperienceYears: 5,
        monthlyIncome: 85000,
        panNumber: 'ABCDE1234F',
        aadhaarNumberMasked: '1234',
        kycConsentGiven: true,
        accountHolderName: 'Devendra Sharma',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountType: 'SAVINGS',
        creditBureauConsent: true,
        termsAccepted: true,
      },
      tenantA
    );

    createdApplicationId = app.applicationId;
    expect(createdApplicationId).toBeDefined();
    expect(app.applicationNumber).toMatch(/^APP-/);
    expect(['SUBMITTED', 'APPROVED']).toContain(app.status);
  });

  it('E2E-3 (M4): Real-Time BRE Eligibility, Offers Discovery, Statutory KFS & Acceptance', async () => {
    // 1. BRE Eligibility Check
    const eligibility = await borrowerService.evaluateBorrowerEligibility(
      borrowerAUserId,
      {
        productId,
        requestedAmount: 30000,
        requestedTenureMonths: 6,
        monthlyIncome: 85000,
        existingMonthlyEmi: 0,
        employmentType: 'SALARIED',
      },
      tenantA
    );
    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.maxEligibleAmount).toBeGreaterThanOrEqual(30000);

    // 2. Discover authoritative offers
    const offers = await borrowerService.getBorrowerOffers(borrowerAUserId, tenantA);
    expect(offers.length).toBeGreaterThanOrEqual(1);
    generatedOfferId = offers[0].id;
    expect(generatedOfferId).toBeDefined();
    expect(['PENDING', 'OFFER_GENERATED']).toContain(offers[0].status);

    // 3. Fetch Statutory Key Fact Statement (KFS)
    const kfs = await borrowerService.getBorrowerKfs(borrowerAUserId, generatedOfferId, tenantA);
    expect(kfs.kfsId).toBeDefined();
    expect(kfs.annualPercentageRateApr).toBeGreaterThan(0);
    expect(kfs.netDisbursementAmount).toBeGreaterThan(0);
    expect(kfs.coolingOffDays).toBe(3);
    expect(kfs.repaymentScheduleSummary.length).toBe(6);

    // 4. Accept Offer with regulatory KFS acknowledgment
    const acceptResult = await borrowerService.acceptBorrowerOffer(
      borrowerAUserId,
      generatedOfferId,
      { kfsAccepted: true },
      tenantA
    );
    expect(acceptResult.success).toBe(true);
    expect(acceptResult.status).toBe('ACCEPTED');

    // Re-fetch application to ensure createdApplicationId is aligned
    if (acceptResult.applicationId) {
      createdApplicationId = acceptResult.applicationId;
    }
  });

  it('E2E-4 (M5): Loan Agreement Review, Aadhaar eSign, Mandate & Instant Loan Activation', async () => {
    // 1. Review Digital Loan Agreement
    const agreement = await borrowerService.getBorrowerAgreement(borrowerAUserId, createdApplicationId, tenantA);
    expect(agreement.hasAgreement).toBe(true);
    expect(agreement.agreement?.agreementNumber).toMatch(/AGR-/);
    expect(agreement.esignStatus).toBe('NOT_INITIATED');

    // 2. Execute Aadhaar OTP eSign
    const esignResult = await borrowerService.executeBorrowerEsign(
      borrowerAUserId,
      createdApplicationId,
      '123456', // Sandbox OTP
      tenantA
    );
    expect(esignResult.success).toBe(true);
    expect(esignResult.esignSignatureHash).toBeDefined();
    expect(esignResult.esignSignatureHash.length).toBe(64);

    // 3. Setup Mandate & Disburse (Activate Loan)
    const activationResult = await borrowerService.setupBorrowerMandateAndDisburse(
      borrowerAUserId,
      createdApplicationId,
      'ENACH',
      tenantA
    );
    expect(activationResult.success).toBe(true);
    expect(activationResult.loanId).toBeDefined();
    expect(activationResult.loanAccountNumber).toMatch(/^LN-/);
    expect(activationResult.netDisbursedAmount).toBeGreaterThan(0);
    activatedLoanId = activationResult.loanId;
  });

  it('E2E-5 (M6): Active Loan Servicing, Partial Repayment & General Ledger Allocation', async () => {
    // 1. Inspect active loan dossier
    const loanDossier = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activatedLoanId, tenantA);
    expect(loanDossier.id).toBe(activatedLoanId);
    expect(loanDossier.status).toBe('ACTIVE');
    expect(loanDossier.sanctionedPrincipal).toBe(30000);
    expect(loanDossier.repaymentSchedule.length).toBe(6);

    // 2. Process regular EMI repayment
    const emiAmount = loanDossier.emiAmount;
    const paymentResult = await borrowerService.processBorrowerRepayment(
      borrowerAUserId,
      {
        loanId: activatedLoanId,
        amount: emiAmount,
        paymentMethod: 'UPI',
      },
      tenantA
    );

    expect(paymentResult.success).toBe(true);
    expect(paymentResult.status).toBe('SUCCESS');
    expect(paymentResult.referenceNumber).toMatch(/^TXN-UPI-/);
    expect(paymentResult.allocationSummary.allocatedPrincipal).toBeGreaterThan(0);

    // 3. Verify Payment Ledger
    const payments = await borrowerService.getBorrowerPayments(borrowerAUserId, activatedLoanId, tenantA);
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(emiAmount);
  });

  it('E2E-6 (M7): Overdue Delinquency Tracking, Promise to Pay (PTP) & Auto-Evaluation', async () => {
    // 1. Register a Promise to Pay for upcoming dues
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ptp = await borrowerService.createBorrowerPtp(
      borrowerAUserId,
      {
        loanId: activatedLoanId,
        promisedDate: tomorrow,
        promisedAmount: 5000,
        paymentMode: 'UPI',
        notes: 'Will remit payment before end of day tomorrow.',
      },
      tenantA
    );

    expect(ptp.id).toBeDefined();
    expect(ptp.promisedAmount).toBe(5000);
    expect(ptp.status).toBe('PENDING');

    // 2. Fetch active PTP list
    const ptpList = await borrowerService.getBorrowerPtps(borrowerAUserId, activatedLoanId, tenantA);
    expect(ptpList.length).toBeGreaterThanOrEqual(1);
    expect(ptpList[0].status).toBe('PENDING');
  });

  it('E2E-7 (M8): Full Loan Settlement, Loan Closure, Statutory NOC & Statement of Account', async () => {
    // 1. Get current balance & remaining unpaid installments
    const currentLoan = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activatedLoanId, tenantA);
    const totalRemainingDue = currentLoan.repaymentSchedule.reduce(
      (sum, s) => sum + (s.status !== 'PAID' ? s.totalDue : 0),
      0
    );

    // 2. Remit final full payment covering all remaining installments
    const finalPayment = await borrowerService.processBorrowerRepayment(
      borrowerAUserId,
      {
        loanId: activatedLoanId,
        amount: totalRemainingDue,
        paymentMethod: 'NET_BANKING',
      },
      tenantA
    );

    expect(finalPayment.success).toBe(true);
    expect(finalPayment.isFullyPaid).toBe(true);
    expect(finalPayment.message).toContain('Congratulations! Your loan has been fully settled');

    // 3. Verify closed loan state
    const closedLoan = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activatedLoanId, tenantA);
    expect(closedLoan.status).toBe('CLOSED');
    expect(closedLoan.totalOutstanding).toBe(0);
    expect(closedLoan.isNocAvailable).toBe(true);

    // 4. Retrieve authentic statutory NOC Certificate
    const noc = await borrowerService.generateBorrowerNoc(borrowerAUserId, activatedLoanId, tenantA);
    expect(noc.certificateNumber).toMatch(/^NOC-/);
    expect(noc.borrowerName).toBe('Devendra Sharma');
    expect(noc.status).toBe('CLOSED_FULLY_SETTLED');
    expect(noc.digitalSignatureHash).toBeDefined();
    expect(noc.complianceStatement).toContain('no further lien or hypothecation');

    // 5. Retrieve official Statement of Account (SOA)
    const soa = await borrowerService.getBorrowerLoanStatement(borrowerAUserId, activatedLoanId, tenantA);
    expect(soa.statementId).toMatch(/^SOA-/);
    expect(soa.loanSummary.status).toBe('CLOSED');
    expect(soa.loanSummary.totalOutstanding).toBe(0);
    expect(soa.transactions.length).toBeGreaterThanOrEqual(3); // Disbursement + 2 Repayments
  });

  // =========================================================================
  // SUITE 2: Security, Anti-IDOR & Boundary Protection
  // =========================================================================

  it('SEC-1: Anti-IDOR Security: Borrower B is strictly forbidden from accessing Borrower A resources', async () => {
    // Borrower B attempts to access Borrower A's application
    await expect(
      borrowerService.getBorrowerApplicationById(borrowerBUserId, createdApplicationId, tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to access Borrower A's agreement
    await expect(
      borrowerService.getBorrowerAgreement(borrowerBUserId, createdApplicationId, tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to eSign Borrower A's contract
    await expect(
      borrowerService.executeBorrowerEsign(borrowerBUserId, createdApplicationId, '123456', tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to inspect Borrower A's loan dossier
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerBUserId, activatedLoanId, tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to generate NOC for Borrower A's loan
    await expect(
      borrowerService.generateBorrowerNoc(borrowerBUserId, activatedLoanId, tenantB)
    ).rejects.toThrow();

    // Borrower B attempts to view Borrower A's Statement of Account
    await expect(
      borrowerService.getBorrowerLoanStatement(borrowerBUserId, activatedLoanId, tenantB)
    ).rejects.toThrow();
  });

  it('SEC-2: Multi-Tenant Isolation: Cross-tenant requests are strictly blocked with ForbiddenError', async () => {
    // Borrower A querying with Tenant B context
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerAUserId, activatedLoanId, tenantB)
    ).rejects.toThrow(ForbiddenError);
  });

  it('SEC-3: Zero Internal Data Leakage: Privacy shield omits internal risk and collector data', async () => {
    const homeSummary = await borrowerService.getBorrowerHomeSummary(borrowerAUserId, tenantA);
    expect((homeSummary as any).riskScore).toBeUndefined();
    expect((homeSummary as any).internalNotes).toBeUndefined();
    expect((homeSummary as any).assignedOfficer).toBeUndefined();

    const loanDetails = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activatedLoanId, tenantA);
    expect((loanDetails as any).underwriterRemarks).toBeUndefined();
    expect((loanDetails as any).internalRiskCategory).toBeUndefined();
  });

  it('SEC-4: Validation: Repayment rejects zero or negative amounts', async () => {
    await expect(
      borrowerService.processBorrowerRepayment(
        borrowerAUserId,
        {
          loanId: activatedLoanId,
          amount: -500,
          paymentMethod: 'UPI',
        },
        tenantA
      )
    ).rejects.toThrow(BadRequestError);
  });
});
