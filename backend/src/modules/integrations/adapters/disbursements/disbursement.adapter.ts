import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';

export class DisbursementAdapter extends BaseAdapter {
  readonly providerId = 'disbursement_payout';
  readonly name = 'Commercial Banking & Payout Gateway (IMPS / NEFT)';
  readonly category: IntegrationCategory = 'DISBURSEMENT';
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().disbursement_payout,
      ...customConfig,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.DISBURSEMENT_GATEWAY_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Disbursement Gateway credentials (DISBURSEMENT_GATEWAY_KEY, DISBURSEMENT_GATEWAY_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/payouts`;
    let method = 'POST';

    if (action === 'FETCH_PAYOUT_STATUS') {
      endpoint = `${baseUrl}/v1/payouts/${payload?.payoutId || payload?.transferId}`;
      method = 'GET';
    } else if (action === 'VALIDATE_BENEFICIARY') {
      endpoint = `${baseUrl}/v1/beneficiaries/validate`;
      method = 'POST';
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Correlation-Id': correlationId,
        'X-Idempotency-Key': payload?.idempotencyKey || correlationId,
      },
      body: method === 'GET' ? undefined : JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `Disbursement payout operation failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: false } // Payouts are non-retryable by default
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.transferId || json?.payoutId || json?.utr,
      rawStatus: res.statusText,
    };
  }
}
