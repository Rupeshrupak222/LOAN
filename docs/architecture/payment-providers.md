# Payment & Payout Provider Abstraction

## 1. Provider Interfaces

The platform isolates vendor-specific payment gateway code behind clean, decoupled TypeScript contracts:

```typescript
export interface PaymentProvider {
  name: string;
  code: string;
  isConfigured(): boolean;
  createOrder(params: GatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPayment(params: GatewayVerifyParams): Promise<GatewayVerifyResult>;
  processRefund(params: GatewayRefundParams): Promise<GatewayRefundResult>;
  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean;
}

export interface PayoutProvider {
  name: string;
  code: string;
  isConfigured(): boolean;
  initiatePayout(params: PayoutRequestParams): Promise<PayoutResponseResult>;
  fetchPayoutStatus(providerPayoutId: string): Promise<PayoutResponseResult>;
  cancelPayout(providerPayoutId: string): Promise<boolean>;
}
```

---

## 2. Deterministic Sandbox Implementation

To enable complete end-to-end testing without external network dependencies:
- **`SandboxPaymentProvider`**: Simulates instant checkout URLs, deterministic payment confirmations, deterministic declines (e.g., when payment ID contains `FAIL`), and HMAC-SHA256 signature verification.
- **`SandboxPayoutProvider`**: Simulates automated IMPS/NEFT disbursements, deterministic bank routing failures, and realistic unique UTR numbers formatted as `UTR-DISB-SBX-{timestamp}-{random}`.
