// Phase 9: Advanced Risk Engine Domain Types & Contracts

export type RiskSignalCategory =
  | 'CUSTOMER'
  | 'FINANCIAL'
  | 'CREDIT'
  | 'BANKING'
  | 'APPLICATION'
  | 'BEHAVIORAL';

export type RiskBand =
  | 'LOW'
  | 'MODERATE'
  | 'MEDIUM'
  | 'HIGH'
  | 'VERY_HIGH';

export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type RiskPolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type SignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ---------------------------------------------------------------------------
// 1. RISK SIGNAL DEFINITIONS & EXPLAINABILITY
// ---------------------------------------------------------------------------

export interface RiskSignalItem {
  id: string;
  code: string;
  name: string;
  category: RiskSignalCategory;
  actualValue: any;
  benchmarkValue: any;
  severity: SignalSeverity;
  weight: number; // 0 - 100 weighting factor
  scoreContribution: number; // Positive adds risk (0-100 normalized)
  reason: string;
  recommendation: string;
}

export interface RiskCategorySummary {
  category: RiskSignalCategory;
  score: number; // 0 (best) - 100 (highest risk)
  weight: number;
  contribution: number;
  signalsCount: number;
  criticalSignalsCount: number;
  topReasons: string[];
}

// ---------------------------------------------------------------------------
// 2. VERSIONED RISK POLICY
// ---------------------------------------------------------------------------

export interface RiskBandConfig {
  minScore: number;
  maxScore: number;
  band: RiskBand;
  riskGrade: RiskGrade;
  description: string;
}

export interface RiskPolicy {
  id: string;
  tenantId: string;
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: RiskPolicyStatus;
  categoryWeights: {
    CUSTOMER: number;    // e.g. 15
    FINANCIAL: number;   // e.g. 25
    CREDIT: number;      // e.g. 25
    BANKING: number;     // e.g. 20
    APPLICATION: number; // e.g. 10
    BEHAVIORAL: number;  // e.g. 5
  };
  bands: RiskBandConfig[];
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRiskPolicyDto {
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  categoryWeights?: RiskPolicy['categoryWeights'];
  bands?: RiskBandConfig[];
}

export interface UpdateRiskPolicyDto extends Partial<CreateRiskPolicyDto> {
  status?: RiskPolicyStatus;
}

// ---------------------------------------------------------------------------
// 3. RISK EVALUATION CONTEXT & INPUTS
// ---------------------------------------------------------------------------

export interface RiskInputContext {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerCode: string;
  tenantId: string;
  branchId?: string;
  partnerId?: string;
  channel?: string;

  // Customer Pillar
  applicantAge: number;
  customerTenureMonths: number;
  employmentType: 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL';
  employerName?: string;
  workExperienceMonths: number;
  residenceStabilityMonths: number;
  residenceType?: 'OWNED' | 'RENTED' | 'PARENTAL' | 'COMPANY_PROVIDED';
  existingCustomerRelationship: boolean;
  customerSegment?: 'RETAIL' | 'SME' | 'AFFLUENT' | 'NEW_TO_CREDIT' | 'STUDENT';

  // Financial Pillar
  monthlyIncome: number;
  monthlyExpenses: number;
  existingObligations: number;
  foirPct: number;
  dtiPct: number;
  disposableIncome: number;
  incomeConsistencyScore: number; // 0 - 100

  // Credit Pillar (Normalized Bureau)
  bureauScore: number; // e.g. CIBIL / Experian 300 - 900
  bureauEnquiriesLast6m: number;
  activeCreditLinesCount: number;
  totalCreditExposure: number;
  creditUtilizationPct: number;
  maxDPDLast12m: number;
  hasOverdueAccounts: boolean;
  overdueAmount: number;
  hasWriteOffsOrSettlements: boolean;
  creditHistoryDepthMonths: number;

  // Banking Pillar
  bankAccountAgeMonths: number;
  averageMonthlyBalance: number;
  salaryCreditConsistencyScore: number; // 0 - 100
  chequeBouncesLast90d: number;
  inwardOutwardRatio: number;
  negativeBalanceDays90d: number;
  existingEmiDebitCount: number;

  // Application Pillar
  requestedAmount: number;
  requestedTenureMonths: number;
  productType: string;
  applicationVelocity24h: number;
  applicationModificationCount: number;
  timeSpentOnApplicationSeconds: number;
  multipleSubmissionAttempts: number;

  // Behavioral Pillar
  sessionLoginFrequencyWeekly: number;
  rapidFieldChangesCount: number;
  unusualNavigationFlag: boolean;
  repeatedFailedVerificationAttempts: number;
}

// ---------------------------------------------------------------------------
// 4. RISK EVALUATION RESULT & IMMUTABLE SNAPSHOT
// ---------------------------------------------------------------------------

export interface RiskOverrideRecord {
  id: string;
  overriddenBy: string;
  overrideRole: string;
  previousScore: number;
  newScore: number;
  previousGrade: RiskGrade;
  newGrade: RiskGrade;
  reason: string;
  comments: string;
  timestamp: string;
}

export interface RiskEvaluationResult {
  id: string;
  applicationId: string;
  customerId: string;
  tenantId: string;
  evaluationVersion: number; // 1, 2, 3...
  riskScore: number; // 0 (safest) - 100 (highest risk)
  riskBand: RiskBand;
  riskGrade: RiskGrade; // A, B, C, D, E
  categorySummaries: Record<RiskSignalCategory, RiskCategorySummary>;
  signals: RiskSignalItem[];
  keyRiskDrivers: string[];
  recommendation: string;

  policyId: string;
  policyCode: string;
  policyVersion: number;

  override: RiskOverrideRecord | null;
  evaluatedAt: string;
  evaluatedBy?: string;
  executionTimeMs: number;
}

export interface CustomerSafeRiskSummary {
  applicationId: string;
  status: 'ASSESSED' | 'PENDING' | 'RE_EVALUATED';
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  evaluatedAt: string;
  message: string;
}

// ---------------------------------------------------------------------------
// 5. EXTENSIBLE MODEL PROVIDER INTERFACE
// ---------------------------------------------------------------------------

export interface RiskModelProvider {
  providerId: string;
  providerName: string;
  version: string;
  evaluate(context: RiskInputContext, policy: RiskPolicy): Promise<{
    riskScore: number;
    signals: RiskSignalItem[];
    categorySummaries: Record<RiskSignalCategory, RiskCategorySummary>;
    keyRiskDrivers: string[];
    recommendation: string;
  }>;
}
