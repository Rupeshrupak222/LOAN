import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';

export class KycIdentityAdapter extends BaseAdapter {
  readonly providerId = 'kyc_identity';
  readonly name = 'Identity & KYC Verification (NSDL / UIDAI GSP)';
  readonly category: IntegrationCategory = 'KYC';
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().kyc_identity,
      ...customConfig,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.KYC_GATEWAY_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'KYC Identity Gateway API credentials (KYC_GATEWAY_API_KEY, KYC_GATEWAY_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/verify/pan`;
    if (action === 'VERIFY_AADHAAR') {
      endpoint = `${baseUrl}/v1/verify/aadhaar`;
    } else if (action === 'VERIFY_PHONE') {
      endpoint = `${baseUrl}/v1/verify/phone`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `KYC Identity verification failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.verificationId || json?.requestId,
      rawStatus: res.statusText,
    };
  }
}
