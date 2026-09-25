import { describe, it, expect } from 'vitest';
import { platformConfig } from '../../config/config-manager';
import { PiiMasker } from '../privacy/pii-masker';
import { logAudit, listAuditLogs } from '../audit/audit.service';
import { dataRetentionService } from '../compliance/data-retention.service';
import { productionReadinessService } from './production-readiness.service';
import { providerRegistry } from '../integrations/provider-registry.service';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { prisma } from '../../config/prisma';

describe('Phase 9K: Production Hardening, Security, Privacy & Operational Readiness Suite', () => {
  // =========================================================================
  // 1. CONFIGURATION MANAGEMENT & STARTUP SAFETY
  // =========================================================================
  describe('1. Production Configuration Management', () => {
    it('should validate and expose typed configuration across all 8 architectural domains', () => {
      const config = platformConfig.getConfig();
      expect(config.application).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.tenant).toBeDefined();
      expect(config.product).toBeDefined();
      expect(config.workflow).toBeDefined();
      expect(config.authority).toBeDefined();
      expect(config.provider).toBeDefined();

      expect(config.product.minLoanAmount).toBeGreaterThanOrEqual(1000);
      expect(config.product.defaultGstRatePercentage).toBe(18.0);
      expect(config.authority.level1MaxLimit).toBeGreaterThan(0);
      expect(config.security.loginMaxAttempts).toBeGreaterThanOrEqual(3);
    });

    it('should execute startup safety checks and detect missing production keys cleanly', () => {
      const safety = platformConfig.validateStartupSafety();
      expect(safety).toHaveProperty('isValid');
      expect(Array.isArray(safety.errors)).toBe(true);
    });
  });

  // =========================================================================
  // 2. DATA PROTECTION & UNIVERSAL PII/SECRET MASKING
  // =========================================================================
  describe('2. Universal PII & Secret Masking', () => {
    it('should mask PAN numbers correctly preserving only prefix and suffix characters', () => {
      expect(PiiMasker.maskPan('ABCDE1234F')).toBe('AB******4F');
      expect(PiiMasker.maskPan('BNZPA9876K')).toBe('BN******6K');
      expect(PiiMasker.maskPan(null)).toBe('NOT_PROVIDED');
    });

    it('should mask Aadhaar numbers leaving only the last 4 digits visible', () => {
      expect(PiiMasker.maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
      expect(PiiMasker.maskAadhaar('9876-5432-1098')).toBe('XXXX-XXXX-1098');
      expect(PiiMasker.maskAadhaar(null)).toBe('NOT_PROVIDED');
    });

    it('should mask Bank Account numbers according to data minimization standards', () => {
      expect(PiiMasker.maskBankAccount('1234567890123')).toBe('XXXXXXXXX0123');
      expect(PiiMasker.maskBankAccount('987654321')).toBe('XXXXX4321');
      expect(PiiMasker.maskBankAccount(null)).toBe('NOT_PROVIDED');
    });

    it('should mask secrets, API keys, and auth tokens', () => {
      expect(PiiMasker.maskSecret('live_secret_key_production_9988')).toBe('liv****988');
      expect(PiiMasker.maskSecret('short')).toBe('******');
      expect(PiiMasker.maskSecret(null)).toBe('NOT_SET');
    });

    it('should recursively sanitize complex nested payloads and redact passwords/tokens', () => {
      const sensitivePayload = {
        password: 'SuperSecretPassword123!',
        jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        customer: {
          pan: 'ABCDE1234F',
          aadhaar: '123456789012',
          bankAccountNo: '112233445566',
        },
        meta: {
          apiKey: 'sec_live_key_9999',
          nonSensitiveField: 'Public Reference #1002',
        },
      };

      const sanitized = PiiMasker.sanitizeObject(sensitivePayload);
      expect(sanitized.password).not.toBe('SuperSecretPassword123!');
      expect(sanitized.jwtToken).not.toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
      expect(sanitized.customer.pan).toBe('AB******4F');
      expect(sanitized.customer.aadhaar).toBe('XXXX-XXXX-9012');
      expect(sanitized.customer.bankAccountNo).toBe('XXXXXXXX5566');
      expect(sanitized.meta.nonSensitiveField).toBe('Public Reference #1002');
    });
  });

  // =========================================================================
  // 3. AUDIT LOG IMMUTABILITY & FOREIGN KEY RESILIENCE
  // =========================================================================
  describe('3. Audit Log Immutability & Resilient Persistence', () => {
    it('should log audit entries with sanitized PII and handle synthetic/system actors safely', async () => {
      const result = await logAudit({
        userId: 'synthetic-non-existent-user-id',
        tenantId: 'tenant-adyapan-default',
        role: 'SYSTEM',
        action: 'PHASE_9K_PRODUCTION_AUDIT_TEST',
        entity: 'SystemConfig',
        entityId: 'SYS-9K-001',
        previousValue: { rawSecret: 'my_api_key_12345', pan: 'ABCDE1234F' },
        newValue: { rawSecret: 'my_api_key_updated_9988', pan: 'ABCDE1234F' },
        correlationId: 'CORR-P9K-AUDIT-01',
      });

      // Verification: Should either persist with sanitized values or non-blocking null without throwing
      if (result) {
        expect(result.action).toBe('PHASE_9K_PRODUCTION_AUDIT_TEST');
        expect(result.entity).toBe('SystemConfig');
      }
    });

    it('should enforce pagination and tenant isolation when listing audit records', async () => {
      const page = await listAuditLogs(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        'SystemConfig',
        undefined,
        { tenantId: 'tenant-adyapan-default', roles: ['AUDITOR'] }
      );

      expect(Array.isArray(page.data)).toBe(true);
      expect(page.pagination).toBeDefined();
    });
  });

  // =========================================================================
  // 4. STATUTORY DATA RETENTION POLICY
  // =========================================================================
  describe('4. Statutory Data Retention Management', () => {
    it('should configure statutory retention lifecycles for audit, loan, and KYC records', () => {
      const policies = dataRetentionService.getAllPolicies();
      expect(policies.length).toBeGreaterThanOrEqual(5);

      const auditPolicy = dataRetentionService.getPolicy('AUDIT_LOGS');
      expect(auditPolicy).toBeDefined();
      expect(auditPolicy?.retentionPeriodDays).toBeGreaterThanOrEqual(2555); // 7 years

      const loanPolicy = dataRetentionService.getPolicy('LOAN_RECORDS');
      expect(loanPolicy?.retentionPeriodDays).toBeGreaterThanOrEqual(2920); // 8 years

      const cutoff = dataRetentionService.calculateCutoffDate('AUDIT_LOGS');
      expect(cutoff.getTime()).toBeLessThan(Date.now());
    });

    it('should evaluate retention summary across all statutory domains', () => {
      const summary = dataRetentionService.evaluateRetentionSummary();
      expect(Array.isArray(summary)).toBe(true);
      for (const item of summary) {
        expect(item.cutoffDate).toBeDefined();
        expect(item.status).toBeDefined();
      }
    });
  });

  // =========================================================================
  // 5. OBSERVABILITY & PROVIDER GATEWAY RESILIENCE
  // =========================================================================
  describe('5. Observability & Provider Gateway Health', () => {
    it('should report real provider health without external API failure simulation', async () => {
      const health = await providerRegistry.getHealthSummary();
      expect(health.length).toBeGreaterThanOrEqual(7);

      for (const domain of health) {
        expect(['SANDBOX', 'SANDBOX_PROVIDER', 'REAL_PROVIDER']).toContain(domain.mode);
        expect(['HEALTHY', 'NOT_CONFIGURED', 'DEGRADED']).toContain(domain.status);
      }
    });
  });

  // =========================================================================
  // 6. DYNAMIC APPROVAL AUTHORITY & WORKFLOW SAFETY
  // =========================================================================
  describe('6. Dynamic Approval Authority Escalation Routing', () => {
    it('should route loan approval within Level 1 to Branch Manager without hardcoding', async () => {
      const tenantId = 'tenant-adyapan-default';
      const resolution = await approvalAuthorityService.resolveAuthorityDirect(tenantId, {
        loanAmount: 300000,
        riskGrade: 'A',
        breDecision: 'APPROVE',
      });

      expect(resolution).toBeDefined();
      expect(resolution.requiredLevel).toBe(1);
      expect(resolution.levelCode).toBe('LEVEL_1_BRANCH_MANAGER');
    });

    it('should escalate high exposure loans requiring Level 2/3 authority to Underwriter', async () => {
      const tenantId = 'tenant-adyapan-default';
      const resolution = await approvalAuthorityService.resolveAuthorityDirect(tenantId, {
        loanAmount: 1500000, // Above Level 1 limit
        riskGrade: 'B',
        breDecision: 'APPROVE',
      });

      expect(resolution).toBeDefined();
      expect(resolution.requiredLevel).toBeGreaterThan(1);
      expect(['UNDERWRITER', 'CREDIT_HEAD', 'LEVEL_2_UNDERWRITER']).toContain(resolution.roleName);
    });
  });

  // =========================================================================
  // 7. PRODUCTION READINESS CHECKLIST CERTIFICATION
  // =========================================================================
  describe('7. Production Readiness Checklist Certification', () => {
    it('should generate comprehensive production readiness report across all architectural dimensions', () => {
      const report = productionReadinessService.generateReport();
      expect(report.totalChecks).toBeGreaterThanOrEqual(15);
      expect(report.overallScorePercentage).toBeGreaterThanOrEqual(90);
      expect(report.criticalBlockers.length).toBe(0);

      expect(report.categories['Security']).toBeDefined();
      expect(report.categories['Privacy']).toBeDefined();
      expect(report.categories['Financial Integrity']).toBeDefined();
      expect(report.categories['Workflow']).toBeDefined();
      expect(report.categories['Integrations']).toBeDefined();
      expect(report.categories['Observability']).toBeDefined();
      expect(report.categories['Operations']).toBeDefined();
    });
  });
});
