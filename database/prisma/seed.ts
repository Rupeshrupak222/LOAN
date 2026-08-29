import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'LOAN_OFFICER',
  'CREDIT_ANALYST',
  'UNDERWRITER',
  'FINANCE_OFFICER',
  'COLLECTION_OFFICER',
  'BRANCH_MANAGER',
  'AUDITOR',
  'CUSTOMER',
];

const DEMO_PASSWORD = 'Passw0rd!123';

async function main() {
  console.log('Seeding Adyapan LMS...');

  // Roles
  const roleMap = new Map<string, string>();
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
    roleMap.set(name, role.id);
  }

  // Branch
  const branch = await prisma.branch.upsert({
    where: { code: 'HO' },
    update: {},
    create: { code: 'HO', name: 'Head Office', city: 'Mumbai', state: 'Maharashtra' },
  });

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // Clear employeeIds up front so re-seeding can reassign them without
  // hitting the unique constraint (P2002) when the mapping shifts.
  await prisma.user.updateMany({ data: { employeeId: null } });

  async function createUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    employeeId?: string,
  ) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { employeeId, firstName, lastName, passwordHash, status: 'ACTIVE', branchId: branch.id },
      create: {
        email,
        employeeId,
        firstName,
        lastName,
        passwordHash,
        status: 'ACTIVE',
        branchId: branch.id,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleMap.get(role)! } },
      update: {},
      create: { userId: user.id, roleId: roleMap.get(role)! },
    });
    return user;
  }

  // One demo user per role, each with distinct credentials.
  await createUser('superadmin@adyapan.dev', 'Super', 'Admin', 'SUPER_ADMIN', 'EMP001');
  await createUser('admin@adyapan.dev', 'System', 'Admin', 'ADMIN', 'EMP002');
  await createUser('manager@adyapan.dev', 'Meera', 'Nair', 'BRANCH_MANAGER', 'EMP003');
  await createUser('officer@adyapan.dev', 'Loan', 'Officer', 'LOAN_OFFICER', 'EMP004');
  await createUser('analyst@adyapan.dev', 'Anita', 'Rao', 'CREDIT_ANALYST', 'EMP005');
  await createUser('underwriter@adyapan.dev', 'Vikram', 'Shah', 'UNDERWRITER', 'EMP006');
  await createUser('finance@adyapan.dev', 'Farah', 'Khan', 'FINANCE_OFFICER', 'EMP007');
  await createUser('collections@adyapan.dev', 'Rahul', 'Verma', 'COLLECTION_OFFICER', 'EMP008');
  await createUser('auditor@adyapan.dev', 'Asha', 'Iyer', 'AUDITOR', 'EMP009');
  const customerUser = await createUser('customer@adyapan.dev', 'Ravi', 'Kumar', 'CUSTOMER');

  // Loan products
  const products = [
    { code: 'PL', name: 'Personal Loan', productType: 'PERSONAL', min: 10000, max: 1000000, minT: 6, maxT: 60, rate: 14.5 },
    { code: 'BL', name: 'Business Loan', productType: 'BUSINESS', min: 50000, max: 5000000, minT: 12, maxT: 84, rate: 16 },
    { code: 'EL', name: 'Education Loan', productType: 'EDUCATION', min: 25000, max: 2000000, minT: 12, maxT: 120, rate: 11 },
    { code: 'VL', name: 'Vehicle Loan', productType: 'VEHICLE', min: 50000, max: 2500000, minT: 12, maxT: 84, rate: 12.5 },
    { code: 'EML', name: 'Emergency Loan', productType: 'EMERGENCY', min: 5000, max: 200000, minT: 3, maxT: 24, rate: 18 },
  ];

  for (const p of products) {
    await prisma.loanProduct.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        productType: p.productType,
        minAmount: p.min.toFixed(2),
        maxAmount: p.max.toFixed(2),
        minTenureMonths: p.minT,
        maxTenureMonths: p.maxT,
        interestRate: p.rate.toFixed(3),
        interestMethod: 'REDUCING',
        processingFeePct: '1.000',
        lateFeePct: '2.000',
        gracePeriodDays: 5,
        isActive: true,
      },
    });
  }

  // Demo customer linked to customer user
  await prisma.customer.upsert({
    where: { customerCode: 'CUST-DEMO01' },
    update: {},
    create: {
      customerCode: 'CUST-DEMO01',
      userId: customerUser.id,
      branchId: branch.id,
      firstName: 'Ravi',
      lastName: 'Kumar',
      mobile: '9876543210',
      email: 'customer@adyapan.dev',
      city: 'Pune',
      state: 'Maharashtra',
      employmentType: 'SALARIED',
      employerName: 'Acme Corp',
      monthlyIncome: '85000.00',
      existingObligations: '12000.00',
      kycStatus: 'VERIFIED',
      riskCategory: 'LOW',
      status: 'KYC_VERIFIED',
    },
  });

  // Approval-limit setting (configurable, not hard-coded in code)
  await prisma.systemSetting.upsert({
    where: { key: 'approval_limits' },
    update: {},
    create: {
      key: 'approval_limits',
      category: 'approvals',
      value: [
        { maxAmount: 100000, chain: ['LOAN_OFFICER', 'BRANCH_MANAGER'] },
        { maxAmount: 500000, chain: ['BRANCH_MANAGER', 'UNDERWRITER'] },
        { maxAmount: null, chain: ['UNDERWRITER', 'SENIOR_APPROVER'] },
      ],
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'payment_allocation_order' },
    update: {},
    create: {
      key: 'payment_allocation_order',
      category: 'payments',
      value: ['FEES', 'PENALTY', 'INTEREST', 'PRINCIPAL'],
    },
  });

  console.log('Seed complete.');
  console.log(`Demo login password for all users: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
