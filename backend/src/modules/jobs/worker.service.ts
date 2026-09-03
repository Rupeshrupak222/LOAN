import { v4 as uuid } from 'uuid';
import { Job, JobType, JobStatus, EnqueueJobDto, WorkerPoolMetrics } from './worker.types';
import { logger } from '../../config/logger';

export type JobHandler<T = any, R = any> = (payload: T, job: Job<T>) => Promise<R>;

export class WorkerService {
  private static instance: WorkerService;

  // In-memory queue: Map<jobId, Job>
  private readonly jobs = new Map<string, Job>();

  // Idempotency index: Map<idempotencyKey, jobId>
  private readonly idempotencyMap = new Map<string, string>();

  // Handlers registry: Map<JobType, JobHandler>
  private readonly handlers = new Map<JobType, JobHandler>();

  private isProcessing = false;
  private readonly concurrencyLimit = 5;
  private activeWorkers = 0;

  private constructor() {
    this.registerDefaultHandlers();
  }

  public static getInstance(): WorkerService {
    if (!WorkerService.instance) {
      WorkerService.instance = new WorkerService();
    }
    return WorkerService.instance;
  }

  private registerDefaultHandlers(): void {
    // 1. Report Generation Handler
    this.registerHandler('REPORT_GENERATION', async (payload) => {
      return {
        reportId: `rep-${uuid().slice(0, 8)}`,
        generatedAt: new Date().toISOString(),
        recordCount: payload.records || 100,
        status: 'READY',
      };
    });

    // 2. Communication Dispatch Handler
    this.registerHandler('COMMUNICATION_DISPATCH', async (payload) => {
      return {
        dispatched: true,
        recipient: payload.recipient,
        channel: payload.channel || 'EMAIL',
        dispatchedAt: new Date().toISOString(),
      };
    });

    // 3. Reconciliation Job Handler
    this.registerHandler('RECONCILIATION_JOB', async (payload) => {
      return {
        batchId: payload.batchId || `rec-${uuid().slice(0, 8)}`,
        matchedCount: payload.matched || 50,
        discrepancyCount: payload.discrepancies || 0,
        status: 'RECONCILED',
      };
    });

    // 4. AI Pipeline Analysis Handler
    this.registerHandler('AI_PIPELINE_ANALYSIS', async (payload) => {
      return {
        analysisId: `ai-${uuid().slice(0, 8)}`,
        confidenceScore: 0.94,
        recommendation: 'VERIFIED_CLEAN',
        timestamp: new Date().toISOString(),
      };
    });

    // 5. Document OCR Extraction Handler
    this.registerHandler('DOCUMENT_OCR_EXTRACTION', async (payload) => {
      return {
        documentType: payload.documentType || 'PAN_CARD',
        extractedData: { verified: true },
        ocrQualityScore: 98.5,
      };
    });
  }

  public registerHandler<T = any, R = any>(type: JobType, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler);
  }

  public async enqueueJob<T = any>(dto: EnqueueJobDto<T>): Promise<Job<T>> {
    // 1. Idempotency check
    if (dto.idempotencyKey) {
      const existingId = this.idempotencyMap.get(dto.idempotencyKey);
      if (existingId) {
        const existingJob = this.jobs.get(existingId);
        if (existingJob) {
          logger.info(`[WORKER_IDEMPOTENT_HIT] Job ${existingId} already exists for key '${dto.idempotencyKey}'.`);
          return existingJob as Job<T>;
        }
      }
    }

    const jobId = `job-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const job: Job<T> = {
      id: jobId,
      tenantId: dto.tenantId,
      type: dto.type,
      priority: dto.priority || 'NORMAL',
      status: 'QUEUED',
      payload: dto.payload,
      idempotencyKey: dto.idempotencyKey,
      attempts: 0,
      maxRetries: dto.maxRetries !== undefined ? dto.maxRetries : 3,
      backoffMs: dto.backoffMs || 100, // 100ms base backoff
      createdAt: now,
    };

    this.jobs.set(jobId, job);

    if (dto.idempotencyKey) {
      this.idempotencyMap.set(dto.idempotencyKey, jobId);
    }

    // Trigger processing tick asynchronously
    void this.processNext();

    return job;
  }

  public async processNext(): Promise<void> {
    if (this.activeWorkers >= this.concurrencyLimit) {
      return;
    }

    // Priority ordering: CRITICAL (4) > HIGH (3) > NORMAL (2) > LOW (1)
    const priorityWeight: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    const nextJob = Array.from(this.jobs.values())
      .filter((j) => j.status === 'QUEUED')
      .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || a.createdAt.localeCompare(b.createdAt))[0];

    if (!nextJob) {
      return;
    }

    this.activeWorkers += 1;
    nextJob.status = 'PROCESSING';
    nextJob.startedAt = new Date().toISOString();
    nextJob.attempts += 1;

    try {
      const handler = this.handlers.get(nextJob.type);
      if (!handler) {
        throw new Error(`No worker handler registered for job type '${nextJob.type}'.`);
      }

      const result = await handler(nextJob.payload, nextJob);
      nextJob.status = 'COMPLETED';
      nextJob.result = result;
      nextJob.completedAt = new Date().toISOString();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      nextJob.lastError = errMsg;

      if (nextJob.attempts <= nextJob.maxRetries) {
        // Calculate exponential backoff with jitter
        const backoff = nextJob.backoffMs * Math.pow(2, nextJob.attempts - 1) + Math.floor(Math.random() * 50);
        logger.warn(
          `[WORKER_RETRY] Job ${nextJob.id} failed attempt ${nextJob.attempts}/${nextJob.maxRetries}. Retrying in ${backoff}ms... Error: ${errMsg}`
        );

        nextJob.status = 'QUEUED'; // Requeue for next retry
        setTimeout(() => {
          void this.processNext();
        }, backoff);
      } else {
        // Exceeded max retries -> Move to Dead Letter Queue (DLQ)
        nextJob.status = 'DEAD_LETTER';
        nextJob.completedAt = new Date().toISOString();
        logger.error(`[WORKER_DEAD_LETTER] Job ${nextJob.id} failed all retries. Moved to DLQ. Reason: ${errMsg}`);
      }
    } finally {
      this.activeWorkers -= 1;
      void this.processNext();
    }
  }

  public getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  public listDeadLetterJobs(tenantId?: string): Job[] {
    return Array.from(this.jobs.values()).filter((j) => {
      if (j.status !== 'DEAD_LETTER') return false;
      if (tenantId && j.tenantId !== tenantId) return false;
      return true;
    });
  }

  public async retryDeadLetterJob(jobId: string): Promise<Job> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'DEAD_LETTER') {
      throw new Error(`Job '${jobId}' is not in Dead Letter status.`);
    }

    job.status = 'QUEUED';
    job.attempts = 0;
    job.lastError = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;

    void this.processNext();
    return job;
  }

  public getMetrics(): WorkerPoolMetrics {
    const all = Array.from(this.jobs.values());
    return {
      totalJobs: all.length,
      queued: all.filter((j) => j.status === 'QUEUED').length,
      processing: all.filter((j) => j.status === 'PROCESSING').length,
      completed: all.filter((j) => j.status === 'COMPLETED').length,
      failed: all.filter((j) => j.status === 'FAILED').length,
      deadLetter: all.filter((j) => j.status === 'DEAD_LETTER').length,
      concurrency: this.activeWorkers,
    };
  }

  public clearForTesting(): void {
    this.jobs.clear();
    this.idempotencyMap.clear();
    this.activeWorkers = 0;
  }
}

export const workerService = WorkerService.getInstance();
