import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
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
import { recordPromiseToPay } from '../collections/collection.service';
import { executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { Money } from '../finance/money';
import { BadRequestError } from '../../common/errors';

describe('Step 56: Final User Acceptance Testing (UAT) & Production Readiness Verification', () => {
  const tenantId = 'tenant-adyapan-default';

  const superAdmin = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'superadmin.uat@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  const admin = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin.uat@adyapan.dev',
    roles: ['ADMIN'],
  };

  const branchManager = {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'branchmanager.uat@adyapan.dev',
    roles: ['BRANCH_MANAGER'],
  };

  const loanOfficer = {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'loanofficer.uat@adyapan.dev',
    roles: ['LOAN_OFFICER'],
  };

  const creditAnalyst = {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'creditanalyst.uat@adyapan.dev',
    roles: ['CREDIT_ANALYST'],
  };

  const underwriter = {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'underwriter.uat@adyapan.dev',
    roles: ['UNDERWRITER'],
  };

  const financeOfficer = {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'financeofficer.uat@adyapan.dev',
    roles: ['FINANCE_OFFICER'],
  };

  const collectionOfficer = {
    id: '00000000-0000-0000-0000-000000000008',
    email: 'collectionofficer.uat@adyapan.dev',
    roles: ['COLLECTION_OFFICER'],
  };

  const auditor = {
    id: '00000000-0000-0000-0000-000000000009',
    email: 'auditor.uat@adyapan.dev',
    roles: ['AUDITOR'],
  };

  let uatProduct: any;

  beforeAll(async () => {
    const testUsers = [
      superAdmin,
      admin,
      branchManager,
      loanOfficer,
      creditAnalyst,
      underwriter,
      financeOfficer,
      collectionOfficer,
      auditor,
    ];

    for (const u of testUsers) {
      const dbUser = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyUatHash',
          firstName: u.roles[0],
          lastName: 'Tester',
          status: 'ACTIVE',
        },
      });
      u.id = dbUser.id;
    }

    uatProduct = await prisma.loanProduct.findFirst({ where: { isActive: true } });
    if (!uatProduct) {
      uatProduct = await prisma.loanProduct.create({
        data: {
          name: 'UAT Enterprise Prime Personal Loan',
          code: `UAT_PRIME_${Date.now()}`,
          productType: 'PERSONAL',
          minAmount: Money.toDb(25000),
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

  beforeEach(() => {
    rolePermissionService.clearForTesting();
    workflowService.clearForTesting();
  });

  // =========================================================================
  // 1. END-TO-END BORROWER BUSINESS JOURNEY (HAPPY PATH)
  // =========================================================================
  describe('1. Full Business Lending Lifecycle (Stages 1 -> 14)', () => {
    it('executes complete 14-stage lifecycle from customer onboarding to digital NOC certificate issuance', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const email = `uat.borrower_${ts}@adyapan.dev`;

      // Stage 1 & 2: Customer Onboarding
      const customer = await createCustomer({
        firstName: 'Aarav',
        lastName: 'Sharma',
        email,
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: 'MALE',
        employmentType: 'SALARIED',
        employerName: 'Tata Consultancy Services',
        monthlyIncome: 95000,
        existingObligations: 10000,
        bankAccountNo: `99887766${ts.slice(-4)}`,
        bankName: 'HDFC Bank',
        bankIfsc: 'HDFC0001234',
      });
      expect(customer.id).toBeDefined();
      expect(customer.customerCode).toMatch(/^CUST-/);

      // Stage 3: KYC Verification
      const kycResult = await updateKycStatus(customer.id, { kycStatus: 'VERIFIED' }, superAdmin.id);
      expect(kycResult.kycStatus).toBe('VERIFIED');

      // Stage 4: Loan Application Creation
      const loanAmount = 150000;
      const tenureMonths = 12;
      const app = await createApplication({
        customerId: customer.id,
        productId: uatProduct.id,
        requestedAmount: loanAmount,
        tenureMonths,
        purpose: 'Home Renovation & Appliance Purchase',
      });
      expect(app.id).toBeDefined();
      expect(app.status).toBe('DRAFT');

      // Stage 5: Automated Eligibility Assessment
      const eligibility = await evaluateApplicationEligibility(app.id);
      expect(['ELIGIBLE', 'CONDITIONALLY_ELIGIBLE']).toContain(eligibility.result);
      expect(Number(eligibility.maxEligibleAmount)).toBeGreaterThanOrEqual(loanAmount);

      // Stage 6, 7 & 8: Submission, Underwriting & Approval
      await transition(app.id, 'SUBMITTED', loanOfficer.id, 'Customer submitted application documents');
      await transition(app.id, 'UNDERWRITING', underwriter.id, 'Assigned to credit underwriting desk');
      const approvedApp = await transition(
        app.id,
        'APPROVED',
        underwriter.id,
        'Application sanctioned as per credit policy'
      );
      expect(approvedApp.status).toBe('APPROVED');

      // Stage 9: Loan Disbursement
      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'NEFT_BANK_TRANSFER',
          referenceNumber: `UTR_UAT_${ts}`,
          remarks: 'Disbursed to primary verified HDFC account',
        },
        financeOfficer as any
      );
      expect(loan.id).toBeDefined();
      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(loanAmount);

      // Stage 10: Repayment Schedule Verification
      const schedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id },
        orderBy: { emiNumber: 'asc' },
      });
      expect(schedule.length).toBe(tenureMonths);

      // Stage 11: Repayment Processing (Simulate regular monthly EMIs)
      const monthlyPayment = Number(schedule[0].totalDue);
      const payResult = await processPayment(
        {
          loanId: loan.id,
          amount: monthlyPayment,
          method: 'BANK_TRANSFER',
          reference: `PAY_UAT_01_${ts}`,
          idempotencyKey: `IDEMP_UAT_PAY_${ts}`,
        },
        financeOfficer.id
      );
      expect(payResult.status).toBe('SUCCESS');
      const allocations = await prisma.paymentAllocation.findMany({ where: { paymentId: payResult.id } });
      expect(allocations.length).toBeGreaterThan(0);

      // Stage 12: Pay Off Remaining Balance across all installments
      const unpaidSchedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id, status: { not: 'PAID' } },
      });
      const totalRemainingPayoff = unpaidSchedule.reduce(
        (sum, item) => sum + Number(item.totalDue) - Number(item.paidAmount),
        0
      );

      await processPayment(
        {
          loanId: loan.id,
          amount: totalRemainingPayoff + 10,
          method: 'BANK_TRANSFER',
          reference: `PAY_UAT_FINAL_${ts}`,
          idempotencyKey: `IDEMP_UAT_PAY_FINAL_${ts}`,
        },
        financeOfficer.id
      );

      // Stage 13 & 14: Loan Closure & Digital NOC Issuance
      const closureResult = await closeLoanAndIssueNoc(
        {
          loanId: loan.id,
          closureType: 'NORMAL_MATURITY',
          remarks: 'Full payoff received. Loan successfully closed.',
        },
        superAdmin as any
      );

      expect(closureResult).toBeDefined();
      expect(closureResult.nocNumber).toMatch(/^NOC-/);
      expect(closureResult.closureType).toBe('NORMAL_MATURITY');

      // Invariant: Loan is officially closed in database
      const finalLoanState = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } });
      expect(finalLoanState.status).toBe('CLOSED');
      expect(Number(finalLoanState.outstandingPrincipal)).toBe(0);
    }, 60000);
  });

  // =========================================================================
  // 2. DELINQUENCY, DPD TRACKING & OTS SETTLEMENT JOURNEY
  // =========================================================================
  describe('2. Delinquency, DPD & One-Time Settlement (OTS) Workflow', () => {
    it('executes overdue tracking, records PTP, and executes OTS settlement with statutory waiver accounting', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const email = `uat.delinquent_${ts}@adyapan.dev`;

      const customer = await createCustomer({
        firstName: 'Vikram',
        lastName: 'Patel',
        email,
        mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: 'MALE',
        employmentType: 'SELF_EMPLOYED',
        monthlyIncome: 60000,
        bankAccountNo: `99887711${ts.slice(-4)}`,
        bankName: 'Axis Bank',
        bankIfsc: 'UTIB0000567',
      });

      await updateKycStatus(customer.id, { kycStatus: 'VERIFIED' }, superAdmin.id);

      const app = await createApplication({
        customerId: customer.id,
        productId: uatProduct.id,
        requestedAmount: 80000,
        tenureMonths: 12,
        purpose: 'Working Capital',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'RTGS',
          referenceNumber: `UTR_DELINQ_${ts}`,
        },
        financeOfficer as any
      );

      // Simulate Delinquency & DPD Aging
      const colCase = await prisma.collectionCase.create({
        data: {
          loanId: loan.id,
          customerId: customer.id,
          caseNo: `CC-UAT-${ts}`,
          status: 'ACTIVE',
          dpd: 45,
          overdueAmount: Money.toDb(15000),
          assignedOfficerId: collectionOfficer.id,
        },
      });
      expect(colCase.id).toBeDefined();

      // Record Promise to Pay (PTP) via collections service
      const ptp = await recordPromiseToPay(
        {
          caseId: colCase.id,
          promisedAmount: 10000,
          promisedDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
          paymentMode: 'NET_BANKING',
        },
        collectionOfficer
      );
      expect(ptp.status).toBe('PENDING');

      // Propose & Execute OTS Settlement
      const settlementAmount = 50000;
      const settlementResult = await executeSettlement(
        {
          loanId: loan.id,
          settlementAmount,
          reason: 'Customer experienced medical hardship - Approved by Credit Committee',
        },
        superAdmin as any
      );

      expect(settlementResult.status).toBe('COMPLETED');
      expect(Number(settlementResult.settlementAmount)).toBe(settlementAmount);
      expect(Number(settlementResult.waivedAmount)).toBeGreaterThan(0);

      // Verify settlement record exists and loan is settled
      const settledLoan = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } });
      expect(settledLoan.status).toBe('SETTLED');
    }, 60000);
  });

  // =========================================================================
  // 3. NEGATIVE BUSINESS SCENARIOS & GUARDRAILS
  // =========================================================================
  describe('3. Negative Business Logic & Underwriting Guardrails', () => {
    it('fails automated eligibility when applicant obligations exceed statutory limits', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const customer = await createCustomer({
        firstName: 'High',
        lastName: 'Obligation',
        email: `uat.highdti_${ts}@adyapan.dev`,
        mobile: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: 'FEMALE',
        employmentType: 'SALARIED',
        monthlyIncome: 30000,
        existingObligations: 26000, // 86.6% DTI (Statutory cap is 65%)
      });

      const app = await createApplication({
        customerId: customer.id,
        productId: uatProduct.id,
        requestedAmount: 500000,
        tenureMonths: 24,
        purpose: 'Personal',
      });

      const eligibility = await evaluateApplicationEligibility(app.id);
      expect(eligibility.result).toBe('NOT_ELIGIBLE');
      expect(eligibility.factors.length).toBeGreaterThan(0);
    }, 30000);

    it('strictly blocks disbursement if borrower KYC status is not VERIFIED', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const customer = await createCustomer({
        firstName: 'Unverified',
        lastName: 'Borrower',
        email: `uat.nokyc_${ts}@adyapan.dev`,
        mobile: `95${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: 'MALE',
      });

      // Customer KYC is NOT_STARTED
      const app = await createApplication({
        customerId: customer.id,
        productId: uatProduct.id,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Emergency',
      });

      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      await expect(
        executeDisbursement(
          {
            applicationId: app.id,
            disbursementMethod: 'IMPS',
            referenceNumber: `UTR_BLOCKED_${ts}`,
          },
          financeOfficer as any
        )
      ).rejects.toThrow();
    }, 30000);

    it('enforces idempotency preventing duplicate payments on network retry', async () => {
      const ts = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const customer = await createCustomer({
        firstName: 'Idemp',
        lastName: 'Tester',
        email: `uat.idemp_${ts}@adyapan.dev`,
        mobile: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankAccountNo: `99887744${ts.slice(-4)}`,
        bankName: 'SBI',
        bankIfsc: 'SBIN0001234',
      });
      await updateKycStatus(customer.id, { kycStatus: 'VERIFIED' }, superAdmin.id);

      const app = await createApplication({
        customerId: customer.id,
        productId: uatProduct.id,
        requestedAmount: 50000,
        tenureMonths: 12,
        purpose: 'Idempotency Test',
      });
      await transition(app.id, 'SUBMITTED', loanOfficer.id);
      await transition(app.id, 'UNDERWRITING', underwriter.id);
      await transition(app.id, 'APPROVED', underwriter.id);

      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'UPI',
          referenceNumber: `UTR_IDEMP_${ts}`,
        },
        financeOfficer as any
      );

      const idempotencyKey = `UAT_UNIQUE_PAY_KEY_${ts}`;

      // First payment succeeds
      const p1 = await processPayment(
        {
          loanId: loan.id,
          amount: 5000,
          method: 'UPI',
          reference: 'UPI-REF-01',
          idempotencyKey,
        },
        financeOfficer.id
      );
      expect(p1.status).toBe('SUCCESS');

      // Duplicate network retry returns the same idempotent payment record
      const p2 = await processPayment(
        {
          loanId: loan.id,
          amount: 5000,
          method: 'UPI',
          reference: 'UPI-REF-01',
          idempotencyKey,
        },
        financeOfficer.id
      );
      expect(p2.id).toBe(p1.id);

      // Verify only 1 payment was created in database
      const count = await prisma.payment.count({ where: { loanId: loan.id } });
      expect(count).toBe(1);
    }, 30000);
  });

  // =========================================================================
  // 4. ROLE-WISE UAT & SEGREGATION OF DUTIES (SoD)
  // =========================================================================
  describe('4. 10-Role RBAC & Segregation of Duties Matrix', () => {
    it('validates permission matrix across all 10 institutional roles', () => {
      const roles = rolePermissionService.listRoles(tenantId);
      const roleCodes = roles.map((r) => r.code);

      // Verify all 10 core institutional personas exist
      expect(roleCodes).toContain('SUPER_ADMIN');
      expect(roleCodes).toContain('ADMIN');
      expect(roleCodes).toContain('BRANCH_MANAGER');
      expect(roleCodes).toContain('LOAN_OFFICER');
      expect(roleCodes).toContain('CREDIT_ANALYST');
      expect(roleCodes).toContain('UNDERWRITER');
      expect(roleCodes).toContain('FINANCE_OFFICER');
      expect(roleCodes).toContain('COLLECTION_OFFICER');
      expect(roleCodes).toContain('AUDITOR');
      expect(roleCodes).toContain('CUSTOMER');
    });

    it('enforces banking Segregation of Duties (Maker cannot be Checker)', () => {
      const sodCheck = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);

      expect(sodCheck.hasConflict).toBe(true);
      expect(sodCheck.conflicts.length).toBeGreaterThan(0);
    });

    it('prevents Loan Officer from approving credit sanctions', () => {
      const roles = rolePermissionService.listRoles(tenantId);
      const lo = roles.find((r) => r.code === 'LOAN_OFFICER');
      expect(lo?.permissions).toContain('APPLICATIONS_CREATE');
      expect(lo?.permissions).not.toContain('UNDERWRITING_APPROVE_SANCTION');
    });
  });

  // =========================================================================
  // 5. MATHEMATICAL & FINANCIAL PRECISION VALIDATION
  // =========================================================================
  describe('5. Statutory Financial Calculations & Ledger Invariants', () => {
    it('computes exact reducing-balance amortization schedules without floating point error', () => {
      const principal = 200000;
      const rate = 11.5;
      const tenure = 24;

      const result = calculateEmi(principal, rate, tenure);
      expect(Number(result.emi)).toBeGreaterThan(0);
      expect(result.schedule.length).toBe(tenure);

      // The final row must have 0 ending balance
      const lastRow = result.schedule[tenure - 1];
      expect(Number(lastRow.balance)).toBe(0);
    });

    it('allocates repayments in statutory order: Penalties -> Fees -> Interest -> Principal', () => {
      const allocation = allocateRepayment({
        repaymentAmount: 15000,
        penaltiesDue: 500,
        feesDue: 1000,
        accruedInterest: 4500,
        outstandingPrincipal: 20000,
      });

      expect(allocation.allocatedToPenalties).toBe(500);
      expect(allocation.allocatedToFees).toBe(1000);
      expect(allocation.allocatedToInterest).toBe(4500);
      expect(allocation.allocatedToPrincipal).toBe(9000);
      expect(allocation.remainingPrincipal).toBe(11000);
      expect(allocation.excessRefund).toBe(0);

      // Invariant: sum of allocations equals payment amount
      const sum =
        allocation.allocatedToPenalties +
        allocation.allocatedToFees +
        allocation.allocatedToInterest +
        allocation.allocatedToPrincipal +
        allocation.excessRefund;
      expect(sum).toBe(15000);
    });
  });
});
