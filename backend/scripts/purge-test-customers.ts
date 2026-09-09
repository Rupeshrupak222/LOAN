import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeTestCustomers() {
  console.log('Starting purge of test/dummy customers added during testing...');

  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { email: { endsWith: '@example.com' } },
        { email: { contains: '.example.com' } },
        { customerCode: { contains: 'TEST' } },
      ],
    },
    include: {
      applications: true,
      loans: true,
      documents: true,
      notifications: true,
      paymentSubmissions: true,
      collectionCases: true,
      user: true,
    },
  });

  console.log(`Identified ${testCustomers.length} test customers to purge:`);
  for (const c of testCustomers) {
    console.log(`- ${c.firstName} ${c.lastName} (${c.email}, ${c.customerCode})`);
  }

  for (const cust of testCustomers) {
    const customerId = cust.id;
    const userId = cust.userId;
    const appIds = cust.applications.map((a) => a.id);
    const loanIds = cust.loans.map((l) => l.id);

    console.log(`Purging records for ${cust.firstName} ${cust.lastName} (${customerId})...`);

    // 1. Delete loan-related child tables
    if (loanIds.length > 0) {
      await prisma.loanSchedule.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.payment.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.disbursement.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.restructuringProposal.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.settlementRequest.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.collectionCase.deleteMany({ where: { loanId: { in: loanIds } } });
      await prisma.loan.deleteMany({ where: { id: { in: loanIds } } });
    }

    // 2. Delete application-related child tables
    if (appIds.length > 0) {
      await prisma.disbursement.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.underwritingDecision.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.eligibilityAssessment.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.creditRiskAssessment.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.document.deleteMany({ where: { applicationId: { in: appIds } } });
      await prisma.loanApplication.deleteMany({ where: { id: { in: appIds } } });
    }

    // 3. Delete customer-level child tables
    await prisma.customerAddress.deleteMany({ where: { customerId } });
    await prisma.customerEmployment.deleteMany({ where: { customerId } });
    await prisma.customerBankAccount.deleteMany({ where: { customerId } });
    await prisma.document.deleteMany({ where: { customerId } });
    await prisma.notification.deleteMany({ where: { customerId } });
    await prisma.paymentSubmission.deleteMany({ where: { customerId } });
    await prisma.collectionCase.deleteMany({ where: { customerId } });

    // 4. Delete Audit Logs referencing customer or their apps/loans
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityId: customerId },
          { entityId: { in: appIds } },
          { entityId: { in: loanIds } },
        ],
      },
    });

    // 5. Delete Customer record
    await prisma.customer.delete({ where: { id: customerId } });

    // 6. Delete linked User record if any
    if (userId) {
      await prisma.userRole.deleteMany({ where: { userId } });
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  }

  console.log('✅ Purge complete! All test customers and their associated records have been completely deleted.');

  // List remaining customers
  const remaining = await prisma.customer.findMany({
    select: {
      id: true,
      customerCode: true,
      firstName: true,
      lastName: true,
      email: true,
      mobile: true,
    },
  });

  console.log(`\nRemaining actual customers in system (${remaining.length}):`);
  for (const r of remaining) {
    console.log(`- ${r.firstName} ${r.lastName} (${r.email}, Mobile: ${r.mobile}, Code: ${r.customerCode})`);
  }
}

purgeTestCustomers()
  .catch((err) => {
    console.error('Error during purge:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
