import { describe, it, expect } from 'vitest';
import {
  WORKSPACES,
  getAuthorizedWorkspacesForRoles,
  WorkspaceId,
} from './workspaces.types';
import {
  CENTRALIZED_NAVIGATION,
  AppNavItem,
} from './navigation.config';
import {
  getDefaultWorkspaceForUser,
  getAuthorizedNavigation,
  getGroupedNavigation,
  canAccessRoute,
} from './useNavigation';
import {
  evaluateWorkflowStageGate,
  ApplicationWorkflowStage,
} from './workflow-gates';
import { AuthUser } from '../auth';

describe('Frontend Navigation & 7-Hub Workspace Consolidation (Phase P3)', () => {
  // ─── 1. 7 Business Hubs Definition & Defaults ───
  describe('1. Workspaces Architecture & Defaults', () => {
    it('should register exactly 7 business hubs plus 1 borrower portal', () => {
      const hubs = Object.keys(WORKSPACES);
      expect(hubs).toHaveLength(8);
      expect(hubs).toContain('ORIGINATION');
      expect(hubs).toContain('CREDIT');
      expect(hubs).toContain('FINANCE');
      expect(hubs).toContain('COLLECTIONS');
      expect(hubs).toContain('PARTNER');
      expect(hubs).toContain('SUPPORT');
      expect(hubs).toContain('PLATFORM');
      expect(hubs).toContain('BORROWER');
    });

    it('should assign correct default workspace for each primary role', () => {
      expect(getDefaultWorkspaceForUser({ roles: ['LOAN_OFFICER'] } as AuthUser)).toBe('ORIGINATION');
      expect(getDefaultWorkspaceForUser({ roles: ['CREDIT_ANALYST'] } as AuthUser)).toBe('CREDIT');
      expect(getDefaultWorkspaceForUser({ roles: ['UNDERWRITER'] } as AuthUser)).toBe('CREDIT');
      expect(getDefaultWorkspaceForUser({ roles: ['FINANCE_OFFICER'] } as AuthUser)).toBe('FINANCE');
      expect(getDefaultWorkspaceForUser({ roles: ['COLLECTION_OFFICER'] } as AuthUser)).toBe('COLLECTIONS');
      expect(getDefaultWorkspaceForUser({ roles: ['BRANCH_MANAGER'] } as AuthUser)).toBe('ORIGINATION');
      expect(getDefaultWorkspaceForUser({ roles: ['SUPER_ADMIN'] } as AuthUser)).toBe('PLATFORM');
      expect(getDefaultWorkspaceForUser({ roles: ['AUDITOR'] } as AuthUser)).toBe('PLATFORM');
      expect(getDefaultWorkspaceForUser({ roles: ['CUSTOMER'] } as AuthUser)).toBe('BORROWER');
    });

    it('should provide multi-workspace access for Super Admin and Branch Manager', () => {
      const superAdminWorkspaces = getAuthorizedWorkspacesForRoles(['SUPER_ADMIN']);
      expect(superAdminWorkspaces.length).toBe(7); // All staff hubs

      const bmWorkspaces = getAuthorizedWorkspacesForRoles(['BRANCH_MANAGER']);
      const bmIds = bmWorkspaces.map((w) => w.id);
      expect(bmIds).toContain('ORIGINATION');
      expect(bmIds).toContain('CREDIT');
      expect(bmIds).toContain('COLLECTIONS');
      expect(bmIds).toContain('PARTNER');
      expect(bmIds).toContain('SUPPORT');
    });
  });

  // ─── 2. Authorized Navigation Filtering & Grouping ───
  describe('2. Navigation Item Filtering & Uncluttered Grouping', () => {
    it('should filter Origination Hub items for Loan Officer', () => {
      const loUser: AuthUser = {
        id: 'usr-lo-1',
        email: 'lo@adyapan.com',
        firstName: 'Loan',
        lastName: 'Officer',
        roles: ['LOAN_OFFICER'],
        tenantId: 'tenant-1',
      };

      const navItems = getAuthorizedNavigation(loUser, 'ORIGINATION');
      const keys = navItems.map((item) => item.key);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('applications');
      expect(keys).toContain('customers');
      expect(keys).toContain('returned-applications');
      expect(keys).toContain('documents');
      expect(keys).toContain('loan-products');
      expect(keys).not.toContain('underwriting');
      expect(keys).not.toContain('disbursements');
      expect(keys).not.toContain('general-ledger');
    });

    it('should filter Finance Hub items for Finance Officer', () => {
      const finUser: AuthUser = {
        id: 'usr-fin-1',
        email: 'finance@adyapan.com',
        firstName: 'Finance',
        lastName: 'Officer',
        roles: ['FINANCE_OFFICER'],
        tenantId: 'tenant-1',
      };

      const navItems = getAuthorizedNavigation(finUser, 'FINANCE');
      const keys = navItems.map((item) => item.key);
      expect(keys).toContain('loans');
      expect(keys).toContain('disbursements');
      expect(keys).toContain('payments');
      expect(keys).toContain('general-ledger');
      expect(keys).toContain('reconciliation');
      expect(keys).not.toContain('applications');
      expect(keys).not.toContain('underwriting');
    });
  });

  // ─── 3. Deep Link & Route Guarding ───
  describe('3. Route Guard & Access Validation', () => {
    it('should permit Loan Officer to access /applications and deny /disbursements', () => {
      const loUser: AuthUser = {
        id: 'usr-lo-1',
        roles: ['LOAN_OFFICER'],
      } as AuthUser;

      expect(canAccessRoute(loUser, '/applications')).toBe(true);
      expect(canAccessRoute(loUser, '/customers')).toBe(true);
      expect(canAccessRoute(loUser, '/disbursements')).toBe(false);
      expect(canAccessRoute(loUser, '/underwriting')).toBe(false);
      expect(canAccessRoute(loUser, '/general-ledger')).toBe(false);
    });

    it('should isolate Borrower to /customer/* routes and deny internal staff pages', () => {
      const custUser: AuthUser = {
        id: 'cust-1',
        roles: ['CUSTOMER'],
      } as AuthUser;

      expect(canAccessRoute(custUser, '/customer/dashboard')).toBe(true);
      expect(canAccessRoute(custUser, '/customer/apply')).toBe(true);
      expect(canAccessRoute(custUser, '/dashboard')).toBe(false);
      expect(canAccessRoute(custUser, '/applications')).toBe(false);
      expect(canAccessRoute(custUser, '/disbursements')).toBe(false);
    });
  });

  // ─── 4. Workflow Stage-Gate Invariants & Explanation UI ───
  describe('4. Workflow Stage-Gate Evaluation & Locked Actions', () => {
    it('should evaluate KYC_PENDING stage with pending KYC and locked credit', () => {
      const gate = evaluateWorkflowStageGate('KYC_PENDING', { isKycComplete: false });
      expect(gate.stageLabel).toBe('KYC & Documentation Pending');
      expect(gate.nextValidAction.actionKey).toBe('COMPLETE_KYC');
      expect(gate.nextValidAction.targetRoute).toBe('/customers');

      const creditLock = gate.lockedActions.find((a) => a.actionKey === 'ASSESS_CREDIT');
      expect(creditLock?.isLocked).toBe(true);
      expect(creditLock?.lockReason).toContain('KYC verification must be completed first');
    });

    it('should evaluate CREDIT_REVIEW_PENDING stage with completed KYC and next action Credit Appraisal', () => {
      const gate = evaluateWorkflowStageGate('CREDIT_REVIEW_PENDING', { isKycComplete: true, isCreditAssessed: false });
      expect(gate.stageLabel).toBe('Credit Appraisal Pending');
      expect(gate.nextValidAction.actionKey).toBe('START_CREDIT_ASSESSMENT');
      expect(gate.nextValidAction.targetRoute).toBe('/credit-assessment');

      const uwLock = gate.lockedActions.find((a) => a.actionKey === 'UNDERWRITE_SANCTION');
      expect(uwLock?.isLocked).toBe(true);
    });

    it('should evaluate DISBURSEMENT_READY stage with 10-point gatekeeper next action', () => {
      const gate = evaluateWorkflowStageGate('DISBURSEMENT_READY', {
        isKycComplete: true,
        isCreditAssessed: true,
        isUnderwritten: true,
        isOfferAccepted: true,
        isEsignComplete: true,
        isMandateActive: true,
      });

      expect(gate.stageLabel).toBe('Pre-Disbursement Gatekeeper Ready');
      expect(gate.nextValidAction.actionKey).toBe('EXECUTE_DISBURSEMENT');
      expect(gate.nextValidAction.targetRoute).toBe('/disbursements');

      const disbLock = gate.lockedActions.find((a) => a.actionKey === 'DISBURSE_PAYOUT');
      expect(disbLock?.isLocked).toBe(false);
    });

    it('should evaluate DELINQUENT stage with PTP follow-up next action', () => {
      const gate = evaluateWorkflowStageGate('DELINQUENT', { dpd: 45, outstandingBalance: 50000 });
      expect(gate.stageLabel).toBe('Delinquency & Collections Queue');
      expect(gate.nextValidAction.actionKey).toBe('LOG_PTP_FOLLOWUP');
      expect(gate.nextValidAction.targetRoute).toBe('/collections');
    });
  });
});
