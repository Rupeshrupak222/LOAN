import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { contractsService } from '../contracts/contracts.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { WebhookFrameworkService } from '../integrations/webhooks/webhook-framework.service';
import { prisma } from '../../config/prisma';
import * as auditService from '../audit/audit.service';
import { IntegrationHubError } from '../integrations/integration.errors';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

describe('PHASE 5 — Real eSign / Digital Agreement Verification Contract & Security', () => {
  const originalEnv = { ...process.env };
  let logAuditSpy: any;

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.ESIGN_GATEWAY_API_KEY;
    delete process.env.ESIGN_GATEWAY_BASE_URL;
    delete process.env.ESIGN_WEBHOOK_SECRET;

    // Spy on audit logger
    logAuditSpy = vi.spyOn(auditService, 'logAudit').mockImplementation(async () => null as any);

    // Mock prisma loanApplication findUnique and update
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
      id: 'app-esign-100',
      applicationNo: 'APP-100-TEST',
      customerId: 'cust-100',
      productId: 'prod-100',
      tenantId: 'tenant-101',
      requestedAmount: 100000 as any,
      tenureMonths: 12,
      status: 'APPROVED',
      customer: {
        id: 'cust-100',
        customerCode: 'CUST-100',
        firstName: 'Rohit',
        lastName: 'Sharma',
        mobile: '9876543210',
        email: 'rohit.sharma@example.com',
      },
      product: {
        id: 'prod-100',
        name: 'Personal Loan',
        interestRate: 14.5 as any,
        processingFeePct: 2.0 as any,
      },
      tenant: {
        id: 'tenant-101',
        name: 'Adyapan Finance',
        cinNumber: 'U65999MH2026PTC123456',
        rbiRegistrationNo: 'N-13.00123',
      },
    } as any);

    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({
      id: 'app-esign-100',
      status: 'READY_FOR_DISBURSEMENT',
    } as any);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Contract 1: Real provider signing session created successfully
  // -------------------------------------------------------------------------
  it('01: Real provider signing request created with REAL_PROVIDER mode and isSandbox=false', async () => {
    process.env.ESIGN_GATEWAY_API_KEY = 'live_esign_key_secret_123';
    process.env.ESIGN_GATEWAY_BASE_URL = 'https://api.esign-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/v1/esign/sessions')) {
        return new Response(
          JSON.stringify({
            sessionId: 'REAL-DIGIO-SES-9988',
            status: 'SESSION_CREATED',
            signingUrl: 'https://app.esign-provider.in/sign/REAL-DIGIO-SES-9988',
            expiresAt: '2026-09-21T12:00:00.000Z',
            providerReference: 'DIGIO-REQ-9988-REF',
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const session = await contractsService.initiateESign('app-esign-100', 'DIGIO_ESIGN', {
      id: 'usr-1',
      tenantId: 'tenant-101',
    });

    expect(session.sessionId).toBe('REAL-DIGIO-SES-9988');
    expect(session.providerReference).toBe('DIGIO-REQ-9988-REF');
    expect(session.signingUrl).toContain('https://app.esign-provider.in/sign/');
    expect(session.isSandbox).toBe(false);
    expect(session.verificationMode).toBe('PROVIDER_AUTOMATED');
    expect(session.status).toBe('INITIATED');
  });

  // -------------------------------------------------------------------------
  // Contract 2: Provider transaction/reference is persisted
  // -------------------------------------------------------------------------
  it('02: Provider reference is recorded in session and audit log', async () => {
    process.env.ESIGN_GATEWAY_API_KEY = 'live_esign_key_secret_123';
    process.env.ESIGN_GATEWAY_BASE_URL = 'https://api.esign-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          sessionId: 'REAL-LEGALITY-SES-77',
          status: 'SESSION_CREATED',
          signingUrl: 'https://app.legality.in/sign/77',
          providerReference: 'LEGALITY-TXN-7788',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const session = await contractsService.initiateESign('app-esign-100', 'LEGALITY_ESIGN', {
      id: 'usr-1',
      tenantId: 'tenant-101',
    });

    expect(session.providerReference).toBe('LEGALITY-TXN-7788');
    expect(logAuditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INITIATE_ESIGN',
        entityId: 'app-esign-100',
        newValue: expect.objectContaining({
          providerReference: 'LEGALITY-TXN-7788',
          isSandbox: false,
        }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Contract 3 & 4: Frontend cannot force SIGNED without provider confirmation
  // -------------------------------------------------------------------------
  it('03: Real provider session completion fails if upstream provider has not confirmed SIGNED', async () => {
    process.env.ESIGN_GATEWAY_API_KEY = 'live_esign_key_secret_123';
    process.env.ESIGN_GATEWAY_BASE_URL = 'https://api.esign-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/status')) {
        return new Response(
          JSON.stringify({
            sessionId: 'REAL-SES-PENDING',
            status: 'SIGN_PENDING',
            isSigned: false,
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response(
        JSON.stringify({
          sessionId: 'REAL-SES-PENDING',
          status: 'SESSION_CREATED',
          signingUrl: 'https://app.esign.in/sign',
          providerReference: 'DIGIO-PENDING-REF',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const session = await contractsService.initiateESign('app-esign-100', 'DIGIO_ESIGN', {
      id: 'usr-1',
      tenantId: 'tenant-101',
    });

    // Frontend attempts to complete eSign while provider is still SIGN_PENDING
    await expect(
      contractsService.completeESign(session.sessionId, { ipAddress: '192.168.1.1' }, { id: 'usr-1', tenantId: 'tenant-101' })
    ).rejects.toThrow(BadRequestError);
  });

  // -------------------------------------------------------------------------
  // Contract 5: Valid signed webhook -> agreement becomes signed / executed
  // -------------------------------------------------------------------------
  it('05: Valid signed webhook authoritatively marks agreement EXECUTED and session SIGNED', async () => {
    const webhookSecret = 'live_esign_webhook_secret_2026';
    WebhookFrameworkService.getInstance().setSecret('digio_esign', webhookSecret);

    const agreement = await contractsService.generateDigitalAgreement('app-esign-100');
    const session = await contractsService.initiateESign('app-esign-100');

    const rawPayload = JSON.stringify({
      sessionId: session.sessionId,
      documentId: agreement.agreementId,
      status: 'SIGNED',
      isSigned: true,
      signerAadhaarLast4: '8842',
      certificateThumbprint: 'SHA256:LIVE:CERT:9911',
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');
    const timestamp = new Date().toISOString();

    const webhookResult = await contractsService.handleEsignWebhook({
      providerId: 'digio_esign',
      eventId: `EVT-ESIGN-${Date.now()}`,
      eventType: 'DOCUMENT_SIGNED',
      rawPayload,
      signature,
      timestamp,
    });

    expect(webhookResult.status).toBe('PROCESSED');
    expect(session.status).toBe('SIGNED');
    expect(agreement.status).toBe('EXECUTED');
  });

  // -------------------------------------------------------------------------
  // Contract 6: Invalid webhook signature -> rejected
  // -------------------------------------------------------------------------
  it('06: Webhook with invalid HMAC signature is rejected as INVALID_SIGNATURE', async () => {
    const session = await contractsService.initiateESign('app-esign-100');
    const rawPayload = JSON.stringify({
      sessionId: session.sessionId,
      status: 'SIGNED',
    });

    const forgedSignature = 'forged_fake_signature_abc123';
    const timestamp = new Date().toISOString();

    const webhookResult = await contractsService.handleEsignWebhook({
      providerId: 'digio_esign',
      eventId: `EVT-ESIGN-FORGED-${Date.now()}`,
      eventType: 'DOCUMENT_SIGNED',
      rawPayload,
      signature: forgedSignature,
      timestamp,
    });

    expect(webhookResult.status).toBe('INVALID_SIGNATURE');
  });

  // -------------------------------------------------------------------------
  // Contract 7: Replay/duplicate webhook -> rejected / duplicate
  // -------------------------------------------------------------------------
  it('07: Duplicate webhook event ID is identified and rejected as DUPLICATE', async () => {
    const webhookSecret = 'live_esign_webhook_secret_2026';
    WebhookFrameworkService.getInstance().setSecret('digio_esign', webhookSecret);

    const session = await contractsService.initiateESign('app-esign-100');
    const rawPayload = JSON.stringify({
      sessionId: session.sessionId,
      status: 'SIGNED',
    });

    const signature = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');
    const timestamp = new Date().toISOString();
    const eventId = `EVT-DUP-TEST-${Date.now()}`;

    const res1 = await contractsService.handleEsignWebhook({
      providerId: 'digio_esign',
      eventId,
      eventType: 'DOCUMENT_SIGNED',
      rawPayload,
      signature,
      timestamp,
    });
    expect(res1.status).toBe('PROCESSED');

    // Duplicate call with same event ID
    const res2 = await contractsService.handleEsignWebhook({
      providerId: 'digio_esign',
      eventId,
      eventType: 'DOCUMENT_SIGNED',
      rawPayload,
      signature,
      timestamp,
    });
    expect(res2.status).toBe('DUPLICATE');
  });

  // -------------------------------------------------------------------------
  // Contract 8: Provider network failure -> NEVER sandbox fallback
  // -------------------------------------------------------------------------
  it('08: Real provider failure strictly throws IntegrationHubError and NEVER falls back to Sandbox', async () => {
    process.env.ESIGN_GATEWAY_API_KEY = 'live_esign_key_secret_123';
    process.env.ESIGN_GATEWAY_BASE_URL = 'https://api.esign-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network ECONNREFUSED');
    });

    let caughtError: any = null;
    try {
      await contractsService.initiateESign('app-esign-100', 'DIGIO_ESIGN', {
        id: 'usr-1',
        tenantId: 'tenant-101',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // Contract 9: Missing credentials -> explicit sandbox mode
  // -------------------------------------------------------------------------
  it('09: Missing real credentials routes to explicit sandbox mode with SBX reference', async () => {
    const session = await contractsService.initiateESign('app-esign-100');

    expect(session.isSandbox).toBe(true);
    expect(session.verificationMode).toBe('SANDBOX_SIMULATION');
    expect(session.providerReference).toContain('SBX-ESIGN');
  });

  // -------------------------------------------------------------------------
  // Contract 10: Sandbox result cannot be represented as real eSign evidence
  // -------------------------------------------------------------------------
  it('10: Sandbox result cannot be represented as REAL_PROVIDER / official provider evidence', async () => {
    const session = await contractsService.initiateESign('app-esign-100');

    expect(session.isSandbox).toBe(true);
    expect(session.verificationMode).not.toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 11: Cross-tenant IDOR attempt is rejected
  // -------------------------------------------------------------------------
  it('11: Cross-tenant IDOR access attempt is rejected with ForbiddenError', async () => {
    await expect(
      contractsService.initiateESign('app-esign-100', 'MOCK_DIGISIGN', {
        id: 'attacker-1',
        tenantId: 'tenant-attacker-org', // Mismatched tenant
      })
    ).rejects.toThrow(ForbiddenError);
  });
});
