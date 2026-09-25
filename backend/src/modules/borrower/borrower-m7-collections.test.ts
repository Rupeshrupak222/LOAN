import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M7: Borrower Overdue, Delinquency & Collections Experience Tests', { timeout: 45000 }, () => {
  const tenantA = `tenant_m7_a_${Date.now()}`;
  const tenantB = `tenant_m7_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerCUserId = ''; // Non-overdue borrower
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';
  let borrowerCCustomerId = '';

  let overdueLoanAId = '';
  let currentLoanCId = '';
  let productId = '';

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M7_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M7 MicroLend Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M7_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M7 NBFC Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // 2. Create Product
    const product = await prisma.loanProduct.create({
      data: {
        code: `M7_PROD_${Date.now().toString().slice(-6)}`,
        name: 'Flexi Personal Credit M7',
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 100000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        interestRate: 18.0,
        processingFeePct: 2.0,
        tenantId: tenantA,
        isActive: true,
      },
    });
    productId = product.id;

    // 3. Create User & Customer A (Delinquent/Overdue Borrower)
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m7.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m7_a',
        firstName: 'Vikas',
        lastName: 'Dubey',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M7A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Vikas',
        lastName: 'Dubey',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 65000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerACustomerId = customerA.id;

    // 4. Create User & Customer B (Tenant B Isolation / Anti-IDOR Actor)
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m7.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m7_b',
        firstName: 'Neha',
        lastName: 'Singh',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M7B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Neha',
        lastName: 'Singh',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 70000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 5. Create User & Customer C (Good Standing / Non-Overdue Borrower in Tenant A)
    const userC = await prisma.user.create({
      data: {
        email: `borrower.m7.c.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m7_c',
        firstName: 'Rohan',
        lastName: 'Gupta',
        tenantId: tenantA,
      },
    });
    borrowerCUserId = userC.id;

    const customerC = await prisma.customer.create({
      data: {
        customerCode: `CUST-M7C-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userC.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Rohan',
        lastName: 'Gupta',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userC.email,
        monthlyIncome: 85000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerCCustomerId = customerC.id;

    // 6. Create Overdue Loan for Customer A (Installment 1 is 5 days overdue)
    const loanNoA = `LN-M7A-${Date.now().toString().slice(-6)}`;
    const loanA = await prisma.loan.create({
      data: {
        loanNo: loanNoA,
        tenantId: tenantA,
        customerId: borrowerACustomerId,
        productId: productId,
        principal: 20000,
        interestRate: 18.0,
        tenureMonths: 2,
        emiAmount: 10450,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        outstandingPrincipal: 20000,
        outstandingInterest: 900,
        outstandingFees: 0,
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
              principal: 10000,
              interest: 450,
              fees: 0,
              totalDue: 10450,
              paidAmount: 0,
              outstanding: 10450,
              status: 'OVERDUE',
            },
            {
              emiNumber: 2,
              dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Due in 25 days
              principal: 10000,
              interest: 450,
              fees: 0,
              totalDue: 10450,
              paidAmount: 0,
              outstanding: 10450,
              status: 'UPCOMING',
            },
          ],
        },
      },
    });
    overdueLoanAId = loanA.id;

    // 7. Create Current/Good-Standing Loan for Customer C (All installments in the future)
    const loanNoC = `LN-M7C-${Date.now().toString().slice(-6)}`;
    const loanC = await prisma.loan.create({
      data: {
        loanNo: loanNoC,
        tenantId: tenantA,
        customerId: borrowerCCustomerId,
        productId: productId,
        principal: 15000,
        interestRate: 18.0,
        tenureMonths: 2,
        emiAmount: 7800,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        outstandingPrincipal: 15000,
        outstandingInterest: 600,
        outstandingFees: 0,
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
              principal: 7500,
              interest: 300,
              fees: 0,
              totalDue: 7800,
              paidAmount: 0,
              outstanding: 7800,
              status: 'UPCOMING',
            },
            {
              emiNumber: 2,
              dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
              principal: 7500,
              interest: 300,
              fees: 0,
              totalDue: 7800,
              paidAmount: 0,
              outstanding: 7800,
              status: 'UPCOMING',
            },
          ],
        },
      },
    });
    currentLoanCId = loanC.id;
  }, 40000);

  // 1. Non-Overdue State Inspection (Zero Fake Delinquency)
  describe('1. Non-Overdue State Inspection', () => {
    it('should return hasOverdue: false and 0 DPD for non-overdue Borrower C', async () => {
      const overdueSummary = await borrowerService.getBorrowerOverdueSummary(borrowerCUserId, tenantA);
      expect(overdueSummary).toBeDefined();
      expect(overdueSummary.hasOverdue).toBe(false);
      expect(overdueSummary.totalOverdueAmount).toBe(0);
      expect(overdueSummary.maxDpd).toBe(0);
      expect(overdueSummary.overdueLoansCount).toBe(0);
      expect(overdueSummary.overdueLoans).toHaveLength(0);
    });
  });

  // 2. Authoritative Overdue & Delinquency Tracking
  describe('2. Authoritative Overdue & Delinquency Tracking', () => {
    it('should return true overdue status, DPD >= 4, and affected installments for Borrower A', async () => {
      const summary = await borrowerService.getBorrowerOverdueSummary(borrowerAUserId, tenantA);
      expect(summary).toBeDefined();
      expect(summary.hasOverdue).toBe(true);
      expect(summary.totalOverdueAmount).toBe(10450);
      expect(summary.maxDpd).toBeGreaterThanOrEqual(4);
      expect(summary.overdueLoansCount).toBe(1);

      const overdueLoan = summary.overdueLoans[0];
      expect(overdueLoan.loanId).toBe(overdueLoanAId);
      expect(overdueLoan.overdueAmount).toBe(10450);
      expect(overdueLoan.agingBucket).toBe('0-30');
      expect(overdueLoan.overdueInstallmentsCount).toBe(1);
      expect(overdueLoan.affectedInstallments).toHaveLength(1);
      expect(overdueLoan.affectedInstallments[0].emiNumber).toBe(1);
      expect(overdueLoan.affectedInstallments[0].totalDue).toBe(10450);
      expect(overdueLoan.borrowerMessage).toBeDefined();
    });
  });

  // 3. Security, Anti-IDOR & Tenant Isolation
  describe('3. Security, Anti-IDOR & Privacy Isolation', () => {
    it('should forbid Borrower B from viewing Borrower A overdue information (Anti-IDOR)', async () => {
      // Borrower B queries own summary in Tenant B
      const summaryB = await borrowerService.getBorrowerOverdueSummary(borrowerBUserId, tenantB);
      expect(summaryB.hasOverdue).toBe(false);
      expect(summaryB.overdueLoansCount).toBe(0);
    });

    it('should reject cross-tenant overdue queries with ForbiddenError', async () => {
      await expect(
        borrowerService.getBorrowerOverdueSummary(borrowerAUserId, tenantB)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should ensure borrower messages contain no internal collector notes or staff comments', async () => {
      const summary = await borrowerService.getBorrowerOverdueSummary(borrowerAUserId, tenantA);
      const loan = summary.overdueLoans[0];
      // Borrower message must not contain internal words
      expect(loan.borrowerMessage).not.toContain('collector');
      expect(loan.borrowerMessage).not.toContain('score');
      expect(loan.borrowerMessage).not.toContain('risk_score');
    });
  });

  // 4. Promise to Pay (PTP) Registration & Validation
  describe('4. Promise to Pay (PTP) Registration & Validation', () => {
    it('should reject PTP with amount <= 0', async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await expect(
        borrowerService.createBorrowerPtp(
          borrowerAUserId,
          {
            loanId: overdueLoanAId,
            promisedDate: futureDate,
            promisedAmount: 0,
          },
          tenantA
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should reject PTP with date in the past', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await expect(
        borrowerService.createBorrowerPtp(
          borrowerAUserId,
          {
            loanId: overdueLoanAId,
            promisedDate: pastDate,
            promisedAmount: 10450,
          },
          tenantA
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should forbid Borrower B from creating PTP on Borrower A loan (Anti-IDOR)', async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await expect(
        borrowerService.createBorrowerPtp(
          borrowerBUserId,
          {
            loanId: overdueLoanAId,
            promisedDate: futureDate,
            promisedAmount: 10450,
          },
          tenantB
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should successfully record PTP for Borrower A and reflect in active PTP state', async () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const ptp = await borrowerService.createBorrowerPtp(
        borrowerAUserId,
        {
          loanId: overdueLoanAId,
          promisedDate: futureDate,
          promisedAmount: 10450,
          paymentMode: 'UPI',
          notes: 'Will pay once salary is credited',
        },
        tenantA
      );

      expect(ptp).toBeDefined();
      expect(ptp.id).toBeDefined();
      expect(ptp.loanId).toBe(overdueLoanAId);
      expect(ptp.promisedAmount).toBe(10450);
      expect(ptp.status).toBe('PENDING');

      // Check that PTP is reflected in getBorrowerPtps
      const ptps = await borrowerService.getBorrowerPtps(borrowerAUserId, overdueLoanAId, tenantA);
      expect(ptps.length).toBeGreaterThanOrEqual(1);
      expect(ptps[0].id).toBe(ptp.id);
      expect(ptps[0].status).toBe('PENDING');

      // Check that activePtp is reflected in getBorrowerOverdueSummary
      const summary = await borrowerService.getBorrowerOverdueSummary(borrowerAUserId, tenantA);
      expect(summary.overdueLoans[0].activePtp).toBeDefined();
      expect(summary.overdueLoans[0].activePtp?.id).toBe(ptp.id);
      expect(summary.overdueLoans[0].activePtp?.status).toBe('PENDING');
    });
  });

  // 5. Payment Remittance & PTP Honor Evaluation
  describe('5. Payment Remittance & Automatic PTP Evaluation', () => {
    it('should evaluate and mark PTP as KEPT when repayment is remitted', async () => {
      const paymentResult = await borrowerService.processBorrowerRepayment(
        borrowerAUserId,
        {
          loanId: overdueLoanAId,
          amount: 10450,
          paymentMethod: 'UPI',
          paymentReference: 'UPI-M7-OVERDUE-10450',
          installmentNumber: 1,
        },
        tenantA
      );

      expect(paymentResult).toBeDefined();
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.status).toBe('SUCCESS');

      // Check that PTP status in database has transitioned to KEPT
      const ptps = await borrowerService.getBorrowerPtps(borrowerAUserId, overdueLoanAId, tenantA);
      const activePtp = ptps[0];
      expect(activePtp.status).toBe('KEPT');
    });

    it('should confirm overdue status is cleared after full overdue repayment', async () => {
      const summary = await borrowerService.getBorrowerOverdueSummary(borrowerAUserId, tenantA);
      expect(summary.hasOverdue).toBe(false);
      expect(summary.totalOverdueAmount).toBe(0);
      expect(summary.maxDpd).toBe(0);
      expect(summary.overdueLoansCount).toBe(0);
    });
  });
});
