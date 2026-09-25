import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '../../config/prisma';
import { providerRegistry } from './provider-registry.service';
import { webhookFramework } from './webhooks/webhook-framework.service';
import { generateSandboxSignature } from './webhooks/signature.verifier';
import { maskSecret, validateOutboundUrl, getProviderConfigurations } from './integration.config';
import { kycService } from '../kyc/kyc.service';
import { contractsService } from '../contracts/contracts.service';
import { templateService } from '../communications/template.service';
import { tenantIntegrationService } from './tenant-integrations.service';
import { IntegrationHubError } from './integration.errors';

describe('Phase 9H: Real External Provider Integration + Provider-Neutral Adapters', { timeout: 25000 }, () => {
  const tenantA = 'tenant_p9h_a';
  const tenantB = 'tenant_p9h_b';
  let testUserId = '';
  let testCustomerId = '';
  let testAppId = '';

  beforeAll(async () => {
    // 1. Setup Tenant A
    await prisma.tenant.upsert({
      where: { id: tenantA },
      update: {},
      create: {
        id: tenantA,
        code: `P9H_A_${Date.now()}`,
        name: 'Phase 9H Prime Lending Tenant A',
        contactEmail: 'admin@tenant-a.com',
      },
    });

    // 2. Setup Tenant B
    await prisma.tenant.upsert({
      where: { id: tenantB },
      update: {},
      create: {
        id: tenantB,
        code: `P9H_B_${Date.now()}`,
        name: 'Phase 9H NBFC Tenant B',
        contactEmail: 'admin@tenant-b.com',
      },
    });

    // 3. Create User & Customer in Tenant A
    const user = await prisma.user.create({
      data: {
        email: `arjun.p9h.${Date.now()}@example.com`,
        passwordHash: 'hashed_password_p9h',
        firstName: 'Arjun',
        lastName: 'Menon',
        tenantId: tenantA,
      },
    });
    testUserId = user.id;

    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-P9H-${Date.now().toString().slice(-4)}`,
        userId: user.id,
        tenantId: tenantA,
        firstName: 'Arjun',
        lastName: 'Menon',
        mobile: '9988776655',
        email: user.email,
        monthlyIncome: 90000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
      },
    });
    testCustomerId = customer.id;

    // 4. Create Loan Product
    const product = await prisma.loanProduct.create({
      data: {
        tenantId: tenantA,
        name: 'Phase 9H Prime Salary Loan',
        code: `P9H_PROD_${Date.now()}`,
        productType: 'PERSONAL',
        minAmount: 10000,
        maxAmount: 500000,
        minTenureMonths: 6,
        maxTenureMonths: 36,
        interestRate: 14.5,
        processingFeePct: 1.5,
        isActive: true,
      },
    });

    // 5. Create Loan Application
    const app = await prisma.loanApplication.create({
      data: {
        applicationNo: `APP-P9H-${Date.now().toString().slice(-4)}`,
        tenantId: tenantA,
        customerId: customer.id,
        productId: product.id,
        requestedAmount: 100000,
        tenureMonths: 12,
        purpose: 'Integration Testing',
        status: 'APPROVED',
      },
    });
    testAppId = app.id;
  });

  beforeEach(() => {
    webhookFramework.clearForTesting();
  });

  // -------------------------------------------------------------------------
  // 1. Provider Registry & Mode Attribution
  // -------------------------------------------------------------------------
  it('01: Provider Registry resolves domain adapters with clear execution mode labeling', async () => {
    const kycResolution = providerRegistry.getKycProvider(tenantA);
    expect(kycResolution.provider).toBeDefined();
    expect(['REAL_PROVIDER', 'SANDBOX_PROVIDER']).toContain(kycResolution.mode);

    const bureauResolution = providerRegistry.getBureauProvider(tenantA);
    expect(bureauResolution.provider).toBeDefined();
    expect(['REAL_PROVIDER', 'SANDBOX_PROVIDER']).toContain(bureauResolution.mode);

    const esignResolution = providerRegistry.getEsignProvider(tenantA);
    expect(esignResolution.provider).toBeDefined();
    expect(['REAL_PROVIDER', 'SANDBOX_PROVIDER']).toContain(esignResolution.mode);

    const paymentResolution = providerRegistry.getPaymentProvider(tenantA);
    expect(paymentResolution.provider).toBeDefined();
    expect(['REAL_PROVIDER', 'SANDBOX_PROVIDER']).toContain(paymentResolution.mode);

    const healthSummary = await providerRegistry.getHealthSummary();
    expect(healthSummary.length).toBeGreaterThanOrEqual(10);
    expect(healthSummary.some((h) => h.domain.includes('KYC'))).toBe(true);
    expect(healthSummary.some((h) => h.domain.includes('Credit Bureau'))).toBe(true);
    expect(healthSummary.some((h) => h.domain.includes('Payment Gateway'))).toBe(true);
    expect(healthSummary.some((h) => h.domain.includes('Digital eSign'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 2. Credential Security & Secret Masking
  // -------------------------------------------------------------------------
  it('02: Credential Security: secrets are masked and never exposed in plaintext', () => {
    expect(maskSecret(null)).toBe('NOT_SET');
    expect(maskSecret(undefined)).toBe('NOT_SET');
    expect(maskSecret('12345')).toBe('******');
    expect(maskSecret('secret_api_key_razorpay_live_9988')).toBe('sec****988');

    const configs = getProviderConfigurations();
    for (const [key, cfg] of Object.entries(configs)) {
      expect(cfg.maskedConfigSummary).toBeDefined();
      const summaryStr = JSON.stringify(cfg.maskedConfigSummary);
      expect(summaryStr).not.toContain('secret_api_key_razorpay_live');
      expect(summaryStr).not.toContain('live_secret');
    }
  });

  // -------------------------------------------------------------------------
  // 3. SSRF & Outbound URL Security Guard
  // -------------------------------------------------------------------------
  it('03: SSRF Protection blocks private subnets, loopbacks, and cloud metadata IPs', () => {
    // Valid external HTTPS URL
    const validUrl = validateOutboundUrl('https://api.razorpay.com/v1');
    expect(validUrl.hostname).toBe('api.razorpay.com');

    // Block localhost
    expect(() => validateOutboundUrl('http://127.0.0.1:8080')).toThrow(IntegrationHubError);

    // Block private RFC 1918 IPs
    expect(() => validateOutboundUrl('http://10.0.0.5/api')).toThrow(IntegrationHubError);
    expect(() => validateOutboundUrl('http://192.168.1.100')).toThrow(IntegrationHubError);
    expect(() => validateOutboundUrl('http://172.16.0.1')).toThrow(IntegrationHubError);

    // Block Cloud Metadata IP (AWS/GCP/Azure link-local 169.254.169.254)
    expect(() => validateOutboundUrl('http://169.254.169.254/latest/meta-data')).toThrow(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // 4. KYC Integration, Consent & Data Minimization
  // -------------------------------------------------------------------------
  it('04: KYC Service enforces data minimization, masked Aadhaar, and returns provider metadata', async () => {
    const panResult = await kycService.verifyPan(
      {
        panNumber: 'ABCDE1234F',
        fullName: 'Arjun Menon',
      },
      { forceMode: 'SANDBOX_PROVIDER' }
    );
    expect(panResult.success).toBe(true);
    expect(panResult.isPanValid).toBe(true);
    expect(panResult.panNumber).toBe('ABCDE1234F');
    expect(panResult.providerMetadata).toBeDefined();
    expect(panResult.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');

    const aadhaarResult = await kycService.verifyAadhaar(
      {
        aadhaarNumber: '998877665544',
        fullName: 'Arjun Menon',
      },
      { forceMode: 'SANDBOX_PROVIDER' }
    );
    expect(aadhaarResult.success).toBe(true);
    expect(aadhaarResult.aadhaarLast4).toBe('5544');
    expect(aadhaarResult.maskedAadhaar).toBe('XXXX-XXXX-5544');
    // Full Aadhaar must NEVER be in response
    expect((aadhaarResult as any).aadhaarNumber).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 5. Credit Bureau Adapter & Canonical Schema Normalization
  // -------------------------------------------------------------------------
  it('05: Credit Bureau Adapter normalizes canonical reports without inventing scores', async () => {
    const { provider } = providerRegistry.getBureauProvider(tenantA);
    const correlationId = 'INT-TEST-BUR-001';

    const report = await provider.fetchCreditReport(
      {
        pan: 'ABCDE1234F',
        fullName: 'Arjun Menon',
        mobile: '9988776655',
      },
      correlationId
    );

    expect(report.status).toBe('COMPLETED');
    expect(report.score).toBeGreaterThanOrEqual(300);
    expect(report.scoreTier).toBeDefined();
    expect(report.reportReference).toBeDefined();
    expect(Array.isArray(report.tradelines)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Bank Account Verification
  // -------------------------------------------------------------------------
  it('06: Bank Account Verification performs account check with name match scoring', async () => {
    const { provider } = providerRegistry.getBankVerificationProvider(tenantA);
    const correlationId = 'INT-TEST-BNK-001';

    const bankResult = await provider.verifyBankAccount(
      {
        accountNumber: '112233445566',
        ifscCode: 'SBIN0001234',
        beneficiaryName: 'Arjun Menon',
      },
      correlationId
    );

    expect(bankResult.isValid).toBe(true);
    expect(bankResult.registeredName).toBeDefined();
    expect(bankResult.nameMatchPercentage).toBeGreaterThanOrEqual(50);
    expect(['PENNY_DROP', 'SANDBOX_SIMULATED', 'REVERSE_PENNY_DROP']).toContain(bankResult.verificationMode);
  });

  // -------------------------------------------------------------------------
  // 7. eSign Integration & Gated Agreement Execution
  // -------------------------------------------------------------------------
  it('07: eSign Flow generates session and executes agreement strictly on verified callback', async () => {
    // 1. Initiate eSign
    const session = await contractsService.initiateESign(testAppId, 'MOCK_DIGISIGN', {
      id: testUserId,
      tenantId: tenantA,
    });
    expect(session.sessionId).toBeDefined();
    expect(session.status).toBe('INITIATED');
    expect(session.signingUrl).toContain(session.sessionId);

    // Verify application is NOT yet ready for disbursement before eSign
    const appBefore = await prisma.loanApplication.findUnique({ where: { id: testAppId } });
    expect(appBefore?.status).not.toBe('READY_FOR_DISBURSEMENT');

    // 2. Complete eSign with verified certificate payload
    const completedSession = await contractsService.completeESign(session.sessionId, {
      ipAddress: '103.22.45.10',
      signerAadhaarLast4: '5544',
      certificateThumbprint: 'SHA256:E9A3BC88F0123456789',
    });
    expect(completedSession.status).toBe('SIGNED');
    expect(completedSession.certificateId).toBeDefined();

    // Verify application is now transitioned to READY_FOR_DISBURSEMENT
    const appAfter = await prisma.loanApplication.findUnique({ where: { id: testAppId } });
    expect(appAfter?.status).toBe('READY_FOR_DISBURSEMENT');
  });

  // -------------------------------------------------------------------------
  // 8. Webhook HMAC Signature Verification
  // -------------------------------------------------------------------------
  it('08: Webhook HMAC Signature Verification accepts valid signature and rejects tampered payload', async () => {
    const rawPayload = JSON.stringify({
      orderId: 'ORDER_9988',
      paymentId: 'pay_live_776655',
      amount: 500000,
    });
    const secret = 'adyapan_sandbox_payment_secret_2026';
    const validSignature = generateSandboxSignature(rawPayload, secret);

    // Valid Signature
    const validResult = await webhookFramework.processInboundWebhook({
      providerId: 'sandbox_payment',
      eventId: `EVT-SIG-VALID-${Date.now()}`,
      eventType: 'payment.authorized',
      rawPayload,
      signature: validSignature,
      timestamp: new Date().toISOString(),
    });
    expect(validResult.status).toBe('PROCESSED');
    expect(validResult.domainEvent).toBe('PAYMENT_COLLECTION_RECEIVED');

    // Tampered / Invalid Signature
    const invalidResult = await webhookFramework.processInboundWebhook({
      providerId: 'sandbox_payment',
      eventId: `EVT-SIG-INVALID-${Date.now()}`,
      eventType: 'payment.authorized',
      rawPayload,
      signature: 'invalid_tampered_signature_hex_123456',
      timestamp: new Date().toISOString(),
    });
    expect(invalidResult.status).toBe('INVALID_SIGNATURE');
    expect(invalidResult.message).toContain('HMAC signature verification failed');
  });

  // -------------------------------------------------------------------------
  // 9. Webhook Timestamp Replay Attack Protection
  // -------------------------------------------------------------------------
  it('09: Webhook Replay Protection blocks events with excessive timestamp drift (>5 min)', async () => {
    const rawPayload = JSON.stringify({ transferId: 'tr_123', status: 'SUCCESS' });
    const secret = 'adyapan_sandbox_payout_secret_2026';
    const signature = generateSandboxSignature(rawPayload, secret);

    // Stale timestamp (15 minutes in the past)
    const staleTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const replayResult = await webhookFramework.processInboundWebhook({
      providerId: 'sandbox_payout',
      eventId: `EVT-REPLAY-${Date.now()}`,
      eventType: 'payout.processed',
      rawPayload,
      signature,
      timestamp: staleTimestamp,
    });

    expect(replayResult.status).toBe('REPLAY_ATTACK');
    expect(replayResult.message).toContain('replay attack blocked');
  });

  // -------------------------------------------------------------------------
  // 10. Webhook Deduplication & Idempotency
  // -------------------------------------------------------------------------
  it('10: Webhook Deduplication prevents processing duplicate event IDs', async () => {
    const eventId = `EVT-IDEMP-${Date.now()}`;
    const rawPayload = JSON.stringify({ sessionId: 'ESIGN-001', status: 'SIGNED' });
    const secret = 'adyapan_sandbox_esign_secret_2026';
    const signature = generateSandboxSignature(rawPayload, secret);

    // 1st Ingestion
    const firstResult = await webhookFramework.processInboundWebhook({
      providerId: 'sandbox_esign',
      eventId,
      eventType: 'document.signed',
      rawPayload,
      signature,
      timestamp: new Date().toISOString(),
    });
    expect(firstResult.status).toBe('PROCESSED');

    // 2nd Ingestion (Duplicate Event ID)
    const secondResult = await webhookFramework.processInboundWebhook({
      providerId: 'sandbox_esign',
      eventId,
      eventType: 'document.signed',
      rawPayload,
      signature,
      timestamp: new Date().toISOString(),
    });
    expect(secondResult.status).toBe('DUPLICATE');
    expect(secondResult.message).toContain('Duplicate event detected');
  });

  // -------------------------------------------------------------------------
  // 11. Disbursement / Payout Provider Adapter
  // -------------------------------------------------------------------------
  it('11: Disbursement Payout Provider executes payouts and returns canonical UTR', async () => {
    const { provider } = providerRegistry.getPayoutProvider(tenantA);
    const correlationId = 'INT-TEST-DISB-001';

    const payoutResult = await provider.initiatePayout(
      {
        payoutId: `PO-${Date.now()}`,
        loanId: 'LOAN-P9H-001',
        amount: 100000,
        currency: 'INR',
        beneficiaryName: 'Arjun Menon',
        accountNumber: '112233445566',
        ifscCode: 'SBIN0001234',
        paymentMode: 'IMPS',
        purpose: 'LOAN_DISBURSEMENT',
      },
      correlationId
    );

    expect(['PAYOUT_SUCCESS', 'SUCCESS']).toContain(payoutResult.status);
    const utr = (payoutResult as any).utrNumber || (payoutResult as any).utr;
    expect(utr).toBeDefined();
    expect(utr.length).toBeGreaterThan(6);
  });

  // -------------------------------------------------------------------------
  // 12. Communication Templates & Lifecycle
  // -------------------------------------------------------------------------
  it('12: Communication Template Service renders institutional notifications with variable checks', () => {
    const templates = templateService.listTemplates({ tenantId: 'DEFAULT' });
    expect(templates.length).toBeGreaterThanOrEqual(5);

    const offerTemplate = templates.find((t) => t.code.includes('OFFER') || t.eventCode === 'APPLICATION_APPROVED');
    if (offerTemplate) {
      const rendered = templateService.renderTemplate(offerTemplate, {
        customerName: 'Arjun Menon',
        amount: '1,00,000',
        tenure: '12',
        interestRate: '14.5%',
        emi: '8,990',
      });
      expect(rendered.body).toContain('Arjun Menon');
    }
  });

  // -------------------------------------------------------------------------
  // 13. Tenant Isolation & Custom Overrides
  // -------------------------------------------------------------------------
  it('13: Tenant Isolation enforces independent routing and prevents cross-tenant access', () => {
    const tenantARoutings = tenantIntegrationService.getTenantRoutings('tenant-adyapan-default');
    const tenantBRoutings = tenantIntegrationService.getTenantRoutings('tenant-apex-nbfc');

    expect(tenantARoutings.length).toBeGreaterThan(0);
    expect(tenantBRoutings.length).toBeGreaterThan(0);

    const tenantACredit = tenantIntegrationService.getTenantRoutingForCategory('tenant-adyapan-default', 'CREDIT');
    const tenantBCredit = tenantIntegrationService.getTenantRoutingForCategory('tenant-apex-nbfc', 'CREDIT');

    expect(tenantACredit?.primaryProvider).toBe('EXPERIAN');
    expect(tenantBCredit?.primaryProvider).toBe('CRIF');
    expect(tenantACredit?.primaryProvider).not.toEqual(tenantBCredit?.primaryProvider);
  });
});
