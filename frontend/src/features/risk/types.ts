// Phase 9: Risk Feature Types

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

export interface RiskSignalItem {
  id: string;
  code: string;
  name: string;
  category: RiskSignalCategory;
  actualValue: any;
  benchmarkValue: any;
  severity: SignalSeverity;
  weight: number;
  scoreContribution: number;
  reason: string;
  recommendation: string;
}

export interface RiskCategorySummary {
  category: RiskSignalCategory;
  score: number;
  weight: number;
  contribution: number;
  signalsCount: number;
  criticalSignalsCount: number;
  topReasons: string[];
}

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
    CUSTOMER: number;
    FINANCIAL: number;
    CREDIT: number;
    BANKING: number;
    APPLICATION: number;
    BEHAVIORAL: number;
  };
  bands: RiskBandConfig[];
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

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
  evaluationVersion: number;
  riskScore: number;
  riskBand: RiskBand;
  riskGrade: RiskGrade;
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

export type CreateRiskPolicyDto = Partial<Omit<RiskPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'>> & {
  code: string;
  name: string;
  description?: string;
};
