// Provider Resilience & Retry Engine

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  timeoutMs: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  backoffFactor: 2,
  timeoutMs: 8000,
};

export class RetryEngine {
  /**
   * Determine if an error is classified as retryable.
   */
  public static isRetryableError(error: any): boolean {
    if (!error) return false;

    const msg = String(error.message || '').toUpperCase();
    const code = String(error.code || '').toUpperCase();
    const status = Number(error.status || error.httpStatus || 0);

    // Timeout or network disconnect
    if (msg.includes('TIMEOUT') || code.includes('TIMEOUT') || code.includes('ECONNRESET')) {
      return true;
    }

    // Rate limits (429) and Server Downtime (502, 503, 504)
    if (status === 429 || status === 502 || status === 503 || status === 504) {
      return true;
    }

    // Business validation failures, auth errors, and bad requests are NOT retryable
    if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
      return false;
    }

    return false;
  }

  /**
   * Execute an operation with exponential backoff and timeout handling.
   */
  public static async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<{ result: T; attempts: number }> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let attempt = 0;
    let delay = opts.initialDelayMs;

    while (attempt <= opts.maxRetries) {
      attempt++;
      try {
        // Execute operation with timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`[PROVIDER_TIMEOUT] Operation timed out after ${opts.timeoutMs}ms`)), opts.timeoutMs).unref();
        });

        const result = await Promise.race([operation(attempt), timeoutPromise]);
        return { result, attempts: attempt };
      } catch (err: any) {
        const isRetryable = RetryEngine.isRetryableError(err);
        if (!isRetryable || attempt > opts.maxRetries) {
          throw err;
        }

        // Backoff delay with jitter
        const jitter = Math.random() * 50;
        await new Promise((res) => setTimeout(res, Math.min(delay + jitter, opts.maxDelayMs)));
        delay *= opts.backoffFactor;
      }
    }

    throw new Error(`Execution failed after ${opts.maxRetries} retries.`);
  }
}
