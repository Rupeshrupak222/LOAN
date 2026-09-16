import { prisma } from '../config/prisma';

async function purgeAllCustomerData() {
  console.log('🔄 Starting complete customer and loan transactional data purge...');

  try {
    // 1. Collections & Recovery
    console.log('Deleting collection activities, PTP, settlements, restructures, closures, and collection cases...');
    await prisma.collectionActivity.deleteMany();
    await prisma.promiseToPay.deleteMany();
    await prisma.loanRestructure.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.loanClosure.deleteMany();
    await prisma.collectionCase.deleteMany();

    // 2. Payments & Accounting Transactions
    console.log('Deleting payment allocations, submissions, transactions, payments, and repayment schedules...');
    await prisma.paymentAllocation.deleteMany();
    await prisma.paymentSubmission.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.repaymentScheduleItem.deleteMany();

    // 3. Disbursements
    console.log('Deleting disbursements...');
    await prisma.disbursement.deleteMany();

    // 4. Loans & Credit Reviews
    console.log('Deleting loans and credit reviews...');
    await prisma.loan.deleteMany();
    await prisma.creditReview.deleteMany();

    // 5. Approvals & Workflow History
    console.log('Deleting approvals, approval histories, and approval requests...');
    await prisma.approvalHistory.deleteMany();
    await prisma.approval.deleteMany();
    await prisma.approvalRequest.deleteMany();

    // 6. Underwriting & Assessments
    console.log('Deleting underwriting decisions, risk assessments, and eligibility assessments...');
    await prisma.underwritingDecision.deleteMany();
    await prisma.riskAssessment.deleteMany();
    await prisma.eligibilityAssessment.deleteMany();

    // 7. Applications, Assignments, Histories & Documents
    console.log('Deleting application assignments, application status histories, documents, and loan applications...');
    await prisma.applicationAssignment.deleteMany();
    await prisma.applicationStatusHistory.deleteMany();
    await prisma.document.deleteMany();
    await prisma.loanApplication.deleteMany();

    // 8. Customer Sub-records & Details
    console.log('Deleting customer addresses, employments, bank accounts, identifiers, consents, lifecycle histories, and reassessments...');
    await prisma.customerAddress.deleteMany();
    await prisma.customerEmployment.deleteMany();
    await prisma.customerBankAccount.deleteMany();
    await prisma.customerIdentifier.deleteMany();
    await prisma.customerConsent.deleteMany();
    await prisma.customerLifecycleHistory.deleteMany();
    await prisma.creditReassessment.deleteMany();

    // 9. Tasks, Notifications, WorkQueues, ActivityLogs & Customer records
    console.log('Deleting tasks, notifications, work queues, activity logs, and customer records...');
    await prisma.task.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.workQueue.deleteMany();
    await prisma.activityLog.deleteMany();

    const deletedCustomers = await prisma.customer.deleteMany();

    console.log(`\n======================================================`);
    console.log(`✅ SUCCESS: Complete customer data purge successful!`);
    console.log(`📊 Purged Customer records count: ${deletedCustomers.count}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('❌ Error during data purge:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

purgeAllCustomerData();
