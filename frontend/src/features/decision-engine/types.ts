// Phase 2: Decision Engine & BRE Domain Types (Frontend)

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
  weight: number;
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
    creditScoreWeight: number;
    incomeStabilityWeight: number;
    foirWeight: number;
    bankingWeight: number;
    employmentWeight: number;
    fraudPenaltyWeight: number;
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
  riskScore: number;
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
  contextSnapshot: Record<string, any>;
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
