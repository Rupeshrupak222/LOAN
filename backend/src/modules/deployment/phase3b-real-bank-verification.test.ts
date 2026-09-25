import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { kycService } from '../kyc/kyc.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { prisma } from '../../config/prisma';
import * as auditService from '../audit/audit.service';
import { IntegrationHubError } from '../integrations/integration.errors';
import { ForbiddenError, BadRequestError } from '../../common/errors';

describe('PHASE 3B — Real Bank Account Verification / Penny Drop Contract & Security', () => {
  const originalEnv = { ...process.env };
  let logAuditSpy: any;

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.BANKING_GATEWAY_API_KEY;
    delete process.env.BANKING_GATEWAY_BASE_URL;

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
  // Contract 1: Real provider successful penny-drop -> VERIFIED
  // -------------------------------------------------------------------------
  it('01: Real provider successful penny-drop -> VERIFIED with isSandbox=false and REAL_PROVIDER mode', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/v1/bank/verify-account')) {
        return new Response(
          JSON.stringify({
            status: 'VERIFIED',
            isValid: true,
            accountNumber: '123456789012',
            ifsc: 'HDFC0001234',
            bankName: 'HDFC Bank',
            branch: 'Koramangala Branch',
            city: 'Bangalore',
            registeredName: 'PRIYA SHARMA',
            nameMatchPercentage: 95,
            utr: 'HDFC-PENNY-UTR-882200',
            verifiedAt: '2026-09-20T10:30:00.000Z',
          }),
          { status: 200, statusText: 'OK' }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const res = await kycService.verifyBankAccount({
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.isAccountValid).toBe(true);
    expect(res.nameAtBank).toBe('PRIYA SHARMA');
    expect(res.referenceId).toBe('HDFC-PENNY-UTR-882200');
    expect(res.providerMetadata.isSandbox).toBe(false);
    expect(res.providerMetadata.verificationMode).toBe('REAL_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 2: Real provider account rejection -> NOT VERIFIED
  // -------------------------------------------------------------------------
  it('02: Real provider account rejection (invalid account) -> NOT VERIFIED (status=FAILED)', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'INVALID_ACCOUNT',
          isValid: false,
          accountNumber: '999999999999',
          ifsc: 'HDFC0001234',
          message: 'Account does not exist at beneficiary bank',
          utr: 'HDFC-ERR-001',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyBankAccount({
      accountNumber: '999999999999',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Unknown Beneficiary',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.isAccountValid).toBe(false);
    expect(res.providerMetadata.isSandbox).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 3: Real provider name mismatch -> NOT VERIFIED
  // -------------------------------------------------------------------------
  it('03: Real provider valid account + name mismatch -> NOT VERIFIED (status=FAILED)', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'NAME_MISMATCH',
          isValid: true,
          accountNumber: '123456789012',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
          registeredName: 'RAMESH KUMAR', // Mismatched registered account holder
          nameMatchPercentage: 20,
          utr: 'HDFC-PENNY-MISMATCH-123',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    const res = await kycService.verifyBankAccount({
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma', // Expected holder name
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.nameMatchScore).toBeLessThan(60);
    expect(res.message).toContain('does not match bank record');
  });

  // -------------------------------------------------------------------------
  // Contract 4: Real provider timeout/error -> provider error
  // -------------------------------------------------------------------------
  it('04: Real provider timeout or 502/504 -> throws error and does not produce verified result', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Gateway timeout' }), {
        status: 504,
        statusText: 'Gateway Timeout',
      });
    });

    await expect(
      kycService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Priya Sharma',
      })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Contract 5: Real provider failure -> NEVER sandbox fallback
  // -------------------------------------------------------------------------
  it('05: Real provider failure strictly throws IntegrationHubError and NEVER falls back to Sandbox', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network ECONNREFUSED');
    });

    let caughtError: any = null;
    try {
      await kycService.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Priya Sharma',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(IntegrationHubError);
  });

  // -------------------------------------------------------------------------
  // Contract 6: Missing credentials -> explicit sandbox mode
  // -------------------------------------------------------------------------
  it('06: Missing credentials routes to explicit sandbox mode when allowed', async () => {
    const res = await kycService.verifyBankAccount({
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma',
    });

    expect(res.success).toBe(true);
    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
  });

  // -------------------------------------------------------------------------
  // Contract 7: Sandbox result -> isSandbox=true & SBX reference
  // -------------------------------------------------------------------------
  it('07: Sandbox result returns isSandbox=true and SBX reference format', async () => {
    const res = await kycService.verifyBankAccount({
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.referenceId).toContain('SBX-PENNY');
    expect(res.message).toContain('[Sandbox]');
  });

  // -------------------------------------------------------------------------
  // Contract 8: Frontend cannot force isVerified=true
  // -------------------------------------------------------------------------
  it('08: Frontend cannot force isVerified=true; verification strictly depends on provider output', async () => {
    process.env.BANKING_GATEWAY_API_KEY = 'live_banking_key_secret_123';
    process.env.BANKING_GATEWAY_BASE_URL = 'https://api.banking-provider.in';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          status: 'INVALID_ACCOUNT',
          isValid: false,
          accountNumber: '123456789012',
          ifsc: 'HDFC0001234',
        }),
        { status: 200, statusText: 'OK' }
      );
    });

    // Frontend attempting to send forged payload with isVerified
    const res = await kycService.verifyBankAccount({
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma',
      ...( { isVerified: true } as any ),
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.isAccountValid).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Contract 9: Provider reference is persisted to database
  // -------------------------------------------------------------------------
  it('09: Successful bank account verification persists isVerified update in database', async () => {
    const updateSpy = vi.spyOn(prisma.customerBankAccount, 'update').mockResolvedValue({
      id: 'bank-acc-001',
      customerId: 'cust-100',
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Priya Sharma',
      bankName: 'HDFC Bank',
      accountType: 'SAVINGS',
      isPrimary: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await kycService.verifyBankAccount(
      {
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Priya Sharma',
        bankAccountId: 'bank-acc-001',
      },
      { customerId: 'cust-100' }
    );

    expect(res.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bank-acc-001' },
        data: { isVerified: true },
      })
    );
  });

  // -------------------------------------------------------------------------
  // Contract 10: Full account number is masked in logs/audit/API response
  // -------------------------------------------------------------------------
  it('10: Full account number is masked in API response and audit logs', async () => {
    const rawAccount = '123456789012';

    const res = await kycService.verifyBankAccount(
      {
        accountNumber: rawAccount,
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Priya Sharma',
      },
      {
        userId: 'usr-analyst-1',
        tenantId: 'tenant-101',
      }
    );

    // API response check
    expect(res.accountNumber).not.toBe(rawAccount);
    expect(res.accountNumber).toBe('XXXXXXXX9012');

    // Audit log check
    expect(logAuditSpy).toHaveBeenCalled();
    const loggedPayload = logAuditSpy.mock.calls[0][0];
    expect(loggedPayload.action).toBe('KYC_BANK_VERIFICATION');

    const jsonString = JSON.stringify(loggedPayload);
    expect(jsonString).not.toContain(rawAccount);
    expect(jsonString).toContain('XXXXXXXX9012');
  });

  // -------------------------------------------------------------------------
  // Contract 11: IDOR attempt is rejected
  // -------------------------------------------------------------------------
  it('11: Cross-tenant IDOR access attempt is rejected with ForbiddenError', async () => {
    vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
      id: 'cust-victim-999',
      tenantId: 'tenant-victim-org',
    } as any);

    await expect(
      kycService.verifyBankAccount(
        {
          accountNumber: '123456789012',
          ifscCode: 'HDFC0001234',
          customerId: 'cust-victim-999',
        },
        {
          userId: 'attacker-1',
          tenantId: 'tenant-attacker-org', // Mismatched tenant
          role: 'LOAN_OFFICER',
        }
      )
    ).rejects.toThrow(ForbiddenError);
  });
});
