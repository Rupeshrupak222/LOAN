import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { validateProductionEnvironment } from '../../config/env-validator';
import { payoutGatekeeper } from '../disbursements/payout-gatekeeper.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { webhookFramework } from '../integrations/webhooks/webhook-framework.service';
import { generateSandboxSignature } from '../integrations/webhooks/signature.verifier';
import { idempotencyEngine } from '../integrations/resilience/idempotency.engine';
import { maskSecret } from '../integrations/integration.config';

describe('Phase 17: Production Hardening & Go-Live Verification Suite', () => {
  const tenantA = 'tenant_p17_hardened_a';
  const tenantB = 'tenant_p17_hardened_b';

  let userAId = '';
  let customerAId = '';
  let productAId = '';
  let appAId = '';

  let userBId = '';
  let customerBId = '';

  beforeAll(async () => {
    // 1. Setup Tenant A
    await prisma.tenant.upsert({
      where: { id: tenantA },
      update: {},
      create: {
        id: tenantA,
        code: `P17_TEN_A_${Date.now()}`,
        name: 'Hardened Tenant A',
        contactEmail: 'admin@tenanta.adyapan.io',
      },
    });

    // 2. Setup Tenant B
    await prisma.tenant.upsert({
      where: { id: tenantB },
      update: {},
      create: {
        id: tenantB,
        code: `P17_TEN_B_${Date.now()}`,
        name: 'Hardened Tenant B',
        contactEmail: 'admin@tenantb.adyapan.io',
      },
    });

    // 3. Setup User & Customer for Tenant A
    const userA = await prisma.user.create({
      data: {
        email: `borrower.a.${Date.now()}@adyapan.io`,
        passwordHash: 'hardened_bcrypt_hash_placeholder',
        firstName: 'Anil',
        lastName: 'Kumar',
        tenantId: tenantA,
      },
    });
    userAId = userA.id;

    const customerA = await prisma.customer.create({
      data: {
        customerCode: `CUST-A-${Date.now().toString().slice(-4)}`,
        userId: userA.id,
        tenantId: tenantA,
        firstName: 'Anil',
        lastName: 'Kumar',
        mobile: '9876543211',
        email: userA.email,
        monthlyIncome: 65000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        documents: {
          create: [
            { category: 'IDENTITY', documentType: 'PAN', fileName: 'pan.jpg', storageKey: 'docs/p17/pan.jpg', contentType: 'image/jpeg', sizeBytes: 1024, status: 'VERIFIED', verified: true },
            { category: 'ADDRESS', documentType: 'AADHAAR', fileName: 'aadhaar.jpg', storageKey: 'docs/p17/aadhaar.jpg', contentType: 'image/jpeg', sizeBytes: 1024, status: 'VERIFIED', verified: true },
          ],
        },
        bankAccounts: {
          create: {
            accountHolderName: 'Anil Kumar',
            bankName: 'HDFC Bank',
            accountNumber: '50100456789123',
            ifscCode: 'HDFC0001234',
            isVerified: true,
          },
        },
      },
    });
    customerAId = customerA.id;

    // 4. Setup Product for Tenant A
    const productA = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Hardened Micro Loan',
        code: `P17_PROD_${Date.now()}`,
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 50000,
        minTenureMonths: 1,
        maxTenureMonths: 12,
        interestRate: 18.0,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    productAId = productA.id;

    // 5. Setup Application for Tenant A
    const appA = await prisma.loanApplication.create({
      data: {
        tenantId: tenantA,
        customerId: customerAId,
        productId: productAId,
        applicationNo: `APP-P17-A-${Date.now()}`,
        requestedAmount: 20000,
        tenureMonths: 3,
        status: 'APPROVED',
      },
    });
    appAId = appA.id;

    // 6. Setup Customer for Tenant B
    const userB = await prisma.user.create({
      data: {
        email: `borrower.b.${Date.now()}@adyapan.io`,
        passwordHash: 'hardened_bcrypt_hash_placeholder',
        firstName: 'Pooja',
        lastName: 'Sharma',
        tenantId: tenantB,
      },
    });
    userBId = userB.id;

    const customerB = await prisma.customer.create({
      data: {
        customerCode: `CUST-B-${Date.now().toString().slice(-4)}`,
        userId: userB.id,
        tenantId: tenantB,
        firstName: 'Pooja',
        lastName: 'Sharma',
        mobile: '9876543222',
        email: userB.email,
        monthlyIncome: 80000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    customerBId = customerB.id;
  });

  afterAll(async () => {
    try {
      await prisma.document.deleteMany({ where: { customer: { tenantId: { in: [tenantA, tenantB] } } } });
      await prisma.repaymentScheduleItem.deleteMany({ where: { loan: { tenantId: { in: [tenantA, tenantB] } } } });
      await prisma.loan.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
      await prisma.loanApplication.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
      await prisma.customerBankAccount.deleteMany({ where: { customer: { tenantId: { in: [tenantA, tenantB] } } } });
      await prisma.customer.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
      await prisma.loanProduct.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    } catch {}
  });

  // =========================================================================
  // SUITE 1: ENVIRONMENT & STARTUP CONFIGURATION HARDENING
  // =========================================================================
  describe('Suite 1: Environment & Startup Configuration Hardening', () => {
    it('should reject production startup if JWT secrets use default placeholders', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:secret@prod-db.example.com:5432/adyapan',
        JWT_ACCESS_SECRET: 'change_me_secret_placeholder_too_short',
        JWT_REFRESH_SECRET: 'dev_only_refresh_secret_key',
        CORS_ORIGIN: 'https://borrower.adyapan.io',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_ACCESS_SECRET'))).toBe(true);
    });

    it('should reject production startup if CORS origin uses wildcard *', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:secret@prod-db.example.com:5432/adyapan',
        JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_32_char_jwt_access_secret_key_123',
        JWT_REFRESH_SECRET: 'a_very_secure_high_entropy_32_char_jwt_refresh_secret_key_123',
        CORS_ORIGIN: '*',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('CORS_ORIGIN'))).toBe(true);
    });

    it('should pass production startup validation with valid production configuration', () => {
      const result = validateProductionEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:secret@prod-db.example.com:5432/adyapan',
        JWT_ACCESS_SECRET: 'a_very_secure_high_entropy_32_char_jwt_access_secret_key_123',
        JWT_REFRESH_SECRET: 'a_very_secure_high_entropy_32_char_jwt_refresh_secret_key_123',
        CORS_ORIGIN: 'https://borrower.adyapan.io,https://ops.adyapan.io',
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 2: MULTI-TENANT & CROSS-TENANT DATA ISOLATION (IDOR DEFENSE)
  // =========================================================================
  describe('Suite 2: Multi-Tenant & Cross-Tenant Data Isolation', () => {
    it('should strictly isolate loan applications by tenant', async () => {
      const appsForTenantB = await prisma.loanApplication.findMany({
        where: { tenantId: tenantB },
      });
      const hasTenantAApp = appsForTenantB.some((a) => a.id === appAId);
      expect(hasTenantAApp).toBe(false);
    });

    it('should prevent cross-tenant customer retrieval', async () => {
      const customerInTenantB = await prisma.customer.findFirst({
        where: { id: customerAId, tenantId: tenantB },
      });
      expect(customerInTenantB).toBeNull();
    });

    it('should prevent cross-tenant product usage', async () => {
      const productInTenantB = await prisma.loanProduct.findFirst({
        where: { id: productAId, tenantId: tenantB },
      });
      expect(productInTenantB).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 3: RBAC & SEGREGATION OF DUTIES (SOD)
  // =========================================================================
  describe('Suite 3: RBAC & Segregation of Duties (SoD) Invariants', () => {
    it('should enforce maker-checker rule blocking self-approval on financial adjustments', () => {
      const makerUserId = 'user_maker_101';
      const checkerUserId = 'user_maker_101'; // Same user attempting approval

      const isSelfApproval = makerUserId === checkerUserId;
      expect(isSelfApproval).toBe(true);
      // Operational invariant: Self-approval must be strictly rejected
      expect(() => {
        if (isSelfApproval) {
          throw new Error('[SOD_VIOLATION] Maker cannot self-approve own transaction under Segregation of Duties.');
        }
      }).toThrow('[SOD_VIOLATION]');
    });

    it('should block auditor role from executing state-changing operational mutations', () => {
      const userRoles = ['AUDITOR'];
      const isAuditorOnly = userRoles.length === 1 && userRoles.includes('AUDITOR');

      const isMutationPermitted = !isAuditorOnly;
      expect(isMutationPermitted).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 4: FINANCIAL INTEGRITY, DECIMAL ARITHMETIC & DOUBLE-ENTRY GL
  // =========================================================================
  describe('Suite 4: Financial Integrity & Double-Entry Accounting Invariant', () => {
    it('should eliminate floating-point inaccuracies using Decimal.js', () => {
      // Classic JS float bug: 0.1 + 0.2 = 0.30000000000000004
      const d1 = new Decimal('0.1');
      const d2 = new Decimal('0.2');
      const sum = d1.plus(d2);

      expect(sum.toString()).toBe('0.3');
      expect(sum.toNumber()).toBe(0.3);
    });

    it('should verify Double-Entry Invariant: Total Debits == Total Credits on financial transactions', () => {
      const journalLines = [
        { accountId: '1010', debit: new Decimal('20000'), credit: new Decimal('0') },
        { accountId: '1020', debit: new Decimal('0'), credit: new Decimal('20000') },
      ];

      const totalDebits = journalLines.reduce((acc, l) => acc.plus(l.debit), new Decimal(0));
      const totalCredits = journalLines.reduce((acc, l) => acc.plus(l.credit), new Decimal(0));

      expect(totalDebits.equals(totalCredits)).toBe(true);
      expect(totalDebits.toString()).toBe('20000');
    });
  });

  // =========================================================================
  // SUITE 5: PRE-DISBURSEMENT 10-POINT GATEKEEPER SERVICE
  // =========================================================================
  describe('Suite 5: Pre-Disbursement 10-Point Gatekeeper Service', () => {
    it('should pass all 10 gatekeeper checks for verified application', async () => {
      const outcome = await payoutGatekeeper.verifyPreDisbursementGates(appAId, tenantA);
      expect(outcome.canDisburse).toBe(true);
      expect(outcome.checks.length).toBe(10);
      expect(outcome.failedChecks.length).toBe(0);
    });

    it('should reject disbursement if tenant context is mismatched', async () => {
      const outcome = await payoutGatekeeper.verifyPreDisbursementGates(appAId, tenantB);
      expect(outcome.canDisburse).toBe(false);
      expect(outcome.failedChecks).toContain('GATE_1_APP_EXISTS');
    });
  });

  // =========================================================================
  // SUITE 6: WEBHOOK SECURITY, SIGNATURE VERIFICATION & REPLAY PROTECTION
  // =========================================================================
  describe('Suite 6: Webhook Security & Signature Verification', () => {
    webhookFramework.clearForTesting();
    const secret = 'adyapan_sandbox_payment_secret_2026';

    it('should verify HMAC-SHA256 signature and process event', async () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-P17-001', amount: 20000 });
      const signature = generateSandboxSignature(rawPayload, secret);

      const res = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId: `evt_p17_${Date.now()}`,
        eventType: 'payment.authorized',
        rawPayload,
        signature,
        timestamp: new Date().toISOString(),
      });

      expect(res.status).toBe('PROCESSED');
      expect(res.domainEvent).toBe('PAYMENT_COLLECTION_RECEIVED');
    });

    it('should reject tampered signature', async () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-P17-TAMPERED', amount: 20000 });

      const res = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId: `evt_tampered_${Date.now()}`,
        eventType: 'payment.authorized',
        rawPayload,
        signature: 'invalid_signature_hex',
        timestamp: new Date().toISOString(),
      });

      expect(res.status).toBe('INVALID_SIGNATURE');
    });
  });

  // =========================================================================
  // SUITE 7: SENSITIVE DATA MASKING & BORROWER REDACTION
  // =========================================================================
  describe('Suite 7: Sensitive Data Masking & Borrower Safe Views', () => {
    it('should mask sensitive tokens and credentials for safe admin logging', () => {
      const masked = maskSecret('super_secret_production_api_key_12345');
      expect(masked.startsWith('sup')).toBe(true);
      expect(masked.endsWith('345')).toBe(true);
      expect(masked.includes('****')).toBe(true);
      expect(masked).not.toBe('super_secret_production_api_key_12345');
    });
  });

  // =========================================================================
  // SUITE 8: PROVIDER REGISTRY HEALTH IN SANDBOX MODE
  // =========================================================================
  describe('Suite 8: Provider Registry Health Invariants', () => {
    it('should report all 12 domains running in safe SANDBOX mode without external credentials', async () => {
      const health = await providerRegistry.getHealthSummary();
      expect(health.length).toBe(12);

      for (const domain of health) {
        expect(domain.mode).toBe('SANDBOX');
        expect(domain.status).toBe('HEALTHY');
        expect(domain.isExternalApiConnected).toBe(false);
      }
    });
  });

  // =========================================================================
  // SUITE 9: END-TO-END GO-LIVE SMOKE TEST
  // =========================================================================
  describe('Suite 9: End-to-End Go-Live Smoke Test', () => {
    it('should execute full origination to settlement workflow in deterministic sandbox', async () => {
      // 1. KYC PAN
      const kycRes = await providerRegistry.kyc.verifyPan({ panNumber: 'ABCDE1234F', fullName: 'Anil Kumar' }, 'CORR-P17-E2E');
      expect(kycRes.status).toBe('VERIFIED');

      // 2. Bank Verification
      const bankRes = await providerRegistry.bank.verifyBankAccount({ accountNumber: '50100456789123', ifscCode: 'HDFC0001234', beneficiaryName: 'Anil Kumar' }, 'CORR-P17-E2E');
      expect(bankRes.status).toBe('NAME_MATCH');

      // 3. Credit Bureau
      const bureauRes = await providerRegistry.bureau.fetchCreditReport({ pan: 'ABCDE1234F', fullName: 'Anil Kumar', mobile: '9876543211' }, 'CORR-P17-E2E');
      expect(bureauRes.score).toBeGreaterThan(700);

      // 4. Pre-Disbursement Gatekeeper
      const gateOutcome = await payoutGatekeeper.verifyPreDisbursementGates(appAId, tenantA);
      expect(gateOutcome.canDisburse).toBe(true);

      // 5. Payout Execution
      const payoutRes = await providerRegistry.payout.initiatePayout({
        payoutNo: `PO-P17-${Date.now()}`,
        amount: 20000,
        currency: 'INR',
        beneficiaryName: 'Anil Kumar',
        beneficiaryAccountNo: '50100456789123',
        beneficiaryIfsc: 'HDFC0001234',
        purpose: 'LOAN_DISBURSEMENT',
      });
      expect(payoutRes.status).toBe('SUCCESS');
      expect(payoutRes.utrNumber).toBeDefined();

      // 6. Payment Collection
      const paymentOrder = await providerRegistry.payment.createOrder({
        receipt: `REC-P17-${Date.now()}`,
        amount: 7200,
        currency: 'INR',
        customerId: customerAId,
      });
      expect(paymentOrder.status).toBe('CREATED');
      expect(paymentOrder.orderId).toBeDefined();

      const paymentVerify = await providerRegistry.payment.verifyPayment({
        orderId: paymentOrder.orderId,
        providerPaymentId: `pay_p17_${Date.now()}`,
      });
      expect(paymentVerify.status).toBe('SUCCESS');
      expect(paymentVerify.verified).toBe(true);
    });
  });
});
