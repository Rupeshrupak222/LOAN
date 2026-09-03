import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantIntegrationService } from './tenant-integrations.service';
import { encryptSecret, decryptSecret } from '../../common/crypto';
import { IntegrationHubError } from './integration.errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 24: Tenant-Specific Integration Configuration', () => {
  beforeEach(() => {
    tenantIntegrationService.clearForTesting();
  });

  describe('1. AES-256-GCM Authenticated Encryption', () => {
    it('encrypts and decrypts secret credentials cleanly', () => {
      const plainSecret = 'rzp_live_sec_super_secret_token_12345';
      const payload = encryptSecret(plainSecret);

      expect(payload.encrypted).not.toBe(plainSecret);
      expect(payload.iv).toBeDefined();
      expect(payload.tag).toBeDefined();

      const decrypted = decryptSecret(payload);
      expect(decrypted).toBe(plainSecret);
    });

    it('generates unique IVs and ciphertexts for identical plaintexts', () => {
      const secret = 'same_api_key_value';
      const payload1 = encryptSecret(secret);
      const payload2 = encryptSecret(secret);

      expect(payload1.iv).not.toBe(payload2.iv);
      expect(payload1.encrypted).not.toBe(payload2.encrypted);
      expect(decryptSecret(payload1)).toBe(secret);
      expect(decryptSecret(payload2)).toBe(secret);
    });
  });

  describe('2. Multi-Tenant Distinct Provider Routing', () => {
    it('routes Tenant A and Tenant B to distinct credit bureau providers', () => {
      const tenantA = tenantIntegrationService.getTenantRoutingForCategory('tenant-adyapan-default', 'CREDIT');
      const tenantB = tenantIntegrationService.getTenantRoutingForCategory('tenant-apex-nbfc', 'CREDIT');

      expect(tenantA?.primaryProvider).toBe('EXPERIAN');
      expect(tenantB?.primaryProvider).toBe('CRIF');
    });

    it('routes Tenant A and Tenant B to distinct payment gateways', () => {
      const tenantA = tenantIntegrationService.getTenantRoutingForCategory('tenant-adyapan-default', 'PAYMENT');
      const tenantB = tenantIntegrationService.getTenantRoutingForCategory('tenant-apex-nbfc', 'PAYMENT');

      expect(tenantA?.primaryProvider).toBe('RAZORPAY');
      expect(tenantB?.primaryProvider).toBe('CASHFREE');
    });

    it('routes Tenant A and Tenant B to distinct communication providers', () => {
      const tenantA = tenantIntegrationService.getTenantRoutingForCategory('tenant-adyapan-default', 'COMMUNICATION');
      const tenantB = tenantIntegrationService.getTenantRoutingForCategory('tenant-apex-nbfc', 'COMMUNICATION');

      expect(tenantA?.primaryProvider).toBe('SENDGRID');
      expect(tenantB?.primaryProvider).toBe('AWS_SES');
    });
  });

  describe('3. Masked Credentials & Redaction Safety', () => {
    it('masks secrets in public routing views without leaking plaintext or raw ciphertexts', () => {
      const routings = tenantIntegrationService.getTenantRoutings('tenant-adyapan-default');
      expect(routings.length).toBeGreaterThanOrEqual(5);

      for (const routing of routings) {
        expect((routing as any).credentialsEncrypted).toBeUndefined();
        if (routing.maskedCredentials.apiKey) {
          expect(routing.maskedCredentials.apiKey).toContain('****');
          expect(routing.maskedCredentials.apiKey).not.toContain('exp_live_adyapan_secret_key_8891');
        }
      }
    });
  });

  describe('4. Tenant Operation Dispatch & Decryption', () => {
    it('dispatches operation with decrypted tenant credentials strictly in-memory', async () => {
      const resultA = await tenantIntegrationService.dispatchTenantOperation(
        'tenant-adyapan-default',
        'CREDIT',
        'FETCH_SCORE',
        { pan: 'ABCDE1234F' }
      );

      expect(resultA.providerUsed).toBe('EXPERIAN');
      expect(resultA.isFallback).toBe(false);
      expect(resultA.result.status).toBe('SUCCESS');
      expect(resultA.result.authenticated).toBe(true);

      const resultB = await tenantIntegrationService.dispatchTenantOperation(
        'tenant-apex-nbfc',
        'CREDIT',
        'FETCH_SCORE',
        { pan: 'ABCDE1234F' }
      );

      expect(resultB.providerUsed).toBe('CRIF');
      expect(resultB.isFallback).toBe(false);
      expect(resultB.result.status).toBe('SUCCESS');
    });
  });

  describe('5. SSRF Outbound URL Validation', () => {
    it('blocks SSRF attempts on private IP ranges for custom provider base URLs', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      await expect(
        tenantIntegrationService.upsertTenantRouting(
          'tenant-apex-nbfc',
          'CREDIT',
          {
            primaryProvider: 'CRIF',
            customBaseUrl: 'http://169.254.169.254/latest/meta-data', // AWS metadata IP
          },
          actor
        )
      ).rejects.toThrow(IntegrationHubError);

      await expect(
        tenantIntegrationService.upsertTenantRouting(
          'tenant-apex-nbfc',
          'CREDIT',
          {
            primaryProvider: 'CRIF',
            customBaseUrl: 'http://10.0.0.1/internal-api', // RFC 1918 Class A
          },
          actor
        )
      ).rejects.toThrow(IntegrationHubError);
    });
  });
});
