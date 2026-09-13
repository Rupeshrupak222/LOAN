# Phase 14: Report Builder & Saved Queries

## 1. Overview
The Report Builder (`/reports`) allows institutional users to construct parameterized reports across 12 analytical domains using server-side whitelisted metrics and dimensions.

## 2. Server-Side Whitelisting Security
To prevent arbitrary SQL injection or unbounded memory exhaustion:
- Only pre-approved domain handlers are invokable.
- Dynamic filtering is strictly mapped to index-backed fields (`tenantId`, `branchId`, `productId`, `timeRange`, `loanStatus`, `riskGrade`).
- All queries enforce database-side aggregations and maximum row limits.

## 3. Saved Reports Management
Users with `REPORT_CREATE` permissions can save report configurations with:
- `PRIVATE`: Accessible only to the creator.
- `TEAM`: Shared among members of the same branch or functional team.
- `TENANT`: Available across all departments in the institution.

## 4. Export Capabilities
Exports support CSV and Excel-compatible streaming outputs:
- Non-auditor roles automatically receive masked PII (phone numbers and emails).
- Max row cap of 5,000 records per export.
- Every export generates an immutable `AuditLog` record.
