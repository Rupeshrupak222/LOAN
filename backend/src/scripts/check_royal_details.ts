import { prisma } from '../config/prisma';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'royalharshi@gmail.com' },
    include: {
      customer: {
        include: {
          applications: true,
          loans: true,
        },
      },
    },
  });

  console.log('royalharshi user record:');
  console.log(JSON.stringify(user, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
