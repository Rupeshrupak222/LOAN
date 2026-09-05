import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../config/prisma';
import { reconciliationService } from './reconciliation.service';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-recon-1' }),
}));

describe('Step 17: Advanced Accounting & Reconciliation', () => {
  beforeEach(() => {
    reconciliationService.clearForTesting();
  });

  describe('1. Five-Pillar Reconciliation Mismatch Detectors', () => {
    it('detects ALLOCATION_MISMATCH when payment allocation buckets do not sum to total payment amount', async () => {
      // Mock payment of ₹10,000 where allocations only sum to ₹8,000
      vi.spyOn(prisma.payment, 'findMany').mockResolvedValueOnce([
        {
          id: 'pmt-alloc-mismatch-1',
          paymentNo: 'PMT-001',
          loanId: 'loan-1',
          amount: 10000,
          status: 'SUCCESS',
          reference: 'UTR1001',
          allocations: [
            { bucket: 'PRINCIPAL', amount: 5000 },
            { bucket: 'INTEREST', amount: 3000 }, // Total = 8,000 vs 10,000
          ],
          loan: { loanNo: 'LN-001' },
        },
      ] as any);

      vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);

      const result = await reconciliationService.runReconciliation();
      expect(result.exceptionsFound).toBe(1);

      const exceptions = reconciliationService.listExceptions({}, { id: 'admin-1', roles: ['ADMIN'] });
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].type).toBe('ALLOCATION_MISMATCH');
      expect(exceptions[0].severity).toBe('HIGH');
      expect(exceptions[0].discrepancyAmount).toBe(2000);
      expect(exceptions[0].evidence).toContain('Delta: ₹2000');
    });

    it('detects OUTSTANDING_BALANCE_MISMATCH when loan outstanding diverges from repayment schedule', async () => {
      vi.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);

      // Loan outstanding is ₹50,000, but schedule unpaid principal sums to ₹40,000
      vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([
        {
          id: 'loan-bal-mismatch-1',
          loanNo: 'LN-BAL-001',
          status: 'ACTIVE',
          outstandingPrincipal: 50000,
          outstandingInterest: 0,
          outstandingFees: 0,
          schedule: [
            { principal: 20000, status: 'UPCOMING' },
            { principal: 20000, status: 'UPCOMING' }, // Total = 40,000 vs 50,000
          ],
        },
      ] as any);

      const result = await reconciliationService.runReconciliation();
      expect(result.exceptionsFound).toBe(1);

      const exceptions = reconciliationService.listExceptions({ type: 'OUTSTANDING_BALANCE_MISMATCH' }, { id: 'admin-1', roles: ['ADMIN'] });
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].type).toBe('OUTSTANDING_BALANCE_MISMATCH');
      expect(exceptions[0].severity).toBe('CRITICAL');
      expect(exceptions[0].discrepancyAmount).toBe(10000);
    });

    it('detects MISSING_TRANSACTION when verified payment submission has no ledger payment', async () => {
      vi.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);

      // Verified submission in gateway but missing in internal Payment ledger
      vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValueOnce([
        {
          id: 'sub-missing-1',
          submissionNo: 'SUB-999',
          loanId: 'loan-sub-1',
          amount: 15000,
          reference: 'UTR-VERIFIED-NO-PMT',
          status: 'VERIFIED',
          verifiedAt: new Date(),
          loan: { loanNo: 'LN-SUB-1' },
        },
      ] as any);

      const result = await reconciliationService.runReconciliation();
      expect(result.exceptionsFound).toBe(1);

      const exceptions = reconciliationService.listExceptions({ type: 'MISSING_TRANSACTION' }, { id: 'admin-1', roles: ['ADMIN'] });
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].type).toBe('MISSING_TRANSACTION');
      expect(exceptions[0].reference).toBe('UTR-VERIFIED-NO-PMT');
    });

    it('detects DUPLICATE_TRANSACTION when multiple successful payments share identical reference', async () => {
      vi.spyOn(prisma.loan, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.paymentSubmission, 'findMany').mockResolvedValue([]);

      // Two payments sharing same UTR
      vi.spyOn(prisma.payment, 'findMany').mockResolvedValueOnce([
        {
          id: 'pmt-dup-1',
          paymentNo: 'PMT-D1',
          loanId: 'loan-dup-1',
          amount: 5000,
          status: 'SUCCESS',
          reference: 'UTR-IDENTICAL-DUPLICATE',
          allocations: [],
          loan: { loanNo: 'LN-D1' },
        },
        {
          id: 'pmt-dup-2',
          paymentNo: 'PMT-D2',
          loanId: 'loan-dup-1',
          amount: 5000,
          status: 'SUCCESS',
          reference: 'UTR-IDENTICAL-DUPLICATE',
          allocations: [],
          loan: { loanNo: 'LN-D1' },
        },
      ] as any);

      const result = await reconciliationService.runReconciliation();
      expect(result.exceptionsFound).toBe(1);

      const exceptions = reconciliationService.listExceptions({ type: 'DUPLICATE_TRANSACTION' }, { id: 'admin-1', roles: ['ADMIN'] });
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].type).toBe('DUPLICATE_TRANSACTION');
      expect(exceptions[0].severity).toBe('CRITICAL');
      expect(exceptions[0].discrepancyAmount).toBe(10000);
    });
  });

  describe('2. Safe Financial Controls & Maker-Checker Workflow', () => {
    beforeEach(() => {
      vi.spyOn(prisma.loan, 'findUnique').mockResolvedValue({ loanNo: 'LN-TEST-ADJ' } as any);
    });

    it('auto-approves small adjustment (< ₹5,000) under standard threshold', async () => {
      const officer = { id: 'officer-1', email: 'officer@adyapan.dev', roles: ['FINANCE_OFFICER'] };

      const adj = await reconciliationService.proposeAdjustment(
        {
          type: 'REALLOCATION',
          loanId: 'loan-adj-1',
          amount: 2500, // < 5000
          reason: 'Corrected late fee allocation to interest bucket.',
        },
        officer
      );

      expect(adj.adjustmentId).toBeDefined();
      expect(adj.requiresApproval).toBe(false);
      expect(adj.status).toBe('APPROVED');
      expect(adj.approvedBy).toBe('officer@adyapan.dev');
    });

    it('requires Maker-Checker approval for adjustments >= ₹5,000', async () => {
      const maker = { id: 'maker-1', email: 'analyst@adyapan.dev', roles: ['FINANCE_OFFICER'] };

      const adj = await reconciliationService.proposeAdjustment(
        {
          type: 'REVERSAL',
          loanId: 'loan-adj-1',
          amount: 15000, // >= 5000
          reason: 'Reversing accidental double payment debit.',
        },
        maker
      );

      expect(adj.requiresApproval).toBe(true);
      expect(adj.status).toBe('PENDING_APPROVAL');
      expect(adj.approvedBy).toBeUndefined();

      // Segregation of duties: Maker cannot approve their own adjustment
      await expect(
        reconciliationService.approveAdjustment(adj.adjustmentId, maker)
      ).rejects.toThrow(ForbiddenError);

      // Authorized Checker approves
      const checker = { id: 'checker-1', email: 'finhead@adyapan.dev', roles: ['ADMIN'] };
      const approved = await reconciliationService.approveAdjustment(adj.adjustmentId, checker);

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('finhead@adyapan.dev');
      expect(approved.approvedAt).toBeDefined();
    });

    it('allows rejection of pending adjustment with reason', async () => {
      const maker = { id: 'maker-1', email: 'analyst@adyapan.dev', roles: ['FINANCE_OFFICER'] };
      const adj = await reconciliationService.proposeAdjustment(
        {
          type: 'LEDGER_CORRECTION',
          loanId: 'loan-adj-1',
          amount: 8000,
          reason: 'Manual balance correction.',
        },
        maker
      );

      const checker = { id: 'checker-1', email: 'finhead@adyapan.dev', roles: ['FINANCE_OFFICER'] };
      const rejected = await reconciliationService.rejectAdjustment(
        adj.adjustmentId,
        'Insufficient documentary evidence from bank statement.',
        checker
      );

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toContain('Insufficient documentary evidence');
    });
  });

  describe('3. Strict Borrower Isolation', () => {
    const borrower = { id: 'borrower-1', roles: ['CUSTOMER'] };

    it('strictly forbids borrower role from accessing reconciliation dashboard stats', async () => {
      await expect(reconciliationService.getDashboardStats(borrower)).rejects.toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from listing financial exceptions', () => {
      expect(() => reconciliationService.listExceptions({}, borrower)).toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from proposing ledger adjustments', async () => {
      await expect(
        reconciliationService.proposeAdjustment(
          { type: 'WAIVER', loanId: 'loan-1', amount: 500, reason: 'Test' },
          { id: 'borrower-1', email: 'cust@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
