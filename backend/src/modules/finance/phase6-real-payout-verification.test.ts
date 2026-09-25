import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { financeService } from './finance.service';
import { financialControlService } from './financial-control.service';
import { OfferEngineService } from '../offers/offers.service';
import { generalLedgerService } from './gl.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { webhookFramework } from '../integrations/webhooks/webhook-framework.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

describe('Phase 6: Real Payout / Disbursement Gateway Suite', { timeout: 30000 }, () => {
  const testTenant = 'tenant-adyapan-default';
  const otherTenant = 'cl_tenant_apex_001';

  const financeOfficer = {
    id: 'user-finance-p6-01',
    email: 'finance.p6@adyapan.com',
    roles: ['FINANCE_OFFICER'],
    tenantId: testTenant,
  };

  const checkerOfficer = {
    id: 'user-checker-p6-02',
    email: 'checker.p6@adyapan.com',
    roles: ['FINANCE_OFFICER', 'FINANCE_CONTROLLER'],
    tenantId: testTenant,
  };

  const underwriterActor = {
    id: 'user-underwriter-p6-03',
    email: 'underwriter.p6@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId: testTenant,
  };

  beforeAll(async () => {
    await prisma.tenant.upsert({
      where: { id: testTenant },
      update: {},
      create: {
        id: testTenant,
        code: `P6_DEF_${Date.now()}`,
        name: 'Adyapan Default',
        contactEmail: 'admin@adyapan.com',
      },
    });

    await prisma.tenant.upsert({
      where: { id: otherTenant },
      update: {},
      create: {
        id: otherTenant,
        code: `P6_APEX_${Date.now()}`,
        name: 'Apex Finance',
        contactEmail: 'admin@apex-finance.com',
      },
    });

    await prisma.user.upsert({
      where: { email: financeOfficer.email },
      update: {},
      create: {
        id: financeOfficer.id,
        email: financeOfficer.email,
        passwordHash: 'hash123',
        firstName: 'Finance',
        lastName: 'Maker',
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
        firstName: 'Finance',
        lastName: 'Checker',
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

  beforeEach(() => {
    vi.restoreAllMocks();
    webhookFramework.clearForTesting();
    delete process.env.DISBURSEMENT_GATEWAY_KEY;
    delete process.env.DISBURSEMENT_GATEWAY_BASE_URL;
  });

  async function createTestDisbursementContext(options?: {
    isBankVerified?: boolean;
    kycStatus?: string;
    status?: string;
    amount?: string;
    tenantId?: string;
  }) {
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5);
    const tenant = options?.tenantId || testTenant;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-P6-${uniqueSuffix}`,
        firstName: 'Priya',
        lastName: 'Sharma',
        email: `priya.${uniqueSuffix}@example.com`,
        mobile: `98765${uniqueSuffix.slice(0, 5)}`,
        kycStatus: (options?.kycStatus || 'VERIFIED') as any,
        status: 'ACTIVE',
        tenantId: tenant,
        bankAccounts: {
          create: {
            accountHolderName: 'Priya Sharma',
            accountNumber: '998877665544',
            ifscCode: 'HDFC0001234',
            bankName: 'HDFC Bank',
            isVerified: options?.isBankVerified !== false,
          },
        },
        documents: {
          create: [
            { fileName: 'aadhaar.pdf', storageKey: 'docs/aadhaar.pdf', category: 'IDENTITY', verified: true },
            { fileName: 'address.pdf', storageKey: 'docs/address.pdf', category: 'ADDRESS', verified: true },
          ],
        },
      },
      include: { bankAccounts: true },
    });

    const product = await prisma.loanProduct.create({
      data: {
        code: `PL-P6-${uniqueSuffix}`,
        name: 'Express Payout Loan',
        productType: 'PERSONAL_LOAN',
        tenantId: tenant,
        minAmount: '10000',
        maxAmount: '500000',
        interestRate: '13.50',
        minTenureMonths: 6,
        maxTenureMonths: 36,
        isActive: true,
      },
    });

    const app = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-P6-${uniqueSuffix}`,
        customerId: customer.id,
        productId: product.id,
        requestedAmount: options?.amount || '100000',
        tenureMonths: 12,
        status: (options?.status || 'READY_FOR_DISBURSEMENT') as any,
        stage: 'FINANCE_VERIFIED',
        tenantId: tenant,
      },
    });

    // Generate & accept offer
    const offerEngine = OfferEngineService.getInstance();
    const offer = await offerEngine.generateOffer(tenant, app.id, undefined, financeOfficer);
    await offerEngine.acceptOffer(
      tenant,
      offer.id,
      { termsAccepted: true, kfsAccepted: true },
      { id: customer.id, email: customer.email || undefined, roles: ['BORROWER'], tenantId: tenant }
    );

    // Update status to READY_FOR_DISBURSEMENT
    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { status: 'READY_FOR_DISBURSEMENT' },
    });

    return { customer, product, app, offer };
  }

  describe('1. Real Provider Payout Request & Authoritative Frozen Payload', () => {
    it('should use authoritative frozen accepted offer payload and verified beneficiary details for real payout request', async () => {
      const { app, offer, customer } = await createTestDisbursementContext();

      process.env.DISBURSEMENT_GATEWAY_KEY = 'real_disb_api_key_test';
      process.env.DISBURSEMENT_GATEWAY_BASE_URL = 'https://api.commercial-bank.com';

      let capturedRequest: any = null;
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, init: any) => {
        capturedRequest = {
          url: url.toString(),
          method: init?.method,
          headers: init?.headers,
          body: init?.body ? JSON.parse(init.body) : null,
        };

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            transferId: 'TRF-REAL-123456',
            status: 'SUCCESS',
            utr: 'UTR-REAL-BANK-99887766',
            amount: offer.netDisbursedAmount,
            fees: 5.0,
            tax: 0.9,
          }),
        } as any;
      });

      const loan = await financeService.executeDisbursementWithControls(
        app.id,
        {
          disbursementMethod: 'IMPS',
          forceMode: 'REAL_PROVIDER',
        },
        financeOfficer
      );

      expect(fetchSpy).toHaveBeenCalled();
      expect(capturedRequest).toBeDefined();
      expect(capturedRequest.url).toContain('/v1/payouts');
      expect(capturedRequest.body.amount).toBe(offer.netDisbursedAmount);
      expect(capturedRequest.body.accountNumber).toBe('998877665544');
      expect(capturedRequest.body.ifscCode).toBe('HDFC0001234');
      expect(capturedRequest.body.beneficiaryName).toBe('Priya Sharma');

      expect(loan.status).toBe('ACTIVE');
      expect(Number(loan.principal)).toBe(offer.offeredAmount);

      const disbursement = await prisma.disbursement.findFirst({ where: { loanId: loan.id } });
      expect(disbursement).toBeDefined();
      expect(disbursement?.status).toBe('COMPLETED');
      expect(disbursement?.reference).toBe('UTR-REAL-BANK-99887766');

      const appAfter = await prisma.loanApplication.findUnique({ where: { id: app.id } });
      expect(appAfter?.status).toBe('DISBURSED');
    });

    it('should reject frontend attempts to alter payout amount or beneficiary account', async () => {
      const { app, offer } = await createTestDisbursementContext();

      process.env.DISBURSEMENT_GATEWAY_KEY = 'real_disb_api_key_test';
      process.env.DISBURSEMENT_GATEWAY_BASE_URL = 'https://api.commercial-bank.com';

      let capturedBody: any = null;
      vi.spyOn(global, 'fetch').mockImplementation(async (_url: any, init: any) => {
        capturedBody = init?.body ? JSON.parse(init.body) : null;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            transferId: 'TRF-REAL-001122',
            status: 'SUCCESS',
            utr: 'UTR-REAL-BANK-11223344',
          }),
        } as any;
      });

      // Frontend attempts to inject malicious amount and account in input
      const loan = await financeService.executeDisbursementWithControls(
        app.id,
        {
          disbursementMethod: 'IMPS',
          forceMode: 'REAL_PROVIDER',
          ...({ amount: 9999999, accountNumber: '0000000000' } as any),
        },
        financeOfficer
      );

      // Server strictly ignored injected amount and account
      expect(capturedBody.amount).toBe(offer.netDisbursedAmount);
      expect(capturedBody.accountNumber).toBe('998877665544');
      expect(Number(loan.principal)).toBe(offer.offeredAmount);
    });
  });

  describe('2. Real Provider Failure, Rejection & Error Propagation (No Sandbox Fallback)', () => {
    it('should NOT mark loan active or application disbursed when real provider rejects payout', async () => {
      const { app } = await createTestDisbursementContext();

      process.env.DISBURSEMENT_GATEWAY_KEY = 'real_disb_api_key_test';
      process.env.DISBURSEMENT_GATEWAY_BASE_URL = 'https://api.commercial-bank.com';

      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            transferId: 'TRF-FAILED-999',
            status: 'FAILED',
            failureReason: 'Beneficiary bank account closed or frozen by NPCI.',
          }),
        } as any;
      });

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS', forceMode: 'REAL_PROVIDER' },
          financeOfficer
        )
      ).rejects.toThrow(BadRequestError);

      const appAfter = await prisma.loanApplication.findUnique({ where: { id: app.id } });
      expect(appAfter?.status).toBe('READY_FOR_DISBURSEMENT');

      const loans = await prisma.loan.findMany({ where: { applicationId: app.id } });
      expect(loans.length).toBe(0);
    });

    it('should propagate real provider HTTP 502/network failure directly and NEVER fall back to sandbox', async () => {
      const { app } = await createTestDisbursementContext();

      process.env.DISBURSEMENT_GATEWAY_KEY = 'real_disb_api_key_test';
      process.env.DISBURSEMENT_GATEWAY_BASE_URL = 'https://api.commercial-bank.com';

      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          text: async () => 'Downstream banking switch timeout',
        } as any;
      });

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS', forceMode: 'REAL_PROVIDER' },
          financeOfficer
        )
      ).rejects.toThrow();

      const appAfter = await prisma.loanApplication.findUnique({ where: { id: app.id } });
      expect(appAfter?.status).toBe('READY_FOR_DISBURSEMENT');

      const loans = await prisma.loan.findMany({ where: { applicationId: app.id } });
      expect(loans.length).toBe(0);
    });
  });

  describe('3. Sandbox Resolution & Synthetic Marker', () => {
    it('should resolve to explicit sandbox mode with synthetic UTR when credentials are not configured', async () => {
      const { app, offer } = await createTestDisbursementContext();

      const loan = await financeService.executeDisbursementWithControls(
        app.id,
        { disbursementMethod: 'IMPS' },
        financeOfficer
      );

      expect(loan).toBeDefined();
      expect(loan.status).toBe('ACTIVE');

      const disbursement = await prisma.disbursement.findFirst({ where: { loanId: loan.id } });
      expect(disbursement).toBeDefined();
      expect(disbursement?.status).toBe('COMPLETED');
      expect(disbursement?.reference).toContain('UTR-DISB-SBX-');

      const txn = await prisma.transaction.findFirst({ where: { loanId: loan.id } });
      expect(txn?.description).toContain('SANDBOX_SIMULATION');
    });

    it('should throw PROVIDER_CONFIGURATION_REQUIRED when REAL_PROVIDER is forced without credentials', async () => {
      const { app } = await createTestDisbursementContext();

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS', forceMode: 'REAL_PROVIDER' },
          financeOfficer
        )
      ).rejects.toThrow(/PROVIDER_CONFIGURATION_REQUIRED/);
    });
  });

  describe('4. Idempotency & Duplicate Payout Protection', () => {
    it('should return existing loan without duplicating money movement or transactions on idempotent retry', async () => {
      const { app } = await createTestDisbursementContext();

      // First execution
      const loan1 = await financeService.executeDisbursementWithControls(
        app.id,
        { disbursementMethod: 'IMPS' },
        financeOfficer
      );

      // Second execution on already disbursed application
      const loan2 = await financeService.executeDisbursementWithControls(
        app.id,
        { disbursementMethod: 'IMPS' },
        financeOfficer
      );

      expect(loan1.id).toBe(loan2.id);

      const loans = await prisma.loan.findMany({ where: { applicationId: app.id } });
      expect(loans.length).toBe(1);

      const disbursements = await prisma.disbursement.findMany({ where: { loanId: loan1.id } });
      expect(disbursements.length).toBe(1);
    });
  });

  describe('5. Webhook Security & Status Reconciliation', () => {
    it('should verify valid HMAC signed payout webhook and reconcile transaction UTR', async () => {
      const secret = 'adyapan_sandbox_payout_secret_2026';
      const rawPayload = JSON.stringify({
        payoutId: 'pout_wh_test_101',
        utr: 'UTR-WEBHOOK-CONFIRMED-999',
        status: 'SUCCESS',
      });

      const signature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

      const result = await financeService.handlePayoutWebhook({
        rawPayload,
        signature,
        timestamp: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PROCESSED');
      expect(result.utr).toBe('UTR-WEBHOOK-CONFIRMED-999');
    });

    it('should REJECT payout webhook with invalid signature', async () => {
      const rawPayload = JSON.stringify({
        payoutId: 'pout_wh_fake_001',
        utr: 'UTR-FAKE-001',
        status: 'SUCCESS',
      });

      await expect(
        financeService.handlePayoutWebhook({
          rawPayload,
          signature: 'invalid_forged_hmac_signature',
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should REJECT replay attack webhook exceeding allowed time drift', async () => {
      const secret = 'adyapan_sandbox_payout_secret_2026';
      const rawPayload = JSON.stringify({
        payoutId: 'pout_wh_stale_002',
        utr: 'UTR-STALE-002',
        status: 'SUCCESS',
      });

      const signature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
      const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 mins ago

      await expect(
        financeService.handlePayoutWebhook({
          rawPayload,
          signature,
          timestamp: staleTimestamp,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('6. Segregation of Duties & Gating Controls', () => {
    it('should REJECT payout execution by Underwriter role (SoD)', async () => {
      const { app } = await createTestDisbursementContext();

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS' },
          underwriterActor
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should REJECT payout execution if borrower bank account is unverified', async () => {
      const { app } = await createTestDisbursementContext({ isBankVerified: false });

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS' },
          financeOfficer
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should enforce Maker != Checker dual control and block self-approval', async () => {
      const { app } = await createTestDisbursementContext();

      const task = await financeService.proposeDisbursementTask(
        app.id,
        { notes: 'Maker proposing fund release' },
        financeOfficer
      );

      // Same actor tries to approve own task
      await expect(
        financeService.approveDisbursementTask(
          task.id,
          { decision: 'APPROVE' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);

      // Independent checker approves
      const approvedTask = await financeService.approveDisbursementTask(
        task.id,
        { decision: 'APPROVE' },
        checkerOfficer
      );

      expect(approvedTask.status).toBe('APPROVED');
    });

    it('should REJECT cross-tenant access attempt (Multi-tenant IDOR protection)', async () => {
      const { app } = await createTestDisbursementContext({ tenantId: otherTenant });

      await expect(
        financeService.executeDisbursementWithControls(
          app.id,
          { disbursementMethod: 'IMPS' },
          financeOfficer // Belongs to testTenant
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('7. General Ledger Double-Entry Balance Invariant', () => {
    it('should post balanced double-entry General Ledger journal upon disbursement', async () => {
      const { app, offer } = await createTestDisbursementContext();

      const loan = await financeService.executeDisbursementWithControls(
        app.id,
        { disbursementMethod: 'IMPS' },
        financeOfficer
      );

      const entries = generalLedgerService.listJournalEntries({
        tenantId: testTenant,
        referenceType: 'DISBURSEMENT',
      });

      const entry = entries.find((e) => e.referenceId === loan.id);
      expect(entry).toBeDefined();
      expect(Number(entry?.totalDebit)).toBe(Number(entry?.totalCredit));
      expect(Number(entry?.totalDebit)).toBe(offer.offeredAmount);
    });
  });
});
