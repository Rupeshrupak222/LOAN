import { describe, it, expect } from 'vitest';
import { deploymentService } from './deployment.service';

describe('Step 41: Enterprise Deployment Models & Preflight Validation', () => {
  // =========================================================================
  // 1. DEPLOYMENT MODELS RESOLUTION
  // =========================================================================
  describe('1. Deployment Models & Topology Resolution', () => {
    it('correctly resolves Shared Multi-Tenant SaaS deployment model', () => {
      const profile = deploymentService.getDeploymentProfile({
        DEPLOYMENT_MODEL: 'SHARED_MULTI_TENANT_SAAS',
        NODE_ENV: 'production',
        STORAGE_DRIVER: 'CLOUDINARY',
        AI_INFERENCE_MODE: 'CLOUD_GEMINI',
      });

      expect(profile.deploymentModel).toBe('SHARED_MULTI_TENANT_SAAS');
      expect(profile.environmentTier).toBe('PRODUCTION');
      expect(profile.features.multiTenantOnboarding).toBe(true);
      expect(profile.strictTenantIsolationEnforced).toBe(true);
    });

    it('correctly resolves Dedicated Tenant deployment model with tenant override', () => {
      const profile = deploymentService.getDeploymentProfile({
        DEPLOYMENT_MODEL: 'DEDICATED_TENANT',
        TENANT_OVERRIDE_ID: 'tenant-icici-direct',
        NODE_ENV: 'production',
      });

      expect(profile.deploymentModel).toBe('DEDICATED_TENANT');
      expect(profile.dedicatedTenantId).toBe('tenant-icici-direct');
      expect(profile.features.multiTenantOnboarding).toBe(false);
    });

    it('correctly resolves Enterprise Private Cloud deployment model', () => {
      const profile = deploymentService.getDeploymentProfile({
        DEPLOYMENT_MODEL: 'ENTERPRISE_PRIVATE_CLOUD',
        SECRET_PROVIDER: 'AWS_SECRETS_MANAGER',
        STORAGE_DRIVER: 'AWS_S3',
        NODE_ENV: 'production',
      });

      expect(profile.deploymentModel).toBe('ENTERPRISE_PRIVATE_CLOUD');
      expect(profile.secretProvider).toBe('AWS_SECRETS_MANAGER');
      expect(profile.storageDriver).toBe('AWS_S3');
    });

    it('correctly resolves Air-Gapped Self-Hosted deployment model with offline AI rule fallback', () => {
      const profile = deploymentService.getDeploymentProfile({
        DEPLOYMENT_MODEL: 'AIRGAPPED_SELF_HOSTED',
        STORAGE_DRIVER: 'MINIO_LOCAL',
        NODE_ENV: 'production',
      });

      expect(profile.deploymentModel).toBe('AIRGAPPED_SELF_HOSTED');
      expect(profile.aiInferenceMode).toBe('LOCAL_RULE_ONLY');
      expect(profile.features.aiUnderwritingCopilot).toBe(false);
      expect(profile.features.accountAggregatorHub).toBe(false);
    });
  });

  // =========================================================================
  // 2. PREFLIGHT ENVIRONMENT & SECRET VALIDATION
  // =========================================================================
  describe('2. Preflight Safety & Environment Isolation Guards', () => {
    it('blocks deployment if production payment gateway keys are leaked into non-production tiers', () => {
      const report = deploymentService.runPreflightValidation({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/adyapan_dev',
        JWT_ACCESS_SECRET: 'dev_access_secret_super_long_32chars_ok',
        JWT_REFRESH_SECRET: 'dev_refresh_secret_super_long_32chars_ok',
        RAZORPAY_KEY_SECRET: 'rzp_live_secret_key_leaked_in_dev', // Critical leak
      });

      expect(report.passed).toBe(false);
      const leakCheck = report.checks.find((c) => c.name === 'Environment Isolation Guard');
      expect(leakCheck?.status).toBe('FAILED');
      expect(leakCheck?.message).toContain('Production payment gateway credentials detected');
    });

    it('fails preflight validation in production tier if JWT secrets are weak or placeholders', () => {
      const report = deploymentService.runPreflightValidation({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@prod-db.adyapan.internal:5432/adyapan_prod',
        JWT_ACCESS_SECRET: 'change_me_short',
        JWT_REFRESH_SECRET: 'change_me_short',
      });

      expect(report.passed).toBe(false);
      const secretCheck = report.checks.find((c) => c.name === 'Secret Entropy & Safety');
      expect(secretCheck?.status).toBe('FAILED');
    });

    it('passes all preflight checks cleanly with compliant production configuration', () => {
      const report = deploymentService.runPreflightValidation({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@prod-db.adyapan.internal:5432/adyapan_prod',
        JWT_ACCESS_SECRET: 'prod_jwt_access_secure_entropy_key_64_bytes_ok_super_secure',
        JWT_REFRESH_SECRET: 'prod_jwt_refresh_secure_entropy_key_64_bytes_ok_super_secure',
        RAZORPAY_KEY_SECRET: 'rzp_live_sec_prod_valid_token_123',
        CLOUDINARY_API_KEY: '571474773638931',
      });

      expect(report.passed).toBe(true);
      expect(report.failedCount).toBe(0);
    });
  });

  // =========================================================================
  // 3. DETAILED HEALTH CHECKS & READINESS PROBES
  // =========================================================================
  describe('3. Component Health Diagnostics & Probes', () => {
    it('returns deep diagnostic health checks with components and latency metrics', async () => {
      const health = await deploymentService.getDetailedHealthStatus();

      expect(health.status).toBe('HEALTHY');
      expect(health.components.applicationServer.status).toBe('UP');
      expect(health.components.database.status).toBe('UP');
      expect(health.components.auditChain.status).toBe('UP');
    });
  });

  // =========================================================================
  // 4. NON-DESTRUCTIVE ROLLBACK PLAN GENERATOR
  // =========================================================================
  describe('4. Financial Ledger Safe Rollback Planning', () => {
    it('generates a non-destructive forward-fix rollback plan preserving financial ledgers', () => {
      const plan = deploymentService.generateRollbackPlan('2.4.0', '2.3.9');

      expect(plan.targetVersion).toBe('2.3.9');
      expect(plan.databaseStrategy).toBe('FORWARD_FIX_ONLY');
      expect(plan.financialLedgerProtection.preserveRepayments).toBe(true);
      expect(plan.financialLedgerProtection.preserveAuditTrail).toBe(true);
      expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    });
  });
});
