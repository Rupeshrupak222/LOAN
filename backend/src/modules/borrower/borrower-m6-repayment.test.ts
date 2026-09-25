import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M6: Active Loan, EMI Schedule & Repayment Experience Tests', { timeout: 45000 }, () => {
  const tenantA = `tenant_m6_a_${Date.now()}`;
  const tenantB = `tenant_m6_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let loanAId = '';
  let loanBId = '';
  let productId = '';

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M6_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M6 Prime Lending Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M6_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M6 NBFC Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // 2. Create Product
    const product = await prisma.loanProduct.create({
      data: {
        code: `M6_PROD_${Date.now().toString().slice(-6)}`,
        name: 'Instant Flexi Personal Loan M6',
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

    // 3. Create User & Customer A
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m6.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m6_a',
        firstName: 'Aakash',
        lastName: 'Sharma',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M6A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Aakash',
        lastName: 'Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 80000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerACustomerId = customerA.id;

    // 4. Create User & Customer B
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m6.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m6_b',
        firstName: 'Pooja',
        lastName: 'Mehta',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M6B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Pooja',
        lastName: 'Mehta',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 60000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 5. Create Active Loan for Customer A in Tenant A with 3 Installment Schedule
    const loanNoA = `LN-M6A-${Date.now().toString().slice(-6)}`;
    const loanA = await prisma.loan.create({
      data: {
        loanNo: loanNoA,
        tenantId: tenantA,
        customerId: borrowerACustomerId,
        productId: productId,
        principal: 30000,
        interestRate: 18.0,
        tenureMonths: 3,
        emiAmount: 10450,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        outstandingPrincipal: 30000,
        outstandingInterest: 900,
        outstandingFees: 0,
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
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
              dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Due next month
              principal: 10000,
              interest: 300,
              fees: 0,
              totalDue: 10300,
              paidAmount: 0,
              outstanding: 10300,
              status: 'UPCOMING',
            },
            {
              emiNumber: 3,
              dueDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000), // Due month 3
              principal: 10000,
              interest: 150,
              fees: 0,
              totalDue: 10150,
              paidAmount: 0,
              outstanding: 10150,
              status: 'UPCOMING',
            },
          ],
        },
      },
    });
    loanAId = loanA.id;

    // 6. Create Active Loan for Customer B in Tenant B
    const loanNoB = `LN-M6B-${Date.now().toString().slice(-6)}`;
    const loanB = await prisma.loan.create({
      data: {
        loanNo: loanNoB,
        tenantId: tenantB,
        customerId: borrowerBCustomerId,
        productId: productId,
        principal: 15000,
        interestRate: 18.0,
        tenureMonths: 3,
        emiAmount: 5225,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        outstandingPrincipal: 15000,
        outstandingInterest: 450,
        outstandingFees: 0,
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              principal: 5000,
              interest: 225,
              fees: 0,
              totalDue: 5225,
              paidAmount: 0,
              outstanding: 5225,
              status: 'UPCOMING',
            },
          ],
        },
      },
    });
    loanBId = loanB.id;
  }, 40000);

  // 1. Borrower Active Loan List & Dossier
  describe('1. Active Loan Listing & Details Retrieval', () => {
    it('should list active loans for borrower A', async () => {
      const loans = await borrowerService.getBorrowerLoans(borrowerAUserId, tenantA);
      expect(loans).toBeDefined();
      expect(loans.length).toBeGreaterThanOrEqual(1);

      const myLoan = loans.find((l) => l.id === loanAId);
      expect(myLoan).toBeDefined();
      expect(myLoan?.status).toBe('ACTIVE');
      expect(Number(myLoan?.principal)).toBe(30000);
      expect(Number(myLoan?.totalOutstanding)).toBe(30900);
      expect(myLoan?.tenureMonths).toBe(3);
    });

    it('should retrieve full loan dossier with repayment schedule and overdue calculations', async () => {
      const loanDetails = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, loanAId, tenantA);
      expect(loanDetails).toBeDefined();
      expect(loanDetails.id).toBe(loanAId);
      expect(loanDetails.status).toBe('ACTIVE');
      expect(Number(loanDetails.sanctionedPrincipal)).toBe(30000);
      expect(Number(loanDetails.totalOutstanding)).toBe(30900);
      
      // Check schedule
      expect(loanDetails.repaymentSchedule).toBeDefined();
      expect(loanDetails.repaymentSchedule.length).toBe(3);
      expect(loanDetails.repaymentSchedule[0].emiNumber).toBe(1);
      expect(Number(loanDetails.repaymentSchedule[0].totalDue)).toBe(10450);
      expect(loanDetails.repaymentSchedule[0].status).toBe('OVERDUE');

      // Check upcoming / overdue calculation
      expect(loanDetails.isOverdue).toBe(true);
      expect(loanDetails.overdueAmount).toBe(10450);
      expect(loanDetails.dpd).toBeGreaterThanOrEqual(4); // approx 5 days overdue
    });
  });

  // 2. Anti-IDOR & Security Boundaries
  describe('2. Anti-IDOR & Security Boundaries', () => {
    it('should forbid Borrower B from viewing Borrower A loan (Anti-IDOR)', async () => {
      await expect(
        borrowerService.getBorrowerLoanDetails(borrowerBUserId, loanAId, tenantB)
      ).rejects.toThrow(NotFoundError);
    });

    it('should reject access if cross-tenant query is attempted', async () => {
      await expect(
        borrowerService.getBorrowerLoanDetails(borrowerAUserId, loanAId, tenantB)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // 3. Make Repayment Flow & Waterfall Allocation
  describe('3. Make Repayment Flow & Waterfall Allocation', () => {
    it('should reject invalid payment amounts (<= 0)', async () => {
      await expect(
        borrowerService.processBorrowerRepayment(borrowerAUserId, {
          loanId: loanAId,
          amount: 0,
          paymentMethod: 'UPI',
        }, tenantA)
      ).rejects.toThrow(BadRequestError);

      await expect(
        borrowerService.processBorrowerRepayment(borrowerAUserId, {
          loanId: loanAId,
          amount: -500,
          paymentMethod: 'UPI',
        }, tenantA)
      ).rejects.toThrow(BadRequestError);
    });

    it('should forbid Borrower B from repaying Borrower A loan (Anti-IDOR)', async () => {
      await expect(
        borrowerService.processBorrowerRepayment(borrowerBUserId, {
          loanId: loanAId,
          amount: 10450,
          paymentMethod: 'UPI',
        }, tenantB)
      ).rejects.toThrow(NotFoundError);
    });

    it('should successfully execute repayment of 1st EMI, allocating funds and updating loan balances', async () => {
      const paymentResult = await borrowerService.processBorrowerRepayment(
        borrowerAUserId,
        {
          loanId: loanAId,
          amount: 10450,
          paymentMethod: 'UPI',
          paymentReference: 'UPI-M6-TXN-10450',
          installmentNumber: 1,
        },
        tenantA
      );

      expect(paymentResult).toBeDefined();
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.paymentId).toBeDefined();
      expect(paymentResult.amount).toBe(10450);
      expect(paymentResult.status).toBe('SUCCESS');
      expect(paymentResult.allocationSummary).toBeDefined();

      // Check updated balance
      expect(paymentResult.newOutstandingPrincipal).toBeLessThan(30000);
    });

    it('should verify the 1st installment schedule item status is marked as PAID in database', async () => {
      const loanDetails = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, loanAId, tenantA);
      
      const installment1 = loanDetails.repaymentSchedule.find((s: any) => s.emiNumber === 1);
      expect(installment1).toBeDefined();
      expect(installment1?.status).toBe('PAID');
      expect(installment1?.paidAt).toBeDefined();

      // Overdue should now be cleared
      expect(loanDetails.overdueAmount).toBe(0);
      expect(loanDetails.dpd).toBe(0);
    });
  });

  // 4. Payment History Ledger
  describe('4. Payment History Ledger', () => {
    it('should return the recorded payment transaction in borrower payment history', async () => {
      const payments = await borrowerService.getBorrowerPayments(borrowerAUserId, loanAId, tenantA);
      expect(payments).toBeDefined();
      expect(payments.length).toBeGreaterThanOrEqual(1);

      const payment = payments[0];
      expect(payment.amount).toBe(10450);
      expect(payment.status).toBe('SUCCESS');
      expect(payment.method).toBe('UPI');
      expect(payment.allocations).toBeDefined();
      expect(payment.allocations.length).toBeGreaterThanOrEqual(1);
    });

    it('should forbid Borrower B from viewing Borrower A payment ledger', async () => {
      // Borrower B querying loanAId
      const payments = await borrowerService.getBorrowerPayments(borrowerBUserId, loanAId, tenantB);
      // Should be empty because loanAId does not belong to Borrower B
      expect(payments.length).toBe(0);
    });
  });
});
