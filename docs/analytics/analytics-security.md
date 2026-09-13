# Phase 14: Analytics Security & Multi-Tenant Access Control

## 1. Security Architecture
Every analytical request undergoes a 5-step authorization verification:
```
Incoming HTTP Request
       ↓
JWT Authentication Verification
       ↓
Role Permission Check (e.g., ANALYTICS_VIEW, REPORT_EXPORT)
       ↓
Tenant & Branch Context Extraction
       ↓
buildSecurityScope() Hard-Filter Injection
       ↓
Database-Side Filtered Aggregation
```

## 2. Segregation by Role
- **SUPER_ADMIN / COMPANY_ADMIN**: Unrestricted access across all branches, products, and partners within the tenant.
- **BRANCH_MANAGER**: Strictly bounded to loans, applications, and collections belonging to their assigned `branchId`.
- **CREDIT_ANALYST / UNDERWRITER**: Permitted to view credit decisioning, BRE outcomes, risk bands, and application queue aging.
- **COLLECTION_OFFICER / MANAGER**: Restricted to collection cases, DPD delinquency buckets, and collector scorecards.
- **FINANCE_OFFICER**: Permitted to view disbursement outflows, repayment inflows, fee revenue, and general ledger balances.
- **PARTNER / LSP**: Strictly restricted to their own partner-sourced loan pipeline and commission records.
- **CUSTOMER / BORROWER**: Completely blocked from accessing institutional analytics endpoints.

## 3. IDOR and Filter Manipulation Defense
The backend overrides any user-supplied `tenantId`, `branchId`, or `partnerId` in query parameters with the authenticated token's verified identity, preventing parameter tampering.
