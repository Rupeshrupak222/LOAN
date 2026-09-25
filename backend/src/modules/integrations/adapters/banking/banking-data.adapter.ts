import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { IntegrationHubError } from '../../integration.errors';
import {
  BankVerificationProvider,
  BankVerificationRequest,
  BankVerificationResult,
  BankVerificationStatus,
} from '../../interfaces/banking.interface';
import { computeNameMatchScore } from '../../../kyc/kyc.service';

export class BankingDataAdapter extends BaseAdapter implements BankVerificationProvider {
  readonly providerId = 'banking_data';
  readonly name = 'Account Aggregator & Bank Verification (RBI AA)';
  readonly category: IntegrationCategory = 'BANKING';
  readonly environment = 'PRODUCTION' as const;
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().banking_data,
      ...customConfig,
    };
  }

  public async verifyBankAccount(req: BankVerificationRequest, correlationId: string): Promise<BankVerificationResult> {
    const result = await this.execute<any>('VERIFY_BANK_ACCOUNT', req, correlationId);
    if (!result.success || !result.data) {
      throw new IntegrationHubError(
        result.error?.httpStatus || 502,
        result.error?.code || 'PROVIDER_EXECUTION_FAILED',
        result.error?.message || 'Real Banking verification failed.',
        { correlationId }
      );
    }

    const raw = result.data;

    // Check account validity from provider response
    const isValid = Boolean(
      raw.isValid === true ||
      raw.isAccountValid === true ||
      raw.status === 'VALID_ACCOUNT' ||
      raw.status === 'NAME_MATCH' ||
      raw.status === 'SUCCESS' ||
      raw.accountStatus === 'VALID'
    );

    const isExplicitlyFailed =
      raw.status === 'INVALID_ACCOUNT' ||
      raw.status === 'FAILED' ||
      raw.status === 'REJECTED' ||
      raw.isValid === false ||
      raw.isAccountValid === false;

    const registeredName = String(
      raw.registeredName || raw.nameAtBank || raw.accountHolderName || raw.beneficiaryName || ''
    ).trim().toUpperCase();

    let nameMatchPercentage = raw.nameMatchPercentage !== undefined
      ? Number(raw.nameMatchPercentage)
      : raw.nameMatchScore !== undefined
        ? Number(raw.nameMatchScore)
        : 0;

    if (req.beneficiaryName && registeredName && raw.nameMatchPercentage === undefined && raw.nameMatchScore === undefined) {
      nameMatchPercentage = computeNameMatchScore(req.beneficiaryName, registeredName);
    } else if (!req.beneficiaryName && isValid) {
      nameMatchPercentage = 100;
    }

    const isNameMatched = !req.beneficiaryName || nameMatchPercentage >= 60;

    let finalStatus: BankVerificationStatus;
    if (!isValid || isExplicitlyFailed) {
      finalStatus = 'INVALID_ACCOUNT';
    } else if (!isNameMatched) {
      finalStatus = 'NAME_MISMATCH';
    } else {
      finalStatus = 'NAME_MATCH';
    }

    const utrOrReference = String(
      raw.utrOrReference || raw.utr || raw.referenceId || raw.txnId || raw.consentId || result.providerRequestId || `REAL-PENNY-${Date.now()}`
    );

    return {
      status: finalStatus,
      isValid: isValid && !isExplicitlyFailed && isNameMatched,
      registeredName,
      beneficiaryNameProvided: req.beneficiaryName,
      nameMatchPercentage,
      bankName: String(raw.bankName || 'Verified Scheduled Commercial Bank'),
      branchName: String(raw.branchName || 'Main Branch'),
      city: raw.city ? String(raw.city) : undefined,
      utrOrReference,
      verificationMode: 'PENNY_DROP',
      verifiedAt: raw.verifiedAt || new Date().toISOString(),
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    const apiKey = process.env.BANKING_GATEWAY_API_KEY || process.env.ACCOUNT_AGGREGATOR_API_KEY;
    const baseUrl = this.config.baseUrl;

    if (!baseUrl || !apiKey) {
      throw new IntegrationHubError(
        503,
        'PROVIDER_NOT_CONFIGURED',
        'Banking Data & Verification API credentials (BANKING_GATEWAY_API_KEY / ACCOUNT_AGGREGATOR_API_KEY, BANKING_GATEWAY_BASE_URL) are not configured.',
        { correlationId }
      );
    }

    let endpoint = `${baseUrl}/v1/statements`;
    if (action === 'VERIFY_BANK_ACCOUNT') {
      endpoint = `${baseUrl}/v1/bank/verify-account`;
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
