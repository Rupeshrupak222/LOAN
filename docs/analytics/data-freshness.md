# Data Freshness & Snapshot Guarantees

## 1. Freshness Metadata Contract
Every analytics response embeds metadata describing data freshness:

```typescript
interface DataFreshnessInfo {
  calculatedAt: string; // ISO 8601 Timestamp
  freshnessSec: number; // Seconds since calculation
  dataFreshnessText: string; // e.g. "Real-time (Live)" or "Snapshot from 5 minutes ago"
  isRealtime: boolean;
  snapshotId?: string;
}
```

---

## 2. Distinguishing Live vs Snapshot State
- **Live Analytical Telemetry**: Calculated on-demand against indexed reporting projections and transactional tables.
- **Reporting Snapshots**: Immutable historical records generated at fiscal cutoffs (EOD / EOM) for statutory compliance and multi-year trend audits.
