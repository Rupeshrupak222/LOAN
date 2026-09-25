import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { providerRegistry } from '../integrations/provider-registry.service';
import { KycIdentityAdapter } from '../integrations/adapters/kyc/kyc-identity.adapter';
import { SandboxKycProvider } from '../integrations/sandbox/sandbox-kyc.provider';
import { CreditBureauAdapter } from '../integrations/adapters/credit/credit-bureau.adapter';
import { SandboxBureauProvider } from '../integrations/sandbox/sandbox-bureau.provider';
import { BankingDataAdapter } from '../integrations/adapters/banking/banking-data.adapter';
import { SandboxBankVerificationProvider } from '../integrations/sandbox/sandbox-bank.provider';
import { IntegrationHubError } from '../integrations/integration.errors';

describe('PHASE 2 — Real Provider Gateway Foundation Contract', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.KYC_GATEWAY_API_KEY;
    delete process.env.KYC_GATEWAY_BASE_URL;
    delete process.env.CREDIT_BUREAU_API_KEY;
    delete process.env.CREDIT_BUREAU_BASE_URL;
    delete process.env.ACCOUNT_AGGREGATOR_API_KEY;
    delete process.env.ACCOUNT_AGGREGATOR_BASE_URL;
    delete process.env.PAYMENT_GATEWAY_KEY_ID;
    delete process.env.PAYMENT_GATEWAY_KEY_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Contract 1: Real credentials present -> resolves to real adapter
  // -------------------------------------------------------------------------
  it('01: Real credentials present -> returns real adapter with REAL_PROVIDER mode and isSandbox=false', () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    const resolution = providerRegistry.getKycProvider();
    expect(resolution.mode).toBe('REAL_PROVIDER');
    expect(resolution.isSandbox).toBe(false);
    expect(resolution.provider).toBeInstanceOf(KycIdentityAdapter);
    expect(resolution.provider.environment).toBe('PRODUCTION');
  });

  // -------------------------------------------------------------------------
  // Contract 2: No credentials + sandbox allowed -> resolves to sandbox adapter
  // -------------------------------------------------------------------------
  it('02: No credentials + sandbox allowed -> returns sandbox adapter with SANDBOX_PROVIDER mode and isSandbox=true', () => {
    const resolution = providerRegistry.getKycProvider();
    expect(resolution.mode).toBe('SANDBOX_PROVIDER');
    expect(resolution.isSandbox).toBe(true);
    expect(resolution.provider).toBeInstanceOf(SandboxKycProvider);
    expect(resolution.provider.environment).toBe('SANDBOX');
  });

  // -------------------------------------------------------------------------
  // Contract 3: Explicit REAL mode + missing credentials -> PROVIDER_CONFIGURATION_REQUIRED error
  // -------------------------------------------------------------------------
  it('03: Explicit REAL mode + missing credentials -> throws PROVIDER_CONFIGURATION_REQUIRED (no silent fallback)', () => {
    expect(() => {
      providerRegistry.getKycProvider({ forceMode: 'REAL_PROVIDER' });
    }).toThrowError(/PROVIDER_CONFIGURATION_REQUIRED/);

    expect(() => {
      providerRegistry.getBureauProvider({ forceMode: 'REAL_PROVIDER' });
    }).toThrowError(/PROVIDER_CONFIGURATION_REQUIRED/);

    expect(() => {
      providerRegistry.getBankVerificationProvider({ forceMode: 'REAL_PROVIDER' });
    }).toThrowError(/PROVIDER_CONFIGURATION_REQUIRED/);
  });

  // -------------------------------------------------------------------------
  // Contract 4: Real provider runtime failure -> error propagated, NOT sandbox fallback
  // -------------------------------------------------------------------------
  it('04: Real provider runtime failure -> propagates real error and NEVER falls back to Sandbox', async () => {
    process.env.KYC_GATEWAY_API_KEY = 'live_kyc_key_secret_123';
    process.env.KYC_GATEWAY_BASE_URL = 'https://api.kyc-provider.in';

    const resolution = providerRegistry.getKycProvider();
    expect(resolution.mode).toBe('REAL_PROVIDER');
    expect(resolution.isSandbox).toBe(false);

    // Mock network failure / HTTP 502 on real endpoint
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Gateway Timeout from UIDAI/NSDL' }), {
        status: 502,
        statusText: 'Bad Gateway',
      });
    });

    // Calling verifyPan on the real adapter MUST throw and NOT return a sandbox success
    await expect(
      resolution.provider.verifyPan(
        { panNumber: 'ABCDE1234F', fullName: 'Test Borrower' },
        'CORR-REAL-FAIL-001'
      )
    ).rejects.toThrow();

    // Verify it threw an IntegrationHubError with proper error code, not returning fake sandbox data
    try {
      await resolution.provider.verifyPan(
        { panNumber: 'ABCDE1234F', fullName: 'Test Borrower' },
        'CORR-REAL-FAIL-002'
      );
      expect.unreachable('Should have thrown real provider error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(IntegrationHubError);
      expect(err.code).toBeDefined();
    }
  });

  // -------------------------------------------------------------------------
  // Contract 5: Sandbox result contains isSandbox=true
  // -------------------------------------------------------------------------
  it('05: Sandbox resolution contains isSandbox=true across all domains', () => {
    const kyc = providerRegistry.getKycProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(kyc.isSandbox).toBe(true);
    expect(kyc.mode).toBe('SANDBOX_PROVIDER');

    const bureau = providerRegistry.getBureauProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(bureau.isSandbox).toBe(true);
    expect(bureau.mode).toBe('SANDBOX_PROVIDER');

    const bank = providerRegistry.getBankVerificationProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(bank.isSandbox).toBe(true);
    expect(bank.mode).toBe('SANDBOX_PROVIDER');

    const payment = providerRegistry.getPaymentProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(payment.isSandbox).toBe(true);
    expect(payment.mode).toBe('SANDBOX_PROVIDER');

    const payout = providerRegistry.getPayoutProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(payout.isSandbox).toBe(true);
    expect(payout.mode).toBe('SANDBOX_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 6: Real result contains isSandbox=false
  // -------------------------------------------------------------------------
  it('06: Real resolution contains isSandbox=false across all configured domains', () => {
    process.env.CREDIT_BUREAU_API_KEY = 'live_cibil_token_123';
    process.env.CREDIT_BUREAU_BASE_URL = 'https://api.cibil.com';
    process.env.ACCOUNT_AGGREGATOR_API_KEY = 'live_aa_token_123';
    process.env.ACCOUNT_AGGREGATOR_BASE_URL = 'https://api.setu.co';

    const bureau = providerRegistry.getBureauProvider();
    expect(bureau.isSandbox).toBe(false);
    expect(bureau.mode).toBe('REAL_PROVIDER');
    expect(bureau.provider).toBeInstanceOf(CreditBureauAdapter);

    const bank = providerRegistry.getBankVerificationProvider();
    expect(bank.isSandbox).toBe(false);
    expect(bank.mode).toBe('REAL_PROVIDER');
    expect(bank.provider).toBeInstanceOf(BankingDataAdapter);
  });

  // -------------------------------------------------------------------------
  // Contract 7: Sandbox result cannot be recorded as real provider evidence
  // -------------------------------------------------------------------------
  it('07: Sandbox result exposes explicit sandbox environment and cannot be masked as real evidence', async () => {
    const sandboxKyc = providerRegistry.getKycProvider({ forceMode: 'SANDBOX_PROVIDER' });
    expect(sandboxKyc.provider.environment).toBe('SANDBOX');
    expect(sandboxKyc.isSandbox).toBe(true);

    const panRes = await sandboxKyc.provider.verifyPan(
      { panNumber: 'ABCDE1234F', fullName: 'Sandbox User' },
      'CORR-SBX-001'
    );
    expect(panRes.providerReference).toContain('SBX-PAN');
    expect(sandboxKyc.mode).toBe('SANDBOX_PROVIDER');
  });

  // -------------------------------------------------------------------------
  // Contract 8: Custom tenant adapter registration works deterministically
  // -------------------------------------------------------------------------
  it('08: Custom registered tenant adapter is prioritized in real mode without fallback', () => {
    const customAdapter = {
      providerId: 'custom_tenant_kyc',
      name: 'Custom Enterprise KYC',
      environment: 'PRODUCTION' as const,
      verifyPan: vi.fn(),
      verifyAadhaarDigilocker: vi.fn(),
      verifyFace: vi.fn(),
      extractDocumentOcr: vi.fn(),
    };

    providerRegistry.registerCustomAdapter('KYC', customAdapter, 'TENANT_CORP_01');

    const resolved = providerRegistry.getKycProvider('TENANT_CORP_01');
    expect(resolved.mode).toBe('REAL_PROVIDER');
    expect(resolved.isSandbox).toBe(false);
    expect(resolved.provider.providerId).toBe('custom_tenant_kyc');
  });
});
