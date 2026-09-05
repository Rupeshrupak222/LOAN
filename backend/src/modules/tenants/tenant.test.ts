import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantService, TenantService } from './tenant.service';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';
import { signAccessToken, verifyAccessToken } from '../auth/tokens';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 21: Multi-Tenant Architecture & Data Isolation', () => {
  beforeEach(() => {
    tenantService.clearForTesting();
  });

  describe('1. Canonical Tenant Model & Registry', () => {
    it('seeds primary platform tenant and secondary verification tenant by default', () => {
      const primary = tenantService.getTenantById(TenantService.DEFAULT_PRIMARY_TENANT_ID);
      expect(primary).toBeDefined();
      expect(primary.code).toBe('ADYAPAN_PRIME');
      expect(primary.status).toBe('ACTIVE');
      expect(primary.tier).toBe('ENTERPRISE');

      const secondary = tenantService.getTenantById('tenant-apex-nbfc');
      expect(secondary).toBeDefined();
      expect(secondary.code).toBe('APEX_NBFC');
      expect(secondary.status).toBe('ACTIVE');
      expect(secondary.tier).toBe('GROWTH');
    });

    it('allows Super Admin to onboard a new lender tenant', async () => {
      const newTenant = await tenantService.createTenant(
        {
          code: 'HORIZON_FIN',
          name: 'Horizon Microfinance Ltd',
          contactEmail: 'risk@horizonfin.dev',
          tier: 'STANDARD',
        },
        { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] }
      );

      expect(newTenant.id).toContain('tenant-horizon-fin');
      expect(newTenant.code).toBe('HORIZON_FIN');
      expect(newTenant.status).toBe('ACTIVE');

      const retrieved = tenantService.getTenantById(newTenant.id);
      expect(retrieved.name).toBe('Horizon Microfinance Ltd');
    });

    it('rejects duplicate tenant codes with BadRequestError', async () => {
      await expect(
        tenantService.createTenant(
          {
            code: 'ADYAPAN_PRIME',
            name: 'Duplicate Tenant',
            contactEmail: 'dup@adyapan.dev',
          },
          { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] }
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('prevents non-superadmin from creating tenants', async () => {
      await expect(
        tenantService.createTenant(
          {
            code: 'TEST_NBFC',
            name: 'Unauthorized NBFC',
            contactEmail: 'test@nbfc.dev',
          },
          { id: 'usr-lo-1', roles: ['LOAN_OFFICER'] }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents suspending the primary platform tenant', async () => {
      await expect(
        tenantService.updateTenantStatus(
          TenantService.DEFAULT_PRIMARY_TENANT_ID,
          'SUSPENDED',
          { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] }
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('2. Authoritative Server-Side Tenant Context & Tokens', () => {
    it('signs and verifies JWT access tokens with embedded tenantId', () => {
      const token = signAccessToken({
        sub: 'usr-staff-1',
        email: 'officer@apexcap.dev',
        roles: ['LOAN_OFFICER'],
        tenantId: 'tenant-apex-nbfc',
      });

      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe('usr-staff-1');
      expect(decoded.tenantId).toBe('tenant-apex-nbfc');
    });

    it('resolves primary tenant as default when legacy token has no tenantId', () => {
      const legacyToken = signAccessToken({
        sub: 'usr-legacy-1',
        email: 'legacy@adyapan.dev',
        roles: ['UNDERWRITER'],
      });

      const decoded = verifyAccessToken(legacyToken);
      const effectiveTenantId = decoded.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;
      expect(effectiveTenantId).toBe(TenantService.DEFAULT_PRIMARY_TENANT_ID);
    });
  });

  describe('3. Anti-Spoofing & Anti-IDOR Boundary Protection', () => {
    it('permits staff user to access their own tenant data', () => {
      const actor = { id: 'usr-apex-1', roles: ['LOAN_OFFICER'], tenantId: 'tenant-apex-nbfc' };
      const resolved = tenantService.resolveTenantScope(actor, 'tenant-apex-nbfc');
      expect(resolved).toBe('tenant-apex-nbfc');
    });

    it('blocks staff user from accessing another tenant with ForbiddenError (Anti-IDOR)', () => {
      const actor = { id: 'usr-apex-1', roles: ['LOAN_OFFICER'], tenantId: 'tenant-apex-nbfc' };
      expect(() => {
        tenantService.resolveTenantScope(actor, TenantService.DEFAULT_PRIMARY_TENANT_ID);
      }).toThrow(ForbiddenError);
    });

    it('allows Super Admin to switch tenant scope for supervision', () => {
      const superAdmin = { id: 'usr-sa-1', roles: ['SUPER_ADMIN'], tenantId: TenantService.DEFAULT_PRIMARY_TENANT_ID };
      const resolved = tenantService.resolveTenantScope(superAdmin, 'tenant-apex-nbfc');
      expect(resolved).toBe('tenant-apex-nbfc');
    });

    it('throws NotFoundError if Super Admin requests a non-existent tenant', () => {
      const superAdmin = { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] };
      expect(() => {
        tenantService.resolveTenantScope(superAdmin, 'tenant-non-existent');
      }).toThrow(NotFoundError);
    });
  });

  describe('4. Data & AI Context Isolation', () => {
    it('sanitizes AI prompt context so Tenant B records are strictly stripped for Tenant A', () => {
      const mixedRecords = [
        { id: 'rec-1', tenantId: 'tenant-adyapan-default', borrower: 'Borrower A1' },
        { id: 'rec-2', tenantId: 'tenant-apex-nbfc', borrower: 'Borrower B1' },
        { id: 'rec-3', tenantId: 'tenant-adyapan-default', borrower: 'Borrower A2' },
        { id: 'rec-4', tenantId: 'tenant-apex-nbfc', borrower: 'Borrower B2' },
      ];

      const tenantAContext = tenantService.sanitizeAiContext('tenant-adyapan-default', mixedRecords);
      expect(tenantAContext.length).toBe(2);
      expect(tenantAContext.every((r) => r.tenantId === 'tenant-adyapan-default')).toBe(true);

      const tenantBContext = tenantService.sanitizeAiContext('tenant-apex-nbfc', mixedRecords);
      expect(tenantBContext.length).toBe(2);
      expect(tenantBContext.every((r) => r.tenantId === 'tenant-apex-nbfc')).toBe(true);
    });

    it('generates partitioned cache keys with tenant namespace', () => {
      const key1 = tenantService.formatTenantCacheKey('tenant-adyapan-default', 'dashboard_kpis');
      const key2 = tenantService.formatTenantCacheKey('tenant-apex-nbfc', 'dashboard_kpis');

      expect(key1).toBe('tenant:tenant-adyapan-default:dashboard_kpis');
      expect(key2).toBe('tenant:tenant-apex-nbfc:dashboard_kpis');
      expect(key1).not.toBe(key2);
    });
  });

  describe('5. RBAC & Borrower Isolation', () => {
    it('blocks borrowers (CUSTOMER role) from listing enterprise tenants', () => {
      const borrower = { id: 'usr-cust-1', roles: ['CUSTOMER'], tenantId: 'tenant-adyapan-default' };
      expect(() => {
        tenantService.listTenants(borrower);
      }).toThrow(ForbiddenError);
    });

    it('returns only assigned tenant when standard staff lists tenants', () => {
      const apexOfficer = { id: 'usr-off-2', roles: ['LOAN_OFFICER'], tenantId: 'tenant-apex-nbfc' };
      const list = tenantService.listTenants(apexOfficer);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('tenant-apex-nbfc');
    });

    it('returns all platform tenants when Super Admin lists tenants', () => {
      const superAdmin = { id: 'usr-sa-1', roles: ['SUPER_ADMIN'] };
      const list = tenantService.listTenants(superAdmin);
      expect(list.length).toBeGreaterThanOrEqual(2);
    });
  });
});
