const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.document.findMany({ where: { fileName: 'logo adyapan.png' } }).then(docs => {
  console.log(docs);
  prisma.$disconnect();
});
