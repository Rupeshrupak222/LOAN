import { v4 as uuid } from 'uuid';
import {
  IntegrationCategory,
  IntegrationProvider,
  IntegrationRequestOptions,
  NormalizedIntegrationResponse,
  ProviderHealthMetrics,
} from './integration.types';
import { IntegrationHubError } from './integration.errors';
import { idempotencyService } from './idempotency.service';
import { logAudit } from '../audit/audit.service';
import { CreditBureauAdapter } from './adapters/credit/credit-bureau.adapter';
import { KycIdentityAdapter } from './adapters/kyc/kyc-identity.adapter';
import { BankingDataAdapter } from './adapters/banking/banking-data.adapter';
import { PaymentGatewayAdapter } from './adapters/payments/payment-gateway.adapter';
import { DisbursementAdapter } from './adapters/disbursements/disbursement.adapter';
import { CommunicationAdapter } from './adapters/communication/communication.adapter';
import { DocumentStorageAdapter } from './adapters/documents/document-storage.adapter';

export class IntegrationHubService {
  private static instance: IntegrationHubService;
  private readonly adapters = new Map<string, IntegrationProvider>();
  private readonly categoryMap = new Map<IntegrationCategory, string>();
  private readonly rateLimitTracker = new Map<string, number[]>();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): IntegrationHubService {
    if (!IntegrationHubService.instance) {
      IntegrationHubService.instance = new IntegrationHubService();
    }
    return IntegrationHubService.instance;
  }

  private registerDefaults() {
    this.registerAdapter(new CreditBureauAdapter());
    this.registerAdapter(new KycIdentityAdapter());
    this.registerAdapter(new BankingDataAdapter());
    this.registerAdapter(new PaymentGatewayAdapter());
    this.registerAdapter(new DisbursementAdapter());
    this.registerAdapter(new CommunicationAdapter());
    this.registerAdapter(new DocumentStorageAdapter());
  }

  public registerAdapter(adapter: IntegrationProvider) {
    this.adapters.set(adapter.providerId, adapter);
    this.categoryMap.set(adapter.category, adapter.providerId);
  }

  public getAdapter(providerId: string): IntegrationProvider | undefined {
    return this.adapters.get(providerId);
  }

  public getAdapterByCategory(category: IntegrationCategory): IntegrationProvider | undefined {
    const providerId = this.categoryMap.get(category);
    return providerId ? this.adapters.get(providerId) : undefined;
  }

  /**
   * Generates standard correlation ID: INT-YYYYMMDD-XXXXXXXX
   */
  public generateCorrelationId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = uuid().slice(0, 8).toUpperCase();
    return `INT-${dateStr}-${randomSuffix}`;
  }

  /**
   * Internal rate limit check per provider
   */
  private checkRateLimit(provider: IntegrationProvider, correlationId: string) {
    const maxPerMinute = provider.config.rateLimitPerMinute || 120;
    const now = Date.now();
    const windowStart = now - 60000;

    let timestamps = this.rateLimitTracker.get(provider.providerId) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxPerMinute) {
      throw new IntegrationHubError(
        429,
        'PROVIDER_RATE_LIMITED',
        `Internal rate limit exceeded for provider '${provider.name}'. Max ${maxPerMinute} requests/minute allowed.`,
        { correlationId, providerId: provider.providerId, isRetryable: true }
      );
    }

    timestamps.push(now);
    this.rateLimitTracker.set(provider.providerId, timestamps);
  }

  /**
   * Execute an integration request through the hub
   */
  public async executeRequest<T = any>(
    options: IntegrationRequestOptions
  ): Promise<NormalizedIntegrationResponse<T>> {
    const correlationId = this.generateCorrelationId();

    // 1. Resolve Adapter
    let adapter: IntegrationProvider | undefined;
    if (options.providerId) {
      adapter = this.getAdapter(options.providerId);
    } else if (options.category) {
      adapter = this.getAdapterByCategory(options.category);
    }

    if (!adapter) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        provider: options.providerId || 'unknown',
        category: options.category,
        action: options.action,
        correlationId,
        latencyMs: 0,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: `No integration adapter registered for provider '${options.providerId}' or category '${options.category}'.`,
          httpStatus: 404,
          isRetryable: false,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Rate limiting check
    this.checkRateLimit(adapter, correlationId);

    // 3. Idempotency Guard (for side-effecting operations)
    if (options.idempotencyKey) {
      const { cachedResponse } = idempotencyService.acquire(options.idempotencyKey, correlationId);
      if (cachedResponse) {
        return cachedResponse as NormalizedIntegrationResponse<T>;
      }
    }

    let response: NormalizedIntegrationResponse<T>;
    try {
      // 4. Execute through adapter
      response = await adapter.execute<T>(options.action, options.payload, correlationId, {
        timeoutMs: options.timeoutMs,
      });

      // 5. Complete idempotency record
      if (options.idempotencyKey) {
        idempotencyService.complete(options.idempotencyKey, response);
      }
    } catch (err: any) {
      if (options.idempotencyKey) {
        idempotencyService.fail(options.idempotencyKey, err);
      }
      throw err;
    }

    // 6. Audit logging (safe details only, never secrets)
    await logAudit({
      userId: options.actor?.id,
      role: options.actor?.roles?.[0],
      action: 'INTEGRATION_REQUEST_EXECUTED',
      entity: 'IntegrationHub',
      entityId: adapter.providerId,
      newValue: {
        category: adapter.category,
        action: options.action,
        success: response.success,
        status: response.status,
        latencyMs: response.latencyMs,
        errorCode: response.error?.code,
      },
      correlationId,
    }).catch(() => {});

    return response;
  }

  /**
   * List all providers with health, configuration status, and masked metadata
   */
  public async listProviders(): Promise<
    Array<{
      providerId: string;
      name: string;
      category: IntegrationCategory;
      description: string;
      isConfigured: boolean;
      enabled: boolean;
      environment: string;
      maskedConfigSummary: Record<string, any>;
      health: ProviderHealthMetrics;
    }>
  > {
    const list = [];
    for (const adapter of this.adapters.values()) {
      const health = await adapter.checkHealth();
      list.push({
        providerId: adapter.providerId,
        name: adapter.name,
        category: adapter.category,
        description: adapter.config.description,
        isConfigured: adapter.isConfigured(),
        enabled: adapter.config.enabled,
        environment: adapter.config.environment,
        maskedConfigSummary: adapter.config.maskedConfigSummary,
        health,
      });
    }
    return list;
  }

  /**
   * Get single provider details
   */
  public async getProvider(providerId: string) {
    const adapter = this.adapters.get(providerId);
    if (!adapter) return null;
    const health = await adapter.checkHealth();
    return {
      providerId: adapter.providerId,
      name: adapter.name,
      category: adapter.category,
      description: adapter.config.description,
      isConfigured: adapter.isConfigured(),
      enabled: adapter.config.enabled,
      environment: adapter.config.environment,
      maskedConfigSummary: adapter.config.maskedConfigSummary,
      health,
    };
  }

  /**
   * Test connectivity / ping provider
   */
  public async testProvider(
    providerId: string,
    actor?: { id: string; email: string; roles: string[] }
  ): Promise<NormalizedIntegrationResponse> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new IntegrationHubError(404, 'PROVIDER_NOT_CONFIGURED', `Provider '${providerId}' not found.`);
    }

    const correlationId = this.generateCorrelationId();
    const res = await adapter.execute('PING', {}, correlationId, { timeoutMs: 5000 });

    await logAudit({
      userId: actor?.id,
      role: actor?.roles?.[0],
      action: 'INTEGRATION_PROVIDER_TESTED',
      entity: 'IntegrationHub',
      entityId: providerId,
      newValue: {
        success: res.success,
        status: res.status,
        latencyMs: res.latencyMs,
        errorCode: res.error?.code,
      },
      correlationId,
    }).catch(() => {});

    return res;
  }
}

export const integrationHub = IntegrationHubService.getInstance();
