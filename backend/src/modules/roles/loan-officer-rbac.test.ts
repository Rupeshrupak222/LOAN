import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { ForbiddenError } from '../../common/errors';
import { transition } from '../application/application.service';
import { buildAuthorizedContext } from '../ai/copilot.service';
import { prisma } from '../../config/prisma';

describe('Loan Officer RBAC, Boundary & Data Scoping Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const branch1Id = 'branch-delhi-01';
  const branch2Id = 'branch-mumbai-01';

  const loanOfficerUser = {
    id: 'usr-lo-delhi-1',
    email: 'lo.delhi@adyapan.com',
    roles: ['LOAN_OFFICER'],
    tenantId,
    branchId: branch1Id,
  };

  const branchManagerUser = {
    id: 'usr-bm-delhi-1',
    email: 'bm.delhi@adyapan.com',
    roles: ['BRANCH_MANAGER'],
    tenantId,
    branchId: branch1Id,
  };

  const underwriterUser = {
    id: 'usr-uw-1',
    email: 'uw@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId,
  };

  beforeEach(() => {
    rolePermissionService.clearForTesting();
  });

  describe('1. Granular Permissions & Role Boundary Verification', () => {
    it('LOAN_OFFICER has allowed intake and application view permissions', () => {
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'APPLICATIONS_CREATE')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'PRIVACY_VIEW_CONSENT_REGISTRY')).toBe(true);
    });

    it('LOAN_OFFICER is strictly FORBIDDEN from credit sanctioning, underwriting rejection, and disbursements', () => {
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'APPLICATIONS_REJECT')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'UNDERWRITING_VIEW_BUREAU')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'UNDERWRITING_RUN_AI_ASSIST')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'DISBURSEMENTS_APPROVE_MAKER_CHECKER')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
    });

    it('LOAN_OFFICER is strictly FORBIDDEN from debt settlement, configuration, and user management', () => {
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'COLLECTIONS_SETTLE_LOAN')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'AUDIT_EXPORT_EVIDENCE_PACKAGE')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficerUser, 'TENANT_ASSIGN_ROLES')).toBe(false);
    });
  });

  describe('2. Segregation of Duties (SoD) Enforcement', () => {
    it('should detect SoD conflict between Credit Sanction and Fund Transfer Execution (SOD_SANCTION_DISBURSER)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_SANCTION_DISBURSER')).toBe(true);
    });

    it('should detect SoD conflict between Disbursement Maker and Checker (SOD_MAKER_CHECKER_PAYOUT)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_MAKER_CHECKER_PAYOUT')).toBe(true);
    });

    it('should detect SoD conflict between Underwriter and Debt Settlement (SOD_UNDERWRITER_SETTLEMENT)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'COLLECTIONS_SETTLE_LOAN',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_UNDERWRITER_SETTLEMENT')).toBe(true);
    });
  });

  describe('3. Application State Transition Security Constraints', () => {
    it('prevents Loan Officer from transitioning an application to APPROVED or REJECTED directly', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-1',
        applicationNo: 'APP-1001',
        tenantId,
        status: 'SUBMITTED',
        branchId: branch1Id,
        requestedAmount: 500000,
        customer: { id: 'cust-1', branchId: branch1Id },
      } as any);

      // Loan Officer attempting APPROVED transition must throw ForbiddenError
      await expect(
        transition(
          'app-test-1',
          'APPROVED',
          loanOfficerUser.id,
          'Attempted self-approval',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);

      // Loan Officer attempting REJECTED transition must throw ForbiddenError
      await expect(
        transition(
          'app-test-1',
          'REJECTED',
          loanOfficerUser.id,
          'Attempted rejection',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('prevents Loan Officer from transitioning application from another branch', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-mumbai',
        applicationNo: 'APP-2001',
        tenantId,
        status: 'DRAFT',
        branchId: branch2Id, // Mumbai branch
        requestedAmount: 300000,
        customer: { id: 'cust-2', branchId: branch2Id }, // Mumbai customer
      } as any);

      // Delhi Loan Officer attempting transition on Mumbai application must throw ForbiddenError
      await expect(
        transition(
          'app-test-mumbai',
          'SUBMITTED',
          loanOfficerUser.id,
          'Submitting loan',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });

    it('prevents Loan Officer from accessing or transitioning application across different institutions (Tenants)', async () => {
      const findUniqueSpy = vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-test-apex',
        applicationNo: 'APP-APEX-001',
        tenantId: 'tenant-apex-nbfc',
        status: 'DRAFT',
        branchId: branch1Id,
        requestedAmount: 400000,
        customer: { id: 'cust-apex-1', branchId: branch1Id },
      } as any);

      await expect(
        transition(
          'app-test-apex',
          'SUBMITTED',
          loanOfficerUser.id,
          'Submitting cross tenant loan',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);

      findUniqueSpy.mockRestore();
    });
  });

  describe('4. AI Copilot Context Boundary Enforcement', () => {
    it('scopes entity queries by tenantId and branchId for Loan Officer', async () => {
      const findFirstLoanSpy = vi.spyOn(prisma.loan, 'findFirst').mockResolvedValue(null);
      const findFirstAppSpy = vi.spyOn(prisma.loanApplication, 'findFirst').mockResolvedValue(null);
      const findFirstCustSpy = vi.spyOn(prisma.customer, 'findFirst').mockResolvedValue(null);
      const findManyLoansSpy = vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      const findManyAppsSpy = vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([]);
      const findManySubsSpy = vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);
      const findManyCasesSpy = vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([]);

      await buildAuthorizedContext(
        loanOfficerUser,
        'Give me attention items and details for LN-1001, APP-2001, CUST-3001'
      );

      // Verify Loan query was scoped to tenantId and branchId
      expect(findFirstLoanSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId: branch1Id,
          }),
        })
      );

      // Verify Application query was scoped to tenantId and branchId
      expect(findFirstAppSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId: branch1Id,
          }),
        })
      );

      // Verify Customer query was scoped to tenantId and branchId
      expect(findFirstCustSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId: branch1Id,
          }),
        })
      );

      // Verify Overdue Loans queue was scoped to tenantId and branchId
      expect(findManyLoansSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId: branch1Id,
          }),
        })
      );

      // Verify Pending Underwriting queue was scoped to tenantId and branchId
      expect(findManyAppsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId: branch1Id,
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

    it('does NOT apply branch filter to global Super Admin in AI copilot context', async () => {
      const superAdminUser = {
        id: 'usr-super-1',
        email: 'superadmin@adyapan.com',
        roles: ['SUPER_ADMIN'],
        tenantId,
      };

      const findFirstLoanSpy = vi.spyOn(prisma.loan, 'findFirst').mockResolvedValue(null);
      const findManyLoansSpy = vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      const findManyAppsSpy = vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([]);
      const findManySubsSpy = vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);
      const findManyCasesSpy = vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([]);

      await buildAuthorizedContext(
        superAdminUser,
        'Show all pending queues across the system'
      );

      // Super Admin should not have branchId filter in queue query
      expect(findManyLoansSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            branchId: expect.anything(),
          }),
        })
      );

      findFirstLoanSpy.mockRestore();
      findManyLoansSpy.mockRestore();
      findManyAppsSpy.mockRestore();
      findManySubsSpy.mockRestore();
      findManyCasesSpy.mockRestore();
    });
  });
});
