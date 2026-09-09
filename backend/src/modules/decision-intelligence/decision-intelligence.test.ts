import { describe, it, expect, vi } from 'vitest';
import { ConflictDetectorService } from './conflict-detector.service';
import { FactorAggregatorService } from './factor-aggregator.service';
import { DecisionReadinessService } from './decision-readiness.service';
import { DecisionNarrativeService } from './decision-narrative.service';
import { DecisionContext } from './decision-intelligence.types';
import * as geminiService from '../ai/gemini.service';

vi.mock('../ai/gemini.service', () => ({
  generateGeminiContent: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      executiveSummary: 'Application APP-2026-001 exhibits strong liquidity and verified salary credits.',
      positiveFactors: ['Verified monthly salary credits', 'Healthy FOIR of 35%'],
      attentionFactors: ['Standard underwriting review'],
      conflictsExplanation: 'Zero data conflicts identified.',
      missingInformation: [],
      humanInvestigationQuestions: ['Confirm operational bank account tenure.'],
      recommendedReviewPriority: 'LOW',
      limitations: ['Bureau records current as of last cycle.'],
    }),
    model: 'gemma-4-31b-it',
  }),
}));

describe('Step 14: Advanced Decision Intelligence', () => {
  const baseMockContext: DecisionContext = {
    applicationId: 'app-101',
    applicationNo: 'APP-2026-001',
    customerId: 'cust-101',
    customerCode: 'CUST-101',
    customerName: 'Dinesh Sharma',
    generatedAt: new Date().toISOString(),
    model: 'gemma-4-31b-it',

    identity: {
      kycStatus: 'VERIFIED',
      verifiedDocumentsCount: 4,
      totalDocumentsCount: 4,
      missingMandatoryCategories: [],
      hasPan: true,
      hasAadhaar: true,
    },

    application: {
      requestedAmount: 500000,
      tenureMonths: 24,
      productName: 'Personal Express Loan',
      productCode: 'PL-001',
      interestRate: 14.5,
      applicationAgeDays: 3,
      workflowStage: 'UNDERWRITING_REVIEW',
      applicationStatus: 'UNDER_REVIEW',
    },

    financial: {
      declaredMonthlyIncome: 85000,
      observedBankIncome: 85000,
      incomeStabilityScore: 88,
      salaryFrequency: 'MONTHLY',
      foirPercent: 35,
      declaredMonthlyObligations: 12000,
      detectedMonthlyObligations: 12000,
      averageBankBalance: 65000,
      netMonthlyCashFlow: 38000,
      liquidityRiskTier: 'LOW',
    },

    credit: {
      activeLoansCount: 1,
      totalSanctionedAmount: 200000,
      totalOutstandingPrincipal: 110000,
      totalOverdueAmount: 0,
      maxDpdHistorical: 0,
      repaymentComplianceRate: '100%',
    },

    risk: {
      score: 78,
      category: 'LOW',
      factors: [
        { name: 'Vintage', score: 22, remarks: 'Vintage profile verified' },
        { name: 'DTI Capacity', score: 26, remarks: 'Healthy FOIR' },
      ],
    },

    fraudAndAnomalies: {
      fraudSignalsCount: 0,
      highRiskFraudSignalsCount: 0,
      bankAnomaliesCount: 0,
      summary: 'Zero fraud signals',
    },

    underwriting: {
      conditions: [],
    },

    disbursementReadiness: {
      isBankVerified: true,
      isSanctioned: false,
      hasUnresolvedExceptions: false,
      status: 'BLOCKED',
    },

    freshness: [],
  };

  describe('1. Deterministic Conflict Detection', () => {
    it('detects income discrepancy when declared income significantly exceeds bank observed credits', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        financial: {
          ...baseMockContext.financial,
          declaredMonthlyIncome: 120000,
          observedBankIncome: 65000, // Ratio 1.84x, variance 55,000
        },
      };

      const conflicts = ConflictDetectorService.detect(context);
      expect(conflicts.length).toBeGreaterThanOrEqual(1);

      const incomeConf = conflicts.find((c) => c.type === 'INCOME_DISCREPANCY');
      expect(incomeConf).toBeDefined();
      expect(incomeConf?.severity).toBe('CRITICAL');
      expect(incomeConf?.fact).toContain('1,20,000');
      expect(incomeConf?.fact).toContain('65,000');
    });

    it('detects undisclosed obligations when bank statement records recurring EMI lines exceeding declared obligations', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        financial: {
          ...baseMockContext.financial,
          declaredMonthlyObligations: 5000,
          detectedMonthlyObligations: 22000, // Shortfall 17,000 > 3,000
        },
      };

      const conflicts = ConflictDetectorService.detect(context);
      const obligationConf = conflicts.find((c) => c.type === 'UNDISCLOSED_OBLIGATION');
      expect(obligationConf).toBeDefined();
      expect(obligationConf?.severity).toBe('HIGH');
      expect(obligationConf?.discrepancy).toContain('FOIR/DTI');
    });

    it('detects employer mismatch between application profile and bank salary remitter', () => {
      const conflicts = ConflictDetectorService.detect(baseMockContext, {
        employerNameDeclared: 'Tata Consultancy Services',
        primaryEmployerBank: 'Infosys Limited',
      });

      const empConf = conflicts.find((c) => c.type === 'EMPLOYMENT_MISMATCH');
      expect(empConf).toBeDefined();
      expect(empConf?.severity).toBe('MEDIUM');
      expect(empConf?.fact).toContain('TATA CONSULTANCY SERVICES');
      expect(empConf?.fact).toContain('INFOSYS LIMITED');
    });

    it('detects bureau conflict when bureau records 0 active loans but bank statement exhibits active recurring EMIs', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        credit: {
          ...baseMockContext.credit,
          activeLoansCount: 0,
        },
      };

      const conflicts = ConflictDetectorService.detect(context, {
        detectedEmisCount: 2,
      });

      const bConf = conflicts.find((c) => c.type === 'BUREAU_DEBT_CONFLICT');
      expect(bConf).toBeDefined();
      expect(bConf?.severity).toBe('HIGH');
      expect(bConf?.fact).toContain('2 recurring EMI debit lines');
    });

    it('returns zero conflicts when declared and banking inputs align', () => {
      const conflicts = ConflictDetectorService.detect(baseMockContext, {
        employerNameDeclared: 'Infosys Ltd Bangalore',
        primaryEmployerBank: 'Infosys Ltd',
      });
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('2. Decision Factor Aggregation', () => {
    it('correctly compiles positive factors for clean, verified borrower profile', () => {
      const factors = FactorAggregatorService.aggregate(baseMockContext);
      const positiveFactors = factors.filter((f) => f.status === 'POSITIVE');

      expect(positiveFactors.length).toBeGreaterThanOrEqual(4);
      expect(positiveFactors.some((f) => f.factorId === 'FACT-KYC-VERIFIED')).toBe(true);
      expect(positiveFactors.some((f) => f.factorId === 'FACT-SALARY-CONSISTENT')).toBe(true);
      expect(positiveFactors.some((f) => f.factorId === 'FACT-FOIR-HEALTHY')).toBe(true);
      expect(positiveFactors.some((f) => f.factorId === 'FACT-CLEAN-CREDIT')).toBe(true);
      expect(positiveFactors.some((f) => f.factorId === 'FACT-RISK-LOW')).toBe(true);
    });

    it('identifies high risk factors for high FOIR and elevated credit risk tier', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        financial: {
          ...baseMockContext.financial,
          foirPercent: 68,
        },
        risk: {
          score: 38,
          category: 'HIGH',
          factors: [],
        },
      };

      const factors = FactorAggregatorService.aggregate(context);
      const highRisk = factors.filter((f) => f.status === 'HIGH_RISK');

      expect(highRisk.some((f) => f.factorId === 'FACT-FOIR-ELEVATED')).toBe(true);
      expect(highRisk.some((f) => f.factorId === 'FACT-RISK-HIGH')).toBe(true);
    });

    it('identifies blocking factor when KYC compliance has been rejected', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        identity: {
          ...baseMockContext.identity,
          kycStatus: 'REJECTED',
        },
      };

      const factors = FactorAggregatorService.aggregate(context);
      const blocking = factors.find((f) => f.status === 'BLOCKING');
      expect(blocking).toBeDefined();
      expect(blocking?.factorId).toBe('FACT-KYC-REJECTED');
      expect(blocking?.severity).toBe('CRITICAL');
    });
  });

  describe('3. Decision Readiness Evaluation', () => {
    it('resolves READY_FOR_REVIEW for aligned application with completed verifications', () => {
      const factors = FactorAggregatorService.aggregate(baseMockContext);
      const conflicts = ConflictDetectorService.detect(baseMockContext);

      const { readinessState, reviewPriority } = DecisionReadinessService.evaluate(
        baseMockContext,
        factors,
        conflicts
      );

      expect(readinessState).toBe('READY_FOR_REVIEW');
      expect(reviewPriority).toBe('LOW');
    });

    it('resolves MORE_INFORMATION_REQUIRED when mandatory KYC documentation is missing', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        identity: {
          ...baseMockContext.identity,
          missingMandatoryCategories: ['IDENTITY_PROOF'],
        },
      };

      const factors = FactorAggregatorService.aggregate(context);
      const conflicts = ConflictDetectorService.detect(context);

      const { readinessState, reviewPriority } = DecisionReadinessService.evaluate(context, factors, conflicts);
      expect(readinessState).toBe('MORE_INFORMATION_REQUIRED');
      expect(reviewPriority).toBe('MEDIUM');
    });

    it('resolves HIGH_RISK_REVIEW when critical data conflicts or high-risk fraud signals exist', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        fraudAndAnomalies: {
          ...baseMockContext.fraudAndAnomalies,
          highRiskFraudSignalsCount: 2,
        },
      };

      const factors = FactorAggregatorService.aggregate(context);
      const conflicts = ConflictDetectorService.detect(context);

      const { readinessState, reviewPriority } = DecisionReadinessService.evaluate(context, factors, conflicts);
      expect(readinessState).toBe('HIGH_RISK_REVIEW');
      expect(reviewPriority).toBe('CRITICAL');
    });

    it('resolves BLOCKED_BY_EXISTING_POLICY when a blocking factor exists', () => {
      const context: DecisionContext = {
        ...baseMockContext,
        identity: {
          ...baseMockContext.identity,
          kycStatus: 'REJECTED',
        },
      };

      const factors = FactorAggregatorService.aggregate(context);
      const conflicts = ConflictDetectorService.detect(context);

      const { readinessState, reviewPriority } = DecisionReadinessService.evaluate(context, factors, conflicts);
      expect(readinessState).toBe('BLOCKED_BY_EXISTING_POLICY');
      expect(reviewPriority).toBe('CRITICAL');
    });
  });

  describe('4. Centralized Gemini Advisory Narrative', () => {
    it(
      'synthesizes structured narrative with executive summary, factors, and underwriter questions',
      async () => {
        const factors = FactorAggregatorService.aggregate(baseMockContext);
        const conflicts = ConflictDetectorService.detect(baseMockContext);

        const narrative = await DecisionNarrativeService.synthesize(
          baseMockContext,
          factors,
          conflicts,
          'READY_FOR_REVIEW',
          'LOW'
        );

        expect(narrative).toBeDefined();
        expect(typeof narrative.executiveSummary).toBe('string');
        expect(narrative.executiveSummary.length).toBeGreaterThan(10);
        expect(Array.isArray(narrative.positiveFactors)).toBe(true);
        expect(Array.isArray(narrative.humanInvestigationQuestions)).toBe(true);
        expect(narrative.humanInvestigationQuestions.length).toBeGreaterThanOrEqual(1);
      },
      15000
    );
  });
});
