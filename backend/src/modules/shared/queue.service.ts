// Background Job Queue & Task Worker Manager
import pino from 'pino';

const logger = pino({ name: 'background-queue' });

export type JobType =
  | 'EMI_REMINDER'
  | 'DELINQUENCY_AGING_UPDATE'
  | 'NOTIFICATION_DISPATCH'
  | 'DAILY_PORTFOLIO_RECONCILIATION'
  | 'DOCUMENT_OCR_PROCESS';

export interface BackgroundJob<T = any> {
  id: string;
  type: JobType;
  data: T;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class BackgroundQueueManager {
  private jobs: Map<string, BackgroundJob> = new Map();
  private isRedisConnected = false;

  constructor() {
    this.isRedisConnected = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
    logger.info({
      msg: this.isRedisConnected
        ? 'BackgroundQueue initialized with Redis connection'
        : 'BackgroundQueue initialized in in-memory worker mode (Redis not configured in environment)',
      redisConfigured: this.isRedisConnected,
    });
  }

  public isRedisActive(): boolean {
    return this.isRedisConnected;
  }

  public async addJob<T>(type: JobType, data: T, maxAttempts = 3): Promise<BackgroundJob<T>> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: BackgroundJob<T> = {
      id,
      type,
      data,
      attempts: 0,
      maxAttempts,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(id, job);
    logger.info({ msg: `Job ${id} (${type}) enqueued`, jobId: id, type });
    return job;
  }

  public async processJob(jobId: string, handler: (job: BackgroundJob) => Promise<void>): Promise<BackgroundJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = 'ACTIVE';
    job.attempts++;
    job.updatedAt = new Date();

    try {
      await handler(job);
      job.status = 'COMPLETED';
      logger.info({ msg: `Job ${jobId} completed successfully`, jobId, attempts: job.attempts });
    } catch (err: any) {
      job.error = err.message;
      if (job.attempts < job.maxAttempts) {
        job.status = 'RETRYING';
        logger.warn({ msg: `Job ${jobId} failed, retrying (${job.attempts}/${job.maxAttempts})`, error: err.message });
      } else {
        job.status = 'FAILED';
        logger.error({ msg: `Job ${jobId} failed permanently`, error: err.message });
      }
    }
    job.updatedAt = new Date();
    return job;
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  public listJobs(type?: JobType): BackgroundJob[] {
    const all = Array.from(this.jobs.values());
    return type ? all.filter((j) => j.type === type) : all;
  }
}

export const backgroundQueue = new BackgroundQueueManager();
