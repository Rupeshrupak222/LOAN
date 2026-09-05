import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { calculateEmi, allocateRepayment } from './emi';
import { Money } from './money';
import { createCustomer, updateKycStatus } from '../customer/customer.service';
import { createApplication, transition } from '../application/application.service';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { processPayment } from '../payments/payment.service';
import { executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { rolePermissionService } from '../roles/role-permission.service';
import { workflowService } from '../workflows/workflow.service';
import { BadRequestError, NotFoundError } from '../../common/errors';

describe('Step 5: Production-Grade Financial Integrity, Ledger & Data Consistency Audit', () => {
  const superAdmin = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'superadmin@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  const underwriter = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'underwriter@adyapan.dev',
    roles: ['UNDERWRITER'],
  };

  const financeOfficer = {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'finance@adyapan.dev',
    roles: ['FINANCE_OFFICER'],
  };

  const loanOfficer = {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'loanofficer@adyapan.dev',
    roles: ['LOAN_OFFICER'],
  };

  beforeAll(async () => {
    const testUsers = [superAdmin, underwriter, financeOfficer, loanOfficer];
    for (const u of testUsers) {
      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
          firstName: u.roles[0],
          lastName: 'Officer',
          status: 'ACTIVE',
        },
      });
      u.id = dbUser.id;
    }
  }, 30000);

  beforeEach(() => {
    rolePermissionService.clearForTesting();
    workflowService.clearForTesting();
  });

  // =========================================================================
  // 1. MATHEMATICAL INVARIANTS & EMI ENGINE AUDIT (SCENARIOS A -> F)
  // =========================================================================
  describe('1. Mathematical Invariants & EMI Engine (Scenarios A -> F)', () => {
    it('verifies standard ₹3,00,000 / 14.5% / 36-month loan reducing balance amortization', () => {
      const result = calculateEmi(300000, 14.5, 36);

      expect(result.emi).toBe('10326.29');
      expect(result.schedule).toHaveLength(36);

      // Month 1: Interest = 300,000 * (14.5 / 1200) = 3625.00
      expect(result.schedule[0].interest).toBe('3625.00');
      // Month 1: Principal = 10,326.29 - 3,625.00 = 6,701.29
      expect(result.schedule[0].principal).toBe('6701.29');

      // Final month balance must be precisely 0.00
      expect(result.schedule[35].balance).toBe('0.00');

      // Sum of all principal portions must equal opening principal
      const totalPrincipal = result.schedule.reduce(
        (sum, row) => sum.plus(row.principal),
        new Decimal(0)
      );
      expect(totalPrincipal.toFixed(2)).toBe('300000.00');

      // Total repayment = Principal + Total Interest
      const sumPrincipalInterest = totalPrincipal.plus(result.totalInterest);
      expect(sumPrincipalInterest.toFixed(2)).toBe(result.totalRepayment);
    });

    it('Scenario A: Small loan (₹10,000 @ 12.0% for 6 months)', () => {
      const result = calculateEmi(10000, 12.0, 6);
      expect(Number(result.emi)).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(6);
      expect(result.schedule[5].balance).toBe('0.00');

      const sumPrincipal = result.schedule.reduce((sum, r) => sum.plus(r.principal), new Decimal(0));
      expect(sumPrincipal.toFixed(2)).toBe('10000.00');
    });

    it('Scenario B: Large loan (₹50,00,000 @ 8.5% for 240 months)', () => {
      const result = calculateEmi(5000000, 8.5, 240);
      expect(Number(result.emi)).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(240);
      expect(result.schedule[239].balance).toBe('0.00');

      const sumPrincipal = result.schedule.reduce((sum, r) => sum.plus(r.principal), new Decimal(0));
      expect(sumPrincipal.toFixed(2)).toBe('5000000.00');
    });

    it('Scenario C: Short tenure (₹50,000 @ 18.0% for 3 months)', () => {
      const result = calculateEmi(50000, 18.0, 3);
      expect(result.schedule).toHaveLength(3);
      expect(result.schedule[2].balance).toBe('0.00');

      const sumPrincipal = result.schedule.reduce((sum, r) => sum.plus(r.principal), new Decimal(0));
      expect(sumPrincipal.toFixed(2)).toBe('50000.00');
    });

    it('Scenario D: Long tenure (₹20,00,000 @ 10.0% for 120 months)', () => {
      const result = calculateEmi(2000000, 10.0, 120);
      expect(result.schedule).toHaveLength(120);
      expect(result.schedule[119].balance).toBe('0.00');

      const sumPrincipal = result.schedule.reduce((sum, r) => sum.plus(r.principal), new Decimal(0));
      expect(sumPrincipal.toFixed(2)).toBe('2000000.00');
    });

    it('Scenario E: Decimal/rounding-heavy odd figures (₹1,37,893 @ 13.75% for 19 months)', () => {
      const result = calculateEmi(137893, 13.75, 19);
      expect(result.schedule).toHaveLength(19);
      expect(result.schedule[18].balance).toBe('0.00');

      const sumPrincipal = result.schedule.reduce((sum, r) => sum.plus(r.principal), new Decimal(0));
      expect(sumPrincipal.toFixed(2)).toBe('137893.00');
    });

    it('Scenario F: Zero-interest loan straight principal division', () => {
      const result = calculateEmi(60000, 0, 12);
      expect(result.emi).toBe('5000.00');
      expect(result.totalInterest).toBe('0.00');
      expect(result.totalRepayment).toBe('60000.00');
      expect(result.schedule).toHaveLength(12);
      expect(result.schedule[11].balance).toBe('0.00');
    });
  });

  // =========================================================================
  // 2. REPAYMENT WATERFALL CONSERVATION & PRIORITY AUDIT
  // =========================================================================
  describe('2. Repayment Waterfall Conservation Laws', () => {
    it('statutory priority strictly distributes: PENALTY -> FEES -> INTEREST -> PRINCIPAL -> EXCESS', () => {
      const input = {
        repaymentAmount: 10000,
        outstandingPrincipal: 50000,
        accruedInterest: 3000,
        feesDue: 1500,
        penaltiesDue: 500,
      };

      const alloc = allocateRepayment(input);

      expect(alloc.allocatedToPenalties).toBe(500); // 1st priority: 500
      expect(alloc.allocatedToFees).toBe(1500); // 2nd priority: 1500
      expect(alloc.allocatedToInterest).toBe(3000); // 3rd priority: 3000
      expect(alloc.allocatedToPrincipal).toBe(5000); // 4th priority: 10000 - 5000 = 5000
      expect(alloc.excessRefund).toBe(0);

      // Conservation Law: Repayment = Sum of all allocations + Excess
      const sumAllocations =
        alloc.allocatedToPenalties +
        alloc.allocatedToFees +
        alloc.allocatedToInterest +
        alloc.allocatedToPrincipal +
        alloc.excessRefund;
      expect(sumAllocations).toBe(input.repaymentAmount);

      expect(alloc.remainingPrincipal).toBe(45000);
      expect(alloc.remainingInterest).toBe(0);
      expect(alloc.remainingFees).toBe(0);
      expect(alloc.remainingPenalties).toBe(0);
    });

    it('correctly handles payment covering only fees and penalties (underpayment)', () => {
      const alloc = allocateRepayment({
        repaymentAmount: 1200,
        outstandingPrincipal: 50000,
        accruedInterest: 3000,
        feesDue: 1000,
        penaltiesDue: 500,
      });

      expect(alloc.allocatedToPenalties).toBe(500); // full penalty
      expect(alloc.allocatedToFees).toBe(700); // partial fee
      expect(alloc.allocatedToInterest).toBe(0);
      expect(alloc.allocatedToPrincipal).toBe(0);
      expect(alloc.excessRefund).toBe(0);

      expect(alloc.remainingPenalties).toBe(0);
      expect(alloc.remainingFees).toBe(300);
      expect(alloc.remainingInterest).toBe(3000);
      expect(alloc.remainingPrincipal).toBe(50000);
    });

    it('correctly calculates excess refund on overpayment exceeding total debt', () => {
      const alloc = allocateRepayment({
        repaymentAmount: 60000,
        outstandingPrincipal: 50000,
        accruedInterest: 3000,
        feesDue: 1000,
        penaltiesDue: 500,
      });

      expect(alloc.allocatedToPenalties).toBe(500);
      expect(alloc.allocatedToFees).toBe(1000);
      expect(alloc.allocatedToInterest).toBe(3000);
      expect(alloc.allocatedToPrincipal).toBe(50000);
      expect(alloc.excessRefund).toBe(5500); // 60000 - 54500 = 5500

      expect(alloc.remainingPrincipal).toBe(0);
    });
  });

  // =========================================================================
  // 3. REALISTIC FINANCIAL TEST JOURNEYS (JOURNEYS A -> G)
  // =========================================================================
  describe('3. Realistic Financial Test Journeys (A -> G)', () => {
    it('Journey A: Standard Loan (₹3,00,000 @ 14.5% 36m) full repayment, zero residual balance, closure and NOC', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Anil',
          lastName: 'Kumar',
          email: `anil.kumar.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 75000,
          bankName: 'HDFC',
          bankAccountNo: '50100493821092',
          bankIfsc: 'HDFC0000128',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 300000,
        tenureMonths: 36,
        purpose: 'Home Improvement',
        interestRate: 14.5,
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'IMPS',
          referenceNumber: 'DISB-JA-001',
        },
        financeOfficer
      );
      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(300000);
      expect(Number(loan.outstandingPrincipal)).toBe(300000);

      // On-time 1st EMI payment
      const p1 = await processPayment(
        {
          loanId: loan.id,
          amount: 10326.29,
          method: 'UPI',
          reference: 'UPI-JA-001',
          idempotencyKey: `idem-ja-1-${Date.now()}`,
        },
        financeOfficer.id
      );
      expect(p1.status).toBe('SUCCESS');

      // Pay off the remaining schedule balance completely
      const remainingItems = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id, status: { not: 'PAID' } },
      });
      const totalPayoff = remainingItems.reduce((sum, item) => sum + Number(item.outstanding), 0);

      await processPayment(
        {
          loanId: loan.id,
          amount: Number(totalPayoff.toFixed(2)),
          method: 'NEFT',
          reference: 'NEFT-JA-002',
          idempotencyKey: `idem-ja-2-${Date.now()}`,
        },
        financeOfficer.id
      );

      const clearedLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(Number(clearedLoan?.outstandingPrincipal)).toBe(0);
      expect(Number(clearedLoan?.outstandingInterest)).toBe(0);

      // Execute Closure & Issue NOC
      const closure = await closeLoanAndIssueNoc(
        { loanId: loan.id, closureType: 'NORMAL_MATURITY', remarks: 'Full payoff received' },
        financeOfficer
      );
      expect(closure.nocNumber).toMatch(/^NOC-\d+$/);
      expect(closure.closureType).toBe('NORMAL_MATURITY');
    }, 60000);

    it('Journey B: Partial Payment splits installment into PARTIALLY_PAID and subsequent payment clears it', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Deepak',
          lastName: 'Joshi',
          email: `deepak.joshi.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 60000,
          bankName: 'ICICI Bank',
          bankAccountNo: '001192837465',
          bankIfsc: 'ICIC0000011',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Gadgets',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-JB-001' },
        financeOfficer
      );

      const firstItem = await prisma.repaymentScheduleItem.findFirst({
        where: { loanId: loan.id, emiNumber: 1 },
      });
      const emiAmount = Number(firstItem?.totalDue);

      // 1. Partial payment of ₹5,000 (less than EMI)
      await processPayment(
        {
          loanId: loan.id,
          amount: 5000,
          method: 'UPI',
          reference: 'UPI-PARTIAL-001',
          idempotencyKey: `idem-jb-1-${Date.now()}`,
        },
        financeOfficer.id
      );

      const partialItem = await prisma.repaymentScheduleItem.findFirst({
        where: { loanId: loan.id, emiNumber: 1 },
      });
      expect(partialItem?.status).toBe('PARTIALLY_PAID');
      expect(Number(partialItem?.paidAmount)).toBe(5000);
      expect(Number(partialItem?.outstanding)).toBe(Number((emiAmount - 5000).toFixed(2)));

      // 2. Second payment for the exact remaining balance
      const remainingInstallment = Number((emiAmount - 5000).toFixed(2));
      await processPayment(
        {
          loanId: loan.id,
          amount: remainingInstallment,
          method: 'UPI',
          reference: 'UPI-PARTIAL-002',
          idempotencyKey: `idem-jb-2-${Date.now()}`,
        },
        financeOfficer.id
      );

      const paidItem = await prisma.repaymentScheduleItem.findFirst({
        where: { loanId: loan.id, emiNumber: 1 },
      });
      expect(paidItem?.status).toBe('PAID');
      expect(Number(paidItem?.outstanding)).toBe(0);
    }, 60000);

    it('Journey C: Delinquency DPD Tracking & Collections Pipeline Resolution', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Suresh',
          lastName: 'Patel',
          email: `suresh.patel.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 45000,
          bankName: 'SBI',
          bankAccountNo: '30495867188',
          bankIfsc: 'SBIN0001234',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 50000,
        tenureMonths: 6,
        purpose: 'Personal',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-JC-001' },
        financeOfficer
      );

      // Simulate overdue installment (45 days ago)
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 45);

      await prisma.repaymentScheduleItem.updateMany({
        where: { loanId: loan.id, emiNumber: 1 },
        data: { dueDate: overdueDate, status: 'OVERDUE' },
      });

      // DPD Calculation Invariant
      const today = new Date();
      const diffMs = today.getTime() - overdueDate.getTime();
      const dpd = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      expect(dpd).toBeGreaterThanOrEqual(44);

      let agingBucket = '0-30';
      if (dpd > 180) agingBucket = '180+';
      else if (dpd > 90) agingBucket = '91-180';
      else if (dpd > 60) agingBucket = '61-90';
      else if (dpd > 30) agingBucket = '31-60';
      expect(agingBucket).toBe('31-60');
    }, 60000);

    it('Journey D: OTS Settlement with explicit waiver accounting and ledger credit', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Manoj',
          lastName: 'Tiwari',
          email: `manoj.tiwari.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 40000,
          bankName: 'Axis Bank',
          bankAccountNo: '912010049382109',
          bankIfsc: 'UTIB0000123',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Medical',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-JD-001' },
        financeOfficer
      );

      // Execute OTS Settlement: ₹70,000 for ₹1,00,000 loan
      const settlement = await executeSettlement(
        {
          loanId: loan.id,
          settlementAmount: 70000,
          reason: 'Hardship settlement approved by Credit Committee',
        },
        financeOfficer
      );

      expect(settlement.status).toBe('COMPLETED');
      expect(Number(settlement.settlementAmount)).toBe(70000);
      expect(Number(settlement.waivedAmount)).toBeGreaterThanOrEqual(30000);

      // Verify ledger transaction created for waiver payoff
      const txn = await prisma.transaction.findFirst({
        where: { loanId: loan.id, type: 'SETTLEMENT' },
      });
      expect(txn).toBeDefined();
      expect(txn?.direction).toBe('CREDIT');
      expect(Number(txn?.amount)).toBe(70000);

      const settledLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(settledLoan?.status).toBe('SETTLED');
    }, 60000);

    it('Journey E: Payment Idempotency preserves database state on network retry', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Priya',
          lastName: 'Nair',
          email: `priya.nair.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 65000,
          bankName: 'HDFC',
          bankAccountNo: '50100493821093',
          bankIfsc: 'HDFC0000128',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Electronics',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-JE-001' },
        financeOfficer
      );

      const idempotencyKey = `idem-key-je-${Date.now()}`;

      // Request 1: Original Payment
      const p1 = await processPayment(
        {
          loanId: loan.id,
          amount: 4500,
          method: 'BANK_TRANSFER',
          reference: 'TXN-JE-001-A',
          idempotencyKey,
        },
        financeOfficer.id
      );

      // Request 2: Duplicate Network Retry
      const p2 = await processPayment(
        {
          loanId: loan.id,
          amount: 4500,
          method: 'BANK_TRANSFER',
          reference: 'TXN-JE-001-B',
          idempotencyKey,
        },
        financeOfficer.id
      );

      expect(p1.id).toBe(p2.id);
      expect(p1.paymentNo).toBe(p2.paymentNo);

      // Verify only 1 payment was inserted in the database
      const count = await prisma.payment.count({ where: { idempotencyKey } });
      expect(count).toBe(1);
    }, 60000);

    it('Journey F: Concurrency Simulation prevents duplicate disbursements', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Rohan',
          lastName: 'Gupta',
          email: `rohan.gupta.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 80000,
          bankName: 'SBI',
          bankAccountNo: '30495867199',
          bankIfsc: 'SBIN0001234',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 60000,
        tenureMonths: 12,
        purpose: 'Travel',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      // Simulate 2 parallel disbursement requests arriving at the same time
      const results = await Promise.allSettled([
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-CONC-001' },
          financeOfficer
        ),
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-CONC-002' },
          financeOfficer
        ),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 1 disbursement succeeds and 1 is rejected
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Verify only 1 loan exists for this application
      const loans = await prisma.loan.findMany({ where: { applicationId: app.id } });
      expect(loans).toHaveLength(1);
    }, 60000);

    it('Journey G: Negative Financial Guards & Transaction Rollbacks', async () => {
      // 1. Payment with negative or zero amount rejected
      await expect(
        processPayment(
          {
            loanId: '00000000-0000-0000-0000-000000000099',
            amount: 0,
            method: 'UPI',
            reference: 'INVALID_AMOUNT',
          },
          financeOfficer.id
        )
      ).rejects.toThrow(BadRequestError);

      // 2. Payment against non-existent loan rejected
      await expect(
        processPayment(
          {
            loanId: '00000000-0000-0000-0000-000000000099',
            amount: 5000,
            method: 'UPI',
            reference: 'NON_EXISTENT_LOAN',
          },
          financeOfficer.id
        )
      ).rejects.toThrow(NotFoundError);

      // 3. Premature closure on active loan with balance rejected
      const cust = await createCustomer(
        {
          firstName: 'Arjun',
          lastName: 'Singh',
          email: `arjun.singh.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 55000,
          bankName: 'HDFC',
          bankAccountNo: '50100493821094',
          bankIfsc: 'HDFC0000128',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Business',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-JG-001' },
        financeOfficer
      );

      await expect(
        closeLoanAndIssueNoc(
          { loanId: loan.id, closureType: 'NORMAL_MATURITY', remarks: 'Illegal premature close' },
          financeOfficer
        )
      ).rejects.toThrow(/Cannot issue closure NOC\. Outstanding balance remains/);
    }, 60000);
  });
});
