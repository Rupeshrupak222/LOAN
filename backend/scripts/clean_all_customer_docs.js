const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAll() {
  console.log('Cleaning all duplicate and mock documents across database...');
  
  // 1. Delete all mock docs that have storageKey starting with 'mock/' when non-mock docs exist
  const mockDocs = await prisma.document.findMany({
    where: { storageKey: { startsWith: 'mock/' } },
  });
  console.log(`Found ${mockDocs.length} mock docs.`);
  
  // Delete mock docs
  if (mockDocs.length > 0) {
    await prisma.document.deleteMany({
      where: { storageKey: { startsWith: 'mock/' } },
    });
    console.log(`Deleted ${mockDocs.length} mock docs.`);
  }

  // 2. For each customer, find any duplicate documents with the same category and documentType and keep only the latest one
  const customers = await prisma.customer.findMany({
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
    },
  });

  let totalDeleted = 0;
  for (const c of customers) {
    const seen = new Set();
    const toDelete = [];
    for (const d of c.documents) {
      const key = `${(d.category || '').toUpperCase().trim()}__${(d.documentType || '').toUpperCase().trim()}`;
      if (seen.has(key)) {
        toDelete.push(d.id);
      } else {
        seen.add(key);
      }
    }
    if (toDelete.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: toDelete } },
      });
      totalDeleted += toDelete.length;
    }
  }
  console.log(`Cleaned ${totalDeleted} duplicate document rows across all customers.`);

  // 3. Reset any SYSTEM_AI_VERIFICATION back to PENDING
  const resetRes = await prisma.document.updateMany({
    where: { verifiedBy: 'SYSTEM_AI_VERIFICATION' },
    data: {
      status: 'PENDING',
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
    },
  });
  console.log(`Reset ${resetRes.count} auto-verified documents to PENDING.`);
  console.log('Database cleanup completed successfully.');
}

cleanAll().catch(console.error).finally(() => prisma.$disconnect());
