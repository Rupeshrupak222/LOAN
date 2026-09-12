// Phase 9: Fraud Feature Types

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

export interface FraudSignalItem {
  id: string;
  code: string;
  name: string;
  category: FraudSignalCategory;
  actualValue: any;
  thresholdValue: any;
  severity: FraudSignalSeverity;
  scoreImpact: number;
  reason: string;
  recommendedAction: string;
}

export interface FraudCategorySummary {
  category: FraudSignalCategory;
  score: number;
  signalsCount: number;
  criticalSignalsCount: number;
  topReasons: string[];
}

export interface FraudRule {
  id: string;
  tenantId: string;
  productId?: string;
  code: string;
  name: string;
  description: string;
  category: FraudSignalCategory;
  field: string;
  operator: string;
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
  fraudScore: number;
  fraudBand: FraudScoreBand;
  outcome: FraudOutcome;
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
