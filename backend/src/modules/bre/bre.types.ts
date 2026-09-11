// Enterprise Business Rules Engine (BRE) Types

export type RuleOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'BOOLEAN_TRUE'
  | 'BOOLEAN_FALSE';

export type RuleCategory =
  | 'ELIGIBILITY'
  | 'CREDIT_TIER'
  | 'FRAUD_GATE'
  | 'APPROVAL_LIMIT'
  | 'PRICING_MATRIX'
  | 'DOCUMENTATION'
  | 'DISBURSEMENT_GATE';

export type RuleSeverity = 'HARD_FAIL' | 'SOFT_FAIL' | 'WARN' | 'INFO';

export type RuleActionOnPass =
  | 'PROCEED'
  | 'AUTO_APPROVE'
  | 'FAST_TRACK'
  | 'APPLY_RATE_DISCOUNT';

export type RuleActionOnFail =
  | 'PROCEED'
  | 'REJECT'
  | 'REFER_UNDERWRITER'
  | 'REFER_BRANCH_MANAGER'
  | 'REQUIRE_ADDITIONAL_DOCUMENTS'
  | 'ADJUST_PRICING_PREMIUM'
  | 'ESCALATE_COMMITTEE';

export interface RuleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  value: any;
  severity: RuleSeverity;
  actionOnPass: RuleActionOnPass;
  actionOnFail: RuleActionOnFail;
  reasonCode: string;
  reasonDescription: string;
  weight?: number;
}

export interface RuleSetDefinition {
  id: string;
  tenantId: string;
  productId?: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveFrom: string;
  effectiveTo?: string;
  rules: RuleDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface BreEvaluationContext {
  applicationId?: string;
  customerId?: string;
  tenantId?: string;
  branchId?: string;
  channel?: 'DIRECT_DIGITAL' | 'ASSISTED_BRANCH' | 'PARTNER_LSP' | 'EMBEDDED_API';
  
  // Applicant attributes
  applicantAge?: number | null;
  employmentType?: string | null;
  employerCategory?: string | null;
  monthlyIncome?: number | null;
  existingMonthlyObligations?: number | null;
  workVintageMonths?: number | null;
  
  // Loan attributes
  requestedAmount?: number | null;
  tenureMonths?: number | null;
  productType?: string | null;
  productCode?: string | null;
  
  // Credit & Risk attributes
  cibilScore?: number | null;
  cibilOverdueAccounts?: number | null;
  cibilDPD30Last12m?: number | null;
  fraudRiskScore?: number | null;
  kycStatus?: string | null;
  mandatoryDocsCount?: number | null;
  allMandatoryDocsVerified?: boolean | null;
  bankBounces90d?: number | null;
  averageBankBalance?: number | null;
}

export interface RuleExecutionResultItem {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  expectedValue: any;
  actualValue: any;
  passed: boolean;
  severity: RuleSeverity;
  actionTriggered: RuleActionOnPass | RuleActionOnFail;
  reasonCode?: string;
  reasonDescription?: string;
  weight?: number;
}

export type BreVerdict =
  | 'AUTO_APPROVED'
  | 'ELIGIBLE'
  | 'CONDITIONALLY_ELIGIBLE'
  | 'MANUAL_REVIEW_REQUIRED'
  | 'REFER_UNDERWRITER'
  | 'NOT_ELIGIBLE'
  | 'REJECTED';

export interface BreRecommendedOffer {
  maxEligibleAmount: number;
  recommendedInterestRate: number;
  recommendedTenureMonths: number;
  estimatedEmi: number;
  maxFoirPct: number;
  actualFoirPct: number;
  actualDtiPct: number;
  pricingAdjustmentBps: number;
}

export interface BreEvaluationResult {
  verdict: BreVerdict;
  overallScore: number;
  riskTier: 'TIER_A_SUPER_PRIME' | 'TIER_B_PRIME' | 'TIER_C_NEAR_PRIME' | 'TIER_D_SUBPRIME';
  summary: string;
  rulesEvaluatedCount: number;
  passedCount: number;
  failedCount: number;
  hardFailures: RuleExecutionResultItem[];
  softFailures: RuleExecutionResultItem[];
  passedRules: RuleExecutionResultItem[];
  reasonCodes: string[];
  reasons: string[];
  recommendedOffer: BreRecommendedOffer;
  ruleSetVersion: number;
  ruleSetCode: string;
  evaluatedAt: string;
  executionDurationMs: number;
}
