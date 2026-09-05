export type SystemEntity =
  | 'APPLICATION'
  | 'CUSTOMER'
  | 'LOAN'
  | 'PAYMENT'
  | 'COLLECTION_CASE'
  | 'DOCUMENT'
  | 'PORTFOLIO';

export type SystemEventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SystemEvent<T = any> {
  eventId: string;
  eventType: string;
  entityType: SystemEntity;
  entityId: string;
  customerId?: string;
  applicationId?: string;
  loanId?: string;
  occurredAt: string;
  source: string;
  correlationId: string;
  previousValue?: T;
  currentValue?: T;
  severity: SystemEventSeverity;
  metadata?: Record<string, any>;
}

export type WarningDomain = 'APPLICATION' | 'FINANCIAL' | 'CREDIT' | 'FRAUD' | 'COLLECTIONS';

export type WarningPriority = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WarningStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type WarningRuleCode =
  | 'APP_SLA_BREACH'
  | 'APP_REPEATED_SEND_BACK'
  | 'APP_CRITICAL_DATA_MUTATED'
  | 'FIN_INCOME_DROP'
  | 'FIN_LIQUIDITY_STRESS'
  | 'FIN_CASH_BURN_VELOCITY'
  | 'CRED_RISK_SCORE_DROP'
  | 'CRED_DPD_THRESHOLD_30'
  | 'CRED_DPD_THRESHOLD_60'
  | 'CRED_REPEATED_BOUNCE'
  | 'FRAUD_NEW_HIGH_RISK'
  | 'COLL_BROKEN_PTP';

export interface EarlyWarningAlert {
  warningId: string;
  ruleCode: WarningRuleCode;
  domain: WarningDomain;
  title: string;
  priority: WarningPriority;
  status: WarningStatus;
  entityType: SystemEntity;
  entityId: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  applicationId?: string;
  applicationNo?: string;
  loanId?: string;
  loanNo?: string;
  whatHappened: string;
  whyItMatters: string;
  source: string;
  evidence: string;
  detectedAt: string;
  lastEscalatedAt?: string;
  triggerCount: number;
  recommendedHumanAction: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  dismissedBy?: string;
  dismissedAt?: string;
  dismissalReason?: string;
  aiAdvisory?: {
    rootCauseAnalysis: string;
    benignVsRiskHypothesis: string;
    investigationQuestions: string[];
  };
}

export interface EarlyWarningStats {
  totalActiveWarnings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byDomain: Record<WarningDomain, number>;
  byStatus: Record<WarningStatus, number>;
}
