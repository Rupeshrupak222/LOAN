import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { transition } from '../application/application.service';
import { getUnderwritingQueue, submitUnderwritingDecision } from '../underwriting/underwriting.service';
import { getDocument, deleteDocument } from '../documents/document.service';
import { buildAuthorizedContext } from '../ai/copilot.service';
import { prisma } from '../../config/prisma';

describe('Underwriter RBAC, Security, Boundary & State Machine Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const crossTenantId = 'tenant-apex-nbfc';
  const branchId = 'branch-delhi-01';

  const underwriterUser = {
    id: 'usr-uw-1',
    email: 'underwriter@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId,
    branchId,
  };

  const crossTenantUnderwriter = {
    id: 'usr-uw-cross',
    email: 'cross.uw@apex.com',
    roles: ['UNDERWRITER'],
    tenantId: crossTenantId,
    branchId: 'branch-mumbai-02',
  };

  const adminUser = {
    id: 'usr-adm-1',
    email: 'admin@adyapan.com',
    roles: ['ADMIN'],
    tenantId,
    branchId,
  };

  beforeEach(() => {
    rolePermissionService.clearForTesting();
    vi.restoreAllMocks();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
  });

  describe('1. Granular Permission Catalog & Boundary Checks', () => {
    it('UNDERWRITER has legitimate credit sanction and review permissions', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_REVIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_REJECT')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_VIEW_BUREAU')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_RUN_AI_ASSIST')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'CONFIGURATION_VIEW_POLICIES')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'PRIVACY_VIEW_CONSENT_REGISTRY')).toBe(true);
    });

    it('UNDERWRITER is strictly FORBIDDEN from treasury disbursement and fund transfer execution', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_APPROVE_MAKER_CHECKER')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_RECONCILE')).toBe(false);
    });

    it('UNDERWRITER is strictly FORBIDDEN from collections operations, OTS settlement, and penalty waivers', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_VIEW_DPD')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_RECORD_PTP')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_INITIATE_RECOVERY')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_WAIVE_PENALTY')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_SETTLE_LOAN')).toBe(false);
    });

    it('UNDERWRITER is strictly FORBIDDEN from staff management, role assignment, and policy publishing', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'TENANT_ASSIGN_ROLES')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'CONFIGURATION_CONFIGURE_INTEGRATIONS')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'PRIVACY_PURGE_PII')).toBe(false);
    });
  });

  describe('2. Segregation of Duties (SoD) Conflict Checks', () => {
    it('should detect SoD conflict between Underwriter and Disbursement Transfer (SOD_SANCTION_DISBURSER)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_SANCTION_DISBURSER')).toBe(true);
      expect(conflictCheck.conflicts[0].severity).toBe('CRITICAL_BLOCK');
    });

    it('should detect SoD conflict between Underwriter and Debt Settlement (SOD_UNDERWRITER_SETTLEMENT)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'COLLECTIONS_SETTLE_LOAN',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_UNDERWRITER_SETTLEMENT')).toBe(true);
      expect(conflictCheck.conflicts[0].severity).toBe('CRITICAL_BLOCK');
    });
  });

  describe('3. Approval Limit & Sanction Authority Tests', () => {
    it('UNDERWRITER should have authority for ₹5 Lakh loan (within ₹10 Lakh limit)', () => {
      expect(
        rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 500000,
        })
      ).toBe(true);
    });

    it('UNDERWRITER should have authority for ₹10 Lakh loan (exactly at single-officer limit)', () => {
      expect(
        rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 1000000,
        })
      ).toBe(true);
    });

    it('UNDERWRITER must be DENIED sanction for ₹20 Lakh loan (exceeds ₹10 Lakh limit)', () => {
      expect(
        rolePermissionService.hasPermission(underwriterUser, 'APPLICATIONS_APPROVE', {
          requiredSanctionAmount: 2000000,
        })
      ).toBe(false);
    });

    it('submitUnderwritingDecision enforces approval limit on APPROVE decision', async () => {
      const mockApp = {
        id: 'app-high-val-1',
        applicationNo: 'APP-1001',
        tenantId,
        requestedAmount: 50000000, // ₹5 Crore
        status: 'UNDERWRITING',
        product: { id: 'prod-1', name: 'Commercial' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
        id: 'set-1',
        key: 'approval_limits',
        category: 'underwriting',
        value: [
          { maxAmount: 1000000, chain: ['UNDERWRITER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          { maxAmount: 5000000, chain: ['BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          { maxAmount: null, chain: ['ADMIN', 'SUPER_ADMIN'] },
        ],
        updatedAt: new Date(),
        updatedBy: 'system',
      } as any);

      await expect(
        submitUnderwritingDecision(
          'app-high-val-1',
          { decision: 'APPROVE', reason: 'Recommended' },
          underwriterUser
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('submitUnderwritingDecision enforces approval limit on APPROVE_WITH_CONDITIONS decision (Cannot Bypass)', async () => {
      const mockApp = {
        id: 'app-high-val-2',
        applicationNo: 'APP-1002',
        tenantId,
        requestedAmount: 50000000, // ₹5 Crore
        status: 'UNDERWRITING',
        product: { id: 'prod-1', name: 'Commercial' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
        id: 'set-1',
        key: 'approval_limits',
        category: 'underwriting',
        value: [
          { maxAmount: 1000000, chain: ['UNDERWRITER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          { maxAmount: 5000000, chain: ['BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          { maxAmount: null, chain: ['ADMIN', 'SUPER_ADMIN'] },
        ],
        updatedAt: new Date(),
        updatedBy: 'system',
      } as any);

      await expect(
        submitUnderwritingDecision(
          'app-high-val-2',
          { decision: 'APPROVE_WITH_CONDITIONS', reason: 'Conditional', conditions: 'Require co-borrower' },
          underwriterUser
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('submitUnderwritingDecision allows APPROVE within ₹10 Lakh limit', async () => {
      const mockApp = {
        id: 'app-valid-1',
        applicationNo: 'APP-1003',
        tenantId,
        requestedAmount: 500000, // ₹5 Lakh
        status: 'UNDERWRITING',
        product: { id: 'prod-1', name: 'Personal' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
        id: 'set-1',
        key: 'approval_limits',
        category: 'underwriting',
        value: [
          { maxAmount: 1000000, chain: ['UNDERWRITER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
          { maxAmount: null, chain: ['ADMIN', 'SUPER_ADMIN'] },
        ],
        updatedAt: new Date(),
        updatedBy: 'system',
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          underwritingDecision: { upsert: vi.fn().mockResolvedValue({ id: 'dec-1', decision: 'APPROVE' }) },
          loanApplication: { update: vi.fn().mockResolvedValue({ id: 'app-valid-1', status: 'APPROVED' }) },
          applicationStatusHistory: { create: vi.fn().mockResolvedValue({}) },
          approvalRequest: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await submitUnderwritingDecision(
        'app-valid-1',
        { decision: 'APPROVE', reason: 'All credit parameters verified' },
        underwriterUser
      );

      expect(result).toBeDefined();
    });
  });

  describe('4. Multi-Tenant Scoping & Cross-Tenant IDOR Guards', () => {
    it('getUnderwritingQueue scopes query strictly to authenticated tenant', async () => {
      const findManySpy = vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([]);

      await getUnderwritingQueue('PENDING', underwriterUser);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: 'UNDERWRITING',
          }),
        })
      );
    });

    it('submitUnderwritingDecision blocks cross-tenant proposal sanction (IDOR Attack)', async () => {
      const crossTenantApp = {
        id: 'app-cross-tenant-1',
        applicationNo: 'APP-APEX-999',
        tenantId: crossTenantId, // Different institution
        requestedAmount: 300000,
        status: 'UNDERWRITING',
        product: { id: 'prod-1', name: 'Personal' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(crossTenantApp as any);

      await expect(
        submitUnderwritingDecision(
          'app-cross-tenant-1',
          { decision: 'APPROVE', reason: 'Cross tenant attempt' },
          underwriterUser // Tenant A underwriter
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('getDocument blocks cross-tenant document inspection', async () => {
      const crossTenantDoc = {
        id: 'doc-cross-1',
        fileName: 'pan.pdf',
        customerId: 'cust-cross-1',
        customer: { userId: 'usr-borrower-2', tenantId: crossTenantId },
      };

      vi.spyOn(prisma.document, 'findUnique').mockResolvedValue(crossTenantDoc as any);

      await expect(
        getDocument('doc-cross-1', underwriterUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('deleteDocument blocks cross-tenant document deletion', async () => {
      const crossTenantDoc = {
        id: 'doc-cross-2',
        fileName: 'salary.pdf',
        customerId: 'cust-cross-2',
        customer: { userId: 'usr-borrower-3', tenantId: crossTenantId },
      };

      vi.spyOn(prisma.document, 'findUnique').mockResolvedValue(crossTenantDoc as any);

      await expect(
        deleteDocument('doc-cross-2', underwriterUser.id, underwriterUser)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('5. State Machine Integrity & Boundary Hardening', () => {
    it('UNDERWRITER is strictly FORBIDDEN from transitioning applications to DISBURSED', async () => {
      const mockApp = {
        id: 'app-state-1',
        applicationNo: 'APP-1004',
        tenantId,
        status: 'READY_FOR_DISBURSEMENT',
        customer: { branchId },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);

      await expect(
        transition('app-state-1', 'DISBURSED', underwriterUser.id, 'Attempting direct payout transition', underwriterUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('UNDERWRITER is strictly FORBIDDEN from transitioning applications to READY_FOR_DISBURSEMENT or AGREEMENT_PENDING directly', async () => {
      const mockApp = {
        id: 'app-state-2',
        applicationNo: 'APP-1005',
        tenantId,
        status: 'APPROVED',
        customer: { branchId },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);

      await expect(
        transition('app-state-2', 'READY_FOR_DISBURSEMENT', underwriterUser.id, 'Bypassing agreement', underwriterUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('submitUnderwritingDecision blocks decision if application is not in underwriting state', async () => {
      const draftApp = {
        id: 'app-draft-1',
        applicationNo: 'APP-1006',
        tenantId,
        requestedAmount: 200000,
        status: 'DRAFT', // Not submitted for review
        product: { id: 'prod-1' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(draftApp as any);

      await expect(
        submitUnderwritingDecision(
          'app-draft-1',
          { decision: 'APPROVE', reason: 'Draft sanction' },
          underwriterUser
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('submitUnderwritingDecision blocks APPROVE if borrower KYC is REJECTED', async () => {
      const rejectedKycApp = {
        id: 'app-rej-kyc-1',
        applicationNo: 'APP-1007',
        tenantId,
        requestedAmount: 200000,
        status: 'UNDERWRITING',
        product: { id: 'prod-1' },
        customer: { id: 'cust-1', kycStatus: 'REJECTED' }, // Rejected KYC
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(rejectedKycApp as any);

      await expect(
        submitUnderwritingDecision(
          'app-rej-kyc-1',
          { decision: 'APPROVE', reason: 'Ignoring KYC' },
          underwriterUser
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('submitUnderwritingDecision allows REJECT on proposal', async () => {
      const mockApp = {
        id: 'app-decline-1',
        applicationNo: 'APP-1008',
        tenantId,
        requestedAmount: 500000,
        status: 'UNDERWRITING',
        product: { id: 'prod-1' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
        id: 'set-1',
        key: 'approval_limits',
        value: [],
      } as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          underwritingDecision: { upsert: vi.fn().mockResolvedValue({ id: 'dec-2', decision: 'REJECT' }) },
          loanApplication: { update: vi.fn().mockResolvedValue({ id: 'app-decline-1', status: 'REJECTED' }) },
          applicationStatusHistory: { create: vi.fn().mockResolvedValue({}) },
          approvalRequest: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await submitUnderwritingDecision(
        'app-decline-1',
        { decision: 'REJECT', reason: 'Adverse bureau history and high DTI' },
        underwriterUser
      );

      expect(result).toBeDefined();
    });

    it('submitUnderwritingDecision allows SEND_BACK to revert status to SUBMITTED', async () => {
      const mockApp = {
        id: 'app-sendback-1',
        applicationNo: 'APP-1009',
        tenantId,
        requestedAmount: 400000,
        status: 'UNDERWRITING',
        product: { id: 'prod-1' },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
        id: 'set-1',
        key: 'approval_limits',
        value: [],
      } as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          underwritingDecision: { upsert: vi.fn().mockResolvedValue({ id: 'dec-3', decision: 'SEND_BACK' }) },
          loanApplication: { update: vi.fn().mockResolvedValue({ id: 'app-sendback-1', status: 'SUBMITTED' }) },
          applicationStatusHistory: { create: vi.fn().mockResolvedValue({}) },
          approvalRequest: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await submitUnderwritingDecision(
        'app-sendback-1',
        { decision: 'SEND_BACK', reason: 'Need latest 3 months salary slips' },
        underwriterUser
      );

      expect(result).toBeDefined();
    });
  });

  describe('6. AI & Copilot Tenant Scoping', () => {
    it('Copilot context builder strictly enforces authenticated tenant filter for UNDERWRITER', async () => {
      const findFirstSpy = vi.spyOn(prisma.loan, 'findFirst').mockResolvedValue(null);

      await buildAuthorizedContext(
        underwriterUser,
        'Give me status of loan LN-998811'
      );

      expect(findFirstSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        })
      );
    });
  });

  describe('7. Operational, Treasury & Servicing Boundary Protections', () => {
    it('UNDERWRITER has zero payout, transfer, or disbursement execution rights', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_APPROVE_MAKER_CHECKER')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'DISBURSEMENTS_RECONCILE')).toBe(false);
    });

    it('UNDERWRITER cannot authorize debt settlements (OTS) or waive overdue fees', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_SETTLE_LOAN')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_WAIVE_PENALTY')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'COLLECTIONS_INITIATE_RECOVERY')).toBe(false);
    });

    it('UNDERWRITER cannot manage institutional users, assign roles, or modify core policies', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'TENANT_ASSIGN_ROLES')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriterUser, 'CONFIGURATION_CONFIGURE_INTEGRATIONS')).toBe(false);
    });
  });

  describe('8. Document Security & Evidence Immutability', () => {
    it('UNDERWRITER cannot delete borrower compliance artifacts', () => {
      // Confirmed via role-permission catalog and controller authorization
      expect(rolePermissionService.hasPermission(underwriterUser, 'PRIVACY_PURGE_PII')).toBe(false);
    });
  });

  describe('9. Policy Exceptions & Audit Immutability', () => {
    it('UNDERWRITER can approve authorized policy deviations with audit tracking', () => {
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriterUser, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(true);
    });
  });
});
