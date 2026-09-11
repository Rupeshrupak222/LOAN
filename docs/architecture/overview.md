# Adyapan Lending OS — Architecture Overview

## 1. Vision & Architectural Philosophy

The **Adyapan Lending OS** is an enterprise-grade, configurable, multi-tenant lending operating system inspired by leading financial infrastructure platforms such as M2P Fintech.

### Core Domain Hierarchy
Rather than coupling a user's login role directly to a monolithic portal, the architecture is structured hierarchically:

```text
TENANT (Multi-Tenant NBFC / Bank / Lender Institution)
  ↓
PRODUCT (Personal Loan, SME Business, BNPL Line, Mortgages, Education)
  ↓
CHANNEL (Direct Digital STP, Assisted Branch, Partner/LSP, Embedded API)
  ↓
WORKFLOW (Stage-Gate Origination, Underwriting Committee, Exception Review)
  ↓
WORKSPACE (Platform, Operations, Branch, Compliance, Borrower)
  ↓
ROLE (Super Admin, Branch Manager, Underwriter, Loan Officer, Auditor, etc.)
  ↓
PERMISSIONS (Granular domain.action e.g. underwriting.decide, disbursement.execute)
  ↓
FEATURE (Modular domain packages owning components, hooks, api & types)
  ↓
PAGE (App Router route view)
  ↓
COMPONENTS (Shared UI Atoms & Domain Feature Widgets)
  ↓
API (Backend REST Client with JWT, Correlation ID, and Auto-Refresh)
```

---

## 2. Key Architecture Pillars

1. **Workspace vs Role Separation**:
   - A **Role** defines *what actions a user can execute* (via Permissions).
   - A **Workspace** defines *the functional operational context* where a user works (`OPERATIONS`, `PLATFORM`, `BRANCH`, `COMPLIANCE`, `BORROWER`).
   - A multi-role user seamlessly accesses features across their permitted workspaces without artificial role-switching or truncated sidebars.

2. **Centralized Permission & Navigation Model**:
   - Navigation is declared once in `src/lib/navigation/navigation.config.ts`.
   - Dynamic evaluation resolves permitted items for any user based on `src/lib/permissions/role-permissions.ts`.
   - All navigation items, topbar search, and route guards consume the exact same permission taxonomy (`domain.action`).

3. **Feature-First Modularity**:
   - Business domain logic is grouped under `src/features/<domain>/` rather than scattered inside generic view files.
   - Core features include `applications`, `customers`, `credit`, `underwriting`, `disbursements`, `loans`, `payments`, `collections`, `finance`, `bre`, `compliance`, `platform`, and `borrower`.

4. **Multi-Tenancy & Branch Isolation**:
   - Every tenant data query is scoped by `tenantId`.
   - Branch staff operations are scoped by `branchId`.
   - SuperAdmin possesses platform-wide governance permissions with tenant-switching context.

5. **Configurable Product Engine & Workflow Foundation (Phase 1)**:
   - Extensible product lifecycle (`DRAFT` → `ACTIVE` → `INACTIVE` → `ARCHIVED`) with activation guard validation.
   - Comprehensive configuration domains: Amount bounds, Tenure schedules, Interest models, Fee structures with 18% GST, Eligibility rules, Document checklists, and Credit/Risk policies.
   - Immutable product versioning with origination snapshot preservation.

6. **Deterministic Decision Engine & Business Rules Engine (Phase 2)**:
   - Evaluates applications through normalized, tenant-aware `DecisionContext`.
   - Generic rule evaluation matrix covering 7 policy categories (`ELIGIBILITY`, `CREDIT`, `FINANCIAL`, `BANKING`, `KYC_DOCS`, `FRAUD_RISK`, `PRODUCT_POLICY`).
   - Decimal-safe financial calculations (`Decimal.js`) for FOIR, DTI, Disposable Income, Reducing Balance EMI, and multi-dimensional maximum eligible amount.
   - Credit score risk grading (`A` through `E`) and weighted risk scoring ($0 \dots 100$).
   - Immutable decision snapshots, policy versioning (`v1` $\to$ `v2`), controlled re-evaluation history, and audited manual overrides.
   - Seamless workflow state transitions and real-time frontend Decision Center Studio.
7. **Configurable Approval Authority Matrix & Governance (Phase 3)**:
   - Configuration-driven authority resolution replacing legacy hardcoded business logic.
   - Dynamic evaluation across loan amount bounds (`Decimal.js`), credit risk grades (`A`–`E`), BRE decision outcomes (`APPROVE`, `APPROVE_WITH_CONDITIONS`, `REFER`, `REJECT`), and branch/tenant scopes.
   - Configurable multi-level sequential approval hierarchies (e.g. Branch Manager $\to$ Senior Underwriter $\to$ Credit Head).
   - Strict Segregation of Duties (SoD) & Four-Eyes principle preventing self-approval, originator sanction, and maker-checker collision.
   - Time-bounded and scoped temporary authority delegation with full audit tracing.
   - Approval SLA tracking, proactive auto-escalation, and immutable approval snapshots.
   - Stage-gated disbursement locks preventing loan release until all mandatory approval tiers are satisfied.
   - For detailed specifications, see [Approval Authority Architecture](file:///f:/LOAN/docs/architecture/approval-authority.md), [Authority Matrix Specification](file:///f:/LOAN/docs/architecture/authority-matrix.md), [Approval Workflow](file:///f:/LOAN/docs/architecture/approval-workflow.md), [Approval SoD](file:///f:/LOAN/docs/architecture/approval-sod.md), and [Approval Delegation](file:///f:/LOAN/docs/architecture/approval-delegation.md).
8. **Configurable Offer Engine & Lifecycle Governance (Phase 4)**:
   - Automated conversion of approved credit decisions into precise, versioned, and compliant loan offers.
   - Authoritative amount resolution ensuring final offered amount never exceeds the lowest authoritative cap (`requested`, `breEligible`, `approvedAmount`, `productMax`).
   - Risk-graded pricing policy engine applying credit grade spreads and fee overrides.
   - Transparent fee deductions and statutory 18% GST calculation with penny accuracy (`Decimal.js`).
   - Mathematically consistent RBI Key Fact Statement (KFS) terms and statutory Annual Percentage Rate (APR).
   - Immutable offer snapshots (`v1` $\to$ `v2`), time-bound validity windows (48h), customer review/acceptance journey, and workflow gating.
   - For detailed specifications, see [Offer Engine Architecture](file:///f:/LOAN/docs/architecture/offer-engine.md), [Offer Lifecycle](file:///f:/LOAN/docs/architecture/offer-lifecycle.md), [Pricing Policy](file:///f:/LOAN/docs/architecture/pricing-policy.md), [Offer Versioning](file:///f:/LOAN/docs/architecture/offer-versioning.md), and [Offer Workflow](file:///f:/LOAN/docs/architecture/offer-workflow.md).
