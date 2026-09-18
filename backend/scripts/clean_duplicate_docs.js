const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDocs() {
  const cust = await prisma.customer.findFirst({
    where: { customerCode: 'CUST-260916174360200001439' },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });

  if (!cust) {
    console.log('Customer not found');
    return;
  }

  console.log(`Found customer ${cust.firstName} with ${cust.documents.length} documents.`);

  // 1. Delete mock / duplicate docs that were generated or repeated
  // Keep only the most recent distinct document per category + documentType
  const seen = new Set();
  const toKeepIds = [];
  const toDeleteIds = [];

  for (const doc of cust.documents) {
    // Delete obvious mock files like 'mock/pan.pdf', 'mock/aadhaar.pdf', etc. if real ones exist
    if (doc.storageKey && doc.storageKey.startsWith('mock/')) {
      toDeleteIds.push(doc.id);
      continue;
    }

    const key = `${doc.category.toUpperCase().trim()}__${doc.documentType.toUpperCase().trim()}`;
    if (seen.has(key)) {
      toDeleteIds.push(doc.id);
    } else {
      seen.add(key);
      toKeepIds.push(doc.id);
    }
  }

  console.log(`Deleting ${toDeleteIds.length} duplicate/mock documents...`);
  if (toDeleteIds.length > 0) {
    await prisma.document.deleteMany({
      where: { id: { in: toDeleteIds } },
    });
  }

  // 2. Reset any SYSTEM_AI_VERIFICATION or auto-verified docs back to PENDING unless verified by a real human
  const autoVerifiedDocs = await prisma.document.updateMany({
    where: {
      verifiedBy: 'SYSTEM_AI_VERIFICATION',
    },
    data: {
      status: 'PENDING',
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
    },
  });
  console.log(`Reset ${autoVerifiedDocs.count} auto-verified documents back to PENDING.`);

  const remaining = await prisma.document.findMany({
    where: { customerId: cust.id },
  });
  console.log(`Remaining valid documents for customer: ${remaining.length}`);
  for (const d of remaining) {
    console.log(` - ${d.category} | ${d.documentType} | ${d.fileName} | Status: ${d.status} | VerifiedBy: ${d.verifiedBy}`);
  }
}

cleanDocs().catch(console.error).finally(() => prisma.$disconnect());
