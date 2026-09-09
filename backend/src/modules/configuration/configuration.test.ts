import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configurationService } from './configuration.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 22: Lender Configuration Engine', () => {
  beforeEach(() => {
    configurationService.clearForTesting();
  });

  describe('1. Configuration Precedence Resolution', () => {
    it('resolves system defaults when no custom tenant override exists', () => {
      // Risk area has no override for tenant-adyapan-default except baseline
      const config = configurationService.getTenantConfig('tenant-unknown-nbfc', 'FOIR_DTI');
      expect(config.maxDtiRatio).toBe(0.55); // 55% system default
      expect(config.warningDtiRatio).toBe(0.45);
    });

    it('resolves tenant-specific policy parameters over system defaults', () => {
      // Tenant A: Adyapan Prime (55% FOIR limit)
      const tenantAConfig = configurationService.getTenantConfig('tenant-adyapan-default', 'FOIR_DTI');
      expect(tenantAConfig.maxDtiRatio).toBe(0.55);

      // Tenant B: Apex NBFC (Conservative 45% FOIR limit)
      const tenantBConfig = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI');
      expect(tenantBConfig.maxDtiRatio).toBe(0.45);
    });

    it('allows product-specific parameters to override tenant configuration when supplied', () => {
      const productOverride = { maxDtiRatio: 0.40 };
      const resolved = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI', productOverride);
      expect(resolved.maxDtiRatio).toBe(0.40);
    });
  });

  describe('2. Multi-Lender Policy Divergence (FOIR & Underwriting)', () => {
    it('proves two tenants enforce different approval hierarchies on the same platform', () => {
      const tenantAUnderwriting = configurationService.getTenantConfig('tenant-adyapan-default', 'UNDERWRITING');
      expect(tenantAUnderwriting.singleSignoffLimit).toBe(50000); // ₹50,000 limit

      const tenantBUnderwriting = configurationService.getTenantConfig('tenant-apex-nbfc', 'UNDERWRITING');
      expect(tenantBUnderwriting.singleSignoffLimit).toBe(100000); // ₹100,000 limit
    });

    it('evaluates borrower against tenant-specific FOIR limits deterministically', () => {
      const borrowerDti = 0.48; // 48% DTI

      const tenantAConfig = configurationService.getTenantConfig('tenant-adyapan-default', 'FOIR_DTI');
      const tenantBConfig = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI');

      // Tenant A max limit is 55% -> 48% PASSES
      const passesTenantA = borrowerDti <= tenantAConfig.maxDtiRatio;
      expect(passesTenantA).toBe(true);

      // Tenant B max limit is 45% -> 48% FAILS
      const passesTenantB = borrowerDti <= tenantBConfig.maxDtiRatio;
      expect(passesTenantB).toBe(false);
    });
  });

  describe('3. Parameter Validation & Safety', () => {
    it('rejects invalid FOIR ratio exceeding 100% or <= 0', () => {
      expect(() => {
        configurationService.validateParameters('FOIR_DTI', { maxDtiRatio: 1.2 });
      }).toThrow(BadRequestError);

      expect(() => {
        configurationService.validateParameters('FOIR_DTI', { maxDtiRatio: -0.1 });
      }).toThrow(BadRequestError);
    });

    it('rejects warningDtiRatio greater than maxDtiRatio', () => {
      expect(() => {
        configurationService.validateParameters('FOIR_DTI', { maxDtiRatio: 0.45, warningDtiRatio: 0.50 });
      }).toThrow(BadRequestError);
    });

    it('rejects invalid age criteria where minAge >= maxAge', () => {
      expect(() => {
        configurationService.validateParameters('ELIGIBILITY', { minAge: 65, maxAge: 60 });
      }).toThrow(BadRequestError);
    });

    it('rejects singleSignoffLimit greater than committeeSignoffLimit', () => {
      expect(() => {
        configurationService.validateParameters('UNDERWRITING', {
          singleSignoffLimit: 1000000,
          committeeSignoffLimit: 500000,
        });
      }).toThrow(BadRequestError);
    });
  });

  describe('4. Drafts, Versioning & Rollback Safety', () => {
    it('does not alter active published configuration when a draft is saved', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      const draft = await configurationService.saveDraftConfig(
        'tenant-apex-nbfc',
        {
          area: 'FOIR_DTI',
          parameters: { maxDtiRatio: 0.50, warningDtiRatio: 0.40 },
          changelog: 'Proposed FOIR increase to 50%',
        },
        actor
      );

      expect(draft.state).toBe('DRAFT');
      expect(draft.version).toBe(2);

      // Active configuration must remain 0.45 (v1) until explicitly published
      const active = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI');
      expect(active.maxDtiRatio).toBe(0.45);
    });

    it('activates new policy version upon publication and archives previous active', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      const draft = await configurationService.saveDraftConfig(
        'tenant-apex-nbfc',
        {
          area: 'FOIR_DTI',
          parameters: { maxDtiRatio: 0.50, warningDtiRatio: 0.40 },
          changelog: 'Proposed FOIR increase to 50%',
        },
        actor
      );

      const published = await configurationService.publishConfig('tenant-apex-nbfc', draft.id, actor);
      expect(published.state).toBe('PUBLISHED');

      // Now active configuration returns 0.50
      const active = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI');
      expect(active.maxDtiRatio).toBe(0.50);
    });

    it('rolls back to an earlier approved version and creates a linear audit trail', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      // 1. Create and publish v2 (50%)
      const draft = await configurationService.saveDraftConfig(
        'tenant-apex-nbfc',
        {
          area: 'FOIR_DTI',
          parameters: { maxDtiRatio: 0.50, warningDtiRatio: 0.40 },
          changelog: 'v2 release',
        },
        actor
      );
      await configurationService.publishConfig('tenant-apex-nbfc', draft.id, actor);

      // 2. Rollback to v1 (45%)
      const rolledBack = await configurationService.rollbackConfig(
        'tenant-apex-nbfc',
        'FOIR_DTI',
        1,
        actor,
        'Reverting unapproved limit change'
      );

      expect(rolledBack.state).toBe('PUBLISHED');
      expect(rolledBack.version).toBe(3); // New linear audit version
      expect(rolledBack.parameters.maxDtiRatio).toBe(0.45);

      const active = configurationService.getTenantConfig('tenant-apex-nbfc', 'FOIR_DTI');
      expect(active.maxDtiRatio).toBe(0.45);
    });
  });

  describe('5. RBAC & Borrower Isolation', () => {
    it('blocks borrowers from drafting, publishing, or rolling back configurations', async () => {
      const borrower = { id: 'usr-cust-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

      await expect(
        configurationService.saveDraftConfig(
          'tenant-adyapan-default',
          { area: 'FOIR_DTI', parameters: { maxDtiRatio: 0.99 }, changelog: 'Malicious change' },
          borrower
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        configurationService.publishConfig('tenant-adyapan-default', 'cfg-1', borrower)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        configurationService.rollbackConfig('tenant-adyapan-default', 'FOIR_DTI', 1, borrower, 'reason')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
