# ADYAPAN LENDING OS — WORKSPACE & NAVIGATION ARCHITECTURE (P3)

**Document Version**: 3.0.0-PROD-NAV  
**Classification**: Enterprise Workspace, Navigation & Workflow-Gating Architecture  
**Phase**: Final Productization — P3  
**Status**: ACTIVE / VERIFIED  
**Author**: DeepMind Advanced Agentic Coding Pair  

---

## 1. Executive Summary

This specification establishes the authoritative **Workspace & Navigation Architecture** for **Adyapan Lending OS**, transforming the multi-route frontend into a clean, role-specific enterprise lending environment structured across **7 canonical business hubs** (plus dedicated borrower self-service):

```text
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                          7 CANONICAL BUSINESS HUBS                               │
 ├────────────────────────────┬─────────────────────────────────────────────────────┤
 │ 1. ORIGINATION             │ Front-Office Intake, KYC, Proposal Creation & Sourcing│
 │ 2. CREDIT & UNDERWRITING   │ Credit Appraisal, BRE, 6-Pillar Risk & Fraud Queues │
 │ 3. FINANCE & SERVICING     │ Active LMS, 10-Point Payout Gate, GL & Reconciliation│
 │ 4. COLLECTIONS & RECOVERY  │ Delinquency Tracking, DPD Buckets, PTP & Settlements │
 │ 5. PARTNER & EMBEDDED      │ Partner Sourcing, Commissions, API Keys & Webhooks   │
 │ 6. CUSTOMER & SUPPORT      │ Customer Directory, Ticket SLA, Omnichannel & DLT    │
 │ 7. PLATFORM & GOVERNANCE   │ Multi-Tenant Governance, RBAC, Workflows & Audit Log │
 ├────────────────────────────┼─────────────────────────────────────────────────────┤
 │ + BORROWER SELF-SERVICE    │ Mobile-First Customer Portal (/customer/*)          │
 └────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

1. **Strict RBAC & Canonical P2 Taxonomy**: Navigation visibility and route accessibility strictly enforce normalized `domain.action` permissions. Frontend visibility is not authorization; backend authorization remains authoritative.
2. **Workflow-Gated Navigation**: Stage gates reflect actual business eligibility. Upstream incomplete states lock downstream actions with clear explanations, required prerequisites, and next valid actions.
3. **Uncluttered, Focused Sidebars**: Rather than dumping 30+ items in a single sidebar, each business hub presents only relevant items (4–8 links) grouped logically.
4. **Zero-Trust Scope Isolation**: Scoping for tenants, branches, partners, and customers is strictly resolved from verified session tokens, preventing IDOR or parameter tampering.
5. **Separation of Duties (SoD)**: Maker cannot be Checker on loan sanction, payout release, or debt write-off. Auditors are strictly read-only across all operational workspaces.

---

## 3. Role → Workspace Access Matrix

| Role | Origination Hub | Credit & UW Hub | Finance Hub | Collections Hub | Partner Hub | Support Hub | Platform Hub | Borrower Portal |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`LOAN_OFFICER`** | **Primary** | — | — | — | — | **Accessible** | — | — |
| **`CREDIT_ANALYST`** | — | **Primary** | — | — | — | — | — | — |
| **`UNDERWRITER`** | — | **Primary** | — | — | — | — | — | — |
| **`BRANCH_MANAGER`** | **Primary** | **Accessible** | — | **Accessible** | **Accessible** | **Accessible** | — | — |
| **`FINANCE_OFFICER`** | — | — | **Primary** | — | — | — | — | — |
| **`COLLECTION_OFFICER`**| — | — | — | **Primary** | — | — | — | — |
| **`SUPPORT_OFFICER`** | — | — | — | — | — | **Primary** | — | — |
| **`TENANT_ADMIN`** | — | — | — | — | — | — | **Primary** | — |
| **`SUPER_ADMIN`** | **All Hubs** | **All Hubs** | **All Hubs** | **All Hubs** | **All Hubs** | **All Hubs** | **Primary** | — |
| **`AUDITOR`** | **Read-Only** | **Read-Only** | **Read-Only** | **Read-Only** | **Read-Only** | **Read-Only** | **Read-Only** | — |
| **`CUSTOMER`** | — | — | — | — | — | — | — | **Primary** |

---

## 4. Hub & Sidebar Navigation Inventory

### Hub 1: Origination & Front-Office (`ORIGINATION`)
* **Default Landing**: `/applications`
* **Primary Roles**: `LOAN_OFFICER`, `BRANCH_MANAGER`
* **Navigation Items**:
  * `dashboard` (`/dashboard`): Daily intake overview and proposal stage metrics.
  * `applications` (`/applications`): Loan origination intake and proposal status tracker.
  * `customers` (`/customers`): Customer profiles, Aadhaar XML verification, and PAN records.
  * `returned-applications` (`/returned-applications`): Proposals returned for data/document correction.
  * `documents` (`/documents`): Document uploads, OCR parsing, and bank statements.
  * `loan-products` (`/loan-products`): Active credit products and eligibility criteria.
  * `emi-calculator` (`/emi-calculator`): Instant loan quote and amortisation simulator.

### Hub 2: Credit & Underwriting (`CREDIT`)
* **Default Landing**: `/credit-assessment`
* **Primary Roles**: `CREDIT_ANALYST`, `UNDERWRITER`, `RISK_MANAGER`, `BRANCH_MANAGER`
* **Navigation Items**:
  * `credit-assessment` (`/credit-assessment`): Financial appraisal, FOIR/DTI computation, and bureau pull.
  * `underwriting` (`/underwriting`): Credit committee queue, sanctioning within limits, and KFS review.
  * `branch-review` (`/branch-review`): Branch Manager approvals within delegated authority (≤ ₹5,00,000).
  * `risk-queue` (`/risk/queue`): 6-pillar score triage and risk band grading.
  * `fraud-queue` (`/fraud/queue`): Real-time anomaly triage, syndicate warnings, and risk holds.
  * `fraud-cases` (`/fraud/cases`): Case investigation desk with notes and evidence.
  * `fraud-graph` (`/fraud/graph`): Interactive syndicate cluster network visualizer.
  * `credit-facilities` (`/credit-facilities`): Revolving credit limits and drawdown management.
  * `offers` (`/offers`): Sanction letters and customized APR offers.

### Hub 3: Finance & Servicing (`FINANCE`)
* **Default Landing**: `/disbursements`
* **Primary Roles**: `FINANCE_OFFICER`
* **Navigation Items**:
  * `loans` (`/loans`): Active loan accounts, payment schedules, and statement generation.
  * `disbursements` (`/disbursements`): 10-point pre-disbursement gatekeeper and IMPS/NEFT releases.
  * `payments` (`/payments`): Payments ledger with waterfall allocation.
  * `general-ledger` (`/general-ledger`): Double-entry Chart of Accounts, trial balance, and balance verification.
  * `reconciliation` (`/reconciliation`): Multi-pillar automated bank and gateway reconciliation.

### Hub 4: Collections & Recovery (`COLLECTIONS`)
* **Default Landing**: `/collections`
* **Primary Roles**: `COLLECTION_OFFICER`, `BRANCH_MANAGER`
* **Navigation Items**:
  * `collections` (`/collections`): Overdue portfolios, SMA-0/1/2 DPD aging buckets, and PTP desk.
  * `npa-monitoring` (`/npa-monitoring`): 90+ DPD Non-Performing Asset monitoring and provisioning.

### Hub 5: Partner & Embedded Lending (`PARTNER`)
* **Default Landing**: `/partners`
* **Primary Roles**: `BRANCH_MANAGER`, Partner/DSA Users
* **Navigation Items**:
  * `partners` (`/partners`): Partner directory, agreements, and commission structures.
  * `partner-portal` (`/partner`): Partner sourcing dashboard, API credentials, and webhooks.

### Hub 6: Customer & Support (`SUPPORT`)
* **Default Landing**: `/communications`
* **Primary Roles**: `BRANCH_MANAGER`, `LOAN_OFFICER`, `SUPPORT_OFFICER`
* **Navigation Items**:
  * `communications` (`/communications`): Omnichannel messaging, TRAI DLT templates, and quiet hours.
  * `support-sla` (`/support-sla`): Customer ticket queue, 30-day escalation hierarchy, and grievance desk.

### Hub 7: Platform & Governance (`PLATFORM`)
* **Default Landing**: `/command-center`
* **Primary Roles**: `SUPER_ADMIN`, `ADMIN`, `AUDITOR`
* **Navigation Items**:
  * `command-center` (`/command-center`): Executive AI telemetry and portfolio health.
  * `analytics` (`/analytics`): Risk intelligence and funnel metrics.
  * `reports` (`/reports`): Regulatory MIS and custom query builder.
  * `compliance` (`/compliance`): Regulatory compliance and DPDP consent audits.
  * `tenants` (`/tenants`): Multi-tenant lender directory and onboarding.
  * `branches` (`/branches`): Branch directory and geographic hierarchy.
  * `users` (`/users`): Staff provisioning and delegated authority limits.
  * `roles` (`/roles`): RBAC roles and normalized permissions.
  * `workflows` (`/workflows`): Workflow state machine and transition rules.
  * `bre-studio` (`/bre-studio`): Business Rule Engine policy and cutoff configuration.
  * `authority-matrix` (`/authority-matrix`): Tiered sanction authority thresholds.
  * `integrations` (`/integrations`): 12-domain deterministic sandbox gateway registry.
  * `branding` (`/branding`): Institution white-label branding and themes.
  * `audit-logs` (`/audit-logs`): Immutable cryptographic audit trail.
  * `settings` (`/settings`): Platform configuration studio.

### Borrower Self-Service (`BORROWER`)
* **Default Landing**: `/customer/dashboard`
* **Primary Roles**: `CUSTOMER`
* **Navigation Items**:
  * `/customer/dashboard`: Overview, credit line status, and quick drawdowns.
  * `/customer/apply`: Instant digital loan application.
  * `/customer/credit`: Credit line capacity and utilization.
  * `/customer/documents`: KYC documents and Aadhaar verification.
  * `/customer/loan`: Active loan statements and repayment schedules.
  * `/customer/payments`: Online UPI/Netbanking EMI repayment.
  * `/customer/support`: Help desk and grievance redressal.

---

## 5. Workflow-Gated Navigation & Locked-State Contract

When viewing an application, the system computes the exact stage-gate state and returns:

```text
CURRENT STATUS
  ↓
COMPLETED PREREQUISITES (Green Checkmarks)
  ↓
PENDING REQUIREMENTS (Amber Clocks + Required Conditions)
  ↓
WORKFLOW-LOCKED DOWNSTREAM ACTIONS (Lock Badges + Specific Reason)
  ↓
NEXT VALID ACTION CALL-TO-ACTION (CTA)
```

### Stage-Gate Lifecycle Rules

| Lifecycle Stage | Completed Prerequisites | Pending Requirement | Locked Actions | Next Valid Action |
| :--- | :--- | :--- | :--- | :--- |
| `KYC_PENDING` | Application Created | Aadhaar XML & PAN Match | Credit Appraisal, Sanction, Offer, Disbursement | Complete KYC Verification |
| `CREDIT_REVIEW_PENDING`| KYC Verified | Bank Statements & FOIR | Underwriting Sanction, Offer, Disbursement | Start Credit Assessment |
| `UNDERWRITING_PENDING` | Credit Appraisal Complete | Committee Approval | Offer Generation, Disbursement | Sanction Application |
| `OFFER_GENERATED` | Underwriting Sanctioned | Borrower KFS Review | eSign & Mandate, Disbursement | Review & Accept Offer |
| `ESIGN_MANDATE_PENDING`| Offer Accepted | Aadhaar eSign + e-NACH | Disbursement Payout | Setup eSign & Mandate |
| `DISBURSEMENT_READY` | 10-Point Gate Ready | Penny Drop & Dual Sign | None (All Prereqs Met) | Disburse via IMPS/NEFT |
| `ACTIVE` | Loan Disbursed | Repayment Schedule Active| Sourcing Actions | View Active Servicing |
| `DELINQUENT` | Overdue Installment | Overdue Settlement | New Sanctioning | Record PTP Follow-up |
| `CLOSED` | Balance === ₹0.00 | Formal NOC Issuance | Servicing | Download Signed NOC |

---

## 6. Route Guarding & Deep Link Protection

Every route in `frontend/src/app/(app)` is wrapped by `RouteGuard`, enforcing:
1. **Authenticated Session**: Missing session immediately redirects to `/login`.
2. **Permission Check**: Resolves `item.requiredPermission` or `item.requiredAnyPermissions` against user's authorized permission set.
3. **Role Scope**: Customer identities are strictly prevented from accessing internal staff routes.
4. **403 Boundary**: If access is restricted, renders an informative `403 Access Restricted` error card without crashing or leaking sensitive state.

---

## 7. Zero-Trust IDOR Scope Defense

Backend authorization enforces:
* **Tenant Scoping**: `tenantId` is always extracted from the verified JWT session token. Cross-tenant access is rejected with `403 [IDOR_BLOCKED]`.
* **Branch Scoping**: Branch-scoped roles (`BRANCH_MANAGER`, `LOAN_OFFICER`, `COLLECTION_OFFICER`) are constrained to their assigned `branchId`.
* **Customer Scoping**: Customer borrowers can only query and mutate records where `customerId === session.userId`.
* **Maker-Checker SoD**: Proposer user cannot approve own proposals. Payout initiator cannot release funds.

---
*End of Workspace & Navigation Architecture Specification (P3).*
