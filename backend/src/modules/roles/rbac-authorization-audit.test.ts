import { describe, it, expect, beforeEach } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { createUser } from '../users/user.service';
import { ForbiddenError } from '../../common/errors';

describe('RBAC Authorization & Role Audit Test Suite', () => {
  beforeEach(() => {
    rolePermissionService.clearForTesting();
  });

  describe('1. 10 System Role Templates & Permissions Coverage', () => {
    const expectedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'BRANCH_MANAGER',
      'CREDIT_ANALYST',
      'UNDERWRITER',
      'FINANCE_OFFICER',
      'DISBURSEMENT_OFFICER',
      'FINANCE_CONTROLLER',
      'COLLECTION_OFFICER',
      'COLLECTION_AGENT',
      'AUDITOR',
      'LOAN_OFFICER',
      'CUSTOMER',
    ];

    it.each(expectedRoles)('should have seeded system role template for %s', (roleCode) => {
      const role = rolePermissionService.getRole('tenant-adyapan-default', roleCode);
      expect(role).toBeDefined();
      expect(role.code).toBe(roleCode);
      expect(role.isSystemRole).toBe(true);
      expect(role.permissions.length).toBeGreaterThan(0);
    });

    it('SUPER_ADMIN should have bypass / universal permission evaluation', () => {
      const superAdminUser = {
        id: 'usr-superadmin-1',
        email: 'superadmin@adyapan.com',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(rolePermissionService.hasPermission(superAdminUser, 'APPLICATIONS_CREATE')).toBe(true);
      expect(rolePermissionService.hasPermission(superAdminUser, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(true);
      expect(rolePermissionService.hasPermission(superAdminUser, 'CONFIGURATION_PUBLISH_POLICY')).toBe(true);
      expect(rolePermissionService.hasPermission(superAdminUser, 'PRIVACY_PURGE_PII')).toBe(true);
    });

    it('LOAN_OFFICER should have sourcing permissions but NOT credit sanctioning or disbursement execution', () => {
      const loanOfficer = {
        id: 'usr-lo-1',
        email: 'lo@adyapan.com',
        roles: ['LOAN_OFFICER'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(rolePermissionService.hasPermission(loanOfficer, 'APPLICATIONS_CREATE')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficer, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficer, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
    });

    it('UNDERWRITER should have credit assessment and approval permissions within sanction limits', () => {
      const underwriter = {
        id: 'usr-uw-1',
        email: 'uw@adyapan.com',
        roles: ['UNDERWRITER'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(rolePermissionService.hasPermission(underwriter, 'APPLICATIONS_APPROVE')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriter, 'UNDERWRITING_VIEW_BUREAU')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriter, 'UNDERWRITING_RUN_AI_ASSIST')).toBe(true);
      // Underwriter cannot execute payout transfers
      expect(rolePermissionService.hasPermission(underwriter, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      // Sanction limit test
      expect(
        rolePermissionService.hasPermission(underwriter, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 3000000,
        })
      ).toBe(true);
      expect(
        rolePermissionService.hasPermission(underwriter, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 10000000, // ₹1 Crore exceeds ₹50 Lakh limit
        })
      ).toBe(false);
    });

    it('AUDITOR should be strictly read-only with evidence export rights but NO transactional mutation rights', () => {
      const auditor = {
        id: 'usr-aud-1',
        email: 'auditor@adyapan.com',
        roles: ['AUDITOR'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(rolePermissionService.hasPermission(auditor, 'AUDIT_EXPORT_EVIDENCE_PACKAGE')).toBe(true);
      expect(rolePermissionService.hasPermission(auditor, 'AUDIT_VERIFY_CHAIN')).toBe(true);
      expect(rolePermissionService.hasPermission(auditor, 'CONFIGURATION_VIEW_POLICIES')).toBe(true);
      expect(rolePermissionService.hasPermission(auditor, 'APPLICATIONS_CREATE')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
    });

    it('CUSTOMER (Borrower) should only have self-service application access', () => {
      const customer = {
        id: 'usr-cust-1',
        email: 'borrower@gmail.com',
        roles: ['CUSTOMER'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(rolePermissionService.hasPermission(customer, 'APPLICATIONS_CREATE')).toBe(true);
      expect(rolePermissionService.hasPermission(customer, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(customer, 'UNDERWRITING_VIEW_BUREAU')).toBe(false);
      expect(rolePermissionService.hasPermission(customer, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(customer, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(customer, 'AUDIT_EXPORT_EVIDENCE_PACKAGE')).toBe(false);
    });
  });

  describe('2. Segregation of Duties (SoD) Protection Engine', () => {
    it('should detect critical block when Maker and Checker payout permissions are combined', () => {
      const check = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);

      expect(check.hasConflict).toBe(true);
      expect(check.hasCriticalBlock).toBe(true);
      expect(check.conflicts[0].ruleCode).toBe('SOD_MAKER_CHECKER_PAYOUT');
    });

    it('should detect critical block when Sanction Approver and Fund Disburser permissions are combined', () => {
      const check = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);

      expect(check.hasConflict).toBe(true);
      expect(check.hasCriticalBlock).toBe(true);
      expect(check.conflicts[0].ruleCode).toBe('SOD_SANCTION_DISBURSER');
    });

    it('should detect critical block when Auditor and Policy Publisher permissions are combined', () => {
      const check = rolePermissionService.checkSodConflicts([
        'AUDIT_EXPORT_EVIDENCE_PACKAGE',
        'CONFIGURATION_PUBLISH_POLICY',
      ]);

      expect(check.hasConflict).toBe(true);
      expect(check.hasCriticalBlock).toBe(true);
      expect(check.conflicts[0].ruleCode).toBe('SOD_AUDITOR_POLICY_MAKER');
    });

    it('should block custom role creation if SoD conflict exists without dual override', async () => {
      await expect(
        rolePermissionService.createCustomRole(
          'tenant-adyapan-default',
          {
            code: 'ROGUE_MANAGER',
            name: 'Rogue Manager',
            description: 'Unsafe combined maker-checker',
            permissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
          },
          { id: 'usr-admin-1', email: 'admin@adyapan.com', roles: ['ADMIN'] }
        )
      ).rejects.toThrow(/Segregation of Duties \(SoD\) Conflict Detected/);
    });
  });

  describe('3. Privilege Escalation Prevention in User Provisioning', () => {
    it('should block BRANCH_MANAGER from provisioning SUPER_ADMIN or ADMIN accounts', async () => {
      const branchManagerActor = {
        id: 'usr-bm-1',
        roles: ['BRANCH_MANAGER'],
        branchId: '00000000-0000-0000-0000-000000000001',
      };

      await expect(
        createUser(
          {
            email: 'hacked_admin@adyapan.com',
            firstName: 'Evil',
            lastName: 'Hacker',
            roleName: 'SUPER_ADMIN',
          },
          branchManagerActor
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        createUser(
          {
            email: 'hacked_admin2@adyapan.com',
            firstName: 'Evil',
            lastName: 'Hacker',
            roleName: 'ADMIN',
          },
          branchManagerActor
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should block BRANCH_MANAGER from provisioning users to another branch', async () => {
      const branchManagerActor = {
        id: 'usr-bm-1',
        roles: ['BRANCH_MANAGER'],
        branchId: '00000000-0000-0000-0000-000000000001',
      };

      await expect(
        createUser(
          {
            email: 'other_branch_officer@adyapan.com',
            firstName: 'Other',
            lastName: 'Officer',
            roleName: 'LOAN_OFFICER',
            branchId: '00000000-0000-0000-0000-000000000002', // Different branch
          },
          branchManagerActor
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should block ADMIN from provisioning SUPER_ADMIN accounts', async () => {
      const adminActor = {
        id: 'usr-admin-1',
        roles: ['ADMIN'],
      };

      await expect(
        createUser(
          {
            email: 'escalated_superadmin@adyapan.com',
            firstName: 'Super',
            lastName: 'Admin',
            roleName: 'SUPER_ADMIN',
          },
          adminActor
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('4. Custom Role Builder & Dynamic Hierarchy', () => {
    it('should allow ADMIN to build compliant custom role with inheritance', async () => {
      const customRole = await rolePermissionService.createCustomRole(
        'tenant-adyapan-default',
        {
          code: 'SENIOR_CREDIT_OFFICER',
          name: 'Senior Credit Officer',
          description: 'Underwriter with elevated limits',
          parentRoleCode: 'UNDERWRITER',
          permissions: ['APPLICATIONS_APPROVE'],
          sanctionLimitAmount: 15000000, // ₹1.5 Crore
        },
        { id: 'usr-admin-1', email: 'admin@adyapan.com', roles: ['ADMIN'] }
      );

      expect(customRole).toBeDefined();
      expect(customRole.code).toBe('SENIOR_CREDIT_OFFICER');
      expect(customRole.permissions).toContain('UNDERWRITING_VIEW_BUREAU');
      expect(customRole.permissions).toContain('APPLICATIONS_APPROVE');
      expect(customRole.sanctionLimitAmount).toBe(15000000);
    });

    it('should prevent non-admin actors from creating custom roles', async () => {
      await expect(
        rolePermissionService.createCustomRole(
          'tenant-adyapan-default',
          {
            code: 'CUSTOM_LOAN_ROLE',
            name: 'Custom Loan Role',
            description: 'Created by unauthorized loan officer',
            permissions: ['APPLICATIONS_CREATE'],
          },
          { id: 'usr-lo-1', email: 'lo@adyapan.com', roles: ['LOAN_OFFICER'] }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('5. Multi-Tenant Role Isolation', () => {
    it('should isolate custom roles created in tenant A from tenant B', async () => {
      await rolePermissionService.createCustomRole(
        'tenant-apex-nbfc',
        {
          code: 'APEX_MICRO_ANALYST',
          name: 'Apex Micro Analyst',
          description: 'Custom role specific to Apex NBFC',
          permissions: ['APPLICATIONS_VIEW', 'APPLICATIONS_REVIEW'],
        },
        { id: 'usr-admin-apex', email: 'admin@apex.com', roles: ['ADMIN'] }
      );

      const apexRoles = rolePermissionService.listRoles('tenant-apex-nbfc');
      const adyapanRoles = rolePermissionService.listRoles('tenant-adyapan-default');

      expect(apexRoles.some((r) => r.code === 'APEX_MICRO_ANALYST')).toBe(true);
      expect(adyapanRoles.some((r) => r.code === 'APEX_MICRO_ANALYST')).toBe(false);
    });
  });
});
