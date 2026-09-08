import { prisma } from '../config/prisma';

async function main() {
  const apps = await prisma.loanApplication.findMany({
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total apps: ${apps.length}`);
  const realApps: any[] = [];
  const testApps: any[] = [];

  for (const a of apps) {
    const email = (a.customer?.email || '').toLowerCase();
    const isTest = email.includes('example.com') || email.includes('uat.') || email.includes('perf.') || email.includes('test') || email.includes('journey');
    if (isTest) {
      testApps.push(a);
    } else {
      realApps.push(a);
    }
  }

  console.log(`Real applications (${realApps.length}):`);
  for (const r of realApps) {
    console.log(`- #${r.applicationNo} [${r.status}] ${r.customer?.firstName} ${r.customer?.lastName} (${r.customer?.email}) - ${r.createdAt.toISOString()}`);
  }

  console.log(`\nTest/Ephemeral script applications: ${testApps.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
