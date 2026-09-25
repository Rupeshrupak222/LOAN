import { createHmac, timingSafeEqual } from 'crypto';
import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';
import {
  PaymentOrderRequest,
  PaymentOrderResult,
  PaymentProvider,
  PaymentVerificationRequest,
  PaymentVerificationResult,
  PaymentStatus,
} from '../../interfaces/payments.interface';

export interface PaymentGatewayAdapterConfig extends Partial<ProviderConfig> {
  apiKey?: string;
  apiSecret?: string;
}

export class PaymentGatewayAdapter extends BaseAdapter implements PaymentProvider {
  readonly providerId = 'payment_gateway';
  readonly name = 'Payment Gateway (Razorpay / Cashfree Collection)';
  readonly category: IntegrationCategory = 'PAYMENT';
  readonly environment = 'PRODUCTION' as const;
  config: ProviderConfig;
  private apiKey?: string;
  private apiSecret?: string;

  constructor(customConfig?: PaymentGatewayAdapterConfig) {
    super();
    this.apiKey = customConfig?.apiKey;
    this.apiSecret = customConfig?.apiSecret;
    this.config = {
      ...getProviderConfigurations().payment_gateway,
      ...customConfig,
    };
  }

  public async createOrder(req: PaymentOrderRequest, correlationId: string): Promise<PaymentOrderResult> {
    const payload = {
      amount: Math.round(req.amount * 100), // convert to paise
      currency: req.currency || 'INR',
      receipt: req.orderId,
      notes: {
        customerId: req.customerId,
        customerName: req.customerName,
        customerEmail: req.customerEmail,
        customerPhone: req.customerPhone,
        description: req.description,
      },
    };

    const result = await this.execute<any>('CREATE_ORDER', payload, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real Payment Gateway createOrder failed.',
        { correlationId }
      );
    }

    const raw = result.data;
    const providerOrderId = raw.id || raw.order_id || req.orderId;
    const checkoutUrl = raw.short_url || raw.checkout_url || `https://api.razorpay.com/v1/checkout/${providerOrderId}`;

    return {
      orderId: req.orderId,
      providerOrderId,
      amount: req.amount,
      currency: (raw.currency || req.currency || 'INR').toUpperCase() as 'INR',
      checkoutUrl,
      status: 'PAYMENT_PENDING',
      createdAt: raw.created_at ? new Date(raw.created_at * 1000).toISOString() : new Date().toISOString(),
    };
  }

  public async verifyPayment(req: PaymentVerificationRequest, correlationId: string): Promise<PaymentVerificationResult> {
    const result = await this.execute<any>(
      'FETCH_PAYMENT_STATUS',
      { paymentId: req.providerPaymentId, orderId: req.providerOrderId },
      correlationId
    );
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real Payment Gateway verifyPayment failed.',
        { correlationId }
      );
    }

    const raw = result.data;
    const rawStatus = (raw.status || '').toLowerCase();
    let status: PaymentStatus = 'PAYMENT_PENDING';
    let isVerified = false;

    if (rawStatus === 'captured' || rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed') {
      status = 'PAYMENT_SUCCESS';
      isVerified = true;
    } else if (rawStatus === 'failed' || rawStatus === 'cancelled' || rawStatus === 'expired' || rawStatus === 'rejected') {
      status = 'PAYMENT_FAILED';
      isVerified = false;
    } else {
      status = 'PAYMENT_PENDING';
      isVerified = false;
    }

    const amountInUnits = typeof raw.amount === 'number' ? raw.amount / 100 : (raw.amount ? Number(raw.amount) : 0);

    return {
      isVerified,
      status,
      providerPaymentId: raw.id || req.providerPaymentId,
      amount: amountInUnits,
      currency: (raw.currency || 'INR').toUpperCase() as 'INR',
      paymentMethod: (raw.method ? raw.method.toUpperCase() : 'UPI') as any,
      paidAt: raw.created_at ? new Date(raw.created_at * 1000).toISOString() : new Date().toISOString(),
      errorDescription: raw.error_description || raw.error_reason || undefined,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const keyId = process.env.PAYMENT_GATEWAY_KEY_ID || this.apiKey;
    const keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET || this.apiSecret;
    const baseUrl = this.config.baseUrl || 'https://api.razorpay.com/v1';

    if (!keyId || !keySecret) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Payment Gateway credentials (PAYMENT_GATEWAY_KEY_ID, PAYMENT_GATEWAY_KEY_SECRET) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/orders`;
    let method = 'POST';

    if (action === 'FETCH_PAYMENT_STATUS') {
      endpoint = `${baseUrl}/payments/${payload?.paymentId}`;
      method = 'GET';
    } else if (action === 'REFUND_PAYMENT') {
      endpoint = `${baseUrl}/payments/${payload?.paymentId}/refund`;
      method = 'POST';
    }

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Correlation-Id': correlationId,
      },
      body: method === 'GET' ? undefined : JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `Payment gateway operation failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.id || json?.order_id || json?.payment_id,
      rawStatus: res.statusText,
    };
  }

  public verifyWebhookSignature(rawBody: string, signature?: string, secret?: string): boolean {
    const webhookSecret = secret || this.config.webhookSecret || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) return false;

    try {
      const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (signature.length !== expected.length) {
        return false;
      }
      return timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(expected.toLowerCase()));
    } catch {
      return false;
    }
  }
}
