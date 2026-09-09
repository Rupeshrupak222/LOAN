import { createHmac } from 'crypto';
import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';

export class PaymentGatewayAdapter extends BaseAdapter {
  readonly providerId = 'payment_gateway';
  readonly name = 'Payment Gateway (Razorpay / Cashfree Collection)';
  readonly category: IntegrationCategory = 'PAYMENT';
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().payment_gateway,
      ...customConfig,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const keyId = process.env.PAYMENT_GATEWAY_KEY_ID;
    const keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET;
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
      return expected.toLowerCase() === signature.trim().toLowerCase();
    } catch {
      return false;
    }
  }
}
