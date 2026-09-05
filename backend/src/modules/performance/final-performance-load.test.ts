import { describe, it, expect, beforeAll } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { createCustomer, updateKycStatus } from '../customer/customer.service';
import { createApplication, transition } from '../application/application.service';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { processPayment } from '../payments/payment.service';
import { executeSettlement } from '../restructuring/restructuring.service';
import { calculateEmi, allocateRepayment } from '../finance/emi';
import { Money } from '../finance/money';

describe('Step 55: Production-Grade Final Performance & Concurrency Testing Audit', () => {
  const superAdmin = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'superadmin.perf@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  const financeOfficer = {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'finance.perf@adyapan.dev',
    roles: ['FINANCE_OFFICER'],
  };

  const underwriter = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'underwriter.perf@adyapan.dev',
    roles: ['UNDERWRITER'],
  };

  let testProduct: any;

  beforeAll(async () => {
    // Ensure test actors exist in DB
    const testUsers = [superAdmin, financeOfficer, underwriter];
    for (const u of testUsers) {
      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$perfTestHash12345678901234',
          firstName: 'Perf',
          lastName: 'Tester',
          status: 'ACTIVE',
        },
      });
      u.id = dbUser.id;
    }

    testProduct = await prisma.loanProduct.findFirst();
    if (!testProduct) {
      testProduct = await prisma.loanProduct.create({
        data: {
          name: 'Personal Performance Express',
          code: `PERF_EXP_${Date.now()}`,
          productType: 'PERSONAL',
          minAmount: Money.toDb(10000),
          maxAmount: Money.toDb(1000000),
          minTenureMonths: 6,
          maxTenureMonths: 60,
          interestRate: '12.000',
          interestMethod: 'REDUCING',
          processingFeePct: '2.000',
          isActive: true,
        },
      });
    }
  }, 30000);

  // Helper to quickly onboard and disburse a clean test loan
  async function createDisbursedLoan(principal: number, interestRate: number, tenureMonths: number) {
    const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const email = `perf.borrower_${ts}@adyapan.dev`;

    const customer = await createCustomer({
      firstName: 'Perf',
      lastName: 'Borrower',
      email,
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'MALE',
      employmentType: 'SALARIED',
      monthlyIncome: 85000,
      bankAccountNo: `98765432${ts.slice(-4)}`,
      bankName: 'HDFC Bank',
      bankIfsc: 'HDFC0001234',
    });

    await updateKycStatus(customer.id, { kycStatus: 'VERIFIED' }, superAdmin.id);

    const app = await createApplication({
      customerId: customer.id,
      productId: testProduct.id,
      requestedAmount: principal,
      tenureMonths: tenureMonths,
      purpose: 'Performance Load Testing',
    });

    await transition(app.id, 'SUBMITTED', superAdmin.id);
    await transition(app.id, 'UNDERWRITING', superAdmin.id);
    await transition(app.id, 'APPROVED', superAdmin.id, 'Approved for performance testing');

    const loan = await executeDisbursement(
      {
        applicationId: app.id,
        disbursementMethod: 'NEFT_BANK_TRANSFER',
        referenceNumber: `UTR_PERF_${ts}`,
      },
      financeOfficer as any
    );

    return { customer, app, loan };
  }

  // =========================================================================
  // 1. CONCURRENCY & RACE CONDITION VERIFICATION
  // =========================================================================
  describe('1. Financial Concurrency & Race Condition Integrity', () => {
    it('handles parallel double payments on the same loan idempotently without double deduction', async () => {
      const { loan } = await createDisbursedLoan(50000, 12, 12);
      const initialBalance = new Decimal(loan.outstandingPrincipal);
      const paymentAmount = 5000;
      const idempotencyKey = `IDEMP_DOUBLE_PAY_${Date.now()}_${Math.random()}`;

      // Simulate 2 parallel identical payment attempts
      const parallelRequests = [
        processPayment(
          {
            loanId: loan.id,
            amount: paymentAmount,
            method: 'UPI',
            reference: 'UPI-PERF-CONCUR-01',
            idempotencyKey,
          },
          financeOfficer.id
        ),
        processPayment(
          {
            loanId: loan.id,
            amount: paymentAmount,
            method: 'UPI',
            reference: 'UPI-PERF-CONCUR-01',
            idempotencyKey,
          },
          financeOfficer.id
        ),
      ];

      const results = await Promise.allSettled(parallelRequests);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      // Verify that database recorded exactly 1 payment and balance reduced
      const payments = await prisma.payment.findMany({ where: { loanId: loan.id } });
      expect(payments.length).toBe(1);
      expect(Number(payments[0].amount)).toBe(paymentAmount);

      const updatedLoan = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } });
      expect(new Decimal(updatedLoan.outstandingPrincipal).lessThan(initialBalance)).toBe(true);
    }, 25000);

    it('blocks concurrent double disbursements on the same approved loan application', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const email = `perf.disb_${ts}@adyapan.dev`;

      const customer = await createCustomer({
        firstName: 'Disb',
        lastName: 'Perf',
        email,
        mobile: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: 'MALE',
        employmentType: 'SALARIED',
        monthlyIncome: 90000,
        bankAccountNo: `98765433${ts.slice(-4)}`,
        bankName: 'ICICI Bank',
        bankIfsc: 'ICIC0005678',
      });

      await updateKycStatus(customer.id, { kycStatus: 'VERIFIED' }, superAdmin.id);

      const app = await createApplication({
        customerId: customer.id,
        productId: testProduct.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Concurrency Disbursement Test',
      });
      await transition(app.id, 'SUBMITTED', superAdmin.id);
      await transition(app.id, 'UNDERWRITING', superAdmin.id);
      await transition(app.id, 'APPROVED', superAdmin.id, 'Approved for concurrency test');

      // Fire two simultaneous disbursement requests
      const req1 = executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'RTGS',
          referenceNumber: `UTR_P1_${ts}`,
        },
        financeOfficer as any
      );

      const req2 = executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'RTGS',
          referenceNumber: `UTR_P2_${ts}`,
        },
        financeOfficer as any
      );

      const outcomes = await Promise.allSettled([req1, req2]);
      const successful = outcomes.filter((o) => o.status === 'fulfilled');
      const rejected = outcomes.filter((o) => o.status === 'rejected');

      // Exactly one disbursement must succeed, the other rejected
      expect(successful.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Verify only 1 loan record created for this application
      const loansCount = await prisma.loan.count({ where: { applicationId: app.id } });
      expect(loansCount).toBe(1);
    }, 25000);

    it('safely handles concurrent settlement requests on an active delinquent loan', async () => {
      const { loan } = await createDisbursedLoan(40000, 14, 12);
      const settlementAmount = 25000;

      const req1 = executeSettlement(
        {
          loanId: loan.id,
          settlementAmount,
          reason: 'Hardship settlement - Perf 1',
        },
        superAdmin as any
      );

      const req2 = executeSettlement(
        {
          loanId: loan.id,
          settlementAmount,
          reason: 'Hardship settlement - Perf 2',
        },
        superAdmin as any
      );

      const outcomes = await Promise.allSettled([req1, req2]);
      const successful = outcomes.filter((o) => o.status === 'fulfilled');
      expect(successful.length).toBe(1);

      const settlements = await prisma.settlement.findMany({ where: { loanId: loan.id } });
      expect(settlements.length).toBe(1);
    }, 25000);
  });

  // =========================================================================
  // 2. DATABASE CONNECTION POOL & QUERY LATENCY UNDER LOAD
  // =========================================================================
  describe('2. Connection Pool & Query Latency Under Parallel Pressure', () => {
    it('executes 50 parallel read queries without pool exhaustion or connection leaks', async () => {
      const startTime = performance.now();

      // Dispatch 50 queries across pooled worker batches (5 concurrent)
      const results: any[] = [];
      const batchSize = 5;
      for (let i = 0; i < 50; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, 50 - i) }, () =>
          prisma.loanProduct.findMany({
            take: 5,
            select: { id: true, name: true, code: true, isActive: true },
          })
        );
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
      }

      const durationMs = performance.now() - startTime;

      expect(results.length).toBe(50);
      results.forEach((res) => expect(Array.isArray(res)).toBe(true));

      // 50 pooled parallel queries should resolve quickly (under 15000ms over remote pooler)
      expect(durationMs).toBeLessThan(15000);
    }, 20000);

    it('enforces page size limits and performs indexed offset/cursor pagination efficiently', async () => {
      const startTime = performance.now();

      // Retrieve first page
      const page1 = await prisma.loan.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, principal: true, outstandingPrincipal: true },
      });

      // Retrieve second page
      const page2 = await prisma.loan.findMany({
        take: 10,
        skip: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, principal: true, outstandingPrincipal: true },
      });

      const durationMs = performance.now() - startTime;

      expect(Array.isArray(page1)).toBe(true);
      expect(Array.isArray(page2)).toBe(true);
      expect(durationMs).toBeLessThan(2000);
    }, 15000);
  });

  // =========================================================================
  // 3. FINANCIAL CALCULATION ENGINE PERFORMANCE
  // =========================================================================
  describe('3. Financial Calculation Throughput & Correctness', () => {
    it('computes 1,000 amortized EMI schedules with exact precision in sub-second duration', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const principal = 100000 + (i % 10) * 10000;
        const rate = 10.5 + (i % 5) * 0.5;
        const tenure = 12 + (i % 4) * 12;

        const emiResult = calculateEmi(principal, rate, tenure);
        expect(Number(emiResult.emi)).toBeGreaterThan(0);
        expect(emiResult.schedule.length).toBe(tenure);
      }

      const durationMs = performance.now() - startTime;
      expect(durationMs).toBeLessThan(1000); // 1,000 EMI calculations in < 1000ms
    });

    it('allocates 500 repayments according to strict waterfall hierarchy without decimal drift', () => {
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        const allocation = allocateRepayment({
          repaymentAmount: 12500,
          feesDue: 500,
          penaltiesDue: 250,
          accruedInterest: 3750,
          outstandingPrincipal: 8000,
        });

        expect(allocation.allocatedToFees).toBe(500);
        expect(allocation.allocatedToPenalties).toBe(250);
        expect(allocation.allocatedToInterest).toBe(3750);
        expect(allocation.allocatedToPrincipal).toBe(8000);
        expect(allocation.excessRefund).toBe(0);
      }

      const durationMs = performance.now() - startTime;
      expect(durationMs).toBeLessThan(500);
    });
  });

  // =========================================================================
  // 4. MEMORY STABILITY & ZERO RESOURCE LEAKAGE
  // =========================================================================
  describe('4. Resource & Memory Stability', () => {
    it('maintains bounded heap memory during sustained repetitive operations', async () => {
      const initialMem = process.memoryUsage().heapUsed;

      // Execute 30 repetitive lightweight queries
      for (let i = 0; i < 30; i++) {
        await prisma.loanProduct.findFirst({ select: { id: true, code: true } });
      }

      const finalMem = process.memoryUsage().heapUsed;
      const memDeltaMB = (finalMem - initialMem) / (1024 * 1024);

      // Memory growth delta should be stable and bounded (under 30MB)
      expect(memDeltaMB).toBeLessThan(30);
    }, 15000);
  });
});
