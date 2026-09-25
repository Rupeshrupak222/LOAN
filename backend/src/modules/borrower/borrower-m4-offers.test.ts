import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { offerEngineService } from '../offers/offers.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M4: Borrower Eligibility -> Offer -> KFS -> Acceptance Tests', { timeout: 35000 }, () => {
  const tenantA = `tenant_m4_a_${Date.now()}`;
  const tenantB = `tenant_m4_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let productId = '';
  let applicationAId = '';
  let applicationBId = '';
  let offerAId = '';
  let secondAppId = '';
  let secondOfferId = '';

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M4_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M4 Prime Lending Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M4_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M4 NBFC Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // Seed pricing policy for tenant A
    offerEngineService.seedCanonicalPricingPolicies(tenantA);
    offerEngineService.seedCanonicalPricingPolicies(tenantB);

    // 2. Create User & Customer in Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m4.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m4_a',
        firstName: 'Devendra',
        lastName: 'Patel',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M4A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Devendra',
        lastName: 'Patel',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 75000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerACustomerId = customerA.id;

    // 3. Create User & Customer in Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m4.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m4_b',
        firstName: 'Sneha',
        lastName: 'Roy',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M4B-${Date.now().toString().slice(-4)}`,
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
    const prod = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Prime Personal Cash Loan',
        code: `M4_PRIME_${Date.now().toString().slice(-5)}`,
        productType: 'PERSONAL',
        minAmount: 10000,
        maxAmount: 200000,
        minTenureMonths: 6,
        maxTenureMonths: 24,
        interestRate: 14.5,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    productId = prod.id;

    // 5. Submit Application for Borrower A in Tenant A
    const appA = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-M4A-${Date.now().toString().slice(-6)}`,
        customerId: borrowerACustomerId,
        productId,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Medical Emergency',
        status: 'APPROVED',
        submittedAt: new Date(),
        tenantId: tenantA,
      },
    });
    applicationAId = appA.id;

    // 6. Generate binding offer via Offer Engine for Borrower A
    const generatedOffer = await offerEngineService.generateOffer(
      tenantA,
      applicationAId,
      {
        customOfferedAmount: 50000,
        customTenureMonths: 12,
        overrideRatePct: 14.5,
      },
      { id: borrowerAUserId, tenantId: tenantA, roles: ['CUSTOMER'] }
    );
    offerAId = generatedOffer.id;

    // 7. Create second application for decline workflow test
    const app2 = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-M4A-2-${Date.now().toString().slice(-6)}`,
        customerId: borrowerACustomerId,
        productId,
        requestedAmount: 30000,
        tenureMonths: 6,
        purpose: 'Gadget Purchase',
        status: 'APPROVED',
        submittedAt: new Date(),
        tenantId: tenantA,
      },
    });
    secondAppId = app2.id;

    const offer2 = await offerEngineService.generateOffer(
      tenantA,
      secondAppId,
      {
        customOfferedAmount: 30000,
        customTenureMonths: 6,
        overrideRatePct: 15.0,
      },
      { id: borrowerAUserId, tenantId: tenantA, roles: ['CUSTOMER'] }
    );
    secondOfferId = offer2.id;
  }, 45000);

  it('1. Offer Discovery: lists authoritative offers from Offer Engine; Tenant B returns empty list', async () => {
    const offersA = await borrowerService.getBorrowerOffers(borrowerAUserId, tenantA);
    expect(offersA).toBeInstanceOf(Array);
    expect(offersA.length).toBeGreaterThanOrEqual(2);

    const matchA = offersA.find((o) => o.id === offerAId);
    expect(matchA).toBeDefined();
    expect(matchA?.offeredAmount).toBe(50000);
    expect(matchA?.tenureMonths).toBe(12);
    expect(matchA?.annualInterestRatePct).toBe(14.5);
    expect(matchA?.monthlyEmi).toBeGreaterThan(0);
    expect(matchA?.netDisbursedAmount).toBeLessThan(50000); // After processing fee & GST
    expect(matchA?.status).toBe('PENDING_ACCEPTANCE');

    // Tenant B borrower has 0 offers: returns empty array, never invent dummy offers
    const offersB = await borrowerService.getBorrowerOffers(borrowerBUserId, tenantB);
    expect(offersB).toEqual([]);
  });

  it('2. Offer Details: returns complete authoritative offer parameters for authenticated borrower', async () => {
    const detail = await borrowerService.getBorrowerOfferDetails(borrowerAUserId, offerAId, tenantA);
    expect(detail).toBeDefined();
    expect(detail.id).toBe(offerAId);
    expect(detail.applicationId).toBe(applicationAId);
    expect(detail.offeredAmount).toBe(50000);
    expect(detail.tenureMonths).toBe(12);
    expect(detail.processingFee).toBeGreaterThan(0);
    expect(detail.processingFeeGst).toBeGreaterThan(0);
    expect(detail.totalFeesAndTaxes).toBeGreaterThan(0);
    expect(detail.netDisbursedAmount).toBe(detail.offeredAmount - detail.totalFeesAndTaxes);
    expect(detail.status).toBe('PENDING_ACCEPTANCE');
    expect(detail.validUntil).toBeDefined();
    expect(detail.isExpired).toBe(false);
  });

  it('3. Statutory Key Fact Statement (KFS): returns accurate APR, deductions breakdown, cooling-off period, and schedule', async () => {
    const kfs = await borrowerService.getBorrowerKfs(borrowerAUserId, offerAId, tenantA);
    expect(kfs).toBeDefined();
    expect(kfs.kfsId).toMatch(/^KFS-/);
    expect(kfs.loanAmount).toBe(50000);
    expect(kfs.annualPercentageRateApr).toBeGreaterThan(14.5); // APR exceeds nominal rate due to upfront fee
    expect(kfs.nominalInterestRate).toBe(14.5);
    expect(kfs.interestType).toBe('REDUCING_BALANCE');
    expect(kfs.tenureMonths).toBe(12);
    expect(kfs.coolingOffDays).toBe(3);
    expect(kfs.coolingOffEndDate).toBeDefined();
    expect(kfs.foreclosureCharges).toBeDefined();
    expect(kfs.penalInterestRate).toBeDefined();
    expect(kfs.grievanceRedressalOfficer).toBeDefined();
    expect(kfs.grievanceRedressalOfficer.name).toBeDefined();
    expect(kfs.grievanceRedressalOfficer.email).toBeDefined();
    expect(kfs.repaymentScheduleSummary).toBeInstanceOf(Array);
    expect(kfs.repaymentScheduleSummary.length).toBe(12);

    // Verify first and last schedule row math
    const firstRow = kfs.repaymentScheduleSummary[0];
    expect(firstRow.installmentNumber).toBe(1);
    expect(firstRow.principal + firstRow.interest).toBe(firstRow.emi);

    const lastRow = kfs.repaymentScheduleSummary[11];
    expect(lastRow.installmentNumber).toBe(12);
    expect(lastRow.outstandingBalance).toBe(0);
  });

  it('4. Anti-IDOR & Tenant Isolation: Borrower B cannot inspect Borrower A’s offer or KFS', async () => {
    // Cross-customer inspection attempt
    await expect(
      borrowerService.getBorrowerOfferDetails(borrowerBUserId, offerAId, tenantB)
    ).rejects.toThrow(ForbiddenError);

    await expect(
      borrowerService.getBorrowerKfs(borrowerBUserId, offerAId, tenantB)
    ).rejects.toThrow(ForbiddenError);

    // Cross-tenant spoofing attempt
    await expect(
      borrowerService.getBorrowerOfferDetails(borrowerBUserId, offerAId, tenantA)
    ).rejects.toThrow(ForbiddenError);
  });

  it('5. Acceptance Validation: mandatory regulatory KFS acknowledgment required', async () => {
    await expect(
      borrowerService.acceptBorrowerOffer(
        borrowerAUserId,
        offerAId,
        { kfsAccepted: false },
        tenantA
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('6. Authoritative Offer Acceptance: promotes status to ACCEPTED and advances application to AGREEMENT_PENDING', async () => {
    const result = await borrowerService.acceptBorrowerOffer(
      borrowerAUserId,
      offerAId,
      {
        acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
        kfsAccepted: true,
      },
      tenantA
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe('ACCEPTED');
    expect(result.offerId).toBe(offerAId);

    // Verify offer status in offer engine
    const updatedOffer = offerEngineService.getOfferById(tenantA, offerAId);
    expect(updatedOffer.status).toBe('ACCEPTED');

    // Verify application status advanced to AGREEMENT_PENDING
    const updatedApp = await prisma.loanApplication.findUnique({
      where: { id: applicationAId },
    });
    expect(updatedApp?.status).toBe('AGREEMENT_PENDING');
  });

  it('7. Duplicate Acceptance Prevention: cannot accept an already accepted offer', async () => {
    await expect(
      borrowerService.acceptBorrowerOffer(
        borrowerAUserId,
        offerAId,
        { kfsAccepted: true },
        tenantA
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('8. Anti-IDOR Acceptance: Borrower B cannot accept Borrower A’s offer', async () => {
    await expect(
      borrowerService.acceptBorrowerOffer(
        borrowerBUserId,
        secondOfferId,
        { kfsAccepted: true },
        tenantB
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it('9. Authoritative Offer Decline: transitions status to DECLINED and cancels application', async () => {
    const declineResult = await borrowerService.declineBorrowerOffer(
      borrowerAUserId,
      secondOfferId,
      { reason: 'Found alternative credit source' },
      tenantA
    );

    expect(declineResult.status).toBe('DECLINED');

    // Verify offer status in offer engine
    const declinedOffer = offerEngineService.getOfferById(tenantA, secondOfferId);
    expect(declinedOffer.status).toBe('DECLINED');
    expect(declinedOffer.declineReason).toBe('Found alternative credit source');

    // Verify application status updated to CANCELLED
    const cancelledApp = await prisma.loanApplication.findUnique({
      where: { id: secondAppId },
    });
    expect(cancelledApp?.status).toBe('CANCELLED');
  });

  it('10. Anti-IDOR Decline: Borrower B cannot decline Borrower A’s offer', async () => {
    await expect(
      borrowerService.declineBorrowerOffer(
        borrowerBUserId,
        secondOfferId,
        { reason: 'Malicious decline attempt' },
        tenantB
      )
    ).rejects.toThrow(ForbiddenError);
  });
});
