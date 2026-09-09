// Step 32: External Integration Certification Types

export type CertificationStatus =
  | 'CERTIFIED_PRODUCTION_READY'
  | 'CERTIFIED_WITH_FALLBACK'
  | 'TEST_MODE_ONLY'
  | 'DEGRADED'
  | 'BLOCKED';

export type ProductionRequirementLevel =
  | 'PRODUCTION_REQUIRED'
  | 'PRODUCTION_RECOMMENDED'
  | 'OPTIONAL'
  | 'NOT_REQUIRED';

export interface RetryTimeoutPolicy {
  timeoutMs: number;
  maxRetries: number;
  backoffMultiplier: number;
}

export interface ConnectorCertificationRecord {
  connectorId: string;
  connectorName: string;
  category: string;
  requirementLevel: ProductionRequirementLevel;
  certificationStatus: CertificationStatus;
  primaryProvider: string;
  fallbackProvider?: string;
  healthCheckCapability: boolean;
  lastHealthCheckAt: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  retryTimeoutPolicy: RetryTimeoutPolicy;
  idempotencySupported: boolean;
  secretMaskingVerified: boolean;
  circuitBreakerState: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  correlationTracingSupported: boolean;
  errorRate24h: number;
  latencyP95Ms: number;
  tenantId: string;
}

export interface FailoverTestResult {
  testId: string;
  connectorId: string;
  primaryProvider: string;
  primarySimulatedFailure: boolean;
  fallbackProvider: string;
  fallbackExecuted: boolean;
  idempotencyKeyPreserved: boolean;
  zeroTransactionDuplication: boolean;
  failoverLatencyMs: number;
  auditEvidenceRef: string;
  status: 'FAILOVER_SUCCESS' | 'FAILOVER_FAILED';
  executedAt: string;
}

export interface CertificationOverview {
  tenantId: string;
  totalConnectors: number;
  certifiedProductionReady: number;
  certifiedWithFallback: number;
  testModeOnly: number;
  degradedOrBlocked: number;
  connectors: ConnectorCertificationRecord[];
  updatedAt: string;
}
