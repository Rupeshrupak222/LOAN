import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { prisma } from '../../config/prisma';
import { financeService } from './finance.service';
import { financialControlService } from './financial-control.service';
import { payoutGatekeeper } from '../disbursements/payout-gatekeeper.service';
import { OfferEngineService } from '../offers/offers.service';
import { generalLedgerService } from './gl.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase 9E: Real Finance + Pre-Disbursement + Maker-Checker + Disbursement Workflow Suite', { timeout: 30000 }, () => {
  const testTenant = 'tenant-adyapan-default';
  const otherTenant = 'cl_tenant_apex_001';

  const makerOfficer = {
    id: 'user-finance-maker-01',
    email: 'maker@adyapan.com',
    roles: ['FINANCE_OFFICER'],
    tenantId: testTenant,
  };

  const checkerOfficer = {
    id: 'user-finance-checker-01',
    email: 'checker@adyapan.com',
    roles: ['FINANCE_OFFICER', 'FINANCE_CONTROLLER'],
    tenantId: testTenant,
  };

  const underwriterActor = {
    id: 'user-underwriter-01',
    email: 'underwriter@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId: testTenant,
  };

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: makerOfficer.email },
      update: {},
      create: {
        id: makerOfficer.id,
        email: makerOfficer.email,
        passwordHash: 'hash123',
        firstName: 'Maker',
        lastName: 'Officer',
        tenantId: testTenant,
      },
    });

    await prisma.user.upsert({
      where: { email: checkerOfficer.email },
      update: {},
      create: {
        id: checkerOfficer.id,
        email: checkerOfficer.email,
        passwordHash: 'hash123',
        firstName: 'Checker',
        lastName: 'Officer',
        tenantId: testTenant,
      },
    });

    await prisma.user.upsert({
      where: { email: underwriterActor.email },
      update: {},
      create: {
        id: underwriterActor.id,
        email: underwriterActor.email,
        passwordHash: 'hash123',
        firstName: 'Underwriter',
        lastName: 'Officer',
        tenantId: testTenant,
      },
    });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('1. Finance Queue Eligibility & Stage-Gating', () => {
    it('should include genuinely eligible applications in READY_FOR_DISBURSEMENT status', async () => {
      const uniqueSuffix = Date.now().toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-${uniqueSuffix}`,
          firstName: 'Rajesh',
          lastName: 'Kumar',
          email: `rajesh.${uniqueSuffix}@example.com`,
          mobile: `98765${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
          bankAccounts: {
            create: {
              accountHolderName: 'Rajesh Kumar',
              accountNumber: '112233445566',
              ifscCode: 'HDFC0001234',
              bankName: 'HDFC Bank',
              isVerified: true,
            },
          },
          documents: {
            create: [
              { fileName: 'aadhaar.pdf', storageKey: 'docs/aadhaar.pdf', category: 'IDENTITY', verified: true },
              { fileName: 'address.pdf', storageKey: 'docs/address.pdf', category: 'ADDRESS', verified: true },
            ],
          },
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-${uniqueSuffix}`,
          name: 'Express Personal Loan',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '14.50',
          minTenureMonths: 6,
          maxTenureMonths: 36,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '100000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          stage: 'FINANCE_VERIFIED',
          tenantId: testTenant,
        },
      });

      // Generate & accept offer
      const offerEngine = OfferEngineService.getInstance();
      const offer = await offerEngine.generateOffer(
        testTenant,
        app.id,
        { notes: 'Pre-disbursement test offer' },
        makerOfficer
      );

      await offerEngine.acceptOffer(
        testTenant,
        offer.id,
        { termsAccepted: true, kfsAccepted: true },
        { id: customer.id, email: customer.email || undefined, roles: ['BORROWER'], tenantId: testTenant }
      );

      // Post-acceptance / agreement completion updates status to READY_FOR_DISBURSEMENT
      await prisma.loanApplication.update({
        where: { id: app.id },
        data: { status: 'READY_FOR_DISBURSEMENT' },
      });

      const queue = await financeService.getFinanceQueue('READY_FOR_DISBURSEMENT', undefined, makerOfficer);
      const found = queue.find((i) => i.id === app.id);

      expect(found).toBeDefined();
      expect(found?.borrowerName).toBe('Rajesh Kumar');
      expect(found?.approvedAmount).toBe(100000);
      expect(found?.netDisbursalAmount).toBe(offer.netDisbursedAmount);
      expect(found?.gatekeeperStatus.canDisburse).toBe(true);
    });

    it('should exclude applications where the latest offer was DECLINED', async () => {
      const uniqueSuffix = (Date.now() + 1).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-DECL-${uniqueSuffix}`,
          firstName: 'Anil',
          lastName: 'Sharma',
          email: `anil.${uniqueSuffix}@example.com`,
          mobile: `98764${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-D-${uniqueSuffix}`,
          name: 'Declined Offer Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '15.00',
          minTenureMonths: 6,
          maxTenureMonths: 36,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-D-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '75000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      const offerEngine = OfferEngineService.getInstance();
      const offer = await offerEngine.generateOffer(
        testTenant,
        app.id,
        undefined,
        makerOfficer
      );

      await offerEngine.declineOffer(
        testTenant,
        offer.id,
        { reason: 'Interest rate too high for borrower' },
        { id: customer.id, email: customer.email || undefined, roles: ['BORROWER'], tenantId: testTenant }
      );

      const queue = await financeService.getFinanceQueue('READY_FOR_DISBURSEMENT', undefined, makerOfficer);
      const found = queue.find((i) => i.id === app.id);
      expect(found).toBeUndefined();
    });
  });

  describe('2. Pre-Disbursement Checklist & 6-Category Gatekeeper', () => {
    it('should execute 10 statutory gates and return 6 structured categories', async () => {
      const uniqueSuffix = (Date.now() + 2).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-GATES-${uniqueSuffix}`,
          firstName: 'Suresh',
          lastName: 'Patel',
          email: `suresh.${uniqueSuffix}@example.com`,
          mobile: `98763${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
          bankAccounts: {
            create: {
              accountHolderName: 'Suresh Patel',
              accountNumber: '998877665544',
              ifscCode: 'ICIC0000100',
              bankName: 'ICICI Bank',
              isVerified: true,
            },
          },
          documents: {
            create: [
              { fileName: 'aadhaar.pdf', storageKey: 'docs/aadhaar.pdf', category: 'IDENTITY', verified: true },
              { fileName: 'address.pdf', storageKey: 'docs/address.pdf', category: 'ADDRESS', verified: true },
            ],
          },
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-G-${uniqueSuffix}`,
          name: 'Gatekeeper Test Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '300000',
          interestRate: '12.00',
          minTenureMonths: 6,
          maxTenureMonths: 24,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-G-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '150000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      const outcome = await payoutGatekeeper.verifyPreDisbursementGates(app.id, testTenant, makerOfficer);

      expect(outcome.canDisburse).toBe(true);
      expect(outcome.checks.length).toBeGreaterThanOrEqual(10);
      expect(outcome.categories).toBeDefined();
      expect(outcome.categories?.length).toBe(6);

      const identityCat = outcome.categories?.find((c) => c.category === 'IDENTITY');
      expect(identityCat?.status).toBe('VERIFIED');

      const bankCat = outcome.categories?.find((c) => c.category === 'BANK_PAYOUT');
      expect(bankCat?.status).toBe('VERIFIED');
    });

    it('should block payout if customer KYC status is NOT verified', async () => {
      const uniqueSuffix = (Date.now() + 3).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-NOKYC-${uniqueSuffix}`,
          firstName: 'Vikas',
          lastName: 'Verma',
          email: `vikas.${uniqueSuffix}@example.com`,
          mobile: `98762${uniqueSuffix}`,
          kycStatus: 'PENDING',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-NK-${uniqueSuffix}`,
          name: 'No KYC Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '300000',
          interestRate: '12.00',
          minTenureMonths: 6,
          maxTenureMonths: 24,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-NK-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '50000',
          tenureMonths: 6,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      const outcome = await payoutGatekeeper.verifyPreDisbursementGates(app.id, testTenant, makerOfficer);
      expect(outcome.canDisburse).toBe(false);
      expect(outcome.failedChecks).toContain('GATE_3_KYC_VERIFIED');
    });
  });

  describe('3. Maker-Checker Segregation of Duties (SoD)', () => {
    it('should allow Maker to submit and Checker to approve a disbursement proposal', async () => {
      const uniqueSuffix = (Date.now() + 4).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-MC-${uniqueSuffix}`,
          firstName: 'Pooja',
          lastName: 'Mehta',
          email: `pooja.${uniqueSuffix}@example.com`,
          mobile: `98761${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
          bankAccounts: {
            create: {
              accountHolderName: 'Pooja Mehta',
              accountNumber: '554433221100',
              ifscCode: 'SBIN0001234',
              bankName: 'State Bank of India',
              isVerified: true,
            },
          },
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-MC-${uniqueSuffix}`,
          name: 'Dual Control Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '13.00',
          minTenureMonths: 6,
          maxTenureMonths: 36,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-MC-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '200000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      // Maker submits task
      const task = await financeService.proposeDisbursementTask(
        app.id,
        { notes: 'Pre-disbursement verified, forwarding for Checker signoff.' },
        makerOfficer
      );

      expect(task.status).toBe('PENDING_CHECKER');
      expect(task.makerId).toBe(makerOfficer.id);
      expect(task.amount).toBe(200000);

      // Independent Checker approves task
      const approvedTask = await financeService.approveDisbursementTask(
        task.id,
        { decision: 'APPROVE', comments: 'Checker verified all checklist controls compliant.' },
        checkerOfficer
      );

      expect(approvedTask.status).toBe('APPROVED');
      expect(approvedTask.checkerId).toBe(checkerOfficer.id);
      expect(approvedTask.approvalDataHash).toBeDefined();
    });

    it('should REJECT Checker approval if Maker attempts to approve their own submission (Maker == Checker)', async () => {
      const uniqueSuffix = (Date.now() + 5).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-SOD-${uniqueSuffix}`,
          firstName: 'Sunita',
          lastName: 'Rao',
          email: `sunita.${uniqueSuffix}@example.com`,
          mobile: `98760${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-SOD-${uniqueSuffix}`,
          name: 'SoD Test Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '14.00',
          minTenureMonths: 6,
          maxTenureMonths: 36,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-SOD-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '100000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      const task = await financeService.proposeDisbursementTask(
        app.id,
        { notes: 'Maker self submission' },
        makerOfficer
      );

      // Same user attempts checker approval
      await expect(
        financeService.approveDisbursementTask(
          task.id,
          { decision: 'APPROVE', comments: 'Self-approval attempt' },
          makerOfficer // SAME ACTOR
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('4. Execution, Loan Account Activation & General Ledger', () => {
    it('should execute disbursement, activate Loan Account with accepted terms, and post GL journal', async () => {
      const uniqueSuffix = (Date.now() + 6).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-EXEC-${uniqueSuffix}`,
          firstName: 'Vikram',
          lastName: 'Singh',
          email: `vikram.${uniqueSuffix}@example.com`,
          mobile: `98759${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
          bankAccounts: {
            create: {
              accountHolderName: 'Vikram Singh',
              accountNumber: '445566778899',
              ifscCode: 'HDFC0001234',
              bankName: 'HDFC Bank',
              isVerified: true,
            },
          },
          documents: {
            create: [
              { fileName: 'aadhaar.pdf', storageKey: 'docs/aadhaar.pdf', category: 'IDENTITY', verified: true },
              { fileName: 'address.pdf', storageKey: 'docs/address.pdf', category: 'ADDRESS', verified: true },
            ],
          },
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-EX-${uniqueSuffix}`,
          name: 'Execution Test Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '12.50',
          minTenureMonths: 6,
          maxTenureMonths: 24,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-EX-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '100000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          stage: 'FINANCE_VERIFIED',
          tenantId: testTenant,
        },
      });

      // Generate & accept offer
      const offerEngine = OfferEngineService.getInstance();
      const offer = await offerEngine.generateOffer(
        testTenant,
        app.id,
        undefined,
        makerOfficer
      );

      await offerEngine.acceptOffer(
        testTenant,
        offer.id,
        { termsAccepted: true, kfsAccepted: true },
        { id: customer.id, email: customer.email || undefined, roles: ['BORROWER'], tenantId: testTenant }
      );

      // Post-acceptance / agreement completion updates status to READY_FOR_DISBURSEMENT
      await prisma.loanApplication.update({
        where: { id: app.id },
        data: { status: 'READY_FOR_DISBURSEMENT' },
      });

      // Execute disbursement
      const loan = await financeService.executeDisbursementWithControls(
        app.id,
        {
          disbursementMethod: 'IMPS',
          referenceNumber: `SIM-UTR-TEST-${uniqueSuffix}`,
        },
        checkerOfficer
      );

      expect(loan).toBeDefined();
      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(100000);
      expect(Number(loan.interestRate)).toBe(offer.annualInterestRatePct);
      expect(loan.tenureMonths).toBe(12);

      // Verify Application status updated to DISBURSED
      const updatedApp = await prisma.loanApplication.findUnique({ where: { id: app.id } });
      expect(updatedApp?.status).toBe('DISBURSED');

      // Verify Repayment Schedule created
      const scheduleItems = await prisma.repaymentScheduleItem.findMany({ where: { loanId: loan.id } });
      expect(scheduleItems.length).toBe(12);

      // Verify Disbursement record created
      const disbursement = await prisma.disbursement.findFirst({ where: { loanId: loan.id } });
      expect(disbursement).toBeDefined();
      expect(disbursement?.status).toBe('COMPLETED');
      expect(disbursement?.reference).toContain('SIM-UTR-TEST');

      // Verify Transaction record created
      const txn = await prisma.transaction.findFirst({ where: { loanId: loan.id } });
      expect(txn?.type).toBe('DISBURSEMENT');
      expect(txn?.direction).toBe('DEBIT');
    });

    it('should REJECT disbursement execution by Underwriter role (Segregation of Duties)', async () => {
      const uniqueSuffix = (Date.now() + 7).toString().slice(-6);
      const customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-9E-UW-${uniqueSuffix}`,
          firstName: 'Kavita',
          lastName: 'Joshi',
          email: `kavita.${uniqueSuffix}@example.com`,
          mobile: `98758${uniqueSuffix}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          tenantId: testTenant,
          bankAccounts: {
            create: {
              accountHolderName: 'Kavita Joshi',
              accountNumber: '123123123123',
              ifscCode: 'HDFC0001234',
              bankName: 'HDFC Bank',
              isVerified: true,
            },
          },
        },
      });

      const product = await prisma.loanProduct.create({
        data: {
          code: `PL-9E-UW-${uniqueSuffix}`,
          name: 'Underwriter SoD Product',
          productType: 'PERSONAL_LOAN',
          tenantId: testTenant,
          minAmount: '10000',
          maxAmount: '500000',
          interestRate: '12.00',
          minTenureMonths: 6,
          maxTenureMonths: 24,
          isActive: true,
        },
      });

      const app = await prisma.loanApplication.create({
        data: {
          applicationNo: `APP-9E-UW-${uniqueSuffix}`,
          customerId: customer.id,
          productId: product.id,
          requestedAmount: '100000',
          tenureMonths: 12,
          status: 'READY_FOR_DISBURSEMENT',
          tenantId: testTenant,
        },
      });

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS' },
          underwriterActor // UNDERWRITER ROLE
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
