import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { BorrowerApplicationInput } from './borrower.types';
import { ValidationError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M3: Borrower Loan Application Journey Tests', { timeout: 35000 }, () => {
  const tenantA = `tenant_m3_a_${Date.now()}`;
  const tenantB = `tenant_m3_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let activeProductId = '';
  let secondProductId = '';
  let draftApplicationId = '';

  function createValidApplicationInput(overrides: Partial<BorrowerApplicationInput> = {}): BorrowerApplicationInput {
    return {
      productId: activeProductId,
      requestedAmount: 20000,
      tenureMonths: 6,
      purpose: 'Education & study supplies',
      firstName: 'Ananya',
      lastName: 'Sharma',
      dob: '2001-05-15',
      gender: 'FEMALE',
      addressLine1: 'Room 204, PG Hostel',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110007',
      employmentType: 'STUDENT',
      institutionName: 'Delhi University',
      monthlyIncome: 0,
      panNumber: 'ABCDE1234F',
      aadhaarNumberMasked: 'XXXXXXXX1234',
      kycConsentGiven: true,
      accountHolderName: 'Ananya Sharma',
      accountNumber: '5010099887766',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      accountType: 'SAVINGS',
      creditBureauConsent: true,
      termsAccepted: true,
      ...overrides,
    };
  }

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M3_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M3 Prime Lending Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M3_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M3 NBFC Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // 2. Create User & Customer in Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `student.m3.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m3_a',
        firstName: 'Ananya',
        lastName: 'Sharma',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M3A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Ananya',
        lastName: 'Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 0,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        CustomerIdentifier: {
          create: {
            idType: 'PAN',
            maskedValue: 'ABCDE1234F',
            verificationStatus: 'VERIFIED',
          },
        },
      },
    });
    borrowerACustomerId = customerA.id;

    // 3. Create User & Customer in Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `salaried.m3.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m3_b',
        firstName: 'Karan',
        lastName: 'Mehta',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M3B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Karan',
        lastName: 'Mehta',
        mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 60000,
        kycStatus: 'PENDING',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 4. Create Active Loan Products in Tenant A
    const prod1 = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Student Pocket Micro Loan',
        code: `M3_STU_${Date.now().toString().slice(-5)}`,
        productType: 'STUDENT',
        minAmount: 5000,
        maxAmount: 50000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        interestRate: 15.0,
        processingFeePct: 1.0,
        isActive: true,
      },
    });
    activeProductId = prod1.id;

    const prod2 = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Emergency Flexi Credit',
        code: `M3_EMG_${Date.now().toString().slice(-5)}`,
        productType: 'PERSONAL',
        minAmount: 10000,
        maxAmount: 100000,
        minTenureMonths: 6,
        maxTenureMonths: 24,
        interestRate: 18.0,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    secondProductId = prod2.id;
  });

  it('1. Product Discovery: returns only authoritative backend products for the tenant with no hardcoding', async () => {
    const productsA = await borrowerService.getConsumerProducts(tenantA);
    expect(productsA).toBeInstanceOf(Array);
    expect(productsA.length).toBeGreaterThanOrEqual(2);

    const studentProd = productsA.find((p: any) => p.id === activeProductId);
    expect(studentProd).toBeDefined();
    expect(studentProd?.name).toBe('Student Pocket Micro Loan');
    expect(studentProd?.minAmount).toBe(5000);
    expect(studentProd?.maxAmount).toBe(50000);
    expect(studentProd?.minTenureMonths).toBe(3);
    expect(studentProd?.maxTenureMonths).toBe(12);

    // Tenant B has 0 products: must return empty array, never invent fake products
    const productsB = await borrowerService.getConsumerProducts(tenantB);
    expect(productsB).toEqual([]);
  });

  it('2. Draft Application: creates and persists server-side draft with persona & bank details', async () => {
    const draftResult = await borrowerService.saveBorrowerDraftApplication(
      borrowerAUserId,
      {
        productId: activeProductId,
        requestedAmount: 15000,
        tenureMonths: 6,
        purpose: 'Semester Textbook Fees',
        employmentType: 'STUDENT',
        institutionName: 'Delhi University',
        addressLine1: 'Room 204, PG Hostel',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110007',
        accountHolderName: 'Ananya Sharma',
        bankName: 'HDFC Bank',
        accountNumber: '5010099887766',
        ifscCode: 'HDFC0001234',
      },
      tenantA
    );

    expect(draftResult).toBeDefined();
    expect(draftResult.status).toBe('DRAFT');
    expect(draftResult.requestedAmount).toBe(15000);
    expect(draftResult.tenureMonths).toBe(6);
    expect(draftResult.applicationId).toBeDefined();

    draftApplicationId = draftResult.applicationId;

    // Verify persisted directly in database
    const dbApp = await prisma.loanApplication.findUnique({
      where: { id: draftApplicationId },
    });

    expect(dbApp).not.toBeNull();
    expect(dbApp?.status).toBe('DRAFT');
    expect(dbApp?.tenantId).toBe(tenantA);

    const dbAddr = await prisma.customerAddress.findFirst({
      where: { customerId: borrowerACustomerId },
    });
    expect(dbAddr?.city).toBe('New Delhi');

    const dbEmp = await prisma.customerEmployment.findFirst({
      where: { customerId: borrowerACustomerId },
    });
    expect(dbEmp?.employerName).toBe('Delhi University');

    const dbBank = await prisma.customerBankAccount.findFirst({
      where: { customerId: borrowerACustomerId },
    });
    expect(dbBank?.accountNumber).toBe('5010099887766');
  });

  it('3. Draft Resume: retrieves authoritative active application with full dossier', async () => {
    const activeApp = await borrowerService.getActiveBorrowerApplication(borrowerAUserId, tenantA);

    expect(activeApp).not.toBeNull();
    expect(activeApp?.id).toBe(draftApplicationId);
    expect(activeApp?.status).toBe('DRAFT');
    expect(activeApp?.requestedAmount).toBe(15000);
    expect(activeApp?.tenureMonths).toBe(6);
    expect(activeApp?.purpose).toBe('Semester Textbook Fees');
    expect(activeApp?.product.id).toBe(activeProductId);
    expect(activeApp?.product.name).toBe('Student Pocket Micro Loan');
    expect(activeApp?.employment?.employmentType).toBe('STUDENT');
    expect(activeApp?.employment?.institutionName).toBe('Delhi University');
    expect(activeApp?.address?.pincode).toBe('110007');
    expect(activeApp?.bank?.ifscCode).toBe('HDFC0001234');
  });

  it('4. Draft Updates: updating draft mutates existing application rather than creating duplicates', async () => {
    const updatedDraft = await borrowerService.saveBorrowerDraftApplication(
      borrowerAUserId,
      {
        productId: activeProductId,
        requestedAmount: 20000,
        tenureMonths: 9,
        purpose: 'Laptop Repair & Lab Supplies',
      },
      tenantA
    );

    expect(updatedDraft.applicationId).toBe(draftApplicationId);
    expect(updatedDraft.requestedAmount).toBe(20000);
    expect(updatedDraft.tenureMonths).toBe(9);

    // Verify count of applications for this customer is strictly 1
    const totalApps = await prisma.loanApplication.count({
      where: { customerId: borrowerACustomerId },
    });
    expect(totalApps).toBe(1);
  });

  it('5. Validation: rejects amounts outside backend product limits', async () => {
    // Product limits: min 5000, max 50000
    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          requestedAmount: 2000, // Below min 5000
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);

    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          requestedAmount: 60000, // Above max 50000
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);
  });

  it('6. Validation: rejects tenures outside backend product limits', async () => {
    // Product limits: min 3, max 12
    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          tenureMonths: 1, // Below min 3
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);

    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          tenureMonths: 36, // Above max 12
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);
  });

  it('7. Validation: enforces persona-specific requirements upon submission', async () => {
    // STUDENT requires institutionName
    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          employmentType: 'STUDENT',
          institutionName: '', // Missing
          employerName: '',
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);

    // SALARIED requires employerName & monthlyIncome > 0
    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          employmentType: 'SALARIED',
          employerName: '',
          monthlyIncome: 0,
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);

    // BUSINESS requires businessName
    await expect(
      borrowerService.submitBorrowerApplication(
        borrowerAUserId,
        createValidApplicationInput({
          employmentType: 'BUSINESS',
          businessName: '',
          employerName: '',
        }),
        tenantA
      )
    ).rejects.toThrow(ValidationError);
  });

  it('8. Security & IDOR: borrower cannot view or mutate another borrower’s or tenant’s application', async () => {
    // Borrower B in Tenant B tries to inspect Borrower A's application ID
    await expect(
      borrowerService.getBorrowerApplicationById(borrowerBUserId, draftApplicationId, tenantB)
    ).rejects.toThrow(ForbiddenError);

    // Attacker spoofing tenant A with user B's token
    await expect(
      borrowerService.getBorrowerApplicationById(borrowerBUserId, draftApplicationId, tenantA)
    ).rejects.toThrow(ForbiddenError);
  });

  it('9. Authoritative Submission: promotes existing DRAFT to submitted status with timestamp', async () => {
    const submissionResult = await borrowerService.submitBorrowerApplication(
      borrowerAUserId,
      createValidApplicationInput({
        requestedAmount: 20000,
        tenureMonths: 6,
        purpose: 'Exam registration and study materials',
      }),
      tenantA
    );

    expect(submissionResult).toBeDefined();
    expect(submissionResult.applicationId).toBe(draftApplicationId);
    expect(submissionResult.status).toBe('APPROVED'); // Promoted and evaluated by workflow engine

    // Verify database record has submittedAt set
    const finalApp = await prisma.loanApplication.findUnique({
      where: { id: draftApplicationId },
    });
    expect(finalApp?.status).toBe('APPROVED');
    expect(finalApp?.submittedAt).not.toBeNull();

    // Verify getActiveBorrowerApplication reflects submitted application
    const activeApp = await borrowerService.getActiveBorrowerApplication(borrowerAUserId, tenantA);
    expect(activeApp?.id).toBe(draftApplicationId);
    expect(activeApp?.status).toBe('APPROVED');
    expect(activeApp?.submittedAt).toBeDefined();
  });
});
