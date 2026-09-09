import { IntegrationHubError } from './integration.errors';
import { NormalizedIntegrationResponse } from './integration.types';

interface IdempotencyRecord {
  key: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: NormalizedIntegrationResponse;
  error?: any;
  createdAt: number;
  expiresAt: number;
}

export class IdempotencyService {
  private static instance: IdempotencyService;
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000; // 24 Hours

  private constructor() {
    // Periodic garbage collection of expired keys every 15 minutes
    setInterval(() => this.cleanup(), 15 * 60 * 1000).unref();
  }

  public static getInstance(): IdempotencyService {
    if (!IdempotencyService.instance) {
      IdempotencyService.instance = new IdempotencyService();
    }
    return IdempotencyService.instance;
  }

  /**
   * Acquire lock on idempotency key before initiating side-effecting request.
   * If key is already COMPLETED, returns the cached response.
   * If key is IN_PROGRESS, throws ConflictError.
   */
  public acquire(
    key: string,
    correlationId: string,
    ttlMs: number = this.defaultTtlMs
  ): { cachedResponse?: NormalizedIntegrationResponse } {
    const cleanKey = key.trim();
    if (!cleanKey) return {};

    const existing = this.store.get(cleanKey);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      if (existing.status === 'IN_PROGRESS') {
        throw new IntegrationHubError(
          409,
          'IDEMPOTENCY_CONFLICT',
          `Concurrent duplicate request detected for idempotency key '${cleanKey}'. Operation is currently in progress.`,
          { correlationId, isRetryable: false }
        );
      }

      if (existing.status === 'COMPLETED' && existing.response) {
        return { cachedResponse: existing.response };
      }
    }

    // Set status to IN_PROGRESS
    this.store.set(cleanKey, {
      key: cleanKey,
      status: 'IN_PROGRESS',
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return {};
  }

  /**
   * Complete the idempotency record with the final normalized response.
   */
  public complete(key: string, response: NormalizedIntegrationResponse, ttlMs: number = this.defaultTtlMs) {
    const cleanKey = key.trim();
    if (!cleanKey) return;

    const now = Date.now();
    this.store.set(cleanKey, {
      key: cleanKey,
      status: 'COMPLETED',
      response,
      createdAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Release or mark failed if the execution aborted prematurely without financial side effect.
   */
  public fail(key: string, error?: any) {
    const cleanKey = key.trim();
    if (!cleanKey) return;
    this.store.delete(cleanKey);
  }

  private cleanup() {
    const now = Date.now();
    for (const [k, record] of this.store.entries()) {
      if (record.expiresAt <= now) {
        this.store.delete(k);
      }
    }
  }

  public clearForTesting() {
    this.store.clear();
  }
}

export const idempotencyService = IdempotencyService.getInstance();
