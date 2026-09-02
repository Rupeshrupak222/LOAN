import { prisma, connectDatabase, disconnectDatabase } from '../config/prisma';

async function resetDummyData() {
  console.log('Connecting to database...');
  await connectDatabase(10, 2000);
  console.log('Connected! Starting Dummy Data Cleanup...');

  // 1. Delete Loan-related dependent records
  await prisma.settlement.deleteMany({});
  await prisma.loanClosure.deleteMany({});
  await prisma.loanRestructure.deleteMany({});
  await prisma.collectionCase.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.disbursement.deleteMany({});
  await prisma.repaymentScheduleItem.deleteMany({});
  await prisma.loan.deleteMany({});
  console.log('Cleaned loan records.');

  // 2. Delete Application-related records
  await prisma.approvalRequest.deleteMany({});
  await prisma.underwritingDecision.deleteMany({});
  await prisma.riskAssessment.deleteMany({});
  await prisma.eligibilityAssessment.deleteMany({});
  await prisma.applicationStatusHistory.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.loanApplication.deleteMany({});
  console.log('Cleaned application records.');

  // 3. Delete Customer-related records
  await prisma.customerBankAccount.deleteMany({});
  await prisma.customerEmployment.deleteMany({});
  await prisma.customerAddress.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('Cleaned customer records.');

  // 4. Delete Loan Products
  const deletedProducts = await prisma.loanProduct.deleteMany({});
  console.log(`Deleted ${deletedProducts.count} loan products.`);

  console.log('--- Dummy Data Cleanup Completed Successfully ---');
}

resetDummyData()
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
