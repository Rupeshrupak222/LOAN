import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { kycService } from '../kyc/kyc.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { prisma } from '../../config/prisma';
import * as auditService from '../audit/audit.service';
import { IntegrationHubError } from '../integrations/integration.errors';
import { ForbiddenError, BadRequestError } from '../../common/errors';

describe('PHASE 3C — Real Aadhaar / DigiLocker Verification Contract & Security', () => {
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
  // Contract 1: Valid real provider response -> VERIFIED
  // -------------------------------------------------------------------------
  it('01: Valid real provider response -> VERIFIED with isSandbox=false and REAL_PROVIDER mode', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/v1/verify/aadhaar')) {
        return new Response(
          JSON.stringify({
            status: 'VERIFIED',
            verified: true,
            aadhaarLast4: '7654',
            name: 'RAJESH SHARMA',
            gender: 'MALE',
            dateOfBirth: '1988-11-20',
            address: {
              line1: 'House 123, Sector 4',
              city: 'Gurugram',
              district: 'Gurugram',
              state: 'Haryana',
              pincode: '122001',
              country: 'India',
            },
            verificationId: 'UIDAI-DL-REAL-998844',
            verifiedAt: '2026-09-20T10:45:00.000Z',
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma',
    });

    expect(res.success).toBe(true);
    expect(res.verified).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.aadhaarLast4).toBe('7654');
    expect(res.name).toBe('RAJESH SHARMA');
    expect(res.providerReference).toBe('UIDAI-DL-REAL-998844');
    expect(res.providerMetadata.isSandbox).toBe(false);
    expect(res.providerMetadata.verificationMode).toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 2: Real provider rejection -> NOT VERIFIED
  // -------------------------------------------------------------------------
  it('02: Real provider rejection (record not found/failed) -> NOT VERIFIED (status=FAILED)', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'FAILED',
          verified: false,
          aadhaarLast4: '0000',
          message: 'Aadhaar demographic authentication failed at UIDAI',
          verificationId: 'UIDAI-ERR-002',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210980000',
      fullName: 'Unknown Resident',
    });

    expect(res.success).toBe(false);
    expect(res.verified).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.providerMetadata.isSandbox).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 3: Real provider timeout/error -> provider error
  // -------------------------------------------------------------------------
  it('03: Real provider timeout or 504 -> throws error and does not produce verified result', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Gateway timeout' }), {
        status: 504,
        statusText: 'Gateway Timeout',
      });
    });

    await expect(
      kycService.verifyAadhaar({
        aadhaarNumber: '543210987654',
        fullName: 'Rajesh Sharma',
      })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Contract 4: Real provider failure -> NEVER sandbox fallback
  // -------------------------------------------------------------------------
  it('04: Real provider failure strictly throws IntegrationHubError and NEVER falls back to Sandbox', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network ECONNREFUSED');
    });

    let caughtError: any = null;
    try {
      await kycService.verifyAadhaar({
        aadhaarNumber: '543210987654',
        fullName: 'Rajesh Sharma',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // Contract 5: Missing credentials -> explicit sandbox mode
  // -------------------------------------------------------------------------
  it('05: Missing credentials routes to explicit sandbox mode when allowed', async () => {
    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma',
    });

    expect(res.success).toBe(true);
    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
  });

  // -------------------------------------------------------------------------
  // Contract 6: Sandbox result -> isSandbox=true & synthetic reference
  // -------------------------------------------------------------------------
  it('06: Sandbox result returns isSandbox=true and SBX reference format', async () => {
    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerReference).toContain('SBX-');
    expect(res.message).toContain('[Sandbox]');
  });

  // -------------------------------------------------------------------------
  // Contract 7: Sandbox cannot become real provider evidence
  // -------------------------------------------------------------------------
  it('07: Sandbox result cannot be represented as REAL_PROVIDER evidence', async () => {
    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).not.toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 8: 12-digit Aadhaar format alone does NOT produce VERIFIED
  // -------------------------------------------------------------------------
  it('08: 12-digit Aadhaar format alone does not produce verified when provider rejects', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'FAILED',
          verified: false,
          aadhaarLast4: '7654',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654', // Perfectly valid 12-digit format
      fullName: 'Rajesh Sharma',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
  });

  // -------------------------------------------------------------------------
  // Contract 9: Provider identity/name mismatch -> NOT VERIFIED
  // -------------------------------------------------------------------------
  it('09: Provider identity name mismatch fails verification guard -> NOT VERIFIED (status=FAILED)', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'VERIFIED',
          verified: true,
          aadhaarLast4: '7654',
          name: 'MANISH TIWARI', // Registered citizen name is completely different
          verificationId: 'UIDAI-DL-MISMATCH-1',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma', // Submitting unmatched applicant name
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.nameMatchScore).toBeLessThan(60);
    expect(res.message).toContain('does not match registered record');
  });

  // -------------------------------------------------------------------------
  // Contract 10: Provider reference is persisted
  // -------------------------------------------------------------------------
  it('10: Successful Aadhaar verification records provider reference and updates CustomerIdentifier', async () => {
    const findFirstSpy = vi.spyOn(prisma.customerIdentifier, 'findFirst').mockResolvedValue(null as any);
    const createSpy = vi.spyOn(prisma.customerIdentifier, 'create').mockResolvedValue({
      id: 'ident-002',
      customerId: 'cust-200',
      idType: 'AADHAAR',
      maskedValue: 'XXXX-XXXX-7654',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: 'SBX-UIDAI-OK',
      createdAt: new Date(),
      updatedAt: new Date(),
      idHash: null,
      encryptedValue: null,
    });

    const res = await kycService.verifyAadhaar(
      {
        aadhaarNumber: '543210987654',
        fullName: 'Rajesh Sharma',
        customerId: 'cust-200',
      },
      { customerId: 'cust-200' }
    );

    expect(res.success).toBe(true);
    expect(findFirstSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-200',
          idType: 'AADHAAR',
          verificationStatus: 'VERIFIED',
        }),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Contract 11: Plaintext Aadhaar is not logged/audited
  // -------------------------------------------------------------------------
  it('11: Plaintext Aadhaar is masked in audit trail and API response', async () => {
    const rawAadhaar = '543210987654';

    const res = await kycService.verifyAadhaar(
      {
        aadhaarNumber: rawAadhaar,
        fullName: 'Rajesh Sharma',
      },
      {
        userId: 'usr-analyst-1',
        tenantId: 'tenant-101',
      }
    );

    // API response check
    expect(res.maskedAadhaar).toBe('XXXX-XXXX-7654');

    // Audit log check
    expect(logAuditSpy).toHaveBeenCalled();
    const loggedPayload = logAuditSpy.mock.calls[0][0];
    expect(loggedPayload.action).toBe('KYC_AADHAAR_VERIFICATION');

    const jsonString = JSON.stringify(loggedPayload);
    expect(jsonString).not.toContain(rawAadhaar);
    expect(jsonString).toContain('XXXX-XXXX-7654');
  });

  // -------------------------------------------------------------------------
  // Contract 12: Frontend cannot force VERIFIED
  // -------------------------------------------------------------------------
  it('12: Frontend cannot force VERIFIED; verification strictly depends on provider output', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'FAILED',
          verified: false,
          aadhaarLast4: '7654',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '543210987654',
      fullName: 'Rajesh Sharma',
      ...( { status: 'VERIFIED', isVerified: true, verified: true } as any ),
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.verified).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 13: IDOR attempt is rejected
  // -------------------------------------------------------------------------
  it('13: Cross-tenant IDOR access attempt is rejected with ForbiddenError', async () => {
    vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
      id: 'cust-victim-999',
      tenantId: 'tenant-victim-org',
    } as any);

    await expect(
      kycService.verifyAadhaar(
        {
          aadhaarNumber: '543210987654',
          customerId: 'cust-victim-999',
        },
        {
          userId: 'attacker-1',
          tenantId: 'tenant-attacker-org',
          role: 'LOAN_OFFICER',
        }
      )
    ).rejects.toThrow(ForbiddenError);
  });
});
