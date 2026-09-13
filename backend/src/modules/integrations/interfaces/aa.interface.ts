// Account Aggregator (AA) Provider Interface & Normalized Contracts

export type AaConsentStatus =
  | 'CONSENT_CREATED'
  | 'CONSENT_APPROVED'
  | 'CONSENT_REJECTED'
  | 'CONSENT_EXPIRED'
  | 'DATA_AVAILABLE'
  | 'DATA_UNAVAILABLE';

export interface AaConsentRequest {
  customerId: string;
  mobile: string;
  pan: string;
  consentDurationMonths: number;
  dataRangeFrom: string;
  dataRangeTo: string;
  fiTypes: Array<'DEPOSIT' | 'TERM_DEPOSIT' | 'RECURRING_DEPOSIT' | 'CREDIT_CARD'>;
}

export interface AaConsentResult {
  consentHandle: string;
  consentId?: string;
  status: AaConsentStatus;
  redirectUrl?: string;
  expiresAt: string;
  providerReference: string;
}

export interface AaFinancialTelemetry {
  averageMonthlyInflow: number;
  averageMonthlyOutflow: number;
  estimatedMonthlySalary: number;
  salaryCreditDay?: number;
  bounceCountLast180Days: number;
  monthlyClosingBalances: Array<{ month: string; balance: number }>;
  totalAccountsAggregated: number;
  detectedLenders: string[];
  emiOutflowMonthly: number;
  statementAvailable: boolean;
}

export interface AccountAggregatorProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';

  createConsent(req: AaConsentRequest, correlationId: string): Promise<AaConsentResult>;
  checkConsentStatus(consentHandle: string, correlationId: string): Promise<AaConsentResult>;
  fetchFinancialTelemetry(consentId: string, correlationId: string): Promise<AaFinancialTelemetry>;
}
