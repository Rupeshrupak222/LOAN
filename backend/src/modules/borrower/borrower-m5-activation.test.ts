import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { offerEngineService } from '../offers/offers.service';
import { contractsService } from '../contracts/contracts.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M5: Agreement, eSign, Pre-Disbursement & Loan Activation Tests', { timeout: 35000 }, () => {
  const tenantA = `tenant_m5_a_${Date.now()}`;
  const tenantB = `tenant_m5_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let productId = '';
  let applicationAId = '';
  let applicationBId = '';
  let offerAId = '';
  let secondAppId = '';
  let activeLoanId = '';

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M5_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M5 Prime Lending Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M5_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M5 NBFC Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // Seed pricing policies
    offerEngineService.seedCanonicalPricingPolicies(tenantA);
    offerEngineService.seedCanonicalPricingPolicies(tenantB);

    // 2. Create User & Customer A in Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m5.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m5_a',
        firstName: 'Devendra',
        lastName: 'Patel',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M5A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Devendra',
        lastName: 'Patel',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 75000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        bankAccounts: {
          create: {
            accountHolderName: 'Devendra Patel',
            accountNumber: '998877665544',
            ifscCode: 'HDFC0001234',
            bankName: 'HDFC Bank',
            accountType: 'SAVINGS',
            isVerified: true,
          },
        },
      },
    });
    borrowerACustomerId = customerA.id;

    // 3. Create User & Customer B in Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m5.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m5_b',
        firstName: 'Sneha',
        lastName: 'Roy',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M5B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Sneha',
        lastName: 'Roy',
        mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 80000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 4. Create Loan Product in Tenant A
    const product = await prisma.loanProduct.create({
      data: {
        code: `PROD-M5-${Date.now().toString().slice(-4)}`,
        name: 'Instant Personal Loan M5',
        tenantId: tenantA,
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 150000,
        minTenureMonths: 3,
        maxTenureMonths: 24,
        interestRate: 15.5,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    productId = product.id;

    // 5. Create Application A for Borrower A in Tenant A
    const appA = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-M5A-${Date.now().toString().slice(-4)}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        requestedAmount: 50000,
        tenureMonths: 6,
        purpose: 'Personal Expenses',
        status: 'APPROVED',
      },
    });
    applicationAId = appA.id;

    // Generate binding offer for Application A
    const offerResult = await offerEngineService.generateOffer(
      tenantA,
      appA.id,
      {
        customOfferedAmount: 50000,
        customTenureMonths: 6,
        overrideRatePct: 15.5,
      },
      { id: borrowerAUserId, roles: ['CUSTOMER'], tenantId: tenantA }
    );
    offerAId = offerResult.id;

    // 6. Create Application B for Borrower B in Tenant B
    const appB = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-M5B-${Date.now().toString().slice(-4)}`,
        customerId: customerB.id,
        productId: product.id,
        tenantId: tenantB,
        requestedAmount: 30000,
        tenureMonths: 3,
        purpose: 'Education',
        status: 'SUBMITTED',
      },
    });
    applicationBId = appB.id;

    // 7. Create Second App for Borrower A that is not yet accepted (in DRAFT / SUBMITTED)
    const secondApp = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-M5A2-${Date.now().toString().slice(-4)}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        requestedAmount: 25000,
        tenureMonths: 3,
        purpose: 'Medical',
        status: 'SUBMITTED',
      },
    });
    secondAppId = secondApp.id;
  }, 45000);

  // 1. Accepted Offer Gate
  it('1. should block M5 agreement access if offer is not yet accepted', async () => {
    await expect(
      borrowerService.getBorrowerAgreement(borrowerAUserId, secondAppId, tenantA)
    ).rejects.toThrow(BadRequestError);
  });

  it('2. should allow M5 agreement review once offer is accepted', async () => {
    // Accept offer A
    const acceptRes = await borrowerService.acceptBorrowerOffer(
      borrowerAUserId,
      offerAId,
      { acceptanceMethod: 'CUSTOMER_PORTAL_OTP', kfsAccepted: true },
      tenantA
    );
    expect(acceptRes.success).toBe(true);
    expect(acceptRes.status).toBe('ACCEPTED');

    // Retrieve digital loan agreement
    const contractStatus = await borrowerService.getBorrowerAgreement(
      borrowerAUserId,
      applicationAId,
      tenantA
    );
    expect(contractStatus).toBeDefined();
    expect(contractStatus.hasAgreement).toBe(true);
    expect(contractStatus.agreement).toBeDefined();
    expect(contractStatus.agreement?.sanctionAmount).toBe(50000);
    expect(contractStatus.agreement?.tenureMonths).toBe(6);
    expect(contractStatus.agreement?.clauses.length).toBeGreaterThan(0);
  });

  // 2. Agreement Review Terms Verification
  it('3. should ensure agreement terms match the accepted commercial terms exactly', async () => {
    const agreement = await borrowerService.getBorrowerAgreement(borrowerAUserId, applicationAId, tenantA);
    expect(agreement.agreement?.borrowerFullName).toContain('Devendra Patel');
    expect(agreement.agreement?.monthlyEmi).toBeGreaterThan(0);
    expect(agreement.agreement?.interestRateAnnual).toBe(15.5);
    expect(agreement.esignStatus).toBe('NOT_INITIATED');
  });

  // 3. eSign Execution and Validation
  it('4. should reject eSign with invalid OTP', async () => {
    await expect(
      borrowerService.executeBorrowerEsign(borrowerAUserId, applicationAId, '999999', tenantA)
    ).rejects.toThrow(BadRequestError);
  });

  it('5. should execute Aadhaar eSign successfully with valid OTP', async () => {
    const esignRes = await borrowerService.executeBorrowerEsign(
      borrowerAUserId,
      applicationAId,
      '123456',
      tenantA
    );
    expect(esignRes.success).toBe(true);
    expect(esignRes.status).toBe('SIGNED');
    expect(esignRes.esignSignatureHash).toBeDefined();
    expect(esignRes.signedDocumentUrl).toBeDefined();

    // Verify application status transitioned to READY_FOR_DISBURSEMENT
    const app = await prisma.loanApplication.findUnique({ where: { id: applicationAId } });
    expect(app?.status).toBe('READY_FOR_DISBURSEMENT');
  });

  // 4. Pre-Disbursement & Disbursement Status Visibility
  it('6. should return authoritative pre-disbursement & finance checks for borrower', async () => {
    const status = await borrowerService.getBorrowerDisbursementStatus(
      borrowerAUserId,
      applicationAId,
      tenantA
    );
    expect(status).toBeDefined();
    expect(status.applicationId).toBe(applicationAId);
    expect(status.status).toBe('READY_FOR_DISBURSEMENT');
    expect(status.checks.offerAccepted).toBe(true);
    expect(status.checks.agreementSigned).toBe(true);
    expect(status.checks.bankAccountVerified).toBe(true);
    expect(status.beneficiaryBank?.bankName).toBe('HDFC Bank');
    expect(status.beneficiaryBank?.accountNumberMasked).toContain('5544');
    expect(status.financeProcessingStage).toBe('READY_FOR_DISBURSEMENT');
  });

  // 5. Mandate Setup & Loan Activation
  it('7. should register auto-debit mandate and activate loan account', async () => {
    const mandateRes = await borrowerService.setupBorrowerMandateAndDisburse(
      borrowerAUserId,
      applicationAId,
      'ENACH',
      tenantA
    );
    expect(mandateRes.success).toBe(true);
    expect(mandateRes.status).toBe('ACTIVE');
    expect(mandateRes.loanId).toBeDefined();
    expect(mandateRes.loanAccountNumber).toContain('LN-');
    activeLoanId = mandateRes.loanId;

    // Verify Application is marked DISBURSED
    const updatedApp = await prisma.loanApplication.findUnique({ where: { id: applicationAId } });
    expect(updatedApp?.status).toBe('DISBURSED');

    // Verify Loan record in database
    const loan = await prisma.loan.findUnique({
      where: { id: activeLoanId },
      include: { schedule: true },
    });
    expect(loan).toBeDefined();
    expect(loan?.status).toBe('ACTIVE');
    expect(Number(loan?.principal)).toBe(50000);
    expect(loan?.schedule.length).toBe(6);
  });

  // 6. Post-Activation Loan Servicing Details
  it('8. should return active loan details in borrower loan dossier', async () => {
    const loanDetails = await borrowerService.getBorrowerLoanDetails(
      borrowerAUserId,
      activeLoanId,
      tenantA
    );
    expect(loanDetails).toBeDefined();
    expect(loanDetails.id).toBe(activeLoanId);
    expect(loanDetails.sanctionedPrincipal).toBe(50000);
    expect(loanDetails.status).toBe('ACTIVE');
    expect(loanDetails.repaymentSchedule.length).toBe(6);
  });

  // 7. IDOR & Tenant Security Gating
  it('9. should prevent Borrower B from viewing Borrower A agreement (IDOR)', async () => {
    await expect(
      borrowerService.getBorrowerAgreement(borrowerBUserId, applicationAId, tenantB)
    ).rejects.toThrow(NotFoundError);
  });

  it('10. should prevent Borrower B from executing eSign on Borrower A application', async () => {
    await expect(
      borrowerService.executeBorrowerEsign(borrowerBUserId, applicationAId, '123456', tenantB)
    ).rejects.toThrow(NotFoundError);
  });

  it('11. should prevent Borrower B from viewing Borrower A disbursement status', async () => {
    await expect(
      borrowerService.getBorrowerDisbursementStatus(borrowerBUserId, applicationAId, tenantB)
    ).rejects.toThrow(NotFoundError);
  });

  it('12. should prevent Borrower B from viewing Borrower A active loan account', async () => {
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerBUserId, activeLoanId, tenantB)
    ).rejects.toThrow(NotFoundError);
  });

  it('13. should prevent cross-tenant access with ForbiddenError when tenantId mismatch occurs', async () => {
    await expect(
      borrowerService.getBorrowerAgreement(borrowerAUserId, applicationAId, tenantB)
    ).rejects.toThrow(ForbiddenError);
  });

  // 8. Borrower Journey State Aggregator
  it('14. should reflect ACTIVE_LOAN in real-time journey state after activation', async () => {
    const journey = await borrowerService.getBorrowerJourneyState(borrowerAUserId, tenantA);
    expect(journey).toBeDefined();
    expect(journey.currentStage).toBe('ACTIVE_LOAN');
    expect(journey.activeLoanId).toBe(activeLoanId);
    expect(journey.actionUrl).toBe(`/borrower/loans/${activeLoanId}`);
  });
});
