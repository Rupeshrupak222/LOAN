import argon2 from 'argon2';
import { prisma } from '../config/prisma';

const DEMO_PASSWORD = 'Passw0rd!123';

const STAFF_EMAILS = [
  'superadmin@adyapan.dev',
  'admin@adyapan.dev',
  'manager@adyapan.dev',
  'officer@adyapan.dev',
  'analyst@adyapan.dev',
  'underwriter@adyapan.dev',
  'finance@adyapan.dev',
  'collections@adyapan.dev',
  'auditor@adyapan.dev',
  'customer@adyapan.dev',
  'ravi.kumar@adyapan.dev',
  'priya.sharma@adyapan.dev',
  'amit.patel@adyapan.dev',
];

async function main() {
  console.log('Generating fresh argon2id hash for Passw0rd!123...');
  const newHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  for (const email of STAFF_EMAILS) {
    const updated = await prisma.user.updateMany({
      where: { email },
      data: {
        passwordHash: newHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });
    console.log(`Updated ${email}: ${updated.count} record(s)`);
  }

  // Double check verification
  console.log('\nVerifying login with Passw0rd!123:');
  for (const email of STAFF_EMAILS) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      const match = await argon2.verify(u.passwordHash, DEMO_PASSWORD);
      console.log(`- ${email}: match=${match}, status=${u.status}, failedAttempts=${u.failedLoginAttempts}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
