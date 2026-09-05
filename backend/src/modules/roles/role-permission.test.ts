import { describe, it, expect, beforeEach } from 'vitest';
import { rolePermissionService } from './role-permission.service';

describe('Step 34: Dynamic Role & Permission Builder with SoD Detection', () => {
  const tenantId = 'tenant-adyapan-default';
  const superAdmin = { id: 'usr-sa-001', email: 'superadmin@adyapan.dev', roles: ['SUPER_ADMIN'] };
  const admin = { id: 'usr-adm-001', email: 'admin@adyapan.dev', roles: ['ADMIN'] };
  const underwriter = { id: 'usr-uw-001', email: 'underwriter@adyapan.dev', roles: ['UNDERWRITER'] };

  beforeEach(() => {
    rolePermissionService.clearForTesting();
  });

  describe('1. Permission Catalog & SoD Rules Matrix', () => {
    it('provides granular permissions catalog across all 7 lending modules', () => {
      const perms = rolePermissionService.getPermissionCatalog();
      expect(perms.length).toBeGreaterThanOrEqual(25);

      const categories = new Set(perms.map((p) => p.category));
      expect(categories).toContain('APPLICATIONS');
      expect(categories).toContain('UNDERWRITING');
      expect(categories).toContain('DISBURSEMENTS');
      expect(categories).toContain('COLLECTIONS');
      expect(categories).toContain('CONFIGURATION');
      expect(categories).toContain('PRIVACY_AUDIT');
      expect(categories).toContain('TENANT_ADMIN');
    });

    it('defines critical banking Segregation of Duties (SoD) rules', () => {
      const sodRules = rolePermissionService.getSodRules();
      expect(sodRules.length).toBeGreaterThanOrEqual(5);

      const codes = sodRules.map((r) => r.code);
      expect(codes).toContain('SOD_MAKER_CHECKER_PAYOUT');
      expect(codes).toContain('SOD_SANCTION_DISBURSER');
      expect(codes).toContain('SOD_AUDITOR_POLICY_MAKER');
    });
  });

  describe('2. Segregation of Duties (SoD) Conflict Detection', () => {
    it('detects critical SoD conflict when combining payout Maker and Checker privileges', () => {
      const result = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
        'APPLICATIONS_VIEW',
      ]);

      expect(result.hasConflict).toBe(true);
      expect(result.hasCriticalBlock).toBe(true);
      expect(result.conflicts[0].ruleCode).toBe('SOD_MAKER_CHECKER_PAYOUT');
    });

    it('detects critical SoD conflict when combining Underwriter sanction with gateway fund execution', () => {
      const result = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].ruleCode).toBe('SOD_SANCTION_DISBURSER');
    });

    it('passes cleanly for non-conflicting operational permissions', () => {
      const result = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_VIEW',
        'APPLICATIONS_REVIEW',
        'UNDERWRITING_VIEW_BUREAU',
        'UNDERWRITING_RUN_AI_ASSIST',
      ]);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('3. Custom Role Creation with Inheritance & SoD Guard', () => {
    it('blocks creating custom role with conflicting SoD permissions without override', async () => {
      await expect(
        rolePermissionService.createCustomRole(
          tenantId,
          {
            code: 'CONFLICT_OFFICER',
            name: 'Conflicting Operator',
            description: 'Illegal combination of maker and checker',
            permissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
          },
          admin
        )
      ).rejects.toThrow(/Segregation of Duties \(SoD\) Conflict Detected/);
    });

    it('creates custom role inheriting from parent role template with enhanced sanction limit', async () => {
      const customRole = await rolePermissionService.createCustomRole(
        tenantId,
        {
          code: 'CHIEF_CREDIT_OFFICER',
          name: 'Chief Credit Officer',
          description: 'High-authority credit sanctioner inheriting underwriter rights',
          parentRoleCode: 'UNDERWRITER',
          permissions: ['UNDERWRITING_COMMITTEE_VOTE', 'CONFIGURATION_VIEW_POLICIES'],
          scope: 'TENANT',
          sanctionLimitAmount: 15000000, // ₹1.5 Crore sanction limit
        },
        admin
      );

      expect(customRole.code).toBe('CHIEF_CREDIT_OFFICER');
      expect(customRole.isSystemRole).toBe(false);
      expect(customRole.permissions).toContain('APPLICATIONS_APPROVE'); // Inherited from UNDERWRITER
      expect(customRole.permissions).toContain('UNDERWRITING_VIEW_BUREAU'); // Inherited from UNDERWRITER
      expect(customRole.permissions).toContain('UNDERWRITING_COMMITTEE_VOTE'); // Direct addition
      expect(customRole.sanctionLimitAmount).toBe(15000000);
    });
  });

  describe('4. Dynamic RBAC Evaluation & Financial Sign-off Limits', () => {
    it('evaluates effective permissions across multiple assigned roles', () => {
      const perms = rolePermissionService.getEffectivePermissions(['UNDERWRITER', 'LOAN_OFFICER'], tenantId);
      expect(perms).toContain('APPLICATIONS_APPROVE');
      expect(perms).toContain('APPLICATIONS_CREATE');
      expect(perms).toContain('UNDERWRITING_VIEW_BUREAU');
    });

    it('verifies granular permission and validates financial sanction limit', () => {
      const underwriterUser = {
        id: 'usr-uw-101',
        email: 'uw@adyapan.dev',
        roles: ['UNDERWRITER'],
        tenantId,
      };

      // 1. Has APPLICATIONS_APPROVE within ₹50 Lakh limit
      expect(
        rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 2500000, // ₹25 Lakh
        })
      ).toBe(true);

      // 2. Fails when required sanction amount exceeds ₹50 Lakh single officer limit
      expect(
        rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 7500000, // ₹75 Lakh exceeds ₹50L
        })
      ).toBe(false);

      // 3. Super Admin has universal bypass
      expect(
        rolePermissionService.hasPermission(superAdmin, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 500000000,
        })
      ).toBe(true);
    });
  });

  describe('5. RBAC Authorization Safety', () => {
    it('rejects loan officers and borrowers attempting to create custom roles', async () => {
      const loanOfficer = { id: 'usr-lo-1', email: 'lo@adyapan.dev', roles: ['LOAN_OFFICER'] };

      await expect(
        rolePermissionService.createCustomRole(
          tenantId,
          {
            code: 'HACK_ROLE',
            name: 'Hacked Role',
            description: 'Unauthorized',
            permissions: ['APPLICATIONS_APPROVE'],
          },
          loanOfficer
        )
      ).rejects.toThrow('Access forbidden: Only Administrators can create custom roles.');
    });
  });
});
