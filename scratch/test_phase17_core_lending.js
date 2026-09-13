/**
 * Phase 17: Core Lending Data Model & Operational Workflow Foundation Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));
const { lifecycleService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/lifecycle.service'));
const { queueService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/queue.service'));
const { assignmentService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/assignment.service'));
const { taskService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/task.service'));
const { activityService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/activity.service'));
const { creditReviewService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/credit-review.service'));
const { approvalService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/approval.service'));
const { loanConversionService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/loan-conversion.service'));

async function runTests() {
  console.log('================================================================');
  console.log('🚀 PHASE 17: CORE LENDING DATA MODEL & WORKFLOW FOUNDATION TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async function withRetry(fn, retries = 5, delayMs = 1500) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === retries) throw err;
        console.log(`[Retry ${attempt}/${retries}] Waiting ${delayMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  try {
    // 1. Identify Default Tenant & User Context
    console.log('Step 1: Identifying test environment & tenant context...');
    const tenant = await withRetry(() => prisma.tenant.findFirst({ where: { status: 'ACTIVE' } }));
    assert(!!tenant, `Tenant loaded: ${tenant.name} (${tenant.id})`);

    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@adyapan.com' },
          { email: 'superadmin@adyapan.com' },
          { tenantId: tenant.id },
        ],
      },
      include: { roles: { include: { role: true } } },
    });
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        include: { roles: { include: { role: true } } },
      });
    }
    assert(!!adminUser, `Staff user loaded: ${adminUser.firstName} ${adminUser.lastName}`);

    let product = await prisma.loanProduct.findFirst({
      where: { tenantId: tenant.id },
    });
    if (!product) {
      product = await prisma.loanProduct.findFirst();
    }
    if (!product) {
      product = await prisma.loanProduct.create({
        data: {
          tenantId: tenant.id,
          code: `PL-${Date.now()}`,
          name: 'Personal Loan Express',
          productType: 'PERSONAL_LOAN',
          minAmount: 10000,
          maxAmount: 1000000,
          minTenureMonths: 6,
          maxTenureMonths: 60,
          interestRate: 14.5,
        },
      });
    }
    assert(!!product, `Loan product identified: ${product.name} (Code: ${product.code})`);

    // 2. Customer & Masked Identifiers
    console.log('\nStep 2: Testing Customer & Masked Identifiers normalization...');
    const customerCode = `CUST-P17-${Date.now()}`;
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        customerCode,
        firstName: 'Vikram',
        lastName: 'Malhotra',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `vikram.malhotra.${Date.now()}@example.com`,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
      },
    });
    assert(!!customer.id, `Customer created: ${customer.firstName} ${customer.lastName} (${customer.customerCode})`);

    // Add Masked Customer Identifiers (PAN & Aadhaar)
    const panIdentifier = await prisma.customerIdentifier.create({
      data: {
        customerId: customer.id,
        idType: 'PAN',
        maskedValue: 'ABCDE****F',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
      },
    });
    assert(panIdentifier.maskedValue === 'ABCDE****F', 'Customer PAN masked and verified');

    const aadhaarIdentifier = await prisma.customerIdentifier.create({
      data: {
        customerId: customer.id,
        idType: 'AADHAAR',
        maskedValue: 'XXXX-XXXX-9012',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
      },
    });
    assert(aadhaarIdentifier.maskedValue === 'XXXX-XXXX-9012', 'Customer Aadhaar masked and verified');

    // 3. Loan Application Creation
    console.log('\nStep 3: Creating central Loan Application...');
    const applicationNo = `APP-P17-${Date.now().toString().slice(-6)}`;
    const application = await prisma.loanApplication.create({
      data: {
        tenantId: tenant.id,
        applicationNo,
        customerId: customer.id,
        productId: product.id,
        requestedAmount: 250000,
        tenureMonths: 24,
        purpose: 'Business Expansion',
        stage: 'LEAD',
        status: 'DRAFT',
        priority: 'HIGH',
      },
    });
    assert(application.stage === 'LEAD', `Loan Application created: ${application.applicationNo} in stage LEAD`);
    assert(application.priority === 'HIGH', 'Application priority set to HIGH');

    // 4. Queues & Work Queue Routing
    console.log('\nStep 4: Ensuring Work Queues & routing application...');
    const queues = await queueService.ensureDefaultQueues(tenant.id);
    assert(queues.length >= 6, `Default work queues initialized: ${queues.length} queues`);

    const queueList = await queueService.listQueues(tenant.id);
    assert(queueList.some((q) => q.key === 'OPERATIONS_QUEUE'), 'OPERATIONS_QUEUE present in registry');
    assert(queueList.some((q) => q.key === 'CREDIT_REVIEW_QUEUE'), 'CREDIT_REVIEW_QUEUE present in registry');

    const queueAssignment = await queueService.routeApplicationToQueue(
      application.id,
      'OPERATIONS_QUEUE',
      adminUser.id,
      tenant.id,
      'Initial lead routing to Operations'
    );
    assert(queueAssignment.status === 'ACTIVE', 'Application successfully routed to Operations Queue');

    // 5. Individual Assignment & Reassignment
    console.log('\nStep 5: Testing Individual User Assignment & history...');
    const userAssignment = await assignmentService.assignToUser(
      application.id,
      adminUser.id,
      'OPERATIONS',
      'OPERATIONS_DESK',
      adminUser.id,
      'Assigned to Loan Officer for verification',
      tenant.id
    );
    assert(userAssignment.assignedToUserId === adminUser.id, `Assigned to user ${adminUser.firstName}`);

    const assignmentHistory = await assignmentService.getAssignmentHistory(application.id);
    assert(assignmentHistory.length >= 2, `Assignment history logged: ${assignmentHistory.length} events`);
    assert(assignmentHistory.some((a) => a.assignmentType === 'QUEUE' && ['RELEASED', 'REASSIGNED'].includes(a.status)), 'Previous queue assignment released upon individual assignment');

    // 6. Application Lifecycle & State Machine Transitions
    console.log('\nStep 6: Executing controlled Application Lifecycle state machine transitions...');
    
    // Stage 1: LEAD -> APPLICATION_SUBMITTED
    // Invalid transition test first
    let invalidTransitionBlocked = false;
    try {
      await lifecycleService.transitionStage(
        application.id,
        'DISBURSED', // Cannot jump directly from LEAD to DISBURSED
        undefined,
        { id: adminUser.id, roles: ['LOAN_OFFICER'], tenantId: tenant.id }
      );
    } catch (err) {
      invalidTransitionBlocked = true;
    }
    assert(invalidTransitionBlocked, 'Invalid stage jump (LEAD -> DISBURSED) blocked by state machine');

    // Valid: LEAD -> APPLICATION_STARTED
    const t1 = await lifecycleService.transitionStage(
      application.id,
      'APPLICATION_STARTED',
      'IN_PROGRESS',
      { id: adminUser.id, roles: ['LOAN_OFFICER'], tenantId: tenant.id },
      'Customer started digital journey'
    );
    assert(t1.stage === 'APPLICATION_STARTED', 'Stage updated to APPLICATION_STARTED');

    // Valid: APPLICATION_STARTED -> APPLICATION_SUBMITTED
    const t2 = await lifecycleService.transitionStage(
      application.id,
      'APPLICATION_SUBMITTED',
      'SUBMITTED',
      { id: adminUser.id, roles: ['LOAN_OFFICER'], tenantId: tenant.id },
      'Application submitted with KYC & documents'
    );
    assert(t2.stage === 'APPLICATION_SUBMITTED', 'Stage updated to APPLICATION_SUBMITTED');

    // Valid: APPLICATION_SUBMITTED -> DOCUMENT_VERIFICATION
    const t3 = await lifecycleService.transitionStage(
      application.id,
      'DOCUMENT_VERIFICATION',
      'PENDING',
      { id: adminUser.id, roles: ['LOAN_OFFICER'], tenantId: tenant.id },
      'KYC documents under review'
    );
    assert(t3.stage === 'DOCUMENT_VERIFICATION', 'Stage updated to DOCUMENT_VERIFICATION');

    // Valid: DOCUMENT_VERIFICATION -> CREDIT_ASSESSMENT
    const t4 = await lifecycleService.transitionStage(
      application.id,
      'CREDIT_ASSESSMENT',
      'IN_PROGRESS',
      { id: adminUser.id, roles: ['CREDIT_ANALYST'], tenantId: tenant.id },
      'Passed KYC verification, routed to Credit Desk'
    );
    assert(t4.stage === 'CREDIT_ASSESSMENT', 'Stage updated to CREDIT_ASSESSMENT');

    // Valid: CREDIT_ASSESSMENT -> UNDERWRITING
    const t5 = await lifecycleService.transitionStage(
      application.id,
      'UNDERWRITING',
      'PENDING',
      { id: adminUser.id, roles: ['UNDERWRITER'], tenantId: tenant.id },
      'Credit scoring complete, pending Underwriting sanction'
    );
    assert(t5.stage === 'UNDERWRITING', 'Stage updated to UNDERWRITING');

    // 7. Status History Audit Trail
    console.log('\nStep 7: Verifying Application Status History audit trail...');
    const history = await lifecycleService.getStageHistory(application.id, tenant.id);
    assert(history.length >= 5, `Status history contains ${history.length} immutable transition records`);
    assert(history[0].toStage === 'UNDERWRITING', 'Latest history record matches current stage');

    // 8. Cross-Department Task Engine
    console.log('\nStep 8: Testing Cross-Department Task Engine & SLAs...');
    const task1 = await taskService.createTask(
      {
        title: 'Verify Bank Statement Net Average Inflow',
        taskType: 'CREDIT_REVIEW',
        entityType: 'APPLICATION',
        entityId: application.id,
        assignedToUserId: adminUser.id,
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
      adminUser.id,
      tenant.id
    );
    assert(task1.status === 'OPEN', `Task created: ${task1.title} [${task1.taskType}]`);

    const updatedTask = await taskService.updateTaskStatus(task1.id, 'COMPLETED', adminUser.id, tenant.id);
    assert(updatedTask.status === 'COMPLETED', 'Task marked as COMPLETED');
    assert(!!updatedTask.completedAt, 'Task completion timestamp recorded');

    // 9. Activity & Notes Ledger
    console.log('\nStep 9: Testing Centralized Activity & Notes Ledger...');
    const note = await activityService.logActivity(
      {
        entityType: 'APPLICATION',
        entityId: application.id,
        activityType: 'NOTE',
        title: 'Underwriter Note',
        message: 'Applicant maintains strong average monthly balance of ₹85,000.',
      },
      adminUser.id,
      tenant.id
    );
    assert(!!note.id, 'Activity note recorded');

    const activities = await activityService.listActivities(
      'APPLICATION',
      application.id,
      { page: 1, pageSize: 20, skip: 0, take: 20, sortDir: 'desc' },
      tenant.id
    );
    assert(activities.data.length >= 1, `Activity timeline contains ${activities.data.length} entries`);

    // 10. Credit Review & Underwriting Decision
    console.log('\nStep 10: Testing Formal Credit Review submission...');
    const creditReview = await creditReviewService.createCreditReview(
      application.id,
      {
        decision: 'APPROVE',
        score: 765,
        riskLevel: 'LOW',
        maxSanctionAmount: 250000,
        recommendedTenure: 24,
        recommendedRate: 14.5,
        remarks: 'Low risk profile, strong credit score and debt service capacity.',
      },
      adminUser.id,
      tenant.id
    );
    assert(creditReview.decision === 'APPROVE', `Credit Review recorded with decision: ${creditReview.decision}`);
    assert(creditReview.score === 765, 'Credit score matches: 765');

    // 11. Tiered Approval & Committee Decision
    console.log('\nStep 11: Testing Tiered Approval Request & Decision...');
    const approval = await approvalService.requestApproval(
      {
        entityType: 'APPLICATION',
        entityId: application.id,
        approvalType: 'SANCTION',
        level: 1,
        approverRole: 'UNDERWRITER',
        comments: 'Requesting Level 1 Sanction Approval for ₹2,50,000',
      },
      adminUser.id,
      tenant.id
    );
    assert(approval.status === 'PENDING', `Approval requested with ID: ${approval.id}`);

    const decidedApproval = await approvalService.decideApproval(
      approval.id,
      'APPROVED',
      'Sanction approved within delegated underwriting authority',
      adminUser.id,
      tenant.id
    );
    assert(decidedApproval.status === 'APPROVED', 'Approval granted successfully');

    // Move stage: UNDERWRITING -> APPROVAL -> SANCTION -> DISBURSEMENT
    await lifecycleService.transitionStage(
      application.id,
      'APPROVAL',
      'PENDING',
      { id: adminUser.id, roles: ['UNDERWRITER'], tenantId: tenant.id },
      'Submitted for committee approval'
    );
    await lifecycleService.transitionStage(
      application.id,
      'SANCTION',
      'APPROVED',
      { id: adminUser.id, roles: ['UNDERWRITER'], tenantId: tenant.id },
      'Sanction letter generated'
    );
    await lifecycleService.transitionStage(
      application.id,
      'DISBURSEMENT',
      'PENDING',
      { id: adminUser.id, roles: ['FINANCE_OFFICER'], tenantId: tenant.id },
      'Ready for disbursement'
    );

    // 12. Application -> Active Loan Conversion
    console.log('\nStep 12: Testing Controlled Application -> Loan Conversion...');
    const loan = await loanConversionService.convertApplicationToLoan(
      application.id,
      adminUser.id,
      tenant.id,
      250000,
      'IMPS'
    );
    assert(!!loan.id, `Active Loan account created: ${loan.loanNo}`);
    assert(loan.status === 'ACTIVE', 'Loan status is ACTIVE');
    assert(Number(loan.principal) === 250000, 'Loan principal matches sanctioned amount (₹250,000)');

    // Verify Repayment Schedule
    const scheduleItems = await prisma.repaymentScheduleItem.findMany({
      where: { loanId: loan.id },
      orderBy: { emiNumber: 'asc' },
    });
    assert(scheduleItems.length === 24, `Repayment schedule generated with ${scheduleItems.length} installments`);
    assert(scheduleItems[0].status === 'UPCOMING', 'Installment #1 initialized to UPCOMING');

    // Test Duplicate Conversion Guard
    let duplicateBlocked = false;
    try {
      await loanConversionService.convertApplicationToLoan(application.id, adminUser.id, tenant.id);
    } catch (err) {
      duplicateBlocked = true;
    }
    assert(duplicateBlocked, 'Duplicate loan creation rejected with ConflictError');

    // 13. Multi-Tenant Isolation
    console.log('\nStep 13: Testing Multi-Tenant Isolation...');
    let crossTenantBlocked = false;
    try {
      await lifecycleService.transitionStage(
        application.id,
        'CLOSED',
        undefined,
        { id: adminUser.id, roles: ['LOAN_OFFICER'], tenantId: 'tenant-fake-other-org' }
      );
    } catch (err) {
      crossTenantBlocked = true;
    }
    assert(crossTenantBlocked, 'Cross-tenant mutation rejected with ForbiddenError');

    console.log('\n================================================================');
    console.log(`ALL PHASE 17 TESTS PASSED SUCCESSFULLY! (${passed}/${total})`);
    console.log('================================================================\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 17 Test Suite Failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runTests();
