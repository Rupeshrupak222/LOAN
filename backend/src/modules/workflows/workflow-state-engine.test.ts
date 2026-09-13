import { describe, it, expect, beforeEach } from 'vitest';
import { workflowTransitionService, WorkflowTransitionService } from './workflow-transition.service';
import { SodValidator } from '../roles/sod-validator';
import { ScopeResolver } from '../roles/scope-resolver';

describe('Phase P4: Authoritative State-Gated Lending Engine Suite', () => {
  // ─── 1. State Transition Graph Validation ───
  describe('1. Authoritative State Machine Graph Invariants', () => {
    it('should allow sequential progression from DRAFT to SUBMITTED', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['DRAFT'];
      expect(allowedTargets).toContain('SUBMITTED');
      expect(allowedTargets).toContain('CANCELLED');
      expect(allowedTargets).not.toContain('DISBURSED');
      expect(allowedTargets).not.toContain('APPROVED');
    });

    it('should reject direct skip from DRAFT to DISBURSED', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['DRAFT'];
      expect(allowedTargets.includes('DISBURSED')).toBe(false);
    });

    it('should reject direct skip from CREDIT_ASSESSMENT to DISBURSED', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['CREDIT_ASSESSMENT'];
      expect(allowedTargets.includes('DISBURSED')).toBe(false);
    });

    it('should support non-linear return to SUBMITTED from UNDERWRITING (Send Back)', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['UNDERWRITING'];
      expect(allowedTargets).toContain('SUBMITTED');
      expect(allowedTargets).toContain('APPROVED');
      expect(allowedTargets).toContain('REJECTED');
    });

    it('should mark DISBURSED, REJECTED, and CANCELLED as terminal lifecycle states', () => {
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['DISBURSED']).toEqual([]);
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['REJECTED']).toEqual([]);
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['CANCELLED']).toEqual([]);
    });
  });

  // ─── 2. Deterministic Stage-Gate Prerequisite Evaluation ───
  describe('2. Deterministic Stage-Gate Prerequisite Checks', () => {
    it('should block Credit Assessment when KYC identity verification is incomplete', () => {
      const mockApp = {
        id: 'app-test-1',
        applicationNo: 'APP-1001',
        status: 'KYC_PENDING',
        customer: { kycStatus: 'NOT_STARTED', documents: [] },
        documents: [],
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        mockApp,
        'CREDIT_ASSESSMENT',
        completed,
        pending,
        blockers
      );

      expect(blockers).toContain('Dynamic KYC verification must be completed first.');
      expect(pending.some((p) => p.key === 'KYC_VERIFICATION')).toBe(true);
    });

    it('should block Underwriting Sanction when financial bank data is missing', () => {
      const mockApp = {
        id: 'app-test-2',
        applicationNo: 'APP-1002',
        status: 'CREDIT_ASSESSMENT',
        customer: { kycStatus: 'VERIFIED', documents: [{ category: 'PAN_CARD', documentType: 'PAN_CARD' }] },
        documents: [],
        eligibility: null,
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        mockApp,
        'UNDERWRITING',
        completed,
        pending,
        blockers
      );

      expect(blockers).toContain('Financial data and bank statements must be parsed and verified.');
      expect(pending.some((p) => p.key === 'FINANCIAL_DATA')).toBe(true);
    });

    it('should block Approval when active fraud hold exists on application', () => {
      const mockApp = {
        id: 'app-test-3',
        applicationNo: 'APP-1003',
        status: 'UNDERWRITING',
        customer: { kycStatus: 'VERIFIED', documents: [{ category: 'PAN_CARD', documentType: 'PAN_CARD' }] },
        documents: [{ category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT' }],
        eligibility: { result: 'ELIGIBLE' },
        riskAssessment: {
          score: 85,
          category: 'HIGH',
          factors: { fraudHold: true },
        },
        underwriting: { decision: 'APPROVE' },
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        mockApp,
        'APPROVED',
        completed,
        pending,
        blockers
      );

      expect(blockers).toContain('Proposal has an active fraud hold.');
      expect(pending.some((p) => p.key === 'RISK_FRAUD_ASSESSMENT')).toBe(true);
    });

    it('should block Disbursement when digital contract eSign and e-NACH mandate are pending', () => {
      const mockApp = {
        id: 'app-test-4',
        applicationNo: 'APP-1004',
        status: 'APPROVED',
        customer: {
          kycStatus: 'VERIFIED',
          bankAccounts: [{ isVerified: false }],
          documents: [{ category: 'PAN_CARD', documentType: 'PAN_CARD' }],
        },
        documents: [{ category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT' }],
        eligibility: { result: 'ELIGIBLE' },
        riskAssessment: { score: 720, category: 'LOW', factors: {} },
        underwriting: { decision: 'APPROVE' },
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        mockApp,
        'READY_FOR_DISBURSEMENT',
        completed,
        pending,
        blockers
      );

      expect(blockers).toContain('Contract eSign and active bank mandate are required before disbursement.');
    });

    it('should pass all prerequisites when KYC, bank data, risk score, underwriting sanction, eSign, and mandate are fulfilled', () => {
      const mockApp = {
        id: 'app-test-5',
        applicationNo: 'APP-1005',
        status: 'AGREEMENT_PENDING',
        customer: {
          kycStatus: 'VERIFIED',
          bankAccounts: [{ isVerified: true }],
          documents: [
            { category: 'PAN_CARD', documentType: 'PAN_CARD' },
            { category: 'SIGNED_AGREEMENT', documentType: 'SIGNED_AGREEMENT' },
          ],
        },
        documents: [{ category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT' }],
        eligibility: { result: 'ELIGIBLE' },
        riskAssessment: { score: 750, category: 'LOW', factors: {} },
        underwriting: { decision: 'APPROVE' },
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        mockApp,
        'READY_FOR_DISBURSEMENT',
        completed,
        pending,
        blockers
      );

      expect(blockers).toHaveLength(0);
      expect(completed.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── 3. Segregation of Duties (SoD) & Zero-Trust Governance ───
  describe('3. Banking Segregation of Duties (SoD) Invariants', () => {
    it('should reject application maker approving their own proposal sanction', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation('usr-loan-officer-1', 'usr-loan-officer-1', 'SANCTION_APPROVAL');
      }).toThrow(/Maker-Checker conflict/);
    });

    it('should allow distinct Underwriter checker to sanction proposal', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation('usr-loan-officer-1', 'usr-underwriter-2', 'SANCTION_APPROVAL');
      }).not.toThrow();
    });

    it('should strictly prohibit Auditor from mutating workflow stage', () => {
      expect(() => {
        SodValidator.assertAuditorReadOnly(['AUDITOR'], 'TRANSITION_TO_APPROVED');
      }).toThrow(/Auditor role is strictly read-only/);
    });

    it('should restrict customer borrower from executing staff workflow transitions', () => {
      expect(() => {
        SodValidator.assertBorrowerInternalRestriction(['CUSTOMER'], 'underwriting.decide');
      }).toThrow(/Borrower identities are strictly restricted/);
    });
  });

  // ─── 4. Scope Isolation (Zero-Trust IDOR Protection) ───
  describe('4. Scope Isolation & Multi-Tenant IDOR Defense', () => {
    it('should prevent cross-tenant workflow state transitions', () => {
      const user = { id: 'usr-1', tenantId: 'tenant-apex', roles: ['UNDERWRITER'] };
      expect(() => {
        ScopeResolver.validateTenantAccess(user as any, 'tenant-rival');
      }).toThrow(/Cross-tenant access denied/);
    });

    it('should prevent branch officer from transitioning applications belonging to another branch', () => {
      const bmUser = { id: 'usr-bm-1', tenantId: 'tenant-apex', branchId: 'BR-WEST', roles: ['BRANCH_MANAGER'] };
      expect(() => {
        ScopeResolver.validateBranchAccess(bmUser as any, 'BR-EAST');
      }).toThrow(/Cross-branch access denied/);
    });
  });
});
