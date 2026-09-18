const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const custs = await prisma.customer.findMany({
    include: { documents: true, applications: true },
  });
  console.log(`Found ${custs.length} customers.`);
  for (const c of custs) {
    console.log(`\n==============================================`);
    console.log(`Customer: ID=${c.id}, Name=${c.firstName} ${c.lastName}, Code=${c.customerCode}, Email=${c.email}`);
    console.log(`Total Docs: ${c.documents.length}, Applications: ${c.applications.length}`);
    for (const d of c.documents) {
      console.log(`  - Doc ID: ${d.id}`);
      console.log(`    Category: ${d.category} | Type: ${d.documentType}`);
      console.log(`    FileName: ${d.fileName} | StorageKey: ${d.storageKey}`);
      console.log(`    Status: ${d.status} | Verified: ${d.verified} | VerifiedBy: ${d.verifiedBy}`);
      console.log(`    AppId: ${d.applicationId} | CreatedAt: ${d.createdAt}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
