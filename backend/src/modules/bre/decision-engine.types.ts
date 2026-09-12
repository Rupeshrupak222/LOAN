// Phase 2: Decision Engine & BRE Domain Types

export type RuleCategory =
  | 'ELIGIBILITY'
  | 'CREDIT'
  | 'FINANCIAL'
  | 'BANKING'
  | 'KYC_DOCS'
  | 'FRAUD_RISK'
  | 'PRODUCT_POLICY';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'BETWEEN'
  | 'IN'
  | 'NOT_IN'
  | 'EXISTS'
  | 'NOT_EXISTS'
  | 'CONTAINS'
  | 'NOT_CONTAINS';

export type RuleSeverity = 'HARD_STOP' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type RuleAction = 'PASS' | 'FAIL' | 'REFER' | 'WARNING' | 'CONDITION';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export type DecisionOutcome =
  | 'APPROVE'
  | 'APPROVE_WITH_CONDITIONS'
  | 'REFER'
  | 'REJECT';

export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

// ---------------------------------------------------------------------------
// 1. RULE DEFINITION
// ---------------------------------------------------------------------------

export interface DecisionRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  expectedValue: any;
  severity: RuleSeverity;
  actionOnPass: RuleAction;
  actionOnFail: RuleAction;
  reasonCode: string;
  customerReason?: string;
  weight: number; // For risk score calculation (e.g. 10, 20, 30)
  enabled: boolean;
  priority: number;
}

export interface DecisionRuleGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  logicalOperator: LogicalOperator;
  enabled: boolean;
  rules: DecisionRule[];
}

// ---------------------------------------------------------------------------
// 2. DECISION POLICY
// ---------------------------------------------------------------------------

export interface DecisionPolicy {
  id: string;
  tenantId: string;
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: PolicyStatus;
  ruleGroups: DecisionRuleGroup[];
  scoringWeights?: {
    creditScoreWeight: number; // e.g. 30
    incomeStabilityWeight: number; // e.g. 20
    foirWeight: number; // e.g. 20
    bankingWeight: number; // e.g. 15
    employmentWeight: number; // e.g. 10
    fraudPenaltyWeight: number; // e.g. -50
  };
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDecisionPolicyDto {
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  ruleGroups: DecisionRuleGroup[];
  scoringWeights?: DecisionPolicy['scoringWeights'];
}

export interface UpdateDecisionPolicyDto extends Partial<CreateDecisionPolicyDto> {
  status?: PolicyStatus;
}

// ---------------------------------------------------------------------------
// 3. NORMALIZED DECISION CONTEXT
// ---------------------------------------------------------------------------

export interface DecisionContext {
  applicationId?: string;
  applicationNo?: string;
  customerId?: string;
  customerCode?: string;
  tenantId: string;
  branchId?: string;
  channel?: string;

  // Borrower Profile
  applicantAge: number;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
  employerName?: string;
  monthlyIncome: number;
  existingObligations: number;
  workExperienceMonths?: number;
  residenceType?: string;
  kycStatus: string;

  // Loan Request
  requestedAmount: number;
  tenureMonths: number;
  purpose?: string;

  // Bound Product Information
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  productVersion: number;
  interestModel: string;
  baseInterestRateAnnualPct: number;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;

  // Bureau & Credit Signals
  cibilScore: number;
  cibilOverdueAccounts: number;
  cibilDPD30Last12m: number;
  recentEnquiries6m: number;
  hasWriteOffs: boolean;
  hasSettlements: boolean;
  creditUtilizationPct: number;

  // Banking & Account Aggregator Signals
  averageBankBalance: number;
  bankBounces90d: number;
  salaryCreditDetected: boolean;
  negativeBalanceDays90d: number;

  // KYC & Verification Signals
  panVerified: boolean;
  aadhaarVerified: boolean;
  allMandatoryDocsVerified: boolean;
  missingMandatoryDocs: string[];

  // Fraud & Anomaly Signals (Phase 9)
  fraudRiskScore: number; // 0 (safe) - 100 (high risk)
  fraudScore?: number;
  deviceRiskDetected: boolean;
  identityMismatchDetected: boolean;
  duplicateApplicationDetected: boolean;
  fraudOutcome?: 'CLEAR' | 'LOW_RISK' | 'REVIEW' | 'HIGH_RISK' | 'BLOCK';
  fraudScoreBand?: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  fraudSignals?: any[];
  identitySignals?: any[];
  velocitySignals?: any[];

  // Risk Engine Signals (Phase 9)
  riskScore?: number; // 0 (safe) - 100 (high risk)
  riskBand?: 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  riskGradeDerived?: RiskGrade;
  riskSignals?: any[];
  bankingRiskSignals?: any[];
  compositeMatrixAction?: 'NORMAL' | 'REVIEW' | 'ADDITIONAL_REVIEW' | 'CREDIT_REVIEW' | 'FRAUD_REVIEW' | 'BLOCK';
  matrixAction?: 'NORMAL' | 'REVIEW' | 'ADDITIONAL_REVIEW' | 'CREDIT_REVIEW' | 'FRAUD_REVIEW' | 'BLOCK';

  // Derived Financials (Filled by Financial Metrics Service)
  derived?: {
    proposedEmi: number;
    foirPct: number;
    dtiPct: number;
    disposableIncome: number;
    maxEligibleAmountByIncome: number;
    maxEligibleAmountByRisk: number;
    maxEligibleAmountByProduct: number;
    finalEligibleAmount: number;
  };
}

// ---------------------------------------------------------------------------
// 4. RULE EXECUTION & DECISION RESULTS
// ---------------------------------------------------------------------------

export interface RuleEvaluationItem {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  expectedValue: any;
  actualValue: any;
  passed: boolean;
  action: RuleAction;
  severity: RuleSeverity;
  reasonCode: string;
  customerReason?: string;
  weight: number;
}

export interface DecisionResult {
  decision: DecisionOutcome;
  status: string;
  riskGrade: RiskGrade;
  riskScore: number; // 0 (highest risk) to 100 (prime)
  requestedAmount: number;
  eligibleAmount: number;
  recommendedAmount: number;
  proposedEmi: number;
  foirPct: number;
  dtiPct: number;
  disposableIncome: number;

  reasons: string[];
  customerReasons: string[];
  conditions: string[];
  warnings: string[];

  rulesEvaluatedCount: number;
  passedCount: number;
  failedCount: number;
  referredCount: number;

  passedRules: RuleEvaluationItem[];
  failedRules: RuleEvaluationItem[];
  referredRules: RuleEvaluationItem[];

  policyId: string;
  policyCode: string;
  policyVersion: number;
  productId: string;
  productVersion: number;

  evaluatedAt: string;
  executionTimeMs: number;
}

// ---------------------------------------------------------------------------
// 5. IMMUTABLE DECISION SNAPSHOT
// ---------------------------------------------------------------------------

export interface DecisionOverrideData {
  overriddenBy: string;
  overrideRole: string;
  originalDecision: DecisionOutcome;
  finalDecision: DecisionOutcome;
  reason: string;
  comments: string;
  timestamp: string;
}

export interface DecisionSnapshotRecord {
  id: string;
  decisionVersion: number;
  applicationId: string;
  tenantId: string;
  systemDecision: DecisionOutcome;
  finalDecision: DecisionOutcome;
  override: DecisionOverrideData | null;
  decisionResult: DecisionResult;
  contextSnapshot: DecisionContext;
  policyVersion: number;
  productVersion: number;
  createdAt: string;
  evaluatedBy?: string;
}

export interface DecisionSimulationInput {
  productId: string;
  loanAmount: number;
  tenureMonths: number;
  applicantAge?: number;
  employmentType?: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
  monthlyIncome?: number;
  existingObligations?: number;
  cibilScore?: number;
  cibilOverdueAccounts?: number;
  cibilDPD30Last12m?: number;
  averageBankBalance?: number;
  bankBounces90d?: number;
  fraudRiskScore?: number;
  kycVerified?: boolean;
}
