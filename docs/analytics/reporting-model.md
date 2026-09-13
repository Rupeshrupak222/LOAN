# Phase 14: Reporting Data Model & Snapshots

## 1. Schema Extensions
The Phase 14 database schema introduces three reporting models:

### `AnalyticsSnapshot`
Stores periodic immutable reporting snapshots for portfolio, vintage, and cohort trend analysis.
- `id`: Unique UUID.
- `snapshotDate`: Timestamp of snapshot capture.
- `snapshotType`: Categorization (`DAILY_PORTFOLIO`, `ORIGINATIONS`, `COLLECTIONS`, `FINANCIAL`, `RISK`, `BRANCH_PERFORMANCE`).
- `tenantId` & `branchId` & `productId`: Multi-tenant and branch attribution.
- `metrics`: JSON object holding detailed aggregates.
- `dimensions`: JSON object holding high-level indexable dimensions.

### `SavedReport`
Persists parameterized query configurations created in the Report Builder.
- `id`: Unique UUID.
- `name` & `description`: User-defined labels.
- `reportType`: Whitelisted server-side domain (`PORTFOLIO`, `ORIGINATIONS`, `CREDIT_BRE`, `RISK_FRAUD`, `DISBURSEMENTS`, `COLLECTIONS`, `FINANCIAL`, `PARTNERS`, `PRODUCTS`, `BRANCHES`, `OPERATIONS_SLA`, `SUPPORT`, `CUSTOM`).
- `metricKeys` & `dimensions`: Selected fields.
- `filters`: JSON object holding applied criteria.
- `chartType`: Visualization choice (`KPI`, `LINE`, `BAR`, `STACKED_BAR`, `DONUT`, `FUNNEL`, `TABLE`).
- `visibility`: Access scope (`PRIVATE`, `TEAM`, `TENANT`).
- `ownerId`: User ID of report creator.
- `lastRunAt`: Timestamp of last execution.

### `AnalyticsDashboardLayout`
Stores customized dashboard widget configurations for users or institutional roles.
- `userId` & `role`: Layout owner attribution.
- `layoutConfig`: JSON array of widget coordinates, chart types, and metric domains.
- `isDefault`: Whether this layout serves as the default preset.
