import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';
import {
  EsignProvider,
  EsignSessionRequest,
  EsignSessionResult,
  EsignVerificationResult,
  EsignStatus,
} from '../../interfaces/esign.interface';

export class DigitalEsignAdapter extends BaseAdapter implements EsignProvider {
  readonly providerId = 'digital_esign';
  readonly name = 'Digital Agreement eSign Gateway (Digio / Leegality / NSDL)';
  readonly category: IntegrationCategory = 'ESIGN';
  readonly environment = 'PRODUCTION' as const;
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().esign,
      ...customConfig,
    };
  }

  public async createSigningSession(
    req: EsignSessionRequest,
    correlationId: string
  ): Promise<EsignSessionResult> {
    const result = await this.execute<any>('CREATE_SIGNING_SESSION', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real eSign session creation failed.',
        { correlationId }
      );
    }

    const raw = result.data;
    const sessionId = String(raw.sessionId || raw.id || raw.txnId || raw.documentId);
    const signingUrl = String(raw.signingUrl || raw.url || raw.signUrl || '');
    const expiresAt = String(raw.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    const providerReference = String(
      raw.providerReference || raw.referenceId || raw.signingRequestId || result.providerRequestId || `REAL-ESIGN-${sessionId}`
    );

    const status: EsignStatus = (raw.status as EsignStatus) || 'SESSION_CREATED';

    return {
      sessionId,
      status,
      signingUrl,
      expiresAt,
      providerReference,
    };
  }

  public async checkSigningStatus(
    sessionId: string,
    correlationId: string
  ): Promise<EsignVerificationResult> {
    const result = await this.execute<any>('CHECK_SIGNING_STATUS', { sessionId }, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real eSign verification check failed.',
        { correlationId }
      );
    }

    const raw = result.data;
    const isSigned = Boolean(
      raw.isSigned === true ||
      raw.status === 'SIGNED' ||
      raw.status === 'COMPLETED' ||
      raw.status === 'EXECUTED'
    );

    const isFailed = raw.status === 'FAILED' || raw.status === 'REJECTED';
    const isExpired = raw.status === 'EXPIRED';

    let status: EsignStatus;
    if (isSigned) {
      status = 'SIGNED';
    } else if (isFailed) {
      status = 'FAILED';
    } else if (isExpired) {
      status = 'EXPIRED';
    } else {
      status = 'SIGN_PENDING';
    }

    return {
      sessionId,
      status,
      isSigned,
      signerAadhaarLast4: raw.signerAadhaarLast4 || raw.last4 || raw.signerLast4,
      signedAt: raw.signedAt || (isSigned ? new Date().toISOString() : undefined),
      certificateThumbprint: raw.certificateThumbprint || raw.thumbprint,
      auditTrailUrl: raw.auditTrailUrl || raw.auditUrl,
      signedDocumentUrl: raw.signedDocumentUrl || raw.downloadUrl,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.ESIGN_GATEWAY_API_KEY || process.env.DIGIO_API_KEY || process.env.LEGALITY_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Digital eSign API credentials (ESIGN_GATEWAY_API_KEY / DIGIO_API_KEY, ESIGN_GATEWAY_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/esign/sessions`;
    let method = 'POST';

    if (action === 'CHECK_SIGNING_STATUS') {
      endpoint = `${baseUrl}/v1/esign/sessions/${payload?.sessionId}/status`;
      method = 'GET';
    }

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        Authorization: `Bearer ${apiKey}`,
        'X-Correlation-Id': correlationId,
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined,
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new IntegrationHubError(
        res.status,
        res.status === 401 ? 'PROVIDER_AUTH_FAILED' : res.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_SERVER_ERROR',
        `Digital eSign operation failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.sessionId || json?.id || json?.referenceId,
      rawStatus: res.statusText,
    };
  }
}
