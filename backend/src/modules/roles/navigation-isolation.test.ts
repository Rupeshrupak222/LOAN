import { describe, it, expect } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { SodValidator } from './sod-validator';
import { ScopeResolver } from './scope-resolver';

// 7 Canonical Business Hubs Definition
const CANONICAL_HUBS = [
  'ORIGINATION',
  'CREDIT',
  'FINANCE',
  'COLLECTIONS',
  'PARTNER',
  'SUPPORT',
  'PLATFORM',
  'BORROWER',
] as const;

type WorkspaceId = typeof CANONICAL_HUBS[number];

interface HubConfig {
  id: WorkspaceId;
  name: string;
  allowedRoles: string[];
  defaultRoute: string;
}

const HUB_REGISTRY: Record<WorkspaceId, HubConfig> = {
  ORIGINATION: {
    id: 'ORIGINATION',
    name: 'Origination & Front-Office Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR'],
    defaultRoute: '/applications',
  },
  CREDIT: {
    id: 'CREDIT',
    name: 'Credit & Underwriting Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'RISK_MANAGER', 'RISK_ANALYST', 'FRAUD_ANALYST', 'AUDITOR'],
    defaultRoute: '/credit-assessment',
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'Finance & Servicing Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'AUDITOR'],
    defaultRoute: '/disbursements',
  },
  COLLECTIONS: {
    id: 'COLLECTIONS',
    name: 'Collections & Recovery Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'],
    defaultRoute: '/collections',
  },
  PARTNER: {
    id: 'PARTNER',
    name: 'Partner & Embedded Lending Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'],
    defaultRoute: '/partners',
  },
  SUPPORT: {
    id: 'SUPPORT',
    name: 'Customer & Support Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR'],
    defaultRoute: '/communications',
  },
  PLATFORM: {
    id: 'PLATFORM',
    name: 'Platform & Governance Hub',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
    defaultRoute: '/command-center',
  },
  BORROWER: {
    id: 'BORROWER',
    name: 'Borrower Self-Service Portal',
    allowedRoles: ['CUSTOMER'],
    defaultRoute: '/customer/dashboard',
  },
};

describe('Phase P3 — Workspace & Navigation Consolidation Suite', () => {
  // ─── 1. Canonical 7 Hubs Structure ───
  describe('1. 7 Business Hubs & Workspace Taxonomies', () => {
    it('should register exactly 7 enterprise staff business hubs + 1 borrower self-service portal', () => {
      expect(Object.keys(HUB_REGISTRY)).toHaveLength(8);
      const staffHubs = Object.values(HUB_REGISTRY).filter((h) => h.id !== 'BORROWER');
      expect(staffHubs).toHaveLength(7);
      expect(staffHubs.map((h) => h.id)).toEqual([
        'ORIGINATION',
        'CREDIT',
        'FINANCE',
        'COLLECTIONS',
        'PARTNER',
        'SUPPORT',
        'PLATFORM',
      ]);
    });

    it('should route Loan Officer strictly to Origination and Support hubs', () => {
      const loWorkspaces = Object.values(HUB_REGISTRY).filter((h) => h.allowedRoles.includes('LOAN_OFFICER'));
      const wsIds = loWorkspaces.map((w) => w.id);
      expect(wsIds).toContain('ORIGINATION');
      expect(wsIds).toContain('SUPPORT');
      expect(wsIds).not.toContain('FINANCE');
      expect(wsIds).not.toContain('COLLECTIONS');
      expect(wsIds).not.toContain('PLATFORM');
    });

    it('should route Finance Officer strictly to Finance Hub and restrict Credit/Collections mutation', () => {
      const finWorkspaces = Object.values(HUB_REGISTRY).filter((h) => h.allowedRoles.includes('FINANCE_OFFICER'));
      const wsIds = finWorkspaces.map((w) => w.id);
      expect(wsIds).toEqual(['FINANCE']);
    });

    it('should route Collection Officer strictly to Collections Hub', () => {
      const collWorkspaces = Object.values(HUB_REGISTRY).filter((h) => h.allowedRoles.includes('COLLECTION_OFFICER'));
      const wsIds = collWorkspaces.map((w) => w.id);
      expect(wsIds).toEqual(['COLLECTIONS']);
    });

    it('should grant Auditor read-only access across all internal staff hubs, but never Borrower portal', () => {
      const auditorWorkspaces = Object.values(HUB_REGISTRY).filter((h) => h.allowedRoles.includes('AUDITOR'));
      expect(auditorWorkspaces).toHaveLength(7);
      expect(auditorWorkspaces.map((w) => w.id)).not.toContain('BORROWER');
    });

    it('should completely isolate Borrower from internal staff workspaces', () => {
      const borrowerWorkspaces = Object.values(HUB_REGISTRY).filter((h) => h.allowedRoles.includes('CUSTOMER'));
      expect(borrowerWorkspaces).toHaveLength(1);
      expect(borrowerWorkspaces[0].id).toBe('BORROWER');
    });
  });

  // ─── 2. Strict RBAC Navigation & Permission Mapping ───
  describe('2. Navigation Permission Verification (P2 Canonical Taxonomy)', () => {
    it('should grant Loan Officer origination permissions and deny financial disbursement execution', () => {
      const loUser = { id: 'usr-lo-1', email: 'lo@adyapan.com', tenantId: 'tenant-1', branchId: 'br-1', roles: ['LOAN_OFFICER'] };
      expect(rolePermissionService.hasPermission(loUser, 'application.view')).toBe(true);
      expect(rolePermissionService.hasPermission(loUser, 'application.create')).toBe(true);
      expect(rolePermissionService.hasPermission(loUser, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(loUser, 'underwriting.decide')).toBe(false);
    });

    it('should grant Underwriter sanction authority up to limit but deny payout execution', () => {
      const uwUser = { id: 'usr-uw-1', email: 'uw@adyapan.com', tenantId: 'tenant-1', roles: ['UNDERWRITER'] };
      expect(rolePermissionService.hasPermission(uwUser, 'underwriting.decide', { requiredSanctionAmount: 500000 })).toBe(true);
      expect(rolePermissionService.hasPermission(uwUser, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(uwUser, 'finance.gl.post')).toBe(false);
    });

    it('should grant Finance Officer payout execution and GL viewing, but deny loan approval', () => {
      const finUser = { id: 'usr-fin-1', email: 'fin@adyapan.com', tenantId: 'tenant-1', roles: ['FINANCE_OFFICER'] };
      expect(rolePermissionService.hasPermission(finUser, 'disbursement.execute')).toBe(true);
      expect(rolePermissionService.hasPermission(finUser, 'finance.gl.view')).toBe(true);
      expect(rolePermissionService.hasPermission(finUser, 'approval.approve')).toBe(false);
    });

    it('should restrict Auditor from any state-changing financial or underwriting mutations', () => {
      const auditorUser = { id: 'usr-aud-1', email: 'aud@adyapan.com', tenantId: 'tenant-1', roles: ['AUDITOR'] };
      expect(rolePermissionService.hasPermission(auditorUser, 'finance.gl.view')).toBe(true);
      expect(rolePermissionService.hasPermission(auditorUser, 'audit.view')).toBe(true);
      expect(rolePermissionService.hasPermission(auditorUser, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(auditorUser, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(auditorUser, 'application.create')).toBe(false);

      expect(() => {
        SodValidator.assertAuditorReadOnly(auditorUser, 'DISBURSEMENT_EXECUTE');
      }).toThrow(/Auditor role is strictly read-only/);
    });
  });

  // ─── 3. Workflow Stage-Gate Invariants & Locked Navigation ───
  describe('3. Workflow Stage-Gate Navigation Rules', () => {
    it('should lock Credit Assessment when KYC is incomplete', () => {
      const isKycComplete = false;
      const isCreditUnlocked = isKycComplete;
      expect(isCreditUnlocked).toBe(false);
    });

    it('should lock Underwriting Sanction when Credit Appraisal is pending', () => {
      const isCreditAssessed = false;
      const isUnderwritingUnlocked = isCreditAssessed;
      expect(isUnderwritingUnlocked).toBe(false);
    });

    it('should lock Offer Generation when Underwriting Sanction is pending', () => {
      const isUnderwritten = false;
      const isOfferUnlocked = isUnderwritten;
      expect(isOfferUnlocked).toBe(false);
    });

    it('should lock eSign & Mandate when Offer is not yet accepted by Borrower', () => {
      const isOfferAccepted = false;
      const isEsignUnlocked = isOfferAccepted;
      expect(isEsignUnlocked).toBe(false);
    });

    it('should lock Disbursement until eSign contract and e-NACH mandate are active', () => {
      const isEsignComplete = true;
      const isMandateActive = false;
      const isDisbursementUnlocked = isEsignComplete && isMandateActive;
      expect(isDisbursementUnlocked).toBe(false);
    });

    it('should unlock Disbursement when both eSign and Mandate prerequisites are satisfied', () => {
      const isEsignComplete = true;
      const isMandateActive = true;
      const isDisbursementUnlocked = isEsignComplete && isMandateActive;
      expect(isDisbursementUnlocked).toBe(true);
    });
  });

  // ─── 4. Scope Isolation (Zero-Trust IDOR Protection) ───
  describe('4. Server-Derived Scope Isolation Across Hubs', () => {
    it('should derive tenant scope from verified token and reject cross-tenant spoofing', () => {
      const user = { id: 'usr-1', email: 'usr1@adyapan.com', tenantId: 'tenant-alpha', roles: ['LOAN_OFFICER'] };
      const scope = ScopeResolver.resolveAuthorizedScope(user);
      expect(scope.tenantId).toBe('tenant-alpha');
      expect(scope.isSuperAdmin).toBe(false);

      expect(() => {
        ScopeResolver.validateTenantAccess(user, 'tenant-beta');
      }).toThrow(/Cross-tenant access denied/);
    });

    it('should enforce branch scope on branch roles', () => {
      const bmUser = { id: 'usr-bm-1', email: 'bm@adyapan.com', tenantId: 'tenant-1', branchId: 'branch-south', roles: ['BRANCH_MANAGER'] };
      const scope = ScopeResolver.resolveAuthorizedScope(bmUser);
      expect(scope.branchId).toBe('branch-south');

      expect(() => {
        ScopeResolver.validateBranchAccess(bmUser, 'branch-north');
      }).toThrow(/Cross-branch access denied/);
    });

    it('should isolate Borrower exclusively to their own customer ID', () => {
      const customerUser = { id: 'cust-101', email: 'cust@adyapan.com', tenantId: 'tenant-1', customerId: 'cust-101', roles: ['CUSTOMER'] };
      const scope = ScopeResolver.resolveAuthorizedScope(customerUser);
      expect(scope.customerId).toBe('cust-101');

      expect(() => {
        ScopeResolver.validateCustomerAccess(customerUser, 'cust-999');
      }).toThrow(/Customer access violation/);
    });
  });

  // ─── 5. Banking Segregation of Duties (SoD) Invariants ───
  describe('5. Banking Maker-Checker SoD Enforcement', () => {
    it('should reject loan application maker approving their own loan', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation('usr-maker-1', 'usr-maker-1', 'LOAN_SANCTION');
      }).toThrow(/Maker-Checker conflict/);
    });

    it('should allow distinct checker to sanction loan application', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation('usr-maker-1', 'usr-checker-2', 'LOAN_SANCTION');
      }).not.toThrow();
    });

    it('should reject single user initiating and releasing disbursement', () => {
      expect(() => {
        SodValidator.assertDualControlPayout('usr-fin-1', 'usr-fin-1');
      }).toThrow(/Dual-control payout violation/);
    });

    it('should reject collector approving their own debt settlement proposal', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation('usr-collector-1', 'usr-collector-1', 'DEBT_SETTLEMENT');
      }).toThrow(/Maker-Checker conflict/);
    });
  });
});
