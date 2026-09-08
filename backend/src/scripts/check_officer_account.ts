import argon2 from 'argon2';
import { prisma } from '../config/prisma';

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
];

async function main() {
  for (const email of STAFF_EMAILS) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      console.log(`${email}: NOT FOUND`);
    } else {
      const p1 = await argon2.verify(u.passwordHash, 'Passw0rd!123').catch(() => false);
      const p2 = await argon2.verify(u.passwordHash, 'Password@123').catch(() => false);
      console.log(`${email}: status=${u.status}, failedAttempts=${u.failedLoginAttempts}, Passw0rd!123=${p1}, Password@123=${p2}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
