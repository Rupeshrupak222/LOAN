import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategorizationService } from './categorization.service';
import { TransactionNormalizerService } from './transaction-normalizer.service';
import { IncomeIntelligenceService } from './income-intelligence.service';
import { CashFlowIntelligenceService } from './cash-flow-intelligence.service';
import { ObligationIntelligenceService } from './obligation-intelligence.service';
import { AnomalyIntelligenceService } from './anomaly-intelligence.service';
import { bankIntelligenceService } from './bank-intelligence.service';
import { integrationHub } from '../integrations/integration-hub.service';
import { ForbiddenError, NotFoundError } from '../../common/errors';

// Mock dependencies
vi.mock('../../config/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
    loanApplication: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
}));

vi.mock('../ai/gemini.service', () => ({
  generateGeminiContent: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      executiveSummary: 'Borrower exhibits regular payroll inflows with moderate debt service burden.',
      incomeStabilityAssessment: 'Consistent monthly corporate salary credits verified.',
      cashFlowAssessment: 'Positive net monthly margin with healthy Average Bank Balance.',
      debtBurdenAssessment: 'Two active loan obligations detected within normal DTI capacity.',
      underwriterQuestions: [
        'Confirm employer designation and tenure.',
        'Verify secondary account balances.',
      ],
    }),
    model: 'gemma-4-31b-it',
  }),
}));

describe('Step 13: Bank Statement Intelligence Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bankIntelligenceService.clearForTesting();
  });

  // 1. Transaction Categorization
  describe('1. Deterministic Categorization', () => {
    it('categorizes payroll credits as SALARY with HIGH confidence', () => {
      const res = CategorizationService.categorize('CMS/INFOSYS LTD/SALARY CR/OCT', 'CREDIT', 85000);
      expect(res.category).toBe('SALARY');
      expect(res.confidence).toBe('HIGH');
      expect(res.source).toBe('DETERMINISTIC_RULES');
    });

    it('categorizes lending institution debits as LOAN_EMI with HIGH confidence', () => {
      const res = CategorizationService.categorize('ACH DR BAJAJ FINANCE LTD EMI', 'DEBIT', 12500);
      expect(res.category).toBe('LOAN_EMI');
      expect(res.confidence).toBe('HIGH');
      expect(res.source).toBe('DETERMINISTIC_RULES');
    });

    it('categorizes residential rent debits correctly', () => {
      const res = CategorizationService.categorize('UPI/HOUSE RENT TO LANDLORD', 'DEBIT', 22000);
      expect(res.category).toBe('RENT');
      expect(res.confidence).toBe('HIGH');
    });

    it('categorizes utility and telecom payments correctly', () => {
      const res = CategorizationService.categorize('BESCOM ELECTRICITY BILL BANGALORE', 'DEBIT', 1850);
      expect(res.category).toBe('UTILITIES');
      expect(res.confidence).toBe('HIGH');
    });

    it('categorizes ATM cash withdrawals correctly', () => {
      const res = CategorizationService.categorize('NFS ATM CASH WDL KORAMANGALA', 'DEBIT', 5000);
      expect(res.category).toBe('CASH_WITHDRAWAL');
      expect(res.confidence).toBe('HIGH');
    });
  });

  // 2. Transaction Normalization
  describe('2. Transaction Normalization Contract', () => {
    it('normalizes raw transaction arrays into standardized contract', () => {
      const raw = [
        {
          date: '2026-08-01',
          description: 'SALARY CREDIT ACME CORP',
          type: 'CREDIT',
          amount: 75000,
          balance: 82000,
        },
        {
          date: '2026-08-05',
          description: 'ACH DR HDFC LOAN EMI',
          type: 'DEBIT',
          amount: 15000,
          balance: 67000,
        },
      ];

      const normalized = TransactionNormalizerService.normalize(raw, {
        customerId: 'cust-123',
        accountId: 'acc-456',
        sourceProvider: 'VERIFIED_E_STATEMENT',
        correlationId: 'INT-TEST-001',
      });

      expect(normalized).toHaveLength(2);
      expect(normalized[0].customerId).toBe('cust-123');
      expect(normalized[0].transactionType).toBe('CREDIT');
      expect(normalized[0].category).toBe('SALARY');
      expect(normalized[1].transactionType).toBe('DEBIT');
      expect(normalized[1].category).toBe('LOAN_EMI');
      expect(normalized[1].balanceAfterTransaction).toBe(67000);
    });
  });

  // 3. Income Intelligence
  describe('3. Income Intelligence & Salary Detection', () => {
    const mockSalaryTxns = [
      {
        transactionId: 't1',
        accountId: 'a1',
        customerId: 'c1',
        transactionDate: '2026-05-30',
        description: 'SALARY CREDIT TECH CORP',
        transactionType: 'CREDIT' as const,
        amount: 80000,
        balanceAfterTransaction: 85000,
        currency: 'INR',
        category: 'SALARY' as const,
        categoryConfidence: 'HIGH' as const,
        classificationSource: 'DETERMINISTIC_RULES' as const,
        classificationReason: 'Salary pattern',
        sourceProvider: 'E_STATEMENT',
        correlationId: 'INT-01',
      },
      {
        transactionId: 't2',
        accountId: 'a1',
        customerId: 'c1',
        transactionDate: '2026-06-30',
        description: 'SALARY CREDIT TECH CORP',
        transactionType: 'CREDIT' as const,
        amount: 80000,
        balanceAfterTransaction: 87000,
        currency: 'INR',
        category: 'SALARY' as const,
        categoryConfidence: 'HIGH' as const,
        classificationSource: 'DETERMINISTIC_RULES' as const,
        classificationReason: 'Salary pattern',
        sourceProvider: 'E_STATEMENT',
        correlationId: 'INT-02',
      },
      {
        transactionId: 't3',
        accountId: 'a1',
        customerId: 'c1',
        transactionDate: '2026-07-31',
        description: 'SALARY CREDIT TECH CORP',
        transactionType: 'CREDIT' as const,
        amount: 82000,
        balanceAfterTransaction: 91000,
        currency: 'INR',
        category: 'SALARY' as const,
        categoryConfidence: 'HIGH' as const,
        classificationSource: 'DETERMINISTIC_RULES' as const,
        classificationReason: 'Salary pattern',
        sourceProvider: 'E_STATEMENT',
        correlationId: 'INT-03',
      },
    ];

    it('identifies regular monthly payroll credits and calculates average salary', () => {
      const income = IncomeIntelligenceService.analyze(mockSalaryTxns, 3);
      expect(income.detectedSalaryCreditsCount).toBe(3);
      expect(income.salaryFrequency).toBe('MONTHLY');
      expect(income.estimatedRecurringSalary).toBe(80667);
      expect(income.incomeStabilityScore).toBeGreaterThanOrEqual(80);
      expect(income.isPrimaryEmployerIdentified).toBe(true);
      expect(income.primaryEmployerName).toContain('TECH CORP');
    });

    it('separates FACT from INFERENCE in observations', () => {
      const income = IncomeIntelligenceService.analyze(mockSalaryTxns, 3);
      const factObs = income.observations.filter((o) => o.startsWith('[FACT]'));
      const inferObs = income.observations.filter((o) => o.startsWith('[INFERENCE]'));
      expect(factObs.length).toBeGreaterThan(0);
      expect(inferObs.length).toBeGreaterThan(0);
    });
  });

  // 4. Cash Flow Intelligence
  describe('4. Cash Flow Intelligence & Liquidity', () => {
    it('calculates Average Bank Balance (ABB), net flow, and low balance days', () => {
      const txns = [
        {
          transactionId: 't1',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-01',
          description: 'SALARY CREDIT',
          transactionType: 'CREDIT' as const,
          amount: 50000,
          balanceAfterTransaction: 55000,
          currency: 'INR',
          category: 'SALARY' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Salary pattern',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-01',
        },
        {
          transactionId: 't2',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-10',
          description: 'RENT PAYMENT',
          transactionType: 'DEBIT' as const,
          amount: 15000,
          balanceAfterTransaction: 40000,
          currency: 'INR',
          category: 'RENT' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Rent pattern',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-02',
        },
        {
          transactionId: 't3',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-28',
          description: 'EXPENSES',
          transactionType: 'DEBIT' as const,
          amount: 39500,
          balanceAfterTransaction: 500, // Low balance instance
          currency: 'INR',
          category: 'GENERAL_EXPENSE' as const,
          categoryConfidence: 'LOW' as const,
          classificationSource: 'HEURISTIC' as const,
          classificationReason: 'General',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-03',
        },
      ];

      const cashFlow = CashFlowIntelligenceService.analyze(txns);
      expect(cashFlow.totalInflows).toBe(50000);
      expect(cashFlow.totalOutflows).toBe(54500);
      expect(cashFlow.netCashFlow).toBe(-4500);
      expect(cashFlow.lowBalanceDaysCount).toBe(1);
      expect(cashFlow.averageBankBalance).toBeGreaterThan(0);
      expect(cashFlow.monthlyBreakdown).toHaveLength(1);
    });
  });

  // 5. Obligation Intelligence & Undisclosed Debt
  describe('5. Obligation Intelligence & EMI Detection', () => {
    it('detects recurring EMI debits and flags undisclosed obligations', () => {
      const txns = [
        {
          transactionId: 't1',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-06-05',
          description: 'ACH DR BAJAJ FINANCE LOAN EMI',
          transactionType: 'DEBIT' as const,
          amount: 8500,
          balanceAfterTransaction: 40000,
          currency: 'INR',
          category: 'LOAN_EMI' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Bajaj EMI',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-01',
        },
        {
          transactionId: 't2',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-05',
          description: 'ACH DR BAJAJ FINANCE LOAN EMI',
          transactionType: 'DEBIT' as const,
          amount: 8500,
          balanceAfterTransaction: 38000,
          currency: 'INR',
          category: 'LOAN_EMI' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Bajaj EMI',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-02',
        },
      ];

      // Customer declared 0 obligations
      const obligations = ObligationIntelligenceService.analyze(txns, 0);
      expect(obligations.detectedEmis).toHaveLength(1);
      expect(obligations.detectedEmis[0].lenderOrMerchant).toBe('Bajaj Finance');
      expect(obligations.estimatedTotalMonthlyObligations).toBe(8500);
      expect(obligations.declaredObligationsComparison.possibleUndisclosedDebt).toBe(true);
      expect(obligations.nachMandatesCount).toBe(2);
    });
  });

  // 6. Anomaly & Fraud Signals
  describe('6. Anomaly & Behavioral Signals', () => {
    it('detects sudden pre-loan balance inflation spike', () => {
      const txns = [
        {
          transactionId: 't1',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-01',
          description: 'SALARY CREDIT',
          transactionType: 'CREDIT' as const,
          amount: 40000,
          balanceAfterTransaction: 45000,
          currency: 'INR',
          category: 'SALARY' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Salary',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-01',
        },
        // Fill 5 txns
        ...Array.from({ length: 5 }, (_, i) => ({
          transactionId: `t_fill_${i}`,
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: `2026-07-0${i + 2}`,
          description: 'UPI PAYMENT',
          transactionType: 'DEBIT' as const,
          amount: 1000,
          balanceAfterTransaction: 40000 - i * 1000,
          currency: 'INR',
          category: 'UPI_OUT' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'UPI',
          sourceProvider: 'E_STATEMENT',
          correlationId: `INT-${i}`,
        })),
        {
          transactionId: 't_spike',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-28',
          description: 'IMPS INWARD FROM FRIEND',
          transactionType: 'CREDIT' as const,
          amount: 120000, // 3x monthly income right before application
          balanceAfterTransaction: 155000,
          currency: 'INR',
          category: 'OTHER_INCOME' as const,
          categoryConfidence: 'MEDIUM' as const,
          classificationSource: 'HEURISTIC' as const,
          classificationReason: 'Other credit',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-SPIKE',
        },
      ];

      const incomeIntel = IncomeIntelligenceService.analyze(txns, 1);
      const cashFlowIntel = CashFlowIntelligenceService.analyze(txns);
      const anomalies = AnomalyIntelligenceService.evaluate(txns, incomeIntel, cashFlowIntel, 40000);

      const spikeSignal = anomalies.find((a) => a.category === 'BALANCE_INFLATION');
      expect(spikeSignal).toBeDefined();
      expect(spikeSignal?.severity).toBe('HIGH');
      expect(spikeSignal?.fact).toContain('1,20,000');
      expect(spikeSignal?.recommendedHumanAction.length).toBeGreaterThan(0);
    });

    it('detects rapid circular / round-trip fund routing', () => {
      const txns = [
        {
          transactionId: 't_in',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-15',
          description: 'NEFT CR FROM THIRD PARTY',
          transactionType: 'CREDIT' as const,
          amount: 60000,
          balanceAfterTransaction: 65000,
          currency: 'INR',
          category: 'OTHER_INCOME' as const,
          categoryConfidence: 'MEDIUM' as const,
          classificationSource: 'HEURISTIC' as const,
          classificationReason: 'Other credit',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-01',
        },
        {
          transactionId: 't_out',
          accountId: 'a1',
          customerId: 'c1',
          transactionDate: '2026-07-16',
          description: 'IMPS OUT TO ANOTHER ENTITY',
          transactionType: 'DEBIT' as const,
          amount: 60000, // Immediate matching outflow
          balanceAfterTransaction: 5000,
          currency: 'INR',
          category: 'BANK_TRANSFER' as const,
          categoryConfidence: 'HIGH' as const,
          classificationSource: 'DETERMINISTIC_RULES' as const,
          classificationReason: 'Transfer',
          sourceProvider: 'E_STATEMENT',
          correlationId: 'INT-02',
        },
      ];

      const incomeIntel = IncomeIntelligenceService.analyze(txns, 1);
      const cashFlowIntel = CashFlowIntelligenceService.analyze(txns);
      const anomalies = AnomalyIntelligenceService.evaluate(txns, incomeIntel, cashFlowIntel, 30000);

      const circular = anomalies.find((a) => a.category === 'CIRCULAR_ROUTING');
      expect(circular).toBeDefined();
      expect(circular?.severity).toBe('HIGH');
    });
  });

  // 7. Integration Hub Gating
  describe('7. Integration Hub Gating', () => {
    it('returns NOT_CONFIGURED when live Account Aggregator provider is not configured without faking success', async () => {
      const res = await bankIntelligenceService.fetchViaIntegrationHub('cust-test-1', {
        id: 'staff-1',
        email: 'staff@adyapan.dev',
        roles: ['ADMIN'],
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('NOT_CONFIGURED');
      expect(res.error?.code).toBe('PROVIDER_NOT_CONFIGURED');
    });
  });

  // 8. RBAC & Borrower Isolation
  describe('8. RBAC & Borrower Isolation', () => {
    it('strips internal anomaly signals and underwriter questions when viewed by a borrower', async () => {
      const { prisma } = await import('../../config/prisma');
      (prisma.customer.findUnique as any).mockResolvedValue({
        id: 'cust-borrower-1',
        customerCode: 'CUST-001',
        userId: 'user-borrower-1',
        firstName: 'Dinesh',
        lastName: 'Sharma',
        monthlyIncome: 65000,
        existingObligations: 10000,
        bankName: 'HDFC Bank',
        bankAccountNo: '987654321012',
        bankAccounts: [{ id: 'b1', bankName: 'HDFC Bank', accountNumber: '987654321012' }],
        employmentDetails: [],
      });

      // Ingest sample statement as staff
      await bankIntelligenceService.ingestStatement(
        'cust-borrower-1',
        {
          bankName: 'HDFC Bank',
          accountNumber: '987654321012',
          transactions: [
            {
              transactionDate: '2026-07-01',
              description: 'SALARY CREDIT ACME CORP',
              amount: 65000,
              transactionType: 'CREDIT',
              balanceAfterTransaction: 70000,
            },
            {
              transactionDate: '2026-07-05',
              description: 'ACH DR BAJAJ LOAN EMI',
              amount: 10000,
              transactionType: 'DEBIT',
              balanceAfterTransaction: 60000,
            },
          ],
        },
        { id: 'staff-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
      );

      // Access as borrower
      const borrowerResult = await bankIntelligenceService.analyzeCustomerStatement(
        'cust-borrower-1',
        { forceRefresh: false },
        { id: 'user-borrower-1', email: 'borrower@example.com', roles: ['CUSTOMER'] }
      );

      // Verify internal anomalies and underwriter questions are stripped
      expect(borrowerResult.anomalySignals).toHaveLength(0);
      expect(borrowerResult.advisoryAiSummary.underwriterQuestions).toHaveLength(0);
      expect(borrowerResult.accountNumberMasked).toBe('XXXXXX1012');
    });

    it('rejects borrower attempt to access another customer statement with 403 Forbidden', async () => {
      const { prisma } = await import('../../config/prisma');
      (prisma.customer.findUnique as any).mockResolvedValue({
        id: 'cust-other',
        userId: 'user-other-person',
        firstName: 'Other',
        lastName: 'Person',
        bankAccounts: [],
        employmentDetails: [],
      });

      await expect(
        bankIntelligenceService.analyzeCustomerStatement(
          'cust-other',
          { forceRefresh: false },
          { id: 'user-borrower-1', email: 'borrower@example.com', roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
