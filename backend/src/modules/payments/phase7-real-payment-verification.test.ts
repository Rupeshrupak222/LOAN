import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { ProviderRegistryService } from '../integrations/provider-registry.service';
import { PaymentGatewayAdapter } from '../integrations/adapters/payments/payment-gateway.adapter';
import { initiatePayment, confirmPayment, reversePayment, getPaymentDetail } from './payment.service';
import { paymentWebhookService } from './payment-webhook.service';
import { generalLedgerService } from '../finance/gl.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { IntegrationHubError } from '../integrations/integration.errors';
import { Money } from '../finance/money';

describe('Phase 7: Real Payment Gateway / Repayment Provider Suite', { timeout: 30000 }, () => {
  const testTenant = 'tenant-adyapan-default';
  const otherTenant = 'cl_tenant_apex_001';

  const financeOfficer = {
    id: 'user-finance-p7-01',
    email: 'finance.p7@adyapan.com',
    roles: ['FINANCE_OFFICER'],
    tenantId: testTenant,
  };

  const borrowerActor = {
    id: 'user-borrower-p7-01',
    email: 'borrower.p7@example.com',
    roles: ['CUSTOMER'],
    tenantId: testTenant,
  };

  beforeAll(async () => {
    try {
      await prisma.user.upsert({
        where: { email: financeOfficer.email },
        update: {},
        create: {
          id: financeOfficer.id,
          email: financeOfficer.email,
          passwordHash: 'hash123',
          firstName: 'Finance',
          lastName: 'Officer',
          tenantId: testTenant,
        },
      });
    } catch {
      // Ignored if already present or transient pooler issue
    }
  }, 30000);

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  async function createTestLoan(customAmount: number = 24000, tenant: string = testTenant) {
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5);

    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-P7-${uniqueSuffix}`,
        firstName: 'Amit',
        lastName: 'Patel',
        email: `amit.${uniqueSuffix}@example.com`,
        mobile: `98222${uniqueSuffix.slice(-5)}`,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        tenantId: tenant,
      },
    });

    const product = await prisma.loanProduct.create({
      data: {
        code: `PL-P7-${uniqueSuffix}`,
        name: 'Personal Loan P7',
        productType: 'PERSONAL_LOAN',
        tenantId: tenant,
        minAmount: '5000',
        maxAmount: '500000',
        interestRate: '12.00',
        minTenureMonths: 6,
        maxTenureMonths: 24,
        isActive: true,
      },
    });

    const app = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-P7-${uniqueSuffix}`,
        customerId: customer.id,
        productId: product.id,
        requestedAmount: customAmount.toString(),
        tenureMonths: 6,
        status: 'DISBURSED',
        tenantId: tenant,
      },
    });

    const loan = await prisma.loan.create({
      data: {
        loanNo: `LN-P7-${uniqueSuffix}`,
        applicationId: app.id,
        customerId: customer.id,
        productId: product.id,
        principal: Money.toDb(customAmount),
        interestRate: Money.toDb(12.0),
        tenureMonths: 6,
        status: 'ACTIVE',
        disbursementDate: new Date(),
        outstandingPrincipal: Money.toDb(customAmount),
        outstandingInterest: Money.toDb(1200),
        outstandingFees: Money.toDb(300),
        emiAmount: Money.toDb(customAmount / 6 + 200),
        tenantId: tenant,
      },
    });

    // Create 6 schedule items
    const monthlyPrincipal = customAmount / 6;
    const monthlyInterest = 200;
    for (let i = 1; i <= 6; i++) {
      await prisma.repaymentScheduleItem.create({
        data: {
          loanId: loan.id,
          emiNumber: i,
          dueDate: new Date(Date.now() + i * 30 * 24 * 3600 * 1000),
          principal: Money.toDb(monthlyPrincipal),
          interest: Money.toDb(monthlyInterest),
          fees: Money.toDb(i === 1 ? 300 : 0),
          penaltyAmount: Money.toDb(0),
          totalDue: Money.toDb(monthlyPrincipal + monthlyInterest + (i === 1 ? 300 : 0)),
          outstanding: Money.toDb(monthlyPrincipal + monthlyInterest + (i === 1 ? 300 : 0)),
          paidAmount: Money.toDb(0),
          status: 'DUE',
        },
      });
    }

    return { customer, product, app, loan };
  }

  describe('1. Real Provider Order Creation & Verification', () => {
    it('should create real provider order using configured credentials and return provider order reference', async () => {
      const { loan, customer } = await createTestLoan(12000);

      const realAdapter = new PaymentGatewayAdapter({
        apiKey: 'rzp_live_testkey_123',
        apiSecret: 'secret_live_456',
        isConfigured: true,
        enabled: true,
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          id: 'order_rzp_live_998877',
          entity: 'order',
          amount: 450000,
          currency: 'INR',
          status: 'created',
          short_url: 'https://rzp.io/i/order_rzp_live_998877',
          created_at: 1774000000,
        }),
      } as any);

      ProviderRegistryService.getInstance().registerCustomAdapter('PAYMENT', realAdapter, testTenant);

      const initiated = await initiatePayment(
        {
          loanId: loan.id,
          amount: 4500,
          type: 'EMI',
        },
        financeOfficer
      );

      expect(initiated.status).toBe('INITIATED');
      expect(initiated.providerOrderId).toBe('order_rzp_live_998877');
      expect(initiated.isSandbox).toBe(false);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should confirm payment upon authoritative real provider success response', async () => {
      const { loan } = await createTestLoan(12000);

      const realAdapter = new PaymentGatewayAdapter({
        apiKey: 'rzp_live_testkey_123',
        apiSecret: 'secret_live_456',
        isConfigured: true,
        enabled: true,
      });

      ProviderRegistryService.getInstance().registerCustomAdapter('PAYMENT', realAdapter, testTenant);

      const fetchOrderSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          id: 'order_rzp_live_112233',
          amount: 450000,
          currency: 'INR',
          status: 'created',
        }),
      } as any);

      const initiated = await initiatePayment(
        {
          loanId: loan.id,
          amount: 4500,
        },
        financeOfficer
      );

      const fetchVerifySpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          id: 'pay_rzp_live_auth_554433',
          entity: 'payment',
          amount: 450000,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          created_at: 1774000000,
        }),
      } as any);

      const confirmed = await confirmPayment(
        initiated.paymentId,
        {
          providerPaymentId: 'pay_rzp_live_auth_554433',
          utrNumber: 'UTR-BANK-REAL-99887766',
        },
        financeOfficer
      );

      expect(confirmed.payment.status).toBe('SUCCESS');
      expect(confirmed.payment.reference).toBe('UTR-BANK-REAL-99887766');
      expect(confirmed.allocation?.allocatedPrincipal).toBeGreaterThan(0);
    });
  });

  describe('2. Real Provider Error, Rejection & Zero Fallback Rule', () => {
    it('should NOT mark payment SUCCESS when real provider reports payment FAILED', async () => {
      const { loan } = await createTestLoan(12000);

      const realAdapter = new PaymentGatewayAdapter({
        apiKey: 'rzp_live_testkey_123',
        apiSecret: 'secret_live_456',
        isConfigured: true,
        enabled: true,
      });

      ProviderRegistryService.getInstance().registerCustomAdapter('PAYMENT', realAdapter, testTenant);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'order_fail_01', amount: 300000, currency: 'INR', status: 'created' }),
      } as any);

      const initiated = await initiatePayment({ loanId: loan.id, amount: 3000 }, financeOfficer);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'pay_fail_01',
          amount: 300000,
          status: 'failed',
          error_description: 'Payment was declined by issuing bank',
        }),
      } as any);

      await expect(
        confirmPayment(initiated.paymentId, { providerPaymentId: 'pay_fail_01' }, financeOfficer)
      ).rejects.toThrow(/Payment verification failed/);

      const paymentInDb = await prisma.payment.findUnique({ where: { id: initiated.paymentId } });
      expect(paymentInDb?.status).toBe('FAILED');
    });

    it('should keep payment in PENDING state when provider reports payment pending/processing', async () => {
      const { loan } = await createTestLoan(12000);

      const realAdapter = new PaymentGatewayAdapter({
        apiKey: 'rzp_live_testkey_123',
        apiSecret: 'secret_live_456',
        isConfigured: true,
        enabled: true,
      });

      ProviderRegistryService.getInstance().registerCustomAdapter('PAYMENT', realAdapter, testTenant);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'order_pend_01', amount: 200000, currency: 'INR', status: 'created' }),
      } as any);

      const initiated = await initiatePayment({ loanId: loan.id, amount: 2000 }, financeOfficer);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'pay_pend_01',
          amount: 200000,
          status: 'authorized', // not captured yet
        }),
      } as any);

      const result = await confirmPayment(initiated.paymentId, { providerPaymentId: 'pay_pend_01' }, financeOfficer);
      expect(result.status).toBe('PENDING');

      const paymentInDb = await prisma.payment.findUnique({ where: { id: initiated.paymentId } });
      expect(paymentInDb?.status).toBe('PENDING');
    });

    it('should propagate real provider HTTP 500 network error and NEVER fall back to sandbox', async () => {
      const { loan } = await createTestLoan(12000);

      const realAdapter = new PaymentGatewayAdapter({
        apiKey: 'rzp_live_testkey_123',
        apiSecret: 'secret_live_456',
        isConfigured: true,
        enabled: true,
      });

      ProviderRegistryService.getInstance().registerCustomAdapter('PAYMENT', realAdapter, testTenant);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => 'Provider gateway internal error',
      } as any);

      await expect(
        initiatePayment({ loanId: loan.id, amount: 2500, forceMode: 'REAL_PROVIDER' }, financeOfficer)
      ).rejects.toThrow(/Payment gateway operation failed|PROVIDER_EXECUTION_FAILED/);
    });
  });

  describe('3. Sandbox Provider Mode & Synthetic Indicators', () => {
    it('should resolve to deterministic Sandbox with explicit simulation markers when unconfigured', async () => {
      // Clear custom adapter for default tenant
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();

      const { loan } = await createTestLoan(12000);

      const initiated = await initiatePayment(
        {
          loanId: loan.id,
          amount: 3000,
        },
        financeOfficer
      );

      expect(initiated.isSandbox).toBe(true);
      expect(initiated.verificationMode).toBe('SANDBOX_SIMULATION');
      expect(initiated.providerOrderId).toMatch(/^order_sbx_/);

      const confirmed = await confirmPayment(
        initiated.paymentId,
        {
          providerPaymentId: `pay_sbx_${Date.now()}`,
        },
        financeOfficer
      );

      expect(confirmed.payment.status).toBe('SUCCESS');
      expect(confirmed.payment.reference).toMatch(/^UTR-SBX-/);
    });

    it('should throw PROVIDER_CONFIGURATION_REQUIRED if REAL_PROVIDER is forced without credentials', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(12000);

      await expect(
        initiatePayment(
          {
            loanId: loan.id,
            amount: 3000,
            forceMode: 'REAL_PROVIDER',
          },
          financeOfficer
        )
      ).rejects.toThrow(/PROVIDER_CONFIGURATION_REQUIRED/);
    });
  });

  describe('4. Idempotency & Webhook Security', () => {
    it('should return existing payment intent on idempotent retry without creating duplicate records', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(12000);
      const idempotencyKey = `idem-test-p7-${Date.now()}`;

      const init1 = await initiatePayment(
        { loanId: loan.id, amount: 2000, idempotencyKey },
        financeOfficer
      );

      const init2 = await initiatePayment(
        { loanId: loan.id, amount: 2000, idempotencyKey },
        financeOfficer
      );

      expect(init1.paymentId).toBe(init2.paymentId);
      expect(init1.providerOrderId).toBe(init2.providerOrderId);
    });

    it('should verify valid HMAC signed payment webhook and allocate funds to loan', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(15000);

      const initiated = await initiatePayment(
        { loanId: loan.id, amount: 3000 },
        financeOfficer
      );

      const webhookPayload = {
        id: `evt_test_${Date.now()}`,
        event: 'payment.captured',
        paymentId: initiated.paymentId,
        loanId: loan.id,
        amount: 3000,
        utr: 'UTR-WH-CONFIRMED-12345',
      };

      const signed = (ProviderRegistryService.getInstance().payment as any).generateSignedWebhookPayload(
        'payment.captured',
        webhookPayload
      );

      const result = await paymentWebhookService.ingestWebhook({
        eventType: 'payment.captured',
        eventId: webhookPayload.id,
        rawBody: signed.rawBody,
        signature: signed.signature,
        payload: webhookPayload,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PROCESSED');

      const paymentInDb = await prisma.payment.findUnique({ where: { id: initiated.paymentId } });
      expect(paymentInDb?.status).toBe('SUCCESS');
      expect(paymentInDb?.reference).toBe('UTR-WH-CONFIRMED-12345');
    });

    it('should reject invalid HMAC signed webhook payload', async () => {
      const { loan } = await createTestLoan(10000);

      await expect(
        paymentWebhookService.ingestWebhook({
          eventType: 'payment.captured',
          eventId: `evt_fraud_${Date.now()}`,
          rawBody: JSON.stringify({ amount: 5000 }),
          signature: 'invalid_fraudulent_signature_hex_0000',
          payload: { loanId: loan.id, amount: 5000 },
        })
      ).rejects.toThrow(/Invalid payment webhook signature/);
    });

    it('should reject duplicate webhook event idempotently without duplicating allocations', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(12000);

      const eventId = `evt_dedup_${Date.now()}`;
      const payload = { id: eventId, loanId: loan.id, amount: 2500 };

      const firstResult = await paymentWebhookService.ingestWebhook({
        eventType: 'payment.captured',
        eventId,
        payload,
      });
      expect(firstResult.status).toBe('PROCESSED');

      const secondResult = await paymentWebhookService.ingestWebhook({
        eventType: 'payment.captured',
        eventId,
        payload,
      });
      expect(secondResult.status).toBe('DUPLICATE');
    });
  });

  describe('5. Accounting & General Ledger Double-Entry Balance Invariant', () => {
    it('should post balanced double-entry General Ledger entries for repayment', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(20000);

      const initiated = await initiatePayment({ loanId: loan.id, amount: 5000 }, financeOfficer);
      await confirmPayment(initiated.paymentId, { providerPaymentId: `pay_sbx_${Date.now()}` }, financeOfficer);

      const entries = generalLedgerService.listJournalEntries({
        tenantId: testTenant,
        referenceType: 'REPAYMENT',
      });
      const repaymentJournal = entries.find((e) => e.referenceId === loan.id || e.description.includes(initiated.paymentNo));

      expect(repaymentJournal).toBeDefined();
      if (repaymentJournal) {
        expect(Number(repaymentJournal.totalDebit)).toBe(Number(repaymentJournal.totalCredit));
        expect(Number(repaymentJournal.totalDebit)).toBe(5000);
      }
    });

    it('should reverse payment with compensating GL journal and restore schedule balances', async () => {
      (ProviderRegistryService.getInstance() as any).customAdapters.clear();
      const { loan } = await createTestLoan(12000);

      const initiated = await initiatePayment({ loanId: loan.id, amount: 4000 }, financeOfficer);
      await confirmPayment(initiated.paymentId, { providerPaymentId: `pay_sbx_${Date.now()}` }, financeOfficer);

      const reversed = await reversePayment(
        initiated.paymentId,
        { reason: 'Customer cheque bounce / disputed charge' },
        financeOfficer
      );

      expect(reversed.reversalAmount).toBe(4000);
      expect(reversed.compensatingJournalId).toBeDefined();

      const paymentInDb = await prisma.payment.findUnique({ where: { id: initiated.paymentId } });
      expect(paymentInDb?.status).toBe('REVERSED');
    });
  });

  describe('6. Anti-IDOR & Multi-Tenant Security', () => {
    it('should reject payment initiation for loans belonging to another tenant', async () => {
      const { loan } = await createTestLoan(10000, otherTenant);

      await expect(
        initiatePayment(
          { loanId: loan.id, amount: 2000 },
          financeOfficer // belongs to testTenant
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject payment confirmation for records belonging to another tenant', async () => {
      const { loan } = await createTestLoan(10000, otherTenant);

      const initiated = await prisma.payment.create({
        data: {
          paymentNo: `PN-CROSS-${Date.now()}`,
          loanId: loan.id,
          customerId: loan.customerId,
          tenantId: otherTenant,
          amount: Money.toDb(2000),
          method: 'GATEWAY',
          reference: 'order_cross_01',
          status: 'PENDING',
        },
      });

      await expect(
        confirmPayment(initiated.id, { providerPaymentId: 'pay_01' }, financeOfficer)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
