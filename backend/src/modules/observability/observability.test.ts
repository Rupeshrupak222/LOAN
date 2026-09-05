import { describe, it, expect, beforeEach, vi } from 'vitest';
import { observabilityService } from './observability.service';
import { tracingMiddleware } from '../../middleware/tracing';

describe('Step 28: Observability, Metrics & Operations Center', () => {
  beforeEach(() => {
    observabilityService.clearForTesting();
  });

  describe('1. Prometheus Metrics Exporter', () => {
    it('generates standard Prometheus text-format scrape output', () => {
      observabilityService.recordRequest({
        tenantId: 'tenant-adyapan-default',
        method: 'GET',
        route: '/api/v1/applications',
        statusCode: 200,
        durationMs: 42,
        correlationId: 'req-test-1',
        timestamp: new Date().toISOString(),
      });

      const scrapeText = observabilityService.formatPrometheusMetrics();

      expect(scrapeText).toContain('# HELP adyapan_http_requests_total');
      expect(scrapeText).toContain('# TYPE adyapan_http_requests_total counter');
      expect(scrapeText).toContain('adyapan_http_requests_total 1');
      expect(scrapeText).toContain('# HELP adyapan_process_uptime_seconds');
      expect(scrapeText).toContain('adyapan_process_memory_rss_bytes');
    });
  });

  describe('2. RED Metrics & Latency Percentiles', () => {
    it('calculates request rate, error percentage, and latency percentiles accurately', () => {
      // Record 10 requests with varying latencies
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      latencies.forEach((lat, idx) => {
        observabilityService.recordRequest({
          tenantId: 'tenant-adyapan-default',
          method: 'POST',
          route: '/api/v1/loans/apply',
          statusCode: idx === 9 ? 500 : 200, // 1 error out of 10
          durationMs: lat,
          correlationId: `req-${idx}`,
          timestamp: new Date().toISOString(),
        });
      });

      const red = observabilityService.getRedMetrics('tenant-adyapan-default');

      expect(red.totalRequests).toBe(10);
      expect(red.errorCount).toBe(1);
      expect(red.errorRatePercentage).toBe(10.0);
      expect(red.p50LatencyMs).toBe(50);
      expect(red.p90LatencyMs).toBe(90);
      expect(red.p95LatencyMs).toBe(90); // 95th percentile index
    });
  });

  describe('3. Structured Log PII Redaction', () => {
    it('redacts PAN, Aadhaar, and credentials in structured log payloads', () => {
      const rawLog = {
        userId: 'usr-123',
        customerPan: 'ABCDE1234F',
        customerAadhaar: '123456789012',
        bankAccountNo: '987654321098',
        jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        nested: {
          password: 'Passw0rd!Secret',
          safeField: 'Adyapan Prime',
        },
      };

      const sanitized = observabilityService.sanitizeLogData(rawLog);

      expect(sanitized.customerPan).toBe('ABCDE****F');
      expect(sanitized.customerAadhaar).toBe('**** **** 9012');
      expect(sanitized.bankAccountNo).toBe('******1098');
      expect(sanitized.jwtToken).toBe('******');
      expect(sanitized.nested.password).toBe('******');
      expect(sanitized.nested.safeField).toBe('Adyapan Prime');
    });
  });

  describe('4. Operational Alert Center', () => {
    it('creates, lists, and acknowledges operational alerts', () => {
      const alert = observabilityService.createAlert({
        tenantId: 'tenant-apex-nbfc',
        severity: 'WARNING',
        title: 'Redis Connection Latency High',
        message: 'Redis ping latency exceeded 50ms.',
        source: 'CACHE_SENTINEL',
      });

      expect(alert.id).toBeDefined();
      expect(alert.acknowledged).toBe(false);

      const activeList = observabilityService.listAlerts('tenant-apex-nbfc');
      expect(activeList.some((a) => a.id === alert.id)).toBe(true);

      const acked = observabilityService.acknowledgeAlert(alert.id, {
        id: 'usr-admin-1',
        email: 'ops@apexcap.dev',
      });

      expect(acked.acknowledged).toBe(true);
      expect(acked.acknowledgedBy).toBe('ops@apexcap.dev');
    });
  });

  describe('5. Distributed Tracing Middleware', () => {
    it('propagates incoming X-Correlation-ID or generates a new one', () => {
      const req: any = { headers: { 'x-correlation-id': 'corr-custom-123' }, on: vi.fn() };
      const res: any = { setHeader: vi.fn(), on: vi.fn() };
      const next = vi.fn();

      tracingMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'corr-custom-123');
      expect(next).toHaveBeenCalled();
    });
  });
});
