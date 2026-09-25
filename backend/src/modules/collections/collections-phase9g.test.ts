import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';
import { dpdService } from './dpd.service';
import {
  syncDelinquentCases,
  createManualCollectionCase,
  updateCollectionCaseStatus,
  resolveCollectionCase,
  closeCollectionCase,
  getCollectionCaseDetail,
  logCollectionActivity,
  recordPromiseToPay,
  getBorrowerSafeCollection,
  maskCustomerInfo,
} from './collection.service';
import { collectionPtpService } from './collection-ptp.service';
import { collectionAssignmentService } from './collection-assignment.service';
import { earlyWarningService } from '../early-warning/early-warning.service';
import { WarningRulesRegistry } from '../early-warning/warning-rules.registry';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Phase 9G: Real Collections + Early Warning + Delinquency Case Management', { timeout: 25000 }, () => {
  const tenantA = 'tenant-adyapan-alpha';

  const tenantB = 'tenant-adyapan-beta';
  const branchHO = 'branch-ho';
  const branchNorth = 'branch-north';

  let customerA: any;
  let customerB: any;
  let product: any;
  let collectorUser: any;

  beforeAll(async () => {
    await prisma.tenant.upsert({
      where: { id: tenantA },
      update: {},
      create: {
        id: tenantA,
        code: 'TENANT-ALPHA',
        name: 'Adyapan Alpha NBFC',
        contactEmail: 'alpha@adyapan.io',
      },
    });

    await prisma.tenant.upsert({
      where: { id: tenantB },
      update: {},
      create: {
        id: tenantB,
        code: 'TENANT-BETA',
        name: 'Adyapan Beta NBFC',
        contactEmail: 'beta@adyapan.io',
      },
    });
  });

  beforeEach(async () => {
    earlyWarningService.clearForTesting();


    // Create unique test customers
    const uniqueSuffix = Date.now().toString().slice(-6);
    customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-9G-${uniqueSuffix}-A`,
        firstName: 'Vikram',
        lastName: 'Malhotra',
        mobile: `98765${uniqueSuffix}`,
        email: `vikram.${uniqueSuffix}@example.com`,
        bankAccountNo: '987654321012',
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    });

    customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-9G-${uniqueSuffix}-B`,
        firstName: 'Ananya',
        lastName: 'Sharma',
        mobile: `98766${uniqueSuffix}`,
        email: `ananya.${uniqueSuffix}@example.com`,
        bankAccountNo: '123456789098',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    });


    // Create test product
    product = await prisma.loanProduct.create({
      data: {
        code: `PROD-9G-${uniqueSuffix}`,
        name: 'Personal Growth Loan',
        productType: 'PERSONAL',
        tenantId: tenantA,
        interestRate: 14.5,
        minAmount: 10000,
        maxAmount: 500000,
        minTenureMonths: 3,
        maxTenureMonths: 36,
      },
    });


    // Create collector user
    collectorUser = await prisma.user.create({
      data: {
        email: `collector.${uniqueSuffix}@adyapan.io`,
        passwordHash: 'hashed-password',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        tenantId: tenantA,
        status: 'ACTIVE',
      },
    });

  });

  it('1. should authoritatively source delinquency from loan schedule and derive DPD dynamically', async () => {
    const pastDueDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-DPD-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(50000),

        interestRate: 14.5,
        tenureMonths: 12,
        emiAmount: Money.toDb(4500),
        outstandingPrincipal: Money.toDb(50000),
        outstandingInterest: Money.toDb(4000),
        outstandingFees: 0,
        status: 'OVERDUE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: pastDueDate,
              principal: Money.toDb(4000),
              interest: Money.toDb(500),
              totalDue: Money.toDb(4500),
              paidAmount: 0,
              outstanding: Money.toDb(4500),
              status: 'OVERDUE',
            },
          ],
        },
      },
    });

    const dpdCalc = await dpdService.calculateLoanDpd(loan.id);

    expect(dpdCalc.isDelinquent).toBe(true);
    expect(dpdCalc.dpd).toBeGreaterThanOrEqual(34);
    expect(dpdCalc.agingBucket).toBe('31-60'); // SMA-1
    expect(dpdCalc.totalOverdueAmount).toBe(4500);

    // Synchronize into collection cases
    const syncedCount = await syncDelinquentCases({ tenantId: tenantA });
    expect(syncedCount).toBeGreaterThanOrEqual(1);

    const activeCase = await prisma.collectionCase.findFirst({
      where: { loanId: loan.id },
    });

    expect(activeCase).toBeDefined();
    expect(activeCase?.dpd).toBeGreaterThanOrEqual(34);
    expect(activeCase?.agingBucket).toBe('31-60');
    expect(Number(activeCase?.overdueAmount)).toBe(4500);
  });

  it('2. should enforce deterministic DPD bucket classifications across all delinquency tiers', () => {
    expect(dpdService.calculateAgingBucket(0)).toBe('0-30');
    expect(dpdService.calculateAgingBucket(15)).toBe('0-30');
    expect(dpdService.calculateAgingBucket(30)).toBe('0-30');
    expect(dpdService.calculateAgingBucket(31)).toBe('31-60'); // SMA-1
    expect(dpdService.calculateAgingBucket(60)).toBe('31-60');
    expect(dpdService.calculateAgingBucket(61)).toBe('61-90'); // SMA-2
    expect(dpdService.calculateAgingBucket(90)).toBe('61-90');
    expect(dpdService.calculateAgingBucket(91)).toBe('91-180'); // NPA Substandard
    expect(dpdService.calculateAgingBucket(180)).toBe('91-180');
    expect(dpdService.calculateAgingBucket(181)).toBe('180+'); // Doubtful / Loss
  });

  it('3. should prevent duplicate active collection cases for the same loan', async () => {
    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-DUP-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(25000),
        interestRate: 12.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(4300),
        outstandingPrincipal: Money.toDb(25000),
        outstandingInterest: Money.toDb(800),
        outstandingFees: 0,
        status: 'ACTIVE',
      },
    });

    const actor = { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_OFFICER'], tenantId: tenantA };

    // Create first manual collection case
    const case1 = await createManualCollectionCase({ loanId: loan.id, notes: 'First case initiated' }, actor);
    expect(case1).toBeDefined();
    expect(case1.status).toBe('OPEN');

    // Attempt to create second manual collection case for same loan
    await expect(
      createManualCollectionCase({ loanId: loan.id, notes: 'Duplicate case attempt' }, actor)
    ).rejects.toThrow(/already exists/i);
  });

  it('4. should enforce scope-aware case assignment, user validation, and anti-IDOR checks', async () => {
    const loanA = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-ASG-A-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(30000),
        interestRate: 14.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(5200),
        outstandingPrincipal: Money.toDb(30000),
        outstandingInterest: Money.toDb(1200),
        outstandingFees: 0,
        status: 'ACTIVE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-ASG-${Date.now()}`,
        loanId: loanA.id,
        customerId: customerA.id,
        dpd: 15,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(5200),
        status: 'OPEN',
      },
    });

    // 1. Assign to valid active collector in same tenant
    const actorA = { id: collectorUser.id, email: 'admin@adyapan.io', roles: ['ADMIN'], tenantId: tenantA };

    const assignment = await collectionAssignmentService.assignCase(
      {
        caseId: colCase.id,
        assignedToUserId: collectorUser.id,
        strategy: 'WORKLOAD_BALANCED',
        notes: 'Assigned for telephonic follow-up.',
      },
      actorA
    );

    expect(assignment.assignedToUserId).toBe(collectorUser.id);
    expect(assignment.strategy).toBe('WORKLOAD_BALANCED');

    const updatedCase = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
    expect(updatedCase?.assignedOfficerId).toBe(collectorUser.id);
    expect(updatedCase?.status).toBe('IN_PROGRESS');

    // 2. Anti-IDOR: Block officer from tenant B from accessing or assigning tenant A case
    const actorB = { id: 'officer-b', email: 'officer@tenantb.io', roles: ['COLLECTION_OFFICER'], tenantId: tenantB };
    await expect(
      collectionAssignmentService.assignCase(
        { caseId: colCase.id, assignedToUserId: collectorUser.id },
        actorB
      )
    ).rejects.toThrow(/Access forbidden/i);
  });

  it('5. should log customer contact interactions and preserve immutable timeline history', async () => {
    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-ACT-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(20000),
        interestRate: 15.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(3500),
        outstandingPrincipal: Money.toDb(20000),
        outstandingInterest: Money.toDb(1000),
        outstandingFees: 0,
        status: 'OVERDUE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-ACT-${Date.now()}`,
        loanId: loan.id,
        customerId: customerA.id,
        dpd: 10,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(3500),
        status: 'IN_PROGRESS',
      },
    });

    const actor = { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_OFFICER'], tenantId: tenantA };

    // Log contact interaction
    const activity = await logCollectionActivity(
      {
        caseId: colCase.id,
        activityType: 'CALL',
        outcome: 'CONTACTED',
        notes: 'Borrower explained delay due to delayed salary credit; agreed to pay by Friday.',
        nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      actor
    );

    expect(activity.id).toBeDefined();
    expect(activity.activityType).toBe('CALL');
    expect(activity.outcome).toBe('CONTACTED');

    // Retrieve case detail and verify timeline is populated and customer PII is masked
    const detail = await getCollectionCaseDetail(colCase.id, actor);
    expect(detail.timeline.length).toBeGreaterThanOrEqual(1);
    expect(detail.customer.bankAccountNo).toBe('*****1012'); // Masked bank account
  });


  it('6. should manage Promise to Pay (PTP) commitments without altering loan balance', async () => {
    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-PTP-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(40000),
        interestRate: 14.0,
        tenureMonths: 12,
        emiAmount: Money.toDb(3600),
        outstandingPrincipal: Money.toDb(40000),
        outstandingInterest: Money.toDb(3200),
        outstandingFees: 0,
        status: 'OVERDUE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-PTP-${Date.now()}`,
        loanId: loan.id,
        customerId: customerA.id,
        dpd: 12,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(3600),
        status: 'IN_PROGRESS',
      },
    });

    const actor = { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_OFFICER'], tenantId: tenantA };
    const promiseDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    const ptp = await recordPromiseToPay(
      {
        caseId: colCase.id,
        promisedAmount: 3600,
        promisedDate: promiseDate,
        paymentMode: 'UPI',
      },
      actor
    );

    expect(ptp.id).toBeDefined();
    expect(ptp.status).toBe('PENDING');
    expect(ptp.promisedAmount).toBe(3600);

    // Critical: PTP creation must NOT alter loan outstanding balance
    const freshLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
    expect(Number(freshLoan?.outstandingPrincipal) + Number(freshLoan?.outstandingInterest)).toBe(43200);
    expect(Number(freshLoan?.outstandingPrincipal)).toBe(40000);

    const freshCase = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
    expect(freshCase?.status).toBe('PROMISED');
  });

  it('7. should evaluate PTP on payment: mark KEPT upon sufficient payment remittance', async () => {
    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-PTPKEPT-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(30000),
        interestRate: 12.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(5200),
        outstandingPrincipal: Money.toDb(30000),
        outstandingInterest: Money.toDb(1200),
        outstandingFees: 0,
        status: 'OVERDUE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-PTPKEPT-${Date.now()}`,
        loanId: loan.id,
        customerId: customerA.id,
        dpd: 8,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(5200),
        status: 'PROMISED',
      },
    });

    const ptp = await prisma.promiseToPay.create({
      data: {
        caseId: colCase.id,
        promisedAmount: Money.toDb(5200),
        promisedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        recordedBy: collectorUser.email,
      },
    });

    // Simulate payment remittance of ₹5,200
    const evalResult = await collectionPtpService.evaluatePtpOnPayment({
      loanId: loan.id,
      paymentAmount: 5200,
      paymentReference: 'UTR-9G-5200',
    });

    expect(evalResult.evaluatedCount).toBe(1);
    expect(evalResult.fulfilledPtps).toContain(ptp.id);

    const freshPtp = await prisma.promiseToPay.findUnique({ where: { id: ptp.id } });
    expect(freshPtp?.status).toBe('KEPT');
  });

  it('8. should mark expired PTP as BROKEN, bump priority, and record case event', async () => {
    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-PTPBRK-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(25000),
        interestRate: 12.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(4300),
        outstandingPrincipal: Money.toDb(25000),
        outstandingInterest: Money.toDb(800),
        outstandingFees: 0,
        status: 'OVERDUE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-PTPBRK-${Date.now()}`,
        loanId: loan.id,
        customerId: customerA.id,
        dpd: 14,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(4300),
        status: 'PROMISED',
        priority: 'MEDIUM',
      },
    });

    // Create an expired PTP (promised yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredPtp = await prisma.promiseToPay.create({
      data: {
        caseId: colCase.id,
        promisedAmount: Money.toDb(4300),
        promisedDate: yesterday,
        status: 'PENDING',
        recordedBy: collectorUser.email,
      },
    });

    // Run PTP synchronizer
    const syncResult = await collectionPtpService.syncOverduePtps(tenantA);
    expect(syncResult.brokenCount).toBeGreaterThanOrEqual(1);

    const freshPtp = await prisma.promiseToPay.findUnique({ where: { id: expiredPtp.id } });
    expect(freshPtp?.status).toBe('BROKEN');

    const freshCase = await prisma.collectionCase.findUnique({ where: { id: colCase.id } });
    expect(freshCase?.status).toBe('IN_PROGRESS');
    expect(freshCase?.priority).toBe('HIGH');
  });

  it('9. should enforce strict gated case resolution validating zero overdue balance on schedule', async () => {
    const pastDueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const loanWithOverdue = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-RES-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(30000),
        interestRate: 12.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(5200),
        outstandingPrincipal: Money.toDb(30000),
        outstandingInterest: Money.toDb(1200),
        outstandingFees: 0,
        status: 'OVERDUE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: pastDueDate,
              principal: Money.toDb(4800),
              interest: Money.toDb(400),
              totalDue: Money.toDb(5200),
              paidAmount: 0,
              outstanding: Money.toDb(5200),
              status: 'OVERDUE',
            },
          ],
        },
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-RES-${Date.now()}`,
        loanId: loanWithOverdue.id,
        customerId: customerA.id,
        dpd: 10,
        agingBucket: '0-30',
        overdueAmount: Money.toDb(5200),
        status: 'IN_PROGRESS',
      },
    });

    const actor = { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_OFFICER'], tenantId: tenantA };

    // Attempting resolution with DUES_CLEARED must be REJECTED if schedule has unpaid dues
    await expect(
      resolveCollectionCase(colCase.id, { resolutionReason: 'DUES_CLEARED', notes: 'Borrower claims paid' }, actor)
    ).rejects.toThrow(/still has.*in overdue installments/i);

    // Administrative resolution is permitted
    const adminResolved = await resolveCollectionCase(
      colCase.id,
      { resolutionReason: 'ADMINISTRATIVE_RESOLUTION', notes: 'Dispute confirmed with bank statement.' },
      actor
    );
    expect(adminResolved.status).toBe('RESOLVED');

    // Case closure is allowed on resolved cases
    const closedCase = await closeCollectionCase(
      colCase.id,
      { closureReason: 'Administrative closure complete.' },
      { id: collectorUser.id, email: 'bm@adyapan.io', roles: ['BRANCH_MANAGER'], tenantId: tenantA }
    );

    expect(closedCase.status).toBe('CLOSED');
  });

  it('10. should evaluate early warning rules against servicing events and DPD triggers', async () => {
    const rules = WarningRulesRegistry.getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(12);

    // Test UPCOMING_EMI rule evaluation
    const upcomingRule = WarningRulesRegistry.getRule('UPCOMING_EMI');
    expect(upcomingRule).toBeDefined();

    const upcomingEval = upcomingRule?.evaluateEvent?.({
      eventId: 'evt-1',
      eventType: 'SERVICING_UPCOMING_EMI',
      entityType: 'LOAN',
      entityId: 'loan-123',
      occurredAt: new Date().toISOString(),
      source: 'Servicing Engine',
      correlationId: 'corr-1',
      severity: 'LOW',
      metadata: { daysUntilDue: 2, emiAmount: 4500, dueDate: '2026-09-22' },
    });

    expect(upcomingEval?.triggered).toBe(true);
    expect(upcomingEval?.evidence).toContain('INR 4,500 due in 2 days');

    // Test COLL_BROKEN_PTP rule evaluation
    const brokenPtpRule = WarningRulesRegistry.getRule('COLL_BROKEN_PTP');
    expect(brokenPtpRule).toBeDefined();

    const brokenEval = brokenPtpRule?.evaluateEvent?.({
      eventId: 'evt-2',
      eventType: 'PTP_BROKEN',
      entityType: 'COLLECTION_CASE',
      entityId: 'case-123',
      occurredAt: new Date().toISOString(),
      source: 'PTP Monitor',
      correlationId: 'corr-2',
      severity: 'HIGH',
      metadata: { promisedAmount: 5000, promisedDate: '2026-09-18' },
    });

    expect(brokenEval?.triggered).toBe(true);
    expect(brokenEval?.evidence).toContain('INR 5,000');
  });

  it('11. should provide sanitized borrower-safe collection summary without internal notes', async () => {
    const pastDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-9G-SAFE-${Date.now()}`,
        customerId: customerA.id,
        productId: product.id,
        tenantId: tenantA,
        principal: Money.toDb(20000),
        interestRate: 12.0,
        tenureMonths: 6,
        emiAmount: Money.toDb(3500),
        outstandingPrincipal: Money.toDb(20000),
        outstandingInterest: Money.toDb(1000),
        outstandingFees: 0,
        status: 'OVERDUE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: pastDueDate,
              principal: Money.toDb(3200),
              interest: Money.toDb(300),
              totalDue: Money.toDb(3500),
              paidAmount: 0,
              outstanding: Money.toDb(3500),
              status: 'OVERDUE',
            },
          ],
        },
      },
    });

    const borrowerSummary = await getBorrowerSafeCollection(loan.id);

    expect(borrowerSummary.loanId).toBe(loan.id);
    expect(borrowerSummary.isOverdue).toBe(true);
    expect(borrowerSummary.totalDueAmount).toBe(3500);
    expect(borrowerSummary.dpd).toBeGreaterThanOrEqual(4);
    expect(borrowerSummary.statusMessage).toContain('Your payment of ₹3500.00 is overdue');

    // Verify internal fields are omitted
    expect((borrowerSummary as any).priorityScore).toBeUndefined();
    expect((borrowerSummary as any).strategyPhase).toBeUndefined();
    expect((borrowerSummary as any).collectorNotes).toBeUndefined();
  });

  it('12. should enforce strict role boundaries: COLLECTION_OFFICER cannot modify credit terms or disburse funds', () => {
    const roles = ['COLLECTION_OFFICER'];

    // Allowed collection capabilities
    expect(rolePermissionService.hasPermission(roles, 'collection.view')).toBe(true);
    expect(rolePermissionService.hasPermission(roles, 'collection.queue.view')).toBe(true);
    expect(rolePermissionService.hasPermission(roles, 'collection.activity.create')).toBe(true);
    expect(rolePermissionService.hasPermission(roles, 'collection.promise.create')).toBe(true);

    // Forbidden core banking capabilities
    expect(rolePermissionService.hasPermission(roles, 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(roles, 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(roles, 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(roles, 'loan.modify_sanction')).toBe(false);
    expect(rolePermissionService.hasPermission(roles, 'accounting.journal.post')).toBe(false);
  });
});
