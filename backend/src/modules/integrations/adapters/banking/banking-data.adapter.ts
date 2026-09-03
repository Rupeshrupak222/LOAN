import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';

export class BankingDataAdapter extends BaseAdapter {
  readonly providerId = 'banking_data';
  readonly name = 'Account Aggregator & Bank Verification (RBI AA)';
  readonly category: IntegrationCategory = 'BANKING';
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().banking_data,
      ...customConfig,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.ACCOUNT_AGGREGATOR_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Account Aggregator API credentials (ACCOUNT_AGGREGATOR_API_KEY, ACCOUNT_AGGREGATOR_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/statements`;
    if (action === 'VERIFY_BANK_ACCOUNT') {
      endpoint = `${baseUrl}/v1/accounts/verify`;
    } else if (action === 'RESOLVE_IFSC') {
      endpoint = `${baseUrl}/v1/ifsc/${payload?.ifsc}`;
    }

    const res = await fetch(endpoint, {
      method: action === 'RESOLVE_IFSC' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Correlation-Id': correlationId,
      },
      body: action === 'RESOLVE_IFSC' ? undefined : JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `Banking data operation failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.consentId || json?.txnId,
      rawStatus: res.statusText,
    };
  }
}
