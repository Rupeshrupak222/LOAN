import { describe, it, expect, beforeEach } from 'vitest';
import { integrationCertificationService } from './certification.service';

describe('Step 32: External Integration Certification Framework', () => {
  beforeEach(() => {
    integrationCertificationService.clearForTesting();
  });

  describe('1. Certification Matrix & Explicit Requirement Levels', () => {
    it('seeds and audits all 8 institutional connectors with requirement levels and fallback configs', () => {
      const overview = integrationCertificationService.getCertificationOverview('tenant-adyapan-default');
      expect(overview.totalConnectors).toBe(8);
      expect(overview.certifiedWithFallback).toBeGreaterThanOrEqual(6);
      expect(overview.certifiedProductionReady).toBeGreaterThanOrEqual(2);

      const cibil = overview.connectors.find((c) => c.connectorId === 'CONN-CIBIL-BUREAU');
      expect(cibil).toBeDefined();
      expect(cibil?.requirementLevel).toBe('PRODUCTION_REQUIRED');
      expect(cibil?.certificationStatus).toBe('CERTIFIED_WITH_FALLBACK');
      expect(cibil?.primaryProvider).toContain('CIBIL');
      expect(cibil?.fallbackProvider).toContain('CRIF High Mark');
      expect(cibil?.idempotencySupported).toBe(true);
      expect(cibil?.secretMaskingVerified).toBe(true);

      const aa = overview.connectors.find((c) => c.connectorId === 'CONN-SETU-AA');
      expect(aa?.requirementLevel).toBe('PRODUCTION_RECOMMENDED');
      expect(aa?.fallbackProvider).toContain('Uploaded Bank Statement');
    });
  });

  describe('2. Real-Time Health & Latency Audits', () => {
    it('executes live health check audit and updates timestamp across connectors', async () => {
      const audited = await integrationCertificationService.runHealthAudit('tenant-adyapan-default', {
        id: 'admin-1',
        email: 'admin@adyapan.dev',
        roles: ['ADMIN'],
      });

      expect(audited.length).toBe(8);
      audited.forEach((c) => {
        expect(c.healthStatus).toBe('HEALTHY');
        expect(c.circuitBreakerState).toBe('CLOSED');
        expect(c.lastHealthCheckAt).toBeDefined();
      });
    });
  });

  describe('3. Failover & Idempotency Safety Simulator', () => {
    it('simulates primary outage, executes seamless fallback, and guarantees zero transaction duplication', async () => {
      const result = await integrationCertificationService.testConnectorFailover(
        'tenant-adyapan-default',
        'CONN-RAZORPAY-PAY',
        { id: 'admin-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
      );

      expect(result.status).toBe('FAILOVER_SUCCESS');
      expect(result.primarySimulatedFailure).toBe(true);
      expect(result.fallbackExecuted).toBe(true);
      expect(result.fallbackProvider).toContain('Cashfree');
      expect(result.idempotencyKeyPreserved).toBe(true);
      expect(result.zeroTransactionDuplication).toBe(true);
      expect(result.auditEvidenceRef).toBeDefined();
    });

    it('rejects failover test if connector has no secondary fallback configured', async () => {
      // Connectors with no fallback
      const conn = (integrationCertificationService as any).connectors.get('CONN-SENDGRID-COMM');
      conn.fallbackProvider = undefined;

      await expect(
        integrationCertificationService.testConnectorFailover(
          'tenant-adyapan-default',
          'CONN-SENDGRID-COMM',
          { id: 'admin-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
        )
      ).rejects.toThrow('does not have a configured secondary fallback provider');
    });
  });

  describe('4. RBAC & Borrower Isolation', () => {
    it('rejects borrower attempts to audit health or simulate failover', async () => {
      await expect(
        integrationCertificationService.runHealthAudit('tenant-adyapan-default', {
          id: 'borrower-1',
          email: 'borrower@adyapan.dev',
          roles: ['CUSTOMER'],
        })
      ).rejects.toThrow('Borrowers cannot execute integration audits.');

      await expect(
        integrationCertificationService.testConnectorFailover(
          'tenant-adyapan-default',
          'CONN-CIBIL-BUREAU',
          { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow('Borrowers cannot execute failover tests.');
    });
  });
});
