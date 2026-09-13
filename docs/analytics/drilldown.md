# Phase 14: Generic Parameterized Drill-Down Engine

## 1. Overview
The Drill-Down Engine (`POST /api/v1/analytics/drilldown`) enables bidirectional navigation from aggregated high-level KPIs down to specific transactional records.

## 2. Supported Drill-Down Dimensions
1. **`APPLICATIONS`**: Sourced loan applications filtered by stage, risk grade, branch, or product.
2. **`LOANS`**: Active loans filtered by DPD bucket, status, or branch.
3. **`DISBURSEMENTS`**: Individual payout orders filtered by date range and status.
4. **`PAYMENTS`**: Repayment records filtered by status and date range.
5. **`COLLECTIONS`**: Delinquent cases filtered by assigned collector and aging bucket.

## 3. Context & Security Preservation
Drill-down queries automatically carry:
- Time-range bounds.
- Tenant and branch security boundaries.
- Paginated table views with search and export options.
