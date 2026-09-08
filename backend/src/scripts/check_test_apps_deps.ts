import { prisma } from '../config/prisma';

async function main() {
  const testApps = await prisma.loanApplication.findMany({
    where: {
      customer: {
        OR: [
          { email: { contains: 'example.com' } },
          { email: { contains: 'uat.' } },
          { email: { contains: 'perf.' } },
        ]
      }
    },
    select: { id: true, applicationNo: true },
  });

  console.log(`Found ${testApps.length} test applications to clean up.`);

  const testAppIds = testApps.map(a => a.id);

  // Check how many loans point to them
  const loansCount = await prisma.loan.count({
    where: { applicationId: { in: testAppIds } }
  });
  console.log(`Loans linked to test applications: ${loansCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
