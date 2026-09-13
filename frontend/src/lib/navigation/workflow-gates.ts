// Workflow-Gated Navigation & Stage-Gate Invariants for Adyapan Lending OS (Phase P3)

export type ApplicationWorkflowStage =
  | 'DRAFT'
  | 'KYC_PENDING'
  | 'KYC_VERIFIED'
  | 'CREDIT_REVIEW_PENDING'
  | 'UNDERWRITING_PENDING'
  | 'SANCTIONED'
  | 'OFFER_GENERATED'
  | 'OFFER_ACCEPTED'
  | 'ESIGN_MANDATE_PENDING'
  | 'DISBURSEMENT_READY'
  | 'DISBURSED'
  | 'ACTIVE'
  | 'DELINQUENT'
  | 'SETTLED'
  | 'WRITTEN_OFF'
  | 'CLOSED'
  | 'REJECTED';

export interface WorkflowPrerequisite {
  key: string;
  label: string;
  isCompleted: boolean;
  blockingReason?: string;
  requiredCondition: string;
}

export interface LockedWorkflowAction {
  actionKey: string;
  actionLabel: string;
  isLocked: boolean;
  lockReason: string;
  requiredPrerequisites: string[];
  targetRoute?: string;
}

export interface WorkflowNextAction {
  actionKey: string;
  actionLabel: string;
  description: string;
  targetRoute: string;
  requiredRole: string;
  isBlocked: boolean;
  blockingReason?: string;
}

export interface WorkflowStageGateEvaluation {
  stage: ApplicationWorkflowStage;
  stageLabel: string;
  stageDescription: string;
  completedPrerequisites: WorkflowPrerequisite[];
  pendingPrerequisites: WorkflowPrerequisite[];
  lockedActions: LockedWorkflowAction[];
  nextValidAction: WorkflowNextAction;
}

/**
 * Evaluates the workflow state of an application and returns authoritative stage-gate status,
 * completed prerequisites, pending blockers, locked actions with explanation, and next valid action.
 */
export function evaluateWorkflowStageGate(
  stage: ApplicationWorkflowStage,
  context?: {
    isKycComplete?: boolean;
    isBureauChecked?: boolean;
    isCreditAssessed?: boolean;
    isUnderwritten?: boolean;
    isOfferAccepted?: boolean;
    isEsignComplete?: boolean;
    isMandateActive?: boolean;
    isDisbursementApproved?: boolean;
    dpd?: number;
    outstandingBalance?: number;
  }
): WorkflowStageGateEvaluation {
  const ctx = {
    isKycComplete: context?.isKycComplete ?? (['KYC_VERIFIED', 'CREDIT_REVIEW_PENDING', 'UNDERWRITING_PENDING', 'SANCTIONED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'ESIGN_MANDATE_PENDING', 'DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isBureauChecked: context?.isBureauChecked ?? (['CREDIT_REVIEW_PENDING', 'UNDERWRITING_PENDING', 'SANCTIONED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'ESIGN_MANDATE_PENDING', 'DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isCreditAssessed: context?.isCreditAssessed ?? (['UNDERWRITING_PENDING', 'SANCTIONED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'ESIGN_MANDATE_PENDING', 'DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isUnderwritten: context?.isUnderwritten ?? (['SANCTIONED', 'OFFER_GENERATED', 'OFFER_ACCEPTED', 'ESIGN_MANDATE_PENDING', 'DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isOfferAccepted: context?.isOfferAccepted ?? (['OFFER_ACCEPTED', 'ESIGN_MANDATE_PENDING', 'DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isEsignComplete: context?.isEsignComplete ?? (['DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isMandateActive: context?.isMandateActive ?? (['DISBURSEMENT_READY', 'DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    isDisbursementApproved: context?.isDisbursementApproved ?? (['DISBURSED', 'ACTIVE', 'DELINQUENT', 'CLOSED'].includes(stage)),
    dpd: context?.dpd ?? 0,
    outstandingBalance: context?.outstandingBalance ?? 0,
  };

  const allPrerequisites: WorkflowPrerequisite[] = [
    {
      key: 'KYC',
      label: 'Dynamic KYC & Aadhaar/PAN Verification',
      isCompleted: ctx.isKycComplete,
      blockingReason: ctx.isKycComplete ? undefined : 'Customer identity verification is pending or incomplete.',
      requiredCondition: 'Verified Aadhaar XML + PAN verification and live photo matching.',
    },
    {
      key: 'BUREAU_BANKING',
      label: 'Credit Bureau & Bank Statement Analysis',
      isCompleted: ctx.isBureauChecked,
      blockingReason: ctx.isBureauChecked ? undefined : 'Credit bureau pull (CRIF/CIBIL) and bank statement parsing pending.',
      requiredCondition: 'Active bureau score pull and 6-month bank statement analytics.',
    },
    {
      key: 'CREDIT_APPRAISAL',
      label: 'Credit Appraisal & 6-Pillar Risk Engine',
      isCompleted: ctx.isCreditAssessed,
      blockingReason: ctx.isCreditAssessed ? undefined : 'Credit Analyst assessment and risk band scoring pending.',
      requiredCondition: 'FOIR/DTI calculation, BRE rule execution, and credit score assignment.',
    },
    {
      key: 'UNDERWRITING_SANCTION',
      label: 'Underwriting Sanction & Delegated Authority',
      isCompleted: ctx.isUnderwritten,
      blockingReason: ctx.isUnderwritten ? undefined : 'Credit Committee / Underwriter approval pending.',
      requiredCondition: 'Underwriter sanction within delegated financial limit and KFS generation.',
    },
    {
      key: 'OFFER_ACCEPTANCE',
      label: 'Borrower Sanction Letter & KFS Acceptance',
      isCompleted: ctx.isOfferAccepted,
      blockingReason: ctx.isOfferAccepted ? undefined : 'Borrower has not yet accepted the generated loan offer.',
      requiredCondition: 'Customer review and acceptance of Key Fact Statement (KFS) terms.',
    },
    {
      key: 'ESIGN_AND_MANDATE',
      label: 'Digital eSign & e-NACH Auto-Debit Mandate',
      isCompleted: ctx.isEsignComplete && ctx.isMandateActive,
      blockingReason: (ctx.isEsignComplete && ctx.isMandateActive) ? undefined : 'Digital contract eSignature or e-NACH mandate setup pending.',
      requiredCondition: 'Aadhaar eSign contract + active NPCI/e-NACH auto-debit registration.',
    },
    {
      key: 'DISBURSEMENT_GATEKEEPER',
      label: '10-Point Pre-Disbursement Gatekeeper',
      isCompleted: ctx.isDisbursementApproved,
      blockingReason: ctx.isDisbursementApproved ? undefined : '10-point statutory compliance and nodal bank verification pending.',
      requiredCondition: 'Penny drop account match, verified KFS, active mandate, and dual-control signoff.',
    },
  ];

  const completedPrerequisites = allPrerequisites.filter((p) => p.isCompleted);
  const pendingPrerequisites = allPrerequisites.filter((p) => !p.isCompleted);

  const lockedActions: LockedWorkflowAction[] = [
    {
      actionKey: 'ASSESS_CREDIT',
      actionLabel: 'Perform Credit Assessment',
      isLocked: !ctx.isKycComplete,
      lockReason: 'Locked: Dynamic KYC verification must be completed first.',
      requiredPrerequisites: ['KYC'],
      targetRoute: '/credit-assessment',
    },
    {
      actionKey: 'UNDERWRITE_SANCTION',
      actionLabel: 'Sanction Loan Proposal',
      isLocked: !ctx.isCreditAssessed,
      lockReason: 'Locked: Credit assessment and risk scoring must be completed first.',
      requiredPrerequisites: ['KYC', 'CREDIT_APPRAISAL'],
      targetRoute: '/underwriting',
    },
    {
      actionKey: 'GENERATE_OFFER',
      actionLabel: 'Generate Loan Offer / KFS',
      isLocked: !ctx.isUnderwritten,
      lockReason: 'Locked: Underwriting sanction approval is required before offer generation.',
      requiredPrerequisites: ['UNDERWRITING_SANCTION'],
      targetRoute: '/offers',
    },
    {
      actionKey: 'EXECUTE_ESIGN_MANDATE',
      actionLabel: 'Execute Digital Contract & Mandate',
      isLocked: !ctx.isOfferAccepted,
      lockReason: 'Locked: Borrower must accept the loan offer terms before executing contract.',
      requiredPrerequisites: ['OFFER_ACCEPTANCE'],
      targetRoute: '/customer/dashboard',
    },
    {
      actionKey: 'DISBURSE_PAYOUT',
      actionLabel: 'Execute Fund Disbursement (IMPS/NEFT)',
      isLocked: !(ctx.isEsignComplete && ctx.isMandateActive),
      lockReason: 'Locked: Contract eSign and active e-NACH auto-debit mandate are mandatory prerequisites.',
      requiredPrerequisites: ['ESIGN_AND_MANDATE'],
      targetRoute: '/disbursements',
    },
  ];

  // Determine authoritative Next Valid Action
  let nextValidAction: WorkflowNextAction;
  let stageLabel: string = stage;
  let stageDescription: string = 'Application workflow lifecycle';

  switch (stage) {
    case 'DRAFT':
    case 'KYC_PENDING':
      stageLabel = 'KYC & Documentation Pending';
      stageDescription = 'Customer onboarding and identity documentation underway';
      nextValidAction = {
        actionKey: 'COMPLETE_KYC',
        actionLabel: 'Complete KYC Verification',
        description: 'Verify Aadhaar/PAN identity documents and capture liveness selfie.',
        targetRoute: '/customers',
        requiredRole: 'LOAN_OFFICER',
        isBlocked: false,
      };
      break;

    case 'KYC_VERIFIED':
    case 'CREDIT_REVIEW_PENDING':
      stageLabel = 'Credit Appraisal Pending';
      stageDescription = 'KYC verified. Credit assessment and financial evaluation ready.';
      nextValidAction = {
        actionKey: 'START_CREDIT_ASSESSMENT',
        actionLabel: 'Start Credit Assessment',
        description: 'Evaluate bank statement cash flows, compute FOIR/DTI, and run BRE rules.',
        targetRoute: '/credit-assessment',
        requiredRole: 'CREDIT_ANALYST',
        isBlocked: !ctx.isKycComplete,
        blockingReason: !ctx.isKycComplete ? 'KYC verification must be completed first.' : undefined,
      };
      break;

    case 'UNDERWRITING_PENDING':
      stageLabel = 'Underwriting Sanction Pending';
      stageDescription = 'Credit assessment complete. Ready for underwriter decisioning.';
      nextValidAction = {
        actionKey: 'SANCTION_APPLICATION',
        actionLabel: 'Sanction Application',
        description: 'Review risk signals, sanction amount within authority limit, and approve KFS.',
        targetRoute: '/underwriting',
        requiredRole: 'UNDERWRITER',
        isBlocked: !ctx.isCreditAssessed,
        blockingReason: !ctx.isCreditAssessed ? 'Credit assessment must be completed first.' : undefined,
      };
      break;

    case 'SANCTIONED':
    case 'OFFER_GENERATED':
      stageLabel = 'Offer Awaiting Acceptance';
      stageDescription = 'Sanction approved. Key Fact Statement (KFS) generated for borrower review.';
      nextValidAction = {
        actionKey: 'ACCEPT_OFFER',
        actionLabel: 'Review & Accept Offer',
        description: 'Borrower must review APR, charges, EMI schedule, and accept KFS.',
        targetRoute: '/customer/dashboard',
        requiredRole: 'CUSTOMER',
        isBlocked: false,
      };
      break;

    case 'OFFER_ACCEPTED':
    case 'ESIGN_MANDATE_PENDING':
      stageLabel = 'eSign & Auto-Debit Mandate Required';
      stageDescription = 'Offer accepted. Digital loan agreement signature and e-NACH setup required.';
      nextValidAction = {
        actionKey: 'SETUP_MANDATE_ESIGN',
        actionLabel: 'Complete eSign & e-NACH Mandate',
        description: 'Sign Aadhaar eSign contract and register auto-debit mandate via Netbanking/UPI.',
        targetRoute: '/customer/dashboard',
        requiredRole: 'CUSTOMER',
        isBlocked: false,
      };
      break;

    case 'DISBURSEMENT_READY':
      stageLabel = 'Pre-Disbursement Gatekeeper Ready';
      stageDescription = 'Contract signed and mandate registered. Ready for 10-point gatekeeper verification.';
      nextValidAction = {
        actionKey: 'EXECUTE_DISBURSEMENT',
        actionLabel: 'Pass 10-Point Gate & Disburse',
        description: 'Verify penny drop, nodal bank balance, and trigger instant IMPS/NEFT transfer.',
        targetRoute: '/disbursements',
        requiredRole: 'FINANCE_OFFICER',
        isBlocked: !(ctx.isEsignComplete && ctx.isMandateActive),
        blockingReason: !(ctx.isEsignComplete && ctx.isMandateActive) ? 'Contract eSign and mandate must be active.' : undefined,
      };
      break;

    case 'DISBURSED':
    case 'ACTIVE':
      stageLabel = 'Loan Active & Servicing';
      stageDescription = 'Loan disbursed and active. Track EMI repayments and ledger postings.';
      nextValidAction = {
        actionKey: 'VIEW_LOAN_ACCOUNT',
        actionLabel: 'View Active Loan Servicing',
        description: 'Monitor payment schedule, waterfall ledger, and foreclosure options.',
        targetRoute: '/loans',
        requiredRole: 'FINANCE_OFFICER',
        isBlocked: false,
      };
      break;

    case 'DELINQUENT':
      stageLabel = 'Delinquency & Collections Queue';
      stageDescription = 'Overdue installments detected. Active in DPD aging collections bucket.';
      nextValidAction = {
        actionKey: 'LOG_PTP_FOLLOWUP',
        actionLabel: 'Record Promise-to-Pay (PTP)',
        description: 'Engage borrower, record contact notes, and set PTP commitment date.',
        targetRoute: '/collections',
        requiredRole: 'COLLECTION_OFFICER',
        isBlocked: false,
      };
      break;

    case 'SETTLED':
    case 'WRITTEN_OFF':
    case 'CLOSED':
      stageLabel = `Loan ${stage.replace('_', ' ')}`;
      stageDescription = 'Loan lifecycle concluded. Balance zeroed and audit trail sealed.';
      nextValidAction = {
        actionKey: 'DOWNLOAD_NOC',
        actionLabel: 'Issue No Objection Certificate (NOC)',
        description: 'Generate cryptographically signed loan closure and NOC document.',
        targetRoute: '/loans',
        requiredRole: 'FINANCE_OFFICER',
        isBlocked: false,
      };
      break;

    case 'REJECTED':
      stageLabel = 'Application Rejected';
      stageDescription = 'Proposal declined based on BRE policy rules or adverse risk signals.';
      nextValidAction = {
        actionKey: 'VIEW_ADVERSE_REASON',
        actionLabel: 'Review Rejection Audit',
        description: 'Inspect BRE rule failure logs and cooling-off reapplication window.',
        targetRoute: '/applications',
        requiredRole: 'LOAN_OFFICER',
        isBlocked: false,
      };
      break;

    default:
      stageLabel = String(stage);
      nextValidAction = {
        actionKey: 'VIEW_DETAILS',
        actionLabel: 'View Application Details',
        description: 'Inspect current state and historical activity.',
        targetRoute: '/applications',
        requiredRole: 'LOAN_OFFICER',
        isBlocked: false,
      };
  }

  return {
    stage,
    stageLabel,
    stageDescription,
    completedPrerequisites,
    pendingPrerequisites,
    lockedActions,
    nextValidAction,
  };
}
