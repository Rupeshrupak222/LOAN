/**
 * Phase 17: Core Lending Data Model & Operational Workflow Types
 */

export type ApplicationStage =
  | 'LEAD'
  | 'APPLICATION_STARTED'
  | 'APPLICATION_SUBMITTED'
  | 'DOCUMENT_VERIFICATION'
  | 'CREDIT_ASSESSMENT'
  | 'UNDERWRITING'
  | 'APPROVAL'
  | 'SANCTION'
  | 'DISBURSEMENT'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WITHDRAWN';

export type ApplicationOperationalStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFERRED'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';

export type TaskType =
  | 'DOCUMENT_VERIFICATION'
  | 'CREDIT_REVIEW'
  | 'RISK_ASSESSMENT'
  | 'UNDERWRITING_DECISION'
  | 'SANCTION_APPROVAL'
  | 'DISBURSEMENT_CHECK'
  | 'COLLECTION_FOLLOWUP'
  | 'CUSTOMER_KYC';

export type QueueKey =
  | 'OPERATIONS_QUEUE'
  | 'CREDIT_REVIEW_QUEUE'
  | 'RISK_QUEUE'
  | 'APPROVAL_QUEUE'
  | 'COLLECTIONS_QUEUE'
  | 'FINANCE_QUEUE';

export type ApprovalType =
  | 'SANCTION'
  | 'DISBURSEMENT'
  | 'RESTRUCTURE'
  | 'SETTLEMENT'
  | 'WAIVER'
  | 'POLICY_OVERRIDE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type ActivityType =
  | 'NOTE'
  | 'COMMENT'
  | 'CALL'
  | 'FOLLOWUP'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'STAGE_TRANSITION'
  | 'SYSTEM_EVENT';

export type IdentifierType =
  | 'PAN'
  | 'AADHAAR'
  | 'PASSPORT'
  | 'VOTER_ID'
  | 'DRIVING_LICENSE'
  | 'GSTIN';

export interface StageDefinition {
  stage: ApplicationStage;
  label: string;
  department: string;
  allowedNextStages: ApplicationStage[];
  defaultStatus: ApplicationOperationalStatus;
  slaHours: number;
}

export const STAGE_LIFECYCLE: Record<ApplicationStage, StageDefinition> = {
  LEAD: {
    stage: 'LEAD',
    label: 'Lead Ingestion',
    department: 'OPERATIONS',
    allowedNextStages: ['APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'CANCELLED', 'REJECTED'],
    defaultStatus: 'DRAFT',
    slaHours: 24,
  },
  APPLICATION_STARTED: {
    stage: 'APPLICATION_STARTED',
    label: 'Application In-Progress',
    department: 'OPERATIONS',
    allowedNextStages: ['APPLICATION_SUBMITTED', 'CANCELLED', 'WITHDRAWN'],
    defaultStatus: 'IN_PROGRESS',
    slaHours: 48,
  },
  APPLICATION_SUBMITTED: {
    stage: 'APPLICATION_SUBMITTED',
    label: 'Application Submitted',
    department: 'OPERATIONS',
    allowedNextStages: ['DOCUMENT_VERIFICATION', 'CANCELLED', 'REJECTED'],
    defaultStatus: 'SUBMITTED',
    slaHours: 12,
  },
  DOCUMENT_VERIFICATION: {
    stage: 'DOCUMENT_VERIFICATION',
    label: 'Document & KYC Verification',
    department: 'OPERATIONS',
    allowedNextStages: ['CREDIT_ASSESSMENT', 'REJECTED', 'CANCELLED'],
    defaultStatus: 'PENDING',
    slaHours: 24,
  },
  CREDIT_ASSESSMENT: {
    stage: 'CREDIT_ASSESSMENT',
    label: 'Credit Risk Assessment',
    department: 'CREDIT',
    allowedNextStages: ['UNDERWRITING', 'DOCUMENT_VERIFICATION', 'REJECTED'],
    defaultStatus: 'IN_PROGRESS',
    slaHours: 24,
  },
  UNDERWRITING: {
    stage: 'UNDERWRITING',
    label: 'Underwriting & Decisioning',
    department: 'CREDIT',
    allowedNextStages: ['APPROVAL', 'CREDIT_ASSESSMENT', 'REJECTED'],
    defaultStatus: 'PENDING',
    slaHours: 24,
  },
  APPROVAL: {
    stage: 'APPROVAL',
    label: 'Sanction Approval Committee',
    department: 'CREDIT',
    allowedNextStages: ['SANCTION', 'UNDERWRITING', 'REJECTED'],
    defaultStatus: 'PENDING',
    slaHours: 24,
  },
  SANCTION: {
    stage: 'SANCTION',
    label: 'Offer Sanction & Agreement',
    department: 'OPERATIONS',
    allowedNextStages: ['DISBURSEMENT', 'WITHDRAWN', 'CANCELLED'],
    defaultStatus: 'APPROVED',
    slaHours: 48,
  },
  DISBURSEMENT: {
    stage: 'DISBURSEMENT',
    label: 'Disbursement & Treasury Ops',
    department: 'FINANCE',
    allowedNextStages: ['DISBURSED', 'CANCELLED'],
    defaultStatus: 'PENDING',
    slaHours: 12,
  },
  DISBURSED: {
    stage: 'DISBURSED',
    label: 'Loan Disbursed',
    department: 'FINANCE',
    allowedNextStages: ['ACTIVE'],
    defaultStatus: 'COMPLETED',
    slaHours: 0,
  },
  ACTIVE: {
    stage: 'ACTIVE',
    label: 'Active Servicing Portfolio',
    department: 'OPERATIONS',
    allowedNextStages: ['CLOSED'],
    defaultStatus: 'COMPLETED',
    slaHours: 0,
  },
  CLOSED: {
    stage: 'CLOSED',
    label: 'Loan Closed & NOC Issued',
    department: 'OPERATIONS',
    allowedNextStages: [],
    defaultStatus: 'COMPLETED',
    slaHours: 0,
  },
  REJECTED: {
    stage: 'REJECTED',
    label: 'Application Rejected',
    department: 'CREDIT',
    allowedNextStages: [],
    defaultStatus: 'REJECTED',
    slaHours: 0,
  },
  CANCELLED: {
    stage: 'CANCELLED',
    label: 'Application Cancelled',
    department: 'OPERATIONS',
    allowedNextStages: [],
    defaultStatus: 'CANCELLED',
    slaHours: 0,
  },
  WITHDRAWN: {
    stage: 'WITHDRAWN',
    label: 'Applicant Withdrawn',
    department: 'OPERATIONS',
    allowedNextStages: [],
    defaultStatus: 'CANCELLED',
    slaHours: 0,
  },
};
