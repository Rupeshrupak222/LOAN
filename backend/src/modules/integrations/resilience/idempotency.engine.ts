// Financial & State-Changing Operation Idempotency Engine

export interface IdempotencyRecord<T = any> {
  key: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: T;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export class IdempotencyEngine {
  private static instance: IdempotencyEngine;
  private readonly records = new Map<string, IdempotencyRecord>();
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    setInterval(() => this.cleanup(), 60 * 60 * 1000).unref();
  }

  public static getInstance(): IdempotencyEngine {
    if (!IdempotencyEngine.instance) {
      IdempotencyEngine.instance = new IdempotencyEngine();
    }
    return IdempotencyEngine.instance;
  }

  /**
   * Execute an action with strictly enforced idempotency.
   */
  public async executeIdempotent<T>(
    idempotencyKey: string,
    action: () => Promise<T>
  ): Promise<{ result: T; isCached: boolean }> {
    const existing = this.records.get(idempotencyKey);

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return { result: existing.response, isCached: true };
      }
      if (existing.status === 'IN_PROGRESS') {
        throw new Error(
          `[IDEMPOTENCY_IN_PROGRESS] Operation with key '${idempotencyKey}' is currently in-flight.`
        );
      }
    }

    // Acquire lock
    this.records.set(idempotencyKey, {
      key: idempotencyKey,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
    });

    try {
      const result = await action();
      this.records.set(idempotencyKey, {
        key: idempotencyKey,
        status: 'COMPLETED',
        response: result,
        createdAt: this.records.get(idempotencyKey)?.createdAt || Date.now(),
        completedAt: Date.now(),
      });
      return { result, isCached: false };
    } catch (err: any) {
      this.records.set(idempotencyKey, {
        key: idempotencyKey,
        status: 'FAILED',
        error: err.message,
        createdAt: this.records.get(idempotencyKey)?.createdAt || Date.now(),
        completedAt: Date.now(),
      });
      throw err;
    }
  }

  private cleanup() {
    const cutoff = Date.now() - this.ttlMs;
    for (const [key, record] of this.records.entries()) {
      if (record.createdAt < cutoff) {
        this.records.delete(key);
      }
    }
  }

  public clearForTesting() {
    this.records.clear();
  }
}

export const idempotencyEngine = IdempotencyEngine.getInstance();
