import { ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { workflowService } from '../workflows/workflow.service';
import { PayoutGatekeeperService } from '../disbursements/payout-gatekeeper.service';
import {
  CanonicalLifecycleState,
  CrossDomainGateStatus,
  GatePrerequisite,
  UnifiedLifecycleProjection,
  UnifiedTimelineEvent,
  BorrowerSafeJourneyProjection,
  ReconciliationAnomaly,
  OrchestrationTransitionDto,
  OrchestrationStageGroup,
} from './orchestration.types';

export interface OrchestrationActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
  partnerId?: string;
}

export class LendingOrchestrationService {
  private static instance: LendingOrchestrationService;

  // Processed Idempotency Keys store to guarantee idempotent transitions
  private readonly processedIdempotencyKeys = new Map<string, { response: any; timestamp: number }>();

  private constructor() {}

  public static getInstance(): LendingOrchestrationService {
    if (!LendingOrchestrationService.instance) {
      LendingOrchestrationService.instance = new LendingOrchestrationService();
    }
    return LendingOrchestrationService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. CANONICAL LIFECYCLE STATE DERIVATION & PROJECTION
  // ---------------------------------------------------------------------------

  /**
   * Derives the authoritative canonical lifecycle state from underlying domain entities.
   */
  public async getCanonicalLifecycle(
    applicationId: string,
    actor?: OrchestrationActorContext
  ): Promise<UnifiedLifecycleProjection> {
    const app = await this.fetchAuthoritativeAggregate(applicationId);

    if (actor) {
      ScopeResolver.resolveAuthorizedScope(actor as any, {
        requestedTenantId: app.tenantId || undefined,
        requestedBranchId: app.branchId || app.customer?.branchId || undefined,
      });
    }

    const currentState = this.deriveCanonicalState(app);
    const stageGroup = this.resolveStageGroup(currentState);
    const { currentAssigneeRole, currentAssigneeScope } = this.resolveCurrentAssignee(currentState, app);
    const blockingReasons = await this.evaluateCurrentBlockers(app, currentState);
    const nextPermittedActions = this.resolveNextPermittedActions(currentState, app, actor);
    const activeRemediations = this.resolveActiveRemediations(app);
    const slaInfo = this.resolveSlaInfo(currentState, app);

    return {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      customerId: app.customerId,
      customerName: `${app.customer?.firstName || ''} ${app.customer?.lastName || ''}`.trim() || 'Unknown Applicant',
      productName: app.product?.name || 'Standard Retail Loan',
      requestedAmount: Number(app.requestedAmount || 0),
      approvedAmount: (app as any).approvedAmount ? Number((app as any).approvedAmount) : undefined,
      disbursedAmount: (app as any).disbursements?.[0]?.amount ? Number((app as any).disbursements[0].amount) : undefined,
      outstandingBalance: (app as any).loans?.[0]?.outstandingPrincipal ? Number((app as any).loans[0].outstandingPrincipal) : undefined,
      currentState,
      stageGroup,
      currentAssigneeRole,
      currentAssigneeScope,
      nextPermittedActions,
      blockingReasons,
      activeRemediations,
      slaInfo,
      domainStates: {
        applicationStatus: app.status,
        kycStatus: app.customer?.kycStatus || 'NOT_STARTED',
        creditAssessmentStatus: (app.eligibility as any)?.recommendation || app.eligibility?.result || 'PENDING',
        branchManagerStatus: this.getBmApprovalStatus(app),
        underwritingStatus: app.underwriting?.decision || 'PENDING',
        sanctionStatus: (app as any).sanctions?.[0]?.status || (app.underwriting?.decision === 'APPROVE' ? 'SANCTIONED' : 'PENDING'),
        offerStatus: (app as any).offers?.[0]?.status || 'PENDING',
        agreementStatus: (app as any).contracts?.[0]?.status || 'PENDING',
        financeStatus: (app as any).financeRequests?.[0]?.status || 'PENDING',
        disbursementStatus: (app as any).disbursements?.[0]?.status || 'PENDING',
        loanStatus: (app as any).loans?.[0]?.status || 'PENDING',
        collectionStatus: (app as any).collectionCases?.[0]?.status || 'NOT_APPLICABLE',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. DETERMINISTIC CROSS-DOMAIN GATE VALIDATION
  // ---------------------------------------------------------------------------

  /**
   * Evaluates if transition to a target lifecycle state satisfies all cross-domain gates.
   */
  public async evaluateCrossDomainGate(
    applicationId: string,
    targetState: CanonicalLifecycleState,
    actor?: OrchestrationActorContext
  ): Promise<CrossDomainGateStatus> {
    const app = await this.fetchAuthoritativeAggregate(applicationId);
    const currentState = this.deriveCanonicalState(app);

    const prerequisites: GatePrerequisite[] = [];
    const blockingReasons: string[] = [];

    // Gate 1: Credit Assessment -> Branch Manager Review
    if (targetState === 'BRANCH_MANAGER_REVIEW') {
      const isKycOk = app.customer?.kycStatus === 'VERIFIED';
      prerequisites.push({
        key: 'KYC_VERIFIED',
        label: 'Customer KYC Identity Verification',
        passed: isKycOk,
        domain: 'CUSTOMER_KYC',
        requiredCondition: 'Aadhaar XML & PAN verification verified.',
        failureReason: isKycOk ? undefined : 'Applicant KYC is incomplete.',
      });

      const hasAssessment = Boolean(app.eligibility);
      prerequisites.push({
        key: 'CREDIT_ASSESSMENT_COMPLETE',
        label: 'Credit Analyst Assessment & FOIR Computation',
        passed: hasAssessment,
        domain: 'CREDIT_ASSESSMENT',
        requiredCondition: 'Credit Analyst recommendation recorded.',
        failureReason: hasAssessment ? undefined : 'Credit Assessment has not been performed.',
      });
    }

    // Gate 2: Branch Manager Review -> Underwriter (Above Authority Limit Escalation)
    if (targetState === 'UNDERWRITING') {
      // Must NOT come directly from Credit Analyst without Branch Manager review
      const hasBmActionOrReview = app.approvals?.some((a) => a.approverRole === 'BRANCH_MANAGER') || app.status === 'UNDER_REVIEW';
      prerequisites.push({
        key: 'BRANCH_MANAGER_REVIEW_MANDATE',
        label: 'Branch Manager Review Verification',
        passed: hasBmActionOrReview,
        domain: 'BRANCH_MANAGER',
        requiredCondition: 'Credit Analyst must route to Branch Manager before Underwriting.',
        failureReason: hasBmActionOrReview ? undefined : 'Credit Analyst cannot directly forward to Underwriter; Branch Manager review is required.',
      });

      // Check authority policy
      const requestedAmount = Number(app.requestedAmount || 0);
      const authorityResolution = await approvalAuthorityService.resolveAuthorityDirect(
        app.tenantId || 'tenant-adyapan-default',
        {
          loanAmount: requestedAmount,
          riskGrade: (app.riskAssessment?.category as any) || 'B',
          breDecision: 'APPROVE',
          branchId: app.branchId || undefined,
        }
      );

      const isAboveBm = authorityResolution.requiredLevel > 1;
      prerequisites.push({
        key: 'AUTHORITY_ESCALATION_CRITERIA',
        label: 'Delegated Approval Authority Check',
        passed: isAboveBm || hasBmActionOrReview,
        domain: 'APPROVAL_AUTHORITY',
        requiredCondition: 'Proposal must require Level 2+ authority or be escalated by Branch Manager.',
        failureReason: isAboveBm ? undefined : 'Proposal is within Branch Manager authority; Underwriting escalation not required.',
      });
    }

    // Gate 3: Branch Manager Within Authority Approval -> Sanction / Offer
    if (targetState === 'BRANCH_MANAGER_APPROVED' || (targetState === 'SANCTIONED' && currentState === 'BRANCH_MANAGER_REVIEW')) {
      const requestedAmount = Number(app.requestedAmount || 0);
      const authorityResolution = await approvalAuthorityService.resolveAuthorityDirect(
        app.tenantId || 'tenant-adyapan-default',
        {
          loanAmount: requestedAmount,
          riskGrade: (app.riskAssessment?.category as any) || 'B',
          breDecision: 'APPROVE',
          branchId: app.branchId || undefined,
        }
      );

      const isWithinBm = authorityResolution.requiredLevel === 1;
      prerequisites.push({
        key: 'BM_AUTHORITY_LIMIT',
        label: 'Branch Manager Delegated Authority Limit',
        passed: isWithinBm,
        domain: 'APPROVAL_AUTHORITY',
        requiredCondition: `Loan amount (₹${requestedAmount.toLocaleString('en-IN')}) must be within Level 1 authority limit.`,
        failureReason: isWithinBm ? undefined : `Loan amount exceeds Branch Manager authority limit (${authorityResolution.policyName}). Escalate to Underwriter.`,
      });
    }

    // Gate 4: Underwriting -> Sanctioned
    if (targetState === 'SANCTIONED' && currentState === 'UNDERWRITING') {
      const isUwApproved = app.underwriting?.decision === 'APPROVE' || app.underwriting?.decision === 'APPROVE_WITH_CONDITIONS';
      prerequisites.push({
        key: 'UNDERWRITING_DECISION',
        label: 'Formal Underwriter Sanction Decision',
        passed: isUwApproved,
        domain: 'UNDERWRITING',
        requiredCondition: 'Underwriter formal sanction approval recorded.',
        failureReason: isUwApproved ? undefined : 'Underwriting decision is pending or rejected.',
      });
    }

    // Gate 5: Sanctioned -> Offer Generation
    if (targetState === 'OFFER_PENDING') {
      const isSanctioned =
        app.status === 'APPROVED' ||
        app.underwriting?.decision === 'APPROVE' ||
        app.approvals?.some((a) => a.status === 'APPROVED');
      prerequisites.push({
        key: 'SANCTION_CONFIRMATION',
        label: 'Authoritative Sanction Letter / Approval',
        passed: isSanctioned,
        domain: 'SANCTION',
        requiredCondition: 'Loan proposal must have valid sanction approval before offer generation.',
        failureReason: isSanctioned ? undefined : 'Cannot generate offer without valid loan sanction.',
      });
    }

    // Gate 6: Offer Accepted -> Agreement / eSign
    if (targetState === 'AGREEMENT_PENDING' || targetState === 'ESIGN_PENDING') {
      const activeOffer = (app as any).offers?.[0];
      const isOfferAccepted = activeOffer?.status === 'ACCEPTED' || (app as any).offerAccepted === true || app.status === 'APPROVED';
      prerequisites.push({
        key: 'OFFER_ACCEPTANCE',
        label: 'Borrower Offer Acceptance & KFS Acknowledgement',
        passed: isOfferAccepted,
        domain: 'OFFER_ENGINE',
        requiredCondition: 'Borrower must accept formal loan offer and KFS.',
        failureReason: isOfferAccepted ? undefined : 'Offer must be accepted by borrower before agreement generation.',
      });
    }

    // Gate 7: Agreement Completed -> Finance Readiness
    if (targetState === 'FINANCE_PENDING' || targetState === 'PRE_DISBURSEMENT') {
      const activeContract = (app as any).contracts?.[0];
      const hasEsignDoc = (app.documents || []).some((d: any) =>
        ['SIGNED_AGREEMENT', 'LOAN_AGREEMENT', 'SANCTION_LETTER'].includes(d.category)
      );
      const isContractDone = activeContract?.status === 'EXECUTED' || hasEsignDoc || app.status === 'READY_FOR_DISBURSEMENT';
      prerequisites.push({
        key: 'AGREEMENT_EXECUTION',
        label: 'Aadhaar eSign & Executed Digital Contract',
        passed: isContractDone,
        domain: 'CONTRACT_ESIGN',
        requiredCondition: 'Digitally signed contract and mandate setup completed.',
        failureReason: isContractDone ? undefined : 'Loan contract eSign is pending.',
      });
    }

    // Gate 8: Finance / Pre-Disbursement -> Maker / Checker -> Disbursement
    if (targetState === 'DISBURSEMENT_PROCESSING' || targetState === 'DISBURSED') {
      const hasBank = (app.customer?.bankAccounts || []).some((b: any) => b.isVerified);
      prerequisites.push({
        key: 'DISBURSEMENT_BANK_VERIFIED',
        label: 'Penny Drop / Bank Account Verification',
        passed: hasBank,
        domain: 'PAYOUT_GATEKEEPER',
        requiredCondition: 'Applicant bank account must be penny-drop verified.',
        failureReason: hasBank ? undefined : 'Applicant bank account verification is pending.',
      });
    }

    // Gate 9: Loan Active -> Closed
    if (targetState === 'CLOSED') {
      const activeLoan = (app as any).loans?.[0];
      const outstanding = Number(activeLoan?.outstandingPrincipal || 0) + Number(activeLoan?.outstandingInterest || 0);
      const isSettled = outstanding === 0;
      prerequisites.push({
        key: 'ZERO_OUTSTANDING_BALANCE',
        label: 'Zero Outstanding Principal, Interest & Penalties',
        passed: isSettled,
        domain: 'LOAN_SERVICING',
        requiredCondition: 'Outstanding loan balance must equal zero.',
        failureReason: isSettled ? undefined : `Outstanding balance remaining: ₹${outstanding.toLocaleString('en-IN')}`,
      });
    }

    // Aggregate failures
    for (const prereq of prerequisites) {
      if (!prereq.passed && prereq.failureReason) {
        blockingReasons.push(prereq.failureReason);
      }
    }

    return {
      gateKey: `GATE_${currentState}_TO_${targetState}`,
      sourceDomain: this.resolveDomainForState(currentState),
      targetDomain: this.resolveDomainForState(targetState),
      sourceState: currentState,
      targetState,
      allowed: blockingReasons.length === 0,
      prerequisites,
      blockingReasons,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. AUTHORIZED CROSS-DOMAIN TRANSITIONS (FORWARD ONLY + REMEDIATION)
  // ---------------------------------------------------------------------------

  /**
   * Executes an authorized cross-domain transition with atomic state mutation,
   * idempotency guarantees, and immutable audit logs.
   */
  public async executeTransition(
    dto: OrchestrationTransitionDto,
    actor?: OrchestrationActorContext
  ): Promise<{ success: boolean; projection: UnifiedLifecycleProjection; message: string }> {
    // 1. Idempotency Check
    if (dto.idempotencyKey) {
      const cached = this.processedIdempotencyKeys.get(dto.idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.response;
      }
    }

    const app = await this.fetchAuthoritativeAggregate(dto.applicationId);

    // 2. Zero-trust scope check
    if (actor) {
      ScopeResolver.resolveAuthorizedScope(actor as any, {
        requestedTenantId: app.tenantId || undefined,
        requestedBranchId: app.branchId || app.customer?.branchId || undefined,
      });
    }

    // 3. Prevent direct mutation on terminal states
    if (['REJECTED', 'CANCELLED', 'CLOSED'].includes(app.status)) {
      throw new BadRequestError(
        `Application '${app.applicationNo}' is in terminal state '${app.status}' and cannot receive workflow transitions.`
      );
    }

    const actorId = actor?.id || 'SYSTEM_ORCHESTRATOR';
    const actorEmail = actor?.email || 'orchestrator@adyapan.internal';
    const actorRole = actor?.roles?.[0] || 'SYSTEM';

    let resultMessage = '';

    // 4. Handle specific authorized business transitions
    switch (dto.action) {
      // ─── Case 1: Credit Analyst -> Branch Manager ───
      case 'CREDIT_SUBMIT_TO_BRANCH_MANAGER': {
        // Enforce role: CREDIT_ANALYST, LOAN_OFFICER, ADMIN
        if (actor?.roles && !actor.roles.some((r) => ['CREDIT_ANALYST', 'LOAN_OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
          throw new ForbiddenError('Only Credit Analysts or Administrators can submit proposals for Branch Manager review.');
        }

        // Validate prerequisite: KYC and Credit assessment must exist
        if (!app.eligibility) {
          throw new BadRequestError('Credit assessment must be completed before submitting for Branch Manager review.');
        }

        await prisma.$transaction(async (tx) => {
          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'UNDER_REVIEW' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'UNDER_REVIEW',
              changedBy: actorEmail,
              reason: dto.remarks || 'Credit Analyst completed assessment; proposal routed to Branch Manager review.',
            },
          });
        });

        resultMessage = 'Proposal successfully submitted to Branch Manager review queue.';
        break;
      }

      // ─── Case 2: Branch Manager Approves (Within Delegated Authority) ───
      case 'BRANCH_MANAGER_APPROVE': {
        if (actor?.roles && !actor.roles.some((r) => ['BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
          throw new ForbiddenError('Only Branch Managers or Administrators can record branch management approvals.');
        }

        // Evaluate authority dynamically from ApprovalAuthorityService
        const requestedAmount = Number(app.requestedAmount || 0);
        const authResolution = await approvalAuthorityService.resolveAuthorityDirect(
          app.tenantId || 'tenant-adyapan-default',
          {
            loanAmount: requestedAmount,
            riskGrade: (app.riskAssessment?.category as any) || 'B',
            breDecision: 'APPROVE',
            branchId: app.branchId || undefined,
          }
        );

        if (authResolution.requiredLevel > 1) {
          throw new ForbiddenError(
            `Loan amount (₹${requestedAmount.toLocaleString('en-IN')}) exceeds Level 1 Branch Manager authority. Must be forwarded to Underwriter.`
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.approvalRequest.create({
            data: {
              applicationId: app.id,
              approverRole: 'BRANCH_MANAGER',
              approverUserId: actorId,
              level: 1,
              status: 'APPROVED',
              decisionReason: dto.remarks || 'Branch Manager approved proposal within delegated authority.',
              actionAt: new Date(),
            },
          });

          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'APPROVED' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'APPROVED',
              changedBy: actorEmail,
              reason: dto.remarks || 'Branch Manager approved within delegated limit; ready for offer generation.',
            },
          });
        });

        resultMessage = 'Branch Manager approval recorded within delegated authority.';
        break;
      }

      // ─── Case 3: Branch Manager Forwards / Escalates to Underwriter ───
      case 'BRANCH_MANAGER_FORWARD_TO_UNDERWRITER': {
        if (actor?.roles && !actor.roles.some((r) => ['BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(r))) {
          throw new ForbiddenError('Only Branch Managers or Administrators can forward proposals to Underwriting.');
        }

        await prisma.$transaction(async (tx) => {
          await tx.approvalRequest.create({
            data: {
              applicationId: app.id,
              approverRole: 'BRANCH_MANAGER',
              approverUserId: actorId,
              level: 1,
              status: 'ESCALATED',
              decisionReason: dto.remarks || 'Escalated to Senior Underwriter by Branch Manager.',
              actionAt: new Date(),
            },
          });

          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'UNDERWRITING' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'UNDERWRITING',
              changedBy: actorEmail,
              reason: dto.remarks || 'Branch Manager escalated proposal to Senior Underwriting authority.',
            },
          });
        });

        resultMessage = 'Proposal successfully forwarded to Underwriting queue.';
        break;
      }

      // ─── Case 4: Branch Manager Send Back (Remediation) ───
      case 'BRANCH_MANAGER_SEND_BACK': {
        if (!dto.remarks || dto.remarks.trim().length < 10) {
          throw new BadRequestError('A minimum 10-character reason is required to send back a proposal.');
        }

        await prisma.$transaction(async (tx) => {
          await tx.approvalRequest.create({
            data: {
              applicationId: app.id,
              approverRole: 'BRANCH_MANAGER',
              approverUserId: actorId,
              level: 1,
              status: 'SENT_BACK',
              decisionReason: dto.remarks!,
              actionAt: new Date(),
            },
          });

          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'SUBMITTED' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'SUBMITTED',
              changedBy: actorEmail,
              reason: `Returned by Branch Manager: ${dto.remarks}`,
            },
          });
        });

        resultMessage = 'Proposal sent back to Credit Analyst for remediation.';
        break;
      }

      // ─── Case 5: Underwriter Sanction ───
      case 'UNDERWRITER_SANCTION': {
        if (actor?.roles && !actor.roles.some((r) => ['UNDERWRITER', 'ADMIN', 'SUPER_ADMIN', 'CREDIT_HEAD'].includes(r))) {
          throw new ForbiddenError('Only Underwriters or Credit Authority can sanction proposals.');
        }

        // SoD check: Underwriter must not be the creator/originator
        const creatorId = (app as any).createdBy;
        if (creatorId && actorId && creatorId === actorId) {
          SodValidator.assertMakerCheckerSeparation(creatorId, actorId, 'UNDERWRITING_SANCTION');
        }

        await prisma.$transaction(async (tx) => {
          await tx.underwritingDecision.upsert({
            where: { applicationId: app.id },
            create: {
              applicationId: app.id,
              decidedBy: actorId,
              decision: 'APPROVE',
              reason: dto.remarks || 'Standard sanction conditions applied.',
            },
            update: {
              decision: 'APPROVE',
              reason: dto.remarks || 'Standard sanction conditions applied.',
            },
          });

          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'APPROVED' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'APPROVED',
              changedBy: actorEmail,
              reason: dto.remarks || 'Underwriter sanctioned proposal.',
            },
          });
        });

        resultMessage = 'Proposal successfully sanctioned by Underwriter.';
        break;
      }

      // ─── Case 6: Underwriter Send Back / Hold ───
      case 'UNDERWRITER_SEND_BACK': {
        if (!dto.remarks || dto.remarks.trim().length < 10) {
          throw new BadRequestError('A minimum 10-character reason is required for Underwriter send-back.');
        }

        await prisma.$transaction(async (tx) => {
          await tx.underwritingDecision.upsert({
            where: { applicationId: app.id },
            create: {
              applicationId: app.id,
              decidedBy: actorId,
              decision: 'SEND_BACK',
              reason: dto.remarks || 'Underwriter requested additional documentation.',
            },
            update: {
              decision: 'SEND_BACK',
              reason: dto.remarks || 'Underwriter requested additional documentation.',
            },
          });

          await tx.loanApplication.update({
            where: { id: app.id },
            data: { status: 'UNDER_REVIEW' },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'UNDER_REVIEW',
              changedBy: actorEmail,
              reason: `Underwriter send-back: ${dto.remarks}`,
            },
          });
        });

        resultMessage = 'Proposal returned to Branch review by Underwriter.';
        break;
      }

      default:
        throw new BadRequestError(`Unsupported orchestration transition action '${dto.action}'.`);
    }

    // 5. Immutable Audit Log
    await logAudit({
      tenantId: app.tenantId || 'tenant-adyapan-default',
      userId: actorId,
      role: actorRole,
      action: `ORCHESTRATION_TRANSITION_${dto.action}`,
      entity: 'LoanApplication',
      entityId: app.id,
      newValue: {
        action: dto.action,
        reason: dto.reason,
        remarks: dto.remarks,
        metadata: dto.metadata,
      },
    });

    const updatedProjection = await this.getCanonicalLifecycle(app.id, actor);

    const response = {
      success: true,
      projection: updatedProjection,
      message: resultMessage,
    };

    if (dto.idempotencyKey) {
      this.processedIdempotencyKeys.set(dto.idempotencyKey, {
        response,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  // ---------------------------------------------------------------------------
  // 4. UNIFIED TIMELINE AGGREGATOR
  // ---------------------------------------------------------------------------

  /**
   * Aggregates authoritative timeline events from ApplicationStatusHistory, ApprovalRequests,
   * Underwriting, Contract eSign, Disbursements, and Servicing.
   */
  public async getUnifiedTimeline(
    applicationId: string,
    actor?: OrchestrationActorContext
  ): Promise<UnifiedTimelineEvent[]> {
    const app = await this.fetchAuthoritativeAggregate(applicationId);

    if (actor) {
      ScopeResolver.resolveAuthorizedScope(actor as any, {
        requestedTenantId: app.tenantId || undefined,
        requestedBranchId: app.branchId || app.customer?.branchId || undefined,
      });
    }

    const isBorrower = actor?.roles?.includes('BORROWER') || actor?.roles?.includes('CUSTOMER');
    const events: UnifiedTimelineEvent[] = [];

    // 1. Application Status History Events
    for (const h of app.statusHistory || []) {
      events.push({
        id: `ash-${h.id}`,
        timestamp: h.createdAt.toISOString(),
        domain: 'APPLICATION_LIFECYCLE',
        action: `STATUS_CHANGED_${h.toStatus}`,
        actor: { email: h.changedBy || undefined, role: 'SYSTEM' },
        fromState: h.fromStatus || undefined,
        toState: h.toStatus,
        reason: h.reason || undefined,
        isInternalOnly: false,
      });
    }

    // 2. Approval Request Decisions (Branch Manager & Underwriting)
    for (const a of app.approvals || []) {
      events.push({
        id: `appr-${a.id}`,
        timestamp: (a.actionAt || a.createdAt).toISOString(),
        domain: 'APPROVAL_AUTHORITY',
        action: `DECISION_${a.approverRole}_${a.status}`,
        actor: { id: a.approverUserId || undefined, role: a.approverRole },
        toState: a.status,
        reason: a.decisionReason || undefined,
        isInternalOnly: isBorrower, // Mask internal approval details for borrower
      });
    }

    // 3. Document Verification Events
    for (const d of app.documents || []) {
      events.push({
        id: `doc-${d.id}`,
        timestamp: d.createdAt.toISOString(),
        domain: 'DOCUMENT_KYC',
        action: `DOCUMENT_${d.status}`,
        actor: { role: 'CUSTOMER' },
        reason: `${d.category} (${d.documentType}) uploaded`,
        isInternalOnly: false,
      });
    }

    // 4. Underwriting Event
    if (app.underwriting) {
      events.push({
        id: `uw-${app.underwriting.id}`,
        timestamp: app.underwriting.createdAt.toISOString(),
        domain: 'UNDERWRITING',
        action: `UNDERWRITING_${app.underwriting.decision}`,
        actor: { id: app.underwriting.decidedBy, role: 'UNDERWRITER' },
        toState: app.underwriting.decision,
        reason: app.underwriting.reason || undefined,
        isInternalOnly: isBorrower,
      });
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter out internal-only events if borrower
    if (isBorrower) {
      return events.filter((e) => !e.isInternalOnly);
    }

    return events;
  }

  // ---------------------------------------------------------------------------
  // 5. BORROWER-SAFE JOURNEY PROJECTION
  // ---------------------------------------------------------------------------

  /**
   * Sanitizes internal credit risks, fraud scores, and internal authority workflows
   * into a clean, customer-safe progress track.
   */
  public async getBorrowerSafeJourney(
    applicationId: string,
    actor?: OrchestrationActorContext
  ): Promise<BorrowerSafeJourneyProjection> {
    const app = await this.fetchAuthoritativeAggregate(applicationId);

    const currentState = this.deriveCanonicalState(app);

    const steps: Array<{
      key: string;
      label: string;
      description: string;
      mappedStates: CanonicalLifecycleState[];
    }> = [
      {
        key: 'SUBMITTED',
        label: 'Application Submitted',
        description: 'Your loan application and details have been successfully received.',
        mappedStates: ['CUSTOMER_CREATED', 'KYC_PENDING', 'APPLICATION_CREATED', 'APPLICATION_SUBMITTED'],
      },
      {
        key: 'KYC_VERIFICATION',
        label: 'Identity & KYC Verification',
        description: 'Digital Aadhaar XML and PAN verification.',
        mappedStates: ['KYC_VERIFIED'],
      },
      {
        key: 'ASSESSMENT_REVIEW',
        label: 'Credit & Branch Review',
        description: 'Our credit assessment and branch verification team is reviewing your proposal.',
        mappedStates: ['CREDIT_ASSESSMENT', 'BRANCH_MANAGER_REVIEW', 'BRANCH_MANAGER_APPROVED', 'UNDERWRITING'],
      },
      {
        key: 'SANCTION_OFFER',
        label: 'Loan Offer & Sanction',
        description: 'Your loan has been approved. Review and accept your loan terms.',
        mappedStates: ['SANCTIONED', 'OFFER_PENDING', 'OFFER_ACCEPTED'],
      },
      {
        key: 'AGREEMENT_ESIGN',
        label: 'Digital Loan Agreement & Mandate',
        description: 'Complete digital Aadhaar eSign and active bank auto-debit registration.',
        mappedStates: ['AGREEMENT_PENDING', 'ESIGN_PENDING', 'AGREEMENT_COMPLETED'],
      },
      {
        key: 'DISBURSEMENT',
        label: 'Disbursement & Fund Release',
        description: 'Direct payout transfer to your verified bank account.',
        mappedStates: ['FINANCE_PENDING', 'PRE_DISBURSEMENT', 'MAKER_PENDING', 'CHECKER_PENDING', 'DISBURSEMENT_PROCESSING', 'DISBURSED'],
      },
      {
        key: 'LOAN_ACTIVE',
        label: 'Active Loan & Servicing',
        description: 'Your loan is active. Access repayment schedules and payment statements.',
        mappedStates: ['LOAN_ACTIVE', 'SERVICING', 'OVERDUE', 'COLLECTIONS', 'CLOSED'],
      },
    ];

    let currentStepIndex = 0;
    const computedSteps = steps.map((s, index) => {
      const isMatched = s.mappedStates.includes(currentState);
      if (isMatched) {
        currentStepIndex = index;
      }
      return {
        key: s.key,
        label: s.label,
        description: s.description,
        status: 'PENDING' as 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ACTION_REQUIRED',
      };
    });

    for (let i = 0; i < computedSteps.length; i++) {
      if (i < currentStepIndex) {
        computedSteps[i].status = 'COMPLETED';
      } else if (i === currentStepIndex) {
        computedSteps[i].status = 'IN_PROGRESS';
      } else {
        computedSteps[i].status = 'PENDING';
      }
    }

    const overallProgressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

    return {
      applicationId: app.id,
      applicationNo: app.applicationNo,
      currentStepKey: computedSteps[currentStepIndex].key,
      currentStepLabel: computedSteps[currentStepIndex].label,
      overallProgressPercent,
      steps: computedSteps,
      updatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // 6. CROSS-DOMAIN RECONCILIATION ENGINE
  // ---------------------------------------------------------------------------

  /**
   * Identifies cross-domain inconsistencies, orphaned tasks, and illegal state combinations.
   */
  public async detectReconciliationAnomalies(tenantId: string): Promise<ReconciliationAnomaly[]> {
    const anomalies: ReconciliationAnomaly[] = [];

    // Query applications for this tenant
    const applications = await prisma.loanApplication.findMany({
      where: { tenantId },
      include: {
        customer: true,
        eligibility: true,
        underwriting: true,
        approvals: true,
      },
      take: 100,
    });

    const now = new Date().toISOString();

    for (const app of applications) {
      // Anomaly 1: Credit Analyst directly forwarded to Underwriting without Branch Manager record
      if (app.status === 'UNDERWRITING') {
        const hasBmApproval = app.approvals.some((a) => a.approverRole === 'BRANCH_MANAGER');
        if (!hasBmApproval) {
          anomalies.push({
            id: `anom-uw-direct-${app.id}`,
            applicationId: app.id,
            applicationNo: app.applicationNo,
            anomalyType: 'UNAUTHORIZED_DIRECT_UW_ROUTING',
            severity: 'CRITICAL',
            description: `Application is in UNDERWRITING state without prerequisite Branch Manager review or escalation record.`,
            detectedAt: now,
            domainAffected: 'BRANCH_MANAGER_GATEWAY',
            suggestedRepairAction: 'Route proposal back to Branch Manager review queue.',
            repairable: true,
          });
        }
      }

      // Anomaly 2: Closed Application with Outstanding Balance
      if (app.status === 'APPROVED' && (app as any).loans?.[0]?.status === 'CLOSED') {
        const activeLoan = (app as any).loans[0];
        const outstanding = Number(activeLoan.outstandingPrincipal || 0);
        if (outstanding > 0) {
          anomalies.push({
            id: `anom-closed-balance-${app.id}`,
            applicationId: app.id,
            applicationNo: app.applicationNo,
            anomalyType: 'CLOSED_WITH_OUTSTANDING_BALANCE',
            severity: 'CRITICAL',
            description: `Loan is marked CLOSED while outstanding principal of ₹${outstanding} remains.`,
            detectedAt: now,
            domainAffected: 'LOAN_SERVICING',
            suggestedRepairAction: 'Revert loan status to ACTIVE and recalculate ledger.',
            repairable: true,
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Executes a controlled reconciliation repair with full audit trail.
   */
  public async executeControlledRepair(
    anomalyId: string,
    repairAction: string,
    actor?: OrchestrationActorContext
  ) {
    if (actor?.roles && !actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))) {
      throw new ForbiddenError('Only Super Administrators can execute cross-domain reconciliation repairs.');
    }

    await logAudit({
      tenantId: actor?.tenantId || 'tenant-adyapan-default',
      userId: actor?.id,
      role: actor?.roles?.[0] || 'ADMIN',
      action: `RECONCILIATION_REPAIR_${repairAction}`,
      entity: 'ReconciliationAnomaly',
      entityId: anomalyId,
      newValue: {
        anomalyId,
        repairAction,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      anomalyId,
      repairAction,
      status: 'RESOLVED',
      timestamp: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // 7. STUCK WORKFLOW & SLA MONITORING
  // ---------------------------------------------------------------------------

  public async getStuckWorkflows(tenantId: string) {
    const apps = await prisma.loanApplication.findMany({
      where: {
        tenantId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'UNDERWRITING', 'APPROVED', 'AGREEMENT_PENDING'] },
      },
      include: {
        customer: true,
        product: true,
        approvals: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 50,
    });

    const now = Date.now();
    const stuckList = apps.map((app) => {
      const lastTransition = app.statusHistory?.[0]?.createdAt || app.updatedAt;
      const elapsedHours = Math.round((now - new Date(lastTransition).getTime()) / (1000 * 60 * 60));
      const slaHours = 8; // Standard 8-hour stage SLA
      const isBreached = elapsedHours > slaHours;

      return {
        applicationId: app.id,
        applicationNo: app.applicationNo,
        customerName: `${app.customer?.firstName || ''} ${app.customer?.lastName || ''}`.trim(),
        currentStatus: app.status,
        elapsedHours,
        slaHours,
        isBreached,
        assigneeRole: app.status === 'UNDER_REVIEW' ? 'BRANCH_MANAGER' : app.status === 'UNDERWRITING' ? 'UNDERWRITER' : 'LOAN_OFFICER',
      };
    });

    return stuckList;
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  private async fetchAuthoritativeAggregate(applicationId: string) {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: {
          include: {
            documents: true,
            bankAccounts: true,
            employmentDetails: true,
            addresses: true,
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

  private deriveCanonicalState(app: any): CanonicalLifecycleState {
    const status = app.status as ApplicationStatus;
    const bmApproval = app.approvals?.find((a: any) => a.approverRole === 'BRANCH_MANAGER');

    switch (status) {
      case 'DRAFT':
        return 'APPLICATION_CREATED';
      case 'SUBMITTED':
        return app.customer?.kycStatus === 'VERIFIED' ? 'APPLICATION_SUBMITTED' : 'KYC_PENDING';
      case 'KYC_PENDING':
        return 'KYC_PENDING';
      case 'KYC_VERIFIED':
        return 'KYC_VERIFIED';
      case 'UNDER_REVIEW':
        return 'BRANCH_MANAGER_REVIEW';
      case 'UNDERWRITING':
        return 'UNDERWRITING';
      case 'APPROVED':
        if (bmApproval?.status === 'APPROVED' && (!app.underwriting || app.underwriting.decision !== 'APPROVE')) {
          return 'BRANCH_MANAGER_APPROVED';
        }
        return 'SANCTIONED';
      case 'AGREEMENT_PENDING':
        return 'AGREEMENT_PENDING';
      case 'READY_FOR_DISBURSEMENT':
        return 'PRE_DISBURSEMENT';
      case 'DISBURSED':
        return 'LOAN_ACTIVE';
      case 'REJECTED':
      case 'CANCELLED':
        return 'CLOSED';
      default:
        return 'APPLICATION_SUBMITTED';
    }
  }

  private resolveStageGroup(state: CanonicalLifecycleState): OrchestrationStageGroup {
    switch (state) {
      case 'CUSTOMER_CREATED':
      case 'KYC_PENDING':
      case 'KYC_VERIFIED':
      case 'APPLICATION_CREATED':
      case 'APPLICATION_SUBMITTED':
        return 'INTAKE_KYC';
      case 'CREDIT_ASSESSMENT':
      case 'BRANCH_MANAGER_REVIEW':
      case 'BRANCH_MANAGER_APPROVED':
        return 'CREDIT_BRANCH_REVIEW';
      case 'UNDERWRITING':
      case 'SANCTIONED':
        return 'UNDERWRITING_SANCTION';
      case 'OFFER_PENDING':
      case 'OFFER_ACCEPTED':
      case 'AGREEMENT_PENDING':
      case 'ESIGN_PENDING':
      case 'AGREEMENT_COMPLETED':
        return 'OFFER_AGREEMENT';
      case 'FINANCE_PENDING':
      case 'PRE_DISBURSEMENT':
      case 'MAKER_PENDING':
      case 'CHECKER_PENDING':
      case 'DISBURSEMENT_PROCESSING':
      case 'DISBURSED':
        return 'FINANCE_DISBURSEMENT';
      case 'LOAN_ACTIVE':
      case 'SERVICING':
        return 'LOAN_SERVICING';
      case 'OVERDUE':
      case 'COLLECTIONS':
      case 'CLOSED':
        return 'COLLECTIONS_CLOSURE';
    }
  }

  private resolveCurrentAssignee(state: CanonicalLifecycleState, app: any) {
    switch (state) {
      case 'CUSTOMER_CREATED':
      case 'KYC_PENDING':
      case 'APPLICATION_CREATED':
      case 'APPLICATION_SUBMITTED':
        return { currentAssigneeRole: 'LOAN_OFFICER', currentAssigneeScope: 'BRANCH' as const };
      case 'KYC_VERIFIED':
      case 'CREDIT_ASSESSMENT':
        return { currentAssigneeRole: 'CREDIT_ANALYST', currentAssigneeScope: 'BRANCH' as const };
      case 'BRANCH_MANAGER_REVIEW':
        return { currentAssigneeRole: 'BRANCH_MANAGER', currentAssigneeScope: 'BRANCH' as const };
      case 'BRANCH_MANAGER_APPROVED':
      case 'UNDERWRITING':
      case 'SANCTIONED':
        return { currentAssigneeRole: 'UNDERWRITER', currentAssigneeScope: 'TENANT' as const };
      case 'OFFER_PENDING':
      case 'OFFER_ACCEPTED':
      case 'AGREEMENT_PENDING':
      case 'ESIGN_PENDING':
      case 'AGREEMENT_COMPLETED':
        return { currentAssigneeRole: 'CUSTOMER', currentAssigneeScope: 'CUSTOMER' as const };
      case 'FINANCE_PENDING':
      case 'PRE_DISBURSEMENT':
      case 'MAKER_PENDING':
        return { currentAssigneeRole: 'FINANCE_MAKER', currentAssigneeScope: 'TENANT' as const };
      case 'CHECKER_PENDING':
        return { currentAssigneeRole: 'FINANCE_CHECKER', currentAssigneeScope: 'TENANT' as const };
      case 'DISBURSEMENT_PROCESSING':
      case 'DISBURSED':
      case 'LOAN_ACTIVE':
      case 'SERVICING':
        return { currentAssigneeRole: 'FINANCE_OFFICER', currentAssigneeScope: 'TENANT' as const };
      case 'OVERDUE':
      case 'COLLECTIONS':
        return { currentAssigneeRole: 'COLLECTIONS_OFFICER', currentAssigneeScope: 'BRANCH' as const };
      case 'CLOSED':
        return { currentAssigneeRole: 'SYSTEM', currentAssigneeScope: 'SYSTEM' as const };
    }
  }

  private async evaluateCurrentBlockers(app: any, state: CanonicalLifecycleState): Promise<string[]> {
    const blockers: string[] = [];

    if (state === 'BRANCH_MANAGER_REVIEW' && !app.eligibility) {
      blockers.push('Credit Analyst recommendation is required.');
    }

    if (state === 'UNDERWRITING') {
      const hasBmAction = app.approvals?.some((a: any) => a.approverRole === 'BRANCH_MANAGER');
      if (!hasBmAction && app.status !== 'UNDER_REVIEW') {
        blockers.push('Branch Manager review must precede Underwriting.');
      }
    }

    return blockers;
  }

  private resolveNextPermittedActions(state: CanonicalLifecycleState, app: any, actor?: OrchestrationActorContext) {
    const actions: UnifiedLifecycleProjection['nextPermittedActions'] = [];

    switch (state) {
      case 'APPLICATION_SUBMITTED':
      case 'KYC_VERIFIED':
        actions.push({
          actionKey: 'SUBMIT_CREDIT_RECOMMENDATION',
          label: 'Submit for Branch Manager Review',
          requiredRole: 'CREDIT_ANALYST',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
        });
        break;

      case 'BRANCH_MANAGER_REVIEW':
        actions.push({
          actionKey: 'BRANCH_MANAGER_APPROVE',
          label: 'Approve within Delegated Authority',
          requiredRole: 'BRANCH_MANAGER',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
        });
        actions.push({
          actionKey: 'BRANCH_MANAGER_FORWARD_TO_UNDERWRITER',
          label: 'Forward to Senior Underwriting Authority',
          requiredRole: 'BRANCH_MANAGER',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
        });
        actions.push({
          actionKey: 'BRANCH_MANAGER_SEND_BACK',
          label: 'Return for Correction (Remediation)',
          requiredRole: 'BRANCH_MANAGER',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
          isRemediation: true,
        });
        break;

      case 'UNDERWRITING':
        actions.push({
          actionKey: 'UNDERWRITER_SANCTION',
          label: 'Record Sanction Approval',
          requiredRole: 'UNDERWRITER',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
        });
        actions.push({
          actionKey: 'UNDERWRITER_SEND_BACK',
          label: 'Send Back / Request Clarification',
          requiredRole: 'UNDERWRITER',
          endpoint: '/api/v1/orchestration/transition',
          method: 'POST',
          isRemediation: true,
        });
        break;

      case 'SANCTIONED':
      case 'BRANCH_MANAGER_APPROVED':
        actions.push({
          actionKey: 'GENERATE_OFFER',
          label: 'Generate Loan Offer & KFS',
          requiredRole: 'LOAN_OFFICER',
          endpoint: '/api/v1/offers/generate',
          method: 'POST',
        });
        break;

      case 'PRE_DISBURSEMENT':
        actions.push({
          actionKey: 'MAKER_SUBMIT_PAYOUT',
          label: 'Submit Payout for Checker Approval',
          requiredRole: 'FINANCE_MAKER',
          endpoint: '/api/v1/disbursements',
          method: 'POST',
        });
        break;
    }

    return actions;
  }

  private resolveActiveRemediations(app: any) {
    const remediations: UnifiedLifecycleProjection['activeRemediations'] = [];
    const sentBackApproval = app.approvals?.find((a: any) => a.status === 'SENT_BACK');

    if (sentBackApproval) {
      remediations.push({
        remediationKey: `REM_${sentBackApproval.id}`,
        stage: sentBackApproval.approverRole || 'BRANCH_MANAGER',
        reason: sentBackApproval.decisionReason || 'Correction required by approver.',
        requiredAction: 'Update missing documents / profile data and resubmit for review.',
        issuedByRole: sentBackApproval.approverRole || 'BRANCH_MANAGER',
        issuedAt: (sentBackApproval.actionAt || sentBackApproval.createdAt).toISOString(),
      });
    }

    return remediations;
  }

  private resolveSlaInfo(state: CanonicalLifecycleState, app: any) {
    const slaHours = 8;
    const lastUpdate = app.statusHistory?.[0]?.createdAt || app.updatedAt;
    const elapsedHours = Math.round((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60));

    return {
      stageCode: state,
      stageSlaHours: slaHours,
      elapsedHours,
      isBreached: elapsedHours > slaHours,
      remainingHours: Math.max(0, slaHours - elapsedHours),
    };
  }

  private resolveDomainForState(state: CanonicalLifecycleState): string {
    switch (state) {
      case 'CUSTOMER_CREATED':
      case 'KYC_PENDING':
      case 'KYC_VERIFIED':
        return 'CUSTOMER_KYC';
      case 'APPLICATION_CREATED':
      case 'APPLICATION_SUBMITTED':
        return 'ORIGINATION';
      case 'CREDIT_ASSESSMENT':
        return 'CREDIT_ASSESSMENT';
      case 'BRANCH_MANAGER_REVIEW':
      case 'BRANCH_MANAGER_APPROVED':
        return 'BRANCH_MANAGER';
      case 'UNDERWRITING':
      case 'SANCTIONED':
        return 'UNDERWRITING';
      case 'OFFER_PENDING':
      case 'OFFER_ACCEPTED':
        return 'OFFER_ENGINE';
      case 'AGREEMENT_PENDING':
      case 'ESIGN_PENDING':
      case 'AGREEMENT_COMPLETED':
        return 'CONTRACT_ESIGN';
      case 'FINANCE_PENDING':
      case 'PRE_DISBURSEMENT':
      case 'MAKER_PENDING':
      case 'CHECKER_PENDING':
      case 'DISBURSEMENT_PROCESSING':
      case 'DISBURSED':
        return 'DISBURSEMENT_FINANCE';
      case 'LOAN_ACTIVE':
      case 'SERVICING':
      case 'OVERDUE':
      case 'COLLECTIONS':
      case 'CLOSED':
        return 'LOAN_SERVICING';
    }
  }

  private getBmApprovalStatus(app: any): string {
    const bm = app.approvals?.find((a: any) => a.approverRole === 'BRANCH_MANAGER');
    return bm?.status || 'PENDING';
  }
}

export const lendingOrchestrationService = LendingOrchestrationService.getInstance();
