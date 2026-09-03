// Step 26: Production Worker & Job Queue Types

export type JobType =
  | 'REPORT_GENERATION'
  | 'COMMUNICATION_DISPATCH'
  | 'RECONCILIATION_JOB'
  | 'AI_PIPELINE_ANALYSIS'
  | 'DOCUMENT_OCR_EXTRACTION';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export type JobPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface Job<T = any> {
  id: string;
  tenantId: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: T;
  idempotencyKey?: string;
  attempts: number;
  maxRetries: number;
  backoffMs: number;
  lastError?: string;
  result?: any;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface EnqueueJobDto<T = any> {
  tenantId: string;
  type: JobType;
  payload: T;
  priority?: JobPriority;
  idempotencyKey?: string;
  maxRetries?: number;
  backoffMs?: number;
}

export interface WorkerPoolMetrics {
  totalJobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
  concurrency: number;
}
