// Phase 3: Approval Authority Matrix & Workflow Domain Types (Frontend)

import { DecisionOutcome, RiskGrade } from '../decision-engine/types';

export type AuthorityScope = 'TENANT' | 'PRODUCT' | 'BRANCH' | 'CUSTOMER_SEGMENT';

export type ApprovalTaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT_BACK'
  | 'ESCALATED'
  | 'DELEGATED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ApprovalActionType =
  | 'APPROVE'
  | 'REJECT'
  | 'SEND_BACK'
  | 'ESCALATE'
  | 'DELEGATE'
  | 'RETURN_FOR_CLARIFICATION';

export type DelegationStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApprovalLevelDefinition {
  level: number;
  code: string;
  name: string;
  description: string;
  roles: string[];
  minAmount: number;
  maxAmount: number;
  allowedRiskGrades: RiskGrade[];
  allowedDecisions: DecisionOutcome[];
  scope: AuthorityScope;
  branchRestricted: boolean;
  slaHours: number;
  requiresSequentialPreviousApproval: boolean;
  escalationTargetLevel?: number;
  canSendBack: boolean;
  canOverrideBreRejection?: boolean;
}

export interface ApprovalAuthorityPolicy {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  productId?: string;
  productCode?: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  levels: ApprovalLevelDefinition[];
  multiLevelApprovalEnabled: boolean;
  maxDelegationDays: number;
  sodRules: {
    preventApplicantApproval: boolean;
    preventOriginatorApproval: boolean;
    preventDisbursementMakerApproval: boolean;
    requireFourEyesOnHighRisk: boolean;
  };
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthorityPolicyDto {
  code: string;
  name: string;
  description: string;
  productId?: string;
  productCode?: string;
  levels: ApprovalLevelDefinition[];
  multiLevelApprovalEnabled?: boolean;
  maxDelegationDays?: number;
  sodRules?: ApprovalAuthorityPolicy['sodRules'];
}

export interface UpdateAuthorityPolicyDto extends Partial<CreateAuthorityPolicyDto> {
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface ResolvedAuthorityResult {
  applicationId: string;
  tenantId: string;
  productId: string;
  policyId: string;
  policyCode: string;
  policyVersion: number;
  requestedAmount: number;
  eligibleAmount: number;
  riskGrade: RiskGrade;
  breDecision: DecisionOutcome;
  requiredLevels: ApprovalLevelDefinition[];
  currentLevelIndex: number;
  currentLevel: ApprovalLevelDefinition | null;
  isCompleted: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  resolutionReason: string;
}

export interface ApprovalTask {
  id: string;
  applicationId: string;
  applicationNo: string;
  tenantId: string;
  branchId?: string;
  customerName: string;
  customerId: string;
  productCode: string;
  amount: number;
  eligibleAmount: number;
  riskGrade: RiskGrade;
  riskScore: number;
  breDecision: DecisionOutcome;
  policyId: string;
  policyVersion: number;
  level: number;
  levelCode: string;
  levelName: string;
  assignedRoles: string[];
  assignedUserId?: string;
  status: ApprovalTaskStatus;
  slaDueAt: string;
  slaBreached: boolean;
  action?: ApprovalActionType;
  actionBy?: string;
  actionByName?: string;
  actionByRole?: string;
  actionAt?: string;
  actionReason?: string;
  actionComments?: string;
  sendBackTargetStage?: string;
  escalatedToLevel?: number;
  delegatedToUserId?: string;
  conditions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthorityDelegation {
  id: string;
  tenantId: string;
  delegatorUserId: string;
  delegatorName: string;
  delegatorRole: string;
  delegateUserId: string;
  delegateName: string;
  delegateRole: string;
  scope: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: DelegationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDelegationDto {
  delegateUserId: string;
  delegateRole: string;
  startDate: string;
  endDate: string;
  reason: string;
  scope?: string;
}

export interface ApprovalSnapshotRecord {
  id: string;
  applicationId: string;
  taskId: string;
  tenantId: string;
  level: number;
  levelCode: string;
  action: ApprovalActionType;
  actionBy: string;
  actionByName: string;
  actionByRole: string;
  reason?: string;
  comments?: string;
  targetStage?: string;
  policyVersion: number;
  applicationStateAfter: string;
  timestamp: string;
}

export interface SubmitApprovalActionDto {
  action: ApprovalActionType;
  reason?: string;
  comments: string;
  sendBackTargetStage?: string;
  escalateToLevel?: number;
  delegateToUserId?: string;
}
