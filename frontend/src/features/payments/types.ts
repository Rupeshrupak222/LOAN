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

export interface PaymentAllocationItem {
  id?: string;
  bucket: 'FEES' | 'PENALTY' | 'INTEREST' | 'PRINCIPAL' | 'EXCESS';
  amount: number | string;
  emiNumber?: number;
}

export interface PaymentItem {
  id: string;
  paymentNo: string;
  loanNo: string;
  loanId?: string;
  customerId?: string;
  customerName: string;
  customerCode?: string;
  amount: string | number;
  method: string;
  reference?: string;
  status: PaymentStatus;
  allocations?: PaymentAllocationItem[];
  paidAt?: string;
  createdAt?: string;
  timeline?: Array<{
    id: string;
    status: PaymentStatus;
    timestamp: string;
    note: string;
    actorName?: string;
  }>;
  refunds?: Array<{
    id: string;
    refundNo: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  reversals?: Array<{
    id: string;
    reversalNo: string;
    reversalAmount: number;
    reason: string;
    createdAt: string;
  }>;
  loan?: {
    loanNo: string;
    outstandingPrincipal: number | string;
    outstandingInterest: number | string;
    outstandingFees: number | string;
    product?: { name: string };
  };
}

export interface PayoutItem {
  id: string;
  payoutNo: string;
  loanNo?: string;
  loanId?: string;
  customerName?: string;
  amount: number;
  netDisbursedAmount: number;
  deductedFees: number;
  deductedGst: number;
  currency: string;
  status: PayoutStatus;
  beneficiaryName: string;
  beneficiaryAccountMasked: string;
  beneficiaryIfsc: string;
  provider: string;
  utrNumber?: string;
  failureReason?: string;
  retryCount: number;
  initiatedBy?: string;
  createdAt: string;
}

export interface DisputeItem {
  id: string;
  disputeNo: string;
  paymentId: string;
  paymentNo: string;
  type: string;
  amount: number;
  reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';
  evidence: Array<{ id: string; type: string; title: string; addedBy: string; addedAt: string }>;
  resolutionNotes?: string;
  createdAt: string;
}

export interface SettlementBatchItem {
  id: string;
  batchNo: string;
  tenantId: string;
  providerCode: string;
  settlementDate: string;
  transactionCount: number;
  grossAmount: number;
  feeAmount: number;
  gstAmount: number;
  netSettledAmount: number;
  contractedMdrPct: number;
  calculatedMdrAmount: number;
  feeVariance: number;
  status: 'PENDING' | 'SETTLED' | 'DISCREPANCY';
  utrNumber?: string;
  journalEntryId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface CustomerSafeReceipt {
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
