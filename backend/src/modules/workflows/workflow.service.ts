import { v4 as uuid } from 'uuid';
import {
  WorkflowType,
  WorkflowDefinition,
  WorkflowStage,
  CreateWorkflowDto,
  EvaluateTransitionDto,
  WorkflowTransitionEvaluationResult,
  StageGateCriteria,
} from './workflow.types';
import { evidenceAuditService } from '../audit/evidence.service';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

export class WorkflowService {
  private static instance: WorkflowService;

  // In-memory store: Map<`${tenantId}:${type}`, WorkflowDefinition>
  private readonly workflows = new Map<string, WorkflowDefinition>();

  private constructor() {
    this.seedCanonicalWorkflows('tenant-adyapan-default');
    this.seedCanonicalWorkflows('tenant-apex-nbfc');
  }

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  public seedCanonicalWorkflows(tenantId: string): void {
    const now = new Date().toISOString();

    // 1. Digital Loan Origination Workflow
    const originationStages: WorkflowStage[] = [
      {
        id: 'stg-orig-1',
        sequence: 1,
        code: 'LEAD_SUBMISSION',
        name: 'Lead Submission & Capture',
        description: 'Borrower initiates application and inputs requested loan amount and basic KYC details',
        assigneeRole: 'LOAN_OFFICER',
        slaHours: 2,
        entryCriteria: [],
        mandatoryGates: [],
        automatedTriggers: [
          { type: 'DISPATCH_COMMUNICATION', description: 'Send Application Acknowledgment SMS & Email' },
        ],
        branchRules: [],
      },
      {
        id: 'stg-orig-2',
        sequence: 2,
        code: 'IDENTITY_EKYC',
        name: 'Identity & eKYC Verification',
        description: 'Digilocker / NSDL PAN verification and statutory eKYC identity verification',
        assigneeRole: 'LOAN_OFFICER',
        slaHours: 2,
        entryCriteria: [],
        mandatoryGates: [
          { field: 'ekycVerified', operator: 'BOOLEAN_TRUE', value: true, description: 'Statutory eKYC must be verified' },
          { field: 'panValidated', operator: 'BOOLEAN_TRUE', value: true, description: 'PAN record must be active with NSDL' },
        ],
        automatedTriggers: [
          { type: 'TRIGGER_AI_COPILOT', description: 'Run Document OCR & Face Match Verification' },
        ],
        branchRules: [],
      },
      {
        id: 'stg-orig-3',
        sequence: 3,
        code: 'BUREAU_FRAUD_ASSESSMENT',
        name: 'Bureau & Risk Analysis',
        description: 'CIBIL/Experian score extraction, FOIR computation, and fraud anomaly detection',
        assigneeRole: 'UNDERWRITER',
        slaHours: 4,
        entryCriteria: [
          { field: 'ekycVerified', operator: 'BOOLEAN_TRUE', value: true, description: 'Identity verified' },
        ],
        mandatoryGates: [
          { field: 'cibilScore', operator: 'GTE', value: 650, description: 'Minimum CIBIL bureau score 650' },
          { field: 'fraudScore', operator: 'LTE', value: 50, description: 'Maximum Fraud Risk Score 50' },
        ],
        automatedTriggers: [
          { type: 'TRIGGER_AI_COPILOT', description: 'Synthesize Underwriting Credit Memo with Gemini' },
        ],
        branchRules: [
          {
            conditionName: 'Fast-Track Prime Borrower Routing',
            criteria: [
              { field: 'cibilScore', operator: 'GTE', value: 780, description: 'CIBIL Score >= 780' },
              { field: 'employmentType', operator: 'EQ', value: 'SALARIED', description: 'Salaried Employment' },
            ],
            routeToStageCode: 'SANCTION_DISBURSEMENT',
            requiresDualApproval: false,
          },
          {
            conditionName: 'High-Value Committee Escalation',
            criteria: [
              { field: 'loanAmount', operator: 'GTE', value: 500000, description: 'Loan Amount >= ₹5,00,000' },
            ],
            routeToStageCode: 'COMMITTEE_SANCTION',
            requiresDualApproval: true,
          },
        ],
      },
      {
        id: 'stg-orig-4',
        sequence: 4,
        code: 'UNDERWRITING_REVIEW',
        name: 'Credit Underwriter Review',
        description: 'Detailed banking statement analysis, debt obligations review, and sanction sign-off',
        assigneeRole: 'UNDERWRITER',
        slaHours: 6,
        entryCriteria: [],
        mandatoryGates: [
          { field: 'bankStatementAnalyzed', operator: 'BOOLEAN_TRUE', value: true, description: 'Account Aggregator bank statement analyzed' },
        ],
        automatedTriggers: [],
        branchRules: [],
      },
      {
        id: 'stg-orig-5',
        sequence: 5,
        code: 'COMMITTEE_SANCTION',
        name: 'Credit Committee Dual Approval',
        description: 'Multi-member credit committee voting on high-value or elevated risk facilities',
        assigneeRole: 'COMMITTEE',
        slaHours: 12,
        entryCriteria: [
          { field: 'loanAmount', operator: 'GTE', value: 500000, description: 'High value facility' },
        ],
        mandatoryGates: [
          { field: 'committeeApprovalsCount', operator: 'GTE', value: 2, description: 'Requires at least 2 distinct committee affirmative votes' },
        ],
        automatedTriggers: [
          { type: 'NOTIFY_COMMITTEE', description: 'Alert Committee Members of Pending Sanction File' },
        ],
        branchRules: [],
      },
      {
        id: 'stg-orig-6',
        sequence: 6,
        code: 'SANCTION_DISBURSEMENT',
        name: 'Sanction Letter & Fund Disbursement',
        description: 'Digital agreement execution, eNACH mandate registration, and gateway IMPS transfer',
        assigneeRole: 'FINANCE_CONTROLLER',
        slaHours: 4,
        entryCriteria: [],
        mandatoryGates: [
          { field: 'sanctionAgreementSigned', operator: 'BOOLEAN_TRUE', value: true, description: 'eSign Digital Loan Agreement verified' },
          { field: 'enachActive', operator: 'BOOLEAN_TRUE', value: true, description: 'Auto-debit eNACH mandate registered' },
        ],
        automatedTriggers: [
          { type: 'QUEUE_PAYOUT_BATCH', description: 'Enqueue Instant Bank Transfer via Cashfree Gateway' },
          { type: 'DISPATCH_COMMUNICATION', description: 'Dispatch Sanction Letter & KFS to Borrower Email' },
        ],
        branchRules: [],
      },
    ];

    this.workflows.set(`${tenantId}:LOAN_ORIGINATION`, {
      id: `wf-orig-${tenantId.replace('tenant-', '')}`,
      tenantId,
      type: 'LOAN_ORIGINATION',
      code: 'WF_ORIGINATION_FINTECH_V1',
      name: 'Standard Digital Lending Origination Pipeline',
      description: 'End-to-end digital lending lifecycle from lead capture to instant bank payout with fast-track branching',
      version: 1,
      status: 'ACTIVE',
      stages: originationStages,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Hardship Restructuring Workflow
    const restructuringStages: WorkflowStage[] = [
      {
        id: 'stg-rest-1',
        sequence: 1,
        code: 'HARDSHIP_REQUEST',
        name: 'Restructuring Application Intake',
        description: 'Borrower submits distress cause and proposed moratorium request',
        assigneeRole: 'LOAN_OFFICER',
        slaHours: 4,
        entryCriteria: [],
        mandatoryGates: [],
        automatedTriggers: [],
        branchRules: [],
      },
      {
        id: 'stg-rest-2',
        sequence: 2,
        code: 'DISTRESS_VERIFICATION',
        name: 'Financial Distress Audit',
        description: 'Review of revised bank cashflows and job loss / medical evidence',
        assigneeRole: 'UNDERWRITER',
        slaHours: 8,
        entryCriteria: [],
        mandatoryGates: [
          { field: 'hardshipDocumentProvided', operator: 'BOOLEAN_TRUE', value: true, description: 'Distress documentation provided' },
        ],
        automatedTriggers: [],
        branchRules: [],
      },
      {
        id: 'stg-rest-3',
        sequence: 3,
        code: 'TERMS_FORMULATION',
        name: 'Restructured Schedule Formulation',
        description: 'Recalculation of EMI tenure extension and interest moratorium parameters',
        assigneeRole: 'UNDERWRITER',
        slaHours: 6,
        entryCriteria: [],
        mandatoryGates: [],
        automatedTriggers: [],
        branchRules: [],
      },
      {
        id: 'stg-rest-4',
        sequence: 4,
        code: 'COMMITTEE_APPROVAL',
        name: 'Restructuring Sign-off',
        description: 'Administrative sign-off on restructured terms and RBI resolution reporting',
        assigneeRole: 'ADMIN',
        slaHours: 12,
        entryCriteria: [],
        mandatoryGates: [
          { field: 'revisedScheduleApproved', operator: 'BOOLEAN_TRUE', value: true, description: 'Revised schedule approved' },
        ],
        automatedTriggers: [
          { type: 'DISPATCH_COMMUNICATION', description: 'Send Addendum Contract to Borrower' },
        ],
        branchRules: [],
      },
    ];

    this.workflows.set(`${tenantId}:HARDSHIP_RESTRUCTURING`, {
      id: `wf-rest-${tenantId.replace('tenant-', '')}`,
      tenantId,
      type: 'HARDSHIP_RESTRUCTURING',
      code: 'WF_HARDSHIP_RESTRUCTURE_V1',
      name: 'Statutory Hardship Resolution Pipeline',
      description: 'Resolution framework for stressed assets under RBI Moratorium & Resolution Framework',
      version: 1,
      status: 'ACTIVE',
      stages: restructuringStages,
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- 1. WORKFLOW QUERIES & CRUD ---

  public listWorkflows(tenantId: string): WorkflowDefinition[] {
    const result: WorkflowDefinition[] = [];
    for (const wf of this.workflows.values()) {
      if (wf.tenantId === tenantId) {
        result.push(wf);
      }
    }
    return result;
  }

  public getWorkflowByType(tenantId: string, type: WorkflowType): WorkflowDefinition {
    const key = `${tenantId}:${type}`;
    let wf = this.workflows.get(key);
    if (!wf) {
      wf = this.workflows.get(`tenant-adyapan-default:${type}`);
    }
    if (!wf) {
      throw new NotFoundError(`Workflow '${type}' not found for tenant '${tenantId}'.`);
    }
    return wf;
  }

  public async createWorkflow(
    tenantId: string,
    dto: CreateWorkflowDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<WorkflowDefinition> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Administrators can configure institutional workflows.');
    }

    const key = `${tenantId}:${dto.type}`;
    const now = new Date().toISOString();

    const wf: WorkflowDefinition = {
      id: `wf-custom-${uuid().slice(0, 8)}`,
      tenantId,
      type: dto.type,
      code: dto.code.toUpperCase().replace(/\s+/g, '_'),
      name: dto.name,
      description: dto.description,
      version: 1,
      status: 'ACTIVE',
      stages: dto.stages,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(key, wf);

    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'WORKFLOW_TRANSITION',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'WORKFLOW_DEFINITION',
      entityId: wf.id,
      action: 'WORKFLOW_CREATED',
      correlationId: `corr-wf-${wf.id}`,
      beforeState: {},
      afterState: { code: wf.code, stagesCount: wf.stages.length },
      timestamp: now,
    });

    return wf;
  }

  public async updateWorkflowStages(
    tenantId: string,
    workflowId: string,
    stages: WorkflowStage[],
    actor: { id: string; email: string; roles: string[] }
  ): Promise<WorkflowDefinition> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Administrators can modify workflow stages.');
    }

    let targetWf: WorkflowDefinition | undefined;
    for (const wf of this.workflows.values()) {
      if (wf.id === workflowId && wf.tenantId === tenantId) {
        targetWf = wf;
        break;
      }
    }

    if (!targetWf) {
      throw new NotFoundError(`Workflow '${workflowId}' not found.`);
    }

    targetWf.stages = stages;
    targetWf.version += 1;
    targetWf.updatedAt = new Date().toISOString();

    return targetWf;
  }

  // --- 2. TRANSITION & GATE EVALUATION ENGINE ---

  public evaluateCriteria(criteria: StageGateCriteria, payload: Record<string, any>): boolean {
    const actual = payload[criteria.field];
    if (actual === undefined) return false;

    switch (criteria.operator) {
      case 'GTE':
        return typeof actual === 'number' && actual >= Number(criteria.value);
      case 'LTE':
        return typeof actual === 'number' && actual <= Number(criteria.value);
      case 'EQ':
        return actual === criteria.value;
      case 'NEQ':
        return actual !== criteria.value;
      case 'BOOLEAN_TRUE':
        return actual === true;
      case 'BOOLEAN_FALSE':
        return actual === false;
      case 'IN':
        return Array.isArray(criteria.value) && criteria.value.includes(actual);
      default:
        return false;
    }
  }

  public evaluateWorkflowTransition(
    tenantId: string,
    dto: EvaluateTransitionDto,
    actor: { id: string; email: string; roles: string[] }
  ): WorkflowTransitionEvaluationResult {
    const wf = this.getWorkflowByType(tenantId, dto.workflowType);
    const currentStageIndex = wf.stages.findIndex((s) => s.code === dto.currentStageCode);

    if (currentStageIndex === -1) {
      throw new BadRequestError(`Current stage '${dto.currentStageCode}' does not exist in workflow '${dto.workflowType}'.`);
    }

    const currentStage = wf.stages[currentStageIndex];

    // 1. Evaluate Mandatory Gates for Current Stage
    const gateCheckResults: Array<{ criteria: string; passed: boolean; reason?: string }> = [];
    let allGatesPassed = true;

    for (const gate of currentStage.mandatoryGates) {
      const passed = this.evaluateCriteria(gate, dto.candidatePayload);
      if (!passed) {
        allGatesPassed = false;
        gateCheckResults.push({
          criteria: `${gate.field} ${gate.operator} ${gate.value}`,
          passed: false,
          reason: `Requirement failed: ${gate.description} (Actual: ${dto.candidatePayload[gate.field] ?? 'MISSING'})`,
        });
      } else {
        gateCheckResults.push({
          criteria: `${gate.field} ${gate.operator} ${gate.value}`,
          passed: true,
        });
      }
    }

    // 2. Evaluate Conditional Branching Rules
    let targetStageCode = currentStageIndex < wf.stages.length - 1 ? wf.stages[currentStageIndex + 1].code : currentStage.code;
    let evaluatedBranch: string | undefined;
    let requiresDualApproval = false;

    if (allGatesPassed) {
      for (const branch of currentStage.branchRules) {
        const branchMatches = branch.criteria.every((c) => this.evaluateCriteria(c, dto.candidatePayload));
        if (branchMatches) {
          targetStageCode = branch.routeToStageCode;
          evaluatedBranch = branch.conditionName;
          requiresDualApproval = Boolean(branch.requiresDualApproval);
          break;
        }
      }
    }

    // 3. Executed Automated Triggers
    const executedTriggers = allGatesPassed ? currentStage.automatedTriggers.map((t) => t.description) : [];

    // Record SHA-256 evidence node
    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'WORKFLOW_TRANSITION',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'APPLICATION_STAGE',
      entityId: dto.candidatePayload.applicationId || 'appl-candidate',
      action: allGatesPassed ? 'STAGE_TRANSITION_PERMITTED' : 'STAGE_TRANSITION_BLOCKED',
      correlationId: `corr-wf-eval-${uuid().slice(0, 6)}`,
      beforeState: { stage: dto.currentStageCode },
      afterState: {
        allowed: allGatesPassed,
        targetStageCode,
        evaluatedBranch,
        requiresDualApproval,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      allowed: allGatesPassed,
      currentStageCode: dto.currentStageCode,
      targetStageCode,
      evaluatedBranch,
      requiresDualApproval,
      gateCheckResults,
      executedTriggers,
      slaStatus: 'ON_TRACK',
    };
  }

  public clearForTesting(): void {
    this.workflows.clear();
    this.seedCanonicalWorkflows('tenant-adyapan-default');
    this.seedCanonicalWorkflows('tenant-apex-nbfc');
  }
}

export const workflowService = WorkflowService.getInstance();
