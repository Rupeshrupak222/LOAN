import Decimal from 'decimal.js';
import { prisma } from '../config/prisma';
import { dpdService } from '../modules/collections/dpd.service';
import { collectionStrategyService } from '../modules/collections/collection-strategy.service';
import { collectionAssignmentService } from '../modules/collections/collection-assignment.service';
import { collectionPtpService } from '../modules/collections/collection-ptp.service';
import { collectionEscalationService } from '../modules/collections/collection-escalation.service';
import { collectionSettlementService } from '../modules/collections/collection-settlement.service';
import { collectionWriteOffService } from '../modules/collections/collection-writeoff.service';
import { collectionAnalyticsService } from '../modules/collections/collection-analytics.service';
import {
  syncDelinquentCases,
  logCollectionActivity,
  getBorrowerSafeCollection,
  getPartnerSafeCollection,
  resolveCollectionCasesOnPayment,
} from '../modules/collections/collection.service';
import { generalLedgerService } from '../modules/finance/gl.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTestSuite() {
  console.log('====================================================================');
  console.log('🧪 PHASE 11: ADVANCED COLLECTIONS & RECOVERY ENGINE TEST SUITE');
  console.log('====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // Setup mock tenant & branch in database
  const tenant = await prisma.tenant.create({
    data: {
      code: `TNT-COL-${Date.now().toString().slice(-6)}`,
      name: 'Adyapan Test NBFC',
      contactEmail: `admin_${Date.now()}@adyapan.io`,
      status: 'ACTIVE',
      baseCurrency: 'INR',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      code: `BR-COL-${Date.now().toString().slice(-4)}`,
      name: 'Mumbai Central Recovery Hub',
      tenantId: tenant.id,
      city: 'Mumbai',
      state: 'Maharashtra',
    },
  });

  // Create Users for RBAC / SoD / Assignment
  const collectorUser = await prisma.user.create({
    data: {
      email: `collector_${Date.now()}@adyapan.io`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      firstName: 'Vikram',
      lastName: 'Collector',
      tenantId: tenant.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      email: `supervisor_${Date.now()}@adyapan.io`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      firstName: 'Priya',
      lastName: 'Supervisor',
      tenantId: tenant.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: `manager_${Date.now()}@adyapan.io`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      firstName: 'Anand',
      lastName: 'Manager',
      tenantId: tenant.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  // Create Customer & Loan Product
  const customer = await prisma.customer.create({
    data: {
      customerCode: `CUST-COL-${Date.now().toString().slice(-6)}`,
      firstName: 'Amit',
      lastName: 'Kumar',
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `amit.kumar_${Date.now()}@example.com`,
      tenantId: tenant.id,
    },
  });

  const product = await prisma.loanProduct.create({
    data: {
      code: `PROD-COL-${Date.now().toString().slice(-4)}`,
      name: 'Digital Personal Loan',
      productType: 'PERSONAL_LOAN',
      interestRate: 18.0,
      minTenureMonths: 6,
      maxTenureMonths: 24,
      minAmount: 10000,
      maxAmount: 200000,
      tenantId: tenant.id,
    },
  });

  // Create Delinquent Loan with Overdue Installments (45 DPD)
  const pastDueDate45 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const pastDueDate15 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const futureDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const testLoan = await prisma.loan.create({
    data: {
      loanNo: `LN-COL-${Date.now().toString().slice(-6)}`,
      customerId: customer.id,
      productId: product.id,
      tenantId: tenant.id,
      branchId: branch.id,
      principal: 60000,
      interestRate: 18.0,
      tenureMonths: 6,
      emiAmount: 10500,
      outstandingPrincipal: 60000,
      outstandingInterest: 3000,
      outstandingFees: 500,
      status: 'ACTIVE',
      schedule: {
        create: [
          {
            emiNumber: 1,
            dueDate: pastDueDate45,
            principal: 9500,
            interest: 1000,
            fees: 250,
            penaltyAmount: 300,
            totalDue: 11050,
            outstanding: 11050,
            paidAmount: 0,
            status: 'OVERDUE',
          },
          {
            emiNumber: 2,
            dueDate: pastDueDate15,
            principal: 9600,
            interest: 900,
            fees: 250,
            penaltyAmount: 150,
            totalDue: 10900,
            outstanding: 10900,
            paidAmount: 0,
            status: 'OVERDUE',
          },
          {
            emiNumber: 3,
            dueDate: futureDueDate,
            principal: 9700,
            interest: 800,
            fees: 0,
            penaltyAmount: 0,
            totalDue: 10500,
            outstanding: 10500,
            paidAmount: 0,
            status: 'UPCOMING',
          },
        ],
      },
    },
    include: { schedule: true },
  });

  // --------------------------------------------------------------------------
  // TEST 1: Deterministic DPD Engine & Aging Bucket Classification
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 1] Deterministic DPD Engine & Aging Bucket Classification');
  totalTests++;
  {
    // Test Aging Bucket mapping boundaries
    assert(dpdService.calculateAgingBucket(0) === '0-30', '0 DPD -> 0-30 bucket');
    assert(dpdService.calculateAgingBucket(15) === '0-30', '15 DPD -> 0-30 bucket');
    assert(dpdService.calculateAgingBucket(30) === '0-30', '30 DPD -> 0-30 bucket');
    assert(dpdService.calculateAgingBucket(31) === '31-60', '31 DPD -> 31-60 bucket');
    assert(dpdService.calculateAgingBucket(60) === '31-60', '60 DPD -> 31-60 bucket');
    assert(dpdService.calculateAgingBucket(61) === '61-90', '61 DPD -> 61-90 bucket');
    assert(dpdService.calculateAgingBucket(90) === '61-90', '90 DPD -> 61-90 bucket');
    assert(dpdService.calculateAgingBucket(91) === '91-180', '91 DPD -> 91-180 bucket');
    assert(dpdService.calculateAgingBucket(180) === '91-180', '180 DPD -> 91-180 bucket');
    assert(dpdService.calculateAgingBucket(181) === '180+', '181 DPD -> 180+ bucket');

    // Authoritative DPD calculation for test loan
    const dpdCalc = await dpdService.calculateLoanDpd(testLoan.id);
    assert(dpdCalc.dpd >= 44 && dpdCalc.dpd <= 46, `DPD calculated from oldest overdue schedule (~45 days, got ${dpdCalc.dpd})`);
    assert(dpdCalc.agingBucket === '31-60', `Bucket correctly determined as 31-60 (got ${dpdCalc.agingBucket})`);
    assert(dpdCalc.isDelinquent === true, 'Loan marked as delinquent');
    assert(dpdCalc.overdueInstallmentsCount === 2, 'Two installments flagged overdue');
    assert(dpdCalc.totalOverdueAmount === 21950, `Total overdue amount matches 11050 + 10900 = 21950 (got ${dpdCalc.totalOverdueAmount})`);
    assert(dpdCalc.oldestInstallmentNumber === 1, 'Oldest overdue installment identified as EMI #1');

    passedTests++;
    console.log('  🎉 Test 1 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Factor Collection Strategy & Priority Scoring Engine (0–100)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 2] Multi-Factor Collection Strategy & Priority Scoring Engine (0–100)');
  totalTests++;
  {
    // Profile A: Mild Delinquency (Low DPD, Grade A)
    const scoreA = collectionStrategyService.calculatePriorityScore({
      dpd: 5,
      overdueAmount: 3000,
      riskGrade: 'A',
      brokenPtpCount: 0,
      failedContactsCount: 0,
    });
    assert(scoreA.score < 40, `Mild delinquency yields modest score (${scoreA.score})`);
    assert(scoreA.band === 'LOW', `Categorized as LOW priority band (${scoreA.band})`);
    assert(scoreA.strategyPhase === 'REMINDER', `Recommended phase is REMINDER (${scoreA.strategyPhase})`);

    // Profile B: Mid Delinquency (DPD 45, Grade C)
    const scoreB = collectionStrategyService.calculatePriorityScore({
      dpd: 45,
      overdueAmount: 22000,
      riskGrade: 'C',
      brokenPtpCount: 0,
    });
    assert(scoreB.band === 'HIGH', `45 DPD categorized into HIGH priority band (${scoreB.band})`);
    assert(scoreB.strategyPhase === 'COLLECTOR_ASSIGNMENT', `Recommended phase is COLLECTOR_ASSIGNMENT (${scoreB.strategyPhase})`);

    // Profile C: Severe / Critical Delinquency (DPD 85, Grade E, 3 broken PTPs, High Risk Fraud)
    const scoreC = collectionStrategyService.calculatePriorityScore({
      dpd: 85,
      overdueAmount: 75000,
      riskGrade: 'E',
      fraudOutcome: 'HIGH_RISK',
      brokenPtpCount: 3,
      failedContactsCount: 4,
    });
    assert(scoreC.score >= 80, `High risk factors produce critical score (${scoreC.score})`);
    assert(scoreC.band === 'CRITICAL', `Critical band identified (${scoreC.band})`);
    assert(scoreC.strategyPhase === 'ESCALATED_COLLECTION' || scoreC.strategyPhase === 'RECOVERY_LEGAL_REVIEW', `Recommended phase is escalated/recovery (${scoreC.strategyPhase})`);

    passedTests++;
    console.log('  🎉 Test 2 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Strategy Configuration Versioning & Lifecycle Management
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 3] Strategy Configuration Versioning & Lifecycle Management');
  totalTests++;
  {
    const initialStrategy = collectionStrategyService.getActiveStrategy(tenant.id);
    assert(initialStrategy.status === 'ACTIVE', 'Active strategy retrieved');

    // Create a new strategy draft
    const draft = collectionStrategyService.createStrategy({
      tenantId: tenant.id,
      name: 'Custom High-Touch NBFC Strategy',
      description: 'Dedicated outreach strategy with accelerated collector assignment.',
      priorityWeights: {
        dpdWeight: 0.40,
        overdueAmountWeight: 0.30,
        riskGradeWeight: 0.10,
        brokenPtpWeight: 0.10,
        contactabilityWeight: 0.10,
      },
      createdBy: managerUser.email,
    });

    assert(draft.status === 'DRAFT', 'New strategy created in DRAFT status');
    assert(draft.name === 'Custom High-Touch NBFC Strategy', 'Strategy name preserved');

    // Activate the new strategy
    const activated = collectionStrategyService.activateStrategy(draft.id);
    assert(activated.status === 'ACTIVE', 'Draft strategy successfully activated');

    // Verify active strategy lookup matches new strategy
    const currentActive = collectionStrategyService.getActiveStrategy(tenant.id);
    assert(currentActive.id === draft.id, 'Active strategy points to newly activated strategy');

    // Verify strategy list
    const strategies = collectionStrategyService.listStrategies(tenant.id);
    assert(strategies.length >= 1, 'Strategies listed for tenant');

    passedTests++;
    console.log('  🎉 Test 3 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Work Queues, Auto-Assignment & Capacity Management
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 4] Work Queues, Auto-Assignment & Capacity Management');
  totalTests++;
  {
    // 1. Synchronize loans to create collection cases
    const syncedCount = await syncDelinquentCases({
      id: managerUser.id,
      email: managerUser.email,
      roles: ['SUPER_ADMIN'],
      tenantId: tenant.id,
    });
    assert(syncedCount >= 1, `Delinquent cases synchronized from loan schedule (synced: ${syncedCount})`);

    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });
    assert(colCase.dpd >= 44, `Collection case DPD synchronized: ${colCase.dpd}`);
    assert(colCase.agingBucket === '31-60', 'Collection case agingBucket matches');

    // 2. Assign case to collector
    const assignment = await collectionAssignmentService.assignCase(
      {
        caseId: colCase.id,
        assignedToUserId: collectorUser.id,
        strategy: 'MANUAL',
        notes: 'Initial allocation for phone recovery',
      },
      { id: managerUser.id, email: managerUser.email, roles: ['SUPER_ADMIN'], tenantId: tenant.id }
    );

    assert(assignment.assignedToUserId === collectorUser.id, 'Collector assigned to case');
    assert(assignment.status === 'ASSIGNED', 'Assignment record in ASSIGNED status');

    // Verify case in database
    const updatedCase = await prisma.collectionCase.findUniqueOrThrow({
      where: { id: colCase.id },
    });
    assert(updatedCase.assignedOfficerId === collectorUser.id, 'Case assignedOfficerId updated in DB');
    assert(updatedCase.status === 'IN_PROGRESS', 'Case status moved to IN_PROGRESS');

    // 3. Verify assignment history
    const history = collectionAssignmentService.getCaseAssignments(colCase.id);
    assert(history.length >= 1, 'Assignment history recorded and queryable');

    // 4. Test Auto-Assignment Batch
    const batchRes = await collectionAssignmentService.autoAssignCases(
      { tenantId: tenant.id, strategy: 'ROUND_ROBIN' },
      { id: managerUser.id, email: managerUser.email, roles: ['SUPER_ADMIN'], tenantId: tenant.id }
    );
    assert(typeof batchRes.assignedCount === 'number', 'Auto-assignment executed');

    passedTests++;
    console.log('  🎉 Test 4 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Contact Activity Logging & Activity Records
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 5] Contact History, Activity Logging & Audit Trail');
  totalTests++;
  {
    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });

    // 1. Log outbound phone call
    const activity1 = await logCollectionActivity(
      {
        caseId: colCase.id,
        activityType: 'CALL',
        outcome: 'CONTACTED',
        notes: 'Borrower confirmed EMI will be paid via UPI before Friday.',
        nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(activity1.activityType === 'CALL', 'Activity type CALL recorded');
    assert(activity1.outcome === 'CONTACTED', 'Activity outcome CONTACTED recorded');

    // 2. Log automated reminder SMS
    const activity2 = await logCollectionActivity(
      {
        caseId: colCase.id,
        activityType: 'SMS',
        outcome: 'CONTACTED',
        notes: 'Sent automated payment link to customer mobile.',
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );
    assert(activity2.activityType === 'SMS', 'Activity type SMS recorded');

    // 3. Verify activity query from database
    const allActivities = await prisma.collectionActivity.findMany({
      where: { caseId: colCase.id },
      orderBy: { createdAt: 'desc' },
    });
    assert(allActivities.length >= 2, `Collection activities saved to DB (count: ${allActivities.length})`);

    passedTests++;
    console.log('  🎉 Test 5 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Promise to Pay (PTP) Lifecycle & Broken PTP Detection Engine
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 6] Promise to Pay (PTP) Lifecycle & Broken PTP Automation');
  totalTests++;
  {
    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });

    // 1. Create active PTP with future date
    const futurePromiseDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    const ptp = await collectionPtpService.createPtp(
      {
        caseId: colCase.id,
        promisedAmount: 11050,
        promisedDate: futurePromiseDate,
        paymentMode: 'UPI',
        notes: 'Customer promised to pay Installment 1 via UPI.',
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(ptp.status === 'PENDING', 'PTP created in PENDING status');
    assert(ptp.promisedAmount === 11050, 'Promised amount is 11050');

    // Verify case status transitioned to PROMISED
    const promisedCase = await prisma.collectionCase.findUniqueOrThrow({
      where: { id: colCase.id },
    });
    assert(promisedCase.status === 'PROMISED', 'Case status transitioned to PROMISED');

    // 2. Create an overdue PTP to test broken PTP scanner
    const pastPromiseDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const expiredPtp = await prisma.promiseToPay.create({
      data: {
        caseId: colCase.id,
        promisedAmount: 5000,
        promisedDate: pastPromiseDate,
        paymentMode: 'NET_BANKING',
        status: 'PENDING',
        recordedBy: collectorUser.email,
      },
    });

    // 3. Run broken PTP sync batch job
    const syncRes = await collectionPtpService.syncOverduePtps(tenant.id);
    assert(syncRes.brokenCount >= 1, `Broken PTP scanner detected expired promises (count: ${syncRes.brokenCount})`);

    // Verify expired PTP marked BROKEN in DB
    const brokenRecord = await prisma.promiseToPay.findUniqueOrThrow({
      where: { id: expiredPtp.id },
    });
    assert(brokenRecord.status === 'BROKEN', 'Expired PTP marked BROKEN');

    // 4. List PTPs for case
    const casePtps = await collectionPtpService.listCasePtps(colCase.id);
    assert(casePtps.length >= 2, 'PTPs listed for case');

    passedTests++;
    console.log('  🎉 Test 6 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 7: Payment Engine Integration & Automated PTP Fulfillment / Loan Curing
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 7] Payment Engine Integration & Automated PTP Fulfillment / Loan Curing');
  totalTests++;
  {
    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });

    // Test automatic PTP evaluation upon payment arrival
    const evalRes = await collectionPtpService.evaluatePtpOnPayment({
      loanId: testLoan.id,
      paymentAmount: 11050,
      paymentReference: 'PAY-PTP-EVAL-001',
    });

    assert(evalRes.evaluatedCount >= 1, 'Active PTP evaluated on payment arrival');
    assert(evalRes.fulfilledPtps.length >= 1, 'PTP marked KEPT upon receiving full promised payment');

    // Test resolving / curing delinquent collection case when schedule is fully cleared
    // Mark schedule items as PAID
    await prisma.repaymentScheduleItem.updateMany({
      where: { loanId: testLoan.id },
      data: { status: 'PAID', outstanding: 0, paidAmount: 10500 },
    });

    await resolveCollectionCasesOnPayment(testLoan.id);

    const curedCase = await prisma.collectionCase.findUniqueOrThrow({
      where: { id: colCase.id },
    });
    assert(curedCase.status === 'RESOLVED', 'Collection case automatically RESOLVED when loan schedule is cured');
    assert(Number(curedCase.overdueAmount) === 0, 'Overdue amount reset to 0');
    assert(curedCase.dpd === 0, 'DPD reset to 0');

    passedTests++;
    console.log('  🎉 Test 7 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 8: Follow-up Task Management & SLA Tracking
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 8] Follow-up Task Management & SLA Tracking');
  totalTests++;
  {
    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });

    // 1. Create Follow-up task
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const followUp = await collectionEscalationService.createFollowUp(
      {
        caseId: colCase.id,
        dueDate,
        actionTitle: 'Verify Bank Mandate & Salary Credit',
        priority: 'HIGH',
        notes: 'Call customer to confirm NACH mandate activation.',
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(followUp.status === 'PENDING', 'Follow-up created with status PENDING');
    assert(followUp.actionTitle === 'Verify Bank Mandate & Salary Credit', 'Action title verified');

    // 2. Complete Follow-up task
    const completed = collectionEscalationService.completeFollowUp(
      followUp.id,
      'Mandate confirmed active by customer bank.',
      { email: collectorUser.email }
    );
    assert(completed.status === 'COMPLETED', 'Follow-up marked COMPLETED');
    assert(Boolean(completed.completedAt), 'Completed timestamp present');

    // 3. List follow-ups
    const followUps = collectionEscalationService.listFollowUps(colCase.id);
    assert(followUps.length >= 1, 'Follow-up listed for case');

    passedTests++;
    console.log('  🎉 Test 8 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 9: Multi-Tier Escalation Engine & SLA Governance
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 9] Multi-Tier Escalation Engine & Governance');
  totalTests++;
  {
    const colCase = await prisma.collectionCase.findFirstOrThrow({
      where: { loanId: testLoan.id },
    });

    // 1. Escalate case to Supervisor (Tier 2)
    const escalation = await collectionEscalationService.escalateCase(
      {
        caseId: colCase.id,
        triggerReason: 'Repeated non-contact and broken commitments over 30 days',
        toTier: 'TIER_2_SUPERVISOR',
        escalatedToUserId: supervisorUser.id,
        notes: 'Requesting supervisor intervention and field visit dispatch.',
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(escalation.toTier === 'TIER_2_SUPERVISOR', 'Escalated to TIER_2_SUPERVISOR');
    assert(escalation.status === 'PENDING', 'Escalation status is PENDING');

    // Verify case status updated to ESCALATED in DB
    const updatedCase = await prisma.collectionCase.findUniqueOrThrow({
      where: { id: colCase.id },
    });
    assert(updatedCase.status === 'ESCALATED', 'Case status set to ESCALATED');

    // 2. Resolve escalation
    const resolved = collectionEscalationService.resolveEscalation(
      escalation.id,
      'SUPERVISOR_INTERVENTION_COMPLETED',
      'Contact re-established with customer; revised repayment plan agreed.',
      { email: supervisorUser.email }
    );
    assert(resolved.status === 'RESOLVED', 'Escalation marked RESOLVED');

    // 3. List escalations
    const caseEscalations = collectionEscalationService.listEscalations(colCase.id);
    assert(caseEscalations.length >= 1, 'Escalation history retrieved');

    passedTests++;
    console.log('  🎉 Test 9 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 10: Controlled Debt Settlement / Waiver Dual Control & GL Integration
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 10] Controlled Debt Settlement Dual Control & GL Accounting Integration');
  totalTests++;
  {
    // Create delinquent loan for settlement test
    const settlementLoan = await prisma.loan.create({
      data: {
        loanNo: `LN-SETL-${Date.now().toString().slice(-6)}`,
        customerId: customer.id,
        productId: product.id,
        tenantId: tenant.id,
        branchId: branch.id,
        principal: 50000,
        interestRate: 18.0,
        tenureMonths: 6,
        emiAmount: 9000,
        outstandingPrincipal: 45000,
        outstandingInterest: 5000,
        outstandingFees: 1000,
        status: 'ACTIVE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
              principal: 45000,
              interest: 5000,
              fees: 1000,
              penaltyAmount: 2000,
              totalDue: 53000,
              outstanding: 53000,
              paidAmount: 0,
              status: 'OVERDUE',
            },
          ],
        },
      },
      include: { schedule: true },
    });

    const setlCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-SETL-${Date.now().toString().slice(-6)}`,
        loanId: settlementLoan.id,
        customerId: customer.id,
        dpd: 75,
        agingBucket: '61-90',
        overdueAmount: 53000,
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    // 1. Propose settlement (Maker)
    const proposed = await collectionSettlementService.proposeSettlement(
      {
        caseId: setlCase.id,
        proposedSettlementAmount: 40000,
        reason: 'Customer experienced business slowdown; verified with GST returns. Lump-sum settlement offered.',
        validityDays: 15,
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(proposed.status === 'PENDING_APPROVAL', 'Settlement proposed in PENDING_APPROVAL status');
    assert(proposed.proposedSettlementAmount === 40000, 'Proposed settlement amount ₹40,000');
    assert(proposed.proposedWaiverAmount === 12000, 'Proposed waiver amount ₹12,000');

    // 2. Segregation of Duties (SoD) Enforcement: Proposer cannot approve own request
    let makerCheckerBlocked = false;
    try {
      await collectionSettlementService.authorizeSettlement(
        proposed.id,
        'APPROVE',
        undefined,
        { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
      );
    } catch (err: any) {
      makerCheckerBlocked = true;
      assert(err.message.includes('Segregation of Duties') || err.message.includes('cannot approve'), 'SoD blocked proposer self-approval');
    }
    assert(makerCheckerBlocked === true, 'Maker-Checker SoD barrier verified');

    // 3. Authorized Supervisor approves settlement (Checker)
    const approved = await collectionSettlementService.authorizeSettlement(
      proposed.id,
      'APPROVE',
      undefined,
      { id: supervisorUser.id, email: supervisorUser.email, roles: ['COLLECTION_OFFICER'], tenantId: tenant.id }
    );
    assert(approved.status === 'APPROVED', 'Settlement successfully APPROVED by supervisor');

    // 4. Finalize settlement upon receiving agreed payment & verify GL posting
    const finalized = await collectionSettlementService.finalizeSettlementOnPayment({
      settlementId: approved.id,
      paymentAmount: 40000,
      paymentNo: 'PAY-SETL-FULL-001',
      actor: { email: managerUser.email },
    });
    assert(finalized.status === 'SETTLED', 'Settlement status is SETTLED');
    assert(Boolean(finalized.journalEntryId), 'GL Journal Entry ID attached to settled record');

    // Verify GL Journal Entry Balance Invariant
    if (finalized.journalEntryId) {
      const glJournal = generalLedgerService.getJournalEntry(finalized.journalEntryId);
      assert(Boolean(glJournal), 'GL Journal Entry found in General Ledger');
      if (glJournal) {
        assert(glJournal.totalDebit === glJournal.totalCredit, `GL Journal lines strictly balanced: Debits (₹${glJournal.totalDebit}) == Credits (₹${glJournal.totalCredit})`);
        assert(glJournal.totalDebit > 0, 'Non-zero waiver balance posted to GL');
        assert(glJournal.lines.some((l) => l.accountCode === '5030'), 'Bad Debts Expense (5030) debited');
        assert(glJournal.lines.some((l) => l.accountCode === '1020'), 'Loans Receivable (1020) credited');
      }
    }

    passedTests++;
    console.log('  🎉 Test 10 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 11: Controlled Debt Write-off Dual Control & GL Accounting Integration
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 11] Controlled Debt Write-off Dual Control & GL Accounting Integration');
  totalTests++;
  {
    // Create severely delinquent loan (120 DPD)
    const writeOffLoan = await prisma.loan.create({
      data: {
        loanNo: `LN-WO-${Date.now().toString().slice(-6)}`,
        customerId: customer.id,
        productId: product.id,
        tenantId: tenant.id,
        branchId: branch.id,
        principal: 30000,
        interestRate: 20.0,
        tenureMonths: 6,
        emiAmount: 5500,
        outstandingPrincipal: 30000,
        outstandingInterest: 3000,
        outstandingFees: 500,
        status: 'ACTIVE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
              principal: 30000,
              interest: 3000,
              fees: 500,
              penaltyAmount: 1500,
              totalDue: 35000,
              outstanding: 35000,
              paidAmount: 0,
              status: 'OVERDUE',
            },
          ],
        },
      },
      include: { schedule: true },
    });

    const woCase = await prisma.collectionCase.create({
      data: {
        caseNo: `CC-WO-${Date.now().toString().slice(-6)}`,
        loanId: writeOffLoan.id,
        customerId: customer.id,
        dpd: 120,
        agingBucket: '91-180',
        overdueAmount: 35000,
        status: 'LEGAL_REVIEW',
        priority: 'CRITICAL',
      },
    });

    // 1. Propose write-off (Maker)
    const woRequest = await collectionWriteOffService.proposeWriteOff(
      {
        caseId: woCase.id,
        reason: 'UNTRACEABLE_BORROWER',
        recoveryExhaustionSummary: 'Field visits completed 4 times; skip-tracing uncontactable; police FIR registered.',
      },
      { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
    );

    assert(woRequest.status === 'PENDING_APPROVAL', 'Write-off in PENDING_APPROVAL status');
    assert(woRequest.totalWriteOffAmount === 34500, 'Total write-off amount ₹34,500');

    // 2. SoD check on write-off self-approval
    let woSodBlocked = false;
    try {
      await collectionWriteOffService.authorizeWriteOff(
        woRequest.id,
        'APPROVE',
        undefined,
        { id: collectorUser.id, email: collectorUser.email, roles: ['COLLECTION_AGENT'], tenantId: tenant.id }
      );
    } catch (err: any) {
      woSodBlocked = true;
      assert(err.message.includes('Segregation of Duties') || err.message.includes('cannot approve'), 'SoD prevented write-off self-approval');
    }
    assert(woSodBlocked === true, 'Write-off SoD enforced');

    // 3. Manager approves write-off (Checker)
    const approvedWo = await collectionWriteOffService.authorizeWriteOff(
      woRequest.id,
      'APPROVE',
      undefined,
      { id: managerUser.id, email: managerUser.email, roles: ['SUPER_ADMIN'], tenantId: tenant.id }
    );
    assert(approvedWo.status === 'APPROVED', 'Write-off APPROVED by credit committee');
    assert(Boolean(approvedWo.journalEntryId), 'GL Journal Entry ID recorded');

    // 4. Verify Write-off GL Double-Entry Balance Invariant
    if (approvedWo.journalEntryId) {
      const glJournal = generalLedgerService.getJournalEntry(approvedWo.journalEntryId);
      assert(Boolean(glJournal), 'GL Write-Off Journal Entry found');
      if (glJournal) {
        assert(glJournal.totalDebit === glJournal.totalCredit, `Write-off GL strictly balanced: Debits (₹${glJournal.totalDebit}) == Credits (₹${glJournal.totalCredit})`);
        assert(glJournal.lines.some((l) => l.accountCode === '5030'), 'Debit to Bad Debts Expense (5030) verified');
        assert(glJournal.lines.some((l) => l.accountCode === '1020'), 'Credit to Loans Receivable (1020) verified');
      }
    }

    // 5. Verify Case status updated to WRITTEN_OFF
    const updatedWoCase = await prisma.collectionCase.findUniqueOrThrow({
      where: { id: woCase.id },
    });
    assert(updatedWoCase.status === 'WRITTEN_OFF', 'Collection Case status marked WRITTEN_OFF');

    passedTests++;
    console.log('  🎉 Test 11 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 12: Redacted Safe Views, RBAC & Delinquency Matrix Analytics
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 12] Redacted Safe Views, RBAC & Delinquency Matrix Analytics');
  totalTests++;
  {
    // 1. Borrower Safe View
    const borrowerSafeView = await getBorrowerSafeCollection(testLoan.id);
    assert(borrowerSafeView.loanId === testLoan.id, 'Borrower safe view generated');
    assert(typeof (borrowerSafeView as any).priorityScore === 'undefined', 'Internal priority score redacted from borrower view');
    assert(typeof (borrowerSafeView as any).fraudScore === 'undefined', 'Internal fraud score redacted from borrower view');
    assert(typeof (borrowerSafeView as any).internalNotes === 'undefined', 'Internal collector notes redacted from borrower view');
    assert(typeof borrowerSafeView.totalDueAmount === 'number', 'Total due amount present');
    assert(borrowerSafeView.paymentLinkAvailable === true, 'Phase 10 payment link enabled');

    // 2. Partner Safe View
    const partnerSafeView = await getPartnerSafeCollection(testLoan.id);
    assert(partnerSafeView.loanId === testLoan.id, 'Partner safe view generated');
    assert(typeof (partnerSafeView as any).collectorPhone === 'undefined', 'Collector PII redacted from partner view');
    assert(typeof partnerSafeView.overdueAmount === 'number', 'Overdue amount visible to partner');
    assert(typeof partnerSafeView.dpd === 'number', 'Authoritative DPD visible to partner');

    // 3. Delinquency Portfolio Overview Analytics
    const analytics = await collectionAnalyticsService.getPortfolioAnalytics({ tenantId: tenant.id });
    assert(typeof analytics.summary.totalOverdueAmount === 'number', 'Total overdue amount aggregated');
    assert(Array.isArray(analytics.agingBuckets), 'Aging bucket distribution generated');
    assert(Array.isArray(analytics.rollForwardMatrix), 'Roll-forward/roll-back matrix generated');

    // 4. Collector Scorecards
    const scorecards = await collectionAnalyticsService.getCollectorPerformance({ tenantId: tenant.id });
    assert(Array.isArray(scorecards), 'Collector scorecards generated');

    passedTests++;
    console.log('  🎉 Test 12 Passed!\n');
  }

  console.log('====================================================================');
  console.log(`🏆 ALL ${passedTests}/${totalTests} PHASE 11 INTEGRATION TEST SUITES PASSED PERFECTLY!`);
  console.log('====================================================================\n');
}

runTestSuite()
  .catch((err) => {
    console.error('❌ Phase 11 Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
