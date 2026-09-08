import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from 'decimal.js';
import { rolePermissionService } from './role-permission.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import {
  getCollectionDashboard,
  listCollectionCases,
  getCollectionCaseDetail,
  logCollectionActivity,
  recordPromiseToPay,
  syncOverduePtps,
} from '../collections/collection.service';
import { submitUnderwritingDecision } from '../underwriting/underwriting.service';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { restructureLoan, executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { getLoanDetail, listLoans } from '../loans/loan.service';
import { getCustomer, listCustomers } from '../customer/customer.service';
import { listPaymentSubmissions } from '../payments/payment-submission.service';
import { buildAuthorizedContext } from '../ai/copilot.service';
import { prisma } from '../../config/prisma';

describe('Collection Officer RBAC, Multi-Tenant & Branch Isolation, Financial SoD, and Workflow Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const crossTenantId = 'tenant-apex-nbfc';
  const branchId = 'branch-delhi-01';
  const crossBranchId = 'branch-mumbai-02';

  const collectionOfficer = {
    id: 'usr-co-1',
    email: 'collections@adyapan.com',
    roles: ['COLLECTION_OFFICER'],
    tenantId,
    branchId,
  };

  const crossBranchCollectionOfficer = {
    id: 'usr-co-branch2',
    email: 'mumbai.co@adyapan.com',
    roles: ['COLLECTION_OFFICER'],
    tenantId,
    branchId: crossBranchId,
  };

  const crossTenantCollectionOfficer = {
    id: 'usr-co-cross',
    email: 'cross.co@apex.com',
    roles: ['COLLECTION_OFFICER'],
    tenantId: crossTenantId,
    branchId: 'branch-apex-01',
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

  // =========================================================================
  // 1. GRANULAR PERMISSION CATALOG & RBAC BOUNDARIES
  // =========================================================================
  describe('1. Granular Permission Catalog & RBAC Boundaries', () => {
    it('COLLECTION_OFFICER template has valid collection permissions and BRANCH scope', () => {
      expect(rolePermissionService.hasPermission(collectionOfficer, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'COLLECTIONS_VIEW_DPD')).toBe(true);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'COLLECTIONS_RECORD_PTP')).toBe(true);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'COLLECTIONS_INITIATE_RECOVERY')).toBe(true);

      const template = rolePermissionService.getRole(tenantId, 'COLLECTION_OFFICER');
      expect(template?.scope).toBe('BRANCH');
    });

    it('COLLECTION_OFFICER does NOT have COLLECTIONS_WAIVE_PENALTY (removed until formal Maker-Checker exists)', () => {
      expect(rolePermissionService.hasPermission(collectionOfficer, 'COLLECTIONS_WAIVE_PENALTY')).toBe(false);
    });

    it('COLLECTION_OFFICER is strictly FORBIDDEN from credit sanctioning and underwriting decisions', () => {
      expect(rolePermissionService.hasPermission(collectionOfficer, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'APPLICATIONS_REJECT')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(false);
    });

    it('COLLECTION_OFFICER is strictly FORBIDDEN from disbursements and treasury operations', () => {
      expect(rolePermissionService.hasPermission(collectionOfficer, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'DISBURSEMENTS_APPROVE_MAKER_CHECKER')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'DISBURSEMENTS_RECONCILE')).toBe(false);
    });

    it('COLLECTION_OFFICER is strictly FORBIDDEN from tenant, user, role, and policy administration', () => {
      expect(rolePermissionService.hasPermission(collectionOfficer, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'TENANT_ASSIGN_ROLES')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'TENANT_VIEW_OPERATIONS_CENTER')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'PRIVACY_PURGE_PII')).toBe(false);
      expect(rolePermissionService.hasPermission(collectionOfficer, 'AUDIT_EXPORT_EVIDENCE_PACKAGE')).toBe(false);
    });

    it('COLLECTION_OFFICER role has ZERO Segregation of Duties (SoD) conflicts', () => {
      const role = rolePermissionService.getRole(tenantId, 'COLLECTION_OFFICER');
      const sodCheck = rolePermissionService.checkSodConflicts(role.permissions);
      expect(sodCheck.hasConflict).toBe(false);
      expect(sodCheck.conflicts).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. MULTI-TENANT ISOLATION IN COLLECTIONS
  // =========================================================================
  describe('2. Multi-Tenant Isolation in Collections', () => {
    it('Collection Officer cannot view another tenant collection dashboard (filters by tenantId)', async () => {
      vi.spyOn(prisma.collectionCase, 'findMany').mockImplementation((async (args: any) => {
        if (args?.where?.loan?.tenantId === crossTenantId) {
          return [
            {
              id: 'case-cross-1',
              caseNo: 'CASE-001',
              agingBucket: '31-60',
              overdueAmount: new Decimal(15000),
              loan: { loanNo: 'LN-CROSS', principal: 100000, tenantId: crossTenantId, branchId: 'branch-apex-01' },
              customer: { firstName: 'Cross', lastName: 'Tenant', mobile: '9999999999', customerCode: 'CUST-001' },
            } as any,
          ];
        }
        return [];
      }) as any);

      vi.spyOn(prisma.promiseToPay, 'count').mockResolvedValue(0);

      const dashboard = await getCollectionDashboard(collectionOfficer);
      expect(dashboard.summary.activeCases).toBe(0);
      expect(dashboard.summary.totalOverdueAmount).toBe('0.00');
    });

    it('Collection Officer cannot view another tenant collection case list', async () => {
      const findManySpy = vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([]);
      const countSpy = vi.spyOn(prisma.collectionCase, 'count').mockResolvedValue(0);

      await listCollectionCases({ page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' }, undefined, undefined, collectionOfficer);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loan: expect.objectContaining({
              tenantId,
              branchId,
            }),
          }),
        })
      );
    });

    it('Collection Officer viewing another tenant case detail throws ForbiddenError (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-cross-1',
        loan: { tenantId: crossTenantId, branchId: 'branch-apex-01', schedule: [] },
        customer: { addresses: [], employmentDetails: [] },
        activities: [],
        promises: [],
      } as any);

      await expect(getCollectionCaseDetail('case-cross-1', collectionOfficer)).rejects.toThrow(ForbiddenError);
      await expect(getCollectionCaseDetail('case-cross-1', collectionOfficer)).rejects.toThrow(
        /Access forbidden: Collection case belongs to another institution/i
      );
    });

    it('Collection Officer creating activity on another tenant case throws ForbiddenError (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-cross-1',
        loan: { tenantId: crossTenantId, branchId: 'branch-apex-01' },
      } as any);

      await expect(
        logCollectionActivity(
          {
            caseId: 'case-cross-1',
            activityType: 'CALL',
            outcome: 'PROMISE_TO_PAY',
            notes: 'Attempted cross tenant call',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer creating PTP on another tenant case throws ForbiddenError (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-cross-1',
        loan: { tenantId: crossTenantId, branchId: 'branch-apex-01' },
      } as any);

      await expect(
        recordPromiseToPay(
          {
            caseId: 'case-cross-1',
            promisedAmount: 5000,
            promisedDate: new Date('2026-10-01'),
            paymentMode: 'UPI',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // =========================================================================
  // 3. BRANCH ISOLATION IN COLLECTIONS
  // =========================================================================
  describe('3. Branch Isolation in Collections', () => {
    it('Collection Officer cannot view another branch collection dashboard', async () => {
      vi.spyOn(prisma.collectionCase, 'findMany').mockImplementation((async (args: any) => {
        if (args?.where?.loan?.branchId === crossBranchId) {
          return [
            {
              id: 'case-mumbai-1',
              agingBucket: '0-30',
              overdueAmount: new Decimal(5000),
              loan: { tenantId, branchId: crossBranchId },
              customer: { firstName: 'Mumbai', lastName: 'Borrower' },
            } as any,
          ];
        }
        return [];
      }) as any);

      vi.spyOn(prisma.promiseToPay, 'count').mockResolvedValue(0);

      const dashboard = await getCollectionDashboard(collectionOfficer);
      expect(dashboard.summary.activeCases).toBe(0);
    });

    it('Collection Officer cannot view another branch collection case detail (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-mumbai-1',
        loan: { tenantId, branchId: crossBranchId, schedule: [] },
        customer: { addresses: [], employmentDetails: [] },
        activities: [],
        promises: [],
      } as any);

      await expect(getCollectionCaseDetail('case-mumbai-1', collectionOfficer)).rejects.toThrow(ForbiddenError);
      await expect(getCollectionCaseDetail('case-mumbai-1', collectionOfficer)).rejects.toThrow(
        /Access forbidden: Collection case belongs to a different branch/i
      );
    });

    it('Collection Officer cannot view another branch loan detail (403)', async () => {
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue({
        id: 'loan-mumbai-1',
        tenantId,
        branchId: crossBranchId,
        customer: { bankAccounts: [], addresses: [] },
        schedule: [],
        payments: [],
      } as any);

      await expect(getLoanDetail('loan-mumbai-1', collectionOfficer)).rejects.toThrow(ForbiddenError);
      await expect(getLoanDetail('loan-mumbai-1', collectionOfficer)).rejects.toThrow(
        /Access forbidden: Loan belongs to a different branch/i
      );
    });

    it('Collection Officer cannot view another branch customer profile (403)', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
        id: 'cust-mumbai-1',
        tenantId,
        branchId: crossBranchId,
        loans: [],
        payments: [],
        addresses: [],
      } as any);

      await expect(getCustomer('cust-mumbai-1', collectionOfficer)).rejects.toThrow(ForbiddenError);
      await expect(getCustomer('cust-mumbai-1', collectionOfficer)).rejects.toThrow(
        /Access forbidden: Customer belongs to a different branch/i
      );
    });

    it('Collection Officer cannot log activity on another branch collection case (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-mumbai-1',
        loan: { tenantId, branchId: crossBranchId },
      } as any);

      await expect(
        logCollectionActivity(
          {
            caseId: 'case-mumbai-1',
            activityType: 'VISIT',
            outcome: 'CONTACTED',
            notes: 'Cross-branch field attempt',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer cannot record PTP on another branch collection case (403)', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-mumbai-1',
        loan: { tenantId, branchId: crossBranchId },
      } as any);

      await expect(
        recordPromiseToPay(
          {
            caseId: 'case-mumbai-1',
            promisedAmount: 8000,
            promisedDate: new Date('2026-10-10'),
            paymentMode: 'CASH',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // =========================================================================
  // 4. FINANCIAL SEGREGATION OF DUTIES (SoD) & FORBIDDEN MUTATIONS
  // =========================================================================
  describe('4. Financial Segregation of Duties (SoD) & Forbidden Mutations', () => {
    it('Collection Officer cannot restructure loan (throws ForbiddenError 403)', async () => {
      await expect(
        restructureLoan(
          {
            loanId: 'loan-1',
            newTenureMonths: 24,
            newInterestRate: 12.0,
            moratoriumMonths: 0,
            reason: 'Delinquency restructuring proposal',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer cannot execute debt settlement / OTS (throws ForbiddenError 403)', async () => {
      await expect(
        executeSettlement(
          {
            loanId: 'loan-1',
            settlementAmount: 50000,
            reason: 'Borrower hardship OTS proposal',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer cannot close loan and issue NOC (throws ForbiddenError 403)', async () => {
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue({
        id: 'loan-1',
        tenantId,
        branchId,
        outstandingPrincipal: 0,
        outstandingInterest: 0,
        outstandingFees: 0,
        schedule: [],
      } as any);

      await expect(
        closeLoanAndIssueNoc(
          {
            loanId: 'loan-1',
            closureType: 'NORMAL_MATURITY',
            remarks: 'Attempted collector closure',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer cannot execute loan disbursements (throws ForbiddenError 403)', async () => {
      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue({
        id: 'app-1',
        tenantId,
        status: 'APPROVED',
      } as any);

      await expect(
        executeDisbursement(
          {
            applicationId: 'app-1',
            disbursementMethod: 'IMPS',
            referenceNumber: 'IMPS-COL-001',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Collection Officer cannot submit underwriting decisions (throws ForbiddenError 403)', async () => {
      await expect(
        submitUnderwritingDecision(
          'app-1',
          {
            decision: 'APPROVE',
            reason: 'Attempted collector approval',
          },
          collectionOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // =========================================================================
  // 5. LEGITIMATE COLLECTION CAPABILITIES & WORKFLOWS
  // =========================================================================
  describe('5. Legitimate Collection Capabilities & Workflows', () => {
    it('Collection Officer can view own branch delinquency dashboard with aging buckets', async () => {
      vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([
        {
          id: 'case-delhi-1',
          caseNo: 'CASE-D-01',
          agingBucket: '31-60',
          overdueAmount: new Decimal(12500),
          loan: { loanNo: 'LN-DEL-01', principal: 150000, tenantId, branchId },
          customer: { firstName: 'Ravi', lastName: 'Kumar', mobile: '9811002233', customerCode: 'CUST-DEL-01' },
        } as any,
      ]);
      vi.spyOn(prisma.promiseToPay, 'count').mockResolvedValue(1);

      const dashboard = await getCollectionDashboard(collectionOfficer);
      expect(dashboard.summary.activeCases).toBe(1);
      expect(dashboard.summary.pendingPtps).toBe(1);
      expect(dashboard.agingBuckets).toBeDefined();
    });

    it('Collection Officer can list own branch collection cases with DPD sorting', async () => {
      vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([
        {
          id: 'case-delhi-1',
          caseNo: 'CASE-D-01',
          loan: { loanNo: 'LN-DEL-01', emiAmount: { toFixed: () => '4500.00' }, nextDueDate: new Date() },
          customer: { firstName: 'Ravi', lastName: 'Kumar', customerCode: 'CUST-01', mobile: '9811002233', city: 'Delhi' },
          dpd: 45,
          agingBucket: '31-60',
          overdueAmount: { toFixed: () => '9000.00' },
          status: 'OPEN',
          priority: 'HIGH',
          _count: { activities: 2, promises: 1 },
          createdAt: new Date(),
        } as any,
      ]);
      vi.spyOn(prisma.collectionCase, 'count').mockResolvedValue(1);

      const result = await listCollectionCases(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        '31-60',
        'OPEN',
        collectionOfficer
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].caseNo).toBe('CASE-D-01');
      expect(result.data[0].dpd).toBe(45);
    });

    it('Collection Officer can view own branch collection case detail', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-delhi-1',
        caseNo: 'CASE-D-01',
        loan: {
          id: 'loan-delhi-1',
          loanNo: 'LN-DEL-01',
          tenantId,
          branchId,
          product: { name: 'Personal Loan' },
          schedule: [{ id: 'item-1', emiNumber: 1, status: 'OVERDUE' }],
        },
        customer: {
          id: 'cust-delhi-1',
          firstName: 'Ravi',
          lastName: 'Kumar',
          addresses: [{ addressLine: '123 Connaught Place', city: 'Delhi' }],
          employmentDetails: [{ employerName: 'Tech Corp' }],
        },
        activities: [],
        promises: [],
      } as any);

      const colCase = await getCollectionCaseDetail('case-delhi-1', collectionOfficer);
      expect(colCase.id).toBe('case-delhi-1');
      expect(colCase.loan.loanNo).toBe('LN-DEL-01');
    });

    it('Collection Officer can log follow-up activity on own branch case with audit event', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-delhi-1',
        loan: { tenantId, branchId },
      } as any);

      vi.spyOn(prisma.collectionActivity, 'create').mockResolvedValue({
        id: 'act-1',
        caseId: 'case-delhi-1',
        activityType: 'CALL',
        outcome: 'PROMISE_TO_PAY',
        notes: 'Borrower committed to pay via UPI by Friday',
        nextFollowUpDate: new Date('2026-09-15'),
        performedBy: collectionOfficer.email,
        createdAt: new Date(),
      } as any);

      const activity = await logCollectionActivity(
        {
          caseId: 'case-delhi-1',
          activityType: 'CALL',
          outcome: 'PROMISE_TO_PAY',
          notes: 'Borrower committed to pay via UPI by Friday',
          nextFollowUpDate: new Date('2026-09-15'),
        },
        collectionOfficer
      );

      expect(activity.id).toBe('act-1');
      expect(activity.activityType).toBe('CALL');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('Collection Officer can record Promise-to-Pay (PTP) on own branch case', async () => {
      vi.spyOn(prisma.collectionCase, 'findUnique').mockResolvedValue({
        id: 'case-delhi-1',
        loan: { tenantId, branchId },
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          promiseToPay: {
            create: vi.fn().mockResolvedValue({
              id: 'ptp-1',
              caseId: 'case-delhi-1',
              promisedAmount: 9000,
              promisedDate: new Date('2026-09-20'),
              paymentMode: 'UPI',
              status: 'PENDING',
              recordedBy: collectionOfficer.email,
            }),
          },
          collectionCase: {
            update: vi.fn().mockResolvedValue({ id: 'case-delhi-1', status: 'PROMISED' }),
          },
          collectionActivity: {
            create: vi.fn().mockResolvedValue({ id: 'act-ptp-1' }),
          },
        };
        return callback(txMock);
      });

      const ptp = await recordPromiseToPay(
        {
          caseId: 'case-delhi-1',
          promisedAmount: 9000,
          promisedDate: new Date('2026-09-20'),
          paymentMode: 'UPI',
        },
        collectionOfficer
      );

      expect(ptp.id).toBe('ptp-1');
      expect(ptp.status).toBe('PENDING');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('Collection Officer can view own branch payment submissions (read-only)', async () => {
      const findManySpy = vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.paymentSubmission, 'count').mockResolvedValue(0);

      await listPaymentSubmissions(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        'PENDING_VERIFICATION',
        undefined,
        undefined,
        undefined,
        collectionOfficer
      );

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loan: expect.objectContaining({
              tenantId,
              branchId,
            }),
          }),
        })
      );
    });

    it('Collection Officer can view own branch customer list (read-only)', async () => {
      const findManySpy = vi.spyOn(prisma.customer, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.customer, 'count').mockResolvedValue(0);

      await listCustomers(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        undefined,
        undefined,
        collectionOfficer
      );

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId,
          }),
        })
      );
    });

    it('Collection Officer can view own branch loan list (read-only)', async () => {
      const findManySpy = vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.loan, 'count').mockResolvedValue(0);

      await listLoans(
        { page: 1, pageSize: 10, skip: 0, take: 10, sortDir: 'desc' },
        'OVERDUE',
        undefined,
        undefined,
        undefined,
        collectionOfficer
      );

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId,
          }),
        })
      );
    });
  });

  // =========================================================================
  // 6. PTP LIFECYCLE & AUTOMATIC TRANSITIONS
  // =========================================================================
  describe('6. PTP Lifecycle & Automatic Transitions', () => {
    it('syncOverduePtps marks expired pending PTPs as BROKEN and updates case status', async () => {
      vi.spyOn(prisma.promiseToPay, 'findMany').mockResolvedValue([
        { id: 'ptp-expired-1', caseId: 'case-1' } as any,
      ]);
      const updateManySpy = vi.spyOn(prisma.promiseToPay, 'updateMany').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma.promiseToPay, 'count').mockResolvedValue(0); // No remaining pending PTPs
      const caseUpdateSpy = vi.spyOn(prisma.collectionCase, 'update').mockResolvedValue({ id: 'case-1' } as any);

      const result = await syncOverduePtps(tenantId, branchId);

      expect(result.brokenCount).toBe(1);
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['ptp-expired-1'] } },
          data: { status: 'BROKEN' },
        })
      );
      expect(caseUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'case-1' },
          data: { status: 'IN_PROGRESS' },
        })
      );
    });
  });

  // =========================================================================
  // 7. AI COPILOT BRANCH & TENANT SCOPING
  // =========================================================================
  describe('7. AI Copilot Branch & Tenant Scoping', () => {
    it('AI Copilot context query is strictly scoped by authenticated tenantId AND branchId for COLLECTION_OFFICER', async () => {
      const loanFindSpy = vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      const colCaseFindSpy = vi.spyOn(prisma.collectionCase, 'findMany').mockResolvedValue([]);
      const subFindSpy = vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);

      await buildAuthorizedContext(collectionOfficer, 'What collection cases need attention today?');

      expect(loanFindSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            branchId,
          }),
        })
      );

      expect(colCaseFindSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loan: expect.objectContaining({
              tenantId,
              branchId,
            }),
          }),
        })
      );
    });
  });
});
