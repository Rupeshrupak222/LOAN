import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';
import {
  BureauInquiryRequest,
  BureauProvider,
  BureauReportResult,
  BureauReportStatus,
} from '../../interfaces/bureau.interface';

export class CreditBureauAdapter extends BaseAdapter implements BureauProvider {
  readonly providerId = 'credit_bureau';
  readonly name = 'Credit Bureau Gateway (CIBIL / Experian)';
  readonly category: IntegrationCategory = 'CREDIT';
  readonly environment = 'PRODUCTION' as const;
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().credit_bureau,
      ...customConfig,
    };
  }

  public async fetchCreditReport(req: BureauInquiryRequest, correlationId: string): Promise<BureauReportResult> {
    const result = await this.execute<any>('FETCH_BUREAU_REPORT', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real Credit Bureau inquiry failed.',
        { correlationId }
      );
    }

    const raw = result.data;

    const rawStatus = String(raw.status || 'COMPLETED').toUpperCase();
    const isFailed = rawStatus === 'FAILED' || rawStatus === 'ERROR' || rawStatus === 'REJECTED';
    const isCompleted = !isFailed && (rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS' || rawStatus === 'VALID' || raw.score !== undefined);
    const finalStatus: BureauReportStatus = isFailed ? 'FAILED' : (isCompleted ? 'COMPLETED' : 'NO_RECORD');

    const score = typeof raw.score === 'number' ? raw.score : Number(raw.cibilScore || raw.creditScore || -1);

    let scoreTier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NO_HISTORY' = 'NO_HISTORY';
    if (score >= 750) scoreTier = 'EXCELLENT';
    else if (score >= 700) scoreTier = 'GOOD';
    else if (score >= 650) scoreTier = 'FAIR';
    else if (score >= 300) scoreTier = 'POOR';

    const reportReference = String(
      raw.reportReference ||
      raw.inquiryId ||
      raw.reportId ||
      raw.referenceNumber ||
      result.providerRequestId ||
      `REAL-BUREAU-${Date.now()}`
    );

    return {
      status: finalStatus,
      bureauName: (raw.bureauName || 'CIBIL') as any,
      score,
      scoreTier: raw.scoreTier || scoreTier,
      totalAccounts: Number(raw.totalAccounts || raw.totalTradelines || 0),
      activeAccounts: Number(raw.activeAccounts || 0),
      totalOutstanding: Number(raw.totalOutstanding || raw.totalBalance || 0),
      totalOverdueAmount: Number(raw.totalOverdueAmount || raw.overdueBalance || 0),
      dpd30PlusCount: Number(raw.dpd30PlusCount || 0),
      dpd90PlusCount: Number(raw.dpd90PlusCount || 0),
      writtenOffCount: Number(raw.writtenOffCount || 0),
      settledCount: Number(raw.settledCount || 0),
      recentInquiriesLast30Days: Number(raw.recentInquiriesLast30Days || raw.enquiries || 0),
      tradelines: Array.isArray(raw.tradelines) ? raw.tradelines : [],
      reportReference,
      generatedAt: raw.generatedAt || new Date().toISOString(),
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.CREDIT_BUREAU_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Credit Bureau API credentials (CREDIT_BUREAU_API_KEY, CREDIT_BUREAU_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/inquiry`;
    if (action === 'FETCH_BUREAU_REPORT') {
      endpoint = `${baseUrl}/v1/reports`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
        `Credit bureau inquiry failed: ${res.statusText} (${errorText.slice(0, 100)})`,
        { correlationId, isRetryable: res.status >= 500 || res.status === 429 }
      );
    }

    const json: any = await res.json();
    return {
      data: json as T,
      providerRequestId: json?.inquiryId || json?.id,
      rawStatus: res.statusText,
    };
  }
}
