// Phase 10: Payments, Reconciliation & Settlement Infrastructure Domain Types

export type PaymentType =
  | 'EMI'
  | 'PARTIAL_EMI'
  | 'FULL_REPAYMENT'
  | 'FORECLOSURE'
  | 'PENALTY'
  | 'FEE'
  | 'CREDIT_LINE_REPAYMENT'
  | 'EXCESS_PAYMENT'
  | 'DRAWDOWN'
  | 'DISBURSEMENT';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_REQUESTED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'REVERSED'
  | 'CHARGEBACK';

export type PayoutStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CASH'
  | 'CHEQUE'
  | 'GATEWAY'
  | 'NET_BANKING'
  | 'DEBIT_CARD'
  | 'NACH_MANDATE';

export type PaymentAllocationBucket = 'FEES' | 'PENALTY' | 'INTEREST' | 'PRINCIPAL' | 'EXCESS';

export interface PaymentAllocationItem {
  id: string;
  bucket: PaymentAllocationBucket;
  amount: number;
  emiNumber?: number;
  description?: string;
  createdAt: string;
}

export interface PaymentAllocationResult {
  paymentId: string;
  paymentNo: string;
  totalAmount: number;
  allocatedFees: number;
  allocatedPenalties: number;
  allocatedInterest: number;
  allocatedPrincipal: number;
  allocatedExcess: number;
  totalAllocated: number;
  remainingDue: number;
  isLoanClosed: boolean;
  scheduleItemsUpdatedCount: number;
  creditFacilityRestoredAmount?: number;
  allocations: PaymentAllocationItem[];
}

export interface PaymentTimelineEvent {
  id: string;
  status: PaymentStatus;
  timestamp: string;
  note: string;
  actorId?: string;
  actorName?: string;
}

export interface PaymentTransaction {
  id: string;
  paymentNo: string;
  tenantId: string;
  branchId?: string;
  partnerId?: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  loanId?: string;
  loanNo?: string;
  creditFacilityId?: string;
  type: PaymentType;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey?: string;
  provider: 'SANDBOX' | 'RAZORPAY' | 'CASHFREE' | 'CORE_BANKING';
  providerOrderId?: string;
  providerPaymentId?: string;
  gatewayReference?: string;
  utrNumber?: string;
  reconciliationStatus: 'UNMATCHED' | 'MATCHED' | 'RECONCILED' | 'MANUAL_REVIEW';
  settlementStatus: 'PENDING' | 'SETTLED' | 'MISMATCH';
  failureCode?: string;
  failureReason?: string;
  retryEligibility: boolean;
  allocations: PaymentAllocationItem[];
  excessAmountHandled?: number;
  excessHandlingMode?: 'FUTURE_DUES' | 'CUSTOMER_WALLET' | 'REFUND';
  refundedAmount: number;
  timeline: PaymentTimelineEvent[];
  metadata?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutTransaction {
  id: string;
  payoutNo: string;
  tenantId: string;
  branchId?: string;
  partnerId?: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  loanId?: string;
  loanNo?: string;
  applicationId?: string;
  creditFacilityId?: string;
  amount: number;
  netDisbursedAmount: number;
  deductedFees: number;
  deductedGst: number;
  currency: string;
  status: PayoutStatus;
  beneficiaryName: string;
  beneficiaryAccountMasked: string;
  beneficiaryIfsc: string;
  provider: 'SANDBOX' | 'RAZORPAY_X' | 'CASHFREE_PAYOUT' | 'NEFT_IMPS_BANK';
  providerPayoutId?: string;
  utrNumber?: string;
  idempotencyKey?: string;
  failureCode?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  initiatedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  refundNo: string;
  paymentId: string;
  paymentNo: string;
  tenantId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  providerRefundId?: string;
  requestedBy: string;
  approvedBy?: string;
  comments?: string;
  createdAt: string;
}

export interface ReversalRecord {
  id: string;
  reversalNo: string;
  paymentId: string;
  paymentNo: string;
  tenantId: string;
  loanId: string;
  loanNo: string;
  reversalAmount: number;
  reason: string;
  compensatingJournalId: string;
  executedBy: string;
  createdAt: string;
}

export type DisputeStatus = 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
export type DisputeType = 'CHARGEBACK' | 'PAYMENT_DISPUTE' | 'REFUND_DISPUTE' | 'SETTLEMENT_DISCREPANCY';

export interface PaymentDispute {
  id: string;
  disputeNo: string;
  tenantId: string;
  paymentId: string;
  paymentNo: string;
  type: DisputeType;
  amount: number;
  reason: string;
  status: DisputeStatus;
  evidence: Array<{ id: string; type: string; title: string; addedBy: string; addedAt: string }>;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface InitiatePaymentDto {
  loanId?: string;
  creditFacilityId?: string;
  customerId?: string;
  amount: number;
  type?: PaymentType;
  method?: PaymentMethod;
  reference?: string;
  idempotencyKey?: string;
  provider?: 'SANDBOX' | 'RAZORPAY' | 'CASHFREE' | 'CORE_BANKING';
  excessHandlingMode?: 'FUTURE_DUES' | 'CUSTOMER_WALLET' | 'REFUND';
  notes?: string;
}

export interface ConfirmPaymentDto {
  providerPaymentId?: string;
  gatewayReference?: string;
  utrNumber?: string;
  paidAt?: string;
}

export interface RefundPaymentDto {
  amount: number;
  reason: string;
  comments?: string;
}

export interface ReversePaymentDto {
  reason: string;
  comments?: string;
}

export interface InitiatePayoutDto {
  applicationId?: string;
  loanId?: string;
  creditFacilityId?: string;
  amount?: number;
  beneficiaryAccountNo?: string;
  beneficiaryIfsc?: string;
  beneficiaryName?: string;
  idempotencyKey?: string;
}

export interface CustomerSafePaymentSummary {
  paymentId: string;
  paymentNo: string;
  loanNo?: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  paidAt: string;
  receiptNumber: string;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  remainingLoanBalance: number;
}

export interface PartnerSafePaymentSummary {
  paymentId: string;
  paymentNo: string;
  loanReference: string;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  settlementStatus: string;
}
