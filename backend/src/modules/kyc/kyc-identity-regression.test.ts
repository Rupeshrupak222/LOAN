import { describe, it, expect, beforeEach } from 'vitest';
import { kycService } from './kyc.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { SandboxKycProvider } from '../integrations/sandbox/sandbox-kyc.provider';

describe('Authoritative KYC Identity Verification Regression Tests', () => {
  let sandboxProvider: SandboxKycProvider;

  beforeEach(() => {
    sandboxProvider = new SandboxKycProvider();
    providerRegistry.registerCustomAdapter('KYC', sandboxProvider, 'DEFAULT');
  });

  it('1. Blank borrower name + PAN -> verification blocked with BadRequestError', async () => {
    await expect(
      kycService.verifyPan({
        panNumber: 'ABCDE1234F',
        fullName: '',
      })
    ).rejects.toThrow('Borrower legal full name is required');
  });

  it('2. Missing required identity context (spaces only) -> backend rejects verification', async () => {
    await expect(
      kycService.verifyPan({
        panNumber: 'ABCDE1234F',
        fullName: '   ',
      })
    ).rejects.toThrow('Borrower legal full name is required');
  });

  it('3. Borrower name present + PAN -> existing verification flow executes', async () => {
    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Rajesh Sharma',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.isPanValid).toBe(true);
    expect(res.nameMatchScore).toBeGreaterThanOrEqual(60);
    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
  });

  it('4. Provider name mismatch -> PAN verification fails', async () => {
    sandboxProvider.setForcedScenario('NAME_MISMATCH');

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Vikram Singh',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.message).toContain('does not match registered record');
  });

  it('5. Provider name match -> existing verification success behavior preserved', async () => {
    sandboxProvider.setForcedScenario('SUCCESS');

    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Ananya Verma',
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.isPanValid).toBe(true);
    expect(res.nameOnCard).toBe('ANANYA VERMA');
  });

  it('6. Sandbox response is explicitly marked SANDBOX', async () => {
    const res = await kycService.verifyPan({
      panNumber: 'ABCDE1234F',
      fullName: 'Deepak Chopra',
    });

    expect(res.providerMetadata.isSandbox).toBe(true);
    expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
    expect(res.providerMetadata.disclaimer).toContain('Sandbox simulated verification');
  });

  it('7. Sandbox does not generate successful identity match when comparison data is missing', async () => {
    const directProviderRes = await sandboxProvider.verifyPan(
      { panNumber: 'ABCDE1234F', fullName: '' },
      'CORR-123'
    );

    expect(directProviderRes.status).toBe('FAILED');
    expect(directProviderRes.nameMatchScore).toBe(0);
  });

  it('8. Aadhaar cannot be successfully verified without required identity context', async () => {
    await expect(
      kycService.verifyAadhaar({
        aadhaarNumber: '123456789012',
        fullName: '',
      })
    ).rejects.toThrow('Borrower legal full name is required');
  });

  it('9. Aadhaar with borrower name present -> successfully verified', async () => {
    const res = await kycService.verifyAadhaar({
      aadhaarNumber: '123456789012',
      fullName: 'Rupesh Kumar',
    });

    expect(res.success).toBe(true);
    expect(res.verified).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.maskedAadhaar).toBe('XXXX-XXXX-9012');
    expect(res.providerMetadata.isSandbox).toBe(true);
  });
});
