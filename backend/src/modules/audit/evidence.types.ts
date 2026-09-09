// Step 31: Audit & Compliance Evidence Framework Types

export type EvidenceEventType =
  | 'USER_AUTH'
  | 'KYC_VERIFICATION'
  | 'CREDIT_UNDERWRITING'
  | 'LOAN_SANCTION'
  | 'DISBURSEMENT_EXECUTION'
  | 'PAYMENT_LEDGER'
  | 'COLLECTION_RECOVERY'
  | 'POLICY_CONFIGURATION_CHANGE'
  | 'INTEGRATION_DISPATCH'
  | 'CONSENT_LIFECYCLE'
  | 'PERMISSION_CHANGE'
  | 'WORKFLOW_TRANSITION';

export interface EvidenceNode {
  id: string;
  tenantId: string;
  eventType: EvidenceEventType;
  actorId: string;
  actorRole: string;
  actorEmail: string;
  entityType: string;
  entityId: string;
  action: string;
  correlationId: string;
  policyVersion?: string;
  ipAddress?: string;
  previousHash: string;
  evidenceHash: string;
  beforeState?: any;
  afterState?: any;
  timestamp: string;
}

export interface EvidenceTimelineItem {
  nodeId: string;
  stepName: string;
  actor: string;
  role: string;
  timestamp: string;
  evidenceHash: string;
  details: string;
}

export interface SupportingEvidenceRef {
  type: string;
  id: string;
  title: string;
  referenceUrl?: string;
  timestamp: string;
}

export interface EvidencePackage {
  packageId: string;
  tenantId: string;
  entityType: 'APPLICATION' | 'LOAN' | 'CUSTOMER';
  entityId: string;
  generatedAt: string;
  generatedBy: string;
  integrityVerified: boolean;
  totalEventsCount: number;
  timeline: EvidenceTimelineItem[];
  supportingEvidence: SupportingEvidenceRef[];
  aiSummaryAdvisory: string;
}

export interface AuditExportFilter {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  entity?: string;
  actorRole?: string;
  correlationId?: string;
  format?: 'JSON' | 'CSV';
}
