import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M2: Borrower Onboarding & Profile Verification Tests', { timeout: 25000 }, () => {
  const tenantId = `tenant_m2_${Date.now()}`;
  const tenantB = `tenant_m2_other_${Date.now()}`;
  let userAId = '';
  let userBId = '';
  let customerAId = '';
  let customerBId = '';

  beforeAll(async () => {
    // 1. Setup Tenant A
    await prisma.tenant.create({
      data: {
        id: tenantId,
        code: `M2_TENANT_${Date.now()}`,
        name: 'M2 Test Lending Tenant',
        contactEmail: `m2_${Date.now()}@test.com`,
      },
    });

    // Setup Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M2_TENANT_B_${Date.now()}`,
        name: 'M2 Cross Tenant',
        contactEmail: `m2_b_${Date.now()}@test.com`,
      },
    });

    // 2. Setup User A (Customer in Tenant A)
    const userA = await prisma.user.create({
      data: {
        email: `student.borrower.${Date.now()}@test.com`,
        passwordHash: 'hashed_pw_m2',
        firstName: 'Aarav',
        lastName: 'Sharma',
        tenantId,
      },
    });
    userAId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M2-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantId } },
        firstName: 'Aarav',
        lastName: 'Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        dateOfBirth: new Date('2002-08-15'),
        kycStatus: 'PENDING',
      },
    });
    customerAId = customerA.id;

    // 3. Setup User B (Customer in Tenant B)
    const userB = await prisma.user.create({
      data: {
        email: `salaried.borrower.${Date.now()}@test.com`,
        passwordHash: 'hashed_pw_m2_b',
        firstName: 'Pooja',
        lastName: 'Hegde',
        tenantId: tenantB,
      },
    });
    userBId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M2B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Pooja',
        lastName: 'Hegde',
        mobile: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        kycStatus: 'VERIFIED',
      },
    });
    customerBId = customerB.id;
  }, 35000);

  it('1. Authenticated borrower can load own detailed profile with dynamic completeness calculation', async () => {
    const profile = await borrowerService.getBorrowerDetailedProfile(userAId, tenantId);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBe('Aarav');
    expect(profile.lastName).toBe('Sharma');
    expect(profile.kycStatus).toBe('PENDING');
    expect(profile.completion).toBeDefined();
    expect(typeof profile.completion.percentage).toBe('number');
    expect(profile.completion.sections).toHaveLength(5);

    // Personal section is complete (firstName, lastName, mobile)
    const personalSection = profile.completion.sections.find((s) => s.sectionKey === 'personal');
    expect(personalSection?.isComplete).toBe(true);

    // Address and Employment are not yet provided
    const addressSection = profile.completion.sections.find((s) => s.sectionKey === 'address');
    expect(addressSection?.isComplete).toBe(false);
  });

  it('2. Tenant and User Isolation: Borrower cannot access or mutate profile under another tenant or user context', async () => {
    // Attempt to access userA with tenantB context
    await expect(borrowerService.getBorrowerDetailedProfile(userAId, tenantB)).rejects.toThrow();

    // Unknown user throws NotFoundError
    await expect(borrowerService.getBorrowerDetailedProfile('non-existent-user-id', tenantId)).rejects.toThrow(
      NotFoundError
    );
  });

  it('3. Borrower can update Address details and observe authoritative completion increase', async () => {
    const updateResult = await borrowerService.updateBorrowerProfile(
      userAId,
      {
        addressLine1: 'Flat 101, Tech Residency',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560100',
        addressType: 'CURRENT',
      },
      tenantId
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.profile.primaryAddress).toBeDefined();
    expect(updateResult.profile.primaryAddress?.city).toBe('Bengaluru');
    expect(updateResult.profile.primaryAddress?.state).toBe('Karnataka');
    expect(updateResult.profile.primaryAddress?.pincode).toBe('560100');

    // Address section should now be complete
    const addressSection = updateResult.profile.completion.sections.find((s) => s.sectionKey === 'address');
    expect(addressSection?.isComplete).toBe(true);
  });

  it('4. Borrower can update Student Persona details (Institution, Course, Roll Number)', async () => {
    const updateResult = await borrowerService.updateBorrowerProfile(
      userAId,
      {
        employmentType: 'STUDENT',
        institutionName: 'National Institute of Technology',
        courseName: 'B.Tech Computer Science',
        rollNumber: 'NITK2023CS042',
        graduationYear: 2027,
        monthlyIncome: 5000,
      },
      tenantId
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.profile.primaryEmployment?.employmentType).toBe('STUDENT');
    expect(updateResult.profile.primaryEmployment?.employerName).toBe('National Institute of Technology');
    expect(updateResult.profile.primaryEmployment?.designation).toBe('B.Tech Computer Science');

    const empSection = updateResult.profile.completion.sections.find((s) => s.sectionKey === 'employment');
    expect(empSection?.isComplete).toBe(true);
  });

  it('5. Borrower can update Salaried Persona details (Employer, Designation, Income, Experience)', async () => {
    const updateResult = await borrowerService.updateBorrowerProfile(
      userBId,
      {
        employmentType: 'SALARIED',
        employerName: 'Wipro Technologies Ltd',
        designation: 'Lead Analyst',
        monthlyIncome: 85000,
        workExperienceYears: 4,
        addressLine1: 'Sector 5, Salt Lake',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
      },
      tenantB
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.profile.primaryEmployment?.employmentType).toBe('SALARIED');
    expect(updateResult.profile.primaryEmployment?.employerName).toBe('Wipro Technologies Ltd');
    expect(updateResult.profile.primaryEmployment?.designation).toBe('Lead Analyst');
    expect(updateResult.profile.primaryEmployment?.monthlyIncome).toBe(85000);
  });

  it('6. Verified KYC Name Lock: Updating name is ignored when KYC is already VERIFIED', async () => {
    // User B has kycStatus === 'VERIFIED'
    const updateResult = await borrowerService.updateBorrowerProfile(
      userBId,
      {
        firstName: 'MaliciousNameChange',
        lastName: 'Hacker',
        dob: '1995-05-15',
      },
      tenantB
    );

    // Name must NOT be changed because KYC is VERIFIED
    expect(updateResult.profile.firstName).toBe('Pooja');
    expect(updateResult.profile.lastName).toBe('Hegde');
    expect(updateResult.profile.dateOfBirth).toBeDefined();
  });
});
