import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { ForbiddenError } from '../../common/errors';
import { transition } from '../application/application.service';
import { submitUnderwritingDecision } from '../underwriting/underwriting.service';
import { buildAuthorizedContext } from '../ai/copilot.service';
import { prisma } from '../../config/prisma';

describe('Credit Analyst RBAC, Boundary, State-Machine & Data Scoping Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const crossTenantId = 'tenant-apex-nbfc';
  const branchId = 'branch-delhi-01';

  const creditAnalystUser = {
    id: 'usr-ca-1',
    email: 'analyst@adyapan.com',
    roles: ['CREDIT_ANALYST'],
    tenantId,
    branchId,
  };

  const underwriterUser = {
    id: 'usr-uw-1',
    email: 'underwriter@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId,
    branchId,
  };

  beforeEach(() => {
    rolePermissionService.clearForTesting();
  });

  describe('1. Granular Permission Boundaries for CREDIT_ANALYST', () => {
    it('CREDIT_ANALYST has legitimate analytical review and scoring permissions', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'APPLICATIONS_REVIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'UNDERWRITING_VIEW_BUREAU')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'UNDERWRITING_RUN_AI_ASSIST')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'CONFIGURATION_VIEW_POLICIES')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'PRIVACY_VIEW_CONSENT_REGISTRY')).toBe(true);
    });

    it('CREDIT_ANALYST is strictly FORBIDDEN from sanctioning, approving, or formally rejecting applications', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'APPLICATIONS_REJECT')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(false);
    });

    it('CREDIT_ANALYST is strictly FORBIDDEN from treasury disbursements and payouts', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'DISBURSEMENTS_APPROVE_MAKER_CHECKER')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'DISBURSEMENTS_RECONCILE')).toBe(false);
    });

    it('CREDIT_ANALYST is strictly FORBIDDEN from collections recovery, OTS debt settlement, and penalty waivers', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'COLLECTIONS_INITIATE_RECOVERY')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'COLLECTIONS_WAIVE_PENALTY')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'COLLECTIONS_SETTLE_LOAN')).toBe(false);
    });

    it('CREDIT_ANALYST is strictly FORBIDDEN from publishing policies, drafting policies, or modifying integrations', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'CONFIGURATION_DRAFT_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'CONFIGURATION_CONFIGURE_INTEGRATIONS')).toBe(false);
    });

    it('CREDIT_ANALYST is strictly FORBIDDEN from user administration, role assignment, branding, and PII erasure', () => {
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'TENANT_ASSIGN_ROLES')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'TENANT_CONFIGURE_BRANDING')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'PRIVACY_PURGE_PII')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystUser, 'AUDIT_EXPORT_EVIDENCE_PACKAGE')).toBe(false);
    });

    it('CREDIT_ANALYST role definition has ZERO sanction authority limit', () => {
      const roleDef = rolePermissionService.getRole(tenantId, 'CREDIT_ANALYST');
      expect(roleDef).toBeDefined();
      expect(roleDef.sanctionLimitAmount).toBe(0);
      expect(roleDef.scope).toBe('TENANT');
    });
  });

  describe('2. Underwriting Service Decision Lockout (Backend Service & API)', () => {
    it('Credit Analyst attempting submitUnderwritingDecision receives 403 Forbidden', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-1',
        applicationNo: 'APP-1001',
        tenantId,
        status: 'UNDERWRITING',
        requestedAmount: 500000,
        customerId: 'cust-1',
        productId: 'prod-1',
      } as any);

      await expect(
        submitUnderwritingDecision(
          'app-test-1',
          { decision: 'APPROVE', reason: 'Analyst approving loan' },
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        submitUnderwritingDecision(
          'app-test-1',
          { decision: 'REJECT', reason: 'Analyst rejecting loan' },
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });
  });

  describe('3. Application State Machine Boundary Verification', () => {
    it('CREDIT_ANALYST cannot transition application to APPROVED', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-101',
        applicationNo: 'APP-1002',
        tenantId,
        status: 'CREDIT_ASSESSMENT',
        customer: { id: 'cust-1', branchId },
      } as any);

      await expect(
        transition(
          'app-test-101',
          'APPROVED',
          creditAnalystUser.email,
          'Unauthorized approval attempt',
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('CREDIT_ANALYST cannot transition application to REJECTED', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-102',
        applicationNo: 'APP-1003',
        tenantId,
        status: 'CREDIT_ASSESSMENT',
        customer: { id: 'cust-1', branchId },
      } as any);

      await expect(
        transition(
          'app-test-102',
          'REJECTED',
          creditAnalystUser.email,
          'Unauthorized rejection attempt',
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('CREDIT_ANALYST cannot transition application to READY_FOR_DISBURSEMENT or DISBURSED', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-103',
        applicationNo: 'APP-1004',
        tenantId,
        status: 'APPROVED',
        customer: { id: 'cust-1', branchId },
      } as any);

      await expect(
        transition(
          'app-test-103',
          'READY_FOR_DISBURSEMENT',
          creditAnalystUser.email,
          'Attempted payout move',
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        transition(
          'app-test-103',
          'DISBURSED',
          creditAnalystUser.email,
          'Attempted disbursement',
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('CREDIT_ANALYST CAN transition application through legitimate analytical workflow (UNDER_REVIEW, CREDIT_ASSESSMENT, UNDERWRITING, SUBMITTED)', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-104',
        applicationNo: 'APP-1005',
        tenantId,
        status: 'SUBMITTED',
        customer: { id: 'cust-1', branchId },
      } as any);

      const txSpy = vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          loanApplication: {
            update: vi.fn().mockResolvedValue({ id: 'app-test-104', status: 'UNDER_REVIEW' }),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
          },
        });
      });

      // Transition SUBMITTED -> UNDER_REVIEW
      const result = await transition(
        'app-test-104',
        'UNDER_REVIEW',
        creditAnalystUser.email,
        'Starting credit review',
        creditAnalystUser
      );

      expect(result.status).toBe('UNDER_REVIEW');

      findUniqueSpy.mockRestore();
      txSpy.mockRestore();
    });

    it('CREDIT_ANALYST CAN forward application to Underwriting (CREDIT_ASSESSMENT -> UNDERWRITING)', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-105',
        applicationNo: 'APP-1006',
        tenantId,
        status: 'CREDIT_ASSESSMENT',
        customer: { id: 'cust-1', branchId },
      } as any);

      const txSpy = vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          loanApplication: {
            update: vi.fn().mockResolvedValue({ id: 'app-test-105', status: 'UNDERWRITING' }),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
          },
        });
      });

      const result = await transition(
        'app-test-105',
        'UNDERWRITING',
        creditAnalystUser.email,
        'Forwarded with credit recommendation: FOIR 42%, CIBIL 740',
        creditAnalystUser
      );

      expect(result.status).toBe('UNDERWRITING');

      findUniqueSpy.mockRestore();
      txSpy.mockRestore();
    });
  });

  describe('4. Tenant Isolation & IDOR Protection', () => {
    it('CREDIT_ANALYST is blocked from accessing application of another tenant (Cross-Tenant 403)', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-cross-tenant',
        applicationNo: 'APP-CROSS-001',
        tenantId: crossTenantId,
        status: 'SUBMITTED',
        customer: { id: 'cust-cross', branchId },
      } as any);

      await expect(
        transition(
          'app-cross-tenant',
          'UNDER_REVIEW',
          creditAnalystUser.email,
          'Cross-tenant review attempt',
          creditAnalystUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('CREDIT_ANALYST AI Copilot context strictly scopes queries by tenantId', async () => {
      const findFirstLoanSpy = vi.spyOn(prisma.loan, 'findFirst').mockResolvedValue(null);
      const findFirstAppSpy = vi.spyOn(prisma.loanApplication, 'findFirst').mockResolvedValue(null);
      const findFirstCustSpy = vi.spyOn(prisma.customer, 'findFirst').mockResolvedValue(null);
      const findManyLoansSpy = vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      const findManyAppsSpy = vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([]);
      const findManySubsSpy = vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);
      const findManyCasesSpy = vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([]);

      await buildAuthorizedContext(
        creditAnalystUser,
        'Analyze application APP-2001, customer CUST-1001, loan LN-3001'
      );

      // Verify Application query was scoped to authenticated tenant
      expect(findFirstAppSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        })
      );

      // Verify Customer query was scoped to authenticated tenant
      expect(findFirstCustSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        })
      );

      // Verify Loan query was scoped to authenticated tenant
      expect(findFirstLoanSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        })
      );

      findFirstLoanSpy.mockRestore();
      findFirstAppSpy.mockRestore();
      findFirstCustSpy.mockRestore();
      findManyLoansSpy.mockRestore();
      findManyAppsSpy.mockRestore();
      findManySubsSpy.mockRestore();
      findManyCasesSpy.mockRestore();
    });
  });

  describe('5. Segregation of Duties (SoD) Integrity', () => {
    it('detects SoD conflict when combining Credit Approval with Payment Execution', () => {
      const result = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].ruleCode).toBe('SOD_SANCTION_DISBURSER');
    });

    it('detects SoD conflict when combining Credit Approval with Loan Debt Settlement', () => {
      const result = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'COLLECTIONS_SETTLE_LOAN',
      ]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].ruleCode).toBe('SOD_UNDERWRITER_SETTLEMENT');
    });

    it('confirms pure CREDIT_ANALYST permission set has ZERO SoD conflicts', () => {
      const analystRole = rolePermissionService.getRole(tenantId, 'CREDIT_ANALYST');
      const result = rolePermissionService.checkSodConflicts(analystRole.permissions);
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });
});
