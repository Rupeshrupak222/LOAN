export enum CustomerLifecycleState {
  NEW = 'NEW',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  KYC_PENDING = 'KYC_PENDING',
  KYC_VERIFIED = 'KYC_VERIFIED',
  ELIGIBILITY_PENDING = 'ELIGIBILITY_PENDING',
  ELIGIBLE = 'ELIGIBLE',
  ACTIVE_BORROWER = 'ACTIVE_BORROWER',
  REPEAT_BORROWER = 'REPEAT_BORROWER',
  CREDIT_LINE_CUSTOMER = 'CREDIT_LINE_CUSTOMER',
  SUSPENDED = 'SUSPENDED',
}

export enum DirectLendingChannel {
  DIRECT_WEB = 'DIRECT_WEB',
  MOBILE_APP = 'MOBILE_APP',
  EMBEDDED_SDK = 'EMBEDDED_SDK',
}

export interface DirectLendingContext {
  customerId?: string;
  userId?: string;
  tenantId?: string;
  branchId?: string;
  roles?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface NextActionRecommendation {
  actionType:
    | 'COMPLETE_PROFILE'
    | 'COMPLETE_KYC'
    | 'VERIFY_BANK'
    | 'CHECK_ELIGIBILITY'
    | 'REVIEW_OFFER'
    | 'SIGN_AGREEMENT'
    | 'SETUP_MANDATE'
    | 'VIEW_DISBURSEMENT'
    | 'PAY_EMI'
    | 'DRAWDOWN_CREDIT'
    | 'APPLY_REPEAT_LOAN'
    | 'NO_ACTION_REQUIRED';
  title: string;
  description: string;
  buttonText: string;
  targetUrl: string;
  isUrgent: boolean;
  stageName: string;
  metadata?: Record<string, any>;
}

export interface PreQualificationRequest {
  requestedAmount: number;
  tenureMonths: number;
  productId?: string;
  monthlyIncome?: number;
  employmentType?: string;
  city?: string;
  pincode?: string;
}

export interface PreQualificationProductOption {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  eligibleAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  interestRateAnnualPct: number;
  processingFeePct: number;
  estimatedEmi: number;
  estimatedTotalRepayment: number;
  aprEstimated: number;
  isPreQualified: boolean;
  unmetCriteria?: string[];
}

export interface PreQualificationResponse {
  isEligible: boolean;
  maxEligibleAmount: number;
  requestedAmount: number;
  tenureMonths: number;
  recommendedProduct?: PreQualificationProductOption;
  availableProducts: PreQualificationProductOption[];
  disclaimer: string;
  evaluatedAt: string;
}

export interface DirectApplyRequest {
  productId: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose?: string;
  bankAccountId?: string;
  consentIds?: string[];
}

export interface DirectDecisionResponse {
  applicationId: string;
  applicationNo: string;
  status: string;
  decision: 'APPROVED' | 'REFER' | 'REJECT' | 'UNDER_REVIEW';
  safeMessage: string;
  approvedAmount?: number;
  approvedTenureMonths?: number;
  nextStep: string;
  offerId?: string;
}

export interface RepeatBorrowingEvaluation {
  isEligibleForRepeatLoan: boolean;
  customerId: string;
  currentActiveLoansCount: number;
  totalOutstandingAmount: number;
  historicalOnTimePaymentCount: number;
  currentDpd: number;
  maxRepeatLoanLimit: number;
  eligibleProducts: {
    productId: string;
    productName: string;
    maxLimit: number;
    interestRate: number;
    tenures: number[];
  }[];
  reasons: string[];
  safeCustomerMessage: string;
}

export interface CreditReassessmentRequest {
  requestedLimit?: number;
  reassessmentType?: string;
  reason?: string;
}

export interface CreditReassessmentResult {
  reassessmentId: string;
  customerId: string;
  currentLimit: number;
  proposedLimit: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  evaluationScore: number;
  factors: string[];
  message: string;
}

export interface CustomerConsentInput {
  consentType: string;
  purpose: string;
  version?: string;
  channel?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SafeBorrowerLoanDetail {
  id: string;
  loanNo: string;
  lenderName: string;
  productName: string;
  productCode: string;
  principalAmount: number;
  netDisbursedAmount: number;
  interestRateAnnualPct: number;
  tenureMonths: number;
  emiAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
  totalOutstanding: number;
  status: string;
  nextDueDate: string | null;
  nextEmiAmount: number;
  isOverdue: boolean;
  daysOverdue: number;
  schedule: {
    emiNumber: number;
    dueDate: string;
    principal: number;
    interest: number;
    fees: number;
    totalDue: number;
    paidAmount: number;
    outstanding: number;
    status: string;
    paidDate?: string | null;
  }[];
  recentPayments: {
    paymentNo: string;
    amount: number;
    method: string;
    paidAt: string;
    status: string;
    reference?: string | null;
  }[];
  documents: {
    id: string;
    category: string;
    documentType: string | null;
    fileName: string;
    status: string;
    fileUrl?: string;
  }[];
  isFullyPaid: boolean;
  nocNumber?: string | null;
}
