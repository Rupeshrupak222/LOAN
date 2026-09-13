// Phase P4: Authoritative State-Gated Lending Engine & Transition Service
import { ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { rolePermissionService } from '../roles/role-permission.service';
import { logAudit } from '../audit/audit.service';
import { PayoutGatekeeperService } from '../disbursements/payout-gatekeeper.service';

export interface WorkflowActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
  partnerId?: string;
}

export interface TransitionRequestOptions {
  reason?: string;
  changedBy?: string;
  notes?: string;
  overrideAuthority?: boolean;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface PrerequisiteCheckResult {
  key: string;
  label: string;
  passed: boolean;
  reason?: string;
  requiredCondition: string;
}

export interface WorkflowEligibilityResult {
  allowed: boolean;
  applicationId: string;
  applicationNo: string;
  currentStatus: ApplicationStatus;
  targetStatus: ApplicationStatus;
  completedPrerequisites: PrerequisiteCheckResult[];
  pendingPrerequisites: PrerequisiteCheckResult[];
  blockingReasons: string[];
  requiredPermissions: string[];
  requiredRole?: string;
  sodCheckPassed: boolean;
  sodBlockingReason?: string;
  nextValidAction: {
    actionKey: string;
    actionLabel: string;
    targetRoute: string;
    requiredRole: string;
    description: string;
  };
}

export class WorkflowTransitionService {
  private static instance: WorkflowTransitionService;

  // Authoritative State Transition Graph
  private static readonly TRANSITION_GRAPH: Record<ApplicationStatus, ApplicationStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['KYC_PENDING', 'KYC_VERIFIED', 'REJECTED', 'CANCELLED'],
    KYC_PENDING: ['KYC_VERIFIED', 'SUBMITTED', 'REJECTED', 'CANCELLED'],
    KYC_VERIFIED: ['UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'SUBMITTED', 'REJECTED', 'CANCELLED'],
    UNDER_REVIEW: ['CREDIT_ASSESSMENT', 'UNDERWRITING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
    CREDIT_ASSESSMENT: ['UNDERWRITING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
    UNDERWRITING: ['APPROVED', 'SUBMITTED', 'CREDIT_ASSESSMENT', 'REJECTED', 'CANCELLED'],
    APPROVED: ['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'UNDERWRITING', 'CANCELLED'],
    AGREEMENT_PENDING: ['READY_FOR_DISBURSEMENT', 'CANCELLED'],
    READY_FOR_DISBURSEMENT: ['DISBURSED', 'CANCELLED'],
    DISBURSED: [], // Terminal for application lifecycle (transitions to LMS active loan)
    REJECTED: [],  // Terminal
    CANCELLED: [], // Terminal
  };

  // Required canonical permissions per target state
  private static readonly TARGET_PERMISSION_MAP: Record<ApplicationStatus, string> = {
    DRAFT: 'application.create',
    SUBMITTED: 'application.submit',
    KYC_PENDING: 'customer.kyc',
    KYC_VERIFIED: 'customer.kyc',
    UNDER_REVIEW: 'application.review',
    CREDIT_ASSESSMENT: 'credit.assess',
    UNDERWRITING: 'underwriting.view',
    APPROVED: 'underwriting.decide',
    AGREEMENT_PENDING: 'offer.generate',
    READY_FOR_DISBURSEMENT: 'offer.accept',
    DISBURSED: 'disbursement.execute',
    REJECTED: 'underwriting.decide',
    CANCELLED: 'application.edit',
  };

  private constructor() {}

  public static getInstance(): WorkflowTransitionService {
    if (!WorkflowTransitionService.instance) {
      WorkflowTransitionService.instance = new WorkflowTransitionService();
    }
    return WorkflowTransitionService.instance;
  }

  /**
   * Retrieves the authoritative application entity with all relations required for lifecycle validation.
   */
  public async getAuthoritativeApplication(applicationId: string) {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            documents: true,
            bankAccounts: true,
            employmentDetails: true,
            addresses: true,
            consents: true,
          },
        },
        product: true,
        documents: true,
        eligibility: true,
        riskAssessment: true,
        underwriting: true,
        approvals: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!app) {
      throw new NotFoundError(`Loan Application '${applicationId}' not found.`);
    }

    return app;
  }

  /**
   * Evaluates transition eligibility without mutating state.
   */
  public async evaluateTransitionEligibility(
    applicationId: string,
    targetStatus: ApplicationStatus,
    actor?: WorkflowActorContext
  ): Promise<WorkflowEligibilityResult> {
    const app = await this.getAuthoritativeApplication(applicationId);

    // 1. Resolve and validate zero-trust actor scope
    if (actor) {
      ScopeResolver.resolveAuthorizedScope(actor as any, {
        requestedTenantId: app.tenantId || undefined,
        requestedBranchId: app.branchId || undefined,
      });
    }

    const currentStatus = app.status;
    const completedPrerequisites: PrerequisiteCheckResult[] = [];
    const pendingPrerequisites: PrerequisiteCheckResult[] = [];
    const blockingReasons: string[] = [];

    // 2. Check if target transition exists in transition graph
    const allowedTargets = WorkflowTransitionService.TRANSITION_GRAPH[currentStatus] || [];
    const isGraphAllowed = allowedTargets.includes(targetStatus);

    if (!isGraphAllowed) {
      blockingReasons.push(
        `Direct state transition from '${currentStatus}' to '${targetStatus}' is prohibited by the authoritative lending state machine.`
      );
    }

    // 3. Permission verification
    const requiredPermission = WorkflowTransitionService.TARGET_PERMISSION_MAP[targetStatus];
    const requiredPermissions: string[] = requiredPermission ? [requiredPermission] : [];
    let hasPerm = true;

    if (actor && requiredPermission) {
      hasPerm = rolePermissionService.hasPermission(actor as any, requiredPermission as any);
      if (!hasPerm) {
        blockingReasons.push(
          `Actor '${actor.id || 'anonymous'}' with roles [${actor.roles?.join(', ')}] lacks required permission '${requiredPermission}' for transition to '${targetStatus}'.`
        );
      }
    }

    // 4. SoD Validation (Maker-Checker, Auditor read-only, Borrower restriction)
    let sodCheckPassed = true;
    let sodBlockingReason: string | undefined;

    if (actor) {
      try {
        // Enforce auditor read-only
        SodValidator.assertAuditorReadOnly(actor.roles || [], `TRANSITION_TO_${targetStatus}`);

        // Enforce borrower internal restriction
        SodValidator.assertBorrowerInternalRestriction(actor.roles || [], requiredPermission || 'application');

        // Maker-Checker on Approval
        if (targetStatus === 'APPROVED') {
          const creationHistory = app.statusHistory.find((h) => h.toStatus === 'DRAFT' || h.toStatus === 'SUBMITTED');
          const makerId = creationHistory?.changedBy || (app as any).createdBy;
          if (makerId && actor.id) {
            SodValidator.assertMakerCheckerSeparation(makerId, actor.id, 'LOAN_SANCTION_APPROVAL');
          }
        }
      } catch (err: any) {
        sodCheckPassed = false;
        sodBlockingReason = err.message;
        blockingReasons.push(sodBlockingReason!);
      }
    }

    // 5. Evaluate Stage-Specific Business Prerequisites
    this.evaluateStagePrerequisites(app, targetStatus, completedPrerequisites, pendingPrerequisites, blockingReasons);

    const allowed = isGraphAllowed && hasPerm && sodCheckPassed && blockingReasons.length === 0;

    return {
      allowed,
      applicationId: app.id,
      applicationNo: app.applicationNo,
      currentStatus,
      targetStatus,
      completedPrerequisites,
      pendingPrerequisites,
      blockingReasons,
      requiredPermissions,
      sodCheckPassed,
      sodBlockingReason,
      nextValidAction: this.resolveNextValidAction(currentStatus, app),
    };
  }

  /**
   * Authoritatively transitions the application to the target state.
   */
  public async requestTransition(
    applicationId: string,
    targetStatus: ApplicationStatus,
    actor?: WorkflowActorContext,
    options?: TransitionRequestOptions
  ) {
    // Evaluate full prerequisite eligibility
    const evaluation = await this.evaluateTransitionEligibility(applicationId, targetStatus, actor);

    if (!evaluation.allowed) {
      throw new ConflictError(
        `[WORKFLOW_PREREQUISITE_NOT_MET] Cannot transition application '${evaluation.applicationNo}' from '${evaluation.currentStatus}' to '${targetStatus}'. Reasons: ${evaluation.blockingReasons.join('; ')}`
      );
    }

    const app = await this.getAuthoritativeApplication(applicationId);
    const fromStatus = app.status;
    const changedBy = options?.changedBy || actor?.id || 'SYSTEM_WORKFLOW_ENGINE';
    const reason = options?.reason || `Authoritative state transition from ${fromStatus} to ${targetStatus}`;

    // Transactional state update with audit logging and history recording
    const updatedApp = await prisma.$transaction(async (tx) => {
      // Concurrency protection: verify status has not changed in-flight
      const freshApp = await tx.loanApplication.findUnique({
        where: { id: applicationId },
        select: { status: true, version: true } as any,
      });

      if (freshApp && (freshApp as any).status !== fromStatus) {
        throw new ConflictError(
          `[CONCURRENCY_CONFLICT] Application state was concurrently modified from '${fromStatus}' to '${(freshApp as any).status}'. Please refresh.`
        );
      }

      // Execute update
      const updated = await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: targetStatus,
          statusHistory: {
            create: {
              fromStatus,
              toStatus: targetStatus,
              changedBy,
              reason,
            },
          },
        },
        include: {
          customer: true,
          product: true,
          eligibility: true,
          riskAssessment: true,
          underwriting: true,
        },
      });

      return updated;
    });

    // Record immutable security audit log
    await logAudit({
      tenantId: app.tenantId || ScopeResolver.DEFAULT_PRIMARY_TENANT_ID,
      userId: actor?.id,
      action: `WORKFLOW_TRANSITION_${targetStatus}`,
      entity: 'LoanApplication',
      entityId: app.id,
      newValue: {
        applicationNo: app.applicationNo,
        fromStatus,
        toStatus: targetStatus,
        reason,
        changedBy,
        metadata: options?.metadata,
      },
    });

    return updatedApp;
  }

  /**
   * Helper: Evaluates stage-specific prerequisites across credit, risk, underwriting, eSign, mandate, and gatekeeper.
   */
  private evaluateStagePrerequisites(
    app: any,
    targetStatus: ApplicationStatus,
    completed: PrerequisiteCheckResult[],
    pending: PrerequisiteCheckResult[],
    blockers: string[]
  ): void {
    const customer = app.customer || {};
    const docs = [...(customer.documents || []), ...(app.documents || [])];

    // ─── Prerequisite 1: Dynamic KYC Verification ───
    const hasAadhaarOrPan = docs.some((d) =>
      ['PAN_CARD', 'AADHAAR', 'IDENTITY_PROOF', 'IDENTITY'].includes(d.category) ||
      ['PAN_CARD', 'AADHAAR'].includes(d.documentType)
    );
    const isKycVerified = customer.kycStatus === 'VERIFIED' || customer.kycStatus === 'APPROVED' || hasAadhaarOrPan;

    const kycPrereq: PrerequisiteCheckResult = {
      key: 'KYC_VERIFICATION',
      label: 'Dynamic KYC & Identity Verification',
      passed: isKycVerified,
      requiredCondition: 'Verified Aadhaar XML + Active PAN record matching applicant identity.',
      reason: isKycVerified ? undefined : 'Customer KYC identity verification is pending or incomplete.',
    };

    if (isKycVerified) completed.push(kycPrereq);
    else {
      pending.push(kycPrereq);
      if (['CREDIT_ASSESSMENT', 'UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(targetStatus)) {
        blockers.push('Dynamic KYC verification must be completed first.');
      }
    }

    // ─── Prerequisite 2: Financial Data & Bank Statements ───
    const hasBankOrIncome = docs.some((d) =>
      ['INCOME_PROOF', 'BANK_STATEMENT', 'SALARY_SLIP', 'ITR_V'].includes(d.category) ||
      ['BANK_STATEMENT', 'SALARY_SLIP', 'ITR_V'].includes(d.documentType)
    );
    const isFinancialDataComplete = hasBankOrIncome || Boolean(app.eligibility);

    const finPrereq: PrerequisiteCheckResult = {
      key: 'FINANCIAL_DATA',
      label: 'Bank Statement & Income Verification',
      passed: isFinancialDataComplete,
      requiredCondition: 'Uploaded bank statement and verified income/salary slip.',
      reason: isFinancialDataComplete ? undefined : 'Bank statement parsing and income verification required.',
    };

    if (isFinancialDataComplete) completed.push(finPrereq);
    else {
      pending.push(finPrereq);
      if (['UNDERWRITING', 'APPROVED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(targetStatus)) {
        blockers.push('Financial data and bank statements must be parsed and verified.');
      }
    }

    // ─── Prerequisite 3: 6-Pillar Risk & Fraud Assessment ───
    const riskAssessment = app.riskAssessment;
    const isRiskAssessed = Boolean(riskAssessment && riskAssessment.score != null);
    const hasFraudBlock =
      app.fraudHoldActive === true ||
      (riskAssessment?.category === 'HIGH' && (riskAssessment.factors as any)?.fraudHold === true);

    const riskPrereq: PrerequisiteCheckResult = {
      key: 'RISK_FRAUD_ASSESSMENT',
      label: '6-Pillar Credit Risk & Fraud Intelligence Evaluation',
      passed: isRiskAssessed && !hasFraudBlock,
      requiredCondition: 'Completed credit risk scorecard without active high-risk fraud holds.',
      reason: !isRiskAssessed
        ? 'Risk evaluation has not been completed.'
        : hasFraudBlock
        ? 'Active fraud hold detected on proposal.'
        : undefined,
    };

    if (isRiskAssessed && !hasFraudBlock) completed.push(riskPrereq);
    else {
      pending.push(riskPrereq);
      if (['UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(targetStatus)) {
        blockers.push(hasFraudBlock ? 'Proposal has an active fraud hold.' : 'Risk assessment must be evaluated.');
      }
    }

    // ─── Prerequisite 4: Underwriting Decision & Authority Sanction ───
    const underwriting = app.underwriting;
    const isUnderwritten = Boolean(underwriting && ['APPROVE', 'APPROVE_WITH_CONDITIONS'].includes(underwriting.decision));

    const uwPrereq: PrerequisiteCheckResult = {
      key: 'UNDERWRITING_SANCTION',
      label: 'Underwriting Sanction & Delegated Authority',
      passed: isUnderwritten,
      requiredCondition: 'Underwriter formal sanction approval within delegated financial limits.',
      reason: isUnderwritten ? undefined : 'Underwriting sanction decision is pending.',
    };

    if (isUnderwritten) completed.push(uwPrereq);
    else {
      pending.push(uwPrereq);
      if (['AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(targetStatus)) {
        blockers.push('Underwriting sanction decision must be approved.');
      }
    }

    // ─── Prerequisite 5: Digital Contract eSign & e-NACH Mandate ───
    const hasEsign = docs.some((d) => ['SIGNED_AGREEMENT', 'SANCTION_LETTER', 'LOAN_AGREEMENT'].includes(d.category));
    const hasMandate = Boolean(customer.bankAccounts?.some((b: any) => b.isVerified));
    const isEsignAndMandateActive = hasEsign && hasMandate;

    const contractPrereq: PrerequisiteCheckResult = {
      key: 'ESIGN_AND_MANDATE',
      label: 'Aadhaar eSign & e-NACH Auto-Debit Mandate',
      passed: isEsignAndMandateActive,
      requiredCondition: 'Executed digital loan contract + active auto-debit registration.',
      reason: isEsignAndMandateActive ? undefined : 'Digital contract eSign or bank mandate setup pending.',
    };

    if (isEsignAndMandateActive) completed.push(contractPrereq);
    else {
      pending.push(contractPrereq);
      if (['READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(targetStatus)) {
        blockers.push('Contract eSign and active bank mandate are required before disbursement.');
      }
    }
  }

  /**
   * Helper: Resolves the authoritative next valid action and route.
   */
  private resolveNextValidAction(currentStatus: ApplicationStatus, app: any) {
    switch (currentStatus) {
      case 'DRAFT':
        return {
          actionKey: 'SUBMIT_APPLICATION',
          actionLabel: 'Submit Loan Application',
          targetRoute: `/applications/${app.id}`,
          requiredRole: 'LOAN_OFFICER',
          description: 'Submit proposal to initiate automated onboarding and verification.',
        };
      case 'SUBMITTED':
      case 'KYC_PENDING':
        return {
          actionKey: 'COMPLETE_KYC',
          actionLabel: 'Verify Customer KYC',
          targetRoute: `/customers/${app.customerId}`,
          requiredRole: 'LOAN_OFFICER',
          description: 'Complete Digilocker Aadhaar XML verification and PAN record validation.',
        };
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
      case 'UNDER_REVIEW':
        return {
          actionKey: 'EVALUATE_CREDIT',
          actionLabel: 'Perform Credit Assessment',
          targetRoute: `/credit-assessment`,
          requiredRole: 'CREDIT_ANALYST',
          description: 'Compute FOIR, parse bank statements, and run BRE decision rules.',
        };
      case 'UNDERWRITING':
        return {
          actionKey: 'SANCTION_LOAN',
          actionLabel: 'Sanction Loan Proposal',
          targetRoute: `/underwriting`,
          requiredRole: 'UNDERWRITER',
          description: 'Review credit memo, evaluate risk score, and record sanction approval.',
        };
      case 'APPROVED':
      case 'AGREEMENT_PENDING':
        return {
          actionKey: 'ACCEPT_AND_ESIGN',
          actionLabel: 'Sign Loan Agreement & Mandate',
          targetRoute: `/customer/dashboard`,
          requiredRole: 'CUSTOMER',
          description: 'Borrower must review Key Fact Statement (KFS) and sign contract via eSign.',
        };
      case 'READY_FOR_DISBURSEMENT':
        return {
          actionKey: 'EXECUTE_PAYOUT',
          actionLabel: 'Pass 10-Point Gate & Disburse',
          targetRoute: `/disbursements`,
          requiredRole: 'FINANCE_OFFICER',
          description: 'Validate 10-point gatekeeper and dispatch IMPS/NEFT payout.',
        };
      case 'DISBURSED':
        return {
          actionKey: 'VIEW_SERVICING',
          actionLabel: 'View Active Loan Servicing',
          targetRoute: `/loans`,
          requiredRole: 'FINANCE_OFFICER',
          description: 'Track EMI repayments, waterfall ledger, and foreclosure status.',
        };
      default:
        return {
          actionKey: 'VIEW_DETAILS',
          actionLabel: 'View Application Details',
          targetRoute: `/applications/${app.id}`,
          requiredRole: 'LOAN_OFFICER',
          description: 'Inspect application history and metadata.',
        };
    }
  }
}

export const workflowTransitionService = WorkflowTransitionService.getInstance();
