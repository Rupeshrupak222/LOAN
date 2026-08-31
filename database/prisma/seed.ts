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

const DEMO_PASSWORD = 'Passw0rd!123';

async function main() {
  console.log('Seeding Adyapan LMS enterprise data...');

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

  // 2. Branches
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
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  // Clear employeeIds first to prevent unique constraint conflict during re-seeding
  await prisma.user.updateMany({ data: { employeeId: null } });

  async function createUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    employeeId?: string,
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

  // 3. Demo Staff Users
  await createUser('superadmin@adyapan.dev', 'Super', 'Admin', 'SUPER_ADMIN', 'EMP001');
  await createUser('admin@adyapan.dev', 'System', 'Admin', 'ADMIN', 'EMP002');
  await createUser('manager@adyapan.dev', 'Meera', 'Nair', 'BRANCH_MANAGER', 'EMP003', 'PUN01');
  await createUser('officer@adyapan.dev', 'Loan', 'Officer', 'LOAN_OFFICER', 'EMP004');
  await createUser('analyst@adyapan.dev', 'Anita', 'Rao', 'CREDIT_ANALYST', 'EMP005');
  await createUser('underwriter@adyapan.dev', 'Vikram', 'Shah', 'UNDERWRITER', 'EMP006');
  await createUser('finance@adyapan.dev', 'Farah', 'Khan', 'FINANCE_OFFICER', 'EMP007');
  await createUser('collections@adyapan.dev', 'Rahul', 'Verma', 'COLLECTION_OFFICER', 'EMP008');
  await createUser('auditor@adyapan.dev', 'Asha', 'Iyer', 'AUDITOR', 'EMP009');

  // Customer portal users
  const custUser1 = await createUser('ravi.kumar@adyapan.dev', 'Ravi', 'Kumar', 'CUSTOMER');
  const custUser2 = await createUser('priya.sharma@adyapan.dev', 'Priya', 'Sharma', 'CUSTOMER');
  const custUser3 = await createUser('amit.patel@adyapan.dev', 'Amit', 'Patel', 'CUSTOMER');

  // 4. Loan Products
  const products = [
    {
      code: 'PL',
      name: 'Personal Loan',
      productType: 'PERSONAL',
      min: 10000,
      max: 1000000,
      minT: 6,
      maxT: 60,
      rate: 14.5,
      procFee: 1.0,
      lateFee: 2.0,
      grace: 5,
    },
    {
      code: 'BL',
      name: 'Business Loan',
      productType: 'BUSINESS',
      min: 50000,
      max: 5000000,
      minT: 12,
      maxT: 84,
      rate: 16.0,
      procFee: 1.5,
      lateFee: 2.5,
      grace: 3,
    },
    {
      code: 'EL',
      name: 'Education Loan',
      productType: 'EDUCATION',
      min: 25000,
      max: 2000000,
      minT: 12,
      maxT: 120,
      rate: 11.0,
      procFee: 0.5,
      lateFee: 1.5,
      grace: 7,
    },
    {
      code: 'VL',
      name: 'Vehicle Loan',
      productType: 'VEHICLE',
      min: 50000,
      max: 2500000,
      minT: 12,
      maxT: 84,
      rate: 12.5,
      procFee: 1.0,
      lateFee: 2.0,
      grace: 5,
    },
    {
      code: 'EML',
      name: 'Emergency Instant Loan',
      productType: 'EMERGENCY',
      min: 5000,
      max: 200000,
      minT: 3,
      maxT: 24,
      rate: 18.0,
      procFee: 2.0,
      lateFee: 3.0,
      grace: 2,
    },
  ];

  const productMap = new Map<string, string>();
  for (const p of products) {
    const prod = await prisma.loanProduct.upsert({
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
        processingFeePct: p.procFee.toFixed(3),
        lateFeePct: p.lateFee.toFixed(3),
        gracePeriodDays: p.grace,
        eligibilityRules: {
          minAge: 21,
          maxAge: 60,
          minMonthlyIncome: p.code === 'BL' ? 50000 : 25000,
          maxDtiRatio: 0.55,
          minCreditScore: 650,
        },
        isActive: true,
      },
    });
    productMap.set(p.code, prod.id);
  }

  // 5. Customers with Complete 360 Profiles
  const cust1 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-DEMO01' },
    update: {},
    create: {
      customerCode: 'CUST-DEMO01',
      userId: custUser1.id,
      branchId: branchMap.get('PUN01'),
      firstName: 'Ravi',
      lastName: 'Kumar',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'MALE',
      mobile: '9876543210',
      email: 'ravi.kumar@adyapan.dev',
      addressLine: 'Flat 402, Greenfield Apts, Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      employmentType: 'SALARIED',
      employerName: 'Acme Software India Pvt Ltd',
      monthlyIncome: '95000.00',
      existingObligations: '15000.00',
      bankName: 'HDFC Bank',
      bankAccountNo: '50100234567890',
      bankIfsc: 'HDFC0001234',
      kycStatus: 'VERIFIED',
      riskCategory: 'LOW',
      status: 'ACTIVE',
      addresses: {
        create: [
          {
            addressType: 'CURRENT',
            addressLine: 'Flat 402, Greenfield Apts, Baner Road',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411045',
            isPrimary: true,
          },
          {
            addressType: 'PERMANENT',
            addressLine: 'House No 12, Shivaji Nagar',
            city: 'Nagpur',
            state: 'Maharashtra',
            pincode: '440010',
            isPrimary: false,
          },
        ],
      },
      employmentDetails: {
        create: {
          employmentType: 'SALARIED',
          employerName: 'Acme Software India Pvt Ltd',
          designation: 'Senior Lead Engineer',
          monthlyIncome: '95000.00',
          workExperienceYears: 8,
          officeAddress: 'Tech Park, Hinjewadi Phase 1, Pune',
        },
      },
      bankAccounts: {
        create: {
          accountHolderName: 'Ravi Kumar',
          bankName: 'HDFC Bank',
          accountNumber: '50100234567890',
          ifscCode: 'HDFC0001234',
          accountType: 'SAVINGS',
          isPrimary: true,
          isVerified: true,
        },
      },
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-DEMO02' },
    update: {},
    create: {
      customerCode: 'CUST-DEMO02',
      userId: custUser2.id,
      branchId: branchMap.get('HO'),
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: new Date('1988-11-20'),
      gender: 'FEMALE',
      mobile: '9876543211',
      email: 'priya.sharma@adyapan.dev',
      addressLine: 'B-104, Sunrise Residency, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      employmentType: 'BUSINESS',
      employerName: 'Sharma Design Studio',
      monthlyIncome: '140000.00',
      existingObligations: '30000.00',
      bankName: 'ICICI Bank',
      bankAccountNo: '000405006070',
      bankIfsc: 'ICIC0000004',
      kycStatus: 'VERIFIED',
      riskCategory: 'MEDIUM',
      status: 'ACTIVE',
      addresses: {
        create: {
          addressType: 'CURRENT',
          addressLine: 'B-104, Sunrise Residency, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          isPrimary: true,
        },
      },
      employmentDetails: {
        create: {
          employmentType: 'BUSINESS',
          employerName: 'Sharma Design Studio',
          designation: 'Managing Partner',
          monthlyIncome: '140000.00',
          workExperienceYears: 6,
          officeAddress: 'Link Road, Andheri West, Mumbai',
        },
      },
      bankAccounts: {
        create: {
          accountHolderName: 'Priya Sharma',
          bankName: 'ICICI Bank',
          accountNumber: '000405006070',
          ifscCode: 'ICIC0000004',
          accountType: 'CURRENT',
          isPrimary: true,
          isVerified: true,
        },
      },
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-DEMO03' },
    update: {},
    create: {
      customerCode: 'CUST-DEMO03',
      userId: custUser3.id,
      branchId: branchMap.get('BLR01'),
      firstName: 'Amit',
      lastName: 'Patel',
      dateOfBirth: new Date('1994-03-08'),
      gender: 'MALE',
      mobile: '9876543212',
      email: 'amit.patel@adyapan.dev',
      addressLine: '74, 4th Cross, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      employmentType: 'SALARIED',
      employerName: 'FinServe Solutions Ltd',
      monthlyIncome: '62000.00',
      existingObligations: '22000.00',
      bankName: 'State Bank of India',
      bankAccountNo: '20194857291',
      bankIfsc: 'SBIN0008742',
      kycStatus: 'SUBMITTED',
      riskCategory: 'MEDIUM',
      status: 'KYC_PENDING',
    },
  });

  // 6. Documents for Customers
  await prisma.document.createMany({
    data: [
      {
        customerId: cust1.id,
        category: 'IDENTITY',
        documentType: 'AADHAAR_CARD',
        fileName: 'aadhaar_ravi_kumar.pdf',
        storageKey: 'docs/cust1/aadhaar.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1048576,
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'analyst@adyapan.dev',
        verifiedAt: new Date(),
      },
      {
        customerId: cust1.id,
        category: 'INCOME',
        documentType: 'SALARY_SLIP_3M',
        fileName: 'payslips_q1_ravi.pdf',
        storageKey: 'docs/cust1/payslips.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2097152,
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'analyst@adyapan.dev',
        verifiedAt: new Date(),
      },
      {
        customerId: cust2.id,
        category: 'BUSINESS',
        documentType: 'GST_CERTIFICATE',
        fileName: 'gstin_sharma_studio.pdf',
        storageKey: 'docs/cust2/gstin.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1572864,
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'underwriter@adyapan.dev',
        verifiedAt: new Date(),
      },
      {
        customerId: cust3.id,
        category: 'IDENTITY',
        documentType: 'PAN_CARD',
        fileName: 'pan_amit_patel.jpg',
        storageKey: 'docs/cust3/pan.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 524288,
        status: 'PENDING',
        verified: false,
      },
    ],
    skipDuplicates: true,
  });

  // 7. Applications in Various Stages
  // App 1: Disbursed Personal Loan for Ravi
  const app1 = await prisma.loanApplication.upsert({
    where: { applicationNo: 'APP-2026-0001' },
    update: {},
    create: {
      applicationNo: 'APP-2026-0001',
      customerId: cust1.id,
      productId: productMap.get('PL')!,
      branchId: branchMap.get('PUN01'),
      requestedAmount: '300000.00',
      tenureMonths: 24,
      purpose: 'Home renovation and modular kitchen setup',
      status: 'DISBURSED',
      statusHistory: {
        create: [
          { toStatus: 'DRAFT', reason: 'Application drafted by borrower', createdAt: new Date(Date.now() - 30 * 86400000) },
          { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', reason: 'Documents submitted', createdAt: new Date(Date.now() - 28 * 86400000) },
          { fromStatus: 'SUBMITTED', toStatus: 'KYC_VERIFIED', reason: 'KYC & CIBIL verified', createdAt: new Date(Date.now() - 26 * 86400000) },
          { fromStatus: 'KYC_VERIFIED', toStatus: 'UNDERWRITING', reason: 'Assigned to underwriter', createdAt: new Date(Date.now() - 24 * 86400000) },
          { fromStatus: 'UNDERWRITING', toStatus: 'APPROVED', reason: 'Credit criteria satisfied', createdAt: new Date(Date.now() - 22 * 86400000) },
          { fromStatus: 'APPROVED', toStatus: 'READY_FOR_DISBURSEMENT', reason: 'Loan agreement signed', createdAt: new Date(Date.now() - 20 * 86400000) },
          { fromStatus: 'READY_FOR_DISBURSEMENT', toStatus: 'DISBURSED', reason: 'Fund credited via NEFT', createdAt: new Date(Date.now() - 19 * 86400000) },
        ],
      },
      eligibility: {
        create: {
          result: 'ELIGIBLE',
          factors: {
            dtiRatio: 0.28,
            cibilScore: 780,
            disposableIncome: 65000,
            recommendedEmiMax: 35000,
          },
        },
      },
      riskAssessment: {
        create: {
          score: 82,
          category: 'LOW',
          factors: {
            employmentStabilityYears: 8,
            repaymentTrackRecord: 'EXCELLENT',
            fraudRiskFlag: false,
          },
        },
      },
      underwriting: {
        create: {
          decision: 'APPROVE',
          reason: 'Strong salaried profile with low obligation-to-income ratio',
          decidedBy: 'underwriter@adyapan.dev',
        },
      },
    },
  });

  // App 2: Underwriting stage Business Loan for Priya
  await prisma.loanApplication.upsert({
    where: { applicationNo: 'APP-2026-0002' },
    update: {},
    create: {
      applicationNo: 'APP-2026-0002',
      customerId: cust2.id,
      productId: productMap.get('BL')!,
      branchId: branchMap.get('HO'),
      requestedAmount: '1200000.00',
      tenureMonths: 36,
      purpose: 'Studio expansion & equipment acquisition',
      status: 'UNDERWRITING',
      statusHistory: {
        create: [
          { toStatus: 'SUBMITTED', reason: 'Application submitted with GST filings', createdAt: new Date(Date.now() - 5 * 86400000) },
          { fromStatus: 'SUBMITTED', toStatus: 'KYC_VERIFIED', reason: 'Business KYC confirmed', createdAt: new Date(Date.now() - 3 * 86400000) },
          { fromStatus: 'KYC_VERIFIED', toStatus: 'UNDERWRITING', reason: 'Under review by credit committee', createdAt: new Date(Date.now() - 1 * 86400000) },
        ],
      },
      eligibility: {
        create: {
          result: 'CONDITIONALLY_ELIGIBLE',
          factors: {
            dtiRatio: 0.42,
            cibilScore: 715,
            businessVintageYears: 6,
            condition: 'Requires 6 months additional bank statement analysis',
          },
        },
      },
      riskAssessment: {
        create: {
          score: 68,
          category: 'MEDIUM',
          factors: {
            revenueGrowthYoY: '14%',
            industryRisk: 'MODERATE',
          },
        },
      },
    },
  });

  // App 3: Submitted Emergency Loan for Amit
  await prisma.loanApplication.upsert({
    where: { applicationNo: 'APP-2026-0003' },
    update: {},
    create: {
      applicationNo: 'APP-2026-0003',
      customerId: cust3.id,
      productId: productMap.get('EML')!,
      branchId: branchMap.get('BLR01'),
      requestedAmount: '50000.00',
      tenureMonths: 12,
      purpose: 'Medical contingency',
      status: 'SUBMITTED',
      statusHistory: {
        create: [{ toStatus: 'SUBMITTED', reason: 'Instant application created via mobile web', createdAt: new Date() }],
      },
    },
  });

  // 8. Active Loan Account for Ravi (App 1)
  const existingLoan = await prisma.loan.findUnique({ where: { loanNo: 'LN-2026-0001' } });
  if (!existingLoan) {
    const emi = '14471.00';
    const loan1 = await prisma.loan.create({
      data: {
        loanNo: 'LN-2026-0001',
        applicationId: app1.id,
        customerId: cust1.id,
        productId: productMap.get('PL')!,
        branchId: branchMap.get('PUN01'),
        principal: '300000.00',
        interestRate: '14.500',
        tenureMonths: 24,
        emiAmount: emi,
        disbursementDate: new Date(Date.now() - 45 * 86400000),
        maturityDate: new Date(Date.now() + 22 * 30 * 86400000),
        outstandingPrincipal: '278450.00',
        outstandingInterest: '0.00',
        outstandingFees: '0.00',
        nextDueDate: new Date(Date.now() + 15 * 86400000),
        status: 'ACTIVE',
      },
    });

    // 9. Repayment Schedule Items (24 months)
    const scheduleItems = [];
    let curBal = 300000;
    const monthlyRate = 14.5 / 12 / 100;

    for (let i = 1; i <= 24; i++) {
      const interest = Math.round(curBal * monthlyRate);
      let principalPart = 14471 - interest;
      if (i === 24) principalPart = curBal;
      curBal -= principalPart;

      const dueDate = new Date(Date.now() - (2 - i) * 30 * 86400000);
      const isPaid = i === 1;

      scheduleItems.push({
        loanId: loan1.id,
        emiNumber: i,
        dueDate,
        principal: principalPart.toFixed(2),
        interest: interest.toFixed(2),
        fees: '0.00',
        totalDue: '14471.00',
        paidAmount: isPaid ? '14471.00' : '0.00',
        outstanding: isPaid ? '0.00' : '14471.00',
        status: (isPaid ? 'PAID' : i === 2 ? 'UPCOMING' : 'UPCOMING') as any,
        paidDate: isPaid ? new Date(Date.now() - 15 * 86400000) : null,
      });
    }

    await prisma.repaymentScheduleItem.createMany({ data: scheduleItems });

    // 10. Disbursement Record & Transaction Ledger
    await prisma.disbursement.create({
      data: {
        loanId: loan1.id,
        amount: '300000.00',
        method: 'NEFT_BANK_TRANSFER',
        reference: 'CMS-NEFT-994827104',
        status: 'COMPLETED',
        disbursedBy: 'finance@adyapan.dev',
        createdAt: new Date(Date.now() - 45 * 86400000),
      },
    });

    await prisma.transaction.create({
      data: {
        loanId: loan1.id,
        type: 'DISBURSEMENT',
        direction: 'DEBIT',
        amount: '300000.00',
        reference: 'CMS-NEFT-994827104',
        description: 'Loan principal disbursed to borrower account',
        createdAt: new Date(Date.now() - 45 * 86400000),
      },
    });

    // 11. Payment Record & Allocations for Month 1
    const pmt1 = await prisma.payment.create({
      data: {
        paymentNo: 'PMT-2026-0001',
        loanId: loan1.id,
        customerId: cust1.id,
        amount: '14471.00',
        method: 'UPI',
        reference: 'UPI/60281940281/HDFC',
        status: 'SUCCESS',
        paidAt: new Date(Date.now() - 15 * 86400000),
      },
    });

    await prisma.paymentAllocation.createMany({
      data: [
        { paymentId: pmt1.id, bucket: 'FEES', amount: '0.00' },
        { paymentId: pmt1.id, bucket: 'PENALTY', amount: '0.00' },
        { paymentId: pmt1.id, bucket: 'INTEREST', amount: '3625.00' },
        { paymentId: pmt1.id, bucket: 'PRINCIPAL', amount: '10846.00' },
      ],
    });

    await prisma.transaction.create({
      data: {
        loanId: loan1.id,
        type: 'PAYMENT',
        direction: 'CREDIT',
        amount: '14471.00',
        reference: 'UPI/60281940281/HDFC',
        description: 'EMI Installment #1 received via UPI',
        createdAt: new Date(Date.now() - 15 * 86400000),
      },
    });
  }

  // 12. Delinquent Demo Loan & Collection Case
  const existingDelinquent = await prisma.loan.findUnique({ where: { loanNo: 'LN-2026-0099' } });
  if (!existingDelinquent) {
    const overdueLoan = await prisma.loan.create({
      data: {
        loanNo: 'LN-2026-0099',
        customerId: cust2.id,
        productId: productMap.get('PL')!,
        branchId: branchMap.get('HO'),
        principal: '150000.00',
        interestRate: '15.000',
        tenureMonths: 12,
        emiAmount: '13540.00',
        disbursementDate: new Date(Date.now() - 90 * 86400000),
        maturityDate: new Date(Date.now() + 270 * 86400000),
        outstandingPrincipal: '115200.00',
        outstandingInterest: '3200.00',
        outstandingFees: '500.00',
        nextDueDate: new Date(Date.now() - 25 * 86400000),
        status: 'OVERDUE',
      },
    });

    const colCase = await prisma.collectionCase.create({
      data: {
        caseNo: 'COL-2026-001',
        loanId: overdueLoan.id,
        customerId: cust2.id,
        assignedOfficerId: 'collections@adyapan.dev',
        dpd: 25,
        agingBucket: '0-30',
        overdueAmount: '17240.00',
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    await prisma.collectionActivity.create({
      data: {
        caseId: colCase.id,
        activityType: 'CALL',
        outcome: 'PROMISE_TO_PAY',
        notes: 'Borrower explained delay due to client billing cycle. Committed payment by 5th.',
        nextFollowUpDate: new Date(Date.now() + 5 * 86400000),
        performedBy: 'collections@adyapan.dev',
      },
    });

    await prisma.promiseToPay.create({
      data: {
        caseId: colCase.id,
        promisedAmount: '17240.00',
        promisedDate: new Date(Date.now() + 5 * 86400000),
        paymentMode: 'NET_BANKING',
        status: 'PENDING',
        recordedBy: 'collections@adyapan.dev',
      },
    });
  }

  // 13. System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'approval_limits' },
    update: {},
    create: {
      key: 'approval_limits',
      category: 'approvals',
      value: [
        { maxAmount: 100000, chain: ['LOAN_OFFICER', 'BRANCH_MANAGER'] },
        { maxAmount: 500000, chain: ['BRANCH_MANAGER', 'UNDERWRITER'] },
        { maxAmount: 2000000, chain: ['UNDERWRITER', 'FINANCE_OFFICER'] },
        { maxAmount: null, chain: ['UNDERWRITER', 'SUPER_ADMIN'] },
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

  await prisma.systemSetting.upsert({
    where: { key: 'delinquency_buckets' },
    update: {},
    create: {
      key: 'delinquency_buckets',
      category: 'collections',
      value: [
        { bucket: '0-30', minDpd: 1, maxDpd: 30, severity: 'LOW' },
        { bucket: '31-60', minDpd: 31, maxDpd: 60, severity: 'MEDIUM' },
        { bucket: '61-90', minDpd: 61, maxDpd: 90, severity: 'HIGH' },
        { bucket: '91-180', minDpd: 91, maxDpd: 180, severity: 'CRITICAL' },
        { bucket: '180+', minDpd: 181, maxDpd: 9999, severity: 'NPA' },
      ],
    },
  });

  // 14. Notification Templates
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

  // 15. Initial In-App Notifications for Demo Users
  await prisma.notification.createMany({
    data: [
      {
        customerId: cust1.id,
        channel: 'IN_APP',
        type: 'SUCCESS',
        title: 'Loan Disbursed',
        message: 'Your personal loan LN-2026-0001 for ₹3,00,000 has been disbursed to your HDFC account.',
      },
      {
        customerId: cust2.id,
        channel: 'IN_APP',
        type: 'ALERT',
        title: 'EMI Due Reminder',
        message: 'Your monthly installment of ₹13,540 is overdue by 25 days. Please settle promptly.',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Enterprise Seed completed successfully.');
  console.log(`Demo password for all staff and customer users: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
