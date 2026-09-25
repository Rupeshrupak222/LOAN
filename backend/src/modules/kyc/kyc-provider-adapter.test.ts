import { describe, it, expect } from 'vitest';
import {
  KycService,
  SandboxKycAdapter,
  ManualReviewKycAdapter,
  computeNameMatchScore,
} from './kyc.service';

describe('Provider-Neutral KYC Architecture & Adapters', () => {
  describe('Name Similarity Scoring', () => {
    it('computes 100 for exact match', () => {
      const score = computeNameMatchScore('Rajesh Kumar', 'Rajesh Kumar');
      expect(score).toBe(100);
    });

    it('computes partial score for partial match', () => {
      const score = computeNameMatchScore('Rajesh Kumar Sharma', 'Rajesh Sharma');
      expect(score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('SandboxKycAdapter', () => {
    const adapter = new SandboxKycAdapter();

    it('has isSandbox = true and SANDBOX_SIMULATION verificationMode', () => {
      expect(adapter.isSandbox).toBe(true);
      expect(adapter.verificationMode).toBe('SANDBOX_SIMULATION');
      expect(adapter.disclaimer).toContain('Sandbox simulated verification');
    });

    it('validates a valid 10-char PAN with sandbox metadata', async () => {
      const res = await adapter.verifyPan({ panNumber: 'ABCDE1234F', fullName: 'Rajesh Sharma' });
      expect(res.success).toBe(true);
      expect(res.isPanValid).toBe(true);
      expect(res.panNumber).toBe('ABCDE1234F');
      expect(res.status).toBe('VERIFIED');
      expect(res.providerMetadata.isSandbox).toBe(true);
      expect(res.providerMetadata.verificationMode).toBe('SANDBOX_SIMULATION');
    });

    it('throws error for invalid PAN format', async () => {
      await expect(adapter.verifyPan({ panNumber: 'INVALID_PAN' })).rejects.toThrow();
    });

    it('validates a valid 12-digit Aadhaar number with masked display and last4', async () => {
      const res = await adapter.verifyAadhaar({ aadhaarNumber: '543210987654', fullName: 'Rajesh Sharma' });
      expect(res.success).toBe(true);
      expect(res.verified).toBe(true);
      expect(res.aadhaarLast4).toBe('7654');
      expect(res.maskedAadhaar).toBe('XXXX-XXXX-7654');
      expect(res.providerMetadata.isSandbox).toBe(true);
    });

    it('throws error for non-12-digit Aadhaar number', async () => {
      await expect(adapter.verifyAadhaar({ aadhaarNumber: '12345' })).rejects.toThrow();
    });

    it('validates bank account penny-drop with sandbox response', async () => {
      const res = await adapter.verifyBankAccount({
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Rajesh Sharma',
      });
      expect(res.success).toBe(true);
      expect(res.isAccountValid).toBe(true);
      expect(res.bankName).toBe('HDFC Bank');
      expect(res.providerMetadata.isSandbox).toBe(true);
    });
  });

  describe('ManualReviewKycAdapter', () => {
    const adapter = new ManualReviewKycAdapter();

    it('queues PAN for manual inspection instead of auto-verifying', async () => {
      const res = await adapter.verifyPan({ panNumber: 'ABCDE1234F', fullName: 'Rajesh Sharma' });
      expect(res.success).toBe(true);
      expect(res.status).toBe('MANUAL_REVIEW');
      expect(res.providerMetadata.verificationMode).toBe('MANUAL_REVIEW');
    });

    it('queues Aadhaar for manual inspection', async () => {
      const res = await adapter.verifyAadhaar({ aadhaarNumber: '543210987654', fullName: 'Rajesh Sharma' });
      expect(res.success).toBe(true);
      expect(res.status).toBe('MANUAL_REVIEW');
      expect(res.verified).toBe(false);
    });
  });

  describe('KycService Adapter Switcher', () => {
    it('dispatches to active adapter and allows switching', async () => {
      const service = new KycService();
      expect(service.getActiveAdapter().isSandbox).toBe(true);

      service.setAdapter('MANUAL_REVIEW');
      expect(service.getActiveAdapter().verificationMode).toBe('MANUAL_REVIEW');

      const res = await service.verifyPan({ panNumber: 'ABCDE1234F' });
      expect(res.status).toBe('MANUAL_REVIEW');
    });
  });
});
