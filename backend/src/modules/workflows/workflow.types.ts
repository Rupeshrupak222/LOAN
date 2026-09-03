// Step 35: Enterprise Dynamic Workflow Builder Types

export type WorkflowType =
  | 'LOAN_ORIGINATION'
  | 'HARDSHIP_RESTRUCTURING'
  | 'SETTLEMENT_RECOVERY'
  | 'PRODUCT_CUSTOM';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type GateOperator =
  | 'GTE'
  | 'LTE'
  | 'EQ'
  | 'NEQ'
  | 'IN'
  | 'BOOLEAN_TRUE'
  | 'BOOLEAN_FALSE';

export interface StageGateCriteria {
  field: string; // e.g. 'cibilScore', 'fraudScore', 'ekycVerified', 'bankStatementAnalyzed', 'loanAmount'
  operator: GateOperator;
  value: any;
  description: string;
}

export type TriggerActionType =
  | 'DISPATCH_COMMUNICATION'
  | 'TRIGGER_AI_COPILOT'
  | 'QUEUE_PAYOUT_BATCH'
  | 'NOTIFY_COMMITTEE';

export interface AutomatedTriggerAction {
  type: TriggerActionType;
  description: string;
  config?: Record<string, any>;
}

export interface BranchRule {
  conditionName: string;
  criteria: StageGateCriteria[];
  routeToStageCode: string;
  requiresDualApproval?: boolean;
}

export interface WorkflowStage {
  id: string;
  sequence: number;
  code: string;
  name: string;
  description: string;
  assigneeRole: string; // e.g. 'LOAN_OFFICER', 'UNDERWRITER', 'FINANCE_CONTROLLER', 'COMMITTEE'
  slaHours: number;
  entryCriteria: StageGateCriteria[];
  mandatoryGates: StageGateCriteria[];
  automatedTriggers: AutomatedTriggerAction[];
  branchRules: BranchRule[];
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  type: WorkflowType;
  code: string;
  name: string;
  description: string;
  version: number;
  status: WorkflowStatus;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowDto {
  type: WorkflowType;
  code: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
}

export interface EvaluateTransitionDto {
  workflowType: WorkflowType;
  currentStageCode: string;
  candidatePayload: Record<string, any>;
}

export interface WorkflowTransitionEvaluationResult {
  allowed: boolean;
  currentStageCode: string;
  targetStageCode: string;
  evaluatedBranch?: string;
  requiresDualApproval: boolean;
  gateCheckResults: Array<{
    criteria: string;
    passed: boolean;
    reason?: string;
  }>;
  executedTriggers: string[];
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
}
