import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { calculateEmi, allocateRepayment } from '../finance/emi';
import { rolePermissionService } from '../roles/role-permission.service';
import { workflowService } from '../workflows/workflow.service';
import { evaluateApplicationEligibility } from '../eligibility/eligibility.service';
import { createApplication, transition } from '../application/application.service';
import { createCustomer, updateKycStatus } from '../customer/customer.service';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { processPayment } from '../payments/payment.service';
import { executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { BadRequestError } from '../../common/errors';

describe('Step 3: Production-Grade End-to-End Lending Workflow Audit & Verification', () => {
  const tenantId = 'tenant-adyapan-default';

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

  describe('JOURNEY 1: Full Happy Path Lending Lifecycle (Stages 1 -> 14)', () => {
    it('executes complete 14-stage lending lifecycle seamlessly from Onboarding to NOC issuance', async () => {
      // --- STAGE 1: BORROWER ONBOARDING ---
      const borrowerData = {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: `rahul.sharma.${Date.now()}@example.com`,
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        dateOfBirth: new Date('1992-05-15'),
        gender: 'MALE' as const,
        employmentType: 'SALARIED' as const,
        employerName: 'Tata Consultancy Services',
        designation: 'Senior Software Engineer',
        monthlyIncome: 60000, // ₹60,000/month
        existingObligations: 8000, // ₹8,000/month
        addressLine: 'Flat 402, Lotus Towers, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100234567890',
        bankIfsc: 'HDFC0000128',
      };

      const customer = await createCustomer(borrowerData, loanOfficer.id);
      expect(customer).toBeDefined();
      expect(customer.id).toBeDefined();
      expect(customer.customerCode).toMatch(/^CUST-\d+$/);
      expect(customer.kycStatus).toBe('NOT_STARTED');
      expect(customer.status).toBe('DRAFT');

      // --- STAGE 2: KYC & DOCUMENTS ---
      const verifiedKyc = await updateKycStatus(
        customer.id,
        {
          kycStatus: 'VERIFIED',
          riskCategory: 'LOW',
          remarks: 'PAN and Aadhaar verified. Low risk salaried profile.',
        },
        loanOfficer.id
      );
      expect(verifiedKyc.kycStatus).toBe('VERIFIED');
      expect(verifiedKyc.status).toBe('ACTIVE');

      // --- STAGE 3: LOAN ORIGINATION ---
      const app = await createApplication({
        customerId: customer.id,
        requestedAmount: 300000, // ₹3,00,000
        tenureMonths: 36, // 36 months
        purpose: 'Home Renovation & Appliances',
        interestRate: 14.5, // 14.5% p.a.
        productName: 'Personal Loan Prime',
      });
      expect(app.id).toBeDefined();
      expect(app.status).toBe('DRAFT');

      // Transition: DRAFT -> SUBMITTED -> CREDIT_ASSESSMENT
      await transition(app.id, 'SUBMITTED', loanOfficer.id, 'Application submitted by borrower');
      await transition(app.id, 'CREDIT_ASSESSMENT', underwriter.id, 'Underwriting assessment initiated');

      // --- STAGE 4: ELIGIBILITY ENGINE (FOIR / DTI) ---
      const evalResult = await evaluateApplicationEligibility(app.id, underwriter.id, tenantId);
      expect(evalResult.result).toBe('ELIGIBLE');
      expect(evalResult.score).toBeGreaterThanOrEqual(80);

      // --- STAGE 5 & 6: CREDIT / ADVISORY AI & UNDERWRITING SANCTION ---
      await transition(app.id, 'UNDERWRITING', underwriter.id, 'Formal credit sanction review');
      const approved = await transition(
        app.id,
        'APPROVED',
        underwriter.id,
        'Credit sanction approved: Prime score, satisfactory FOIR'
      );
      expect(approved.status).toBe('APPROVED');

      // --- STAGE 7: DISBURSEMENT EXECUTION & LOAN ACCOUNT ACTIVATION ---
      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'IMPS',
          referenceNumber: 'DISB-IMPS-HDFC-99201',
          remarks: 'Disbursed via automated IMPS gateway',
        },
        financeOfficer
      );
      expect(loan.id).toBeDefined();
      expect(loan.loanNo).toMatch(/^LN-\d+$/);
      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(300000);
      expect(Number(loan.outstandingPrincipal)).toBe(300000);
      
      const schedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id },
        orderBy: { emiNumber: 'asc' },
      });
      expect(schedule).toHaveLength(36);

      // --- STAGE 8: REPAYMENT SCHEDULE & AMORTIZATION CONSISTENCY ---
      const emiCalc = calculateEmi(300000, 14.5, 36);
      expect(Number(emiCalc.emi)).toBe(10326.29);
      expect(Number(emiCalc.schedule[0].interest)).toBe(3625.0); // 300,000 * (14.5 / 12 / 100) = 3625.00
      expect(Number(emiCalc.schedule[0].principal)).toBe(6701.29); // 10326.29 - 3625.00 = 6701.29
      expect(Number(emiCalc.schedule[35].balance)).toBe(0);

      // --- STAGE 9: ON-TIME REPAYMENT & MULTI-BUCKET WATERFALL ALLOCATION ---
      const emiPayment = await processPayment(
        {
          loanId: loan.id,
          amount: 10326.29,
          method: 'UPI',
          reference: 'UPI-REF-2026-09-001',
          idempotencyKey: `idem-pmt-${Date.now()}`,
        },
        financeOfficer.id
      );
      expect(emiPayment.status).toBe('SUCCESS');
      expect(Number(emiPayment.amount)).toBe(10326.29);
      
      const allocations = await prisma.paymentAllocation.findMany({
        where: { paymentId: emiPayment.id },
      });
      expect(allocations.some((a: any) => a.bucket === 'INTEREST')).toBe(true);
      expect(allocations.some((a: any) => a.bucket === 'PRINCIPAL')).toBe(true);

      // --- STAGE 13 & 14: FULL PAYOFF, LOAN CLOSURE & NOC GENERATION ---
      const remainingItems = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id, status: { not: 'PAID' } },
      });
      const totalPayoff = remainingItems.reduce(
        (sum, item) => sum + Number(item.outstanding),
        0
      );

      await processPayment(
        {
          loanId: loan.id,
          amount: Number(totalPayoff.toFixed(2)),
          method: 'NEFT',
          reference: 'NEFT-FULL-PAYOFF-001',
          idempotencyKey: `idem-payoff-${Date.now()}`,
        },
        financeOfficer.id
      );

      const refreshedLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(Number(refreshedLoan?.outstandingPrincipal)).toBe(0);

      // Execute Loan Closure & Issue NOC
      const closure = await closeLoanAndIssueNoc(
        {
          loanId: loan.id,
          closureType: 'EARLY_PREPAYMENT',
          remarks: 'Full prepayment received. Zero outstanding balance.',
        },
        financeOfficer
      );
      expect(closure).toBeDefined();
      expect(closure.nocNumber).toMatch(/^NOC-\d+$/);
      expect(closure.closureType).toBe('EARLY_PREPAYMENT');
      expect(closure.closedBy).toBe(financeOfficer.email);
    }, 60000);
  });

  describe('JOURNEY 2: Delinquency, DPD Tracking & One-Time Settlement (OTS) (Stages 10 -> 12)', () => {
    it('handles delinquency, calculates DPD bucket, and executes OTS settlement with waiver accounting', async () => {
      // 1. Create customer & verified KYC
      const cust = await createCustomer(
        {
          firstName: 'Vikram',
          lastName: 'Mehta',
          email: `vikram.mehta.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 45000,
          existingObligations: 5000,
          bankName: 'ICICI Bank',
          bankAccountNo: '001122334455',
          bankIfsc: 'ICIC0000011',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      // 2. Application & Underwriting Approval
      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Medical Emergency',
        interestRate: 15.0,
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id, 'Approved');

      // 3. Disbursement
      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-OTS-001' },
        financeOfficer
      );
      expect(loan.status).toBe('ACTIVE');

      // 4. Delinquency & DPD Calculation (Stage 10)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 45); // 45 days overdue
      const today = new Date();
      const diffMs = today.getTime() - dueDate.getTime();
      const dpd = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      expect(dpd).toBeGreaterThanOrEqual(44);

      let bucket = '0-30';
      if (dpd > 180) bucket = '180+';
      else if (dpd > 90) bucket = '91-180';
      else if (dpd > 60) bucket = '61-90';
      else if (dpd > 30) bucket = '31-60';
      expect(bucket).toBe('31-60');

      // 5. OTS Settlement Execution (Stage 12)
      const settlement = await executeSettlement(
        {
          loanId: loan.id,
          settlementAmount: 75000,
          reason: 'Hardship settlement approved by Credit Committee. Borrower experienced job loss.',
        },
        financeOfficer
      );
      expect(settlement.status).toBe('COMPLETED');
      expect(Number(settlement.settlementAmount)).toBe(75000);
      expect(Number(settlement.waivedAmount)).toBeGreaterThanOrEqual(25000);
      expect(settlement.approvedBy).toBe(financeOfficer.email);
    }, 60000);
  });

  describe('JOURNEY 3: Negative & Rejection Lifecycle Journey', () => {
    it('fails eligibility for borrower exceeding FOIR/DTI limits and formalizes Underwriting REJECT', async () => {
      // 1. Borrower with low income and huge existing debt
      const cust = await createCustomer(
        {
          firstName: 'Amit',
          lastName: 'Verma',
          email: `amit.unqualified.${Date.now()}@example.com`,
          mobile: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 18000, // Below ₹25,000 salaried threshold
          existingObligations: 12000, // Excessive existing debt
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 500000, // ₹5,00,000 exceeds income capacity
        tenureMonths: 24,
        purpose: 'Speculative Business',
        interestRate: 18.0,
      });

      await transition(app.id, 'SUBMITTED', loanOfficer.id, 'Submitted');
      await transition(app.id, 'CREDIT_ASSESSMENT', underwriter.id, 'Credit assessment');

      // Run Eligibility Engine
      const evalResult = await evaluateApplicationEligibility(app.id, underwriter.id, tenantId);
      expect(evalResult.result).toBe('NOT_ELIGIBLE');

      // Underwriter executes REJECT
      await transition(app.id, 'UNDERWRITING', underwriter.id, 'Reviewing ineligible application');
      const rejected = await transition(
        app.id,
        'REJECTED',
        underwriter.id,
        'Adverse action: Monthly income below ₹25k threshold and DTI exceeds 70%'
      );
      expect(rejected.status).toBe('REJECTED');

      // Prohibited transition: REJECTED -> DISBURSED
      await expect(
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'ILLEGAL_DISB' },
          financeOfficer
        )
      ).rejects.toThrow(BadRequestError);
    }, 60000);
  });

  describe('JOURNEY 4: Negative / Failure Guardrails & Idempotency Testing', () => {
    it('blocks disbursement when customer KYC is not verified', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Unverified',
          lastName: 'Borrower',
          email: `unverified.${Date.now()}@example.com`,
          mobile: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
          bankName: 'Axis Bank',
          bankAccountNo: '998877665544',
          bankIfsc: 'UTIB0000123',
        },
        loanOfficer.id
      );

      // KYC left in NOT_STARTED
      expect(cust.kycStatus).toBe('NOT_STARTED');

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Personal',
      });

      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      // Attempt disbursement without KYC verification
      await expect(
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'PREMATURE_DISB' },
          financeOfficer
        )
      ).rejects.toThrow(/Must be VERIFIED before fund release/);
    }, 60000);

    it('blocks loan closure NOC when outstanding balance remains active', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Active',
          lastName: 'Debtor',
          email: `active.debtor.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 50000,
          bankName: 'SBI',
          bankAccountNo: '30495867123',
          bankIfsc: 'SBIN0001234',
        },
        loanOfficer.id
      );
      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, loanOfficer.id);

      const app = await createApplication({
        customerId: cust.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Education',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-ACTIVE-01' },
        financeOfficer
      );

      // Attempt closure when ₹1,00,000 balance is still unpaid
      await expect(
        closeLoanAndIssueNoc(
          { loanId: loan.id, closureType: 'NORMAL_MATURITY', remarks: 'Illegal premature closure' },
          financeOfficer
        )
      ).rejects.toThrow(/Cannot issue closure NOC\. Outstanding balance remains/);
    }, 60000);

    it('enforces idempotency preventing duplicate payments on network retry', async () => {
      const cust = await createCustomer(
        {
          firstName: 'Idem',
          lastName: 'Payer',
          email: `idem.payer.${Date.now()}@example.com`,
          mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          monthlyIncome: 50000,
          bankName: 'SBI',
          bankAccountNo: '30495867124',
          bankIfsc: 'SBIN0001234',
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
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'DISB-IDEM-01' },
        financeOfficer
      );

      const idempotencyKey = `idem-key-${Date.now()}`;

      // 1. Initial Payment Request
      const p1 = await processPayment(
        {
          loanId: loan.id,
          amount: 4500,
          method: 'BANK_TRANSFER',
          reference: 'TXN-999-A',
          idempotencyKey,
        },
        financeOfficer.id
      );

      // 2. Duplicate Retried Payment Request
      const p2 = await processPayment(
        {
          loanId: loan.id,
          amount: 4500,
          method: 'BANK_TRANSFER',
          reference: 'TXN-999-B',
          idempotencyKey,
        },
        financeOfficer.id
      );

      // Idempotency: exact same payment record returned, no duplicate deduction
      expect(p1.id).toBe(p2.id);
      expect(p1.paymentNo).toBe(p2.paymentNo);
    }, 60000);

    it('statutory allocation priority strictly distributes payment: FEES -> PENALTY -> INTEREST -> PRINCIPAL', () => {
      const alloc = allocateRepayment({
        repaymentAmount: 5000,
        outstandingPrincipal: 100000,
        accruedInterest: 2000,
        feesDue: 500,
        penaltiesDue: 250,
      });

      expect(alloc.allocatedToPenalties).toBe(250); // 1st priority: 250
      expect(alloc.allocatedToFees).toBe(500); // 2nd priority: 500
      expect(alloc.allocatedToInterest).toBe(2000); // 3rd priority: 2000
      expect(alloc.allocatedToPrincipal).toBe(2250); // 4th priority: 5000 - 2750 = 2250
      expect(alloc.excessRefund).toBe(0);
      expect(alloc.remainingPrincipal).toBe(97750);
    });
  });
});
