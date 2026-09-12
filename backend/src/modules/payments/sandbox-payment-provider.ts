import crypto from 'crypto';
import {
  PaymentProvider,
  GatewayOrderParams,
  GatewayOrderResult,
  GatewayVerifyParams,
  GatewayVerifyResult,
  GatewayRefundParams,
  GatewayRefundResult,
} from './payment-provider.interface';

export class SandboxPaymentProvider implements PaymentProvider {
  name = 'Deterministic Sandbox Gateway';
  code = 'SANDBOX';

  private readonly secretKey = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || 'adyapan_sandbox_secret_2026';

  isConfigured(): boolean {
    return true; // Always operational in sandbox/simulation mode
  }

  async createOrder(params: GatewayOrderParams): Promise<GatewayOrderResult> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const orderId = `order_sbx_${timestamp}_${randomSuffix}`;

    return {
      orderId,
      provider: this.code,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'CREATED',
      checkoutUrl: `https://sandbox.checkout.adyapan.io/pay/${orderId}`,
      rawResponse: {
        sandbox: true,
        receipt: params.receipt,
        notes: params.notes,
      },
    };
  }

  async verifyPayment(params: GatewayVerifyParams): Promise<GatewayVerifyResult> {
    // Deterministic simulation based on payment ID patterns
    if (params.providerPaymentId.includes('FAIL') || params.orderId.includes('FAIL')) {
      return {
        verified: false,
        providerPaymentId: params.providerPaymentId,
        amount: 0,
        method: 'UPI',
        status: 'FAILED',
        errorCode: 'ERR_INSUFFICIENT_FUNDS_OR_DECLINED',
        errorDescription: 'Simulated sandbox card/bank payment failure.',
      };
    }

    if (params.providerPaymentId.includes('TIMEOUT')) {
      return {
        verified: false,
        providerPaymentId: params.providerPaymentId,
        amount: 0,
        method: 'NET_BANKING',
        status: 'PENDING',
        errorCode: 'WARN_GATEWAY_TIMEOUT',
        errorDescription: 'Transaction is pending bank clearance.',
      };
    }

    const timestamp = Date.now();
    const utrSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const utrNumber = `UTR-SBX-${timestamp}-${utrSuffix}`;

    return {
      verified: true,
      providerPaymentId: params.providerPaymentId || `pay_sbx_${timestamp}`,
      amount: 1000,
      method: 'UPI',
      status: 'SUCCESS',
      utrNumber,
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
      },
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const activeSecret = secret || this.secretKey;
    const computedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(rawBody)
      .digest('hex');

    // Secure timing-safe buffer comparison if lengths match
    if (!signature || signature.length !== computedSignature.length) {
      return signature === computedSignature;
    }
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
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
