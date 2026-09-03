// Integration Hub Core Type Definitions
export type IntegrationCategory =
  | 'CREDIT'
  | 'KYC'
  | 'BANKING'
  | 'PAYMENT'
  | 'DISBURSEMENT'
  | 'COMMUNICATION'
  | 'DOCUMENT';

export type IntegrationHealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'AUTH_ERROR';

export type IntegrationErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_BAD_REQUEST'
  | 'PROVIDER_VALIDATION_FAILED'
  | 'PROVIDER_SERVER_ERROR'
  | 'PROVIDER_UNKNOWN_ERROR'
  | 'WEBHOOK_INVALID'
  | 'WEBHOOK_DUPLICATE'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'IDEMPOTENCY_CONFLICT'
  | 'SSRF_BLOCKED';

export interface ProviderAuthInfo {
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2' | 'CUSTOM';
  apiKey?: string;
  clientSecret?: string;
  token?: string;
}

export interface ProviderConfig {
  providerId: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH2' | 'CUSTOM';
  webhookSecret?: string;
  isConfigured: boolean;
  maskedConfigSummary: Record<string, string | boolean | number>;
}

export interface NormalizedIntegrationError {
  code: IntegrationErrorCode;
  message: string;
  httpStatus: number;
  isRetryable: boolean;
  providerRawCode?: string;
  providerRawMessage?: string;
  correlationId: string;
}

export interface NormalizedIntegrationResponse<T = any> {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'NOT_CONFIGURED' | 'RATE_LIMITED';
  provider: string;
  category: IntegrationCategory;
  action: string;
  providerRequestId?: string;
  correlationId: string;
  data?: T;
  error?: NormalizedIntegrationError;
  latencyMs: number;
  timestamp: string;
}

export interface IntegrationRequestOptions {
  providerId?: string;
  category: IntegrationCategory;
  action: string;
  payload?: Record<string, any>;
  idempotencyKey?: string;
  timeoutMs?: number;
  actor?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export interface ProviderHealthMetrics {
  providerId: string;
  category: IntegrationCategory;
  status: IntegrationHealthStatus;
  isConfigured: boolean;
  lastSuccessfulRequestAt?: string;
  lastFailedRequestAt?: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutCount: number;
  rateLimitCount: number;
  avgLatencyMs: number;
  lastError?: string;
}

export interface WebhookEventPayload {
  providerId: string;
  eventId: string;
  eventType: string;
  rawBody: string;
  signature?: string;
  headers: Record<string, string | string[] | undefined>;
  parsedData: Record<string, any>;
  receivedAt: string;
}

export interface IntegrationProvider {
  readonly providerId: string;
  readonly name: string;
  readonly category: IntegrationCategory;
  readonly config: ProviderConfig;

  isConfigured(): boolean;
  execute<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    options?: { timeoutMs?: number }
  ): Promise<NormalizedIntegrationResponse<T>>;
  checkHealth(): Promise<ProviderHealthMetrics>;
  verifyWebhookSignature?(rawBody: string, signature?: string, secret?: string): boolean;
}
