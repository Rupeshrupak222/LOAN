import { prisma } from '../config/prisma';

async function main() {
  const app = await prisma.loanApplication.findFirst({
    where: {
      OR: [
        { applicationNo: 'APP-26097397' },
        { customer: { email: 'royalharshi@gmail.com' } }
      ]
    },
    include: { customer: true }
  });

  if (!app) {
    console.log('Harshitha application not found');
    return;
  }

  console.log(`Found application #${app.applicationNo} created at ${app.createdAt.toISOString()}`);
  const now = new Date();
  const updated = await prisma.loanApplication.update({
    where: { id: app.id },
    data: {
      createdAt: now,
      updatedAt: now,
      status: 'SUBMITTED',
    }
  });

  console.log(`Successfully bumped application #${updated.applicationNo} to current timestamp: ${updated.createdAt.toISOString()}`);
  await prisma.$disconnect();
}

main().catch(console.error);
