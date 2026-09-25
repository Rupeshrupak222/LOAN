import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { borrowerService } from './borrower.service';
import { loanServicingService } from '../loans/loan-servicing.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase M8: Borrower Loan Closure, NOC & Statements Experience Tests', { timeout: 45000 }, () => {
  const tenantA = `tenant_m8_a_${Date.now()}`;
  const tenantB = `tenant_m8_b_${Date.now()}`;

  let borrowerAUserId = '';
  let borrowerBUserId = '';
  let borrowerACustomerId = '';
  let borrowerBCustomerId = '';

  let activeLoanAId = '';
  let closedLoanAId = '';
  let productId = '';

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    await prisma.tenant.create({
      data: {
        id: tenantA,
        code: `M8_A_${Date.now().toString().slice(-6)}`,
        name: 'Phase M8 Digital NBFC Tenant A',
        contactEmail: `admin_${Date.now()}@tenant-a.com`,
      },
    });

    await prisma.tenant.create({
      data: {
        id: tenantB,
        code: `M8_B_${Date.now().toString().slice(-6)}`,
        name: 'Phase M8 MicroCredit Tenant B',
        contactEmail: `admin_${Date.now()}@tenant-b.com`,
      },
    });

    // 2. Create Product
    const product = await prisma.loanProduct.create({
      data: {
        code: `M8_PROD_${Date.now().toString().slice(-6)}`,
        name: 'Flexi Personal Credit M8',
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 100000,
        minTenureMonths: 3,
        maxTenureMonths: 12,
        interestRate: 15.0,
        processingFeePct: 1.5,
        tenantId: tenantA,
        isActive: true,
      },
    });
    productId = product.id;

    // 3. Create User & Customer A (Primary Borrower)
    const userA = await prisma.user.create({
      data: {
        email: `borrower.m8.a.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m8_a',
        firstName: 'Aakash',
        lastName: 'Verma',
        tenantId: tenantA,
      },
    });
    borrowerAUserId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-M8A-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userA.id } },
        tenant: { connect: { id: tenantA } },
        firstName: 'Aakash',
        lastName: 'Verma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userA.email,
        monthlyIncome: 80000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerACustomerId = customerA.id;

    // 4. Create User & Customer B (Tenant B Isolation / Anti-IDOR Actor)
    const userB = await prisma.user.create({
      data: {
        email: `borrower.m8.b.${Date.now()}@example.com`,
        passwordHash: 'hashed_pw_m8_b',
        firstName: 'Pooja',
        lastName: 'Sharma',
        tenantId: tenantB,
      },
    });
    borrowerBUserId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-M8B-${Date.now().toString().slice(-4)}`,
        user: { connect: { id: userB.id } },
        tenant: { connect: { id: tenantB } },
        firstName: 'Pooja',
        lastName: 'Sharma',
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: userB.email,
        monthlyIncome: 70000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    borrowerBCustomerId = customerB.id;

    // 5. Create Active Loan for Customer A
    const activeLoan = await prisma.loan.create({
      data: {
        loanNo: `LN-M8-ACT-${Date.now().toString().slice(-5)}`,
        customerId: customerA.id,
        productId,
        tenantId: tenantA,
        principal: 20000,
        interestRate: 15.0,
        tenureMonths: 3,
        emiAmount: 7000,
        outstandingPrincipal: 20000,
        outstandingInterest: 1000,
        outstandingFees: 0,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              principal: 6500,
              interest: 500,
              fees: 0,
              totalDue: 7000,
              outstanding: 7000,
              status: 'UPCOMING',
            },
            {
              emiNumber: 2,
              dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              principal: 6700,
              interest: 300,
              fees: 0,
              totalDue: 7000,
              outstanding: 7000,
              status: 'UPCOMING',
            },
            {
              emiNumber: 3,
              dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              principal: 6800,
              interest: 200,
              fees: 0,
              totalDue: 7000,
              outstanding: 7000,
              status: 'UPCOMING',
            },
          ],
        },
      },
    });
    activeLoanAId = activeLoan.id;

    // 6. Create Already Settled & Closed Loan for Customer A
    const closedLoan = await prisma.loan.create({
      data: {
        loanNo: `LN-M8-CLS-${Date.now().toString().slice(-5)}`,
        customerId: customerA.id,
        productId,
        tenantId: tenantA,
        principal: 10000,
        interestRate: 15.0,
        tenureMonths: 2,
        emiAmount: 5200,
        outstandingPrincipal: 0,
        outstandingInterest: 0,
        outstandingFees: 0,
        status: 'CLOSED',
        disbursementDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        closedAt: new Date(),
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              principal: 4900,
              interest: 300,
              fees: 0,
              totalDue: 5200,
              outstanding: 0,
              status: 'PAID',
              paidDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            {
              emiNumber: 2,
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              principal: 5100,
              interest: 100,
              fees: 0,
              totalDue: 5200,
              outstanding: 0,
              status: 'PAID',
              paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        closure: {
          create: {
            nocNumber: `NOC-M8-${Date.now().toString().slice(-6)}`,
            closureType: 'NORMAL_MATURITY',
            principalPaid: 10000,
            interestPaid: 400,
            feesPaid: 150,
            closedAt: new Date(),
            closedBy: 'SYSTEM_AUTOCLOSE',
            remarks: 'Fully paid and settled on maturity.',
          },
        },
      },
    });
    closedLoanAId = closedLoan.id;
  });

  // -------------------------------------------------------------------------
  // 1. Strict Zero-Balance Gate: Active Loan Blocks NOC
  // -------------------------------------------------------------------------
  it('1: Active loan with outstanding principal strictly blocks NOC generation', async () => {
    await expect(
      borrowerService.generateBorrowerNoc(borrowerAUserId, activeLoanAId, tenantA)
    ).rejects.toThrow(BadRequestError);

    try {
      await borrowerService.generateBorrowerNoc(borrowerAUserId, activeLoanAId, tenantA);
    } catch (err: any) {
      expect(err.message).toContain('NOC can only be issued for fully closed loans with zero outstanding balance');
    }
  });

  // -------------------------------------------------------------------------
  // 2. Closed Loan Generates Authentic NOC Certificate
  // -------------------------------------------------------------------------
  it('2: Closed loan generates valid authentic NOC certificate with digital signature hash', async () => {
    const noc = await borrowerService.generateBorrowerNoc(borrowerAUserId, closedLoanAId, tenantA);

    expect(noc).toBeDefined();
    expect(noc.certificateNumber).toMatch(/^NOC-/);
    expect(noc.borrowerName).toBe('Aakash Verma');
    expect(noc.sanctionedAmount).toBe(10000);
    expect(noc.status).toBe('CLOSED_FULLY_SETTLED');
    expect(noc.digitalSignatureHash).toBeDefined();
    expect(noc.digitalSignatureHash.length).toBe(64); // SHA-256
    expect(noc.issuerLenderName).toBe('Adyapan Financial Services (NBFC Regulated Entity)');
    expect(noc.complianceStatement).toContain('no further lien or hypothecation');
  });

  // -------------------------------------------------------------------------
  // 3. Authoritative Statement of Account (SOA) Dossier
  // -------------------------------------------------------------------------
  it('3: Statement of Account provides full chronological ledger, lender info, and repayment schedule', async () => {
    const soa = await borrowerService.getBorrowerLoanStatement(borrowerAUserId, activeLoanAId, tenantA);

    expect(soa).toBeDefined();
    expect(soa.statementId).toMatch(/^SOA-/);
    expect(soa.lenderInfo.name).toBe('Phase M8 Digital NBFC Tenant A');
    expect(soa.borrowerInfo.borrowerName).toBe('Aakash Verma');
    expect(soa.loanSummary.sanctionedPrincipal).toBe(20000);
    expect(soa.loanSummary.isNocAvailable).toBe(false);
    expect(soa.repaymentSchedule.length).toBe(3);

    // Initial disbursement transaction must exist
    expect(soa.transactions.length).toBeGreaterThanOrEqual(1);
    expect(soa.transactions[0].transactionType).toBe('DISBURSEMENT');
    expect(soa.transactions[0].debitAmount).toBe(20000);
    expect(soa.transactions[0].runningPrincipalBalance).toBe(20000);
  });

  // -------------------------------------------------------------------------
  // 4. Final Repayment Waterfall to Closure Flow
  // -------------------------------------------------------------------------
  it('4: Remitting full balance closes the active loan and makes NOC immediately available', async () => {
    // Borrower A pays total outstanding balance
    const payResult = await borrowerService.processBorrowerRepayment(
      borrowerAUserId,
      {
        loanId: activeLoanAId,
        amount: 21000, // Total due = 20000 Principal + 1000 Interest
        paymentMethod: 'UPI',
      },
      tenantA
    );

    expect(payResult.success).toBe(true);
    expect(payResult.status).toBe('SUCCESS');
    expect(payResult.isFullyPaid).toBe(true);
    expect(payResult.message).toContain('Congratulations! Your loan has been fully settled');

    // Fetch authoritative loan details to verify closure
    const updatedLoan = await borrowerService.getBorrowerLoanDetails(borrowerAUserId, activeLoanAId, tenantA);
    expect(updatedLoan.status).toBe('CLOSED');
    expect(updatedLoan.isNocAvailable).toBe(true);
    expect(updatedLoan.totalOutstanding).toBe(0);

    // Now NOC generation must succeed
    const noc = await borrowerService.generateBorrowerNoc(borrowerAUserId, activeLoanAId, tenantA);
    expect(noc).toBeDefined();
    expect(noc.certificateNumber).toBeDefined();
    expect(noc.sanctionedAmount).toBe(20000);
  });

  // -------------------------------------------------------------------------
  // 5. Anti-IDOR Security: Cross-Customer Access Forbidden
  // -------------------------------------------------------------------------
  it('5: Anti-IDOR Security: Borrower B cannot view Borrower A loan details', async () => {
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerBUserId, activeLoanAId, tenantB)
    ).rejects.toThrow();
  });

  it('6: Anti-IDOR Security: Borrower B cannot access Borrower A Statement of Account', async () => {
    await expect(
      borrowerService.getBorrowerLoanStatement(borrowerBUserId, activeLoanAId, tenantB)
    ).rejects.toThrow();
  });

  it('7: Anti-IDOR Security: Borrower B cannot generate or view Borrower A NOC Certificate', async () => {
    await expect(
      borrowerService.generateBorrowerNoc(borrowerBUserId, closedLoanAId, tenantB)
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // 8. Tenant Isolation Security
  // -------------------------------------------------------------------------
  it('8: Tenant Isolation: Accessing loan under another tenant is blocked with ForbiddenError', async () => {
    // Customer A attempting to access loan with Tenant B context
    await expect(
      borrowerService.getBorrowerLoanDetails(borrowerAUserId, activeLoanAId, tenantB)
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // 9. Borrower Overview and List Includes Accurate Closure Metadata
  // -------------------------------------------------------------------------
  it('9: getBorrowerLoans returns closure and NOC availability flags', async () => {
    const loans = await borrowerService.getBorrowerLoans(borrowerAUserId, tenantA);
    expect(loans.length).toBeGreaterThanOrEqual(2);

    const closedItem = loans.find((l) => l.id === closedLoanAId);
    expect(closedItem).toBeDefined();
    expect(closedItem?.status).toBe('CLOSED');
    expect(closedItem?.isNocAvailable).toBe(true);
    expect(closedItem?.nocNumber).toMatch(/^NOC-/);
  });

  // -------------------------------------------------------------------------
  // 10. Privacy & Internal Data Shield
  // -------------------------------------------------------------------------
  it('10: Statement and Loan dossiers strictly omit internal collector, risk, and underwriter notes', async () => {
    const soa = await borrowerService.getBorrowerLoanStatement(borrowerAUserId, closedLoanAId, tenantA);

    expect((soa as any).creditScore).toBeUndefined();
    expect((soa as any).internalRiskScore).toBeUndefined();
    expect((soa as any).collectionNotes).toBeUndefined();
    expect((soa as any).assignedCollector).toBeUndefined();
    expect((soa as any).underwriterRemarks).toBeUndefined();
  });
});
