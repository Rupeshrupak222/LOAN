const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ select: { email: true, roles: { include: { role: true } } } });
  console.log(JSON.stringify(users.filter(u => u.email.includes('customer')), null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
