import { describe, it, expect, beforeEach } from 'vitest';
import { workflowService } from './workflow.service';

describe('Step 35: Dynamic Workflow Builder Platform', () => {
  const tenantId = 'tenant-adyapan-default';
  const superAdmin = { id: 'usr-sa-001', email: 'superadmin@adyapan.dev', roles: ['SUPER_ADMIN'] };
  const underwriter = { id: 'usr-uw-001', email: 'underwriter@adyapan.dev', roles: ['UNDERWRITER'] };

  beforeEach(() => {
    workflowService.clearForTesting();
  });

  describe('1. Canonical Workflows & Stages Schema', () => {
    it('initializes canonical digital loan origination and restructuring pipelines', () => {
      const workflows = workflowService.listWorkflows(tenantId);
      expect(workflows.length).toBeGreaterThanOrEqual(2);

      const orig = workflowService.getWorkflowByType(tenantId, 'LOAN_ORIGINATION');
      expect(orig.stages.length).toBe(6);
      expect(orig.stages[0].code).toBe('LEAD_SUBMISSION');
      expect(orig.stages[2].code).toBe('BUREAU_FRAUD_ASSESSMENT');
      expect(orig.stages[5].code).toBe('SANCTION_DISBURSEMENT');
    });
  });

  describe('2. Mandatory Verification Gates Evaluation', () => {
    it('blocks transition when candidate payload fails mandatory criteria gates', () => {
      const result = workflowService.evaluateWorkflowTransition(
        tenantId,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-fail-001',
            cibilScore: 590, // Fails: min 650
            fraudScore: 20,
          },
        },
        underwriter
      );

      expect(result.allowed).toBe(false);
      expect(result.gateCheckResults.some((g) => !g.passed)).toBe(true);
      expect(result.gateCheckResults[0].reason).toContain('Requirement failed');
    });

    it('permits transition when all mandatory criteria gates pass', () => {
      const result = workflowService.evaluateWorkflowTransition(
        tenantId,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-pass-001',
            cibilScore: 720, // Passes: >= 650
            fraudScore: 15, // Passes: <= 50
            loanAmount: 200000,
          },
        },
        underwriter
      );

      expect(result.allowed).toBe(true);
      expect(result.gateCheckResults.every((g) => g.passed)).toBe(true);
      expect(result.targetStageCode).toBe('UNDERWRITING_REVIEW'); // Next sequential stage
      expect(result.executedTriggers.length).toBeGreaterThan(0);
    });
  });

  describe('3. Conditional Branching & Dual Approval Logic', () => {
    it('routes prime salaried borrowers to Fast-Track digital sanction disbursement', () => {
      const result = workflowService.evaluateWorkflowTransition(
        tenantId,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-fast-001',
            cibilScore: 795, // Prime >= 780
            employmentType: 'SALARIED',
            fraudScore: 10,
            loanAmount: 150000,
          },
        },
        underwriter
      );

      expect(result.allowed).toBe(true);
      expect(result.evaluatedBranch).toBe('Fast-Track Prime Borrower Routing');
      expect(result.targetStageCode).toBe('SANCTION_DISBURSEMENT'); // Jumps straight to payout
      expect(result.requiresDualApproval).toBe(false);
    });

    it('routes high-value loans (>= ₹5,00,000) to Credit Committee with mandatory dual approval', () => {
      const result = workflowService.evaluateWorkflowTransition(
        tenantId,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-high-001',
            cibilScore: 740,
            employmentType: 'SELF_EMPLOYED_BUSINESS',
            fraudScore: 15,
            loanAmount: 1500000, // ₹15 Lakh (High Value)
          },
        },
        underwriter
      );

      expect(result.allowed).toBe(true);
      expect(result.evaluatedBranch).toBe('High-Value Committee Escalation');
      expect(result.targetStageCode).toBe('COMMITTEE_SANCTION'); // Routes to committee
      expect(result.requiresDualApproval).toBe(true);
    });
  });

  describe('4. Custom Workflow Creation & RBAC Security', () => {
    it('creates custom product-specific workflow with custom stages and gates', async () => {
      const customWf = await workflowService.createWorkflow(
        tenantId,
        {
          type: 'PRODUCT_CUSTOM',
          code: 'WF_BNPL_MERCHANT_V1',
          name: 'BNPL Merchant Instant Line Workflow',
          description: 'Instant zero-paperwork merchant credit line workflow',
          stages: [
            {
              id: 'stg-bnpl-1',
              sequence: 1,
              code: 'MERCHANT_QR_SCAN',
              name: 'Merchant QR Scan',
              description: 'Initiation at point of sale',
              assigneeRole: 'CUSTOMER',
              slaHours: 1,
              entryCriteria: [],
              mandatoryGates: [],
              automatedTriggers: [],
              branchRules: [],
            },
            {
              id: 'stg-bnpl-2',
              sequence: 2,
              code: 'INSTANT_SETTLEMENT',
              name: 'Instant Line Activation',
              description: 'Real-time disbursement to merchant UPI VPA',
              assigneeRole: 'FINANCE_CONTROLLER',
              slaHours: 1,
              entryCriteria: [],
              mandatoryGates: [
                { field: 'upiVpaValid', operator: 'BOOLEAN_TRUE', value: true, description: 'UPI VPA validated' },
              ],
              automatedTriggers: [],
              branchRules: [],
            },
          ],
        },
        superAdmin
      );

      expect(customWf.code).toBe('WF_BNPL_MERCHANT_V1');
      expect(customWf.stages.length).toBe(2);
    });

    it('rejects borrower attempts to create custom workflows', async () => {
      const borrower = { id: 'usr-b-1', email: 'b@adyapan.dev', roles: ['CUSTOMER'] };

      await expect(
        workflowService.createWorkflow(
          tenantId,
          {
            type: 'PRODUCT_CUSTOM',
            code: 'HACK',
            name: 'Hacked',
            description: 'Illegal',
            stages: [],
          },
          borrower
        )
      ).rejects.toThrow('Only Administrators can configure institutional workflows.');
    });
  });
});
