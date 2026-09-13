import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { providerRegistry } from './provider-registry.service';
import { webhookFramework } from './webhooks/webhook-framework.service';
import { generateSandboxSignature } from './webhooks/signature.verifier';
import { idempotencyEngine } from './resilience/idempotency.engine';
import { RetryEngine } from './resilience/retry.engine';
import { integrationOrchestrator } from './integration-orchestrator.service';
import { SandboxKycProvider } from './sandbox/sandbox-kyc.provider';
import { SandboxBureauProvider } from './sandbox/sandbox-bureau.provider';
import { SandboxBankVerificationProvider } from './sandbox/sandbox-bank.provider';
import { SandboxAccountAggregatorProvider } from './sandbox/sandbox-aa.provider';
import { SandboxEsignProvider } from './sandbox/sandbox-esign.provider';
import { SandboxMandateProvider } from './sandbox/sandbox-mandate.provider';

describe('Phase 16: Integration-Ready Lending OS without External APIs', () => {
  const testTenantId = 'tenant_p16_int_test';
  let testCustomerId = '';
  let testProductId = '';
  let testAppId = '';
  let mockActor = { id: 'admin_p16', email: 'admin@adyapan.io', roles: ['ADMIN'] };

  beforeAll(async () => {
    // 1. Ensure test tenant exists
    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        code: `P16_TEN_${Date.now()}`,
        name: 'Phase 16 Integration Test Tenant',
        contactEmail: 'admin@p16.adyapan.io',
      },
    });

    // 2. Create test user
    const user = await prisma.user.create({
      data: {
        email: `vikram.p16.${Date.now()}@example.com`,
        passwordHash: 'dummy-hash',
        firstName: 'Vikram',
        lastName: 'Patel',
        tenantId: testTenantId,
      },
    });
    mockActor = { id: user.id, email: user.email, roles: ['ADMIN'] };

    // 3. Create test customer
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-P16-${Date.now().toString().slice(-4)}`,
        userId: user.id,
        tenantId: testTenantId,
        firstName: 'Vikram',
        lastName: 'Patel',
        mobile: '9876543210',
        email: user.email,
        monthlyIncome: 75000,
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        documents: {
          create: [
            { category: 'IDENTITY', documentType: 'PAN', fileName: 'pan.jpg', storageKey: 'docs/p16/pan.jpg', contentType: 'image/jpeg', sizeBytes: 1024, status: 'VERIFIED', verified: true },
            { category: 'ADDRESS', documentType: 'AADHAAR', fileName: 'aadhaar.jpg', storageKey: 'docs/p16/aadhaar.jpg', contentType: 'image/jpeg', sizeBytes: 1024, status: 'VERIFIED', verified: true },
            { category: 'INCOME', documentType: 'SALARY_SLIP', fileName: 'salary.pdf', storageKey: 'docs/p16/salary.pdf', contentType: 'application/pdf', sizeBytes: 1024, status: 'VERIFIED', verified: true },
            { category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT', fileName: 'stmt.pdf', storageKey: 'docs/p16/stmt.pdf', contentType: 'application/pdf', sizeBytes: 1024, status: 'VERIFIED', verified: true },
          ],
        },
        bankAccounts: {
          create: {
            accountHolderName: 'Vikram Patel',
            bankName: 'State Bank of India',
            accountNumber: '1122334455',
            ifscCode: 'SBIN0001234',
            isVerified: true,
          },
        },
      },
    });
    testCustomerId = customer.id;

    // 4. Create active loan product
    const product = await prisma.loanProduct.create({
      data: {
        tenantId: testTenantId,
        name: 'P16 Instant Flexi Micro Loan',
        code: `P16_FLX_${Date.now()}`,
        productType: 'PERSONAL',
        minAmount: 5000,
        maxAmount: 100000,
        minTenureMonths: 1,
        maxTenureMonths: 12,
        interestRate: 18.0,
        processingFeePct: 2.0,
        isActive: true,
      },
    });
    testProductId = product.id;

    // 5. Create loan application
    const app = await prisma.loanApplication.create({
      data: {
        tenantId: testTenantId,
        customerId: testCustomerId,
        productId: testProductId,
        applicationNo: `APP-P16-${Date.now()}`,
        requestedAmount: 25000,
        tenureMonths: 3,
        status: 'SUBMITTED',
      },
    });
    testAppId = app.id;
  });

  afterAll(async () => {
    try {
      await prisma.document.deleteMany({ where: { customer: { tenantId: testTenantId } } });
      await prisma.repaymentScheduleItem.deleteMany({ where: { loan: { tenantId: testTenantId } } });
      await prisma.loan.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.loanApplication.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.customerBankAccount.deleteMany({ where: { customer: { tenantId: testTenantId } } });
      await prisma.customer.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.loanProduct.deleteMany({ where: { tenantId: testTenantId } });
    } catch {}
  });

  // =========================================================================
  // SUITE 1: KYC SANDBOX & NORMALIZED CONTRACTS
  // =========================================================================
  describe('Suite 1: Deterministic KYC Sandbox Provider', () => {
    const kyc = new SandboxKycProvider();

    it('should verify valid PAN and return normalized demographic match', async () => {
      const res = await kyc.verifyPan(
        { panNumber: 'ABCDE1234F', fullName: 'Vikram Patel' },
        'CORR-KYC-01'
      );
      expect(res.status).toBe('VERIFIED');
      expect(res.isPanValid).toBe(true);
      expect(res.nameMatchScore).toBeGreaterThanOrEqual(95);
      expect(res.category).toBe('INDIVIDUAL');
    });

    it('should return name mismatch status for mismatch triggers', async () => {
      const res = await kyc.verifyPan(
        { panNumber: 'ABCDE8888M', fullName: 'Vikram Patel' },
        'CORR-KYC-02'
      );
      expect(res.status).toBe('VERIFIED');
      expect(res.nameMatchScore).toBe(35);
    });

    it('should return FAILED for invalid record triggers', async () => {
      const res = await kyc.verifyPan(
        { panNumber: 'ABCDE9999F', fullName: 'Fake Applicant' },
        'CORR-KYC-03'
      );
      expect(res.status).toBe('FAILED');
      expect(res.isPanValid).toBe(false);
    });

    it('should simulate timeout error for timeout trigger PANs', async () => {
      await expect(
        kyc.verifyPan({ panNumber: 'ABCDE0000T', fullName: 'Timeout User' }, 'CORR-KYC-04')
      ).rejects.toThrow('[PROVIDER_TIMEOUT]');
    });

    it('should verify Aadhaar Digilocker flow with masked PII', async () => {
      const res = await kyc.verifyAadhaarDigilocker(
        { consentId: 'CNS-OK-1', otp: '123456' },
        'CORR-KYC-05'
      );
      expect(res.status).toBe('VERIFIED');
      expect(res.isMasked).toBe(true);
      expect(res.aadhaarLast4).toBe('8842');
      expect(res.address.city).toBe('Bengaluru');
    });

    it('should verify selfie face match and liveness', async () => {
      const res = await kyc.verifyFace(
        { selfieImageBase64: 'data:image/png;base64,mock', livenessCheckRequired: true },
        'CORR-KYC-06'
      );
      expect(res.status).toBe('VERIFIED');
      expect(res.faceMatchScore).toBeGreaterThanOrEqual(90);
      expect(res.isLivenessDetected).toBe(true);
      expect(res.spoofRisk).toBe('LOW');
    });
  });

  // =========================================================================
  // SUITE 2: CREDIT BUREAU SANDBOX
  // =========================================================================
  describe('Suite 2: Deterministic Credit Bureau Sandbox Provider', () => {
    const bureau = new SandboxBureauProvider();

    it('should return excellent score for GOOD_CREDIT scenario', async () => {
      bureau.setForcedScenario('GOOD_CREDIT');
      const res = await bureau.fetchCreditReport({ pan: 'ABCDE1234F', fullName: 'Vikram', mobile: '9876543210' }, 'CORR-BUR-01');
      expect(res.status).toBe('COMPLETED');
      expect(res.score).toBe(785);
      expect(res.scoreTier).toBe('EXCELLENT');
      expect(res.dpd90PlusCount).toBe(0);
      expect(res.writtenOffCount).toBe(0);
    });

    it('should return average score for AVERAGE_CREDIT scenario', async () => {
      bureau.setForcedScenario('AVERAGE_CREDIT');
      const res = await bureau.fetchCreditReport({ pan: 'ABCDE0680A', fullName: 'Vikram', mobile: '9876543210' }, 'CORR-BUR-02');
      expect(res.status).toBe('COMPLETED');
      expect(res.score).toBe(685);
      expect(res.scoreTier).toBe('FAIR');
    });

    it('should return written off and poor score for POOR_CREDIT scenario', async () => {
      bureau.setForcedScenario('POOR_CREDIT');
      const res = await bureau.fetchCreditReport({ pan: 'ABCDE0520P', fullName: 'Vikram', mobile: '9876543210' }, 'CORR-BUR-03');
      expect(res.status).toBe('COMPLETED');
      expect(res.score).toBe(520);
      expect(res.scoreTier).toBe('POOR');
      expect(res.writtenOffCount).toBe(1);
      expect(res.totalOverdueAmount).toBeGreaterThan(0);
    });

    it('should return -1 score for NO_HISTORY (NTC) scenario', async () => {
      bureau.setForcedScenario('NO_HISTORY');
      const res = await bureau.fetchCreditReport({ pan: 'ABCDE0000N', fullName: 'New User', mobile: '9876543210' }, 'CORR-BUR-04');
      expect(res.status).toBe('COMPLETED');
      expect(res.score).toBe(-1);
      expect(res.scoreTier).toBe('NO_HISTORY');
      expect(res.totalAccounts).toBe(0);
    });

    it('should return high inquiry velocity for HIGH_ENQUIRY scenario', async () => {
      bureau.setForcedScenario('HIGH_ENQUIRY');
      const res = await bureau.fetchCreditReport({ pan: 'ABCDE0012E', fullName: 'Enquiry User', mobile: '9876543210' }, 'CORR-BUR-05');
      expect(res.status).toBe('COMPLETED');
      expect(res.recentInquiriesLast30Days).toBe(12);
    });
  });

  // =========================================================================
  // SUITE 3: BANK VERIFICATION & ACCOUNT AGGREGATOR SANDBOX
  // =========================================================================
  describe('Suite 3: Bank Verification & Account Aggregator Sandbox', () => {
    const bank = new SandboxBankVerificationProvider();
    const aa = new SandboxAccountAggregatorProvider();

    it('should verify valid bank account via penny drop simulation', async () => {
      const res = await bank.verifyBankAccount(
        { accountNumber: '1122334455', ifscCode: 'SBIN0001234', beneficiaryName: 'Vikram Patel' },
        'CORR-BNK-01'
      );
      expect(res.status).toBe('NAME_MATCH');
      expect(res.isValid).toBe(true);
      expect(res.nameMatchPercentage).toBeGreaterThanOrEqual(95);
      expect(res.verificationMode).toBe('PENNY_DROP');
    });

    it('should reject invalid bank account numbers', async () => {
      const res = await bank.verifyBankAccount(
        { accountNumber: '9999999999', ifscCode: 'SBIN0001234', beneficiaryName: 'Vikram Patel' },
        'CORR-BNK-02'
      );
      expect(res.status).toBe('INVALID_ACCOUNT');
      expect(res.isValid).toBe(false);
    });

    it('should create and approve Account Aggregator consent simulation', async () => {
      const consent = await aa.createConsent({
        customerId: testCustomerId,
        mobile: '9876543210',
        pan: 'ABCDE1234F',
        consentDurationMonths: 6,
        dataRangeFrom: '2026-03-01',
        dataRangeTo: '2026-09-01',
        fiTypes: ['DEPOSIT'],
      }, 'CORR-AA-01');

      expect(consent.status).toBe('CONSENT_CREATED');
      expect(consent.redirectUrl).toBeDefined();

      const approvedStatus = await aa.checkConsentStatus(consent.consentHandle, 'CORR-AA-02');
      expect(approvedStatus.status).toBe('CONSENT_APPROVED');

      const telemetry = await aa.fetchFinancialTelemetry(approvedStatus.consentId!, 'CORR-AA-03');
      expect(telemetry.statementAvailable).toBe(true);
      expect(telemetry.averageMonthlyInflow).toBeGreaterThan(0);
      expect(telemetry.bounceCountLast180Days).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 4: DIGITAL ESIGN & MANDATE SANDBOX
  // =========================================================================
  describe('Suite 4: Digital eSign & e-NACH Mandate Sandbox', () => {
    const esign = new SandboxEsignProvider();
    const mandate = new SandboxMandateProvider();

    it('should simulate full eSign lifecycle (created -> signed)', async () => {
      const session = await esign.createSigningSession({
        documentId: 'DOC-SANCTION-101',
        documentTitle: 'Loan Sanction Letter',
        signerName: 'Vikram Patel',
        signerEmail: 'vikram@example.com',
        signerMobile: '9876543210',
        signType: 'AADHAAR_OTP',
      }, 'CORR-ESN-01');

      expect(session.status).toBe('SESSION_CREATED');
      expect(session.signingUrl).toBeDefined();

      const verification = await esign.checkSigningStatus(session.sessionId, 'CORR-ESN-02');
      expect(verification.status).toBe('SIGNED');
      expect(verification.isSigned).toBe(true);
      expect(verification.certificateThumbprint).toBeDefined();
    });

    it('should simulate full Mandate lifecycle (created -> active -> cancelled)', async () => {
      const created = await mandate.createMandate({
        customerId: testCustomerId,
        accountNumber: '1122334455',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Vikram Patel',
        authMode: 'NET_BANKING',
        maxAmount: 15000,
        frequency: 'MONTHLY',
        startDate: '2026-09-15',
        endDate: '2027-09-15',
      }, 'CORR-MND-01');

      expect(created.status).toBe('MANDATE_CREATED');
      expect(created.umrn).toBeDefined();

      const verified = await mandate.verifyMandate(created.mandateId, 'CORR-MND-02');
      expect(verified.status).toBe('MANDATE_ACTIVE');

      const cancelled = await mandate.cancelMandate(created.mandateId, 'Loan prepay closure', 'CORR-MND-03');
      expect(cancelled.status).toBe('MANDATE_CANCELLED');
    });
  });

  // =========================================================================
  // SUITE 5: WEBHOOK FRAMEWORK & SIGNATURE VERIFICATION
  // =========================================================================
  describe('Suite 5: Webhook Framework & Replay Protection', () => {
    webhookFramework.clearForTesting();
    const secret = 'adyapan_sandbox_payment_secret_2026';

    it('should process and normalize valid signed inbound webhook', async () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-TEST-101', amount: 5000, status: 'captured' });
      const signature = generateSandboxSignature(rawPayload, secret);

      const res = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId: `evt_sig_${Date.now()}`,
        eventType: 'payment.authorized',
        rawPayload,
        signature,
        timestamp: new Date().toISOString(),
      });

      expect(res.status).toBe('PROCESSED');
      expect(res.domainEvent).toBe('PAYMENT_COLLECTION_RECEIVED');
      expect(res.entityId).toBe('ORD-TEST-101');
    });

    it('should reject webhook with invalid signature', async () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-BAD-SIG', amount: 5000 });
      const badSignature = 'invalid_tampered_signature_hex';

      const res = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId: `evt_bad_${Date.now()}`,
        eventType: 'payment.authorized',
        rawPayload,
        signature: badSignature,
        timestamp: new Date().toISOString(),
      });

      expect(res.status).toBe('INVALID_SIGNATURE');
    });

    it('should block replay attack with stale timestamp', async () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-REPLAY', amount: 5000 });
      const signature = generateSandboxSignature(rawPayload, secret);
      const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 mins ago

      const res = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId: `evt_replay_${Date.now()}`,
        eventType: 'payment.authorized',
        rawPayload,
        signature,
        timestamp: staleTimestamp,
      });

      expect(res.status).toBe('REPLAY_ATTACK');
    });

    it('should detect and deduplicate duplicate webhook events', async () => {
      const eventId = `evt_dedup_${Date.now()}`;
      const rawPayload = JSON.stringify({ orderId: 'ORD-DEDUP', amount: 5000 });
      const signature = generateSandboxSignature(rawPayload, secret);

      const first = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId,
        eventType: 'payment.authorized',
        rawPayload,
        signature,
        timestamp: new Date().toISOString(),
      });
      expect(first.status).toBe('PROCESSED');

      const duplicate = await webhookFramework.processInboundWebhook({
        providerId: 'sandbox_payment',
        eventId,
        eventType: 'payment.authorized',
        rawPayload,
        signature,
        timestamp: new Date().toISOString(),
      });
      expect(duplicate.status).toBe('DUPLICATE');
    });
  });

  // =========================================================================
  // SUITE 6: RESILIENCE, RETRY & IDEMPOTENCY
  // =========================================================================
  describe('Suite 6: Resilience, Retry & Idempotency Engines', () => {
    idempotencyEngine.clearForTesting();

    it('should guarantee single financial execution with idempotency caching', async () => {
      const idemKey = `IDEM-PAYOUT-TEST-${Date.now()}`;
      let executionCount = 0;

      const callPayout = async () => {
        return await idempotencyEngine.executeIdempotent(idemKey, async () => {
          executionCount++;
          return { payoutId: 'PO-100', utr: 'UTR998877', status: 'SUCCESS' };
        });
      };

      const res1 = await callPayout();
      expect(res1.isCached).toBe(false);
      expect(executionCount).toBe(1);

      const res2 = await callPayout();
      expect(res2.isCached).toBe(true);
      expect(executionCount).toBe(1); // Not executed twice
      expect(res2.result.utr).toBe('UTR998877');
    });

    it('should retry retryable errors with backoff and succeed', async () => {
      let attemptsCount = 0;

      const { result, attempts } = await RetryEngine.executeWithRetry(async (attempt) => {
        attemptsCount++;
        if (attempt === 1) {
          throw new Error('[PROVIDER_TIMEOUT] Gateway connection timeout');
        }
        return { success: true, attemptNumber: attempt };
      }, { maxRetries: 2, initialDelayMs: 20 });

      expect(attempts).toBe(2);
      expect(attemptsCount).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should fail fast on non-retryable validation errors', async () => {
      let attemptsCount = 0;

      await expect(
        RetryEngine.executeWithRetry(async () => {
          attemptsCount++;
          const err: any = new Error('Invalid Account Number');
          err.httpStatus = 400;
          throw err;
        }, { maxRetries: 2, initialDelayMs: 20 })
      ).rejects.toThrow('Invalid Account Number');

      expect(attemptsCount).toBe(1); // Did not retry
    });
  });

  // =========================================================================
  // SUITE 7: CENTRALIZED PROVIDER REGISTRY HEALTH
  // =========================================================================
  describe('Suite 7: Provider Registry Health Summary', () => {
    it('should report all 12 domains running in SANDBOX mode with HEALTHY status', async () => {
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
  // SUITE 8: END-TO-END ORCHESTRATION PIPELINE
  // =========================================================================
  describe('Suite 8: End-to-End Orchestrated Pipeline', () => {
    it('should execute full verification pipeline and auto-generate sanction offer', async () => {
      const outcome = await integrationOrchestrator.executeVerificationPipeline({
        tenantId: testTenantId,
        applicationId: testAppId,
        pan: 'ABCDE1234F',
        fullName: 'Vikram Patel',
        mobile: '9876543210',
        accountNumber: '1122334455',
        ifscCode: 'SBIN0001234',
        actor: mockActor,
      });

      expect(outcome.applicationId).toBe(testAppId);
      expect(outcome.kycStatus).toBe('VERIFIED');
      expect(outcome.bankStatus).toBe('NAME_MATCH');
      expect(outcome.bureauScore).toBeGreaterThan(700);
      expect(outcome.isOfferEligible).toBe(true);
      expect(outcome.orchestrationStatus).toBe('COMPLETED');
      expect(outcome.stepsLog.length).toBeGreaterThanOrEqual(4);
    });
  });
});
