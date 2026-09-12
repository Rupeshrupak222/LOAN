// Phase 10: Provider Abstraction Interfaces

export interface GatewayOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  customerId: string;
  notes?: Record<string, any>;
  idempotencyKey?: string;
}

export interface GatewayOrderResult {
  orderId: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'ATTEMPTED' | 'PAID' | 'FAILED';
  checkoutUrl?: string;
  rawResponse?: any;
}

export interface GatewayVerifyParams {
  orderId: string;
  providerPaymentId: string;
  signature?: string;
}

export interface GatewayVerifyResult {
  verified: boolean;
  providerPaymentId: string;
  amount: number;
  method: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  utrNumber?: string;
  errorCode?: string;
  errorDescription?: string;
}

export interface GatewayRefundParams {
  providerPaymentId: string;
  amount: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface GatewayRefundResult {
  refundId: string;
  providerPaymentId: string;
  amount: number;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  rawResponse?: any;
}

export interface PaymentProvider {
  name: string;
  code: string;
  isConfigured(): boolean;
  createOrder(params: GatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPayment(params: GatewayVerifyParams): Promise<GatewayVerifyResult>;
  processRefund(params: GatewayRefundParams): Promise<GatewayRefundResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean;
}

// ---------------------------------------------------------------------------
// Payout Provider Interface (Disbursements / Drawdowns)
// ---------------------------------------------------------------------------

export interface PayoutRequestParams {
  payoutNo: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryAccountNo: string;
  beneficiaryIfsc: string;
  purpose?: string;
  idempotencyKey?: string;
}

export interface PayoutResponseResult {
  providerPayoutId: string;
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  utrNumber?: string;
  failureReason?: string;
  errorCode?: string;
  estimatedSettlementTime?: string;
}

export interface PayoutProvider {
  name: string;
  code: string;
  isConfigured(): boolean;
  initiatePayout(params: PayoutRequestParams): Promise<PayoutResponseResult>;
  fetchPayoutStatus(providerPayoutId: string): Promise<PayoutResponseResult>;
  cancelPayout(providerPayoutId: string): Promise<boolean>;
}
