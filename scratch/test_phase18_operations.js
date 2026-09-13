/**
 * Phase 18: Operations Workspace & Application Operations End-to-End Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));
const { operationsService } = require(path.resolve(__dirname, '../backend/dist/modules/operations/operations.service'));
const { lifecycleService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/lifecycle.service'));
const { queueService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/queue.service'));
const { assignmentService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/assignment.service'));
const { taskService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/task.service'));
const { activityService } = require(path.resolve(__dirname, '../backend/dist/modules/core-lending/activity.service'));

async function runTests() {
  console.log('================================================================');
  console.log('🚀 PHASE 18: OPERATIONS WORKSPACE & APPLICATION OPERATIONS TESTS');
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
    // 1. Identify Test Environment & Tenant
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
    });
    if (!adminUser) {
      adminUser = await prisma.user.findFirst();
    }
    assert(!!adminUser, `Operations staff user loaded: ${adminUser.firstName} ${adminUser.lastName}`);

    let opsUser = await prisma.user.findFirst({
      where: {
        id: { not: adminUser.id },
        tenantId: tenant.id,
      },
    });
    if (!opsUser) {
      opsUser = adminUser;
    }

    let product = await prisma.loanProduct.findFirst({
      where: { tenantId: tenant.id },
    });
    if (!product) {
      product = await prisma.loanProduct.findFirst();
    }
    assert(!!product, `Loan product loaded: ${product.name} (${product.id})`);

    // 2. Test Operations Overview Metrics
    console.log('\nStep 2: Testing getOperationsOverview metrics...');
    const overview = await operationsService.getOperationsOverview(adminUser.id, tenant.id);
    assert(typeof overview.applicationsToday === 'number', `applicationsToday: ${overview.applicationsToday}`);
    assert(typeof overview.pendingApplications === 'number', `pendingApplications: ${overview.pendingApplications}`);
    assert(typeof overview.assignedToMe === 'number', `assignedToMe: ${overview.assignedToMe}`);
    assert(typeof overview.overdueTasks === 'number', `overdueTasks: ${overview.overdueTasks}`);
    assert(typeof overview.pendingDocuments === 'number', `pendingDocuments: ${overview.pendingDocuments}`);
    assert(typeof overview.requiresAction === 'number', `requiresAction: ${overview.requiresAction}`);
    assert(typeof overview.stageDistribution === 'object', `stageDistribution loaded`);
    assert(typeof overview.priorityDistribution === 'object', `priorityDistribution loaded`);

    // 3. Test Customer Directory & Customer 360
    console.log('\nStep 3: Testing Customer Directory & Customer 360 profile...');
    const customersList = await operationsService.listCustomers(
      { page: 1, pageSize: 10, search: '' },
      tenant.id
    );
    assert(Array.isArray(customersList.data) && customersList.data.length > 0, `Customers list returned ${customersList.data.length} records`);

    const testCust = customersList.data[0];
    const cust360 = await operationsService.getCustomer360(testCust.id, tenant.id);
    assert(cust360.customer.id === testCust.id, `Customer 360 loaded for: ${cust360.customer.firstName} ${cust360.customer.lastName} (${cust360.customer.customerCode})`);
    assert(Array.isArray(cust360.applications), `Customer applications count: ${cust360.applications.length}`);
    assert(Array.isArray(cust360.loans), `Customer active loans count: ${cust360.loans.length}`);
    assert(Array.isArray(cust360.documents), `Customer documents count: ${cust360.documents.length}`);

    // 4. Test Application Origination via Operations
    console.log('\nStep 4: Testing Application Origination via Operations...');
    const originatedApp = await operationsService.createApplication(
      {
        customerId: testCust.id,
        productId: product.id,
        requestedAmount: 175000,
        tenureMonths: 24,
        purpose: 'Operations Workspace Automated Intake Test',
        priority: 'HIGH',
        autoSubmit: false,
      },
      adminUser.id,
      tenant.id
    );
    assert(!!originatedApp && !!originatedApp.id, `Application originated successfully: ${originatedApp.applicationNo}`);
    assert(originatedApp.status === 'DRAFT', `Initial status is DRAFT`);
    assert(originatedApp.stage === 'LEAD', `Initial stage is LEAD`);

    // 5. Test Application Concurrency Protection
    console.log('\nStep 5: Testing Concurrency check and optimistic locking...');
    await operationsService.checkConcurrency(
      originatedApp.id,
      originatedApp.updatedAt.toISOString()
    );
    assert(true, 'Concurrency check passed for valid timestamp');

    // 6. Test Submission & Stage Transition
    console.log('\nStep 6: Testing Application Submission...');
    const submittedApp = await operationsService.submitApplication(
      originatedApp.id,
      adminUser.id,
      tenant.id
    );
    assert(submittedApp.status === 'SUBMITTED', `Application status is now ${submittedApp.status}`);
    assert(submittedApp.stage === 'APPLICATION_SUBMITTED', `Application stage transitioned to ${submittedApp.stage}`);

    // 7. Test Priority Update
    console.log('\nStep 7: Testing Priority Update...');
    const priorityUpdated = await operationsService.updatePriority(
      originatedApp.id,
      'URGENT',
      adminUser.id,
      tenant.id
    );
    assert(priorityUpdated.priority === 'URGENT', `Priority updated to ${priorityUpdated.priority}`);

    // 8. Test Queue & Assignment Operations
    console.log('\nStep 8: Testing Assignment and Queue routing...');
    const queuedApp = await queueService.routeApplicationToQueue(
      originatedApp.id,
      'OPERATIONS_QUEUE',
      adminUser.id,
      tenant.id
    );
    assert(!!queuedApp && !!queuedApp.queueId, `Application routed to Operations Queue: ${queuedApp.queueId}`);

    // 9. Test Team Queue Listing & Claim Action
    console.log('\nStep 9: Testing Team Queue listing & Claim action...');
    const teamQueue = await operationsService.getTeamQueue(
      { page: 1, pageSize: 20 },
      tenant.id
    );
    assert(Array.isArray(teamQueue.data), `Team queue returned ${teamQueue.data.length} items`);

    const claimedApp = await operationsService.claimQueueItem(
      originatedApp.id,
      adminUser.id,
      tenant.id
    );
    assert(claimedApp.assignedToUserId === adminUser.id, `Application successfully claimed by user ${adminUser.id}`);

    // 10. Test Task Creation & My Tasks Listing
    console.log('\nStep 10: Testing Task Creation & My Tasks listing...');
    const task = await taskService.createTask(
      {
        entityType: 'APPLICATION',
        entityId: originatedApp.id,
        taskType: 'DOCUMENT_VERIFICATION',
        title: 'Verify Bank Statement & Salary Slips',
        description: 'Check 6-month bank statement credits match stated income',
        priority: 'HIGH',
        assignedToUserId: adminUser.id,
        slaHours: 24,
      },
      adminUser.id,
      tenant.id
    );
    assert(!!task && task.title === 'Verify Bank Statement & Salary Slips', `Task created: ${task.id} (${task.title})`);

    const myTasks = await taskService.listTasks(
      { page: 1, limit: 20 },
      { assignedToUserId: adminUser.id, status: 'OPEN' },
      tenant.id
    );
    assert(Array.isArray(myTasks.data) && myTasks.data.some((t) => t.id === task.id), `My assigned tasks includes newly created task`);

    // Complete task
    const completedTask = await taskService.updateTaskStatus(
      task.id,
      'COMPLETED',
      adminUser.id,
      tenant.id
    );
    assert(completedTask.status === 'COMPLETED', `Task status transitioned to COMPLETED`);

    // 11. Test Document Verification
    console.log('\nStep 11: Testing Document Verification...');
    // Create or retrieve a test document
    let testDoc = await prisma.document.findFirst({
      where: { customerId: testCust.id },
    });
    if (!testDoc) {
      testDoc = await prisma.document.create({
        data: {
          customerId: testCust.id,
          applicationId: originatedApp.id,
          category: 'IDENTITY',
          documentType: 'PAN_CARD',
          fileName: 'pan_card_test.pdf',
          sizeBytes: 102400,
          contentType: 'application/pdf',
          storageKey: 'https://example.com/pan_card_test.pdf',
          status: 'PENDING',
        },
      });
    }

    const verifiedDoc = await operationsService.verifyDocument(
      testDoc.id,
      {
        status: 'VERIFIED',
        notes: 'Identity and PAN document verified against NSDL records',
      },
      adminUser.id,
      tenant.id
    );
    assert(verifiedDoc.status === 'VERIFIED', `Document status updated to ${verifiedDoc.status}`);

    // 12. Test Activity Timeline & Notes
    console.log('\nStep 12: Testing Activity Timeline Ledger & Note creation...');
    const noteActivity = await activityService.logActivity(
      {
        entityType: 'APPLICATION',
        entityId: originatedApp.id,
        activityType: 'NOTE',
        title: 'Operations Appraisal Note',
        message: 'Borrower KYC verified. Bank statements reflect steady ₹85,000 monthly income. Recommended for Credit Appraisal.',
        metadata: { verificationChannel: 'MANUAL_DESK' },
      },
      adminUser.id,
      tenant.id
    );
    assert(!!noteActivity && noteActivity.activityType === 'NOTE', `Activity note recorded: ${noteActivity.id}`);

    // 13. Test Application 360 Detail View
    console.log('\nStep 13: Testing Full Application 360 Detail API...');
    const app360 = await operationsService.getApplicationDetails(originatedApp.id, tenant.id);
    assert(app360.id === originatedApp.id, `Application 360 loaded: ${app360.applicationNo}`);
    assert(!!app360.customer, `Customer loaded in 360: ${app360.customer.firstName} ${app360.customer.lastName}`);
    assert(!!app360.product, `Product loaded in 360: ${app360.product.name}`);
    assert(Array.isArray(app360.tasks) && app360.tasks.length > 0, `Tasks loaded in 360 (${app360.tasks.length} tasks)`);
    assert(Array.isArray(app360.activityLogs) && app360.activityLogs.length > 0, `Activities loaded in 360 (${app360.activityLogs.length} activities)`);
    assert(Array.isArray(app360.statusHistory), `Status history loaded in 360 (${app360.statusHistory.length} records)`);

    console.log('\n================================================================');
    console.log(`🎉 ALL PHASE 18 OPERATIONS WORKSPACE TESTS PASSED! (${passed}/${total})`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
