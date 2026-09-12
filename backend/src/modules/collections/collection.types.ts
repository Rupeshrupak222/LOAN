// Phase 11: Collections & Recovery Domain Types and Interfaces

export type CollectionAgingBucket = '0-30' | '31-60' | '61-90' | '91-180' | '180+';

export type CollectionPriorityBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CollectionCaseStatus =
  | 'CURRENT'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PROMISED'
  | 'BROKEN_PTP'
  | 'ESCALATED'
  | 'LEGAL_REVIEW'
  | 'SETTLEMENT_REVIEW'
  | 'WRITTEN_OFF'
  | 'RESOLVED'
  | 'CLOSED';

export type CollectionStrategyPhase =
  | 'REMINDER'
  | 'REMINDER_AND_QUEUE'
  | 'COLLECTOR_ASSIGNMENT'
  | 'ESCALATED_COLLECTION'
  | 'RECOVERY_LEGAL_REVIEW';

export type PtpStatus = 'CREATED' | 'PENDING' | 'ACTIVE' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'BROKEN' | 'CANCELLED' | 'KEPT';

export interface CollectionActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'ESCALATED';

export type EscalationTier = 'TIER_1_COLLECTOR' | 'TIER_2_SUPERVISOR' | 'TIER_3_COLLECTION_MANAGER' | 'TIER_4_LEGAL_RECOVERY';

export type SettlementStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SETTLED' | 'EXPIRED';

export type WriteOffStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED';

export type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type ContactChannel = 'PHONE' | 'SMS' | 'EMAIL' | 'IN_APP' | 'FIELD_VISIT' | 'WHATSAPP';

export type ContactOutcome =
  | 'CONTACTED'
  | 'NO_ANSWER'
  | 'WRONG_NUMBER'
  | 'PROMISE_TO_PAY'
  | 'DISPUTE'
  | 'REFUSED'
  | 'ESCALATED'
  | 'SETTLEMENT_REQUESTED';

export interface DpdCalculationResult {
  loanId: string;
  loanNo: string;
  totalScheduledAmount: number;
  totalPaidAmount: number;
  totalOverdueAmount: number;
  oldestOverdueDate: string | null;
  oldestInstallmentNumber: number | null;
  dpd: number;
  agingBucket: CollectionAgingBucket;
  status: CollectionCaseStatus;
  isDelinquent: boolean;
  overdueInstallmentsCount: number;
}

export interface CollectionPriorityFactors {
  dpdScore: number;
  overdueAmountScore: number;
  riskGradeScore: number;
  brokenPtpScore: number;
  contactabilityScore: number;
}

export interface CollectionPriorityScore {
  score: number; // 0 - 100
  band: CollectionPriorityBand;
  factors: CollectionPriorityFactors;
  recommendedAction: string;
  strategyPhase: CollectionStrategyPhase;
}

export interface CollectionBucketDefinition {
  code: CollectionAgingBucket;
  name: string;
  minDpd: number;
  maxDpd: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface StrategyRule {
  id: string;
  name: string;
  minDpd: number;
  maxDpd: number;
  minOverdueAmount?: number;
  riskGrades?: string[]; // e.g. ['A', 'B', 'C', 'D', 'E']
  action: CollectionStrategyPhase;
  priorityBand: CollectionPriorityBand;
  autoAssign: boolean;
  slaHours: number;
}

export interface CollectionStrategyDefinition {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  version: number;
  status: StrategyStatus;
  effectiveDate: string;
  productScope?: string[]; // Empty for all products
  buckets: CollectionBucketDefinition[];
  rules: StrategyRule[];
  priorityWeights: {
    dpdWeight: number; // e.g. 0.35
    overdueAmountWeight: number; // e.g. 0.25
    riskGradeWeight: number; // e.g. 0.15
    brokenPtpWeight: number; // e.g. 0.15
    contactabilityWeight: number; // e.g. 0.10
  };
  escalationThresholds: {
    brokenPtpCount: number;
    maxDpdBeforeLegal: number;
    slaBreachHours: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionAssignmentRecord {
  id: string;
  caseId: string;
  assignedToUserId: string;
  assignedToUserName?: string;
  assignedByUserId: string;
  assignedByUserName?: string;
  strategy: 'MANUAL' | 'ROUND_ROBIN' | 'WORKLOAD_BALANCED' | 'PRODUCT_SPECIALIST' | 'HIGH_TICKET';
  status: 'UNASSIGNED' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS';
  notes?: string;
  assignedAt: string;
}

export interface CollectionContactRecord {
  id: string;
  caseId: string;
  channel: ContactChannel;
  outcome: ContactOutcome;
  notes: string;
  contactedPersonName?: string;
  customerResponse?: string;
  nextFollowUpDate?: string;
  performedBy: string;
  createdAt: string;
}

export interface PtpRecord {
  id: string;
  caseId: string;
  loanId: string;
  promisedAmount: number;
  promisedDate: string;
  paymentMode: string;
  status: PtpStatus;
  fulfilledAmount?: number;
  fulfilledAt?: string;
  paymentReference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionFollowUpRecord {
  id: string;
  caseId: string;
  loanId: string;
  assignedToUserId: string;
  dueDate: string;
  priority: CollectionPriorityBand;
  actionTitle: string;
  notes?: string;
  status: FollowUpStatus;
  completedAt?: string;
  completedNotes?: string;
  createdAt: string;
}

export interface CollectionEscalationRecord {
  id: string;
  caseId: string;
  loanId: string;
  triggerReason: string;
  fromTier: EscalationTier;
  toTier: EscalationTier;
  escalatedByUserId: string;
  escalatedToUserId?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SettlementRequestRecord {
  id: string;
  caseId: string;
  loanId: string;
  customerId: string;
  tenantId?: string;
  totalOutstanding: number;
  principalOutstanding: number;
  interestOutstanding: number;
  penaltiesOutstanding: number;
  proposedSettlementAmount: number;
  proposedWaiverAmount: number;
  discountPct: number;
  reason: string;
  validityDate: string;
  status: SettlementStatus;
  proposedByUserId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WriteOffRequestRecord {
  id: string;
  caseId: string;
  loanId: string;
  customerId: string;
  tenantId?: string;
  principalOutstanding: number;
  interestOutstanding: number;
  penaltiesOutstanding: number;
  totalWriteOffAmount: number;
  dpd: number;
  reason: string;
  recoveryExhaustionSummary: string;
  status: WriteOffStatus;
  proposedByUserId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactabilitySignals {
  lastContactDate: string | null;
  lastContactOutcome: ContactOutcome | null;
  totalContactAttempts: number;
  successfulContactsCount: number;
  failedContactsCount: number;
  preferredChannel: ContactChannel;
  preferredContactTime: string;
  brokenPtpCount: number;
  keptPtpCount: number;
}

export interface BorrowerSafeCollectionSummary {
  loanId: string;
  loanNo: string;
  totalDueAmount: number;
  nextDueDate: string | null;
  dpd: number;
  statusMessage: string;
  isOverdue: boolean;
  activePtp: {
    promisedAmount: number;
    promisedDate: string;
    status: string;
  } | null;
  paymentLinkAvailable: boolean;
  supportContact: string;
}

export interface PartnerSafeCollectionSummary {
  loanId: string;
  loanNo: string;
  partnerId?: string;
  dpd: number;
  agingBucket: CollectionAgingBucket;
  overdueAmount: number;
  collectionStatus: string;
  hasActivePtp: boolean;
  lastPaymentDate: string | null;
}
