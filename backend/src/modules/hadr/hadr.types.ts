// Step 27: High Availability & Disaster Recovery Types

export type RegionIdentifier = 'PRIMARY_AP_SOUTH_1' | 'DR_AP_SOUTHEAST_1';

export type FailoverState = 'NORMAL' | 'FAILOVER_IN_PROGRESS' | 'FAILED_OVER' | 'FAILBACK_IN_PROGRESS';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ResilientService =
  | 'BUREAU_GATEWAY'
  | 'PAYMENT_GATEWAY'
  | 'AI_GEMINI_GATEWAY'
  | 'KYC_GATEWAY'
  | 'COMM_GATEWAY';

export type FallbackStrategy =
  | 'DETERMINISTIC_RULES'
  | 'SECONDARY_GATEWAY'
  | 'ASYNC_OUTBOX_QUEUE'
  | 'MANUAL_REVIEW_FLAG';

export interface CircuitBreakerStatus {
  service: ResilientService;
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  cooldownMs: number;
  lastFailureAt?: string;
  lastSuccessAt?: string;
  fallbackStrategy: FallbackStrategy;
}

export interface HADRStatus {
  activeRegion: RegionIdentifier;
  standbyRegion: RegionIdentifier;
  failoverState: FailoverState;
  rtoTargetMinutes: number;
  rpoTargetSeconds: number;
  replicationLagMs: number;
  circuitBreakers: Record<ResilientService, CircuitBreakerStatus>;
  lastDrillAt?: string;
  updatedAt: string;
}

export interface DRDrillStep {
  stepName: string;
  status: 'COMPLETED' | 'FAILED';
  durationMs: number;
  details?: string;
}

export interface DRDrillResult {
  drillId: string;
  initiatedBy: string;
  targetRtoMinutes: number;
  achievedRtoSeconds: number;
  targetRpoSeconds: number;
  dataLossDetected: boolean;
  backupIntegrityChecksum: string;
  status: 'SUCCESS' | 'FAILED';
  executedAt: string;
  steps: DRDrillStep[];
}
