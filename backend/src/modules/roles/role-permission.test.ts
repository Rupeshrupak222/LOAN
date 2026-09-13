import { describe, it, expect } from 'vitest';
import { rolePermissionService, PERMISSION_ALIAS_MAP } from './role-permission.service';
import { assertMakerCheckerSeparation, assertAuditorReadOnly, assertBorrowerInternalRestriction } from './sod-validator';
import { resolveAuthorizedScope } from './scope-resolver';
import { ForbiddenError, UnauthorizedError } from '../../common/errors';

describe('Phase P2: Role & Permission Normalization Suite', () => {
  const defaultTenant = 'tenant-adyapan-default';

  // =========================================================================
  // 1. CANONICAL PERMISSION TAXONOMY & ALIASING
  // =========================================================================
  describe('Suite 1: Canonical Permission Taxonomy & Alias Resolution', () => {
    it('should evaluate canonical domain.action permissions for LOAN_OFFICER', () => {
      const isAllowedCreate = rolePermissionService.hasPermission(['LOAN_OFFICER'], 'application.create');
      const isAllowedView = rolePermissionService.hasPermission(['LOAN_OFFICER'], 'application.view');
      const isDeniedApprove = rolePermissionService.hasPermission(['LOAN_OFFICER'], 'application.approve');

      expect(isAllowedCreate).toBe(true);
      expect(isAllowedView).toBe(true);
      expect(isDeniedApprove).toBe(false);
    });

    it('should resolve legacy uppercase permissions and canonical keys bidirectionally', () => {
      // LOAN_OFFICER has APPLICATIONS_CREATE in system roles
      expect(rolePermissionService.hasPermission(['LOAN_OFFICER'], 'APPLICATIONS_CREATE')).toBe(true);
      expect(rolePermissionService.hasPermission(['LOAN_OFFICER'], 'application.create')).toBe(true);

      // CREDIT_ANALYST has CREDIT_ASSESSMENT_EVALUATE
      expect(rolePermissionService.hasPermission(['CREDIT_ANALYST'], 'CREDIT_ASSESSMENT_EVALUATE')).toBe(true);
      expect(rolePermissionService.hasPermission(['CREDIT_ANALYST'], 'credit.assess')).toBe(true);
    });

    it('should grant SuperAdmin full authorization across all canonical keys', () => {
      expect(rolePermissionService.hasPermission(['SUPER_ADMIN'], 'application.create')).toBe(true);
      expect(rolePermissionService.hasPermission(['SUPER_ADMIN'], 'underwriting.decide')).toBe(true);
      expect(rolePermissionService.hasPermission(['SUPER_ADMIN'], 'payout.approve')).toBe(true);
      expect(rolePermissionService.hasPermission(['SUPER_ADMIN'], 'accounting.journal.post')).toBe(true);
    });
  });

  // =========================================================================
  // 2. 8 CANONICAL OPERATIONAL ROLES & LIMITS
  // =========================================================================
  describe('Suite 2: 8 Canonical Operational Role Models & Sign-Off Limits', () => {
    it('Branch Manager should approve within ₹5,00,000 limit and reject beyond limit', () => {
      // Under limit: ₹4,50,000
      const allowedWithinLimit = rolePermissionService.hasPermission(
        ['BRANCH_MANAGER'],
        'application.approve',
        { requiredSanctionAmount: 450000 }
      );
      expect(allowedWithinLimit).toBe(true);

      // Beyond limit: ₹8,00,000
      const blockedBeyondLimit = rolePermissionService.hasPermission(
        ['BRANCH_MANAGER'],
        'application.approve',
        { requiredSanctionAmount: 800000 }
      );
      expect(blockedBeyondLimit).toBe(false);
    });

    it('Underwriter should approve within ₹10,00,000 limit', () => {
      const allowedWithinLimit = rolePermissionService.hasPermission(
        ['UNDERWRITER'],
        'application.approve',
        { requiredSanctionAmount: 900000 }
      );
      expect(allowedWithinLimit).toBe(true);

      const blockedBeyondLimit = rolePermissionService.hasPermission(
        ['UNDERWRITER'],
        'application.approve',
        { requiredSanctionAmount: 1500000 }
      );
      expect(blockedBeyondLimit).toBe(false);
    });
  });

  // =========================================================================
  // 3. SEGREGATION OF DUTIES (SOD) & MAKER-CHECKER
  // =========================================================================
  describe('Suite 3: Banking Segregation of Duties (SoD) & Maker-Checker Invariants', () => {
    it('should block maker-checker self-approval when makerUserId === checkerUserId', () => {
      const userId = 'usr_maker_123';
      expect(() => {
        assertMakerCheckerSeparation(userId, userId, 'DISBURSEMENT_PAYOUT_APPROVAL');
      }).toThrowError(/SOD_VIOLATION/);
    });

    it('should permit approval when maker and checker are distinct users', () => {
      expect(() => {
        assertMakerCheckerSeparation('usr_maker_101', 'usr_checker_202', 'LOAN_SANCTION_APPROVAL');
      }).not.toThrow();
    });

    it('should detect SoD critical conflicts in custom role builder', () => {
      // Proposing and approving payouts in same role
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.hasCriticalBlock).toBe(true);
    });
  });

  // =========================================================================
  // 4. AUDITOR READ-ONLY INVARIANT
  // =========================================================================
  describe('Suite 4: Auditor Read-Only Governance Invariant', () => {
    it('should block auditor role from executing state-changing mutations', () => {
      expect(() => {
        assertAuditorReadOnly(['AUDITOR'], 'EXECUTE_PAYOUT');
      }).toThrowError(/Auditor role is strictly read-only/);
    });

    it('should allow operational roles to execute permitted operational mutations', () => {
      expect(() => {
        assertAuditorReadOnly(['FINANCE_OFFICER'], 'EXECUTE_PAYOUT');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 5. BORROWER INTERNAL RESTRICTION
  // =========================================================================
  describe('Suite 5: Borrower External Identity & Internal Scope Protection', () => {
    it('should block borrower from accessing internal credit, underwriting, payout or admin domains', () => {
      expect(() => {
        assertBorrowerInternalRestriction(['CUSTOMER'], 'underwriting.decide');
      }).toThrowError(/Borrower identities are strictly restricted/);

      expect(() => {
        assertBorrowerInternalRestriction(['CUSTOMER'], 'payout.create');
      }).toThrowError(/Borrower identities are strictly restricted/);

      expect(() => {
        assertBorrowerInternalRestriction(['CUSTOMER'], 'accounting.journal.create');
      }).toThrowError(/Borrower identities are strictly restricted/);
    });

    it('should allow borrower to access customer self-service permissions', () => {
      expect(() => {
        assertBorrowerInternalRestriction(['CUSTOMER'], 'application.view');
      }).not.toThrow();

      expect(() => {
        assertBorrowerInternalRestriction(['CUSTOMER'], 'payment.create');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 6. SERVER-DERIVED RESOURCE SCOPING & ZERO-TRUST IDOR
  // =========================================================================
  describe('Suite 6: Server-Derived Resource Scoping & Zero-Trust IDOR Defense', () => {
    it('should reject cross-tenant access attempts for non-SuperAdmins', () => {
      const user = {
        id: 'usr_officer_1',
        email: 'officer@tenant-a.com',
        roles: ['LOAN_OFFICER'],
        tenantId: 'tenant-a',
      };

      expect(() => {
        resolveAuthorizedScope(user, { requestedTenantId: 'tenant-b' });
      }).toThrowError(/Cross-tenant access denied/);
    });

    it('should permit SuperAdmin to target requested tenant explicitly', () => {
      const superUser = {
        id: 'usr_super_1',
        email: 'superadmin@adyapan.io',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant-primary',
      };

      const scope = resolveAuthorizedScope(superUser, { requestedTenantId: 'tenant-secondary' });
      expect(scope.tenantId).toBe('tenant-secondary');
      expect(scope.isSuperAdmin).toBe(true);
    });

    it('should enforce branch isolation for branch-scoped officers', () => {
      const branchUser = {
        id: 'usr_branch_mgr_1',
        email: 'bm@mumbai-branch.com',
        roles: ['BRANCH_MANAGER'],
        tenantId: 'tenant-adyapan-default',
        branchId: 'branch-mumbai-01',
      };

      // Cross-branch attempt to Delhi branch
      expect(() => {
        resolveAuthorizedScope(branchUser, { requestedBranchId: 'branch-delhi-02' });
      }).toThrowError(/Cross-branch access denied/);

      // Own branch
      const ownScope = resolveAuthorizedScope(branchUser, { requestedBranchId: 'branch-mumbai-01' });
      expect(ownScope.branchId).toBe('branch-mumbai-01');
    });

    it('should enforce customer ownership on borrower requests', () => {
      const borrowerUser = {
        id: 'cust-user-101',
        email: 'borrower@adyapan.io',
        roles: ['CUSTOMER'],
        tenantId: 'tenant-adyapan-default',
      };

      // Borrower requesting another customer's ID
      expect(() => {
        resolveAuthorizedScope(borrowerUser, { requestedCustomerId: 'cust-user-999' });
      }).toThrowError(/Customer access violation/);

      // Borrower requesting own records
      const ownScope = resolveAuthorizedScope(borrowerUser, { requestedCustomerId: 'cust-user-101' });
      expect(ownScope.customerId).toBe('cust-user-101');
    });
  });

  // =========================================================================
  // 7. PRIVILEGE ESCALATION DEFENSE
  // =========================================================================
  describe('Suite 7: Privilege Escalation & Role Assignment Defense', () => {
    it('should block non-SuperAdmin from assigning the SUPER_ADMIN role', () => {
      const adminActor = {
        id: 'usr_admin_1',
        roles: ['ADMIN'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(() => {
        rolePermissionService.validateRoleAssignment(adminActor, 'SUPER_ADMIN');
      }).toThrowError(/Privilege escalation denied/);
    });

    it('should allow SuperAdmin to assign SUPER_ADMIN role', () => {
      const superActor = {
        id: 'usr_super_1',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant-adyapan-default',
      };

      expect(() => {
        rolePermissionService.validateRoleAssignment(superActor, 'SUPER_ADMIN');
      }).not.toThrow();
    });
  });
});
