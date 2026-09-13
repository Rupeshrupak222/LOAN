# Phase 14: Data Freshness & Snapshot Architecture

## 1. Freshness Principles
1. **Live Transactional Telemetry**: Real-time aggregation queries against authoritative domain tables (`LoanApplication`, `Loan`, `Payment`, `Disbursement`) provide up-to-the-minute operational dashboards.
2. **Materialized Daily Snapshots**: `AnalyticsSnapshot` captures daily immutable records for portfolio AUM, PAR metrics, and disbursement totals at standard midnight cutoffs.
3. **Transparent Freshness Indicators**: Every dashboard card and analytics screen displays a visible freshness indicator (e.g., `Authoritative Reporting Layer: Active Real-time Stream` or `Snapshot captured at HH:mm IST`).

## 2. Historical Immutability
Historical snapshots are immutable and never updated retroactively if product configurations or interest policies change. This ensures historical consistency for regulatory audits and vintage analysis.
