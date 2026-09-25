export type CanonicalLifecycleState =
  | 'CUSTOMER_CREATED'
  | 'KYC_PENDING'
  | 'KYC_VERIFIED'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'CREDIT_ASSESSMENT'
  | 'BRANCH_MANAGER_REVIEW'
  | 'BRANCH_MANAGER_APPROVED'
  | 'UNDERWRITING'
  | 'SANCTIONED'
  | 'OFFER_PENDING'
  | 'OFFER_ACCEPTED'
  | 'AGREEMENT_PENDING'
  | 'ESIGN_PENDING'
  | 'AGREEMENT_COMPLETED'
  | 'FINANCE_PENDING'
  | 'PRE_DISBURSEMENT'
  | 'MAKER_PENDING'
  | 'CHECKER_PENDING'
  | 'DISBURSEMENT_PROCESSING'
  | 'DISBURSED'
  | 'LOAN_ACTIVE'
  | 'SERVICING'
  | 'OVERDUE'
  | 'COLLECTIONS'
  | 'CLOSED';

export type OrchestrationStageGroup =
  | 'INTAKE_KYC'
  | 'CREDIT_BRANCH_REVIEW'
  | 'UNDERWRITING_SANCTION'
  | 'OFFER_AGREEMENT'
  | 'FINANCE_DISBURSEMENT'
  | 'LOAN_SERVICING'
  | 'COLLECTIONS_CLOSURE';

export interface GatePrerequisite {
  key: string;
  label: string;
  passed: boolean;
  domain: string;
  requiredCondition: string;
  failureReason?: string;
}

export interface CrossDomainGateStatus {
  gateKey: string;
  sourceDomain: string;
  targetDomain: string;
  sourceState: CanonicalLifecycleState;
  targetState: CanonicalLifecycleState;
  allowed: boolean;
  prerequisites: GatePrerequisite[];
  blockingReasons: string[];
}

export interface UnifiedTimelineEvent {
  id: string;
  timestamp: string;
  domain: string;
  action: string;
  actor: {
    id?: string;
    email?: string;
    role?: string;
    name?: string;
  };
  fromState?: string;
  toState?: string;
  reason?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  isInternalOnly?: boolean;
}

export interface UnifiedLifecycleProjection {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerName: string;
  productName: string;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  outstandingBalance?: number;
  currentState: CanonicalLifecycleState;
  stageGroup: OrchestrationStageGroup;
  currentAssigneeRole: string;
  currentAssigneeScope: 'BRANCH' | 'TENANT' | 'SYSTEM' | 'CUSTOMER';
  nextPermittedActions: Array<{
    actionKey: string;
    label: string;
    requiredRole: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT';
    isRemediation?: boolean;
  }>;
  blockingReasons: string[];
  activeRemediations: Array<{
    remediationKey: string;
    stage: string;
    reason: string;
    requiredAction: string;
    issuedByRole: string;
    issuedAt: string;
  }>;
  slaInfo: {
    stageCode: string;
    stageSlaHours: number;
    elapsedHours: number;
    isBreached: boolean;
    remainingHours: number;
  };
  domainStates: {
    applicationStatus: string;
    kycStatus: string;
    creditAssessmentStatus?: string;
    branchManagerStatus?: string;
    underwritingStatus?: string;
    sanctionStatus?: string;
    offerStatus?: string;
    agreementStatus?: string;
    financeStatus?: string;
    disbursementStatus?: string;
    loanStatus?: string;
    collectionStatus?: string;
  };
}

export interface BorrowerSafeJourneyStep {
  key: string;
  label: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ACTION_REQUIRED';
  timestamp?: string;
  actionRequiredLabel?: string;
  actionUrl?: string;
}

export interface BorrowerSafeJourneyProjection {
  applicationId: string;
  applicationNo: string;
  currentStepKey: string;
  currentStepLabel: string;
  overallProgressPercent: number;
  steps: BorrowerSafeJourneyStep[];
  updatedAt: string;
}

export interface ReconciliationAnomaly {
  id: string;
  applicationId: string;
  applicationNo: string;
  anomalyType:
    | 'UNAUTHORIZED_DIRECT_UW_ROUTING'
    | 'OFFER_WITHOUT_SANCTION'
    | 'AGREEMENT_WITHOUT_ACCEPTED_OFFER'
    | 'FINANCE_WITHOUT_EXECUTED_AGREEMENT'
    | 'DISBURSEMENT_WITHOUT_FINANCE_READINESS'
    | 'ACTIVE_LOAN_WITHOUT_DISBURSEMENT'
    | 'COLLECTIONS_WITHOUT_DELINQUENCY'
    | 'CLOSED_WITH_OUTSTANDING_BALANCE'
    | 'ORPHANED_APPROVAL_TASK'
    | 'STATUS_DESYNC';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  detectedAt: string;
  domainAffected: string;
  suggestedRepairAction: string;
  repairable: boolean;
}

export interface OrchestrationTransitionDto {
  applicationId: string;
  action:
    | 'CREDIT_SUBMIT_TO_BRANCH_MANAGER'
    | 'BRANCH_MANAGER_APPROVE'
    | 'BRANCH_MANAGER_FORWARD_TO_UNDERWRITER'
    | 'BRANCH_MANAGER_SEND_BACK'
    | 'UNDERWRITER_SANCTION'
    | 'UNDERWRITER_SEND_BACK'
    | 'GENERATE_OFFER'
    | 'ACCEPT_OFFER'
    | 'GENERATE_AGREEMENT'
    | 'EXECUTE_AGREEMENT_ESIGN'
    | 'NOTIFY_FINANCE_READY'
    | 'SUBMIT_PRE_DISBURSEMENT_MAKER'
    | 'APPROVE_PRE_DISBURSEMENT_CHECKER'
    | 'EXECUTE_DISBURSEMENT'
    | 'RECORD_REPAYMENT'
    | 'TRIGGER_COLLECTIONS'
    | 'CLOSE_LOAN_ACCOUNT';
  reason?: string;
  remarks?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}
