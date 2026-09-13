# Phase 14: Analytics, MIS & Enterprise Command Center Architecture

## 1. Overview
The Analytics, MIS & Enterprise Command Center layer in Adyapan Lending OS provides a centralized, read-optimized reporting and business intelligence infrastructure for the entire platform.

It adheres to the core architecture principle:
```
Transactional Domain Data (Phases 0–13)
           ↓
Analytics Projection & Materialized Reporting Layer
           ↓
Aggregated Metric Calculations
           ↓
MIS & Scheduled Reports
           ↓
Interactive Dashboards
           ↓
Executive Command Center
```

## 2. Authoritative Domain Sources of Truth
To prevent duplicate calculation divergence across dashboards:
- **Originations & Funnel**: `LoanApplication` & `ApplicationStatusHistory` (Phase 7 / Workflow Foundation)
- **Credit Decisions & BRE**: `DecisionEnginePolicy`, `RiskAssessment`, `UnderwritingDecision` (Phase 2 & Phase 3)
- **Risk Governance & Fraud**: Risk 6-Pillar Model & Fraud Syndicate Graph (Phase 9)
- **Disbursements & Payouts**: Cashfree/RazorpayX Gateway Records (Phase 10)
- **Portfolio & Loans**: `Loan` and `RepaymentScheduleItem` (Phase 5 / LMS)
- **Delinquency & DPD**: Authoritative DPD Engine (Phase 11)
- **Collections & Recovery**: Collection Cases, PTPs, and Recoveries (Phase 11)
- **General Ledger & Financials**: Double-entry GL Balances (Phase 10 & Phase 12)
- **Partners & Distribution**: Partner Master & Sourcing Attribution (Phase 8)
- **Customer Support & Grievances**: RBI Grievance Desk & Ticket Queue (Phase 13)

## 3. Data Isolation and Multi-Tenancy
All analytical queries pass through `buildSecurityScope()` which guarantees:
1. **Tenant Isolation**: Non-super admins are hard-filtered by `tenantId`.
2. **Branch Isolation**: Branch managers and local officers are filtered by `branchId`.
3. **Partner Isolation**: Distribution partners (DSAs/LSPs) can only inspect their own sourced accounts.
4. **Role Permission Enforcement**: Direct RBAC checks via `RolePermissionService`.
5. **PII Masking**: Customer contact information is masked on export for non-audit roles.
