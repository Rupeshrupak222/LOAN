# Phase 14: Analytics, MIS & Enterprise Command Center Architecture

## 1. Architectural Blueprint
The Analytics and MIS architecture is designed as a centralized, read-optimized intelligence layer over the entire Adyapan Lending OS transactional foundation. It strictly consumes authoritative domain ledgers and services without recalculating or duplicating core financial calculations.

```
Transactional Domain Ledgers & Services
[LoanApplication] [Loan] [Disbursement] [Payment] [CollectionCase] [GeneralLedger / TrialBalance]
                                        ↓
                  Centralized Analytics Metrics Engine
               (backend/src/modules/analytics/analytics-metrics.service.ts)
                                        ↓
       ┌───────────────────────────────┬────────────────────────────────┐
       ↓                               ↓                                ↓
Executive Command Center    Interactive Analytics Hub       Dynamic Report Builder
(/command-center)           (/analytics)                    (/reports)
• Enterprise Snapshot       • 11 Granular Domain Views      • Dimension Multi-Slicing
• Real-time Telemetry       • Drilldown Interactivity       • Whitelisted Metric Aggs
• Actionable Alerts         • Role-Specific Scoping         • Audited CSV / Excel Export
                                                            • Immutable Snapshots
```

---

## 2. Core Design Principles

1. **No Redundant Domain Calculations**:
   - DPD & Delinquency metrics consume the Phase 11 DPD Engine.
   - P&L, Balance Sheet, and Revenue metrics consume Phase 10 / 12 Financial Statements & Trial Balance.
   - Credit decisions consume Phase 2 Decision Engine & Phase 3 Approval Authority.
   - Fraud and Risk classifications consume Phase 9 Risk/Fraud engines.

2. **Strict Multi-Tenant, Branch & Partner Isolation**:
   - Every request is authenticated and verified via `rolePermissionService.hasPermission`.
   - `buildScopedPrismaFilter` enforces tenant boundaries, branch locks, and partner isolation at the database query level (preventing IDOR or filter manipulation).

3. **Immutable Reporting Snapshots**:
   - Periodic daily and monthly snapshots capture historical portfolio and revenue figures to ensure regulatory auditability and tamper-resistance.

4. **Audited Exports with PII Masking**:
   - All CSV and spreadsheet exports pass through `AnalyticsExportService.maskPii`, which masks PAN, Aadhaar, phone numbers, and bank account numbers unless an authorized compliance officer requests an unmasked audit export.
