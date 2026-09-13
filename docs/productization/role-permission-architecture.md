# ADYAPAN LENDING OS — ROLE & PERMISSION ARCHITECTURE (P2)

**Classification**: Enterprise Authorization, RBAC & Segregation of Duties (SoD) Specification  
**Phase**: Final Productization — P2  
**Status**: ACTIVE / HARDENED  
**Version**: 2.0.0  

---

## 1. Executive Summary

This document specifies the authoritative **Role, Permission, and Scoping Architecture** for **Adyapan Lending OS**. The model follows strict banking governance principles:
1. **Default Deny**: No action is permitted unless explicitly granted via an authoritative permission.
2. **Normalized Taxonomy**: All permissions are standardized under canonical `domain.action` identifiers (with transparent bidirectional legacy aliasing).
3. **Server-Derived Scoping**: Resource scoping (`tenantId`, `branchId`, `customerId`, `partnerId`) is strictly derived from the verified cryptographic session token, preventing IDOR and parameter tampering.
4. **Banking Segregation of Duties (SoD)**: Enforces dual-control maker-checker invariants across all credit, financial, accounting, and risk mutations.
5. **Role Consolidation**: Streamlines access into 8 canonical operational role families with distinct responsibilities and authority bounds.

---

## 2. The 8 Canonical Operational Role Families

```text
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                         8 CANONICAL OPERATIONAL ROLES                            │
 ├────────────────────────────┬─────────────────────────────────────────────────────┤
 │ 1. LOAN_OFFICER            │ Front-Office Origination, KYC Intake & Submission   │
 │ 2. CREDIT_ANALYST          │ Middle-Office Credit Appraisal, FOIR & Bureau Eval  │
 │ 3. UNDERWRITER             │ Credit Sanctioning within Delegated Limit Authority │
 │ 4. BRANCH_MANAGER          │ Decentralized Branch Approvals (≤ ₹5,00,000 limit)  │
 │ 5. FINANCE_OFFICER         │ Treasury, Payouts, Repayments, Recon, Double-Entry  │
 │ 6. COLLECTION_OFFICER      │ Delinquency Queues, DPD Buckets, PTPs, Recovery Ops │
 │ 7. SUPPORT_OFFICER         │ Customer Operations, Tickets, Grievances, SLA Hub   │
 │ 8. TENANT_ADMIN / ADMIN    │ Institutional Setup, Users, Policies, Integrations │
 ├────────────────────────────┼─────────────────────────────────────────────────────┤
 │ + SUPER_ADMIN              │ Multi-Tenant SaaS Platform Governance               │
 │ + AUDITOR                  │ Read-Only Regulatory & Compliance Inspection        │
 │ + BORROWER (CUSTOMER)      │ External Self-Service Identity (Self-Scoped Only)   │
 │ + RISK_MANAGER             │ Enterprise Risk Governance & Audited Overrides      │
 └────────────────────────────┴─────────────────────────────────────────────────────┘
```

### Role Mapping & Authority Matrix

| Canonical Role | Primary Operational Purpose | Max Sanction Authority | Max Payout Authority | Scope Level |
| :--- | :--- | :--- | :--- | :--- |
| **`LOAN_OFFICER`** | Sourcing, KYC collection, proposal submission | ₹0 (Maker only) | ₹0 | `BRANCH` |
| **`CREDIT_ANALYST`** | Financial appraisal, DTI/FOIR calculation, score prep | ₹0 (Assessor only) | ₹0 | `TENANT` |
| **`UNDERWRITER`** | Credit sanction, condition setting, policy exceptions | ₹10,00,000 (Tiered) | ₹0 | `TENANT` |
| **`BRANCH_MANAGER`** | Local branch supervision, first-level approval | ₹5,00,000 | ₹0 | `BRANCH` |
| **`FINANCE_OFFICER`** | Payout execution, payment recording, GL posting | ₹0 | ₹5,00,00,000 | `TENANT` |
| **`COLLECTION_OFFICER`**| Overdue monitoring, PTP tracking, recovery proposals | ₹0 | ₹0 | `BRANCH` |
| **`SUPPORT_OFFICER`** | Customer service, ticket resolution, grievance tracking| ₹0 | ₹0 | `TENANT` |
| **`TENANT_ADMIN`** | Staff user provisioning, policy and product setup | ₹0 (Non-operational) | ₹0 | `TENANT` |
| **`SUPER_ADMIN`** | SaaS platform administration, tenant provisioning | Unlimited | Unlimited | `GLOBAL` |
| **`AUDITOR`** | Read-only regulatory compliance inspection | ₹0 (Read-only) | ₹0 | `TENANT` |
| **`BORROWER`** | Customer self-service, instant loan requests | N/A | N/A | `CUSTOMER` |

---

## 3. Normalized Permission Taxonomy (`domain.action`)

All permissions are structured under canonical `domain.action` dot-notation:

```text
 ┌───────────────────────┬────────────────────────────────────────────────────────┐
 │ DOMAIN                │ CANONICAL PERMISSION ACTIONS                           │
 ├───────────────────────┼────────────────────────────────────────────────────────┤
 │ customer              │ .view, .create, .edit, .delete, .kyc                  │
 │ application           │ .view, .create, .edit, .submit, .review, .approve      │
 │ credit                │ .view, .assess, .recommend, .bank_intelligence         │
 │ underwriting          │ .view, .decide, .condition, .override, .kfs_generate  │
 │ approval              │ .view, .approve, .reject, .send_back, .escalate        │
 │ offer                 │ .view, .generate, .edit, .accept, .decline, .simulate  │
 │ credit_limit          │ .view, .create, .evaluate, .approve, .increase         │
 │ disbursement          │ .view, .verify, .execute, .penny_drop, .reconcile      │
 │ payout                │ .view, .create, .initiate, .approve, .cancel, .retry   │
 │ loan                  │ .view, .manage, .restructure, .settle, .close, .noc    │
 │ payment               │ .view, .create, .record, .verify, .confirm, .refund    │
 │ collection            │ .view, .manage, .contact, .create_ptp, .settle         │
 │ accounting            │ .view, .journal.create, .journal.approve, .coa.manage  │
 │ bre                   │ .view, .edit, .simulate                                │
 │ risk                  │ .view, .view_signals, .evaluate, .manage_policies      │
 │ fraud                 │ .view_cases, .investigate, .manage_rules, .override   │
 │ support               │ .ticket.view, .ticket.create, .ticket.resolve          │
 │ communications        │ .view, .send, .template.manage, .policy.manage         │
 │ analytics             │ .view, .portfolio, .credit, .risk, .command_center     │
 │ tenant / user / role  │ .view, .create, .edit, .manage, .assign                │
 │ audit / compliance    │ .view, .export, .verify, .privacy.manage               │
 └───────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 4. Server-Derived Scope & Zero-Trust IDOR Model

Authorization enforces that resource scopes are always resolved server-side:

```text
       INCOMING REQUEST
              │
              ▼
   [JWT Authentication]
              │
              ▼
   [resolveAuthorizedScope(user)]
   ├── Tenant Scope   : user.tenantId (Rejects cross-tenant spoofing)
   ├── Branch Scope   : user.branchId (Enforces branch isolation for branch roles)
   ├── Customer Scope : user.id       (Enforces customer ownership on borrower APIs)
   └── Partner Scope  : partner.id    (Isolates partner DSA origination)
              │
              ▼
   [rolePermissionService.hasPermission(user, permission, options)]
              │
              ▼
   [assertMakerCheckerSeparation(makerId, checkerId, action)]
              │
              ▼
   [WORKFLOW & BUSINESS LOGIC EXECUTION]
```

---

## 5. Segregation of Duties (SoD) Matrix

| Rule Code | Maker Permission | Checker Permission | Severity | Enforced Invariant |
| :--- | :--- | :--- | :--- | :--- |
| `SOD_MAKER_CHECKER_PAYOUT` | `payout.create` | `payout.approve` | **CRITICAL_BLOCK** | Maker cannot authorize own payout batch |
| `SOD_SANCTION_DISBURSER` | `underwriting.decide` | `disbursement.execute` | **CRITICAL_BLOCK** | Underwriter cannot directly release funds |
| `SOD_SETTLEMENT_DUAL` | `collection.settle` | `collection.settle.approve` | **CRITICAL_BLOCK** | Collector cannot self-approve debt waiver |
| `SOD_WRITEOFF_DUAL` | `collection.writeoff` | `collection.writeoff.approve`| **CRITICAL_BLOCK** | Proposer cannot authorize bad debt write-off |
| `SOD_JOURNAL_DUAL` | `accounting.journal.create` | `accounting.journal.approve`| **CRITICAL_BLOCK** | Journal maker cannot self-approve GL entries |
| `SOD_AUDITOR_MUTATE` | `audit.view` | Any state-changing mutation | **CRITICAL_BLOCK** | Auditor is strictly read-only |
| `SOD_BORROWER_INTERNAL` | Customer Identity | Staff internal domains | **CRITICAL_BLOCK** | Borrower cannot access internal credit/ops |

---

## 6. Migration & Backward Compatibility Notes

* **Transparent Aliasing**: The backend `RolePermissionService` dynamically evaluates both canonical `domain.action` keys and legacy uppercase permission codes bidirectionally through `PERMISSION_ALIAS_MAP`.
* **Zero Breaking Changes**: Existing controllers calling `requirePermission('APPLICATIONS_CREATE')` or `requirePermission('application.create')` evaluate accurately with zero modifications required.
