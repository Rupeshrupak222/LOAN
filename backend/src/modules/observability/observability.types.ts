// Step 28: Observability, Metrics & Operations Center Types

export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface HttpMetricRecord {
  tenantId: string;
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  correlationId: string;
  timestamp: string;
}

export interface RedMetricsSummary {
  tenantId: string;
  totalRequests: number;
  requestsPerSecond: number;
  errorCount: number;
  errorRatePercentage: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export interface OperationalAlert {
  id: string;
  tenantId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface PlatformTelemetryOverview {
  tenantId: string;
  uptimeSeconds: number;
  redMetrics: RedMetricsSummary;
  system: {
    memoryRssMb: number;
    heapUsedMb: number;
    cpuLoadPercentage: number;
    dbConnectionsActive: number;
    redisConnected: boolean;
  };
  financial: {
    activeApplicationsCount: number;
    totalDisbursedAmount: number;
    collectionEfficiencyRate: number;
    discrepancyCount: number;
  };
  activeAlertsCount: number;
  updatedAt: string;
}
