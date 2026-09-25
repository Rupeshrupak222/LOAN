import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { loanServicingService } from './loan-servicing.service';
import { paymentAllocationService } from '../payments/payment-allocation.service';
import { confirmPayment, initiatePayment, reversePayment } from '../payments/payment.service';
import { generalLedgerService } from '../finance/gl.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { Money } from '../finance/money';

describe('Phase 9F: Real Loan Account + Post-Disbursement Servicing Suite', { timeout: 30000 }, () => {
  const testTenant = 'tenant-adyapan-default';
  const otherTenant = 'cl_tenant_apex_001';

  const financeOfficer = {
    id: 'user-finance-servicing-01',
    email: 'servicing.officer@adyapan.com',
    roles: ['FINANCE_OFFICER'],
    tenantId: testTenant,
  };

  const adminOfficer = {
    id: 'user-admin-servicing-01',
    email: 'servicing.admin@adyapan.com',
    roles: ['ADMIN', 'FINANCE_CONTROLLER'],
    tenantId: testTenant,
  };

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: financeOfficer.email },
      update: {},
      create: {
        id: financeOfficer.id,
        email: financeOfficer.email,
        passwordHash: 'hash123',
        firstName: 'Finance',
        lastName: 'Officer',
        tenantId: testTenant,
      },
    });

    await prisma.user.upsert({
      where: { email: adminOfficer.email },
      update: {},
      create: {
        id: adminOfficer.id,
        email: adminOfficer.email,
        passwordHash: 'hash123',
        firstName: 'Admin',
        lastName: 'Controller',
        tenantId: testTenant,
      },
    });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('1. Authoritative Loan Account & Servicing Dossier', () => {
    it('should retrieve authoritative loan details with decimal-safe live balances and schedule', async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-DOSSIER-${uniqueSuffix}`,
          firstName: 'Ramesh',
          lastName: 'Sharma',
          email: `ramesh.${uniqueSuffix}@example.com`,
          mobile: `98711${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-DOSSIER-${uniqueSuffix}`,
          name: 'Personal Loan Express',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '12.00',
          minTenureMonths: 6,
          maxTenureMonths: 36,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9F-DOSSIER-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '60000',
          tenureMonths: 6,
          status: 'DISBURSED',
          tenantId: testTenant,
        },
      });

      const principal = 60000;
      const interestRate = 12.0;
      const emiAmount = 10353.0; // Standard 60k @ 12% 6mo EMI

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-${uniqueSuffix}`,
          applicationId: app.id,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(principal),
          interestRate: Money.toDb(interestRate),
          tenureMonths: 6,
          emiAmount: Money.toDb(emiAmount),
          outstandingPrincipal: Money.toDb(principal),
          outstandingInterest: Money.toDb(2118),
          outstandingFees: Money.toDb(500),
          disbursementDate: new Date(),
          status: 'ACTIVE',
        },
      });

      // Create 6 monthly schedule items
      const today = new Date();
      for (let i = 1; i <= 6; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);

        await prisma.repaymentScheduleItem.create({
          data: {
            loanId: loan.id,
            emiNumber: i,
            dueDate,
            principal: Money.toDb(9750),
            interest: Money.toDb(603),
            fees: i === 1 ? Money.toDb(500) : Money.toDb(0),
            totalDue: i === 1 ? Money.toDb(10853) : Money.toDb(10353),
            paidAmount: Money.toDb(0),
            outstanding: i === 1 ? Money.toDb(10853) : Money.toDb(10353),
            status: 'UPCOMING',
          },
        });
      }

      const dossier = await loanServicingService.getLoanServicingDetails(loan.id, financeOfficer);

      expect(dossier).toBeDefined();
      expect(dossier.loanNo).toBe(loan.loanNo);
      expect(dossier.customerName).toBe('Ramesh Sharma');
      expect(dossier.principal).toBe(60000);
      expect(dossier.outstandingPrincipal).toBe(60000);
      expect(dossier.outstandingInterest).toBe(2118);
      expect(dossier.outstandingFees).toBe(500);
      expect(dossier.totalOutstanding).toBe(62618);
      expect(dossier.schedule.length).toBe(6);
      expect(dossier.schedule[0].emiNumber).toBe(1);
      expect(dossier.dpd).toBe(0);
      expect(dossier.isOverdue).toBe(false);
    });
  });

  describe('2. Decimal-Safe Waterfall Payment Allocation', () => {
    it('should allocate payment according to statutory hierarchy: Fees -> Penalty -> Interest -> Principal', async () => {
      const uniqueSuffix = (Date.now() + 1).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-ALLOC-${uniqueSuffix}`,
          firstName: 'Pooja',
          lastName: 'Hegde',
          email: `pooja.${uniqueSuffix}@example.com`,
          mobile: `98712${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-ALLOC-${uniqueSuffix}`,
          name: 'Consumer Term Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '200000',
          interestRate: '15.00',
          minTenureMonths: 3,
          maxTenureMonths: 12,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-AL-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(30000),
          interestRate: Money.toDb(15.0),
          tenureMonths: 3,
          emiAmount: Money.toDb(10250),
          outstandingPrincipal: Money.toDb(30000),
          outstandingInterest: Money.toDb(750),
          outstandingFees: Money.toDb(500),
          status: 'ACTIVE',
        },
      });

      // Create 1 schedule item with fee + penalty + interest + principal
      const dueDate = new Date();
      const scheduleItem = await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate,
          principal: Money.toDb(9500),
          interest: Money.toDb(500),
          fees: Money.toDb(250),
          penaltyAmount: Money.toDb(100),
          totalDue: Money.toDb(10250),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(10350), // 10250 + 100 penalty
          status: 'DUE',
        },
      });

      const payment = await prisma.payment.create({
        data: {
          paymentNo: `PAY-9F-AL-${uniqueSuffix}`,
          loanId: loan.id,
          customerId: customer.id,
          amount: Money.toDb(10350),
          status: 'SUCCESS',
          method: 'UPI',
          reference: `UPI-REF-${uniqueSuffix}`,
          tenantId: testTenant,
        },
      });

      const allocation = await paymentAllocationService.allocatePayment({
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        loanId: loan.id,
        amount: 10350,
      });

      expect(allocation.allocatedFees).toBe(250);
      expect(allocation.allocatedPenalties).toBe(100);
      expect(allocation.allocatedInterest).toBe(500);
      expect(allocation.allocatedPrincipal).toBe(9500);
      expect(allocation.totalAllocated).toBe(10350);

      // Verify schedule item in DB is marked PAID
      const updatedItem = await prisma.repaymentScheduleItem.findUnique({
        where: { id: scheduleItem.id },
      });
      expect(updatedItem?.status).toBe('PAID');
      expect(Number(updatedItem?.outstanding)).toBe(0);
      expect(Number(updatedItem?.paidAmount)).toBe(10350);
    });
  });

  describe('3. Partial Payment & Overpayment Handling', () => {
    it('should support partial payment without losing unpaid balance, setting status to PARTIALLY_PAID', async () => {
      const uniqueSuffix = (Date.now() + 2).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-PART-${uniqueSuffix}`,
          firstName: 'Arun',
          lastName: 'Verma',
          email: `arun.${uniqueSuffix}@example.com`,
          mobile: `98713${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-PART-${uniqueSuffix}`,
          name: 'Micro Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '50000',
          interestRate: '18.00',
          minTenureMonths: 3,
          maxTenureMonths: 6,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-PART-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(10000),
          interestRate: Money.toDb(18.0),
          tenureMonths: 3,
          emiAmount: Money.toDb(3433),
          outstandingPrincipal: Money.toDb(10000),
          outstandingInterest: Money.toDb(300),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      const scheduleItem = await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate: new Date(),
          principal: Money.toDb(3300),
          interest: Money.toDb(133),
          fees: Money.toDb(0),
          penaltyAmount: Money.toDb(0),
          totalDue: Money.toDb(3433),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(3433),
          status: 'DUE',
        },
      });

      // Partial payment of ₹2,000 against ₹3,433
      const payment = await prisma.payment.create({
        data: {
          paymentNo: `PAY-9F-PART-${uniqueSuffix}`,
          loanId: loan.id,
          customerId: customer.id,
          amount: Money.toDb(2000),
          status: 'SUCCESS',
          method: 'IMPS',
          reference: `IMPS-REF-${uniqueSuffix}`,
          tenantId: testTenant,
        },
      });

      const allocation = await paymentAllocationService.allocatePayment({
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        loanId: loan.id,
        amount: 2000,
      });

      expect(allocation.allocatedInterest).toBe(133);
      expect(allocation.allocatedPrincipal).toBe(1867);
      expect(allocation.totalAllocated).toBe(2000);

      const updatedItem = await prisma.repaymentScheduleItem.findUnique({
        where: { id: scheduleItem.id },
      });
      expect(updatedItem?.status).toBe('PARTIALLY_PAID');
      expect(Number(updatedItem?.paidAmount)).toBe(2000);
      expect(Number(updatedItem?.outstanding)).toBe(1433);
    });

    it('should handle overpayment by allocating excess to unallocated credit bucket', async () => {
      const uniqueSuffix = (Date.now() + 3).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-OVER-${uniqueSuffix}`,
          firstName: 'Sneha',
          lastName: 'Reddy',
          email: `sneha.${uniqueSuffix}@example.com`,
          mobile: `98714${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-OVER-${uniqueSuffix}`,
          name: 'Flexi Personal Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '50000',
          interestRate: '12.00',
          minTenureMonths: 1,
          maxTenureMonths: 3,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-OVER-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(5000),
          interestRate: Money.toDb(12.0),
          tenureMonths: 1,
          emiAmount: Money.toDb(5050),
          outstandingPrincipal: Money.toDb(5000),
          outstandingInterest: Money.toDb(50),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate: new Date(),
          principal: Money.toDb(5000),
          interest: Money.toDb(50),
          fees: Money.toDb(0),
          totalDue: Money.toDb(5050),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(5050),
          status: 'DUE',
        },
      });

      // Pay ₹6,000 against ₹5,050 total due
      const payment = await prisma.payment.create({
        data: {
          paymentNo: `PAY-9F-OVER-${uniqueSuffix}`,
          loanId: loan.id,
          customerId: customer.id,
          amount: Money.toDb(6000),
          status: 'SUCCESS',
          method: 'UPI',
          reference: `UPI-OVER-${uniqueSuffix}`,
          tenantId: testTenant,
        },
      });

      const allocation = await paymentAllocationService.allocatePayment({
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        loanId: loan.id,
        amount: 6000,
      });

      expect(allocation.allocatedInterest).toBe(50);
      expect(allocation.allocatedPrincipal).toBe(5000);
      expect(allocation.allocatedExcess).toBe(950);
      expect(allocation.isLoanClosed).toBe(true);
    });
  });

  describe('4. Idempotent Payment Posting & Concurrency Safety', () => {
    it('should return identical response without double-allocating when duplicate idempotency key is submitted', async () => {
      const uniqueSuffix = (Date.now() + 4).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-IDEMP-${uniqueSuffix}`,
          firstName: 'Karan',
          lastName: 'Johar',
          email: `karan.${uniqueSuffix}@example.com`,
          mobile: `98715${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-IDEMP-${uniqueSuffix}`,
          name: 'Instant Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '50000',
          interestRate: '12.00',
          minTenureMonths: 1,
          maxTenureMonths: 3,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-IDEMP-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(10000),
          interestRate: Money.toDb(12.0),
          tenureMonths: 1,
          emiAmount: Money.toDb(10100),
          outstandingPrincipal: Money.toDb(10000),
          outstandingInterest: Money.toDb(100),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate: new Date(),
          principal: Money.toDb(10000),
          interest: Money.toDb(100),
          fees: Money.toDb(0),
          totalDue: Money.toDb(10100),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(10100),
          status: 'DUE',
        },
      });

      const idempotencyKey = `idemp-key-${uniqueSuffix}`;

      // 1st Initiation
      const init1 = await initiatePayment(
        {
          loanId: loan.id,
          amount: 5000,
          method: 'UPI',
          idempotencyKey,
        },
        financeOfficer
      );

      // 2nd Initiation with identical idempotencyKey
      const init2 = await initiatePayment(
        {
          loanId: loan.id,
          amount: 5000,
          method: 'UPI',
          idempotencyKey,
        },
        financeOfficer
      );

      expect(init2.paymentId).toBe(init1.paymentId);
      expect(init2.paymentNo).toBe(init1.paymentNo);

      // Confirm payment once
      const confirm1 = await confirmPayment(
        init1.paymentId,
        { utrNumber: `SIM-UTR-${uniqueSuffix}` },
        financeOfficer
      );

      expect(confirm1.payment.status).toBe('SUCCESS');

      // Attempt duplicate confirmation
      const confirm2 = await confirmPayment(
        init1.paymentId,
        { utrNumber: `SIM-UTR-${uniqueSuffix}` },
        financeOfficer
      );

      expect(confirm2.message).toContain('already confirmed');
    });
  });

  describe('5. Authoritative DPD & Due Date Evaluation', () => {
    it('should derive accurate DPD based on server time and oldest overdue installment due date', async () => {
      const uniqueSuffix = (Date.now() + 5).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-DPD-${uniqueSuffix}`,
          firstName: 'Mohan',
          lastName: 'Lal',
          email: `mohan.${uniqueSuffix}@example.com`,
          mobile: `98716${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-DPD-${uniqueSuffix}`,
          name: 'Salary Advance Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '100000',
          interestRate: '14.00',
          minTenureMonths: 1,
          maxTenureMonths: 6,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-DPD-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(20000),
          interestRate: Money.toDb(14.0),
          tenureMonths: 2,
          emiAmount: Money.toDb(10116),
          outstandingPrincipal: Money.toDb(20000),
          outstandingInterest: Money.toDb(232),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      // Installment 1 was due 10 days ago and remains unpaid
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate: tenDaysAgo,
          principal: Money.toDb(9900),
          interest: Money.toDb(216),
          fees: Money.toDb(0),
          totalDue: Money.toDb(10116),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(10116),
          status: 'OVERDUE',
        },
      });

      const dpdResult = await loanServicingService.evaluateLoanDpd(loan.id);

      expect(dpdResult.dpd).toBeGreaterThanOrEqual(10);
      expect(dpdResult.status).toBe('OVERDUE');
      expect(dpdResult.overdueAmount).toBe(10116);
    });
  });

  describe('6. Payment Reversal Handling & Compensating Accounting', () => {
    it('should reverse payment without deleting history, restore schedule balances and post GL reversal', async () => {
      const uniqueSuffix = (Date.now() + 6).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-REV-${uniqueSuffix}`,
          firstName: 'Deepak',
          lastName: 'Gupta',
          email: `deepak.${uniqueSuffix}@example.com`,
          mobile: `98717${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-REV-${uniqueSuffix}`,
          name: 'Short Term Credit',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '100000',
          interestRate: '12.00',
          minTenureMonths: 1,
          maxTenureMonths: 3,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-REV-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(10000),
          interestRate: Money.toDb(12.0),
          tenureMonths: 1,
          emiAmount: Money.toDb(10100),
          outstandingPrincipal: Money.toDb(10000),
          outstandingInterest: Money.toDb(100),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      const scheduleItem = await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: 1,
          dueDate: new Date(),
          principal: Money.toDb(10000),
          interest: Money.toDb(100),
          fees: Money.toDb(0),
          totalDue: Money.toDb(10100),
          paidAmount: Money.toDb(0),
          outstanding: Money.toDb(10100),
          status: 'DUE',
        },
      });

      // Post Payment
      const payment = await prisma.payment.create({
        data: {
          paymentNo: `PAY-9F-REV-${uniqueSuffix}`,
          loanId: loan.id,
          customerId: customer.id,
          amount: Money.toDb(10100),
          status: 'SUCCESS',
          method: 'CHEQUE',
          reference: `CHQ-${uniqueSuffix}`,
          tenantId: testTenant,
        },
      });

      await paymentAllocationService.allocatePayment({
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        loanId: loan.id,
        amount: 10100,
      });

      // Verify payment succeeded
      const checkPaidItem = await prisma.repaymentScheduleItem.findUnique({
        where: { id: scheduleItem.id },
      });
      expect(checkPaidItem?.status).toBe('PAID');

      // Now execute Payment Reversal (e.g. Cheque Bounced)
      const reversal = await reversePayment(
        payment.id,
        { reason: 'Cheque dishonored / Insufficient funds' },
        adminOfficer
      );

      expect(reversal).toBeDefined();
      expect(reversal.paymentId).toBe(payment.id);
      expect(reversal.reversalAmount).toBe(10100);

      // Verify payment status changed to REVERSED (not deleted)
      const reversedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      expect(reversedPayment?.status).toBe('REVERSED');

      // Verify schedule item restored
      const restoredItem = await prisma.repaymentScheduleItem.findUnique({
        where: { id: scheduleItem.id },
      });
      expect(restoredItem?.status).toBe('OVERDUE');
      expect(Number(restoredItem?.outstanding)).toBe(10100);
      expect(Number(restoredItem?.paidAmount)).toBe(0);

      // Verify loan outstanding principal restored
      const restoredLoan = await prisma.loan.findUnique({
        where: { id: loan.id },
      });
      expect(Number(restoredLoan?.outstandingPrincipal)).toBe(10000);
      expect(Number(restoredLoan?.outstandingInterest)).toBe(100);
      expect(restoredLoan?.status).toBe('ACTIVE');
    });
  });

  describe('7. Gated Loan Closure', () => {
    it('should BLOCK closure if outstanding obligations remain, and SUCCEED when fully settled', async () => {
      const uniqueSuffix = (Date.now() + 7).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-CLOSE-${uniqueSuffix}`,
          firstName: 'Gita',
          lastName: 'Kapoor',
          email: `gita.${uniqueSuffix}@example.com`,
          mobile: `98718${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-CLOSE-${uniqueSuffix}`,
          name: 'Retail Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '50000',
          interestRate: '12.00',
          minTenureMonths: 1,
          maxTenureMonths: 3,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-CLOSE-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(5000),
          interestRate: Money.toDb(12.0),
          tenureMonths: 1,
          emiAmount: Money.toDb(5050),
          outstandingPrincipal: Money.toDb(5000),
          outstandingInterest: Money.toDb(50),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      // 1. Attempt closure while balance > 0 -> must fail
      await expect(
        loanServicingService.closeLoanAccount(
          loan.id,
          { closureType: 'NORMAL_MATURITY' },
          adminOfficer
        )
      ).rejects.toThrow(BadRequestError);

      // 2. Clear balance
      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          outstandingPrincipal: Money.toDb(0),
          outstandingInterest: Money.toDb(0),
          outstandingFees: Money.toDb(0),
        },
      });

      // 3. Attempt closure again -> must succeed
      const closeResult = await loanServicingService.closeLoanAccount(
        loan.id,
        { closureType: 'NORMAL_MATURITY', remarks: 'Customer completed all payments.' },
        adminOfficer
      );

      expect(closeResult.closure).toBeDefined();
      expect(closeResult.closure?.nocNumber).toMatch(/^NOC-/);

      const updatedLoan = await prisma.loan.findUnique({
        where: { id: loan.id },
      });
      expect(updatedLoan?.status).toBe('CLOSED');
      expect(updatedLoan?.closedAt).toBeDefined();
    });
  });

  describe('8. Tenant Isolation & Anti-IDOR Security', () => {
    it('should reject loan servicing access for actors from a different tenant', async () => {
      const uniqueSuffix = (Date.now() + 8).toString().slice(-6);

      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9F-IDOR-${uniqueSuffix}`,
          firstName: 'Sanjay',
          lastName: 'Mishra',
          email: `sanjay.${uniqueSuffix}@example.com`,
          mobile: `98719${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9F-IDOR-${uniqueSuffix}`,
          name: 'Secure Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '5000',
          maxAmount: '50000',
          interestRate: '12.00',
          minTenureMonths: 1,
          maxTenureMonths: 3,
          isActive: true,
        },
      });

      const loan = await prisma.loan.create({
        data: {
          loanNo: `LN-9F-IDOR-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          tenantId: testTenant,
          principal: Money.toDb(15000),
          interestRate: Money.toDb(12.0),
          tenureMonths: 1,
          emiAmount: Money.toDb(15150),
          outstandingPrincipal: Money.toDb(15000),
          outstandingInterest: Money.toDb(150),
          outstandingFees: Money.toDb(0),
          status: 'ACTIVE',
        },
      });

      const foreignActor = {
        id: 'user-foreign-01',
        email: 'foreign@otherbank.com',
        roles: ['FINANCE_OFFICER'],
        tenantId: otherTenant, // Cross-tenant
      };

      await expect(
        loanServicingService.getLoanServicingDetails(loan.id, foreignActor)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
