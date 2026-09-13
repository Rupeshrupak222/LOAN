// Unified Payment & Payout Interfaces & Normalized Contracts

export type PaymentStatus =
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_CHARGEBACK';

export interface PaymentOrderRequest {
  orderId: string;
  amount: number;
  currency: 'INR';
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  callbackUrl?: string;
}

export interface PaymentOrderResult {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: 'INR';
  checkoutUrl: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PaymentVerificationRequest {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature?: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  status: PaymentStatus;
  providerPaymentId: string;
  amount: number;
  currency: 'INR';
  paymentMethod: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'WALLET' | 'SIMULATED';
  paidAt?: string;
  errorDescription?: string;
}

export interface PaymentProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  createOrder(req: PaymentOrderRequest, correlationId: string): Promise<PaymentOrderResult>;
  verifyPayment(req: PaymentVerificationRequest, correlationId: string): Promise<PaymentVerificationResult>;
}

export type PayoutStatus =
  | 'PAYOUT_SUCCESS'
  | 'PAYOUT_PENDING'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_REVERSED';

export interface PayoutRequest {
  payoutId: string;
  loanId?: string;
  amount: number;
  currency: 'INR';
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  paymentMode: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
  purpose: string;
}

export interface PayoutResult {
  payoutId: string;
  status: PayoutStatus;
  providerReference: string;
  utr: string;
  amount: number;
  fees: number;
  tax: number;
  initiatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface PayoutProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  initiatePayout(req: PayoutRequest, correlationId: string): Promise<PayoutResult>;
  checkPayoutStatus(payoutId: string, correlationId: string): Promise<PayoutResult>;
}
