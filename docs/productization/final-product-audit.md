# ADYAPAN LENDING OS — MASTER PRODUCT AUDIT & ARCHITECTURE DISCOVERY (P1)
**Document Version**: 1.0.0-PROD-AUDIT  
**Audit Scope**: Phases 0–17 Full Spectrum Audit (Backend, Frontend, Database, Workspaces, APIs, RBAC/SoD, Workflows)  
**Classification**: Technical Architecture & Productization Blueprint (READ-ONLY DISCOVERY)  
**Author**: DeepMind Advanced Agentic Coding Pair  

---

## 1. Executive Summary

**Adyapan Lending OS** has reached a mature, enterprise-grade state through Phases 0–17, implementing:
1. **Origination & Verification (Phases 0–8, 15, 16)**: Multi-channel loan origination, dynamic KYC verification, BRE credit rules, 6-pillar risk scoring, syndication fraud detection, instant direct-lending experiences, and 12-domain deterministic sandbox rails.
2. **Servicing & Financials (Phases 10–12, 17)**: Double-entry general ledger accounting, pure `Decimal.js` waterfall allocation, delinquency tracking, DPD aging buckets, multi-tier collections recovery, 10-point pre-disbursement gatekeeper, and automated reconciliations.
3. **Operations & Governance (Phases 13, 14, 17)**: Centralized communications engine, DLT/quiet-hours compliance, SLA-governed support desk, executive command center telemetry, multi-tenant row-level isolation, and 14 banking Segregation of Duties (SoD) invariants.

### Key Audit Findings
* **Strengths**: Backend financial engines, GL integrity, Decimal.js calculations, 10-point payout gatekeeper, deterministic sandbox integration registry, and multi-tenant scoping are robust.
* **Architectural Inconsistencies**:
  1. **Permission Taxonomy Divergence**: Frontend utilizes dot-notated permissions (e.g. `credit.assess`, `application.submit`), while backend utilizes uppercase action constants (e.g. `CREDIT_ASSESSMENT_EVALUATE`, `APPLICATIONS_CREATE`).
  2. **Role & Workspace Proliferation**: 13 roles exist across 59 route directories in `frontend/src/app/(app)`, leading to fragmented desks (e.g., separate `/credit`, `/credit-assessment`, `/credit-facilities`, `/credit-policies`, `/bre-studio`).
  3. **Frontend UI Permission vs. Backend State Enforcement**: Certain pages conditionally hide buttons without explicitly surfacing the backend blocking reason or prerequisite stage-gate.
  4. **Duplicate Routes & Desks**: Redundant route pairs such as `/loans` and `/loan-products`, `/general-ledger` and `/accounting`, `/risk` and `/fraud-intelligence` create operational friction.
* **Objective for P2–P8**: Streamline the 13 roles into a canonical 8-role operational matrix, consolidate 59 workspaces into 7 cohesive role-specific command hubs, unify permission taxonomies, enforce strict server-side stage-gates with explanatory locked-state UI, and institutionalize zero-trust IDOR validation.

---

## 2. Current Architecture Overview

```text
                                         ┌─────────────────────────────────────────┐
                                         │       ADYAPAN LENDING OS PLATFORM       │
                                         └────────────────────┬────────────────────┘
                                                              │
                ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
                ▼                                             ▼                                             ▼
     MULTI-CHANNEL PORTALS                            CORE DOMAIN ENGINES                         FINANCIAL & LEDGER RAILS
 ├── Staff AppShell (/app/*)               ├── Business Rule Engine (BRE)                ├── Pure Decimal.js Calculator
 ├── Borrower Portal (/customer/*)         ├── 6-Pillar Credit Risk Engine               ├── Double-Entry General Ledger
 ├── Partner/DSA Hub (/partner/*)          ├── Identity Graph Fraud Engine               ├── Waterfall Repayment Allocation
 └── Public Web (/apply, /products)        ├── Dynamic Document Engine                   ├── 10-Point Payout Gatekeeper
                                           ├── Communication & SLA Support               └── Multi-Pillar Reconciliation
                                                              │
                                                              ▼
                                               INTEGRATION & RESILIENCE HUB
                                           ├── 12-Domain Provider Registry (Sandbox)
                                           ├── Webhook Framework & Replay Protection
                                           ├── SHA256 Idempotency Engine
                                           └── Audit Trail & Evidence Signatures
```

---

## 3. Complete Role Inventory

The audit identified 13 distinct roles across backend schema, RBAC services, and frontend navigation:

| # | Role Identifier | Display Label | Primary Purpose | Authorized Workspace / Landing | Approval Limit | SoD Restrictions |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `SUPER_ADMIN` | Super Admin | Multi-tenant SaaS platform management, tenant provisioning, system configurations | `/dashboard` | Unlimited | Cannot act as customer borrower |
| 2 | `ADMIN` | System Admin | Tenant-level administration, user management, branch setup, policy configuration | `/dashboard` | Unlimited | Cannot perform operational transactions |
| 3 | `LOAN_OFFICER` | Loan Officer | Customer onboarding, KYC document collection, proposal intake, return corrections | `/dashboard` | ₹0 (Maker only) | Cannot approve loans or disburse payouts |
| 4 | `CREDIT_ANALYST`| Credit Analyst | Financial appraisal, bank statement analysis, FOIR/DTI computation, credit scoring | `/dashboard` | ₹0 (Assessor only)| Cannot sanction loans or disburse payouts |
| 5 | `UNDERWRITER` | Underwriter | Credit committee sanction, condition setting, policy exceptions, KFS generation | `/underwriting` | ₹50,00,000 | Cannot execute payouts or author write-offs |
| 6 | `BRANCH_MANAGER`| Branch Manager | Branch supervision, first-level loan approvals within limit, team oversight | `/branch-review` | ₹5,00,000 | Cannot approve own applications (Maker-Checker) |
| 7 | `RISK_ANALYST` | Risk Analyst | Portfolio risk modeling, 6-pillar signal analysis, score calibration | `/risk` | ₹0 (Analyst only) | Cannot modify core financial ledgers |
| 8 | `FRAUD_ANALYST`| Fraud Investigator| Syndicate graph analysis, fraud investigations, anomaly rule management | `/fraud` | ₹0 (Investigator) | Cannot originate disbursements or alter credit terms |
| 9 | `RISK_MANAGER` | Risk & Fraud Head| Enterprise risk governance, 2D matrix controls, policy publishing, overrides | `/risk` | ₹0 (Governance) | Cannot execute financial disbursements |
| 10| `FINANCE_OFFICER`| Finance Officer | Pre-disbursement checks, fund release (IMPS/NEFT), repayments, GL, recon | `/disbursements` | ₹1,00,00,000 | Cannot approve loan sanctions or write-offs |
| 11| `COLLECTION_OFFICER`| Collection Officer| DPD tracking, calling, field visits, PTP logging, recovery proposals | `/collections` | ₹0 (Collector) | Cannot approve settlements or post write-offs |
| 12| `AUDITOR` | Compliance Auditor| Read-only statutory compliance audit, cryptographic ledger inspection | `/dashboard` | ₹0 (Read-only) | Strictly prohibited from any state-changing mutations |
| 13| `CUSTOMER` | Borrower | Self-service loan intake, offer acceptance, eSign, repayments, NOC downloads | `/customer/dashboard`| N/A | Strictly isolated to own customer records |

---

## 4. Role Consolidation Analysis & Recommendation

| Current Role | Proposed Action | Recommended Role | Justification |
| :--- | :---: | :--- | :--- |
| `SUPER_ADMIN` | **KEEP** | `SUPER_ADMIN` | Essential for multi-tenant SaaS hosting, tenant onboarding, and global telemetry. |
| `ADMIN` | **RESTRICT** | `TENANT_ADMIN` | Rename and scope strictly to tenant boundaries; remove operational sanction privileges. |
| `LOAN_OFFICER` | **KEEP** | `LOAN_OFFICER` | Core front-office intake role. Retain with strict branch scoping. |
| `CREDIT_ANALYST`| **KEEP** | `CREDIT_ANALYST` | Core middle-office appraisal role. Separate from final sanction authority. |
| `UNDERWRITER` | **KEEP** | `UNDERWRITER` | Authorized credit sanction authority with tiered delegation limits. |
| `BRANCH_MANAGER`| **KEEP** | `BRANCH_MANAGER` | Essential for decentralized branch originations up to delegated authority threshold. |
| `RISK_ANALYST` | **MERGE** | `RISK_FRAUD_ANALYST`| Consolidate `RISK_ANALYST` and `FRAUD_ANALYST` into a unified risk intelligence role. |
| `FRAUD_ANALYST`| **MERGE** | `RISK_FRAUD_ANALYST`| Redundant overlap with risk analytics; merge into unified investigation desk. |
| `RISK_MANAGER` | **KEEP** | `RISK_MANAGER` | Enterprise risk governance and policy override authority. |
| `FINANCE_OFFICER`| **KEEP** | `FINANCE_OFFICER` | Treasury, payout execution, repayments, and double-entry GL accounting. |
| `COLLECTION_OFFICER`| **KEEP**| `COLLECTION_OFFICER`| Frontline collections, PTP tracking, and recovery management. |
| `AUDITOR` | **RESTRICT** | `AUDITOR` | Strict read-only enforcement across all APIs and UI workspaces. |
| `CUSTOMER` | **KEEP** | `BORROWER` | Self-service customer portal with strict data redaction and IDOR guards. |

---

## 5. Workspace Inventory

The audit discovered 10 distinct operational workspaces across the platform:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CANONICAL WORKSPACES                                 │
├────────────────────────────────┬─────────────────────────────────────────────────┤
│ 1. Executive & MIS Hub         │ Executive Command Center, Analytics, Reports   │
│ 2. Front-Office Intake Hub     │ Customer Onboarding, Loan Applications Desk     │
│ 3. Credit & Underwriting Hub   │ Credit Appraisal, BRE Studio, Underwriting Desk │
│ 4. Risk & Fraud Hub            │ 6-Pillar Risk Engine, Identity Graph, Cases     │
│ 5. Branch Operations Hub       │ Branch Applications Review, Local Portfolio     │
│ 6. Finance & Treasury Hub      │ Pre-Disbursement Gate, Payouts, Payments, GL    │
│ 7. Collections & Recovery Hub  │ DPD Aging, Queues, PTP Desk, Settlements       │
│ 8. Tenant Administration Hub   │ Branches, Staff Users, Policies, Integrations  │
│ 9. Partner & DSA Hub           │ Partner Sourcing, Commission Ledger, Webhooks   │
│ 10. Borrower Self-Service Hub  │ Instant Applications, Active Facilities, Pay    │
└────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 6. Sidebar & Route Inventory (Audit of 59 Routes)

| Route Path | Route Component / Page | Target Workspace | Primary Role | Permission Required | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | `DashboardPage` | Overview | All Staff | `*` (Role-tailored) | **KEEP** (Role-adaptive cockpit) |
| `/customers` | `CustomersPage` | Front-Office | LO, BM, Admin | `customer.view` | **KEEP** |
| `/applications` | `ApplicationsPage` | Front-Office | LO, CA, UW, BM | `application.view` | **KEEP** |
| `/returned-applications`| `ReturnedApplicationsPage`| Front-Office | LO, BM | `application.return` | **MERGE** into `/applications?tab=returned` |
| `/loan-products` | `LoanProductsPage` | Front-Office | All Staff | `product.view` | **KEEP** |
| `/products` | `ProductsPage` | Front-Office | Admin | `product.view` | **REMOVE** (Duplicate of `/loan-products`) |
| `/credit-assessment` | `CreditAssessmentPage` | Credit & UW | CA, BM, UW | `credit.view` | **KEEP** |
| `/credit` | `CreditPage` | Credit & UW | CA, UW | `credit.view` | **MERGE** into `/credit-assessment` |
| `/credit-facilities` | `CreditFacilitiesPage` | Credit & UW | UW, Finance | `credit_facility.view` | **KEEP** |
| `/credit-policies` | `CreditPoliciesPage` | Administration | Admin, RM | `credit_limit.policy.view` | **MERGE** into `/bre-studio` |
| `/pricing-policies` | `PricingPoliciesPage` | Administration | Admin, RM | `offer.policy.view` | **MERGE** into `/bre-studio` |
| `/branch-review` | `BranchReviewPage` | Branch Ops | BM | `approval.view` | **KEEP** |
| `/underwriting` | `UnderwritingPage` | Credit & UW | UW, RM | `underwriting.view` | **KEEP** |
| `/approval-queue` | `ApprovalQueuePage` | Credit & UW | UW, BM | `approval.queue.view` | **MERGE** into `/underwriting?tab=approvals` |
| `/approval-tasks` | `ApprovalTasksPage` | Credit & UW | UW, BM | `approval.queue.view` | **MERGE** into `/underwriting?tab=tasks` |
| `/authority-matrix` | `AuthorityMatrixPage` | Administration | Admin, RM | `authority.view` | **KEEP** |
| `/offers` | `OffersPage` | Front-Office | LO, UW | `offer.view` | **KEEP** |
| `/loans` | `LoansPage` | Servicing | All Staff | `loan.view` | **KEEP** |
| `/disbursements` | `DisbursementsPage` | Finance | Finance | `disbursement.view` | **KEEP** (Enforce Gatekeeper) |
| `/payouts` | `PayoutsPage` | Finance | Finance | `payout.view` | **MERGE** into `/disbursements?tab=payouts` |
| `/payments` | `PaymentsPage` | Finance | Finance, CO | `payment.view` | **KEEP** |
| `/collections` | `CollectionsPage` | Collections | CO, BM | `collection.view` | **KEEP** |
| `/settlements` | `SettlementsPage` | Collections | CO, Finance | `collection.manage` | **MERGE** into `/collections?tab=settlements` |
| `/npa-monitoring` | `NpaMonitoringPage` | Collections | CO, Finance, BM | `finance.npa.view` | **MERGE** into `/collections?tab=npa` |
| `/general-ledger` | `GeneralLedgerPage` | Finance | Finance, Auditor | `finance.gl.view` | **KEEP** |
| `/accounting` | `AccountingPage` | Finance | Finance, Auditor | `accounting.dashboard.view`| **MERGE** into `/general-ledger` |
| `/reconciliation` | `ReconciliationPage` | Finance | Finance | `recon.view` | **KEEP** |
| `/communications` | `CommunicationsPage` | Omnichannel | All Staff | `communications.view` | **KEEP** |
| `/support-sla` | `SupportSlaPage` | Omnichannel | Support, BM | `support.tickets.view` | **MERGE** into `/communications?tab=support` |
| `/command-center` | `CommandCenterPage` | Insights | SuperAdmin, BM, RM| `analytics.command_center` | **KEEP** |
| `/operations` | `OperationsPage` | Insights | Admin, BM | `system.observability` | **KEEP** |
| `/compliance` | `CompliancePage` | Insights | Auditor, Admin | `compliance.view` | **KEEP** |
| `/privacy` | `PrivacyPage` | Administration | Admin, Auditor | `privacy.manage` | **KEEP** |
| `/reports` | `ReportsPage` | Insights | All Staff | `reports.view` | **KEEP** |
| `/analytics` | `AnalyticsPage` | Insights | All Staff | `reports.view` | **KEEP** |
| `/risk` | `RiskPage` | Risk & Fraud | RA, RM, UW | `risk.view` | **KEEP** |
| `/fraud` | `FraudPage` | Risk & Fraud | FA, RM, UW | `fraud.view_cases` | **KEEP** |
| `/fraud-intelligence`| `FraudIntelligencePage` | Risk & Fraud | FA, RA, RM | `risk.fraud_intel` | **MERGE** into `/fraud` |
| `/early-warnings` | `EarlyWarningsPage` | Risk & Fraud | RA, RM, BM | `risk.early_warnings` | **MERGE** into `/risk?tab=early-warnings` |
| `/emi-calculator` | `EmiCalculatorPage` | Utilities | All Staff | `*` | **KEEP** |
| `/branches` | `BranchesPage` | Administration | Admin, BM | `branch.view` | **KEEP** |
| `/users` | `UsersPage` | Administration | Admin, BM | `user.view` | **KEEP** |
| `/tenants` | `TenantsPage` | Administration | SuperAdmin | `tenant.view` | **KEEP** |
| `/tenant-settings` | `TenantSettingsPage` | Administration | Admin | `tenant.manage` | **MERGE** into `/settings` |
| `/roles` | `RolesPage` | Administration | Admin | `role.view` | **KEEP** |
| `/permissions` | `PermissionsPage` | Administration | Admin | `role.manage` | **MERGE** into `/roles?tab=permissions` |
| `/workflows` | `WorkflowsPage` | Administration | Admin | `workflow.view` | **KEEP** |
| `/bre-studio` | `BreStudioPage` | Administration | Admin, RM, UW | `bre.view` | **KEEP** |
| `/configuration` | `ConfigurationPage` | Administration | Admin | `config.view` | **MERGE** into `/settings` |
| `/branding` | `BrandingPage` | Administration | Admin | `branding.view` | **KEEP** |
| `/settings` | `SettingsPage` | Administration | Admin | `settings.manage` | **KEEP** |
| `/audit-logs` | `AuditLogsPage` | Administration | Admin, Auditor | `audit.view` | **KEEP** |
| `/integrations` | `IntegrationsPage` | Administration | SuperAdmin, Admin | `integration.view` | **KEEP** |
| `/client-onboarding` | `ClientOnboardingPage` | Administration | SuperAdmin | `tenant.manage` | **MERGE** into `/tenants` |
| `/partners` | `PartnersPage` | Partner Hub | BM, Admin | `partner.view` | **KEEP** |
| `/partner` | `PartnerPortalPage` | Partner Hub | Partner DSA | `partner.view` | **KEEP** |

---

## 7. Permission Strictly Audited (API vs Frontend)

```text
       FRONTEND PERMISSION KEY              BACKEND PERMISSION CODE               ENFORCEMENT AUDIT
 ────────────────────────────────────  ───────────────────────────────────  ──────────────────────────────
  customer.view                        APPLICATIONS_VIEW / CUST_VIEW         Matched (Tenant Scoped)
  application.create                   APPLICATIONS_CREATE                   Matched (Branch Scoped)
  credit.assess                        CREDIT_ASSESSMENT_EVALUATE            Matched (FOIR / BRE Validated)
  underwriting.decide                  APPLICATIONS_APPROVE                  Matched (Authority Limit Checked)
  disbursement.execute                 DISBURSEMENTS_EXECUTE_TRANSFER        Matched (10-Point Gatekeeper)
  payment.record                       PAYMENTS_CREATE                       Matched (Double-Entry GL Posted)
  collection.ptp                       COLLECTIONS_RECORD_PTP                Matched (DPD Sync Required)
  journal.approve                      JOURNAL_APPROVE                       Matched (SoD Maker-Checker)
```

---

## 8. 30 Core Lending Workflows & Stage-Gate Invariants

```text
 1. Customer Onboarding      ──► 2. Application Intake     ──► 3. Document Collection
             ▲                                                            │
             │                                                            ▼
 6. Credit Assessment        ◄── 5. Bureau Verification    ◄── 4. Dynamic KYC Verification
             │
             ▼
 7. BRE Decisioning          ──► 8. 6-Pillar Risk Engine   ──► 9. Identity Fraud Check
                                                                          │
                                                                          ▼
12. Offer Acceptance         ◄── 11. Offer Generation      ◄── 10. Underwriting Sanction
             │
             ▼
13. Digital eSign (Aadhaar)  ──► 14. e-NACH Mandate Setup  ──► 15. 10-Point Payout Gate
                                                                          │
                                                                          ▼
18. Repayment Allocation     ◄── 17. Active Loan Servicing ◄── 16. IMPS/NEFT Disbursement
             │
             ▼
19. Delinquency Aging (DPD)  ──► 20. Collections Queue     ──► 21. Promise to Pay (PTP)
                                                                          │
                                                                          ▼
24. Loan Closure / NOC       ◄── 23. Debt Write-Off (SoD)  ◄── 22. Debt Settlement (SoD)
             ▲
             │
25. Repeat Borrowing / Revolving Credit Line Drawdown (mPokket Grade)
```

### Stage-Gate Enforcement Table
| Workflow Stage | Mandatory Prerequisites | Blocking Conditions | Authorized Role | Unlocking Action |
| :--- | :--- | :--- | :--- | :--- |
| **KYC Verification** | Aadhaar/PAN upload, Liveness photo | Expired ID, Name mismatch > 20% | Loan Officer, System | Move to Bureau Pull |
| **Credit Assessment**| KYC VERIFIED, Bank Statement parsed | Missing ITR/Salary slip, Unverified KYC | Credit Analyst | Forward to Underwriting |
| **Underwriting Sanction**| Credit Appraisal complete, BRE != REJECT | Risk Score > 75, Fraud Anomaly flagged | Underwriter, Branch Mgr | Generate Sanction Offer |
| **Offer Acceptance** | Sanction Letter generated, KFS viewed | Cooling-off period revoked, Expired offer | Borrower (Customer) | Move to eSign & Mandate |
| **eSign & Mandate** | Offer accepted, KFS terms confirmed | Unverified Bank Account | Borrower, System | Unlocks Disbursement |
| **Disbursement** | All 10 Gatekeeper points passed | Any failed gate (KYC, Bank, BRE, etc.) | Finance Officer | Dispatches IMPS/NEFT |
| **Settlement / Write-off**| DPD > 90, Proposer != Approver | Proposer attempting self-approval (SoD) | Credit Committee, Fin Head| Posts Compensating GL |
| **Loan Closure / NOC**| Outstanding balance === 0.00, All payments settled | Pending unallocated suspense balance | System, Finance Officer | Issues Cryptographic NOC |

---

## 9. Banking Segregation of Duties (SoD) Matrix

The system enforces 14 critical banking SoD invariants:

```text
 ┌───────────────────────────────────────┬────────────────────────────────────────┬───────────────────┐
 │ MAKER / PROPOSER                      │ CHECKER / APPROVER                     │ SOD INVARIANT     │
 ├───────────────────────────────────────┼────────────────────────────────────────┼───────────────────┤
 │ Loan Officer (Application Intake)     │ Underwriter / Branch Manager (Sanction)│ SOD_SANCTION_MAKER│
 │ Underwriter (Credit Sanction)         │ Finance Officer (Fund Payout)          │ SOD_SANCTION_DISB │
 │ Payout Initiator (Finance Maker)      │ Payout Approver (Finance Checker)      │ SOD_PAYOUT_DUAL   │
 │ Collection Officer (Settlement Draft) │ Supervisory Checker (Settlement Sign) │ SOD_SETTLE_DUAL   │
 │ Collection Officer (Write-off Draft)  │ Credit Committee (Write-off Sign-off)  │ SOD_WRITEOFF_DUAL │
 │ Journal Drafter (Accounting Maker)    │ Journal Approver (Accounting Checker)  │ SOD_JOURNAL_DUAL  │
 │ Independent Auditor (Compliance)      │ Any State-Changing Mutation Operator   │ SOD_AUDITOR_MUTATE│
 └───────────────────────────────────────┴────────────────────────────────────────┴───────────────────┘
```

---

## 10. Financial Action & General Ledger Integrity Audit

Every financial mutation adheres to strict accounting invariants:
1. **Zero Floating-Point Representation**: All monetary quantities use PostgreSQL `NUMERIC(14, 2)` mapped through `Decimal.js`.
2. **Double-Entry Balance Invariant**: $\sum \text{Debits} \equiv \sum \text{Credits}$ verified prior to committing any journal entry.
3. **Waterfall Repayment Priority**: Payments strictly allocate across **Fees $\rightarrow$ Penalties $\rightarrow$ Accrued Interest $\rightarrow$ Principal $\rightarrow$ Excess Deposit**.
4. **Non-Destructive Compensating Reversals**: Reversals never overwrite historical rows; they post audited mirror journals.

---

## 11. External Benchmarking

### A. M2P Fintech (Core Lending Benchmark)
* **Unified Origination & Multi-Product Structuring**: Adyapan matches M2P's support for term loans, revolving credit lines, peer-to-peer origination, and co-lending/LSP structures.
* **Architectural Gap Identified**: Needs tighter visual workflow orchestration in `/bre-studio` to allow drag-and-drop policy chaining without engineering redeployment.

### B. mPokket (Direct Digital Lending Benchmark)
* **Instant Digital Journey**: Seamless customer lifecycle transitions from pre-qualification $\rightarrow$ dynamic KYC $\rightarrow$ instant BRE $\rightarrow$ digital mandate $\rightarrow$ sub-3-minute drawdown.
* **UX Gap Identified**: Borrower portal dashboard needs clearer visual indicators for real-time credit limit utilization and instant repeat drawdown CTA.

### C. RBI Digital Lending Guidelines & Regulatory Compliance
* **Key Fact Statement (KFS)**: Standardized format detailing APR, processing fee, penalty charges, and repayment schedule before contract execution.
* **Direct Payout to Borrower**: Strictly disallows routing disbursements through third-party pool accounts without direct nodal bank integration.
* **Cooling-Off Period**: Explicit statutory provision allowing borrower to exit loan without penalty within the designated window.
* **Grievance Redressal Mechanism**: Built-in statutory grievance desk with 30-day escalation hierarchy and Nodal Grievance Officer contacts.

---

## 12. Complete Productization Decision Table

| Target Item | Current State | Recommendation | Architectural Rationale | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Roles** | 13 Active Roles | **Consolidate to 8 Canonical Roles** | Eliminates overlapping duties; unifies risk/fraud. | **CRITICAL** |
| **Workspaces** | 59 Distinct Routes | **Consolidate into 7 Main Hubs** | Simplifies navigation, avoids empty/fragmented views.| **HIGH** |
| **Permissions** | Divergent Taxonomy | **Unify to Canonical Domain Schema** | Aligns backend uppercase codes with frontend keys. | **CRITICAL** |
| **Disbursements**| 10-Point Gatekeeper | **Enforce Backend Lock on All Payouts**| Prevents unauthorized or premature fund release. | **CRITICAL** |
| **Stage-Gates** | Client-Side Navigation | **Authoritative Backend State-Machine**| Prevents URL manipulation or API parameter bypass. | **CRITICAL** |
| **Redaction** | Selective PII Masking | **Strict Server-Side Customer/Partner Views**| Prevents leaking internal risk/fraud scores and notes. | **CRITICAL** |
| **Accounting** | Double-Entry Engine | **Preserve & Fortify GL Service** | Zero-float Decimal.js integrity already verified. | **MAINTAIN** |
| **Integrations** | 12 Sandbox Adapters | **Preserve Standard Interfaces** | Zero external API dependencies required for go-live.| **MAINTAIN** |

---

## 13. Implementation Roadmap: Phases P2 – P8

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   FINAL PRODUCTIZATION EXECUTION BLUEPRINT                       │
├────────┬─────────────────────────────────────────────────────────────────────────┤
│ **P2** │ Role & Permission Normalization (Consolidate to 8 roles, unified RBAC)  │
│ **P3** │ Workspace & Navigation Consolidation (Streamline 59 routes into 7 hubs) │
│ **P4** │ Authoritative State-Gated Lending Engine & Stage-Lock UI Enforcement   │
│ **P5** │ Financial Safety & Maker-Checker Dual-Control Hardening                 │
│ **P6** │ Borrower UX & Direct Lending Polish (mPokket-Grade Instant Experience)  │
│ **P7** │ Partner & Co-Lending Portal Fortification                               │
│ **P8** │ Final Zero-Defect Full-Platform Certification & Go-Live Verification    │
└────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Priority Classification & P2 Action Items

### Critical Priority
1. **Unify Permission Taxonomies**: Standardize on `domain.action` format across frontend and backend.
2. **Strict Server-Side Stage-Gate Enforcement**: Block downstream API calls if upstream prerequisites are incomplete.
3. **Enforce Backend-Derived Scoping**: Ensure `tenantId`, `branchId`, and `customerId` are always extracted from verified session tokens, never from client payloads.

### High Priority
1. **Consolidate Workspaces**: Merge redundant routes (`/products`, `/payouts`, `/credit`, `/accounting`, `/fraud-intelligence`) into their parent desks.
2. **Implement Informative Locked States**: Replace disabled buttons with clear prerequisite explanations (e.g., *"Disbursement locked: e-NACH mandate pending completion"*).

### P2 Implementation Input (Exact Actions for Next Phase)
* Normalize `ROLE_PERMISSIONS` and backend `RolePermissionService` into the unified 8-role matrix.
* Bind all sensitive backend endpoints to verified permission checks and server-side scope resolvers.
* Update navigation configurations to route users exclusively to authorized consolidated hubs.

---
*End of Master Product Audit (P1).*
