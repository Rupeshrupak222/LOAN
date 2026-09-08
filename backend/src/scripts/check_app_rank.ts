import { prisma } from '../config/prisma';

async function main() {
  const submittedApps = await prisma.loanApplication.findMany({
    where: { status: 'SUBMITTED' },
    select: {
      id: true,
      applicationNo: true,
      createdAt: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total SUBMITTED applications: ${submittedApps.length}`);
  submittedApps.forEach((a, i) => {
    console.log(`${i + 1}. #${a.applicationNo} - ${a.customer.firstName} ${a.customer.lastName} (${a.customer.email}) - ${a.createdAt.toISOString()}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
