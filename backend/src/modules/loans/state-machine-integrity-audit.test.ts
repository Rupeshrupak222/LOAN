import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';
import { calculateEmi } from '../finance/emi';
import { createCustomer, getCustomer, updateCustomer, updateKycStatus } from '../customer/customer.service';
import { createApplication, getApplication, transition } from '../application/application.service';
import { evaluateApplicationEligibility } from '../eligibility/eligibility.service';
import { submitUnderwritingDecision } from '../underwriting/underwriting.service';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { processPayment } from '../payments/payment.service';
import { restructureLoan, executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { logCollectionActivity, recordPromiseToPay, getCollectionDashboard } from '../collections/collection.service';
import { registerDocument, verifyDocument, deleteDocument, getDocument } from '../documents/document.service';
import { WorkerService } from '../jobs/worker.service';
import { WebhookService } from '../integrations/webhook.service';
import { rolePermissionService } from '../roles/role-permission.service';
import { workflowService } from '../workflows/workflow.service';
import { BadRequestError, NotFoundError } from '../../common/errors';

describe('Step 6: Production-Grade Data Integrity, State Machine & Transaction Boundary Audit', { timeout: 30000 }, () => {
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

  let defaultProduct: any;

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

    defaultProduct = await prisma.loanProduct.upsert({
      where: { code: 'AUDIT-PL-01' },
      update: {
        name: 'Audit Personal Loan',
        interestRate: '14.500',
        minAmount: '10000.00',
        maxAmount: '1000000.00',
        minTenureMonths: 6,
        maxTenureMonths: 60,
        isActive: true,
      },
      create: {
        code: 'AUDIT-PL-01',
        name: 'Audit Personal Loan',
        productType: 'PERSONAL',
        interestRate: '14.500',
        minAmount: '10000.00',
        maxAmount: '1000000.00',
        minTenureMonths: 6,
        maxTenureMonths: 60,
        isActive: true,
      },
    });
  }, 30000);

  beforeEach(() => {
    rolePermissionService.clearForTesting();
    workflowService.clearForTesting();
  });

  // =========================================================================
  // SECTION 1: CUSTOMER STATE INTEGRITY & KYC STATE MACHINE
  // =========================================================================
  describe('1. Customer & KYC State Machine Integrity', () => {
    it('creates customer in DRAFT / NOT_STARTED state with linked user account', async () => {
      const custEmail = `cust.audit.${Date.now()}@example.com`;
      const cust = await createCustomer(
        {
          firstName: 'Siddharth',
          lastName: 'Mehta',
          email: custEmail,
          mobile: '9876543210',
          monthlyIncome: 85000,
          bankName: 'HDFC Bank',
          bankAccountNo: '50100234567890',
          bankIfsc: 'HDFC0001234',
        },
        loanOfficer.id
      );

      expect(cust.status).toBe('DRAFT');
      expect(cust.kycStatus).toBe('NOT_STARTED');
      expect(cust.customerCode).toMatch(/^CUST-/);
      expect(cust.userId).toBeDefined();

      // Verify User record was created with CUSTOMER role
      const linkedUser = await prisma.user.findUnique({
        where: { id: cust.userId! },
        include: { roles: { include: { role: true } } },
      });
      expect(linkedUser).toBeDefined();
      expect(linkedUser?.email).toBe(custEmail);
    });

    it('transitions KYC from NOT_STARTED -> PENDING/SUBMITTED -> VERIFIED and activates customer', async () => {
      const cust = await createCustomer({
        firstName: 'Ananya',
        lastName: 'Sharma',
        email: `ananya.${Date.now()}@example.com`,
        mobile: '9876543211',
        monthlyIncome: 95000,
      });

      // 1. Submit KYC -> status KYC_PENDING
      const pendingCust = await updateKycStatus(cust.id, { kycStatus: 'SUBMITTED' }, loanOfficer.id);
      expect(pendingCust.kycStatus).toBe('SUBMITTED');
      expect(pendingCust.status).toBe('KYC_PENDING');

      // 2. Verify KYC -> status ACTIVE
      const verifiedCust = await updateKycStatus(
        cust.id,
        { kycStatus: 'VERIFIED', riskCategory: 'LOW', remarks: 'Aadhaar & PAN matched' },
        underwriter.id
      );
      expect(verifiedCust.kycStatus).toBe('VERIFIED');
      expect(verifiedCust.status).toBe('ACTIVE');
      expect(verifiedCust.riskCategory).toBe('LOW');

      // 3. Verify audit log entry exists
      const logs = await prisma.auditLog.findMany({
        where: { entity: 'Customer', entityId: cust.id, action: 'KYC_STATUS_UPDATED' },
      });
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('blocks customer when KYC is REJECTED', async () => {
      const cust = await createCustomer({
        firstName: 'Rajesh',
        lastName: 'Verma',
        email: `rajesh.rej.${Date.now()}@example.com`,
        mobile: '9876543212',
      });

      const rejectedCust = await updateKycStatus(
        cust.id,
        { kycStatus: 'REJECTED', remarks: 'Suspected fraudulent PAN copy' },
        underwriter.id
      );

      expect(rejectedCust.kycStatus).toBe('REJECTED');
      expect(rejectedCust.status).toBe('BLOCKED');
    });
  });

  // =========================================================================
  // SECTION 2: DOCUMENT STATE INTEGRITY & VAULT ISOLATION
  // =========================================================================
  describe('2. Document State Integrity & Isolation', () => {
    it('registers, verifies and audits document lifecycle', async () => {
      const cust = await createCustomer({
        firstName: 'Pooja',
        lastName: 'Iyer',
        email: `pooja.doc.${Date.now()}@example.com`,
        mobile: '9876543213',
      });

      // 1. Upload/register document
      const doc = await registerDocument(
        {
          customerId: cust.id,
          category: 'IDENTITY',
          documentType: 'PAN_CARD',
          fileName: 'pan_card_pooja.pdf',
          storageKey: '/uploads/documents/pan_pooja.pdf',
          sizeBytes: 250000,
        },
        cust.userId!
      );

      expect(doc.status).toBe('PENDING');
      expect(doc.verified).toBe(false);

      // 2. Verify document
      const verifiedDoc = await verifyDocument(
        doc.id,
        { status: 'VERIFIED' },
        underwriter.email,
        underwriter.id
      );

      expect(verifiedDoc.status).toBe('VERIFIED');
      expect(verifiedDoc.verified).toBe(true);
      expect(verifiedDoc.verifiedBy).toBe(underwriter.email);
      expect(verifiedDoc.verifiedAt).toBeDefined();

      // 3. Prevent invalid file extensions
      await expect(
        registerDocument({
          customerId: cust.id,
          category: 'INCOME',
          documentType: 'PAYSLIP',
          fileName: 'malicious_script.exe',
          storageKey: '/uploads/malicious.exe',
        })
      ).rejects.toThrow(BadRequestError);

      // 4. Prevent file exceeding 10MB limit
      await expect(
        registerDocument({
          customerId: cust.id,
          category: 'BANK_STATEMENT',
          documentType: 'STATEMENT_PDF',
          fileName: 'huge_statement.pdf',
          storageKey: '/uploads/huge.pdf',
          sizeBytes: 15 * 1024 * 1024,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  // =========================================================================
  // SECTION 3: APPLICATION STATE MACHINE & FORBIDDEN JUMPS
  // =========================================================================
  describe('3. Loan Application Lifecycle & Transition Guards', () => {
    it('executes valid forward progression: DRAFT -> SUBMITTED -> UNDERWRITING -> APPROVED', async () => {
      const cust = await createCustomer({
        firstName: 'Karan',
        lastName: 'Kapoor',
        email: `karan.app.${Date.now()}@example.com`,
        mobile: '9876543214',
      });

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 200000,
        tenureMonths: 24,
        purpose: 'Home Improvement',
      });

      expect(app.status).toBe('DRAFT');

      // DRAFT -> SUBMITTED
      const subApp = await transition(app.id, 'SUBMITTED', cust.email!, 'Borrower submitted proposal');
      expect(subApp.status).toBe('SUBMITTED');

      // SUBMITTED -> UNDERWRITING
      const uwApp = await transition(app.id, 'UNDERWRITING', loanOfficer.email, 'Forwarded for credit evaluation');
      expect(uwApp.status).toBe('UNDERWRITING');

      // UNDERWRITING -> APPROVED
      const appApp = await transition(app.id, 'APPROVED', underwriter.email, 'Credit proposal approved');
      expect(appApp.status).toBe('APPROVED');
    });

    it('strictly blocks forbidden illegal state transitions', async () => {
      const cust = await createCustomer({
        firstName: 'Sneha',
        lastName: 'Patil',
        email: `sneha.guard.${Date.now()}@example.com`,
        mobile: '9876543215',
      });

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 150000,
        tenureMonths: 12,
      });

      // 1. DRAFT -> DISBURSED (Illegal jump - must be blocked)
      await expect(transition(app.id, 'DISBURSED')).rejects.toThrow(BadRequestError);

      // 2. DRAFT -> APPROVED (Illegal jump - must be blocked)
      await expect(transition(app.id, 'APPROVED')).rejects.toThrow(BadRequestError);

      // 3. Move to SUBMITTED
      await transition(app.id, 'SUBMITTED');

      // 4. SUBMITTED -> DISBURSED (Illegal jump - must be blocked)
      await expect(transition(app.id, 'DISBURSED')).rejects.toThrow(BadRequestError);

      // 5. Move to REJECTED
      await transition(app.id, 'REJECTED', underwriter.email, 'DTI exceeds maximum tolerance');

      // 6. REJECTED -> APPROVED (Illegal jump - terminated state)
      await expect(transition(app.id, 'APPROVED')).rejects.toThrow(BadRequestError);

      // 7. REJECTED -> DISBURSED (Illegal jump)
      await expect(transition(app.id, 'DISBURSED')).rejects.toThrow(BadRequestError);
    });
  });

  // =========================================================================
  // SECTION 4: DISBURSEMENT ATOMICITY & PRE-CONDITIONS
  // =========================================================================
  describe('4. Disbursement State Machine & Transaction Boundary', () => {
    it('blocks disbursement when KYC is not VERIFIED or Customer is BLOCKED', async () => {
      const cust = await createCustomer({
        firstName: 'Vikas',
        lastName: 'Gupta',
        email: `vikas.disb.${Date.now()}@example.com`,
        mobile: '9876543216',
        bankName: 'Axis Bank',
        bankAccountNo: '912010012345678',
        bankIfsc: 'UTIB0000123',
      });

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 100000,
        tenureMonths: 12,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      // Customer KYC is NOT_STARTED -> Disbursement must fail
      await expect(
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'TXN-FAIL-01' },
          financeOfficer
        )
      ).rejects.toThrow(/Pre-disbursement check failed: Customer KYC status is NOT_STARTED/);
    });

    it('executes atomic disbursement creating Loan + Schedule + Disbursement + Ledger + Status update', async () => {
      const cust = await createCustomer({
        firstName: 'Manoj',
        lastName: 'Tiwari',
        email: `manoj.disb.${Date.now()}@example.com`,
        mobile: '9876543217',
        bankName: 'State Bank of India',
        bankAccountNo: '30987654321',
        bankIfsc: 'SBIN0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 120000,
        tenureMonths: 12,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        {
          applicationId: app.id,
          disbursementMethod: 'IMPS',
          referenceNumber: `DISB-AUDIT-${Date.now()}`,
        },
        financeOfficer
      );

      // Verify Loan state
      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(120000);
      expect(Number(loan.outstandingPrincipal)).toBe(120000);
      expect(loan.loanNo).toMatch(/^LN-/);

      // Verify Schedule items created
      const schedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id },
        orderBy: { emiNumber: 'asc' },
      });
      expect(schedule).toHaveLength(12);
      expect(schedule[0].status).toBe('UPCOMING');

      // Verify Disbursement record
      const disb = await prisma.disbursement.findFirst({ where: { loanId: loan.id } });
      expect(disb).toBeDefined();
      expect(disb?.status).toBe('COMPLETED');
      expect(Number(disb?.amount)).toBe(120000);

      // Verify Ledger DEBIT Transaction
      const txn = await prisma.transaction.findFirst({
        where: { loanId: loan.id, type: 'DISBURSEMENT' },
      });
      expect(txn).toBeDefined();
      expect(txn?.direction).toBe('DEBIT');
      expect(Number(txn?.amount)).toBe(120000);

      // Verify Application status updated to DISBURSED
      const updatedApp = await getApplication(app.id);
      expect(updatedApp.status).toBe('DISBURSED');
    });

    it('blocks duplicate disbursement attempts on already disbursed application', async () => {
      const cust = await createCustomer({
        firstName: 'Divya',
        lastName: 'Nair',
        email: `divya.dup.${Date.now()}@example.com`,
        mobile: '9876543218',
        bankName: 'ICICI Bank',
        bankAccountNo: '001105001234',
        bankIfsc: 'ICIC0000011',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 50000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      // First disbursement succeeds
      await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-D1-${Date.now()}` },
        financeOfficer
      );

      // Second disbursement must fail
      await expect(
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-D2-${Date.now()}` },
          financeOfficer
        )
      ).rejects.toThrow(/Cannot disburse loan application in status DISBURSED/);
    });
  });

  // =========================================================================
  // SECTION 5: PAYMENT PROCESSING, WATERFALL & IDEMPOTENCY
  // =========================================================================
  describe('5. Payment State Machine & Waterfall Allocation', () => {
    it('allocates repayment strictly across waterfall: Fees -> Penalty -> Interest -> Principal', async () => {
      const cust = await createCustomer({
        firstName: 'Amit',
        lastName: 'Bose',
        email: `amit.waterfall.${Date.now()}@example.com`,
        mobile: '9876543219',
        bankName: 'Kotak Bank',
        bankAccountNo: '1234567890',
        bankIfsc: 'KKBK0000123',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 100000,
        tenureMonths: 12,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-W1-${Date.now()}` },
        financeOfficer
      );

      const schedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id },
        orderBy: { emiNumber: 'asc' },
      });

      const emiDue = Number(schedule[0].totalDue);
      const idempotencyKey = `PAY-IDEM-${Date.now()}`;

      // Process full EMI payment
      const payment = await processPayment(
        {
          loanId: loan.id,
          amount: emiDue,
          method: 'UPI',
          reference: 'UPI-REF-001',
          idempotencyKey,
        },
        cust.userId!
      );

      expect(payment.status).toBe('SUCCESS');
      expect(Number(payment.amount)).toBe(emiDue);

      // Verify allocations
      const allocations = await prisma.paymentAllocation.findMany({
        where: { paymentId: payment.id },
      });
      expect(allocations.length).toBeGreaterThan(0);

      // Verify schedule item #1 is PAID
      const updatedItem1 = await prisma.repaymentScheduleItem.findUnique({
        where: { id: schedule[0].id },
      });
      expect(updatedItem1?.status).toBe('PAID');
      expect(Number(updatedItem1?.outstanding)).toBe(0);

      // Verify Idempotency - submitting identical key returns same payment without double allocation
      const idempotentPayment = await processPayment(
        {
          loanId: loan.id,
          amount: emiDue,
          method: 'UPI',
          reference: 'UPI-REF-001',
          idempotencyKey,
        },
        cust.userId!
      );
      expect(idempotentPayment.id).toBe(payment.id);

      // Verify total payments recorded in DB is exactly 1
      const count = await prisma.payment.count({ where: { loanId: loan.id } });
      expect(count).toBe(1);
    });

    it('blocks payment on a CLOSED loan account', async () => {
      const cust = await createCustomer({
        firstName: 'Nitin',
        lastName: 'Gadkari',
        email: `nitin.closed.${Date.now()}@example.com`,
        mobile: '9876543220',
        bankName: 'PNB',
        bankAccountNo: '0987654321',
        bankIfsc: 'PUNB0000123',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 10000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-C1-${Date.now()}` },
        financeOfficer
      );

      // Manually close loan for test
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'CLOSED', outstandingPrincipal: '0.00' },
      });

      await expect(
        processPayment(
          { loanId: loan.id, amount: 1000, method: 'CASH', reference: 'CASH-001' },
          cust.userId!
        )
      ).rejects.toThrow(/Loan is already closed/);
    });
  });

  // =========================================================================
  // SECTION 6: DELINQUENCY, DPD & COLLECTION STATE MACHINE
  // =========================================================================
  describe('6. Collection Case & Delinquency State Machine', () => {
    it('tracks overdue delinquency, records PTP, and resolves case upon full payment', async () => {
      const cust = await createCustomer({
        firstName: 'Harish',
        lastName: 'Rawat',
        email: `harish.col.${Date.now()}@example.com`,
        mobile: '9876543221',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100987654321',
        bankIfsc: 'HDFC0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 60000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-COL-${Date.now()}` },
        financeOfficer
      );

      // Simulate overdue installment
      const schedule = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id },
        orderBy: { emiNumber: 'asc' },
      });

      const overdueItem = schedule[0];
      const emiAmount = Number(overdueItem.totalDue);

      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: 'OVERDUE' },
      });

      await prisma.repaymentScheduleItem.update({
        where: { id: overdueItem.id },
        data: { status: 'OVERDUE' },
      });

      // 1. Create collection case
      const colCase = await prisma.collectionCase.create({
        data: {
          caseNo: `CASE-${Date.now()}`,
          loanId: loan.id,
          customerId: cust.id,
          dpd: 35,
          agingBucket: '31-60',
          overdueAmount: Money.toDb(emiAmount),
          status: 'OPEN',
          priority: 'HIGH',
        },
      });

      expect(colCase.status).toBe('OPEN');
      expect(colCase.agingBucket).toBe('31-60');

      // 2. Log collection activity
      const act = await logCollectionActivity(
        {
          caseId: colCase.id,
          activityType: 'CALL',
          outcome: 'PROMISE_TO_PAY',
          notes: 'Customer agreed to clear dues tomorrow.',
        },
        loanOfficer
      );
      expect(act.outcome).toBe('PROMISE_TO_PAY');

      // 3. Record Promise To Pay (PTP)
      const ptpDate = new Date();
      ptpDate.setDate(ptpDate.getDate() + 1);

      const ptp = await recordPromiseToPay(
        {
          caseId: colCase.id,
          promisedAmount: emiAmount,
          promisedDate: ptpDate,
          paymentMode: 'UPI',
        },
        loanOfficer
      );
      expect(ptp.status).toBe('PENDING');

      const updatedCase = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
      expect(updatedCase?.status).toBe('PROMISED');

      // 4. Customer makes payment -> Resolves collection case
      await processPayment(
        {
          loanId: loan.id,
          amount: emiAmount,
          method: 'UPI',
          reference: 'UPI-CURE-001',
        },
        cust.userId!
      );

      const resolvedCase = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
      expect(resolvedCase?.status).toBe('RESOLVED');
      expect(Number(resolvedCase?.overdueAmount)).toBe(0);

      // Verify Loan returns to ACTIVE status
      const updatedLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(updatedLoan?.status).toBe('ACTIVE');
    });
  });

  // =========================================================================
  // SECTION 7: ONE-TIME SETTLEMENT (OTS) & WAIVER ATOMICITY
  // =========================================================================
  describe('7. Settlement (OTS) & Restructuring State Machine', () => {
    it('executes atomic settlement: calculates waiver, settles loan, waives schedule and writes ledger', async () => {
      const cust = await createCustomer({
        firstName: 'Suresh',
        lastName: 'Raina',
        email: `suresh.ots.${Date.now()}@example.com`,
        mobile: '9876543222',
        bankName: 'ICICI Bank',
        bankAccountNo: '001105009999',
        bankIfsc: 'ICIC0000011',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 100000,
        tenureMonths: 12,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-OTS-${Date.now()}` },
        financeOfficer
      );

      // Propose OTS: Total outstanding 100,000; Settle for 70,000 (30,000 waiver)
      const settlement = await executeSettlement(
        {
          loanId: loan.id,
          settlementAmount: 70000,
          reason: 'Medical distress OTS package approved by credit committee',
        },
        underwriter
      );

      expect(settlement.status).toBe('COMPLETED');
      expect(Number(settlement.settlementAmount)).toBe(70000);
      expect(Number(settlement.waivedAmount)).toBe(30000);

      // Verify Loan is SETTLED with zero balances
      const settledLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(settledLoan?.status).toBe('SETTLED');
      expect(Number(settledLoan?.outstandingPrincipal)).toBe(0);
      expect(settledLoan?.closedAt).toBeDefined();

      // Verify all unpaid schedule items are marked WAIVED
      const unpaidItems = await prisma.repaymentScheduleItem.findMany({
        where: { loanId: loan.id, status: { not: 'WAIVED' } },
      });
      expect(unpaidItems).toHaveLength(0);

      // Verify Ledger SETTLEMENT transaction recorded
      const txn = await prisma.transaction.findFirst({
        where: { loanId: loan.id, type: 'SETTLEMENT' },
      });
      expect(txn).toBeDefined();
      expect(txn?.direction).toBe('CREDIT');
      expect(Number(txn?.amount)).toBe(70000);
    });

    it('rejects settlement amount exceeding total outstanding', async () => {
      const cust = await createCustomer({
        firstName: 'Gautam',
        lastName: 'Gambhir',
        email: `gautam.ots.${Date.now()}@example.com`,
        mobile: '9876543223',
        bankName: 'Axis Bank',
        bankAccountNo: '912010099999999',
        bankIfsc: 'UTIB0000123',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 50000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-OTS2-${Date.now()}` },
        financeOfficer
      );

      // Attempt settlement above total balance (60,000 > 50,000)
      await expect(
        executeSettlement(
          { loanId: loan.id, settlementAmount: 60000, reason: 'Invalid excess settlement' },
          underwriter
        )
      ).rejects.toThrow(/Settlement amount cannot exceed total outstanding/);
    });
  });

  // =========================================================================
  // SECTION 8: LOAN CLOSURE & NOC STATE INTEGRITY
  // =========================================================================
  describe('8. Loan Closure & NOC State Integrity', () => {
    it('prevents closure when outstanding balance remains > 0', async () => {
      const cust = await createCustomer({
        firstName: 'Rohit',
        lastName: 'Sharma',
        email: `rohit.noc.${Date.now()}@example.com`,
        mobile: '9876543224',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100555555555',
        bankIfsc: 'HDFC0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 80000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-NOC1-${Date.now()}` },
        financeOfficer
      );

      // Premature closure attempt with 80,000 balance must fail
      await expect(
        closeLoanAndIssueNoc(
          { loanId: loan.id, closureType: 'NORMAL_MATURITY', remarks: 'Attempted early closure' },
          financeOfficer
        )
      ).rejects.toThrow(/Cannot issue closure NOC. Outstanding balance remains/);
    });

    it('issues unique NOC upon valid zero-balance closure', async () => {
      const cust = await createCustomer({
        firstName: 'Jasprit',
        lastName: 'Bumrah',
        email: `jasprit.noc.${Date.now()}@example.com`,
        mobile: '9876543225',
        bankName: 'SBI',
        bankAccountNo: '30555555555',
        bankIfsc: 'SBIN0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 20000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-NOC2-${Date.now()}` },
        financeOfficer
      );

      // Settle loan to bring balance to 0
      await executeSettlement(
        { loanId: loan.id, settlementAmount: 20000, reason: 'Full early payoff' },
        underwriter
      );

      // Now issue NOC
      const closure = await closeLoanAndIssueNoc(
        { loanId: loan.id, closureType: 'EARLY_PREPAYMENT', remarks: 'Zero dues verified' },
        financeOfficer
      );

      expect(closure.nocNumber).toMatch(/^NOC-/);
      expect(closure.closureType).toBe('EARLY_PREPAYMENT');

      const closedLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(closedLoan?.status).toBe('CLOSED');
      expect(Number(closedLoan?.outstandingPrincipal)).toBe(0);
    });
  });

  // =========================================================================
  // SECTION 9: PARTIAL FAILURE TESTING & ROLLBACK VERIFICATION
  // =========================================================================
  describe('9. Partial Failure Simulation & Atomic Rollback', () => {
    it('guarantees clean rollback when an error occurs during multi-record transaction', async () => {
      const cust = await createCustomer({
        firstName: 'Test',
        lastName: 'Rollback',
        email: `test.rollback.${Date.now()}@example.com`,
        mobile: '9876543226',
      });

      const initialCustomerCount = await prisma.customer.count();
      const initialAddressCount = await prisma.customerAddress.count();

      // Simulate failure at step 2 of multi-record transaction
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.customer.create({
            data: {
              customerCode: `CUST-FAIL-${Date.now()}`,
              firstName: 'Fail',
              lastName: 'User',
              mobile: '9999999999',
            },
          });

          // Intentional thrown error
          throw new Error('Simulated database deadlock / network failure during transaction');
        })
      ).rejects.toThrow('Simulated database deadlock / network failure during transaction');

      // Verify zero orphan records created
      const finalCustomerCount = await prisma.customer.count();
      const finalAddressCount = await prisma.customerAddress.count();

      expect(finalCustomerCount).toBe(initialCustomerCount);
      expect(finalAddressCount).toBe(initialAddressCount);
    });
  });

  // =========================================================================
  // SECTION 10: CONCURRENCY, IDEMPOTENCY & BACKGROUND JOB SAFETY
  // =========================================================================
  describe('10. Concurrency, Webhook Safety & Background Worker', () => {
    it('handles concurrent identical payments idempotently without balance corruption', async () => {
      const cust = await createCustomer({
        firstName: 'Concurrent',
        lastName: 'Test',
        email: `concurrent.${Date.now()}@example.com`,
        mobile: '9876543227',
        bankName: 'HDFC',
        bankAccountNo: '50100777777777',
        bankIfsc: 'HDFC0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 50000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `DISB-CONC-${Date.now()}` },
        financeOfficer
      );

      const sharedKey = `CONC-KEY-${Date.now()}`;

      // Simulate concurrent requests with identical idempotency key
      const results = await Promise.allSettled([
        processPayment({ loanId: loan.id, amount: 5000, method: 'UPI', reference: 'REF-1', idempotencyKey: sharedKey }),
        processPayment({ loanId: loan.id, amount: 5000, method: 'UPI', reference: 'REF-2', idempotencyKey: sharedKey }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      // Follow up identical request returns the same payment record idempotently
      const idempotentPayment = await processPayment(
        { loanId: loan.id, amount: 5000, method: 'UPI', reference: 'REF-3', idempotencyKey: sharedKey },
        cust.userId!
      );
      expect(idempotentPayment.id).toBeDefined();

      // Verify exactly 1 payment record exists in database
      const payments = await prisma.payment.findMany({ where: { idempotencyKey: sharedKey } });
      expect(payments).toHaveLength(1);
    });

    it('processes background worker jobs safely with idempotency', async () => {
      const worker = WorkerService.getInstance();
      const testKey = `WORKER-KEY-${Date.now()}`;

      const job1 = await worker.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'RECONCILIATION_JOB',
        priority: 'HIGH',
        payload: { batchId: 'BATCH-001', matched: 100 },
        idempotencyKey: testKey,
      });

      expect(job1.id).toBeDefined();

      // Enqueue again with same key -> Returns existing job
      const job2 = await worker.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'RECONCILIATION_JOB',
        priority: 'HIGH',
        payload: { batchId: 'BATCH-001', matched: 100 },
        idempotencyKey: testKey,
      });

      expect(job2.id).toBe(job1.id);
    });

    it('webhook service rejects duplicate events through replay protection', async () => {
      const webhookService = WebhookService.getInstance();
      const eventId = `EVT-COMM-${Date.now()}`;

      // 1. First event succeeds
      const result1 = await webhookService.handleWebhook({
        providerId: 'communication_gateway',
        eventId,
        eventType: 'sms.delivered',
        rawBody: JSON.stringify({ event: 'sms.delivered', id: eventId }),
        headers: {},
        parsedData: { event: 'sms.delivered', id: eventId },
        receivedAt: new Date().toISOString(),
      });

      expect(result1.status).toBe('PROCESSED');
      expect(result1.acknowledged).toBe(true);

      // 2. Duplicate event detected
      const result2 = await webhookService.handleWebhook({
        providerId: 'communication_gateway',
        eventId,
        eventType: 'sms.delivered',
        rawBody: JSON.stringify({ event: 'sms.delivered', id: eventId }),
        headers: {},
        parsedData: { event: 'sms.delivered', id: eventId },
        receivedAt: new Date().toISOString(),
      });

      expect(result2.status).toBe('DUPLICATE');
      expect(result2.acknowledged).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 11: REALISTIC END-TO-END STATE JOURNEYS (JOURNEYS A -> F)
  // =========================================================================
  describe('11. Realistic End-to-End State Journeys (Journeys A -> F)', () => {
    // Journey A: Complete Happy Path
    it('Journey A: Happy Path (Customer -> KYC -> App -> Eligibility -> UW -> Disb -> Repay -> Close -> NOC)', async () => {
      // 1. Customer Creation
      const cust = await createCustomer({
        firstName: 'Aditya',
        lastName: 'Roy',
        email: `aditya.journeyA.${Date.now()}@example.com`,
        mobile: '9876543228',
        monthlyIncome: 120000,
        bankName: 'HDFC Bank',
        bankAccountNo: '50100888888888',
        bankIfsc: 'HDFC0001234',
        dateOfBirth: new Date('1990-05-15'),
      });
      expect(cust.status).toBe('DRAFT');

      // 2. KYC Verification
      const kyc = await updateKycStatus(cust.id, { kycStatus: 'VERIFIED', riskCategory: 'LOW' }, underwriter.id);
      expect(kyc.status).toBe('ACTIVE');

      // 3. Application Creation
      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Personal expenses',
      });
      expect(app.status).toBe('DRAFT');

      // 4. Eligibility Assessment
      const elig = await evaluateApplicationEligibility(app.id, loanOfficer.id);
      expect(elig.result).toBe('ELIGIBLE');

      // 5. Submit Application
      await transition(app.id, 'SUBMITTED', cust.email!);
      await transition(app.id, 'UNDERWRITING', loanOfficer.email);

      // 6. Underwriting Decision
      const uw = await submitUnderwritingDecision(
        app.id,
        { decision: 'APPROVE', reason: 'High credit score & low DTI ratio' },
        underwriter
      );
      expect(uw.decision).toBe('APPROVE');

      const approvedApp = await getApplication(app.id);
      expect(approvedApp.status).toBe('APPROVED');

      // 7. Disbursement
      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `JA-DISB-${Date.now()}` },
        financeOfficer
      );
      expect(loan.status).toBe('ACTIVE');

      // 8. Full Payoff (12 installments or single payoff)
      await executeSettlement(
        { loanId: loan.id, settlementAmount: 100000, reason: 'Full early principal payoff' },
        underwriter
      );

      // 9. Closure & NOC Generation
      const closure = await closeLoanAndIssueNoc(
        { loanId: loan.id, closureType: 'EARLY_PREPAYMENT', remarks: 'Journey A complete' },
        financeOfficer
      );
      expect(closure.nocNumber).toBeDefined();

      const finalLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(finalLoan?.status).toBe('CLOSED');
    });

    // Journey B: Rejection
    it('Journey B: Rejection Journey (Application -> Underwriting Rejection -> Blocked Disbursement)', async () => {
      const cust = await createCustomer({
        firstName: 'Brijesh',
        lastName: 'Mishra',
        email: `brijesh.journeyB.${Date.now()}@example.com`,
        mobile: '9876543229',
        monthlyIncome: 15000, // Very low income
      });

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 500000,
        tenureMonths: 24,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');

      // Underwriter Rejects
      await submitUnderwritingDecision(
        app.id,
        { decision: 'REJECT', reason: 'Debt obligations exceed underwriting threshold' },
        underwriter
      );

      const rejectedApp = await getApplication(app.id);
      expect(rejectedApp.status).toBe('REJECTED');

      // Attempted disbursement must be rejected
      await expect(
        executeDisbursement(
          { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: 'TXN-REJ-01' },
          financeOfficer
        )
      ).rejects.toThrow(/Cannot disburse loan application in status REJECTED/);
    });

    // Journey C: Delinquency Lifecycle
    it('Journey C: Delinquency Journey (Active Loan -> Delinquency -> Collection -> PTP -> Cure)', async () => {
      const cust = await createCustomer({
        firstName: 'Chandan',
        lastName: 'Jha',
        email: `chandan.journeyC.${Date.now()}@example.com`,
        mobile: '9876543230',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100444444444',
        bankIfsc: 'HDFC0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 30000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `JC-DISB-${Date.now()}` },
        financeOfficer
      );

      // Missed EMI triggers OVERDUE
      await prisma.loan.update({ where: { id: loan.id }, data: { status: 'OVERDUE' } });

      const colCase = await prisma.collectionCase.create({
        data: {
          caseNo: `CASE-JC-${Date.now()}`,
          loanId: loan.id,
          customerId: cust.id,
          dpd: 45,
          agingBucket: '31-60',
          overdueAmount: '5500.00',
          status: 'OPEN',
        },
      });

      // Record PTP
      await recordPromiseToPay(
        { caseId: colCase.id, promisedAmount: 5500, promisedDate: new Date(), paymentMode: 'UPI' },
        loanOfficer
      );

      // Payment clears overdue
      await processPayment({ loanId: loan.id, amount: 5500, method: 'UPI', reference: 'JC-PAY-01' });

      const resolved = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
      expect(resolved?.status).toBe('RESOLVED');
    });

    // Journey D: OTS Settlement Journey
    it('Journey D: OTS Journey (Active Loan -> Overdue -> Settlement Proposal -> Waiver -> Settled -> NOC)', async () => {
      const cust = await createCustomer({
        firstName: 'Deepak',
        lastName: 'Chopra',
        email: `deepak.journeyD.${Date.now()}@example.com`,
        mobile: '9876543231',
        bankName: 'ICICI Bank',
        bankAccountNo: '001105008888',
        bankIfsc: 'ICIC0000011',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 50000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');
      await transition(app.id, 'APPROVED');

      const loan = await executeDisbursement(
        { applicationId: app.id, disbursementMethod: 'IMPS', referenceNumber: `JD-DISB-${Date.now()}` },
        financeOfficer
      );

      // Execute OTS: Pay 35,000 to settle 50,000
      const settlement = await executeSettlement(
        { loanId: loan.id, settlementAmount: 35000, reason: 'Settlement under NBFC OTS scheme' },
        underwriter
      );

      expect(settlement.status).toBe('COMPLETED');
      expect(Number(settlement.waivedAmount)).toBe(15000);

      const closure = await closeLoanAndIssueNoc(
        { loanId: loan.id, closureType: 'SETTLEMENT', remarks: 'OTS closure' },
        financeOfficer
      );

      expect(closure.nocNumber).toBeDefined();
    });

    // Journey E: Failure Recovery
    it('Journey E: Failure Recovery (Failed step rolls back -> Retried operation succeeds with exact state)', async () => {
      const cust = await createCustomer({
        firstName: 'Eknath',
        lastName: 'Shinde',
        email: `eknath.journeyE.${Date.now()}@example.com`,
        mobile: '9876543232',
      });

      // Try update with invalid data that fails
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.customer.update({
            where: { id: cust.id },
            data: { status: 'ACTIVE' },
          });
          // Non-existent user relation throws foreign key constraint failure
          await tx.customer.update({
            where: { id: cust.id },
            data: { userId: 'non-existent-user-id-0000' },
          });
        })
      ).rejects.toThrow();

      // Verify customer status remains DRAFT after rollback
      const currentCust = await getCustomer(cust.id);
      expect(currentCust.status).toBe('DRAFT');

      // Retry with valid update succeeds cleanly
      const updated = await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);
      expect(updated.status).toBe('ACTIVE');
    });

    // Journey F: Concurrent Operations
    it('Journey F: Concurrency Journey (Parallel approvals/disbursements safely resolve to single transition)', async () => {
      const cust = await createCustomer({
        firstName: 'Farhan',
        lastName: 'Akhtar',
        email: `farhan.journeyF.${Date.now()}@example.com`,
        mobile: '9876543233',
        bankName: 'HDFC Bank',
        bankAccountNo: '50100333333333',
        bankIfsc: 'HDFC0001234',
      });

      await updateKycStatus(cust.id, { kycStatus: 'VERIFIED' }, underwriter.id);

      const app = await createApplication({
        customerId: cust.id,
        productId: defaultProduct.id,
        requestedAmount: 40000,
        tenureMonths: 6,
      });

      await transition(app.id, 'SUBMITTED');
      await transition(app.id, 'UNDERWRITING');

      // 2 parallel Underwriting decisions (one approve, one reject)
      const results = await Promise.allSettled([
        submitUnderwritingDecision(app.id, { decision: 'APPROVE', reason: 'Fast Approval' }, underwriter),
        submitUnderwritingDecision(app.id, { decision: 'APPROVE', reason: 'Duplicate Click' }, underwriter),
      ]);

      const successfulApprovals = results.filter((r) => r.status === 'fulfilled');
      expect(successfulApprovals.length).toBeGreaterThanOrEqual(1);

      // Verify application ended in APPROVED state
      const finalApp = await getApplication(app.id);
      expect(finalApp.status).toBe('APPROVED');
    });
  });
});
