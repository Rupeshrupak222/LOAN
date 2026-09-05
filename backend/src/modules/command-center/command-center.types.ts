export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AnomalyStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export type AnomalyPatternType =
  | 'APPROVAL_LIMIT_CLUSTERING'
  | 'BRANCH_REJECTION_SPIKE'
  | 'GATEWAY_RECURRING_FAILURES'
  | 'PARTNER_DELINQUENCY_ANOMALY';

export interface PolicyAnomalyRecord {
  id: string;
  patternType: AnomalyPatternType;
  title: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  detectedAt: string;
  entityType: 'USER' | 'BRANCH' | 'INTEGRATION_GATEWAY' | 'PARTNER';
  entityId: string;
  entityName: string;
  explainableEvidence: Record<string, any>;
  recommendedAction: string;
  actionTaken?: {
    action: 'ACKNOWLEDGE' | 'INVESTIGATE' | 'RESOLVE' | 'DISMISS';
    officerEmail: string;
    actionNote: string;
    actionTimestamp: string;
  };
}

export interface OperationalHealthSummary {
  timestamp: string;
  originationsVelocity: {
    totalApplications: number;
    totalRequestedAmount: number;
    submitted24h: number;
    velocityStatus: 'NORMAL' | 'HIGH' | 'SURGING';
  };
  underwritingBottlenecks: {
    pendingReview: number;
    staleOver48h: number;
    bottleneckRisk: 'LOW' | 'MODERATE' | 'HIGH';
  };
  disbursementsQueue: {
    pendingDisbursements: number;
    totalDisbursedVolume: number;
    activeDisbursedLoans: number;
  };
  portfolioDelinquency: {
    totalActivePrincipal: number;
    par30Amount: number;
    par30RatePct: number;
    par90Amount: number;
    par90RatePct: number;
    delinquencyRiskTier: 'LOW' | 'ELEVATED' | 'HIGH';
  };
  fraudClusterAlerts: {
    unresolvedFraudSignals: number;
    activeClusters: number;
    highestRiskScore: number;
  };
  integrationHealth: {
    totalCallsLogged: number;
    overallUptimePct: number;
    circuitBreakersTripped: number;
    status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  };
  reconciliationSummary: {
    unresolvedExceptions: number;
    pendingAdjustmentApprovals: number;
  };
}

export interface ExecutiveQueryRequest {
  query: string;
}

export interface ExecutiveQueryResponse {
  query: string;
  intent: string;
  answerSummary: string;
  structuredMetrics: Record<string, any>;
  evidenceTable?: Array<Record<string, any>>;
  generatedAt: string;
}

export interface HumanOversightActionRequest {
  action: 'ACKNOWLEDGE' | 'INVESTIGATE' | 'RESOLVE' | 'DISMISS';
  note: string;
}
