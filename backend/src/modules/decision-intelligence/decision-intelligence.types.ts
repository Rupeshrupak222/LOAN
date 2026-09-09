export type DecisionFactorCategory =
  | 'IDENTITY'
  | 'APPLICATION'
  | 'FINANCIAL'
  | 'CREDIT'
  | 'RISK'
  | 'FRAUD'
  | 'UNDERWRITING'
  | 'WORKFLOW'
  | 'DISBURSEMENT';

export type DecisionFactorStatus =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'ATTENTION'
  | 'HIGH_RISK'
  | 'BLOCKING'
  | 'UNVERIFIED';

export type DecisionImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DecisionFactor {
  factorId: string;
  category: DecisionFactorCategory;
  title: string;
  status: DecisionFactorStatus;
  severity: DecisionImpact;
  source: string; // e.g., "Eligibility Engine", "Bank Statement Intelligence"
  evidence: string; // Factual data point
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: DecisionImpact;
  createdAt?: string;
}

export type ConflictType =
  | 'INCOME_DISCREPANCY'
  | 'UNDISCLOSED_OBLIGATION'
  | 'EMPLOYMENT_MISMATCH'
  | 'DOCUMENT_BANK_MISMATCH'
  | 'BUREAU_DEBT_CONFLICT';

export interface DataConflict {
  conflictId: string;
  type: ConflictType;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceA: {
    module: string;
    field: string;
    value: string | number;
  };
  sourceB: {
    module: string;
    field: string;
    value: string | number;
  };
  fact: string;
  discrepancy: string;
  possibleExplanations: string[];
  recommendedHumanVerification: string;
}

export type DecisionReadinessState =
  | 'READY_FOR_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'POLICY_EXCEPTION_REQUIRES_REVIEW'
  | 'HIGH_RISK_REVIEW'
  | 'BLOCKED_BY_EXISTING_POLICY'
  | 'UNDER_REVIEW'
  | 'DECISIONED';

export type ReviewPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DataFreshness {
  source: string;
  analyzedAt: string;
  dataAsOf: string;
  status: 'CURRENT' | 'STALE' | 'NOT_AVAILABLE';
}

export interface DecisionNarrative {
  executiveSummary: string;
  positiveFactors: string[];
  attentionFactors: string[];
  conflictsExplanation: string;
  missingInformation: string[];
  humanInvestigationQuestions: string[];
  recommendedReviewPriority: ReviewPriority;
  limitations: string[];
}

export interface DecisionChange {
  field: string;
  previousValue: string | number;
  currentValue: string | number;
  changedAt: string;
  whyItMatters: string;
  affectedFactors: string[];
}

export interface DecisionContext {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  generatedAt: string;
  model: string;

  // 1. Identity & KYC
  identity: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    missingMandatoryCategories: string[];
    hasPan: boolean;
    hasAadhaar: boolean;
  };

  // 2. Application & Product
  application: {
    requestedAmount: number;
    tenureMonths: number;
    productName: string;
    productCode: string;
    interestRate: number;
    applicationAgeDays: number;
    workflowStage: string;
    applicationStatus: string;
  };

  // 3. Financial Snapshot
  financial: {
    declaredMonthlyIncome: number;
    observedBankIncome?: number;
    incomeStabilityScore?: number;
    salaryFrequency?: string;
    foirPercent?: number;
    declaredMonthlyObligations: number;
    detectedMonthlyObligations?: number;
    averageBankBalance?: number;
    netMonthlyCashFlow?: number;
    liquidityRiskTier?: string;
  };

  // 4. Credit & Repayment
  credit: {
    activeLoansCount: number;
    totalSanctionedAmount: number;
    totalOutstandingPrincipal: number;
    totalOverdueAmount: number;
    maxDpdHistorical: number;
    repaymentComplianceRate?: string;
  };

  // 5. Risk Assessment
  risk: {
    score: number;
    category: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNASSESSED';
    factors: Array<{ name: string; score: number; remarks: string }>;
  };

  // 6. Fraud & Anomalies
  fraudAndAnomalies: {
    fraudSignalsCount: number;
    highRiskFraudSignalsCount: number;
    bankAnomaliesCount: number;
    summary: string;
  };

  // 7. Underwriting
  underwriting: {
    currentDecision?: string;
    decidedBy?: string;
    decidedAt?: string;
    conditions: string[];
    reviewerNotes?: string;
  };

  // 8. Disbursement Readiness
  disbursementReadiness: {
    isBankVerified: boolean;
    isSanctioned: boolean;
    hasUnresolvedExceptions: boolean;
    status: 'READY' | 'CONDITIONAL' | 'BLOCKED';
  };

  // Freshness metadata
  freshness: DataFreshness[];
}

export interface DecisionIntelligenceResult {
  context: DecisionContext;
  readinessState: DecisionReadinessState;
  readinessReason: string;
  reviewPriority: ReviewPriority;
  factors: DecisionFactor[];
  conflicts: DataConflict[];
  changesDetected: DecisionChange[];
  narrative: DecisionNarrative;
  isCached: boolean;
}

export interface PortfolioDecisionIntelligence {
  totalPendingApplications: number;
  readinessBreakdown: Record<DecisionReadinessState, number>;
  reviewPriorityBreakdown: Record<ReviewPriority, number>;
  topBlockers: Array<{ reason: string; count: number }>;
  commonConflicts: Array<{ conflictType: string; count: number }>;
  highRiskApplicationsCount: number;
  averageDecisionTurnaroundHours: number;
}
