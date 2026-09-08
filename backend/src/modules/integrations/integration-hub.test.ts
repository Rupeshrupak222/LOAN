import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import { integrationHub, IntegrationHubService } from './integration-hub.service';
import { idempotencyService } from './idempotency.service';
import { webhookService } from './webhook.service';
import { validateOutboundUrl, maskSecret } from './integration.config';
import { IntegrationHubError, mapToNormalizedError, sanitizeErrorDetails } from './integration.errors';
import { BaseAdapter } from './adapters/base.adapter';
import { ProviderConfig, IntegrationCategory } from './integration.types';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
}));

// Mock Provider Adapter for testing various network conditions
class TestMockAdapter extends BaseAdapter {
  providerId: string;
  readonly name = 'Mock External Service';
  readonly category: IntegrationCategory = 'PAYMENT';
  config: ProviderConfig;

  public mockBehavior: 'SUCCESS' | 'TIMEOUT' | 'UNAVAILABLE' | 'RATE_LIMIT' | 'AUTH_FAIL' | 'SERVER_ERROR' = 'SUCCESS';
  public callCount = 0;

  constructor(isConfigured: boolean = true, providerId: string = 'mock_service') {
    super();
    this.providerId = providerId;
    this.config = {
      providerId,
      name: 'Mock External Service',
      category: 'PAYMENT',
      description: 'Test mock adapter',
      enabled: isConfigured,
      isConfigured,
      environment: 'development',
      baseUrl: 'https://api.mockservice.test',
      timeoutMs: 500,
      maxRetries: 2,
      rateLimitPerMinute: 60,
      authType: 'API_KEY',
      webhookSecret: 'test-secret-key-12345',
      maskedConfigSummary: { apiKey: 'moc****123' },
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    this.callCount++;

    if (signal.aborted) {
      const err: any = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    }

    if (this.mockBehavior === 'TIMEOUT') {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(null), 1000);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          const err: any = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
      const err: any = new Error('The operation timed out');
      err.name = 'AbortError';
      throw err;
    }

    if (this.mockBehavior === 'UNAVAILABLE') {
      const err: any = new Error('fetch failed: connect ECONNREFUSED');
      err.code = 'ECONNREFUSED';
      throw err;
    }

    if (this.mockBehavior === 'RATE_LIMIT') {
      const err: any = new Error('Too Many Requests');
      err.status = 429;
      throw err;
    }

    if (this.mockBehavior === 'AUTH_FAIL') {
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (this.mockBehavior === 'SERVER_ERROR') {
      const err: any = new Error('Internal Gateway Error');
      err.status = 502;
      throw err;
    }

    return {
      data: { status: 'OK', result: 'Processed successfully', echo: payload } as any,
      providerRequestId: `MOCK-${Date.now()}`,
      rawStatus: 'SUCCESS',
    };
  }

  public verifyWebhookSignature(rawBody: string, signature?: string): boolean {
    if (!signature || !this.config.webhookSecret) return false;
    const expected = createHmac('sha256', this.config.webhookSecret).update(rawBody).digest('hex');
    return expected === signature;
  }
}

describe('Step 12: Production-Grade Integration Hub', () => {
  let mockAdapter: TestMockAdapter;

  beforeEach(() => {
    idempotencyService.clearForTesting();
    webhookService.clearForTesting();
    mockAdapter = new TestMockAdapter(true);
    integrationHub.registerAdapter(mockAdapter);
  });

  // 1. Provider Registration & Directory
  it('registers all 7 standard LMS provider categories by default', async () => {
    const providers = await integrationHub.listProviders();
    expect(providers.length).toBeGreaterThanOrEqual(7);

    const categories = providers.map((p) => p.category);
    expect(categories).toContain('CREDIT');
    expect(categories).toContain('KYC');
    expect(categories).toContain('BANKING');
    expect(categories).toContain('PAYMENT');
    expect(categories).toContain('DISBURSEMENT');
    expect(categories).toContain('COMMUNICATION');
    expect(categories).toContain('DOCUMENT');
  });

  // 2. Unconfigured Provider State
  it('returns explicit NOT_CONFIGURED when provider credentials are missing without simulating fake success', async () => {
    const unconfigured = new TestMockAdapter(false, 'unconfigured_bureau');
    integrationHub.registerAdapter(unconfigured);

    const res = await integrationHub.executeRequest({
      providerId: 'unconfigured_bureau',
      category: 'CREDIT',
      action: 'FETCH_BUREAU_REPORT',
      payload: { pan: 'ABCDE1234F' },
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('NOT_CONFIGURED');
    expect(res.error?.code).toBe('PROVIDER_NOT_CONFIGURED');
    expect(res.error?.message).toContain('is not configured');
    expect(unconfigured.callCount).toBe(0);
  });

  // 3. Successful Execution & Envelope Normalization
  it('executes configured provider and returns standard normalized envelope', async () => {
    mockAdapter.mockBehavior = 'SUCCESS';

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'CREATE_PAYMENT_ORDER',
      payload: { amount: 15000 },
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('SUCCESS');
    expect(res.provider).toBe('mock_service');
    expect(res.category).toBe('PAYMENT');
    expect(res.correlationId).toMatch(/^INT-\d{8}-[A-Z0-9]{8}$/);
    expect(res.data?.status).toBe('OK');
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // 4. Timeout Handling
  it('normalizes provider timeouts to PROVIDER_TIMEOUT and respects timeout limit', async () => {
    mockAdapter.mockBehavior = 'TIMEOUT';
    mockAdapter.config.maxRetries = 0;

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'CAPTURE_PAYMENT',
      timeoutMs: 100,
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.error?.code).toBe('PROVIDER_TIMEOUT');
    expect(res.error?.httpStatus).toBe(504);
  });

  // 5. Provider Unavailable
  it('normalizes network disconnects and connection refused to PROVIDER_UNAVAILABLE', async () => {
    mockAdapter.mockBehavior = 'UNAVAILABLE';

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'PING',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.error?.code).toBe('PROVIDER_UNAVAILABLE');
    expect(res.error?.httpStatus).toBe(503);
  });

  // 6. Provider Rate Limiting (HTTP 429)
  it('normalizes HTTP 429 to PROVIDER_RATE_LIMITED and marks as retryable', async () => {
    mockAdapter.mockBehavior = 'RATE_LIMIT';

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'PING',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.error?.code).toBe('PROVIDER_RATE_LIMITED');
    expect(res.error?.isRetryable).toBe(true);
  });

  // 7. Provider Authentication Failure (HTTP 401)
  it('normalizes HTTP 401 to PROVIDER_AUTH_FAILED and marks as non-retryable', async () => {
    mockAdapter.mockBehavior = 'AUTH_FAIL';

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'PING',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.error?.code).toBe('PROVIDER_AUTH_FAILED');
    expect(res.error?.isRetryable).toBe(false);
  });

  // 8. Safe Retry Exhaustion
  it('retries transient failures up to maxRetries before normalizing final error', async () => {
    mockAdapter.mockBehavior = 'SERVER_ERROR';
    mockAdapter.config.maxRetries = 2;

    const res = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'PING',
    });

    expect(res.success).toBe(false);
    expect(mockAdapter.callCount).toBe(3); // 1 initial + 2 retries
    expect(res.error?.code).toBe('PROVIDER_SERVER_ERROR');
  });

  // 9. Idempotency: Replay Cached Completed Result
  it('replays identical cached response when repeating a completed idempotencyKey', async () => {
    mockAdapter.mockBehavior = 'SUCCESS';
    const idempotencyKey = 'IDEM-PAY-TEST-999';

    const res1 = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'DISBURSE',
      payload: { amount: 50000 },
      idempotencyKey,
    });

    expect(res1.success).toBe(true);
    expect(mockAdapter.callCount).toBe(1);

    // Second call with same idempotency key
    const res2 = await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'DISBURSE',
      payload: { amount: 50000 },
      idempotencyKey,
    });

    expect(res2.success).toBe(true);
    expect(res2.correlationId).toBe(res1.correlationId);
    expect(mockAdapter.callCount).toBe(1); // Provider was not called a second time
  });

  // 10. Idempotency: Concurrent In-Flight Rejection
  it('rejects concurrent requests with the same active idempotency key with IDEMPOTENCY_CONFLICT', () => {
    const key = 'IN_FLIGHT_KEY_123';
    idempotencyService.acquire(key, 'INT-TEST-001');

    expect(() => {
      idempotencyService.acquire(key, 'INT-TEST-002');
    }).toThrow(IntegrationHubError);

    try {
      idempotencyService.acquire(key, 'INT-TEST-002');
    } catch (e: any) {
      expect(e.code).toBe('IDEMPOTENCY_CONFLICT');
      expect(e.statusCode).toBe(409);
    }
  });

  // 11. Webhook Signature Verification: Valid HMAC
  it('validates authentic webhook with matching HMAC signature', async () => {
    const rawBody = JSON.stringify({ event: 'payment.authorized', paymentId: 'pay_12345' });
    const signature = createHmac('sha256', 'test-secret-key-12345').update(rawBody).digest('hex');

    const result = await webhookService.handleWebhook({
      providerId: 'mock_service',
      eventId: 'evt_001',
      eventType: 'payment.authorized',
      rawBody,
      signature,
      headers: {},
      parsedData: { event: 'payment.authorized' },
      receivedAt: new Date().toISOString(),
    });

    expect(result.acknowledged).toBe(true);
    expect(result.status).toBe('PROCESSED');
    expect(result.eventId).toBe('evt_001');
  });

  // 12. Webhook Signature Verification: Invalid HMAC
  it('rejects unauthorized webhooks with invalid HMAC signature with WEBHOOK_SIGNATURE_INVALID', async () => {
    const rawBody = JSON.stringify({ event: 'payment.authorized' });
    const invalidSignature = 'invalid-tampered-signature-hex';

    await expect(
      webhookService.handleWebhook({
        providerId: 'mock_service',
        eventId: 'evt_002',
        eventType: 'payment.authorized',
        rawBody,
        signature: invalidSignature,
        headers: {},
        parsedData: {},
        receivedAt: new Date().toISOString(),
      })
    ).rejects.toThrow(IntegrationHubError);
  });

  // 13. Webhook Deduplication / Replay Protection
  it('recognizes duplicate webhook events and acknowledges without reprocessing', async () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const signature = createHmac('sha256', 'test-secret-key-12345').update(rawBody).digest('hex');

    // First arrival
    const res1 = await webhookService.handleWebhook({
      providerId: 'mock_service',
      eventId: 'evt_duplicate_test',
      eventType: 'payment.captured',
      rawBody,
      signature,
      headers: {},
      parsedData: {},
      receivedAt: new Date().toISOString(),
    });
    expect(res1.status).toBe('PROCESSED');

    // Second arrival of same eventId
    const res2 = await webhookService.handleWebhook({
      providerId: 'mock_service',
      eventId: 'evt_duplicate_test',
      eventType: 'payment.captured',
      rawBody,
      signature,
      headers: {},
      parsedData: {},
      receivedAt: new Date().toISOString(),
    });
    expect(res2.status).toBe('DUPLICATE');
    expect(res2.acknowledged).toBe(true);
  });

  // 14. SSRF Outbound URL Security
  it('blocks SSRF attempts to private networks, loopback, and cloud metadata', () => {
    expect(() => validateOutboundUrl('http://169.254.169.254/latest/meta-data')).toThrow('SSRF_BLOCKED');
    expect(() => validateOutboundUrl('http://127.0.0.1:8080/admin')).toThrow('SSRF_BLOCKED');
    expect(() => validateOutboundUrl('http://10.0.0.1/internal')).toThrow('SSRF_BLOCKED');
    expect(() => validateOutboundUrl('http://192.168.1.1/router')).toThrow('SSRF_BLOCKED');
    expect(() => validateOutboundUrl('ftp://api.external.com')).toThrow('Unsupported protocol');

    // Valid public URL passes
    const valid = validateOutboundUrl('https://api.razorpay.com/v1');
    expect(valid.hostname).toBe('api.razorpay.com');
  });

  // 15. Secret Masking
  it('masks sensitive secrets and credentials to prevent log and UI leakage', () => {
    expect(maskSecret('sk_live_987654321abcdef')).toBe('sk_****def');
    expect(maskSecret('short')).toBe('******');
    expect(maskSecret('')).toBe('NOT_SET');
    expect(maskSecret(null)).toBe('NOT_SET');

    const sanitized = sanitizeErrorDetails({
      apiKey: 'test-sample-provider-api-key',
      nested: { password: 'test-sample-password' },
      safeField: 'Adyapan LMS',
    });
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.nested.password).toBe('[REDACTED]');
    expect(sanitized.safeField).toBe('Adyapan LMS');
  });

  // 16. Provider Health Metrics
  it('tracks health metrics including requests, latency, and status transitions', async () => {
    mockAdapter.mockBehavior = 'SUCCESS';
    await integrationHub.executeRequest({
      providerId: 'mock_service',
      category: 'PAYMENT',
      action: 'PING',
    });

    const health = await mockAdapter.checkHealth();
    expect(health.status).toBe('HEALTHY');
    expect(health.totalRequests).toBe(1);
    expect(health.successfulRequests).toBe(1);
    expect(health.failedRequests).toBe(0);
    expect(health.avgLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
