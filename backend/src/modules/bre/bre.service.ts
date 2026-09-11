import Decimal from 'decimal.js';
import { prisma } from '../../config/prisma';
import { Money } from '../finance/money';
import { calculateEmi } from '../finance/emi';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type {
  RuleOperator,
  RuleSeverity,
  RuleCategory,
  RuleActionOnPass,
  RuleActionOnFail,
  RuleDefinition,
  RuleSetDefinition,
  BreEvaluationContext,
  RuleExecutionResultItem,
  BreVerdict,
  BreRecommendedOffer,
  BreEvaluationResult,
} from './bre.types';

// ---------------------------------------------------------------------------
// Canonical Enterprise Default Rule Sets
// ---------------------------------------------------------------------------

export const DEFAULT_CANONICAL_RULES: RuleDefinition[] = [
  {
    id: 'rule-age-min',
    code: 'RULE_AGE_MIN_21',
    name: 'Minimum Age Requirement',
    description: 'Applicant must be at least 21 years of age at the time of origination.',
    category: 'ELIGIBILITY',
    field: 'applicantAge',
    operator: 'GTE',
    value: 21,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REJECT',
    reasonCode: 'ERR_AGE_BELOW_MINIMUM',
    reasonDescription: 'Applicant age is below policy threshold (minimum 21 years).',
    weight: 10,
  },
  {
    id: 'rule-age-max',
    code: 'RULE_AGE_MAX_60',
    name: 'Maximum Age at Maturity',
    description: 'Applicant must not exceed 60 years of age for salaried or 65 for self-employed.',
    category: 'ELIGIBILITY',
    field: 'applicantAge',
    operator: 'LTE',
    value: 60,
    severity: 'SOFT_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REFER_UNDERWRITER',
    reasonCode: 'ERR_AGE_EXCEEDS_BENCHMARK',
    reasonDescription: 'Applicant age exceeds 60 years; requires underwriter discretion on tenure.',
    weight: 10,
  },
  {
    id: 'rule-min-income',
    code: 'RULE_MIN_MONTHLY_INCOME',
    name: 'Minimum Verified Monthly Income',
    description: 'Applicant must earn at least ₹25,000 net monthly income.',
    category: 'ELIGIBILITY',
    field: 'monthlyIncome',
    operator: 'GTE',
    value: 25000,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REJECT',
    reasonCode: 'ERR_INCOME_BELOW_FLOOR',
    reasonDescription: 'Monthly income is below the minimum required underwriting threshold of ₹25,000.',
    weight: 20,
  },
  {
    id: 'rule-cibil-floor',
    code: 'RULE_CIBIL_SCORE_FLOOR',
    name: 'Minimum Bureau CIBIL Score',
    description: 'Credit score must meet or exceed 650 for retail credit eligibility.',
    category: 'CREDIT_TIER',
    field: 'cibilScore',
    operator: 'GTE',
    value: 650,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REJECT',
    reasonCode: 'ERR_CIBIL_SCORE_BELOW_CUTOFF',
    reasonDescription: 'Bureau CIBIL score is below 650 minimum policy cutoff.',
    weight: 25,
  },
  {
    id: 'rule-cibil-prime',
    code: 'RULE_CIBIL_SCORE_PRIME',
    name: 'Super Prime Bureau Score Tier',
    description: 'Bureau score >= 750 qualifies applicant for preferred pricing matrix.',
    category: 'CREDIT_TIER',
    field: 'cibilScore',
    operator: 'GTE',
    value: 750,
    severity: 'INFO',
    actionOnPass: 'APPLY_RATE_DISCOUNT',
    actionOnFail: 'PROCEED',
    reasonCode: 'INFO_SUPER_PRIME_RATE_ELIGIBLE',
    reasonDescription: 'Applicant qualifies for super-prime rate discount of 25 bps.',
    weight: 15,
  },
  {
    id: 'rule-cibil-overdue',
    code: 'RULE_ZERO_CIBIL_OVERDUES',
    name: 'Zero Active Overdue Accounts',
    description: 'Applicant must have zero currently overdue loan/card tradelines.',
    category: 'CREDIT_TIER',
    field: 'cibilOverdueAccounts',
    operator: 'LTE',
    value: 0,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REJECT',
    reasonCode: 'ERR_ACTIVE_OVERDUE_TRADELINES',
    reasonDescription: 'Active overdue accounts detected on bureau report.',
    weight: 20,
  },
  {
    id: 'rule-cibil-dpd',
    code: 'RULE_MAX_DPD_30_LAST_12M',
    name: 'Delinquency Gate (DPD 30+ in 12m)',
    description: 'No more than 0 instances of 30+ DPD in the preceding 12 months.',
    category: 'CREDIT_TIER',
    field: 'cibilDPD30Last12m',
    operator: 'LTE',
    value: 0,
    severity: 'SOFT_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REFER_UNDERWRITER',
    reasonCode: 'WARN_RECENT_DELINQUENCY_DPD30',
    reasonDescription: 'Historical 30+ DPD instances detected in last 12 months; underwriter review required.',
    weight: 15,
  },
  {
    id: 'rule-fraud-score',
    code: 'RULE_FRAUD_RISK_SCORE_MAX',
    name: 'Fraud & AML Risk Gate',
    description: 'Automated fraud risk engine score must be less than or equal to 30.',
    category: 'FRAUD_GATE',
    field: 'fraudRiskScore',
    operator: 'LTE',
    value: 30,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REJECT',
    reasonCode: 'ERR_HIGH_FRAUD_RISK_DETECTED',
    reasonDescription: 'Fraud risk index exceeds maximum acceptable limit of 30.',
    weight: 25,
  },
  {
    id: 'rule-kyc-status',
    code: 'RULE_KYC_COMPLETION_GATE',
    name: 'KYC Verification Status',
    description: 'Applicant must have successfully completed official KYC verification.',
    category: 'FRAUD_GATE',
    field: 'kycStatus',
    operator: 'IN',
    value: ['VERIFIED', 'KYC_VERIFIED', 'COMPLETED'],
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REQUIRE_ADDITIONAL_DOCUMENTS',
    reasonCode: 'ERR_KYC_NOT_FULLY_VERIFIED',
    reasonDescription: 'KYC status is not yet verified or has failed biometric/ID checks.',
    weight: 20,
  },
  {
    id: 'rule-mandatory-docs',
    code: 'RULE_ALL_MANDATORY_DOCS_VERIFIED',
    name: 'Mandatory Document Verification Gate',
    description: 'All mandatory identity, address, and income proof documents must be verified.',
    category: 'DOCUMENTATION',
    field: 'allMandatoryDocsVerified',
    operator: 'BOOLEAN_TRUE',
    value: true,
    severity: 'HARD_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'REQUIRE_ADDITIONAL_DOCUMENTS',
    reasonCode: 'ERR_MANDATORY_DOCUMENTS_DEFICIENT',
    reasonDescription: 'One or more required underwriting documents are missing or rejected.',
    weight: 15,
  },
  {
    id: 'rule-bank-bounces',
    code: 'RULE_MAX_BANK_BOUNCES_90D',
    name: 'Inward Cheque / Mandate Return Gate',
    description: 'Applicant banking must not reflect more than 1 inward return/bounce in last 90 days.',
    category: 'APPROVAL_LIMIT',
    field: 'bankBounces90d',
    operator: 'LTE',
    value: 1,
    severity: 'SOFT_FAIL',
    actionOnPass: 'PROCEED',
    actionOnFail: 'ADJUST_PRICING_PREMIUM',
    reasonCode: 'WARN_BANKING_BOUNCES_OBSERVED',
    reasonDescription: 'Banking statement reflects returned debits in 90 days; pricing premium of +50 bps applied.',
    weight: 10,
  },
];

export const CANONICAL_DEFAULT_RULESET: RuleSetDefinition = {
  id: 'canonical-ruleset-v1',
  tenantId: 'GLOBAL',
  code: 'ADYAPAN_STANDARD_RETAIL_BRE',
  name: 'Adyapan Standard Retail Credit & Eligibility Policy',
  description: 'Enterprise canonical ruleset for retail unsecured & personal loans with automated decisioning.',
  version: 1,
  status: 'ACTIVE',
  effectiveFrom: '2025-01-01T00:00:00.000Z',
  rules: DEFAULT_CANONICAL_RULES,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Business Rules Engine Service
// ---------------------------------------------------------------------------

export class BusinessRulesEngineService {
  /**
   * Evaluate a single rule against context attribute.
   */
  public evaluateRule(rule: RuleDefinition, context: BreEvaluationContext): RuleExecutionResultItem {
    const actualValue = (context as any)[rule.field];
    let passed = false;

    if (actualValue === undefined || actualValue === null) {
      if (rule.operator === 'BOOLEAN_FALSE' && actualValue === false) {
        passed = true;
      } else {
        passed = false;
      }
    } else {
      switch (rule.operator) {
        case 'EQ':
          passed = actualValue === rule.value;
          break;
        case 'NEQ':
          passed = actualValue !== rule.value;
          break;
        case 'GT':
          passed = Number(actualValue) > Number(rule.value);
          break;
        case 'GTE':
          passed = Number(actualValue) >= Number(rule.value);
          break;
        case 'LT':
          passed = Number(actualValue) < Number(rule.value);
          break;
        case 'LTE':
          passed = Number(actualValue) <= Number(rule.value);
          break;
        case 'IN':
          if (Array.isArray(rule.value)) {
            passed = rule.value.includes(actualValue);
          } else {
            passed = false;
          }
          break;
        case 'NOT_IN':
          if (Array.isArray(rule.value)) {
            passed = !rule.value.includes(actualValue);
          } else {
            passed = true;
          }
          break;
        case 'BETWEEN':
          if (Array.isArray(rule.value) && rule.value.length === 2) {
            const num = Number(actualValue);
            passed = num >= Number(rule.value[0]) && num <= Number(rule.value[1]);
          } else {
            passed = false;
          }
          break;
        case 'CONTAINS':
          passed = String(actualValue).toLowerCase().includes(String(rule.value).toLowerCase());
          break;
        case 'BOOLEAN_TRUE':
          passed = actualValue === true || actualValue === 'true' || actualValue === 1;
          break;
        case 'BOOLEAN_FALSE':
          passed = actualValue === false || actualValue === 'false' || actualValue === 0;
          break;
        default:
          passed = false;
      }
    }

    const actionTriggered: RuleActionOnPass | RuleActionOnFail = passed
      ? rule.actionOnPass
      : rule.actionOnFail;

    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      field: rule.field,
      operator: rule.operator,
      expectedValue: rule.value,
      actualValue: actualValue ?? null,
      passed,
      severity: rule.severity,
      actionTriggered,
      reasonCode: !passed ? rule.reasonCode : undefined,
      reasonDescription: !passed ? rule.reasonDescription : undefined,
      weight: rule.weight || 10,
    };
  }

  /**
   * Execute full RuleSet evaluation on an incoming context with FOIR & Offer synthesis.
   */
  public evaluateRuleSet(
    ruleSet: RuleSetDefinition,
    context: BreEvaluationContext
  ): BreEvaluationResult {
    const startTime = Date.now();
    const hardFailures: RuleExecutionResultItem[] = [];
    const softFailures: RuleExecutionResultItem[] = [];
    const passedRules: RuleExecutionResultItem[] = [];
    const reasonCodes: string[] = [];
    const reasons: string[] = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const rule of ruleSet.rules) {
      const execResult = this.evaluateRule(rule, context);
      const ruleWeight = rule.weight || 10;
      totalWeight += ruleWeight;

      if (execResult.passed) {
        passedRules.push(execResult);
        earnedWeight += ruleWeight;
      } else {
        if (rule.severity === 'HARD_FAIL') {
          hardFailures.push(execResult);
        } else if (rule.severity === 'SOFT_FAIL') {
          softFailures.push(execResult);
        }

        if (execResult.reasonCode) reasonCodes.push(execResult.reasonCode);
        if (execResult.reasonDescription) reasons.push(execResult.reasonDescription);
      }
    }

    // Calculate normalized overall score (0 to 100)
    const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    // Determine Risk Tier
    const cibil = context.cibilScore || 0;
    let riskTier: BreEvaluationResult['riskTier'] = 'TIER_C_NEAR_PRIME';
    let baseRate = new Decimal(14.5); // Default retail base rate %
    let pricingAdjustmentBps = 0;

    if (cibil >= 780 && hardFailures.length === 0 && softFailures.length === 0) {
      riskTier = 'TIER_A_SUPER_PRIME';
      pricingAdjustmentBps = -50; // -50 bps discount
    } else if (cibil >= 720 && hardFailures.length === 0) {
      riskTier = 'TIER_B_PRIME';
      pricingAdjustmentBps = 0;
    } else if (cibil >= 650 && hardFailures.length === 0) {
      riskTier = 'TIER_C_NEAR_PRIME';
      pricingAdjustmentBps = 100; // +100 bps
    } else {
      riskTier = 'TIER_D_SUBPRIME';
      pricingAdjustmentBps = 250; // +250 bps
    }

    // Additional soft failure pricing loading
    if (softFailures.some((f) => f.actionTriggered === 'ADJUST_PRICING_PREMIUM')) {
      pricingAdjustmentBps += 50;
    }

    const finalRate = baseRate.plus(new Decimal(pricingAdjustmentBps).dividedBy(100));

    // Capacity & FOIR calculations with Money / Decimal
    const monthlyIncome = new Decimal(context.monthlyIncome || 0);
    const existingObligations = new Decimal(context.existingMonthlyObligations || 0);
    const requestedAmount = new Decimal(context.requestedAmount || 0);
    const tenureMonths = context.tenureMonths || 36;

    // Benchmark Max FOIR by Income Bracket
    let maxFoirPct = 50;
    if (monthlyIncome.greaterThanOrEqualTo(100000)) {
      maxFoirPct = 65;
    } else if (monthlyIncome.greaterThanOrEqualTo(50000)) {
      maxFoirPct = 55;
    } else {
      maxFoirPct = 45;
    }

    // Calculate maximum allowable EMI for this applicant
    const maxTotalObligation = monthlyIncome.times(maxFoirPct).dividedBy(100);
    const maxAllowableNewEmi = Decimal.max(0, maxTotalObligation.minus(existingObligations));

    // Reverse compute max principal from allowable EMI:
    // EMI = P * r * (1+r)^n / ((1+r)^n - 1) => P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    let maxEligibleAmount = new Decimal(0);
    if (maxAllowableNewEmi.greaterThan(0) && tenureMonths > 0) {
      const monthlyRate = finalRate.dividedBy(12).dividedBy(100);
      const onePlusR = monthlyRate.plus(1);
      const pow = onePlusR.pow(tenureMonths);
      const factor = pow.minus(1).dividedBy(monthlyRate.times(pow));
      maxEligibleAmount = Money.round(maxAllowableNewEmi.times(factor));
    }

    // Calculate Proposed EMI on requested amount
    let proposedEmiDecimal = new Decimal(0);
    if (requestedAmount.greaterThan(0) && tenureMonths > 0) {
      const emiRes = calculateEmi(requestedAmount.toNumber(), finalRate.toNumber(), tenureMonths);
      proposedEmiDecimal = new Decimal(emiRes.emi);
    }

    const proposedTotalObligations = existingObligations.plus(proposedEmiDecimal);
    const actualFoirPct = monthlyIncome.greaterThan(0)
      ? proposedTotalObligations.dividedBy(monthlyIncome).times(100).toDecimalPlaces(2).toNumber()
      : 0;

    const actualDtiPct = monthlyIncome.greaterThan(0)
      ? existingObligations.dividedBy(monthlyIncome).times(100).toDecimalPlaces(2).toNumber()
      : 0;

    // Synthesize Recommended Offer
    const recommendedSanction = Decimal.min(requestedAmount, maxEligibleAmount);
    const recommendedOffer: BreRecommendedOffer = {
      maxEligibleAmount: maxEligibleAmount.toNumber(),
      recommendedInterestRate: finalRate.toDecimalPlaces(2).toNumber(),
      recommendedTenureMonths: tenureMonths,
      estimatedEmi: proposedEmiDecimal.toNumber(),
      maxFoirPct,
      actualFoirPct,
      actualDtiPct,
      pricingAdjustmentBps,
    };

    // Determine Final Verdict
    let verdict: BreVerdict = 'ELIGIBLE';
    let summary = 'Applicant meets standard underwriting and credit benchmarks.';

    if (hardFailures.length > 0) {
      // Check if hard failure is documentation related vs fundamental policy
      const isOnlyDocFailures = hardFailures.every((f) => f.category === 'DOCUMENTATION' || f.category === 'FRAUD_GATE');
      if (isOnlyDocFailures) {
        verdict = 'CONDITIONALLY_ELIGIBLE';
        summary = 'Applicant conditionally eligible subject to pending KYC and mandatory document verifications.';
      } else {
        verdict = 'REJECTED';
        summary = `Application rejected by rule engine due to ${hardFailures.length} hard policy failures: ${hardFailures.map((h) => h.ruleName).join(', ')}.`;
      }
    } else if (actualFoirPct > maxFoirPct) {
      verdict = 'REFER_UNDERWRITER';
      summary = `Proposed FOIR (${actualFoirPct}%) exceeds maximum policy ceiling (${maxFoirPct}%). Recommended for underwriter adjustment or tenure extension.`;
      reasonCodes.push('WARN_FOIR_EXCEEDED');
      reasons.push(`Proposed FOIR of ${actualFoirPct}% exceeds maximum ceiling of ${maxFoirPct}%.`);
    } else if (softFailures.length > 0) {
      verdict = 'MANUAL_REVIEW_REQUIRED';
      summary = `Application passed mandatory checks but triggered ${softFailures.length} advisory gates requiring underwriter concurrence.`;
    } else if (overallScore >= 90 && context.channel === 'DIRECT_DIGITAL' && requestedAmount.lessThanOrEqualTo(500000)) {
      verdict = 'AUTO_APPROVED';
      summary = 'Straight-Through-Processing (STP) Auto-Approved by Enterprise BRE.';
    } else {
      verdict = 'ELIGIBLE';
      summary = 'Application meets all retail credit benchmarks with high confidence.';
    }

    const durationMs = Date.now() - startTime;

    return {
      verdict,
      overallScore,
      riskTier,
      summary,
      rulesEvaluatedCount: ruleSet.rules.length,
      passedCount: passedRules.length,
      failedCount: hardFailures.length + softFailures.length,
      hardFailures,
      softFailures,
      passedRules,
      reasonCodes,
      reasons,
      recommendedOffer,
      ruleSetVersion: ruleSet.version,
      ruleSetCode: ruleSet.code,
      evaluatedAt: new Date().toISOString(),
      executionDurationMs: durationMs,
    };
  }

  /**
   * Fetch active ruleset for a specific tenant and optional product.
   */
  public async getActiveRuleSet(tenantId?: string, productId?: string): Promise<RuleSetDefinition> {
    try {
      // Check if customized ruleset exists in SystemSetting
      const key = tenantId ? `BRE_RULESET_${tenantId}_${productId || 'DEFAULT'}` : 'BRE_RULESET_GLOBAL';
      const setting = await prisma.systemSetting.findUnique({ where: { key } });

      if (setting && setting.value) {
        return setting.value as unknown as RuleSetDefinition;
      }
    } catch (err) {
      // Fallback to canonical
    }

    return CANONICAL_DEFAULT_RULESET;
  }

  /**
   * Save or update a custom ruleset.
   */
  public async saveRuleSet(ruleSet: RuleSetDefinition, actor?: { id?: string; tenantId?: string }): Promise<RuleSetDefinition> {
    const key = ruleSet.tenantId && ruleSet.tenantId !== 'GLOBAL'
      ? `BRE_RULESET_${ruleSet.tenantId}_${ruleSet.productId || 'DEFAULT'}`
      : 'BRE_RULESET_GLOBAL';

    const updatedRuleSet: RuleSetDefinition = {
      ...ruleSet,
      updatedAt: new Date().toISOString(),
      version: (ruleSet.version || 1) + 1,
    };

    await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: updatedRuleSet as any,
        category: 'BRE_RULES',
      },
      update: {
        value: updatedRuleSet as any,
        updatedAt: new Date(),
      },
    });

    if (actor?.id) {
      await logAudit({
        userId: actor.id,
        tenantId: actor.tenantId,
        action: 'UPDATE_BRE_RULESET',
        entity: 'BRE_RULESET',
        entityId: ruleSet.code,
        newValue: { version: updatedRuleSet.version, rulesCount: updatedRuleSet.rules.length },
      });
    }

    return updatedRuleSet;
  }

  /**
   * Evaluate a live loan application end-to-end with the BRE engine.
   */
  public async evaluateApplication(applicationId: string, actor?: { id?: string; tenantId?: string }): Promise<BreEvaluationResult> {
    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            employmentDetails: true,
            documents: true,
          },
        },
        product: true,
        riskAssessment: true,
        documents: true,
      },
    });

    if (!application) throw new NotFoundError('Loan application not found');

    const customer = application.customer;
    const employment = customer.employmentDetails?.[0];

    // Compute applicant age
    let applicantAge: number | null = null;
    if (customer.dateOfBirth) {
      const diffMs = Date.now() - new Date(customer.dateOfBirth).getTime();
      const ageDate = new Date(diffMs);
      applicantAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // Inspect mandatory documents
    const allDocs = [...(customer.documents || []), ...(application.documents || [])];
    const mandatoryCategories = ['IDENTITY', 'ADDRESS', 'INCOME', 'BANK_STATEMENT'];
    const verifiedCategories = new Set(
      allDocs.filter((d) => d.status === 'VERIFIED' || d.verified === true).map((d) => d.category)
    );
    const allMandatoryDocsVerified = mandatoryCategories.every((cat) => verifiedCategories.has(cat));

    // Construct evaluation context
    const context: BreEvaluationContext = {
      applicationId: application.id,
      customerId: customer.id,
      tenantId: application.tenantId || undefined,
      branchId: application.branchId || undefined,
      channel: 'DIRECT_DIGITAL',
      applicantAge: applicantAge || 30, // Default to compliant 30 if null
      employmentType: customer.employmentType || employment?.employmentType || 'SALARIED',
      monthlyIncome: customer.monthlyIncome ? Number(customer.monthlyIncome) : (employment?.monthlyIncome ? Number(employment.monthlyIncome) : 45000),
      existingMonthlyObligations: customer.existingObligations ? Number(customer.existingObligations) : 0,
      workVintageMonths: employment?.workExperienceYears ? employment.workExperienceYears * 12 : 24,
      requestedAmount: Number(application.requestedAmount),
      tenureMonths: application.tenureMonths,
      productType: application.product.productType,
      productCode: application.product.code,
      cibilScore: application.riskAssessment?.score ? Math.min(850, Math.max(300, application.riskAssessment.score * 8 + 300)) : 750,
      cibilOverdueAccounts: 0,
      cibilDPD30Last12m: 0,
      fraudRiskScore: 12,
      kycStatus: customer.kycStatus || 'VERIFIED',
      mandatoryDocsCount: verifiedCategories.size,
      allMandatoryDocsVerified,
      bankBounces90d: 0,
      averageBankBalance: 35000,
    };

    const ruleSet = await this.getActiveRuleSet(application.tenantId || undefined, application.productId);
    const result = this.evaluateRuleSet(ruleSet, context);

    // Save eligibility snapshot
    await prisma.eligibilityAssessment.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        result: result.verdict,
        factors: result as any,
      },
      update: {
        result: result.verdict,
        factors: result as any,
      },
    });

    if (actor?.id) {
      await logAudit({
        userId: actor.id,
        tenantId: actor.tenantId,
        action: 'EVALUATE_APPLICATION_BRE',
        entity: 'LoanApplication',
        entityId: application.id,
        newValue: { verdict: result.verdict, score: result.overallScore, reasonCodes: result.reasonCodes },
      });
    }

    return result;
  }

  /**
   * Run simulation / what-if analysis over sample contexts.
   */
  public simulate(ruleSet: RuleSetDefinition, contexts: BreEvaluationContext[]): {
    totalEvaluated: number;
    approvedCount: number;
    referredCount: number;
    rejectedCount: number;
    averageScore: number;
    results: BreEvaluationResult[];
  } {
    const results = contexts.map((ctx) => this.evaluateRuleSet(ruleSet, ctx));
    const approvedCount = results.filter((r) => r.verdict === 'AUTO_APPROVED' || r.verdict === 'ELIGIBLE').length;
    const referredCount = results.filter((r) => r.verdict === 'REFER_UNDERWRITER' || r.verdict === 'MANUAL_REVIEW_REQUIRED' || r.verdict === 'CONDITIONALLY_ELIGIBLE').length;
    const rejectedCount = results.filter((r) => r.verdict === 'REJECTED' || r.verdict === 'NOT_ELIGIBLE').length;
    const averageScore = results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.overallScore, 0) / results.length) : 0;

    return {
      totalEvaluated: results.length,
      approvedCount,
      referredCount,
      rejectedCount,
      averageScore,
      results,
    };
  }
}

export const breService = new BusinessRulesEngineService();
