import { prisma } from '../config/prisma';

async function main() {
  console.log('Searching for applications for royalharshi@gmail.com or Harshitha...');

  const royalCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: 'royalharshi@gmail.com' },
        { user: { email: 'royalharshi@gmail.com' } },
        { firstName: { contains: 'Harshitha', mode: 'insensitive' } },
      ],
    },
    include: {
      user: true,
      applications: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log('Royal Customer:', royalCustomer ? {
    id: royalCustomer.id,
    email: royalCustomer.email,
    firstName: royalCustomer.firstName,
    lastName: royalCustomer.lastName,
    branchId: royalCustomer.branchId,
    tenantId: (royalCustomer as any).tenantId,
    applicationsCount: royalCustomer.applications.length,
    applications: royalCustomer.applications.map(a => ({
      id: a.id,
      applicationNo: a.applicationNo,
      status: a.status,
      requestedAmount: a.requestedAmount,
      branchId: a.branchId,
      tenantId: (a as any).tenantId,
      createdAt: a.createdAt,
    })),
  } : 'NOT FOUND');

  // Also find all applications with status SUBMITTED or created today
  const recentApps = await prisma.loanApplication.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      customer: true,
      product: true,
    },
  });

  console.log('\nTop 10 Most Recent Applications in DB:');
  for (const app of recentApps) {
    console.log(`- #${app.applicationNo} [${app.status}] by ${app.customer?.firstName} ${app.customer?.lastName} (${app.customer?.email}) | Product: ${app.product?.name} | CreatedAt: ${app.createdAt.toISOString()} | Branch: ${app.branchId}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
