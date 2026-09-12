// Phase 9: Advanced Fraud Engine Domain Types & Contracts

export type FraudSignalCategory =
  | 'IDENTITY'
  | 'BANK_ACCOUNT'
  | 'DEVICE'
  | 'NETWORK'
  | 'APPLICATION_VELOCITY';

export type FraudScoreBand =
  | 'LOW'
  | 'MODERATE'
  | 'ELEVATED'
  | 'HIGH'
  | 'CRITICAL';

export type FraudOutcome =
  | 'CLEAR'
  | 'LOW_RISK'
  | 'REVIEW'
  | 'HIGH_RISK'
  | 'BLOCK';

export type FraudSignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FraudCaseStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ESCALATED'
  | 'CLEARED'
  | 'CONFIRMED_FRAUD'
  | 'CLOSED';

// ---------------------------------------------------------------------------
// 1. FRAUD SIGNAL & EXPLAINABILITY
// ---------------------------------------------------------------------------

export interface FraudSignalItem {
  id: string;
  code: string;
  name: string;
  category: FraudSignalCategory;
  actualValue: any;
  thresholdValue: any;
  severity: FraudSignalSeverity;
  scoreImpact: number; // 0 to 100 penalty weight
  reason: string;
  recommendedAction: string;
}

export interface FraudCategorySummary {
  category: FraudSignalCategory;
  score: number; // 0 (clean) - 100 (critical fraud indicators)
  signalsCount: number;
  criticalSignalsCount: number;
  topReasons: string[];
}

// ---------------------------------------------------------------------------
// 2. CONFIGURABLE FRAUD RULES
// ---------------------------------------------------------------------------

export interface FraudRule {
  id: string;
  tenantId: string;
  productId?: string;
  code: string;
  name: string;
  description: string;
  category: FraudSignalCategory;
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'CONTAINS' | 'IN' | 'EXISTS' | 'FUZZY_MATCH_BELOW';
  expectedValue: any;
  severity: FraudSignalSeverity;
  scoreImpact: number;
  reasonCode: string;
  enabled: boolean;
  isSystemRule: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFraudRuleDto {
  productId?: string;
  code: string;
  name: string;
  description: string;
  category: FraudSignalCategory;
  field: string;
  operator: FraudRule['operator'];
  expectedValue: any;
  severity: FraudSignalSeverity;
  scoreImpact: number;
  reasonCode: string;
  enabled?: boolean;
}

export interface UpdateFraudRuleDto extends Partial<CreateFraudRuleDto> {
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// 3. DUPLICATE & IDENTITY GRAPH
// ---------------------------------------------------------------------------

export type EntityNodeType =
  | 'CUSTOMER'
  | 'PAN'
  | 'MOBILE'
  | 'EMAIL'
  | 'BANK_ACCOUNT'
  | 'DEVICE'
  | 'IP'
  | 'PARTNER';

export interface IdentityGraphNode {
  id: string;
  type: EntityNodeType;
  label: string;
  value: string;
  isPrimary?: boolean;
  metadata?: Record<string, any>;
}

export interface IdentityGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
  severity: FraudSignalSeverity;
  discoveredAt: string;
}

export interface IdentityGraphCluster {
  primaryCustomerId: string;
  nodes: IdentityGraphNode[];
  edges: IdentityGraphEdge[];
  linkedCustomersCount: number;
  linkedDevicesCount: number;
  linkedAccountsCount: number;
  linkedIpsCount: number;
  clusterRiskScore: number;
  maxSeverity: FraudSignalSeverity;
  clusterSummary: string;
}

// ---------------------------------------------------------------------------
// 4. FRAUD EVALUATION CONTEXT & INPUTS
// ---------------------------------------------------------------------------

export interface FraudInputContext {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerCode: string;
  tenantId: string;
  branchId?: string;
  partnerId?: string;
  channel?: string;

  // Identity Pillar
  declaredName?: string;
  bureauName?: string;
  panNumber?: string;
  panNameMismatchScore: number; // 0 (perfect match) - 100 (total mismatch)
  aadhaarKycMismatch: boolean;
  dobMismatch: boolean;
  duplicatePanCount: number;
  duplicateMobileCount: number;
  duplicateEmailCount: number;
  syntheticIdentityIndicator: boolean;

  // Bank Account Pillar
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  pennyDropStatus?: string;
  bankNameMismatchPct: number; // 0 - 100
  bankAccountLinkedToOtherCustomersCount: number;
  bankAccountReusePatternDetected: boolean;
  highRiskBeneficiaryDetected: boolean;

  // Device Pillar
  deviceId?: string;
  deviceFingerprintHash?: string;
  deviceUsedByCustomersCount: number;
  deviceApplicationsLast24h: number;
  deviceApplicationsLast7d: number;
  isRootedOrJailbroken: boolean;
  isEmulator: boolean;

  // Network Pillar
  ipAddress?: string;
  ipApplicationsLast24h: number;
  isVpnOrProxy: boolean;
  isTorExitNode: boolean;
  geoDistanceKmBetweenIpAndCustomerAddress: number;

  // Application Velocity Pillar
  applicationsLast24h: number;
  applicationsLast7d: number;
  applicationsAcrossDistinctPartners24h: number;
  recentRejectedApplicationsCount: number;
  amountModificationCount: number;
  timeSpentFillingSeconds: number;
}

// ---------------------------------------------------------------------------
// 5. FRAUD EVALUATION RESULT & IMMUTABLE SNAPSHOT
// ---------------------------------------------------------------------------

export interface FraudOverrideRecord {
  id: string;
  overriddenBy: string;
  overrideRole: string;
  previousScore: number;
  newScore: number;
  previousOutcome: FraudOutcome;
  newOutcome: FraudOutcome;
  reason: string;
  comments: string;
  timestamp: string;
}

export interface FraudEvaluationResult {
  id: string;
  applicationId: string;
  customerId: string;
  tenantId: string;
  evaluationVersion: number;
  fraudScore: number; // 0 (clean) - 100 (critical fraud risk)
  fraudBand: FraudScoreBand;
  outcome: FraudOutcome; // CLEAR, LOW_RISK, REVIEW, HIGH_RISK, BLOCK
  categorySummaries: Record<FraudSignalCategory, FraudCategorySummary>;
  signals: FraudSignalItem[];
  rulesTriggered: Array<{ ruleCode: string; ruleName: string; severity: FraudSignalSeverity; scoreImpact: number }>;
  identityClusterSummary: IdentityGraphCluster;
  keyFraudFlags: string[];
  recommendation: string;

  override: FraudOverrideRecord | null;
  evaluatedAt: string;
  evaluatedBy?: string;
  executionTimeMs: number;
}

export interface CustomerSafeFraudSummary {
  applicationId: string;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'REQUIRES_INFO';
  evaluatedAt: string;
  message: string;
}

// ---------------------------------------------------------------------------
// 6. FRAUD INVESTIGATION CASES
// ---------------------------------------------------------------------------

export interface FraudEvidenceItem {
  id: string;
  type: 'DOCUMENT' | 'BANK_STATEMENT' | 'DEVICE_FINGERPRINT' | 'IP_LOOKUP' | 'IDENTITY_GRAPH' | 'EXTERNAL_REPORT';
  title: string;
  description: string;
  uri?: string;
  addedBy: string;
  addedAt: string;
}

export interface FraudCaseNote {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  note: string;
  timestamp: string;
}

export interface FraudCase {
  id: string;
  caseNo: string;
  tenantId: string;
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  riskScore: number;
  fraudScore: number;
  outcome: FraudOutcome;
  status: FraudCaseStatus;
  triggeringSignals: FraudSignalItem[];
  evidence: FraudEvidenceItem[];
  notes: FraudCaseNote[];
  assignedToUserId?: string;
  assignedToName?: string;
  resolution?: 'CLEARED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'REJECTED_LOAN';
  resolutionReason?: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFraudCaseDto {
  applicationId: string;
  notes?: string;
  assignedToUserId?: string;
}

export interface ResolveFraudCaseDto {
  resolution: 'CLEARED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'REJECTED_LOAN';
  reason: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// 7. EXTENSIBLE FRAUD MODEL PROVIDER INTERFACE
// ---------------------------------------------------------------------------

export interface FraudModelProvider {
  providerId: string;
  providerName: string;
  version: string;
  evaluate(context: FraudInputContext, rules: FraudRule[]): Promise<{
    fraudScore: number;
    outcome: FraudOutcome;
    signals: FraudSignalItem[];
    categorySummaries: Record<FraudSignalCategory, FraudCategorySummary>;
    rulesTriggered: Array<{ ruleCode: string; ruleName: string; severity: FraudSignalSeverity; scoreImpact: number }>;
    keyFraudFlags: string[];
    recommendation: string;
  }>;
}
