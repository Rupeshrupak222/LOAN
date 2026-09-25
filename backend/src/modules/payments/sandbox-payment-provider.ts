import crypto from 'crypto';
import {
  PaymentProvider as LegacyPaymentProvider,
  GatewayOrderParams,
  GatewayOrderResult,
  GatewayVerifyParams,
  GatewayVerifyResult,
  GatewayRefundParams,
  GatewayRefundResult,
} from './payment-provider.interface';
import {
  PaymentOrderRequest,
  PaymentOrderResult,
  PaymentProvider as UnifiedPaymentProvider,
  PaymentVerificationRequest,
  PaymentVerificationResult,
} from '../integrations/interfaces/payments.interface';

export class SandboxPaymentProvider implements LegacyPaymentProvider, UnifiedPaymentProvider {
  readonly providerId = 'sandbox_payment_gateway';
  readonly name = 'Deterministic Sandbox Gateway';
  readonly code = 'SANDBOX';
  readonly environment = 'SANDBOX' as const;
  readonly isSandbox = true;
  readonly verificationMode = 'SANDBOX_SIMULATION';

  private readonly secretKey = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || 'adyapan_sandbox_secret_2026';

  isConfigured(): boolean {
    return true; // Always operational in sandbox/simulation mode
  }

  async createOrder(params: GatewayOrderParams | PaymentOrderRequest, _correlationId?: string): Promise<any> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const orderId = `order_sbx_${timestamp}_${randomSuffix}`;
    const amount = 'amount' in params ? params.amount : 0;
    const currency = 'currency' in params ? params.currency || 'INR' : 'INR';

    return {
      orderId,
      providerOrderId: orderId,
      provider: this.code,
      amount,
      currency: currency.toUpperCase() as 'INR',
      status: 'CREATED',
      checkoutUrl: `https://sandbox.checkout.adyapan.io/pay/${orderId}`,
      isSandbox: true,
      verificationMode: 'SANDBOX_SIMULATION',
      rawResponse: {
        sandbox: true,
        receipt: (params as any).receipt || orderId,
        notes: (params as any).notes,
      },
    };
  }

  async verifyPayment(params: GatewayVerifyParams | PaymentVerificationRequest, _correlationId?: string): Promise<any> {
    const paymentId = (params as any).providerPaymentId || (params as any).paymentId || '';
    const orderId = (params as any).orderId || (params as any).providerOrderId || '';

    // Deterministic simulation based on payment ID patterns
    if (paymentId.includes('FAIL') || orderId.includes('FAIL')) {
      return {
        verified: false,
        isVerified: false,
        providerPaymentId: paymentId,
        amount: 0,
        currency: 'INR',
        method: 'UPI',
        paymentMethod: 'SIMULATED',
        status: 'PAYMENT_FAILED',
        errorCode: 'ERR_INSUFFICIENT_FUNDS_OR_DECLINED',
        errorDescription: 'Simulated sandbox card/bank payment failure.',
        isSandbox: true,
        verificationMode: 'SANDBOX_SIMULATION',
      };
    }

    if (paymentId.includes('TIMEOUT') || paymentId.includes('PENDING') || orderId.includes('PENDING')) {
      return {
        verified: false,
        isVerified: false,
        providerPaymentId: paymentId,
        amount: 0,
        currency: 'INR',
        method: 'NET_BANKING',
        paymentMethod: 'SIMULATED',
        status: 'PAYMENT_PENDING',
        errorCode: 'WARN_GATEWAY_TIMEOUT',
        errorDescription: 'Transaction is pending bank clearance.',
        isSandbox: true,
        verificationMode: 'SANDBOX_SIMULATION',
      };
    }

    const timestamp = Date.now();
    const utrSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const utrNumber = `UTR-SBX-${timestamp}-${utrSuffix}`;

    return {
      verified: true,
      isVerified: true,
      providerPaymentId: paymentId || `pay_sbx_${timestamp}`,
      amount: (params as any).amount || 1000,
      currency: 'INR',
      method: 'UPI',
      paymentMethod: 'SIMULATED',
      status: 'PAYMENT_SUCCESS',
      utrNumber,
      isSandbox: true,
      verificationMode: 'SANDBOX_SIMULATION',
    };
  }

  async processRefund(params: GatewayRefundParams): Promise<GatewayRefundResult> {
    const refundId = `rfnd_sbx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      refundId,
      providerPaymentId: params.providerPaymentId,
      amount: params.amount,
      status: 'PROCESSED',
      rawResponse: {
        reason: params.reason || 'Customer refund request',
        processedAt: new Date().toISOString(),
        isSandbox: true,
        verificationMode: 'SANDBOX_SIMULATION',
      },
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const activeSecret = secret || this.secretKey;
    if (!activeSecret || !signature) return false;
    const computedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(rawBody)
      .digest('hex');

    // Secure timing-safe buffer comparison if lengths match
    if (signature.length !== computedSignature.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(computedSignature.toLowerCase()));
  }

  /**
   * Helper to construct signed test webhook payload for test suite
   */
  generateSignedWebhookPayload(event: string, payload: any): { rawBody: string; signature: string } {
    const rawBody = JSON.stringify({
      event,
      timestamp: Date.now(),
      data: payload,
    });
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return { rawBody, signature };
  }
}

export const sandboxPaymentProvider = new SandboxPaymentProvider();

