import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import {
  FinancialControlService,
  financialControlService,
} from './financial-control.service';
import { accountingPeriodService } from '../accounting/accounting-period.service';

describe('Phase P5: Financial Safety & Maker-Checker Dual-Control Hardening', () => {
  const tenantAlpha = 'tenant-adyapan-default';
  const tenantBeta = 'tenant-apex-nbfc';

  const makerActor = {
    id: 'usr-maker-001',
    email: 'maker@adyapan.com',
    roles: ['LOAN_OFFICER'],
    tenantId: tenantAlpha,
    branchId: 'br-south',
  };

  const branchManagerChecker = {
    id: 'usr-bm-002',
    email: 'bm@adyapan.com',
    roles: ['BRANCH_MANAGER'],
    tenantId: tenantAlpha,
    branchId: 'br-south',
  };

  const underwriterChecker = {
    id: 'usr-uw-003',
    email: 'uw@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId: tenantAlpha,
    branchId: 'br-south',
  };

  const creditHeadChecker = {
    id: 'usr-ch-004',
    email: 'ch@adyapan.com',
    roles: ['CREDIT_HEAD'],
    tenantId: tenantAlpha,
  };

  const auditorActor = {
    id: 'usr-aud-005',
    email: 'auditor@adyapan.com',
    roles: ['AUDITOR'],
    tenantId: tenantAlpha,
  };

  // ---------------------------------------------------------------------------
  // 1. MAKER-CHECKER & SEGREGATION OF DUTIES (SoD)
  // ---------------------------------------------------------------------------
  describe('1. Maker-Checker Lifecycle & Segregation of Duties', () => {
    it('should create a financial task in PENDING_CHECKER status', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-001',
          operation: 'DISBURSEMENT',
          amount: 250000,
          currency: 'INR',
          beneficiary: {
            accountNumber: '9876543210',
            ifsc: 'HDFC0001234',
            accountHolderName: 'Rahul Sharma',
          },
        },
        makerActor
      );

      expect(task.id).toBeDefined();
      expect(task.status).toBe('PENDING_CHECKER');
      expect(task.riskClassification).toBe('HIGH_RISK_FINANCIAL_MUTATION');
      expect(task.makerId).toBe(makerActor.id);
      expect(task.amount).toBe(250000);
      expect(task.approvalDataHash).toBeDefined();
    });

    it('should REJECT self-approval by Maker (Maker == Checker attack)', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-002',
          operation: 'DISBURSEMENT',
          amount: 150000,
        },
        makerActor
      );

      // Maker attempts to approve own task
      await expect(
        financialControlService.approveFinancialTask(task.id, makerActor)
      ).rejects.toThrow(/Maker-Checker conflict/);
    });

    it('should allow independent checker to approve financial task', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-003',
          operation: 'DISBURSEMENT',
          amount: 300000,
          beneficiary: { accountNumber: '1122334455', ifsc: 'SBIN0004321' },
        },
        makerActor
      );

      const approvedTask = await financialControlService.approveFinancialTask(
        task.id,
        branchManagerChecker
      );

      expect(approvedTask.status).toBe('APPROVED');
      expect(approvedTask.checkerId).toBe(branchManagerChecker.id);
      expect(approvedTask.snapshot).toBeDefined();
      expect(approvedTask.snapshot?.dataHash).toBe(approvedTask.approvalDataHash);
    });

    it('should REJECT any financial action initiation or approval by AUDITOR role', async () => {
      await expect(
        financialControlService.createFinancialTask(
          {
            tenantId: tenantAlpha,
            resourceType: 'ManualJournal',
            resourceId: 'jrn-001',
            operation: 'MANUAL_JOURNAL_CREATE',
            amount: 50000,
          },
          auditorActor
        )
      ).rejects.toThrow(/Auditor role is strictly read-only/);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. APPROVAL AUTHORITY TIERS & LIMIT BYPASS PROTECTION
  // ---------------------------------------------------------------------------
  describe('2. Multi-Level Authority Limits & Escalation', () => {
    it('should REJECT Branch Manager approval for amount exceeding Level 1 limit (₹5,00,000)', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-004',
          operation: 'DISBURSEMENT',
          amount: 1200000, // ₹12 Lakhs (Exceeds BM ₹5L limit)
        },
        makerActor
      );

      await expect(
        financialControlService.approveFinancialTask(task.id, branchManagerChecker)
      ).rejects.toThrow(/Branch Manager authority is limited to ₹5,00,000/);
    });

    it('should ALLOW Underwriter (Level 2) to approve ₹12,00,000 proposal', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-005',
          operation: 'DISBURSEMENT',
          amount: 1200000,
        },
        makerActor
      );

      const approved = await financialControlService.approveFinancialTask(
        task.id,
        underwriterChecker
      );
      expect(approved.status).toBe('APPROVED');
    });

    it('should REJECT Underwriter approval for amount exceeding Level 2 limit (₹25,00,000)', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'DebtSettlement',
          resourceId: 'setl-001',
          operation: 'SETTLEMENT_APPROVE',
          amount: 4500000, // ₹45 Lakhs (Exceeds UW ₹25L limit)
        },
        makerActor
      );

      await expect(
        financialControlService.approveFinancialTask(task.id, underwriterChecker)
      ).rejects.toThrow(/Senior Underwriter sanction authority is limited to ₹25,00,000/);
    });

    it('should ALLOW Credit Head (Level 3) to approve ₹45,00,000 high exposure proposal', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'DebtSettlement',
          resourceId: 'setl-002',
          operation: 'SETTLEMENT_APPROVE',
          amount: 4500000,
        },
        makerActor
      );

      const approved = await financialControlService.approveFinancialTask(
        task.id,
        creditHeadChecker
      );
      expect(approved.status).toBe('APPROVED');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. APPROVAL SNAPSHOT & CRYPTOGRAPHIC ANTI-TAMPERING
  // ---------------------------------------------------------------------------
  describe('3. Cryptographic Fingerprint & Anti-Tampering Protection', () => {
    it('should REJECT execution if payout amount is tampered after checker approval', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'LoanApplication',
          resourceId: 'app-006',
          operation: 'DISBURSEMENT',
          amount: 50000,
          beneficiary: { accountNumber: '5544332211', ifsc: 'ICIC0000999' },
        },
        makerActor
      );

      await financialControlService.approveFinancialTask(task.id, underwriterChecker);

      // Malicious or accidental amount tampering: changing ₹50,000 to ₹5,00,000
      await expect(
        financialControlService.executeFinancialTask(task.id, underwriterChecker, {
          idempotencyKey: 'idemp-tamper-001',
          currentPayload: {
            amount: 500000, // TAMPERED AMOUNT
            currency: 'INR',
            beneficiary: { accountNumber: '5544332211', ifsc: 'ICIC0000999' },
          },
          executeDomainLogic: async () => ({ executed: true }),
        })
      ).rejects.toThrow(/FINANCIAL_DATA_TAMPERED/);
    });

    it('should REJECT execution if beneficiary bank account is tampered after checker approval', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'LoanApplication',
          resourceId: 'app-007',
          operation: 'DISBURSEMENT',
          amount: 50000,
          beneficiary: { accountNumber: '5544332211', ifsc: 'ICIC0000999' },
        },
        makerActor
      );

      await financialControlService.approveFinancialTask(task.id, underwriterChecker);

      // Malicious beneficiary change
      await expect(
        financialControlService.executeFinancialTask(task.id, underwriterChecker, {
          idempotencyKey: 'idemp-tamper-002',
          currentPayload: {
            amount: 50000,
            currency: 'INR',
            beneficiary: { accountNumber: '9999999999', ifsc: 'ICIC0000999' }, // TAMPERED ACCOUNT
          },
          executeDomainLogic: async () => ({ executed: true }),
        })
      ).rejects.toThrow(/FINANCIAL_DATA_TAMPERED/);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IDEMPOTENCY & CONCURRENCY CONTROL
  // ---------------------------------------------------------------------------
  describe('4. Idempotency & Duplicate Replay Protection', () => {
    it('should execute transaction once and return identical cached response on duplicate replay', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'LoanApplication',
          resourceId: 'app-008',
          operation: 'DISBURSEMENT',
          amount: 75000,
          beneficiary: { accountNumber: '7788990011', ifsc: 'KKBK0001122' },
        },
        makerActor
      );

      await financialControlService.approveFinancialTask(task.id, underwriterChecker);

      let executionCount = 0;
      const domainExecution = async () => {
        executionCount++;
        return { payoutId: 'PO-9912', status: 'SUCCESS' };
      };

      // First Request
      const res1 = await financialControlService.executeFinancialTask(task.id, underwriterChecker, {
        idempotencyKey: 'idemp-unique-001',
        currentPayload: {
          amount: 75000,
          currency: 'INR',
          beneficiary: { accountNumber: '7788990011', ifsc: 'KKBK0001122' },
        },
        executeDomainLogic: domainExecution,
      });

      expect(res1.isIdempotentReplay).toBe(false);
      expect(res1.result.payoutId).toBe('PO-9912');
      expect(executionCount).toBe(1);

      // Duplicate Replay Request
      const res2 = await financialControlService.executeFinancialTask(task.id, underwriterChecker, {
        idempotencyKey: 'idemp-unique-001',
        currentPayload: {
          amount: 75000,
          currency: 'INR',
          beneficiary: { accountNumber: '7788990011', ifsc: 'KKBK0001122' },
        },
        executeDomainLogic: domainExecution,
      });

      expect(res2.isIdempotentReplay).toBe(true);
      expect(res2.result.payoutId).toBe('PO-9912');
      expect(executionCount).toBe(1); // Domain logic was NOT executed a second time
    });

    it('should REJECT reuse of idempotency key with different payload parameters', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'LoanApplication',
          resourceId: 'app-009',
          operation: 'DISBURSEMENT',
          amount: 80000,
        },
        makerActor
      );

      await financialControlService.approveFinancialTask(task.id, underwriterChecker);

      await financialControlService.executeFinancialTask(task.id, underwriterChecker, {
        idempotencyKey: 'idemp-key-shared',
        currentPayload: { amount: 80000, currency: 'INR' },
        executeDomainLogic: async () => ({ success: true }),
      });

      // Attempt key reuse with different amount
      await expect(
        financialControlService.executeFinancialTask(task.id, underwriterChecker, {
          idempotencyKey: 'idemp-key-shared',
          currentPayload: { amount: 95000, currency: 'INR' },
          executeDomainLogic: async () => ({ success: true }),
        })
      ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. DOUBLE-ENTRY GL & ACCOUNTING INTEGRITY
  // ---------------------------------------------------------------------------
  describe('5. Double-Entry GL Integrity & Balance Invariance', () => {
    it('should validate balanced double-entry transaction where Debits == Credits', () => {
      const balancedLines = [
        { accountCode: '1000-01', direction: 'DEBIT' as const, amount: 50000 },
        { accountCode: '2000-01', direction: 'CREDIT' as const, amount: 50000 },
      ];

      const outcome = financialControlService.assertDoubleEntryIntegrity(balancedLines);
      expect(outcome.totalDebit.toNumber()).toBe(50000);
      expect(outcome.totalCredit.toNumber()).toBe(50000);
    });

    it('should REJECT imbalanced GL transaction where Debits != Credits', () => {
      const imbalancedLines = [
        { accountCode: '1000-01', direction: 'DEBIT' as const, amount: 50000 },
        { accountCode: '2000-01', direction: 'CREDIT' as const, amount: 49990 }, // ₹10 imbalance
      ];

      expect(() => {
        financialControlService.assertDoubleEntryIntegrity(imbalancedLines);
      }).toThrow(/GL_IMBALANCE_REJECTED/);
    });

    it('should REJECT GL posting to a closed accounting period', () => {
      // 2026-01 is seeded as CLOSED
      const lines = [
        { accountCode: '1000-01', direction: 'DEBIT' as const, amount: 10000 },
        { accountCode: '2000-01', direction: 'CREDIT' as const, amount: 10000 },
      ];

      expect(() => {
        financialControlService.assertDoubleEntryIntegrity(lines, '2026-01-15T00:00:00.000Z', tenantAlpha);
      }).toThrow(/Accounting period "2026-01".*is CLOSED/);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. MULTI-TENANT & SCOPE ISOLATION (IDOR DEFENSE)
  // ---------------------------------------------------------------------------
  describe('6. Zero-Trust Multi-Tenant & Scope Isolation', () => {
    it('should REJECT cross-tenant financial task approval (Tenant A checker on Tenant B task)', async () => {
      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantBeta,
          resourceType: 'LoanApplication',
          resourceId: 'app-beta-001',
          operation: 'DISBURSEMENT',
          amount: 100000,
        },
        {
          id: 'usr-beta-maker',
          roles: ['LOAN_OFFICER'],
          tenantId: tenantBeta,
        }
      );

      // Tenant Alpha underwriter attempts cross-tenant approval
      await expect(
        financialControlService.approveFinancialTask(task.id, underwriterChecker)
      ).rejects.toThrow(/Cross-tenant access denied/);
    });

    it('should REJECT cross-branch financial task approval', async () => {
      const northBmChecker = {
        id: 'usr-bm-north',
        email: 'bmnorth@adyapan.com',
        roles: ['BRANCH_MANAGER'],
        tenantId: tenantAlpha,
        branchId: 'br-north',
      };

      const southTask = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          branchId: 'br-south',
          resourceType: 'LoanApplication',
          resourceId: 'app-south-001',
          operation: 'DISBURSEMENT',
          amount: 200000,
        },
        makerActor
      );

      await expect(
        financialControlService.approveFinancialTask(southTask.id, northBmChecker)
      ).rejects.toThrow(/Cross-branch access denied/);
    });
  });
});
