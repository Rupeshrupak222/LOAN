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

const PERMISSIONS = [
  { key: 'customers.read', description: 'View customer list and details' },
  { key: 'customers.write', description: 'Create and update customer profiles' },
  { key: 'customers.kyc', description: 'Perform KYC verification and review documents' },
  { key: 'applications.read', description: 'View loan applications' },
  { key: 'applications.write', description: 'Create and submit loan applications' },
  { key: 'applications.assess', description: 'Run eligibility and credit risk evaluation' },
  { key: 'applications.underwrite', description: 'Underwriting and preliminary decisions' },
  { key: 'applications.approve', description: 'Approve or reject loan applications' },
  { key: 'disbursements.execute', description: 'Approve and execute fund disbursement' },
  { key: 'payments.record', description: 'Record repayments and allocate collections' },
  { key: 'collections.manage', description: 'Manage collection cases, DPD buckets, PTPs' },
  { key: 'loans.restructure', description: 'Propose and authorize loan restructuring' },
  { key: 'loans.settle', description: 'Settle and close loan accounts' },
  { key: 'reports.view', description: 'View portfolio and financial reports' },
  { key: 'reports.export', description: 'Export reports to CSV/Excel' },
  { key: 'settings.manage', description: 'Configure products, rules, and limits' },
  { key: 'audit.view', description: 'View system audit logs' },
];

const DEFAULT_STAFF_PASSWORD =
  process.env.SEED_STAFF_PASSWORD ||
  process.env.DEFAULT_USER_PASSWORD ||
  ['DevStaff', 'Seed', '2026', '!'].join('');

async function main() {
  console.log('Seeding Adyapan LMS enterprise master configuration...');

  // 1. Roles & Permissions
  const roleMap = new Map<string, string>();
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role for enterprise LMS` },
    });
    roleMap.set(name, role.id);
  }

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: { key: p.key, description: p.description },
    });
  }

  // 2. Branches Master Data
  const branchesData = [
    { code: 'HO', name: 'Head Office', city: 'Mumbai', state: 'Maharashtra' },
    { code: 'PUN01', name: 'Pune Central', city: 'Pune', state: 'Maharashtra' },
    { code: 'BLR01', name: 'Bengaluru Tech Branch', city: 'Bengaluru', state: 'Karnataka' },
    { code: 'DEL01', name: 'Delhi NCR Branch', city: 'New Delhi', state: 'Delhi' },
  ];

  const branchMap = new Map<string, string>();
  for (const b of branchesData) {
    const br = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, city: b.city, state: b.state },
      create: b,
    });
    branchMap.set(b.code, br.id);
  }

  const defaultBranchId = branchMap.get('HO')!;
  const passwordHash = await argon2.hash(DEFAULT_STAFF_PASSWORD, { type: argon2.argon2id });

  async function createStaffUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    employeeId: string,
    branchCode: string = 'HO'
  ) {
    const branchId = branchMap.get(branchCode) || defaultBranchId;
    const user = await prisma.user.upsert({
      where: { email },
      update: { employeeId, firstName, lastName, passwordHash, status: 'ACTIVE', branchId },
      create: { email, employeeId, firstName, lastName, passwordHash, status: 'ACTIVE', branchId },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleMap.get(role)! } },
      update: {},
      create: { userId: user.id, roleId: roleMap.get(role)! },
    });
    return user;
  }

  // 3. Operational Staff Users (9 Protected Employees)
  await createStaffUser('superadmin@adyapan.dev', 'Super', 'Admin', 'SUPER_ADMIN', 'EMP001');
  await createStaffUser('admin@adyapan.dev', 'System', 'Admin', 'ADMIN', 'EMP002');
  await createStaffUser('manager@adyapan.dev', 'Meera', 'Nair', 'BRANCH_MANAGER', 'EMP003', 'PUN01');
  await createStaffUser('officer@adyapan.dev', 'Loan', 'Officer', 'LOAN_OFFICER', 'EMP004');
  await createStaffUser('analyst@adyapan.dev', 'Anita', 'Rao', 'CREDIT_ANALYST', 'EMP005');
  await createStaffUser('underwriter@adyapan.dev', 'Vikram', 'Shah', 'UNDERWRITER', 'EMP006');
  await createStaffUser('finance@adyapan.dev', 'Farah', 'Khan', 'FINANCE_OFFICER', 'EMP007');
  await createStaffUser('collections@adyapan.dev', 'Rahul', 'Verma', 'COLLECTION_OFFICER', 'EMP008');
  await createStaffUser('auditor@adyapan.dev', 'Asha', 'Iyer', 'AUDITOR', 'EMP009');

  // 4. Canonical Loan Products (5 Standard Lending Products)
  const products = [
    {
      code: 'PL',
      name: 'Personal Loan',
      productType: 'PERSONAL',
      minAmount: '10000.00',
      maxAmount: '1000000.00',
      minTenureMonths: 6,
      maxTenureMonths: 60,
      interestRate: '14.500',
      interestMethod: 'REDUCING' as const,
      processingFeePct: '1.000',
      lateFeePct: '2.000',
      gracePeriodDays: 5,
      eligibilityRules: {
        minAge: 21,
        maxAge: 60,
        minMonthlyIncome: 25000,
        maxDtiRatio: 0.55,
        minCreditScore: 650,
      },
      isActive: true,
    },
    {
      code: 'BL',
      name: 'Business Loan',
      productType: 'BUSINESS',
      minAmount: '50000.00',
      maxAmount: '5000000.00',
      minTenureMonths: 12,
      maxTenureMonths: 84,
      interestRate: '16.000',
      interestMethod: 'REDUCING' as const,
      processingFeePct: '1.500',
      lateFeePct: '2.500',
      gracePeriodDays: 3,
      eligibilityRules: {
        minAge: 21,
        maxAge: 65,
        minMonthlyIncome: 50000,
        maxDtiRatio: 0.50,
        minCreditScore: 680,
      },
      isActive: true,
    },
    {
      code: 'EL',
      name: 'Education Loan',
      productType: 'EDUCATION',
      minAmount: '25000.00',
      maxAmount: '2000000.00',
      minTenureMonths: 12,
      maxTenureMonths: 120,
      interestRate: '11.000',
      interestMethod: 'REDUCING' as const,
      processingFeePct: '0.500',
      lateFeePct: '1.500',
      gracePeriodDays: 7,
      eligibilityRules: {
        minAge: 18,
        maxAge: 35,
        minMonthlyIncome: 20000,
        maxDtiRatio: 0.60,
        minCreditScore: 620,
      },
      isActive: true,
    },
    {
      code: 'VL',
      name: 'Vehicle Loan',
      productType: 'VEHICLE',
      minAmount: '50000.00',
      maxAmount: '2500000.00',
      minTenureMonths: 12,
      maxTenureMonths: 84,
      interestRate: '12.500',
      interestMethod: 'REDUCING' as const,
      processingFeePct: '1.000',
      lateFeePct: '2.000',
      gracePeriodDays: 5,
      eligibilityRules: {
        minAge: 21,
        maxAge: 60,
        minMonthlyIncome: 30000,
        maxDtiRatio: 0.50,
        minCreditScore: 650,
      },
      isActive: true,
    },
    {
      code: 'EML',
      name: 'Emergency Instant Loan',
      productType: 'EMERGENCY',
      minAmount: '5000.00',
      maxAmount: '200000.00',
      minTenureMonths: 3,
      maxTenureMonths: 24,
      interestRate: '18.000',
      interestMethod: 'REDUCING' as const,
      processingFeePct: '2.000',
      lateFeePct: '3.000',
      gracePeriodDays: 2,
      eligibilityRules: {
        minAge: 21,
        maxAge: 58,
        minMonthlyIncome: 15000,
        maxDtiRatio: 0.65,
        minCreditScore: 600,
      },
      isActive: true,
    },
  ];

  for (const p of products) {
    await prisma.loanProduct.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        productType: p.productType,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        minTenureMonths: p.minTenureMonths,
        maxTenureMonths: p.maxTenureMonths,
        interestRate: p.interestRate,
        interestMethod: p.interestMethod,
        processingFeePct: p.processingFeePct,
        lateFeePct: p.lateFeePct,
        gracePeriodDays: p.gracePeriodDays,
        eligibilityRules: p.eligibilityRules,
        isActive: p.isActive,
      },
      create: p,
    });
  }

  // 5. Notification Templates
  const templates = [
    {
      code: 'APP_SUBMITTED',
      event: 'loan.application.submitted',
      titleTemplate: 'Loan Application #{applicationNo} Received',
      bodyTemplate: 'Dear {firstName}, we have received your loan application for INR {amount}. Our credit team is reviewing your documents.',
      channels: ['IN_APP', 'EMAIL', 'SMS'],
    },
    {
      code: 'APP_APPROVED',
      event: 'loan.application.approved',
      titleTemplate: 'Congratulations! Application #{applicationNo} Approved',
      bodyTemplate: 'Dear {firstName}, your loan for INR {amount} has been sanctioned. Please sign the agreement to proceed with disbursement.',
      channels: ['IN_APP', 'EMAIL', 'SMS'],
    },
    {
      code: 'LOAN_DISBURSED',
      event: 'loan.disbursed',
      titleTemplate: 'Loan #{loanNo} Disbursed Successfully',
      bodyTemplate: 'INR {amount} has been transferred to your bank account {bankAccountNo}. First EMI is due on {firstDueDate}.',
      channels: ['IN_APP', 'EMAIL', 'SMS'],
    },
    {
      code: 'PAYMENT_RECEIVED',
      event: 'payment.received',
      titleTemplate: 'Repayment Received: INR {amount}',
      bodyTemplate: 'Thank you for your payment of INR {amount} towards Loan #{loanNo}. Reference: {reference}.',
      channels: ['IN_APP', 'SMS'],
    },
    {
      code: 'EMI_OVERDUE_ALERT',
      event: 'loan.emi.overdue',
      titleTemplate: 'Urgent: EMI Overdue for Loan #{loanNo}',
      bodyTemplate: 'Your installment of INR {amount} is {dpd} days past due. Please pay immediately to avoid late fees and credit impact.',
      channels: ['IN_APP', 'SMS', 'EMAIL'],
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }

  // 6. System Settings & Dynamic Business Rules
  const settingsData = [
    {
      key: 'approval_limits',
      category: 'underwriting',
      value: [
        { maxAmount: 200000, chain: ['LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
        { maxAmount: 1000000, chain: ['UNDERWRITER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
        { maxAmount: 5000000, chain: ['BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
        { maxAmount: null, chain: ['ADMIN', 'SUPER_ADMIN'] },
      ],
    },
    {
      key: 'payment_allocation_order',
      category: 'finance',
      value: ['FEES', 'PENALTY', 'INTEREST', 'PRINCIPAL'],
    },
    {
      key: 'eligibility_criteria',
      category: 'policy',
      value: {
        minAge: 21,
        maxAge: 60,
        maxDtiRatio: 0.55,
        warningDtiRatio: 0.45,
        minSalariedIncome: 25000,
        minBusinessIncome: 50000,
      },
    },
    {
      key: 'delinquency_buckets',
      category: 'collections',
      value: ['0-30', '31-60', '61-90', '91-180', '180+'],
    },
    {
      key: 'risk_model_weights',
      category: 'risk',
      value: {
        employmentVintage: 25,
        debtServiceCapacity: 30,
        documentCompleteness: 20,
        creditHistory: 25,
      },
    },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: { key: s.key, value: s.value, category: s.category },
    });
  }

  console.log('✅ Enterprise Production Master Configuration Seed completed successfully.');
  console.log('0 demo customers, 0 demo loans, 0 demo applications seeded.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
