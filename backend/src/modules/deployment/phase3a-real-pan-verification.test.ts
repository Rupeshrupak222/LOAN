import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { kycService } from '../kyc/kyc.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { prisma } from '../../config/prisma';
import * as auditService from '../audit/audit.service';
import { IntegrationHubError } from '../integrations/integration.errors';

describe('PHASE 3A — Real PAN Verification Contract & Security', () => {
  const originalEnv = { ...process.env };
  let logAuditSpy: any;

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.KYC_GATEWAY_API_KEY;
    delete process.env.KYC_GATEWAY_BASE_URL;

    // Reset kycService active adapter to default
    kycService.setAdapter('SANDBOX');

    // Spy on audit logger
    logAuditSpy = vi.spyOn(auditService, 'logAudit').mockImplementation(async () => null as any);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Contract 1: Valid real provider response -> PAN VERIFIED with isSandbox=false
  // -------------------------------------------------------------------------
  it('01: Valid real provider response -> PAN VERIFIED with authoritative metadata and isSandbox=false', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/v1/verify/pan')) {
        return new Response(
          JSON.stringify({
            status: 'VERIFIED',
            isPanValid: true,
            pan: 'ABCDE1234F',
            name: 'ARJUN MENON',
            nameMatchScore: 98,
            isOperative: true,
            category: 'INDIVIDUAL',
            verificationId: 'NSDL-PAN-REAL-998811',
            verifiedAt: '2026-09-20T10:00:00.000Z',
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Arjun Menon',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.isPanValid).toBe(true);
    expect(res.nameOnCard).toBe('ARJUN MENON');
    expect(res.providerReference).toBe('NSDL-PAN-REAL-998811');
    expect(res.providerMetadata.isSandbox).toBe(false);
    expect(res.providerMetadata.verificationMode).toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 2: Real provider rejection -> PAN NOT VERIFIED
  // -------------------------------------------------------------------------
  it('02: Real provider rejection (invalid record) -> PAN NOT VERIFIED (status=FAILED)', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      return new Response(
        JSON.stringify({
          status: 'INVALID',
          isPanValid: false,
          pan: 'ABCDE9999F',
          message: 'No record found with income tax department',
          verificationId: 'NSDL-PAN-ERR-001',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE9999F',
      fullName: 'Unknown Citizen',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.isPanValid).toBe(false);
    expect(res.providerMetadata.isSandbox).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 3: Real provider timeout/HTTP error -> provider error state
  // -------------------------------------------------------------------------
  it('03: Real provider timeout or 502/503 -> throws error and does NOT mark VERIFIED', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Upstream gateway timeout' }), {
        status: 504,
        statusText: 'Gateway Timeout',
      });
    });

    await expect(
      kycService.verifyPan({
        panNumber: 'ABCDE1234F',
        fullName: 'Arjun Menon',
      })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Contract 4: Real provider failure -> NEVER falls back to sandbox
  // -------------------------------------------------------------------------
  it('04: Real provider failure strictly throws and NEVER falls back to Sandbox verification', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network ECONNREFUSED');
    });

    let caughtError: any = null;
    try {
      await kycService.verifyPan({
        panNumber: 'ABCDE1234F',
        fullName: 'Arjun Menon',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // Contract 5: Missing credentials -> resolves to sandbox when allowed
  // -------------------------------------------------------------------------
  it('05: Missing real credentials -> automatically routes to sandbox with explicit labeling', async () => {
    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Vikram Patel',
    });

    expect(res.success).toBe(true);
    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
  });

  // -------------------------------------------------------------------------
  // Contract 6: Sandbox success -> isSandbox=true and SBX reference
  // -------------------------------------------------------------------------
  it('06: Sandbox verification response explicitly flags isSandbox=true and returns SBX reference', async () => {
    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Vikram Patel',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerReference).toContain('SBX-PAN');
    expect(res.message).toContain('[Sandbox]');
  });

  // -------------------------------------------------------------------------
  // Contract 7: Sandbox result cannot be represented as real provider evidence
  // -------------------------------------------------------------------------
  it('07: Sandbox result cannot be represented as real provider evidence', async () => {
    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Vikram Patel',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).not.toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 8: Invalid PAN format -> provider is NOT called and error thrown immediately
  // -------------------------------------------------------------------------
  it('08: Invalid PAN format throws BadRequestError without calling outbound provider', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      kycService.verifyPan({
        panNumber: 'INVALID_PAN_123',
        fullName: 'Test User',
      })
    ).rejects.toThrow(/Invalid PAN format/);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Contract 9: Provider reference is persisted to database when customerId provided
  // -------------------------------------------------------------------------
  it('09: Successful PAN verification records provider reference and updates CustomerIdentifier', async () => {
    const findFirstSpy = vi.spyOn(prisma.customerIdentifier, 'findFirst').mockResolvedValue(null as any);
    const createSpy = vi.spyOn(prisma.customerIdentifier, 'create').mockResolvedValue({
      id: 'ident-001',
      customerId: 'cust-123',
      idType: 'PAN',
      maskedValue: 'AB******4F',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: 'SBX-PAN-TEST',
      createdAt: new Date(),
      updatedAt: new Date(),
      idHash: null,
      encryptedValue: null,
    });

    const res = await kycService.verifyPan(
      {
        panNumber: 'ABCDE1234F',
        fullName: 'Arjun Menon',
        customerId: 'cust-123',
      },
      { customerId: 'cust-123' }
    );

    expect(res.success).toBe(true);
    expect(findFirstSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-123',
          idType: 'PAN',
          verificationStatus: 'VERIFIED',
        }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Contract 10: Raw PAN is never written to logs/audit
  // -------------------------------------------------------------------------
  it('10: Raw PAN is masked in audit trail and never written in plaintext', async () => {
    await kycService.verifyPan(
      {
        panNumber: 'ABCDE1234F',
        fullName: 'Arjun Menon',
      },
      {
        userId: 'usr-analyst-1',
        tenantId: 'tenant-101',
      }
    );

    expect(logAuditSpy).toHaveBeenCalled();
    const loggedPayload = logAuditSpy.mock.calls[0][0];
    expect(loggedPayload.action).toBe('KYC_PAN_VERIFICATION');

    const jsonString = JSON.stringify(loggedPayload);
    expect(jsonString).not.toContain('ABCDE1234F');
    expect(jsonString).toContain('AB******4F');
  });

  // -------------------------------------------------------------------------
  // Contract 11: Valid PAN + matching name -> VERIFIED
  // -------------------------------------------------------------------------
  it('11: Valid PAN + matching name passes verification guard -> VERIFIED', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'VERIFIED',
          isPanValid: true,
          pan: 'ABCDE1234F',
          name: 'ARJUN MENON',
          isOperative: true,
          verificationId: 'NSDL-PAN-REAL-MATCH',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Arjun Menon',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.isPanValid).toBe(true);
    expect(res.nameMatchScore).toBeGreaterThanOrEqual(60);
  });

  // -------------------------------------------------------------------------
  // Contract 12: Valid PAN + mismatched name -> NOT VERIFIED (FAILED)
  // -------------------------------------------------------------------------
  it('12: Valid PAN + mismatched name fails verification guard -> NOT VERIFIED (status=FAILED)', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'VERIFIED',
          isPanValid: true,
          pan: 'ABCDE1234F',
          name: 'ROHIT SHARMA', // Different registered name
          isOperative: true,
          verificationId: 'NSDL-PAN-REAL-MISMATCH',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Vikram Patel', // Submitting unmatched applicant name
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.nameMatchScore).toBeLessThan(60);
    expect(res.message).toContain('does not match registered record');
  });
});
