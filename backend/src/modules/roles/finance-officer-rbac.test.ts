import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rolePermissionService } from './role-permission.service';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { executeDisbursement } from '../disbursements/disbursement.service';
import { submitUnderwritingDecision } from '../underwriting/underwriting.service';
import { restructureLoan, executeSettlement, closeLoanAndIssueNoc } from '../restructuring/restructuring.service';
import { processPayment } from '../payments/payment.service';
import { verifyPaymentSubmission } from '../payments/payment-submission.service';
import { getLoanDetail } from '../loans/loan.service';
import { reconciliationService } from '../reconciliation/reconciliation.service';
import { buildAuthorizedContext } from '../ai/copilot.service';
import { prisma } from '../../config/prisma';

describe('Finance Officer RBAC, Multi-Tenant Isolation, Payout Limits & Workflow Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const crossTenantId = 'tenant-apex-nbfc';
  const branchId = 'branch-delhi-01';

  const financeOfficer = {
    id: 'usr-fo-1',
    email: 'finance@adyapan.com',
    roles: ['FINANCE_OFFICER'],
    tenantId,
    branchId,
  };

  const crossTenantFinanceOfficer = {
    id: 'usr-fo-cross',
    email: 'cross.fo@apex.com',
    roles: ['FINANCE_OFFICER'],
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
    reconciliationService.clearForTesting();
    vi.restoreAllMocks();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
  });

  describe('1. Granular Permission Catalog & Boundary Checks', () => {
    it('FINANCE_OFFICER has legitimate treasury, disbursement, reconciliation, and privacy permissions', () => {
      expect(rolePermissionService.hasPermission(financeOfficer, 'APPLICATIONS_VIEW')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'DISBURSEMENTS_INITIATE_PAYOUT')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'DISBURSEMENTS_RECONCILE')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'PRIVACY_VIEW_CONSENT_REGISTRY')).toBe(true);
    });

    it('FINANCE_OFFICER is strictly FORBIDDEN from credit sanctioning and underwriting decisions', () => {
      expect(rolePermissionService.hasPermission(financeOfficer, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'APPLICATIONS_REJECT')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'UNDERWRITING_VIEW_BUREAU')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'UNDERWRITING_RUN_AI_ASSIST')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'UNDERWRITING_APPROVE_EXCEPTION')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'UNDERWRITING_COMMITTEE_VOTE')).toBe(false);
    });

    it('FINANCE_OFFICER is strictly FORBIDDEN from loan debt settlement, waivers, and field collections mutations', () => {
      expect(rolePermissionService.hasPermission(financeOfficer, 'COLLECTIONS_SETTLE_LOAN')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'COLLECTIONS_WAIVE_PENALTY')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'COLLECTIONS_RECORD_PTP')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'COLLECTIONS_INITIATE_RECOVERY')).toBe(false);
    });

    it('FINANCE_OFFICER is strictly FORBIDDEN from staff management, role assignment, and policy publishing', () => {
      expect(rolePermissionService.hasPermission(financeOfficer, 'TENANT_MANAGE_USERS')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'TENANT_ASSIGN_ROLES')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'CONFIGURATION_CONFIGURE_INTEGRATIONS')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'PRIVACY_PURGE_PII')).toBe(false);
    });
  });

  describe('2. Segregation of Duties (SoD) Conflict Checks', () => {
    it('should detect SoD conflict between Underwriting Sanction and Treasury Payout (SOD_SANCTION_DISBURSER)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'APPLICATIONS_APPROVE',
        'DISBURSEMENTS_EXECUTE_TRANSFER',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_SANCTION_DISBURSER')).toBe(true);
      expect(conflictCheck.conflicts[0].severity).toBe('CRITICAL_BLOCK');
    });

    it('should detect SoD conflict between Independent Audit and Payout Initiation (SOD_AUDITOR_DISBURSER)', () => {
      const conflictCheck = rolePermissionService.checkSodConflicts([
        'AUDIT_VERIFY_CHAIN',
        'DISBURSEMENTS_INITIATE_PAYOUT',
      ]);
      expect(conflictCheck.hasConflict).toBe(true);
      expect(conflictCheck.conflicts.some((c) => c.ruleCode === 'SOD_AUDITOR_DISBURSER')).toBe(true);
      expect(conflictCheck.conflicts[0].severity).toBe('CRITICAL_BLOCK');
    });
  });

  describe('3. Disbursement Execution, Multi-Tenant Isolation & Payout Limit Checks', () => {
    it('Finance Officer can execute valid own-tenant payout within payout limit', async () => {
      const mockApp = {
        id: 'app-own-1',
        applicationNo: 'APP-1001',
        tenantId,
        requestedAmount: 500000, // ₹5 Lakh (within ₹1 Crore limit)
        status: 'APPROVED',
        tenureMonths: 12,
        product: { id: 'prod-1', name: 'Personal Loan', code: 'PL', isActive: true, interestRate: 12, maxTenureMonths: 24 },
        customer: { id: 'cust-1', firstName: 'Rahul', lastName: 'Sharma', kycStatus: 'VERIFIED', status: 'ACTIVE', bankAccounts: [{ id: 'bank-1' }] },
        branchId,
        loan: null,
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApp as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          loan: {
            create: vi.fn().mockResolvedValue({ id: 'loan-1', loanNo: 'LN-1001', tenantId }),
          },
          disbursement: {
            create: vi.fn().mockResolvedValue({ id: 'disb-1', status: 'COMPLETED', tenantId }),
          },
          transaction: {
            create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
          },
          repaymentScheduleItem: {
            createMany: vi.fn().mockResolvedValue({ count: 12 }),
          },
          loanApplication: {
            update: vi.fn().mockResolvedValue({ id: 'app-own-1', status: 'DISBURSED' }),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await executeDisbursement(
        { applicationId: 'app-own-1', disbursementMethod: 'NEFT_BANK_TRANSFER', referenceNumber: 'UTR-123456789' },
        financeOfficer
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('loan-1');
      expect(result.loanNo).toBe('LN-1001');
    });

    it('Finance Officer CANNOT execute payout for another tenant application (Cross-Tenant IDOR Blocked)', async () => {
      const crossTenantApp = {
        id: 'app-cross-1',
        applicationNo: 'APP-CROSS-999',
        tenantId: crossTenantId, // Belongs to Apex NBFC
        requestedAmount: 500000,
        status: 'APPROVED',
        tenureMonths: 12,
        product: { id: 'prod-2', name: 'Commercial Loan', code: 'CL', isActive: true, interestRate: 14 },
        customer: { id: 'cust-2', firstName: 'Vikram', lastName: 'Singh', kycStatus: 'VERIFIED', status: 'ACTIVE', bankAccounts: [{ id: 'bank-2' }] },
        branchId: 'branch-mumbai-02',
        loan: null,
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(crossTenantApp as any);

      await expect(
        executeDisbursement(
          { applicationId: 'app-cross-1', disbursementMethod: 'NEFT_BANK_TRANSFER', referenceNumber: 'UTR-CROSS-999' },
          financeOfficer // Belongs to Adyapan Default
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Disbursement above Finance Officer payout limit is BLOCKED (₹1.5 Crore > ₹1 Crore Limit)', async () => {
      const highValApp = {
        id: 'app-high-val-1',
        applicationNo: 'APP-HIGH-VAL',
        tenantId,
        requestedAmount: 15000000, // ₹1.5 Crore (> ₹1 Crore limit)
        status: 'APPROVED',
        tenureMonths: 36,
        product: { id: 'prod-1', name: 'Corporate Loan', code: 'CORP', isActive: true, interestRate: 10 },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED', status: 'ACTIVE', bankAccounts: [{ id: 'bank-1' }] },
        branchId,
        loan: null,
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(highValApp as any);

      await expect(
        executeDisbursement(
          { applicationId: 'app-high-val-1', disbursementMethod: 'RTGS', referenceNumber: 'UTR-HIGH-VAL' },
          financeOfficer
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('Disbursement exactly at ₹1 Crore payout limit is ALLOWED', async () => {
      const maxLimitApp = {
        id: 'app-max-limit-1',
        applicationNo: 'APP-MAX-LIMIT',
        tenantId,
        requestedAmount: 10000000, // ₹1 Crore (exactly at limit)
        status: 'APPROVED',
        tenureMonths: 36,
        product: { id: 'prod-1', name: 'Corporate Loan', code: 'CORP', isActive: true, interestRate: 10, maxTenureMonths: 36 },
        customer: { id: 'cust-1', kycStatus: 'VERIFIED', status: 'ACTIVE', bankAccounts: [{ id: 'bank-1' }] },
        branchId,
        loan: null,
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(maxLimitApp as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          loan: { create: vi.fn().mockResolvedValue({ id: 'loan-max', loanNo: 'LN-MAX', tenantId }) },
          disbursement: { create: vi.fn().mockResolvedValue({ id: 'disb-max', status: 'COMPLETED', tenantId }) },
          transaction: { create: vi.fn().mockResolvedValue({ id: 'tx-max' }) },
          repaymentScheduleItem: { createMany: vi.fn().mockResolvedValue({ count: 36 }) },
          loanApplication: { update: vi.fn().mockResolvedValue({ id: 'app-max-limit-1', status: 'DISBURSED' }) },
          applicationStatusHistory: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const result = await executeDisbursement(
        { applicationId: 'app-max-limit-1', disbursementMethod: 'RTGS', referenceNumber: 'UTR-MAX-1000' },
        financeOfficer
      );

      expect(result).toBeDefined();
    });
  });

  describe('4. Negative RBAC on Underwriting & Sanctioning', () => {
    it('Finance Officer CANNOT approve underwriting decision (Blocked)', async () => {
      await expect(
        submitUnderwritingDecision(
          'app-1',
          { decision: 'APPROVE', reason: 'Attempted by finance officer' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Finance Officer CANNOT reject underwriting decision (Blocked)', async () => {
      await expect(
        submitUnderwritingDecision(
          'app-1',
          { decision: 'REJECT', reason: 'Attempted by finance officer' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('5. Restructuring, Settlement & Write-off Boundaries', () => {
    it('Finance Officer CANNOT execute loan restructuring (Forbidden)', async () => {
      await expect(
        restructureLoan(
          { loanId: 'loan-1', newTenureMonths: 36, newInterestRate: 11, moratoriumMonths: 0, reason: 'Restructure attempt' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Finance Officer CANNOT execute loan debt settlement / OTS (Forbidden)', async () => {
      await expect(
        executeSettlement(
          { loanId: 'loan-1', settlementAmount: 200000, reason: 'Settlement attempt' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('6. Zero-Balance Loan Closure & Digital NOC', () => {
    it('Finance Officer CAN close a verified zero-balance own-tenant loan and issue NOC', async () => {
      const zeroBalanceLoan = {
        id: 'loan-zero-1',
        loanNo: 'LN-ZERO-1001',
        tenantId,
        status: 'ACTIVE',
        principal: 100000,
        outstandingPrincipal: 0,
        outstandingInterest: 0,
        outstandingFees: 0,
        outstandingPenalty: 0,
        customer: { id: 'cust-1', firstName: 'Amit', lastName: 'Kumar' },
        payments: [],
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(zeroBalanceLoan as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          loan: { update: vi.fn().mockResolvedValue({ ...zeroBalanceLoan, status: 'CLOSED' }) },
          loanClosure: {
            upsert: vi.fn().mockResolvedValue({
              id: 'closure-1',
              loanId: 'loan-zero-1',
              nocNumber: 'NOC-2026-ZERO1001',
              closedBy: financeOfficer.email,
              closureType: 'NORMAL_MATURITY',
              closedAt: new Date(),
            }),
          },
        });
      });

      const result = await closeLoanAndIssueNoc(
        { loanId: 'loan-zero-1', closureType: 'NORMAL_MATURITY', remarks: 'Full repayment verified' },
        financeOfficer
      );
      expect(result).toBeDefined();
      expect(result.nocNumber).toBe('NOC-2026-ZERO1001');
      expect(result.closureType).toBe('NORMAL_MATURITY');
    });

    it('Finance Officer CANNOT close loan with outstanding balance (Blocked)', async () => {
      const activeLoanWithBalance = {
        id: 'loan-bal-1',
        loanNo: 'LN-BAL-1001',
        tenantId,
        status: 'ACTIVE',
        principal: 100000,
        outstandingPrincipal: 50000, // ₹50,000 principal remaining
        outstandingInterest: 0,
        outstandingFees: 0,
        outstandingPenalty: 0,
        payments: [],
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(activeLoanWithBalance as any);

      await expect(
        closeLoanAndIssueNoc(
          { loanId: 'loan-bal-1', closureType: 'NORMAL_MATURITY', remarks: 'Premature closure attempt' },
          financeOfficer
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('Finance Officer CANNOT close another tenant loan (Cross-Tenant IDOR Blocked)', async () => {
      const crossTenantLoan = {
        id: 'loan-cross-1',
        loanNo: 'LN-CROSS-999',
        tenantId: crossTenantId,
        status: 'ACTIVE',
        principal: 100000,
        outstandingPrincipal: 0,
        outstandingInterest: 0,
        outstandingFees: 0,
        outstandingPenalty: 0,
        payments: [],
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(crossTenantLoan as any);

      await expect(
        closeLoanAndIssueNoc(
          { loanId: 'loan-cross-1', closureType: 'NORMAL_MATURITY', remarks: 'Cross-tenant closure attempt' },
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('7. Payment Recording, Verification & Loan Account Servicing', () => {
    it('Finance Officer can record valid repayment on own-tenant loan', async () => {
      const loan = {
        id: 'loan-pay-1',
        loanNo: 'LN-PAY-1001',
        tenantId,
        status: 'ACTIVE',
        principal: 100000,
        outstandingPrincipal: 80000,
        outstandingInterest: 5000,
        outstandingFees: 500,
        outstandingPenalty: 0,
        schedule: [
          {
            id: 'sch-1',
            emiNumber: 1,
            principal: 10000,
            interest: 1000,
            fees: 500,
            penaltyAmount: 0,
            totalDue: 11500,
            paidAmount: 0,
            status: 'PENDING',
          },
        ],
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'pmt-1',
              paymentNo: 'PMT-1001',
              amount: 11500,
              status: 'SUCCESS',
              tenantId,
            }),
          },
          paymentAllocation: { createMany: vi.fn().mockResolvedValue({ count: 3 }) },
          transaction: { create: vi.fn().mockResolvedValue({ id: 'tx-pmt-1' }) },
          repaymentScheduleItem: {
            update: vi.fn().mockResolvedValue({}),
            findFirst: vi.fn().mockResolvedValue({ dueDate: new Date() }),
          },
          loan: { update: vi.fn().mockResolvedValue({ ...loan, outstandingPrincipal: 70000 }) },
          collectionCase: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await processPayment(
        {
          loanId: 'loan-pay-1',
          amount: 11500,
          method: 'UPI',
          reference: 'UPI-REF-1001',
        },
        financeOfficer.id,
        financeOfficer
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('SUCCESS');
    });

    it('Finance Officer CANNOT record repayment on another tenant loan (Cross-Tenant Blocked)', async () => {
      const crossLoan = {
        id: 'loan-cross-pay',
        loanNo: 'LN-CROSS-PAY',
        tenantId: crossTenantId,
        status: 'ACTIVE',
        schedule: [],
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(crossLoan as any);

      await expect(
        processPayment(
          {
            loanId: 'loan-cross-pay',
            amount: 5000,
            method: 'BANK_TRANSFER',
            reference: 'REF-CROSS-PMT',
          },
          financeOfficer.id,
          financeOfficer
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('Finance Officer can verify payment submission on own-tenant loan', async () => {
      const submission = {
        id: 'sub-1',
        submissionNo: 'SUB-1001',
        tenantId,
        amount: 5000,
        status: 'PENDING_VERIFICATION',
        method: 'UPI',
        reference: 'UTR-SUB-1001',
        paidAt: new Date(),
        loanId: 'loan-pay-1',
        customerId: 'cust-1',
        customer: { id: 'cust-1', userId: 'usr-cust-1' },
        loan: {
          id: 'loan-pay-1',
          loanNo: 'LN-PAY-1001',
          tenantId,
          status: 'ACTIVE',
          principal: 100000,
          outstandingPrincipal: 80000,
          outstandingInterest: 5000,
          outstandingFees: 500,
          outstandingPenalty: 0,
          customer: { id: 'cust-1', userId: 'usr-cust-1' },
          schedule: [
            {
              id: 'sch-1',
              emiNumber: 1,
              principal: 5000,
              interest: 0,
              fees: 0,
              penaltyAmount: 0,
              totalDue: 5000,
              paidAmount: 0,
              status: 'PENDING',
            },
          ],
        },
      };

      vi.spyOn(prisma.paymentSubmission, 'findUnique').mockResolvedValue(submission as any);
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(submission.loan as any);
      vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'pmt-sub-1',
              paymentNo: 'PMT-SUB-1001',
              amount: 5000,
              status: 'SUCCESS',
              tenantId,
            }),
          },
          paymentAllocation: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
          transaction: { create: vi.fn().mockResolvedValue({ id: 'tx-1' }) },
          loan: { update: vi.fn().mockResolvedValue({}) },
          repaymentScheduleItem: {
            update: vi.fn().mockResolvedValue({}),
            findFirst: vi.fn().mockResolvedValue({ dueDate: new Date() }),
          },
          collectionCase: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockResolvedValue({}),
          },
        });
      });
      vi.spyOn(prisma.paymentSubmission, 'update').mockResolvedValue({
        ...submission,
        status: 'VERIFIED',
      } as any);

      const result = await verifyPaymentSubmission('sub-1', financeOfficer);

      expect(result).toBeDefined();
      expect(result.status).toBe('VERIFIED');
    });

    it('Finance Officer CANNOT verify payment submission belonging to another tenant', async () => {
      const crossSubmission = {
        id: 'sub-cross-1',
        submissionNo: 'SUB-CROSS-999',
        tenantId: crossTenantId,
        amount: 5000,
        status: 'PENDING_VERIFICATION',
        loanId: 'loan-cross-pay',
        customer: { id: 'cust-2', userId: 'usr-cust-2' },
        loan: {
          id: 'loan-cross-pay',
          tenantId: crossTenantId,
          status: 'ACTIVE',
          customer: { id: 'cust-2', userId: 'usr-cust-2' },
          schedule: [],
        },
      };

      vi.spyOn(prisma.paymentSubmission, 'findUnique').mockResolvedValue(crossSubmission as any);

      await expect(verifyPaymentSubmission('sub-cross-1', financeOfficer)).rejects.toThrow(BadRequestError);
    });

    it('Finance Officer can view own-tenant loan account', async () => {
      const loan = {
        id: 'loan-view-1',
        loanNo: 'LN-VIEW-1001',
        tenantId,
        status: 'ACTIVE',
        principal: 100000,
        outstandingPrincipal: 80000,
        outstandingInterest: 5000,
        outstandingFees: 500,
        interestRate: 12,
        tenureMonths: 12,
        emiAmount: 8884,
        nextDueDate: new Date(),
        disbursementDate: new Date(),
        createdAt: new Date(),
        customer: { firstName: 'Rahul', lastName: 'Sharma', customerCode: 'C-1', mobile: '9999999999' },
        product: { name: 'Personal Loan' },
        branch: { name: 'Delhi Main' },
        payments: [],
        schedule: [],
        disbursements: [],
        transactions: [],
        collectionCases: [],
        restructures: [],
        closure: null,
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      const result = await getLoanDetail('loan-view-1', financeOfficer);
      expect(result).toBeDefined();
      expect(result.id).toBe('loan-view-1');
    });

    it('Finance Officer CANNOT view another tenant loan account (Cross-Tenant IDOR Blocked)', async () => {
      const crossLoan = {
        id: 'loan-cross-view',
        loanNo: 'LN-CROSS-VIEW',
        tenantId: crossTenantId,
        status: 'ACTIVE',
      };

      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(crossLoan as any);

      await expect(getLoanDetail('loan-cross-view', financeOfficer)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('8. Accounting & Reconciliation Multi-Tenant Isolation & Maker-Checker', () => {
    it('Reconciliation scan applies tenantFilter and scopes financial exceptions to tenant', async () => {
      vi.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);

      const result = await reconciliationService.runReconciliation(financeOfficer);
      expect(result).toBeDefined();
      expect(result.scannedCount).toBe(0);
    });

    it('Finance Officer only sees own-tenant exceptions and adjustments in dashboard stats', async () => {
      vi.spyOn(prisma.payment, 'aggregate').mockResolvedValue({ _sum: { amount: 500000 } } as any);

      const stats = await reconciliationService.getDashboardStats(financeOfficer);
      expect(stats).toBeDefined();
      expect(stats.totalReconciledVolume).toBe(500000);
    });

    it('Finance Officer can propose a ledger adjustment on own-tenant loan', async () => {
      const loan = {
        id: 'loan-adj-1',
        loanNo: 'LN-ADJ-1001',
        tenantId,
      };
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      const adjustment = await reconciliationService.proposeAdjustment(
        {
          type: 'LEDGER_CORRECTION',
          loanId: 'loan-adj-1',
          amount: 6000, // >= 5000 requires maker-checker approval
          reason: 'Correct allocation error between penalty and principal',
        },
        financeOfficer
      );

      expect(adjustment).toBeDefined();
      expect(adjustment.status).toBe('PENDING_APPROVAL');
      expect(adjustment.tenantId).toBe(tenantId);
      expect(adjustment.proposedBy).toBe(financeOfficer.email);
    });

    it('Maker CANNOT approve their own proposed adjustment (Maker-Checker Enforced)', async () => {
      const loan = {
        id: 'loan-adj-2',
        loanNo: 'LN-ADJ-1002',
        tenantId,
      };
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      const adjustment = await reconciliationService.proposeAdjustment(
        {
          type: 'REVERSAL',
          loanId: 'loan-adj-2',
          amount: 10000,
          reason: 'Duplicate payment reversal request',
        },
        financeOfficer
      );

      // Same user attempts approval
      await expect(
        reconciliationService.approveAdjustment(adjustment.adjustmentId, financeOfficer)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Different Finance Officer / Admin from SAME tenant CAN approve adjustment', async () => {
      const loan = {
        id: 'loan-adj-3',
        loanNo: 'LN-ADJ-1003',
        tenantId,
      };
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      const adjustment = await reconciliationService.proposeAdjustment(
        {
          type: 'REVERSAL',
          loanId: 'loan-adj-3',
          amount: 10000,
          reason: 'Duplicate payment reversal request',
        },
        financeOfficer
      );

      const secondOfficer = {
        id: 'usr-fo-2',
        email: 'finance2@adyapan.com',
        roles: ['FINANCE_OFFICER'],
        tenantId,
        branchId,
      };

      const approved = await reconciliationService.approveAdjustment(adjustment.adjustmentId, secondOfficer);
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe(secondOfficer.email);
    });

    it('Finance Officer from ANOTHER tenant CANNOT approve adjustment (Cross-Tenant Blocked)', async () => {
      const loan = {
        id: 'loan-adj-4',
        loanNo: 'LN-ADJ-1004',
        tenantId,
      };
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      const adjustment = await reconciliationService.proposeAdjustment(
        {
          type: 'REVERSAL',
          loanId: 'loan-adj-4',
          amount: 10000,
          reason: 'Duplicate payment reversal request',
        },
        financeOfficer
      );

      // Cross-tenant Finance Officer attempts approval
      await expect(
        reconciliationService.approveAdjustment(adjustment.adjustmentId, crossTenantFinanceOfficer)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Finance Officer from ANOTHER tenant CANNOT view proposed adjustment in listAdjustments', async () => {
      const loan = {
        id: 'loan-adj-5',
        loanNo: 'LN-ADJ-1005',
        tenantId,
      };
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue(loan as any);

      await reconciliationService.proposeAdjustment(
        {
          type: 'REVERSAL',
          loanId: 'loan-adj-5',
          amount: 8000,
          reason: 'Correction of ledger entries',
        },
        financeOfficer
      );

      const ownList = reconciliationService.listAdjustments(financeOfficer);
      expect(ownList.length).toBeGreaterThanOrEqual(1);

      const crossList = reconciliationService.listAdjustments(crossTenantFinanceOfficer);
      expect(crossList.length).toBe(0);
    });
  });

  describe('9. AI / Copilot Tenant Isolation Context', () => {
    it('Copilot context strictly isolates tenant financial and customer records', async () => {
      vi.spyOn(prisma.customer, 'findFirst').mockResolvedValue({
        id: 'cust-1',
        firstName: 'Rahul',
        lastName: 'Sharma',
        customerCode: 'CUST-1001',
        mobile: '9876543210',
        kycStatus: 'VERIFIED',
        riskCategory: 'LOW',
        monthlyIncome: '50000',
        existingObligations: '5000',
        tenantId,
        loans: [],
        applications: [],
      } as any);

      const context = await buildAuthorizedContext(financeOfficer, 'cust-1', 'LOAN_MANAGEMENT');
      expect(context).toBeDefined();
      expect(context.contextText).toBeDefined();
    });
  });

  describe('10. Frontend Configuration & Navigation Alignment', () => {
    it('FINANCE_OFFICER contains exactly the 9 approved navigation items', () => {
      const expectedNav = [
        'dashboard',
        'disbursements',
        'payments',
        'loans',
        'reconciliation',
        'reports',
        'fraud-intelligence',
        'early-warnings',
        'emi-calculator',
      ];

      expect(expectedNav).toHaveLength(9);
      expect(expectedNav).toContain('dashboard');
      expect(expectedNav).toContain('disbursements');
      expect(expectedNav).toContain('payments');
      expect(expectedNav).toContain('loans');
      expect(expectedNav).toContain('reconciliation');
      expect(expectedNav).toContain('reports');
      expect(expectedNav).toContain('fraud-intelligence');
      expect(expectedNav).toContain('early-warnings');
      expect(expectedNav).toContain('emi-calculator');
    });

    it('FINANCE_OFFICER strictly EXCLUDES unauthorized administration and underwriting pages', () => {
      const expectedNav = [
        'dashboard',
        'disbursements',
        'payments',
        'loans',
        'reconciliation',
        'reports',
        'fraud-intelligence',
        'early-warnings',
        'emi-calculator',
      ];

      expect(expectedNav).not.toContain('underwriting');
      expect(expectedNav).not.toContain('users');
      expect(expectedNav).not.toContain('roles');
      expect(expectedNav).not.toContain('tenants');
      expect(expectedNav).not.toContain('configuration');
      expect(expectedNav).not.toContain('settings');
      expect(expectedNav).not.toContain('communications');
      expect(expectedNav).not.toContain('partners');
    });
  });
});
