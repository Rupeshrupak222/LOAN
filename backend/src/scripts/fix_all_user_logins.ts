import argon2 from 'argon2';
import { prisma } from '../config/prisma';

async function main() {
  console.log('Fixing and synchronizing past user accounts and staff accounts...');

  const customerHash = await argon2.hash('Harshi@12345', { type: argon2.argon2id });
  const staffHash = await argon2.hash('Passw0rd!123', { type: argon2.argon2id });
  const borrowerHash = await argon2.hash('Borrower@12345', { type: argon2.argon2id });

  let customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { name: 'CUSTOMER', description: 'Self-service retail borrower customer role' },
    });
  }

  // 1. royalharshi@gmail.com
  const royalUser = await prisma.user.upsert({
    where: { email: 'royalharshi@gmail.com' },
    update: {
      passwordHash: customerHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: 'ACTIVE',
    },
    create: {
      email: 'royalharshi@gmail.com',
      firstName: 'Harshitha',
      lastName: 'Royal',
      passwordHash: customerHash,
      status: 'ACTIVE',
      roles: { create: { roleId: customerRole.id } },
    },
  });

  const existingRoyalCust = await prisma.customer.findFirst({ where: { email: 'royalharshi@gmail.com' } });
  if (existingRoyalCust) {
    await prisma.customer.update({
      where: { id: existingRoyalCust.id },
      data: { userId: royalUser.id },
    });
  } else {
    await prisma.customer.create({
      data: {
        email: 'royalharshi@gmail.com',
        firstName: 'Harshitha',
        lastName: 'Royal',
        mobile: '9302230596',
        customerCode: 'CUST-0099',
        kycStatus: 'VERIFIED',
        riskCategory: 'LOW',
        userId: royalUser.id,
      },
    });
  }

  // 2. sdwdew@gmail.com & sdew@gmail.com
  for (const email of ['sdwdew@gmail.com', 'sdew@gmail.com']) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: customerHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
      create: {
        email,
        firstName: 'Anjali Toppo',
        lastName: 'Anjali',
        passwordHash: customerHash,
        status: 'ACTIVE',
        roles: { create: { roleId: customerRole.id } },
      },
    });
    const c = await prisma.customer.findFirst({ where: { email } });
    if (c) {
      await prisma.customer.update({
        where: { id: c.id },
        data: { userId: u.id },
      });
    } else {
      await prisma.customer.create({
        data: {
          email,
          firstName: 'Anjali Toppo',
          lastName: 'Anjali',
          mobile: '7981286120',
          customerCode: email === 'sdew@gmail.com' ? 'CUST-0003' : 'CUST-0002',
          kycStatus: 'VERIFIED',
          riskCategory: 'LOW',
          userId: u.id,
        },
      });
    }
  }

  // 3. mdsharmapb07@gmail.com
  await prisma.user.upsert({
    where: { email: 'mdsharmapb07@gmail.com' },
    update: {
      passwordHash: customerHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: 'ACTIVE',
    },
    create: {
      email: 'mdsharmapb07@gmail.com',
      firstName: 'Dinesh',
      lastName: 'Sharma',
      passwordHash: customerHash,
      status: 'ACTIVE',
      roles: { create: { roleId: customerRole.id } },
    },
  });

  // 4. rohan.verma@example.com
  await prisma.user.updateMany({
    where: { email: 'rohan.verma@example.com' },
    data: {
      passwordHash: borrowerHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: 'ACTIVE',
    },
  });

  // 5. Staff demo accounts
  const staffList = [
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
  for (const email of staffList) {
    await prisma.user.updateMany({
      where: { email },
      data: {
        passwordHash: staffHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });
  }

  console.log('Synchronized accounts successfully.');
  await prisma.$disconnect();
}

main().catch(console.error);
