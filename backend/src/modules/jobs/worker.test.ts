import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workerService } from './worker.service';

describe('Step 26: Production Worker & Async Job Queue', () => {
  beforeEach(() => {
    workerService.clearForTesting();
  });

  describe('1. Async Job Enqueue & Execution', () => {
    it('enqueues and processes report generation job successfully', async () => {
      const job = await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'REPORT_GENERATION',
        payload: { reportType: 'PORTFOLIO_SUMMARY', records: 250 },
      });

      expect(job.id).toBeDefined();
      expect(job.tenantId).toBe('tenant-adyapan-default');

      // Wait a tick for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = workerService.getJob(job.id);
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.result.status).toBe('READY');
      expect(updated?.result.recordCount).toBe(250);
    });

    it('enqueues and processes communication dispatch job successfully', async () => {
      const job = await workerService.enqueueJob({
        tenantId: 'tenant-apex-nbfc',
        type: 'COMMUNICATION_DISPATCH',
        payload: { recipient: 'borrower@apexcap.dev', channel: 'SMS' },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = workerService.getJob(job.id);
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.result.dispatched).toBe(true);
      expect(updated?.result.channel).toBe('SMS');
    });
  });

  describe('2. Idempotency & Deduplication', () => {
    it('returns existing job and avoids duplicate execution for identical idempotency keys', async () => {
      const idempotencyKey = 'idemp-tx-batch-9901';

      const job1 = await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'RECONCILIATION_JOB',
        payload: { batchId: 'batch-001' },
        idempotencyKey,
      });

      const job2 = await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'RECONCILIATION_JOB',
        payload: { batchId: 'batch-001' },
        idempotencyKey,
      });

      expect(job1.id).toBe(job2.id);

      const metrics = workerService.getMetrics();
      expect(metrics.totalJobs).toBe(1);
    });
  });

  describe('3. Exponential Backoff Retries & Dead Letter Queue (DLQ)', () => {
    it('retries failing jobs up to maxRetries and moves to DEAD_LETTER status', async () => {
      // Register temporary failing handler
      workerService.registerHandler('AI_PIPELINE_ANALYSIS', async () => {
        throw new Error('Upstream AI Gateway 503 Outage');
      });

      const job = await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'AI_PIPELINE_ANALYSIS',
        payload: { docId: 'doc-123' },
        maxRetries: 2,
        backoffMs: 10, // Fast backoff for testing
      });

      // Wait for retries to exhaust
      await new Promise((resolve) => setTimeout(resolve, 150));

      const updated = workerService.getJob(job.id);
      expect(updated?.status).toBe('DEAD_LETTER');
      expect(updated?.attempts).toBe(3); // Initial try + 2 retries
      expect(updated?.lastError).toContain('Upstream AI Gateway 503 Outage');

      const dlq = workerService.listDeadLetterJobs();
      expect(dlq.length).toBe(1);
      expect(dlq[0].id).toBe(job.id);
    });

    it('recovers and requeues dead-letter jobs via retryDeadLetterJob', async () => {
      // Register temporary failing handler
      let shouldFail = true;
      workerService.registerHandler('DOCUMENT_OCR_EXTRACTION', async () => {
        if (shouldFail) throw new Error('Temporary OCR failure');
        return { extractedData: { name: 'Vikram' } };
      });

      const job = await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'DOCUMENT_OCR_EXTRACTION',
        payload: { documentId: 'doc-99' },
        maxRetries: 1,
        backoffMs: 10,
      });

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(workerService.getJob(job.id)?.status).toBe('DEAD_LETTER');

      // Resolve upstream issue & retry DLQ job
      shouldFail = false;
      const retried = await workerService.retryDeadLetterJob(job.id);
      expect(['QUEUED', 'PROCESSING', 'COMPLETED']).toContain(retried.status);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(workerService.getJob(job.id)?.status).toBe('COMPLETED');
    });
  });

  describe('4. Worker Pool Telemetry Metrics', () => {
    it('accurately tracks metrics across all job states', async () => {
      await workerService.enqueueJob({
        tenantId: 'tenant-adyapan-default',
        type: 'REPORT_GENERATION',
        payload: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const metrics = workerService.getMetrics();
      expect(metrics.totalJobs).toBe(1);
      expect(metrics.completed).toBe(1);
      expect(metrics.failed).toBe(0);
    });
  });
});
