// Step 44: SLA & Support Platform Types

export type SeverityLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type IncidentLifecycleStage =
  | 'DETECTED'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'MITIGATING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'POSTMORTEM';

export type TicketCategory =
  | 'SYSTEM_OUTAGE'
  | 'DISBURSEMENT_FAILURE'
  | 'REPAYMENT_DISCREPANCY'
  | 'BUREAU_INTEGRATION'
  | 'UNDERWRITING_EXCEPTION'
  | 'ACCESS_CONTROL'
  | 'GENERAL_INQUIRY';

export type EscalationTeam = 'SUPPORT_TIER_1' | 'ENGINEERING' | 'SECURITY' | 'FINANCE_OPS' | 'COMPLIANCE' | 'INTEGRATION_OWNER';

export interface SlaTargetThresholds {
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: TicketCategory;
  severity: SeverityLevel;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  assignedTeam: EscalationTeam;
  customerEmail: string;
  responseDeadline: string;
  resolutionDeadline: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  resolutionNotes?: string;
  comments: Array<{
    id: string;
    authorEmail: string;
    authorRole: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseIncident {
  id: string;
  tenantId: string;
  title: string;
  impactedService: string;
  severity: SeverityLevel;
  stage: IncidentLifecycleStage;
  ownerEmail: string;
  impactSummary: string;
  rootCause?: string;
  mitigationSteps?: string;
  postmortem?: {
    timeline: Array<{ timestamp: string; event: string }>;
    rootCauseAnalysis: string;
    contributingFactors: string[];
    preventativeActions: Array<{ action: string; owner: string; status: 'PENDING' | 'DONE' }>;
    publishedAt: string;
    publishedBy: string;
  };
  startedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  category: TicketCategory;
  severity: SeverityLevel;
  tenantId?: string;
  customerEmail: string;
}

export interface CreateIncidentDto {
  title: string;
  impactedService: string;
  severity: SeverityLevel;
  tenantId?: string;
  impactSummary: string;
}

export interface SlaMetricsReport {
  tenantId: string;
  totalTickets: number;
  resolvedCount: number;
  openCount: number;
  responseBreachedCount: number;
  resolutionBreachedCount: number;
  slaCompliancePercentage: number;
  meanTimeToAcknowledgeMinutes: number;
  meanTimeToResolveMinutes: number;
  incidentsSummary: {
    totalIncidents: number;
    p1CriticalCount: number;
    p2HighCount: number;
    activeIncidentsCount: number;
  };
}
