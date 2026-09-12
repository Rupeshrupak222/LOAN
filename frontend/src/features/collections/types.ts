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

export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'ESCALATED';

export type EscalationTier = 'TIER_1_COLLECTOR' | 'TIER_2_SUPERVISOR' | 'TIER_3_COLLECTION_MANAGER' | 'TIER_4_LEGAL_RECOVERY';

export type SettlementStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SETTLED' | 'EXPIRED';

export type WriteOffStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED';

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

export interface CollectionCaseSummary {
  id: string;
  caseNo: string;
  loanId: string;
  loanNo: string;
  emiAmount: string;
  nextDueDate: string | null;
  customerName: string;
  customerCode: string;
  mobile: string;
  city: string | null;
  dpd: number;
  agingBucket: CollectionAgingBucket;
  overdueAmount: string;
  status: CollectionCaseStatus;
  priority: CollectionPriorityBand;
  priorityScore: number;
  recommendedAction: string;
  strategyPhase: CollectionStrategyPhase;
  assignedOfficerId: string | null;
  activitiesCount: number;
  promisesCount: number;
  lastActivityDate: string | null;
  lastActivityOutcome: string | null;
  lastActivityNotes: string | null;
  nextFollowUpDate: string | null;
  latestPtpAmount: string | null;
  latestPtpDate: string | null;
  latestPtpStatus: string | null;
  createdAt: string;
}

export interface CollectionCaseDetail extends CollectionCaseSummary {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    customerCode: string;
    mobile: string;
    email?: string;
    city?: string;
    addresses?: any[];
    employmentDetails?: any[];
  };
  loan: {
    id: string;
    loanNo: string;
    principal: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    status: string;
    product?: { code: string; name: string };
    schedule: Array<{
      id: string;
      emiNumber: number;
      dueDate: string;
      principal: number;
      interest: number;
      totalDue: number;
      paidAmount: number;
      outstanding: number;
      penaltyAmount: number;
      status: string;
    }>;
  };
  activities: Array<{
    id: string;
    activityType: ContactChannel;
    outcome: ContactOutcome;
    notes: string;
    nextFollowUpDate?: string;
    performedBy: string;
    createdAt: string;
  }>;
  promises: Array<{
    id: string;
    promisedAmount: number;
    promisedDate: string;
    paymentMode?: string;
    status: PtpStatus;
    recordedBy: string;
    createdAt: string;
  }>;
  contactability: {
    lastContactDate: string | null;
    lastContactOutcome: ContactOutcome | null;
    totalContactAttempts: number;
    successfulContactsCount: number;
    failedContactsCount: number;
    preferredChannel: ContactChannel;
    preferredContactTime: string;
    brokenPtpCount: number;
    keptPtpCount: number;
  };
  followUps: Array<{
    id: string;
    dueDate: string;
    priority: CollectionPriorityBand;
    actionTitle: string;
    notes?: string;
    status: FollowUpStatus;
    completedAt?: string;
    completedNotes?: string;
  }>;
  escalations: Array<{
    id: string;
    triggerReason: string;
    fromTier: EscalationTier;
    toTier: EscalationTier;
    status: string;
    createdAt: string;
  }>;
  settlements: Array<{
    id: string;
    totalOutstanding: number;
    proposedSettlementAmount: number;
    proposedWaiverAmount: number;
    discountPct: number;
    reason: string;
    status: SettlementStatus;
    validityDate: string;
    approvedByUserId?: string;
  }>;
  writeOffs: Array<{
    id: string;
    principalOutstanding: number;
    totalWriteOffAmount: number;
    reason: string;
    status: WriteOffStatus;
    approvedByUserId?: string;
  }>;
}

export interface CollectionDashboardData {
  summary: {
    activeCases: number;
    totalOverdueAmount: number;
    pendingPtps: number;
    dueTodayPtps: number;
    brokenPtps: number;
    keptPtps: number;
    collectionsRecovered: number;
  };
  agingBuckets: Array<{
    bucket: CollectionAgingBucket;
    count: number;
    totalAmount: number;
  }>;
}

export interface CollectionStrategy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveDate: string;
  productScope?: string[];
  rules: Array<{
    id: string;
    name: string;
    minDpd: number;
    maxDpd: number;
    action: CollectionStrategyPhase;
    priorityBand: CollectionPriorityBand;
    slaHours: number;
  }>;
  priorityWeights: {
    dpdWeight: number;
    overdueAmountWeight: number;
    riskGradeWeight: number;
    brokenPtpWeight: number;
    contactabilityWeight: number;
  };
}

export interface RollForwardMetric {
  bucket: string;
  beginningCount: number;
  beginningAmount: number;
  rollForwardCount: number;
  rollForwardAmount: number;
  rollBackCount: number;
  rollBackAmount: number;
  endingCount: number;
  endingAmount: number;
}

export interface CollectorScorecard {
  officerId: string;
  officerName: string;
  officerEmail: string;
  assignedCasesCount: number;
  contactedCasesCount: number;
  contactRatePct: number;
  ptpCreatedCount: number;
  ptpKeptCount: number;
  ptpBrokenCount: number;
  ptpFulfillmentRatePct: number;
  totalRecoveredAmount: number;
  slaAdherencePct: number;
}
