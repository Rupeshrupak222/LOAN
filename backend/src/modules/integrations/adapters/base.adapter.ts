import {
  IntegrationCategory,
  IntegrationProvider,
  NormalizedIntegrationResponse,
  ProviderConfig,
  ProviderHealthMetrics,
} from '../integration.types';
import { IntegrationHubError, mapToNormalizedError } from '../integration.errors';
import { validateOutboundUrl } from '../integration.config';

export abstract class BaseAdapter implements IntegrationProvider {
  abstract readonly providerId: string;
  abstract readonly name: string;
  abstract readonly category: IntegrationCategory;
  abstract config: ProviderConfig;

  // In-memory health metrics
  protected metrics: ProviderHealthMetrics = {
    providerId: '',
    category: 'CREDIT',
    status: 'NOT_CONFIGURED',
    isConfigured: false,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeoutCount: 0,
    rateLimitCount: 0,
    avgLatencyMs: 0,
  };

  public isConfigured(): boolean {
    return Boolean(this.config.isConfigured && this.config.enabled);
  }

  /**
   * Main execution hook implemented by specific provider adapters.
   */
  protected abstract executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }>;

  /**
   * Controlled execution with timeout, retry, SSRF validation, and error normalization.
   */
  public async execute<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    options?: { timeoutMs?: number }
  ): Promise<NormalizedIntegrationResponse<T>> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // 1. Check if configured
    if (!this.isConfigured()) {
      const errorMsg = `Provider '${this.name}' (${this.providerId}) is not configured. Missing required credentials or endpoint configuration.`;
      this.metrics.status = 'NOT_CONFIGURED';
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        provider: this.providerId,
        category: this.category,
        action,
        correlationId,
        latencyMs: Date.now() - startTime,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: errorMsg,
          httpStatus: 503,
          isRetryable: false,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 2. SSRF validation if baseUrl is present
    if (this.config.baseUrl) {
      validateOutboundUrl(this.config.baseUrl, this.config.environment === 'development');
    }

    const timeoutMs = options?.timeoutMs || this.config.timeoutMs || 10000;
    const maxRetries = this.config.maxRetries || 0;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await this.executeAction<T>(action, payload, correlationId, controller.signal);
        clearTimeout(timeoutHandle);

        const latencyMs = Date.now() - startTime;
        this.recordSuccess(latencyMs);

        return {
          success: true,
          status: 'SUCCESS',
          provider: this.providerId,
          category: this.category,
          action,
          providerRequestId: result.providerRequestId,
          correlationId,
          data: result.data,
          latencyMs,
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        clearTimeout(timeoutHandle);
        lastError = err;

        const normalized = mapToNormalizedError(err, correlationId, this.providerId);
        if (normalized.code === 'PROVIDER_TIMEOUT') {
          this.metrics.timeoutCount++;
        }
        if (normalized.code === 'PROVIDER_RATE_LIMITED') {
          this.metrics.rateLimitCount++;
        }

        // Only retry if error is retryable and we haven't reached max retries
        if (normalized.isRetryable && attempt < maxRetries) {
          attempt++;
          const backoffMs = Math.min(200 * Math.pow(2, attempt), 2000);
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }

        break;
      }
    }

    // Handled failure after retries
    const latencyMs = Date.now() - startTime;
    const normalizedError = mapToNormalizedError(lastError, correlationId, this.providerId);
    this.recordFailure(normalizedError.message, latencyMs);

    return {
      success: false,
      status: normalizedError.code === 'PROVIDER_NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'FAILED',
      provider: this.providerId,
      category: this.category,
      action,
      correlationId,
      error: normalizedError,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  public async checkHealth(): Promise<ProviderHealthMetrics> {
    this.metrics.providerId = this.providerId;
    this.metrics.category = this.category;
    this.metrics.isConfigured = this.isConfigured();

    if (!this.isConfigured()) {
      this.metrics.status = 'NOT_CONFIGURED';
      return { ...this.metrics };
    }

    // If configured and no recent failures, status is HEALTHY
    if (this.metrics.failedRequests === 0) {
      this.metrics.status = 'HEALTHY';
    } else if (this.metrics.successfulRequests > 0) {
      this.metrics.status = 'DEGRADED';
    } else {
      this.metrics.status = 'UNAVAILABLE';
    }

    return { ...this.metrics };
  }

  private recordSuccess(latencyMs: number) {
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessfulRequestAt = new Date().toISOString();
    this.metrics.avgLatencyMs = Math.round(
      (this.metrics.avgLatencyMs * (this.metrics.successfulRequests - 1) + latencyMs) /
        this.metrics.successfulRequests
    );
    this.metrics.status = 'HEALTHY';
  }

  private recordFailure(errorMsg: string, latencyMs: number) {
    this.metrics.failedRequests++;
    this.metrics.lastFailedRequestAt = new Date().toISOString();
    this.metrics.lastError = errorMsg;
    this.metrics.status = this.metrics.successfulRequests > 0 ? 'DEGRADED' : 'UNAVAILABLE';
  }
}
