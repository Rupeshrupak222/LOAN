# System Admin Complete Audit

**Adyapan Loan Management System (LMS)**  
**Audit Scope:** Complete Role, Permission, Sidebar, Page, Button, API, Middleware, Controller, Service, Database & Security Inspection  
**Audit Date:** September 8, 2026  
**Auditor Mode:** Read-Only Audit & Forensic Codebase Inspection (Zero Modifications)  

---

## 1. Executive Summary

A comprehensive, end-to-end security and role-permission audit of the **System Admin (`ADMIN` / `COMPANY_ADMIN`)** role was conducted across the entire Adyapan Loan Management System (LMS) codebase (Frontend Next.js App Router, Backend Express/TypeScript, Prisma ORM, PostgreSQL schema, and dynamic RBAC modules).

### Key Audit Findings:
1. **False Sense of Security via Frontend UI Concealment (Critical Masking)**:
   The frontend navigation configuration (`ROLE_CONFIG.ADMIN.nav` in [`frontend/src/lib/roles.ts`](file:///f:/LOAN/frontend/src/lib/roles.ts#L143-L172)) hides operational menus such as *Customers, Loan Applications, Credit Assessment Desk (Underwriting), Disbursements, Payments, Collections, and Loans*. However, **the backend API layer explicitly authorizes `ADMIN` across almost all of these sensitive financial and credit endpoints**.
2. **Direct URL & API Bypass (Severe SoD Violation)**:
   A user logged in as System Admin can directly type `/underwriting`, `/disbursements`, `/payments`, `/collections`, `/customers`, or `/loans` in the browser or issue REST API requests with their JWT. The frontend renders the pages without route blocking, and backend APIs process the operations successfully.
3. **Breach of Banking Segregation of Duties (SoD)**:
   System Admin possesses effective authority to:
   - Perform **final credit sanction / underwriting approvals and rejections** ([`underwriting.service.ts`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.service.ts#L60-L125)).
   - Trigger **live loan disbursements / payout execution** ([`disbursement.service.ts`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85-L150)).
   - Post **manual repayments and verify/reject borrower payment submissions** ([`payment.routes.ts`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L61-L152)).
   - Authorize **One-Time Settlements (OTS) debt write-offs, loan restructuring, and closure NOC issuance** ([`restructuring.routes.ts`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L21-L67)).
   - Directly **propose and approve ledger adjustments** in reconciliation ([`reconciliation.service.ts`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.service.ts#L454-L485)).
   - Force **borrower KYC verification status** ([`customer.routes.ts`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L197-L204)).
4. **Privilege Escalation Vector in Custom Role Creation**:
   System Admin can create custom roles via `POST /api/v1/roles`. While the Segregation of Duties engine detects conflicts, the API accepts `allowSodOverride: true` ([`role-permission.service.ts`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L453-L458)) without requiring dual Super Admin authorization, enabling an Admin to create an omnipotent custom role combining maker and checker permissions.
5. **Global System Settings Pollution**:
   The `SystemSetting` entity is globally scoped in PostgreSQL without `tenantId`. A System Admin from Tenant A invoking `PUT /api/v1/settings/:key` updates institution-wide rules (such as `payment_allocation_order` and `approval_limits`) affecting all tenants on the multi-tenant instance.
6. **Production Readiness Verdict**: **NOT PRODUCTION READY**. System Admin currently violates banking regulatory standards (RBI Master Directions on Information Technology Governance, Cybersecurity, and Segregation of Duties).

---

## 2. Role Identity

| Property | Value / Current Implementation | Evidence / Source |
| :--- | :--- | :--- |
| **Role Code** | `ADMIN` / `COMPANY_ADMIN` | [`backend/src/modules/roles/role-permission.service.ts:152,174`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L152-L174) |
| **Frontend Display Name** | `System Admin` | [`frontend/src/lib/roles.ts:144`](file:///f:/LOAN/frontend/src/lib/roles.ts#L144) |
| **Backend Display Name** | `Institutional Administrator` / `Company / Institution Administrator` | [`backend/src/modules/roles/role-permission.service.ts:153,175`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L153-L175) |
| **Frontend Role Name** | `ADMIN` | [`frontend/src/lib/roles.ts:6`](file:///f:/LOAN/frontend/src/lib/roles.ts#L6) |
| **Role Aliases** | `ADMIN` & `COMPANY_ADMIN` are cross-mapped in `seed.ts` to share the same user assignment | [`database/prisma/seed.ts:199-212`](file:///f:/LOAN/database/prisma/seed.ts#L199-L212) |
| **Default Landing Page** | `/dashboard` | [`frontend/src/lib/roles.ts:170`](file:///f:/LOAN/frontend/src/lib/roles.ts#L170) |
| **Default Seed User** | `admin@adyapan.dev` (Employee ID: `EMP002`, Branch: `HO`, Tenant: `tenant-adyapan-default`) | [`database/prisma/seed.ts:219`](file:///f:/LOAN/database/prisma/seed.ts#L219) |
| **Tenant Scope** | `TENANT` (Bounded to authenticated institution in `tenantContext`) | [`backend/src/middleware/tenant-context.ts:18-40`](file:///f:/LOAN/backend/src/middleware/tenant-context.ts#L18-L40) |
| **Branch Scope** | `GLOBAL` within own Tenant (All branches across own institution) | [`backend/src/modules/users/user.service.ts:19-26`](file:///f:/LOAN/backend/src/modules/users/user.service.ts#L19-L26) |
| **Resource Scope** | `TENANT` | [`backend/src/modules/roles/permission.types.ts:52`](file:///f:/LOAN/backend/src/modules/roles/permission.types.ts#L52) |
| **Formal Sanction Limit** | ₹5,00,00,000 (₹5 Crore in Role Template); Uncapped in `underwriting.service.ts` | [`role-permission.service.ts:170`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L170), [`underwriting.service.ts:116`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.service.ts#L116) |
| **Formal Payout Limit** | ₹5,00,00,000 (₹5 Crore in Role Template); Uncapped in `disbursement.service.ts` | [`role-permission.service.ts:171`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L171), [`disbursement.service.ts:142`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L142) |
| **Formal Settlement Limit** | Unspecified / Uncapped | [`backend/src/modules/restructuring/restructuring.routes.ts:39`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L39) |
| **System Role Flag** | `isSystemRole: true` (Protected from in-memory deletion) | [`backend/src/modules/roles/role-permission.service.ts:355`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L355) |
| **Relationship to SUPER_ADMIN** | Subordinate. Cannot provision `SUPER_ADMIN` accounts, cannot create/suspend tenants, cannot alter platform-level Super Admin role. | [`backend/src/modules/users/user.service.ts:88-90`](file:///f:/LOAN/backend/src/modules/users/user.service.ts#L88-L90), [`backend/src/modules/tenants/tenant.routes.ts:146`](file:///f:/LOAN/backend/src/modules/tenants/tenant.routes.ts#L146) |
| **Relationship to Other Roles** | Superior over all branch and operational staff (`BRANCH_MANAGER`, `UNDERWRITER`, `FINANCE_OFFICER`, `LOAN_OFFICER`, `COLLECTION_OFFICER`, `AUDITOR`). | [`backend/src/modules/users/user.service.ts:83`](file:///f:/LOAN/backend/src/modules/users/user.service.ts#L83) |

---

## 3. Intended Responsibilities vs Current Actual Access

| Functional Area | Intended Authority | Current Actual Status | Classification | Evidence / Finding |
| :--- | :--- | :--- | :--- | :--- |
| **Staff Users** | Create, view, update, deactivate staff | Create & List supported; Edit/Deactivate missing | **PARTIALLY ALLOWED** | [`user.routes.ts:15-55`](file:///f:/LOAN/backend/src/modules/users/user.routes.ts#L15-L55) |
| **User Provisioning** | Provision staff accounts for institution | Full creation of all roles except `SUPER_ADMIN` | **ALLOWED** | [`user.service.ts:70-136`](file:///f:/LOAN/backend/src/modules/users/user.service.ts#L70-L136) |
| **User Status Management** | Activate / Deactivate / Lock staff | No endpoints exist in API | **NOT ALLOWED** | Missing API in `user.routes.ts` |
| **Password Reset** | Administrative password reset | No administrative reset endpoint exists | **NOT ALLOWED** | Missing API in `user.routes.ts` |
| **Roles & Permissions** | Manage custom roles within tenant | Create, list, update custom roles | **ALLOWED** | [`role.routes.ts:88-135`](file:///f:/LOAN/backend/src/modules/roles/role.routes.ts#L88-L135) |
| **Branches** | Create and configure branches | Full CRUD on tenant branches | **ALLOWED** | [`branch.routes.ts:16-75`](file:///f:/LOAN/backend/src/modules/branches/branch.routes.ts#L16-L75) |
| **Loan Products** | Create, version, and manage products | Full CRUD and version increments | **ALLOWED** | [`product.routes.ts:63-163`](file:///f:/LOAN/backend/src/modules/product/product.routes.ts#L63-L163) |
| **Policies & Configuration** | Draft, publish, rollback policy versions | Full policy lifecycle management | **ALLOWED** | [`configuration.routes.ts:19-175`](file:///f:/LOAN/backend/src/modules/configuration/configuration.routes.ts#L19-L175) |
| **Workflows** | Configure state machine & approval stages | Full stage & gate authoring | **ALLOWED** | [`workflow.routes.ts:68-102`](file:///f:/LOAN/backend/src/modules/workflows/workflow.routes.ts#L68-L102) |
| **System Settings** | Manage system parameters | Global modification across all tenants | **UNEXPECTEDLY ALLOWED** | [`settings.routes.ts:33`](file:///f:/LOAN/backend/src/modules/settings/settings.routes.ts#L33) (Cross-tenant leak) |
| **Integrations** | Configure gateways and credentials | Full CRUD on encrypted tenant routings | **ALLOWED** | [`tenant-integrations.routes.ts:64`](file:///f:/LOAN/backend/src/modules/integrations/tenant-integrations.routes.ts#L64) |
| **Branding & White-Label** | Configure tenant logo, colors, domains | Full branding customization for own tenant | **ALLOWED** | [`branding.routes.ts:54`](file:///f:/LOAN/backend/src/modules/branding/branding.routes.ts#L54) |
| **Audit Logs** | View, search, export, verify hash chain | Read-only inspection & chain verification | **ALLOWED** | [`audit.routes.ts:15-108`](file:///f:/LOAN/backend/src/modules/audit/audit.routes.ts#L15-L108) |
| **Compliance & Privacy** | View consent registry, privacy templates | Full overview and purpose template editing | **ALLOWED** | [`consent.routes.ts:20,56`](file:///f:/LOAN/backend/src/modules/privacy/consent.routes.ts#L20-L56) |
| **Reports & Analytics** | Executive portfolio analytics & CSV export | Full tenant-scoped analytics & export | **ALLOWED** | [`report.routes.ts:14-65`](file:///f:/LOAN/backend/src/modules/reports/report.routes.ts#L14-L65) |
| **Operations & Observability** | Centralized exception and health monitoring | Full observability and metrics inspection | **ALLOWED** | [`observability.routes.ts:14`](file:///f:/LOAN/backend/src/modules/observability/observability.routes.ts#L14) |
| **Tenant Lifecycle** | View own institution details only | Can read multi-tenant overview; cannot mutate | **PARTIALLY ALLOWED** | [`tenant.routes.ts:20,36`](file:///f:/LOAN/backend/src/modules/tenants/tenant.routes.ts#L20-L36) |
| **Customer Data Mutation** | NO operational customer modification | Can create, patch, delete, verify KYC | **UNEXPECTEDLY ALLOWED** | [`customer.routes.ts:178-237`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L178-L237) |
| **Loan Applications** | Read-only governance | Can originate and force status transitions | **UNEXPECTEDLY ALLOWED** | [`application.routes.ts:58,75`](file:///f:/LOAN/backend/src/modules/application/application.routes.ts#L58-L75) |
| **Underwriting Sanctions** | NO direct credit decisions | Can approve, reject, send back any proposal | **UNEXPECTEDLY ALLOWED** | [`underwriting.routes.ts:29`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L29) |
| **Disbursement Execution** | NO direct fund release | Can execute live fund disbursement | **UNEXPECTEDLY ALLOWED** | [`disbursement.routes.ts:43`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.routes.ts#L43) |
| **Repayment & Payments** | Read-only ledger audit | Can record payments and verify submissions | **UNEXPECTEDLY ALLOWED** | [`payment.routes.ts:63,134`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L63-L134) |
| **Collections & PTP** | Read-only portfolio monitoring | Can log field activities and record PTPs | **UNEXPECTEDLY ALLOWED** | [`collection.routes.ts:64,74`](file:///f:/LOAN/backend/src/modules/collections/collection.routes.ts#L64-L74) |
| **Reconciliation Adjustment** | Read-only exception monitoring | Can propose AND approve ledger adjustments | **UNEXPECTEDLY ALLOWED** | [`reconciliation.routes.ts:85,115`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.routes.ts#L85-L115) |
| **Restructuring & Settlement** | NO debt compromise authority | Can restructure loans and execute OTS write-offs | **UNEXPECTEDLY ALLOWED** | [`restructuring.routes.ts:23,39`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L23-L39) |
| **Loan Closure & NOC** | NO operational closure authority | Can close loan accounts and issue statutory NOCs | **UNEXPECTEDLY ALLOWED** | [`restructuring.routes.ts:55`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L55) |
| **AI / Copilot** | Advisory assistance | Conversational guidance, zero write tools | **ALLOWED** | [`copilot.service.ts:41`](file:///f:/LOAN/backend/src/modules/ai/copilot.service.ts#L41) |

---

## 4. Complete Permission Inventory

Inspection of the catalog ([`permission.types.ts`](file:///f:/LOAN/backend/src/modules/roles/permission.types.ts#L12-L50)), role template assignment ([`role-permission.service.ts:177-190`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L177-L190)), and route authorization guards ([`authorize(...)`]):

| Permission Code | Formally Assigned to `ADMIN`? | Expected for Admin? | Actually Enforced on Route? | Risk Level | Evidence / Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `APPLICATIONS_CREATE` | ❌ No | ❌ No | ⚠️ Bypassed by `authorize('ADMIN')` | **HIGH** | [`application.routes.ts:58`](file:///f:/LOAN/backend/src/modules/application/application.routes.ts#L58) |
| `APPLICATIONS_VIEW` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:178`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L178) |
| `APPLICATIONS_ASSIGN` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:179`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L179) |
| `APPLICATIONS_REVIEW` | ❌ No | ⚠️ Read-only | ⚠️ Bypassed by role check | **MEDIUM** | [`underwriting.routes.ts:15`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L15) |
| `APPLICATIONS_APPROVE` | ❌ No | ❌ No | 🚨 Bypassed by `authorize('ADMIN')` | **CRITICAL** | [`underwriting.routes.ts:29`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L29) |
| `APPLICATIONS_REJECT` | ❌ No | ❌ No | 🚨 Bypassed by `authorize('ADMIN')` | **CRITICAL** | [`underwriting.routes.ts:29`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L29) |
| `UNDERWRITING_VIEW_BUREAU` | ❌ No | ⚠️ Read-only | ⚠️ Accessible via AI routes | **MEDIUM** | [`ai.routes.ts:109`](file:///f:/LOAN/backend/src/modules/ai/ai.routes.ts#L109) |
| `UNDERWRITING_RUN_AI_ASSIST` | ❌ No | ✅ Yes | ✅ Accessible | **LOW** | [`ai.routes.ts:127`](file:///f:/LOAN/backend/src/modules/ai/ai.routes.ts#L127) |
| `UNDERWRITING_APPROVE_EXCEPTION`| ❌ No | ❌ No | 🚨 Bypassed in decision endpoint | **CRITICAL** | [`underwriting.service.ts:60`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.service.ts#L60) |
| `UNDERWRITING_COMMITTEE_VOTE` | ❌ No | ❌ No | ⚠️ Bypassed in decision endpoint | **HIGH** | [`underwriting.service.ts:60`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.service.ts#L60) |
| `DISBURSEMENTS_INITIATE_PAYOUT` | ❌ No | ❌ No | 🚨 Bypassed by `authorize('ADMIN')` | **CRITICAL** | [`disbursement.routes.ts:43`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.routes.ts#L43) |
| `DISBURSEMENTS_APPROVE_MAKER_CHECKER`| ❌ No | ❌ No | 🚨 Bypassed in service payout logic| **CRITICAL** | [`disbursement.service.ts:85`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85) |
| `DISBURSEMENTS_EXECUTE_TRANSFER`| ❌ No | ❌ No | 🚨 Bypassed by `authorize('ADMIN')` | **CRITICAL** | [`disbursement.routes.ts:43`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.routes.ts#L43) |
| `DISBURSEMENTS_RECONCILE` | ❌ No | ⚠️ Read-only | ⚠️ Full write access to adjustments| **HIGH** | [`reconciliation.routes.ts:17`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.routes.ts#L17) |
| `COLLECTIONS_VIEW_DPD` | ❌ No | ✅ Yes | ✅ Accessible via reports/cases | **LOW** | [`collection.routes.ts:43`](file:///f:/LOAN/backend/src/modules/collections/collection.routes.ts#L43) |
| `COLLECTIONS_RECORD_PTP` | ❌ No | ❌ No | ⚠️ Bypassed by `authorize('ADMIN')` | **MEDIUM** | [`collection.routes.ts:74`](file:///f:/LOAN/backend/src/modules/collections/collection.routes.ts#L74) |
| `COLLECTIONS_INITIATE_RECOVERY` | ❌ No | ❌ No | ⚠️ Bypassed by `authorize('ADMIN')` | **MEDIUM** | [`collection.routes.ts:64`](file:///f:/LOAN/backend/src/modules/collections/collection.routes.ts#L64) |
| `COLLECTIONS_WAIVE_PENALTY` | ❌ No | ❌ No | 🚨 Bypassed in restructuring routes| **CRITICAL** | [`restructuring.routes.ts:23`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L23) |
| `COLLECTIONS_SETTLE_LOAN` | ❌ No | ❌ No | 🚨 Bypassed by `authorize('ADMIN')` | **CRITICAL** | [`restructuring.routes.ts:39`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L39) |
| `CONFIGURATION_VIEW_POLICIES` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:180`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L180) |
| `CONFIGURATION_DRAFT_POLICY` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:181`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L181) |
| `CONFIGURATION_PUBLISH_POLICY` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:182`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L182) |
| `CONFIGURATION_CONFIGURE_INTEGRATIONS`| ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:183`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L183) |
| `PRIVACY_VIEW_CONSENT_REGISTRY` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:184`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L184) |
| `AUDIT_EXPORT_EVIDENCE_PACKAGE` | ❌ No | ✅ Yes | ✅ Accessible via audit routes | **LOW** | [`audit.routes.ts:15`](file:///f:/LOAN/backend/src/modules/audit/audit.routes.ts#L15) |
| `AUDIT_VERIFY_CHAIN` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:185`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L185) |
| `PRIVACY_PURGE_PII` | ❌ No | ❌ No | ❌ Blocked (Super Admin only) | **LOW** | [`privacy.service.ts:312`](file:///f:/LOAN/backend/src/modules/privacy/privacy.service.ts#L312) |
| `TENANT_MANAGE_USERS` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:186`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L186) |
| `TENANT_ASSIGN_ROLES` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:187`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L187) |
| `TENANT_VIEW_OPERATIONS_CENTER` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:188`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L188) |
| `TENANT_CONFIGURE_BRANDING` | ✅ Yes | ✅ Yes | ✅ Enforced | **LOW** | [`role-permission.service.ts:189`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L189) |

---

## 5. Sidebar Audit

The current sidebar for System Admin is constructed from `ROLE_CONFIG.ADMIN.nav` in [`frontend/src/lib/roles.ts`](file:///f:/LOAN/frontend/src/lib/roles.ts#L143-L172).

### Current Active Sidebar Items (22 Items):

| # | Sidebar Label | Route | Page Component | Purpose | Backend Authorization | Should Admin Have It? | Verdict | Risk |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Dashboard** | `/dashboard` | `dashboard/page.tsx` | Portfolio KPIs & Admin Hub | Authenticated | Yes | **KEEP** | Low |
| 2 | **Staff Users** | `/users` | `users/page.tsx` | Employee onboarding & RBAC | `SUPER_ADMIN`, `ADMIN`, `BRANCH_MANAGER` | Yes | **KEEP** | Low |
| 3 | **Branch Directory** | `/branches` | `branches/page.tsx` | Institutional branch directory | `SUPER_ADMIN`, `ADMIN`, `BRANCH_MANAGER` | Yes | **KEEP** | Low |
| 4 | **Roles & Permissions**| `/roles` | `roles/page.tsx` | Custom roles & SoD matrix | `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Medium |
| 5 | **Workflow Studio** | `/workflows` | `workflows/page.tsx` | Lifecycle state machine authoring | `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Low |
| 6 | **Loan Products** | `/loan-products` | `loan-products/page.tsx` | Product catalog & interest pricing| `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Low |
| 7 | **Partners & DSAs** | `/partners` | `partners/page.tsx` | DSA partner network management | `SUPER_ADMIN`, `ADMIN` | Yes (Governance only) | **READ-ONLY** | High (Payout mutation) |
| 8 | **Policy Configuration**| `/configuration` | `configuration/page.tsx`| Underwriting parameters & FOIR | `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Low |
| 9 | **Branding & White-Label**| `/branding` | `branding/page.tsx` | Logo, brand colors, portal URL | `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Low |
| 10| **System Settings** | `/settings` | `settings/page.tsx` | Core business thresholds | `SUPER_ADMIN`, `ADMIN` | Yes (Tenant-scoped) | **KEEP (Fix Scope)** | High (Global DB) |
| 11| **Audit Logs** | `/audit-logs` | `audit-logs/page.tsx` | Immutable SHA-256 event trail | `SUPER_ADMIN`, `ADMIN`, `AUDITOR` | Yes | **KEEP** | Low |
| 12| **Integration Hub** | `/integrations` | `integrations/page.tsx` | Payment/bureau API gateway keys| `SUPER_ADMIN`, `ADMIN` | Yes | **KEEP** | Low |
| 13| **Reports & Analytics** | `/reports` | `reports/page.tsx` | Portfolio performance & CSVs | All staff roles | Yes | **KEEP** | Low |
| 14| **Accounting & Recon** | `/reconciliation`| `reconciliation/page.tsx`| Ledger reconciliations & exceptions| `SUPER_ADMIN`, `ADMIN`, `FINANCE_OFFICER`| Read-Only Only | **READ-ONLY** | Critical (Adjustment approval) |
| 15| **Omnichannel Hub** | `/communications`| `communications/page.tsx`| Email/SMS templates & dispatch | All staff roles | Yes | **KEEP** | Low |
| 16| **AI Command Center** | `/command-center` | `command-center/page.tsx`| Institutional AI decision desk | All staff roles | Yes | **KEEP** | Low |
| 17| **Operations & Observability**| `/operations`| `operations/page.tsx` | Health monitoring & exception queue| All staff roles | Yes | **KEEP** | Low |
| 18| **Regulatory & Compliance**| `/compliance` | `compliance/page.tsx` | Statutory RBI audits & logs | `SUPER_ADMIN`, `ADMIN`, `AUDITOR` | Yes | **KEEP** | Low |
| 19| **Privacy & Consent** | `/privacy` | `privacy/page.tsx` | DPDP consent registry & templates| `SUPER_ADMIN`, `ADMIN`, `AUDITOR` | Yes | **KEEP** | Low |
| 20| **Fraud & Anomaly** | `/fraud-intelligence`| `fraud-intelligence/page.tsx`| Deduplication & syndicate alerts | All staff roles | Yes | **KEEP** | Low |
| 21| **Early Warning Center**| `/early-warnings`| `early-warnings/page.tsx`| SMA-0/1/2 delinquency warnings | All staff roles | Yes | **KEEP** | Low |
| 22| **EMI Calculator** | `/emi-calculator` | `emi-calculator/page.tsx`| Amortization schedule simulator | All staff roles | Yes | **KEEP** | Low |

---

## 6. Direct URL Access Audit

The following table documents what happens when a System Admin directly enters URLs that are **not** in their sidebar:

| Direct URL Route | Sidebar Visible? | Expected Frontend Access | Actual Frontend Access | Backend API Authorization | Actual Effective Result | Security Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/customers` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `GET /customers` | System Admin views all customer PII | **HIGH** |
| `/customers/new` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `POST /customers` | System Admin creates borrowers | **HIGH** |
| `/customers/:id` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `PATCH /customers/:id` & `PATCH /kyc` | System Admin modifies profiles & approves KYC | **CRITICAL** |
| `/applications` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `GET /applications` | System Admin views all loan applications | **MEDIUM** |
| `/underwriting` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `POST /underwriting/:id/decision` | System Admin sanctions/rejects loans | **CRITICAL** |
| `/disbursements` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `POST /disbursements/execute` | System Admin executes bank fund transfers | **CRITICAL** |
| `/payments` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `POST /payments` & `/verify` | System Admin posts & verifies payments | **CRITICAL** |
| `/collections` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `POST /collections/activities` & `/ptp`| System Admin records field notes & PTPs | **MEDIUM** |
| `/loans` | ❌ Hidden | 🚫 Block / Redirect | ✅ Fully Accessible | `authorize('ADMIN', ...)` on `GET /loans` | System Admin inspects all loan accounts | **LOW** |
| `/tenants` | ❌ Hidden | 🚫 Block / Redirect | ⚠️ Loads overview; mutations 403 | `authorize('SUPER_ADMIN')` on `POST /tenants` | Read overview works; Onboarding fails with 403 | **LOW** |

---

## 7. Complete API Route Audit (System Admin Accessible)

| Method | Endpoint | Backend Controller / Route File | Granular Permission | Effective DB Scope | Financial Mutation? | Intended Authority | Actual Status | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | [`user.routes.ts:18`](file:///f:/LOAN/backend/src/modules/users/user.routes.ts#L18) | `TENANT_MANAGE_USERS` | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `POST` | `/api/v1/users` | [`user.routes.ts:33`](file:///f:/LOAN/backend/src/modules/users/user.routes.ts#L33) | `TENANT_MANAGE_USERS` | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `GET` | `/api/v1/roles` | [`role.routes.ts:88`](file:///f:/LOAN/backend/src/modules/roles/role.routes.ts#L88) | `TENANT_ASSIGN_ROLES` | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `POST` | `/api/v1/roles` | [`role.routes.ts:106`](file:///f:/LOAN/backend/src/modules/roles/role.routes.ts#L106) | `TENANT_ASSIGN_ROLES` | `tenantId = actor.tenantId` | No | Allowed | Supported | High (SoD Override) |
| `PUT` | `/api/v1/roles/:id`| [`role.routes.ts:123`](file:///f:/LOAN/backend/src/modules/roles/role.routes.ts#L123) | `TENANT_ASSIGN_ROLES` | `tenantId = actor.tenantId` | No | Allowed | Supported | High |
| `GET` | `/api/v1/branches` | [`branch.routes.ts:16`](file:///f:/LOAN/backend/src/modules/branches/branch.routes.ts#L16) | None (Role check) | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `POST` | `/api/v1/branches` | [`branch.routes.ts:41`](file:///f:/LOAN/backend/src/modules/branches/branch.routes.ts#L41) | None (Role check) | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `PATCH`| `/api/v1/branches/:id`| [`branch.routes.ts:63`](file:///f:/LOAN/backend/src/modules/branches/branch.routes.ts#L63) | None (Role check) | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `GET` | `/api/v1/customers`| [`customer.routes.ts:35`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L35) | `APPLICATIONS_VIEW` | `tenantId = actor.tenantId` | No | Read-only | Supported | Low |
| `POST` | `/api/v1/customers`| [`customer.routes.ts:177`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L177) | None (Role check) | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | High |
| `PATCH`| `/api/v1/customers/:id`| [`customer.routes.ts:187`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L187)| None (Role check) | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | High |
| `PATCH`| `/api/v1/customers/:id/kyc`| [`customer.routes.ts:197`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L197)| None (Role check) | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `DELETE`| `/api/v1/customers/:id`| [`customer.routes.ts:236`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L236)| None (Role check) | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | High |
| `POST` | `/api/v1/applications`| [`application.routes.ts:57`](file:///f:/LOAN/backend/src/modules/application/application.routes.ts#L57)| `APPLICATIONS_CREATE` | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | High |
| `POST` | `/api/v1/applications/:id/transition`| [`application.routes.ts:74`](file:///f:/LOAN/backend/src/modules/application/application.routes.ts#L74)| None (Role check) | `tenantId = actor.tenantId` | No | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `GET` | `/api/v1/underwriting/queue`| [`underwriting.routes.ts:14`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L14)| `APPLICATIONS_VIEW` | `tenantId = actor.tenantId` | No | Read-only | Supported | Low |
| `POST` | `/api/v1/underwriting/:id/decision`| [`underwriting.routes.ts:28`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.routes.ts#L28)| `APPLICATIONS_APPROVE`| `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `GET` | `/api/v1/disbursements/queue`| [`disbursement.routes.ts:14`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.routes.ts#L14)| None (Role check) | `tenantId = actor.tenantId` | No | Read-only | Supported | Low |
| `POST` | `/api/v1/disbursements/execute`| [`disbursement.routes.ts:42`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.routes.ts#L42)| `DISBURSEMENTS_EXECUTE_TRANSFER`| `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/payments` | [`payment.routes.ts:133`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L133) | None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/payments/submissions/:id/verify`| [`payment.routes.ts:62`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L62)| None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/payments/submissions/:id/reject`| [`payment.routes.ts:77`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L77)| None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | High |
| `POST` | `/api/v1/restructuring/restructure`| [`restructuring.routes.ts:22`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L22)| None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/restructuring/settlement`| [`restructuring.routes.ts:38`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L38)| `COLLECTIONS_SETTLE_LOAN`| `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/restructuring/closure`| [`restructuring.routes.ts:54`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L54)| None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `POST` | `/api/v1/reconciliation/run`| [`reconciliation.routes.ts:16`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.routes.ts#L16)| `DISBURSEMENTS_RECONCILE`| `tenantId = actor.tenantId` | No | Read/Run Allowed | Supported | Low |
| `POST` | `/api/v1/reconciliation/adjustments`| [`reconciliation.routes.ts:84`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.routes.ts#L84)| None (Role check) | `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | High |
| `POST` | `/api/v1/reconciliation/adjustments/:id/approve`| [`reconciliation.routes.ts:115`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.routes.ts#L115)| None (Role check)| `tenantId = actor.tenantId` | Yes | Not Allowed | **UNEXPECTED** | **CRITICAL** |
| `PUT` | `/api/v1/settings/:key`| [`settings.routes.ts:32`](file:///f:/LOAN/backend/src/modules/settings/settings.routes.ts#L32)| None (Role check) | **GLOBAL (No tenantId)** | Yes | Tenant-scoped | **UNEXPECTED (Global)** | **CRITICAL** |
| `POST` | `/api/v1/loan-products/catalog`| [`product.routes.ts:62`](file:///f:/LOAN/backend/src/modules/product/product.routes.ts#L62)| None (Role check) | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `PUT` | `/api/v1/loan-products/catalog/:id`| [`product.routes.ts:76`](file:///f:/LOAN/backend/src/modules/product/product.routes.ts#L76)| None (Role check) | `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `POST` | `/api/v1/configuration/publish`| [`configuration.routes.ts:114`](file:///f:/LOAN/backend/src/modules/configuration/configuration.routes.ts#L114)| `CONFIGURATION_PUBLISH_POLICY`| `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `POST` | `/api/v1/configuration/rollback`| [`configuration.routes.ts:147`](file:///f:/LOAN/backend/src/modules/configuration/configuration.routes.ts#L147)| `CONFIGURATION_PUBLISH_POLICY`| `tenantId = actor.tenantId` | No | Allowed | Supported | Low |
| `PUT` | `/api/v1/integrations/tenant/:category`| [`tenant-integrations.routes.ts:63`](file:///f:/LOAN/backend/src/modules/integrations/tenant-integrations.routes.ts#L63)| `CONFIGURATION_CONFIGURE_INTEGRATIONS`| `tenantId = actor.tenantId` | No | Allowed | Supported | Low |

---

## 8. Financial Authority Audit

| Financial Capability | Expected for System Admin? | Actual Code Authority | Controlling API Endpoint | Underlying Service & Line | Regulatory Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Execute Loan Disbursement** | ❌ NO | 🚨 **YES** | `POST /api/v1/disbursements/execute` | [`disbursement.service.ts:85`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85) | **CRITICAL** |
| **Initiate Payout Batch** | ❌ NO | 🚨 **YES** | `POST /api/v1/disbursements/execute` | [`disbursement.service.ts:85`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85) | **CRITICAL** |
| **Approve Payout Batch** | ❌ NO | 🚨 **YES** | `POST /api/v1/disbursements/execute` | [`disbursement.service.ts:85`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85) | **CRITICAL** |
| **Verify Borrower Repayment Submission** | ❌ NO | 🚨 **YES** | `POST /api/v1/payments/submissions/:id/verify`| [`payment-submission.service.ts:142`](file:///f:/LOAN/backend/src/modules/payments/payment-submission.service.ts#L142)| **CRITICAL** |
| **Post Manual Repayment to Ledger** | ❌ NO | 🚨 **YES** | `POST /api/v1/payments` | [`payment.service.ts:171`](file:///f:/LOAN/backend/src/modules/payments/payment.service.ts#L171) | **CRITICAL** |
| **Propose Ledger Adjustment** | ❌ NO | ⚠️ **YES** | `POST /api/v1/reconciliation/adjustments` | [`reconciliation.service.ts:357`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.service.ts#L357) | **HIGH** |
| **Approve Ledger Adjustment (Checker)** | ❌ NO | 🚨 **YES** | `POST /api/v1/reconciliation/adjustments/:id/approve`| [`reconciliation.service.ts:454`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.service.ts#L454)| **CRITICAL** |
| **Waive Delinquency Penalty / Charges** | ❌ NO | 🚨 **YES** | `POST /api/v1/restructuring/restructure` | [`restructuring.service.ts:65`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.service.ts#L65) | **CRITICAL** |
| **Restructure Loan Terms & Interest** | ❌ NO | 🚨 **YES** | `POST /api/v1/restructuring/restructure` | [`restructuring.service.ts:65`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.service.ts#L65) | **CRITICAL** |
| **Execute OTS Settlement (Debt Write-Off)**| ❌ NO | 🚨 **YES** | `POST /api/v1/restructuring/settlement` | [`restructuring.service.ts:153`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.service.ts#L153) | **CRITICAL** |
| **Close Loan & Issue Statutory NOC** | ❌ NO | 🚨 **YES** | `POST /api/v1/restructuring/closure` | [`restructuring.service.ts:241`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.service.ts#L241) | **CRITICAL** |
| **Modify Repayment Allocation Waterfall** | ❌ NO (Requires Maker-Checker)| 🚨 **YES (Unrestricted)** | `PUT /api/v1/settings/payment_allocation_order`| [`settings.service.ts:34`](file:///f:/LOAN/backend/src/modules/settings/settings.service.ts#L34) | **CRITICAL** |
| **Process Partner Commission Payout** | ❌ NO | 🚨 **YES** | `POST /api/v1/partners/:id/payouts/batch` | [`partner.service.ts:310`](file:///f:/LOAN/backend/src/modules/partners/partner.service.ts#L310) | **HIGH** |

---

## 9. Underwriting & Credit Authority Audit

1. **Credit Sanctioning Power**:
   - `underwriting.routes.ts:29`: `authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER')`.
   - `underwriting.service.ts:60`: `DECISION_MAKER_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER']`.
   - `underwriting.service.ts:116`: `const isSuper = actor.roles?.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN')`.
   - **Finding**: System Admin can commit final underwriting decisions (`APPROVE`, `APPROVE_WITH_CONDITIONS`, `REJECT`, `SEND_BACK`) and bypasses approval limit tiers because `isSuper` treats `ADMIN` as omnipotent.
2. **State Machine Bypassing**:
   - `application.routes.ts:75`: System Admin can invoke `POST /applications/:id/transition` to transition application status directly between states (`SUBMITTED`, `UNDER_REVIEW`, `CREDIT_ASSESSMENT`, `UNDERWRITING`, `APPROVED`, `REJECTED`, `CANCELLED`).
3. **Privilege Escalation in Credit Decisions**:
   - A System Admin who should only manage IT settings can sanction high-ticket loan proposals without credit committee review.

---

## 10. User Management Audit

| Operation | Supported? | Tenant Scoped? | Anti-Privilege Escalation? | Risk | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **List Users** | `SUPPORTED` | ✅ Yes (`where.tenantId`) | N/A | Low | Paginated, searchable by name, email, employee ID. |
| **Create User** | `SUPPORTED` | ✅ Yes | ✅ Blocks `SUPER_ADMIN` creation | Low | Blocks creating Super Admin; verifies branch belongs to tenant. |
| **Edit User** | `NOT SUPPORTED` | N/A | N/A | Medium | No `PUT /users/:id` endpoint exists in backend. |
| **Deactivate User** | `NOT SUPPORTED` | N/A | N/A | High | Cannot deactivate departing employees via API. |
| **Activate / Unlock User** | `NOT SUPPORTED`| N/A | N/A | Medium | Cannot unlock locked accounts via API. |
| **Delete User** | `NOT SUPPORTED` | N/A | N/A | Low | No delete endpoint (soft/hard deletion missing). |
| **Reset Password** | `NOT SUPPORTED` | N/A | N/A | High | No admin reset endpoint (users rely on seed default). |
| **Assign Roles** | `PARTIAL` | ✅ Yes | ✅ Blocks `SUPER_ADMIN` | Low | Role assigned at creation; cannot update role after creation. |
| **Create User in Other Tenant** | `BLOCKED` | ✅ Yes | ✅ Enforced via `actor.tenantId` | Low | Cannot create user in another tenant. |

---

## 11. Role Management & Privilege Escalation Audit

### Privilege Escalation Chain Discovered:
1. System Admin can invoke `POST /api/v1/roles` to create a custom role.
2. The dynamic RBAC service checks Segregation of Duties rules ([`role-permission.service.ts:452`](file:///f:/LOAN/backend/src/modules/roles/role-permission.service.ts#L452)).
3. **Flaw**: Line 453 states:
   ```typescript
   if (sodCheck.hasCriticalBlock && !dto.allowSodOverride) {
     throw new BadRequestError('Segregation of Duties (SoD) Conflict Detected...');
   }
   ```
4. **Vulnerability**: Any System Admin can set `allowSodOverride: true` in the request body. The backend bypasses the critical SoD block without requiring dual authorization from Super Admin.
5. The Admin can create a custom role combining `APPLICATIONS_APPROVE` + `DISBURSEMENTS_EXECUTE_TRANSFER` + `COLLECTIONS_SETTLE_LOAN`.
6. The Admin assigns this custom role to a user or creates a new user with it, granting that user complete omnipotent financial control.

---

## 12. Tenant Isolation & IDOR Audit

| Resource | Tenant Scoped in DB Query? | `req.tenantId` Enforced? | Cross-Tenant IDOR Protected? | Cross-Tenant Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Users** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Branches** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Roles** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Customers** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Applications** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Loans** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Disbursements**| ✅ Yes (`where.loan.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Payments** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Reconciliation**| ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Integrations** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Branding** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **Audit Logs** | ✅ Yes (`where.tenantId = actor.tenantId`) | ✅ Yes | ✅ Yes | None |
| **System Settings**| 🚨 **NO (`SystemSetting` has no `tenantId`)** | ❌ No | 🚨 **NO (Global Table)** | **CRITICAL: Tenant A Admin overwrites settings for all tenants** |

---

## 13. Branch Scope Audit

- **System Admin Scope**: System Admin is **Tenant-Scoped (Global across all branches within their institution)**.
- System Admin can view, create, and manage data across `HO`, `PUN01`, `BLR01`, `DEL01`, or any future branch created within their tenant.
- Unlike `BRANCH_MANAGER` and `LOAN_OFFICER`, System Admin is not restricted by `actor.branchId`.
- **Finding**: Branch scoping functions properly as designed for institutional governance, with no accidental cross-tenant branch leakage.

---

## 14. Customer & Sensitive PII Access Audit

| Operation | Can System Admin Perform? | Endpoint / Code | Risk Level | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **View Customer Profiles** | ✅ YES | `GET /api/v1/customers` | Low | Standard administrative directory view. |
| **View Customer PII (PAN, Mobile)** | ⚠️ YES (Unmasked) | `GET /api/v1/customers/:id` | High | Raw PAN and mobile numbers visible in JSON response. |
| **Create Customer Records** | 🚨 YES | `POST /api/v1/customers` | High | Admin should not originate borrower accounts. |
| **Modify Customer Demographics** | 🚨 YES | `PATCH /api/v1/customers/:id` | High | Risk of unauthorized borrower record tampering. |
| **Force KYC Status (VERIFIED/REJECTED)**| 🚨 YES | `PATCH /api/v1/customers/:id/kyc` | **CRITICAL** | Admin can bypass KYC verification requirements. |
| **Add / Delete Bank Accounts** | 🚨 YES | `POST /customers/:id/bank-accounts` | **CRITICAL** | Potential diversion of disbursement funds to unauthorized accounts. |
| **Delete Customer Account** | 🚨 YES | `DELETE /api/v1/customers/:id` | High | Risk of customer data loss. |

---

## 15. Document Management Audit

- **Upload & Registration**: System Admin is authorized on `POST /api/v1/documents/upload` and `POST /api/v1/documents`.
- **Verification**: System Admin is authorized on `PATCH /api/v1/documents/:id/verify` to mark documents `VERIFIED` or `REJECTED`.
- **Deletion**: System Admin is authorized on `DELETE /api/v1/documents/:id`.
- **Security Check**: Documents are tenant-scoped; System Admin cannot access or delete documents belonging to another tenant.

---

## 16. System Configuration Audit

| Configuration Area | View | Draft | Publish | Rollback | Maker-Checker Exists? | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FOIR & DTI Policy** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (Single Admin can publish) | Medium |
| **Interest Rate Matrices** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Medium |
| **Risk Model Weights** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | Medium |
| **Sanction Limits Tiering** | ✅ Yes | ❌ No | 🚨 Direct `PUT` | ❌ No | ❌ No | **HIGH** |
| **Payment Waterfall Priority**| ✅ Yes | ❌ No | 🚨 Direct `PUT` | ❌ No | ❌ No | **CRITICAL** |

---

## 17. Payment Waterfall Audit

### Authoritative Implementation Trace:
- **Database Model**: `SystemSetting` table (Key: `payment_allocation_order`).
- **Seed Order** ([`database/prisma/seed.ts:436`](file:///f:/LOAN/database/prisma/seed.ts#L436)):
  `['PENALTIES', 'FEES', 'INTEREST', 'PRINCIPAL']`
- **Service Implementation** ([`backend/src/modules/payments/payment.service.ts:221-226`](file:///f:/LOAN/backend/src/modules/payments/payment.service.ts#L221-L226)):
  ```typescript
  const allocSetting = await prisma.systemSetting.findUnique({
    where: { key: 'payment_allocation_order' },
  });
  const allocationBuckets: string[] = (allocSetting?.value as string[]) || [
    'FEES',
    'PENALTY',
    'INTEREST',
    'PRINCIPAL',
  ];
  ```
- **Code Bug Identified**:
  In `seed.ts`, the penalty bucket is named `'PENALTIES'` (plural). In `payment.service.ts`, line 263 checks `else if (bucket === 'PENALTY')` (singular). If the DB setting contains `'PENALTIES'`, the equality check fails and skips penalty allocation, pushing the entire remainder to Principal.
- **System Admin Authority**: System Admin can modify this order at runtime via `PUT /api/v1/settings/payment_allocation_order` without approval or maker-checker.

---

## 18. Integration Hub Audit

- **Access Level**: System Admin has full configuration authority for tenant-specific gateways ([`tenant-integrations.routes.ts:64`](file:///f:/LOAN/backend/src/modules/integrations/tenant-integrations.routes.ts#L64)).
- **Credential Protection**:
  - API keys and client secrets are encrypted using AES-256-GCM ([`crypto.ts`](file:///f:/LOAN/backend/src/common/crypto.ts)).
  - Responses mask secrets (e.g. `test-exp...****`).
  - Plaintext secrets and ciphertexts are never returned over the API.
- **Tenant Isolation**: System Admin cannot view or modify integration credentials of another tenant.
- **SSRF Protection**: Outbound custom URLs are validated against private IP ranges (`validateOutboundUrl`).

---

## 19. Audit Logs Audit

- **Access Level**: Full search, filtering, and export access across all tenant audit records.
- **Integrity**: Audit logs are append-only in PostgreSQL. There is no `DELETE` or `UPDATE` route for `AuditLog`.
- **SHA-256 Evidence Chain**: System Admin can trigger cryptographic hash chain verification (`POST /api/v1/audit/verify-chain`) to detect ledger tampering.
- **PII Masking on Export**: Exported audit trail bundles mask borrower PAN, Aadhaar, and phone numbers.

---

## 20. AI / Copilot Audit

- **Context Scope**: When System Admin uses Copilot (`POST /api/v1/ai/copilot/chat`), context is scoped to their tenant ([`copilot.service.ts:69`](file:///f:/LOAN/backend/src/modules/ai/copilot.service.ts#L69)).
- **Write Actions**: **Zero Write Tools**. Copilot does not have execution tools, function calling for mutations, or direct database write capabilities. It operates strictly in an advisory / analytical capacity.

---

## 21. Reports & Operations Audit

- **Data Sensitivity**: Access to portfolio aggregate volumes, default rates, NPA ratios, DPD aging buckets, and operational exceptions.
- **Tenant Scoping**: All reports filter by `where.tenantId = actor.tenantId`.
- **Export Capability**: CSV generation for portfolio and reconciliation data is tenant-bounded.

---

## 22. Segregation of Duties (SoD) Audit

| Banking SoD Separation Requirement | Status in LMS for System Admin | Risk Level |
| :--- | :--- | :--- |
| **System Admin separated from Underwriting Decisions** | 🚨 **VIOLATION** (Admin can approve/reject loans) | **CRITICAL** |
| **System Admin separated from Disbursement Execution** | 🚨 **VIOLATION** (Admin can disburse funds) | **CRITICAL** |
| **System Admin separated from Repayment Posting & Verification**| 🚨 **VIOLATION** (Admin can post & verify payments) | **CRITICAL** |
| **System Admin separated from Reconciliation Adjustment Approval**| 🚨 **VIOLATION** (Admin can approve ledger adjustments)| **CRITICAL** |
| **System Admin separated from Loan Restructuring & OTS** | 🚨 **VIOLATION** (Admin can settle loans & write off debt)| **CRITICAL** |
| **System Admin separated from Loan Closure & NOC Issuance**| 🚨 **VIOLATION** (Admin can close loans & issue NOC) | **CRITICAL** |
| **System Admin separated from KYC Verification** | 🚨 **VIOLATION** (Admin can force KYC verification) | **CRITICAL** |

---

## 23. Frontend vs Backend Mismatches

1. **Hidden Sidebar vs Open Backend Route (The Concealment Gap)**:
   - Frontend sidebar hides `/underwriting`, `/disbursements`, `/payments`, `/collections`, `/customers`, `/loans`.
   - Backend routes permit `ADMIN` on `POST /underwriting/:id/decision`, `POST /disbursements/execute`, `POST /payments`, `PATCH /customers/:id/kyc`, `POST /restructuring/settlement`.
   - Result: Any tech-savvy Admin or compromised Admin credential has full API access to execute financial and credit fraud.
2. **Staff User Creation Dropdown vs Backend Rejection**:
   - Frontend `users/page.tsx` includes `<option value="SUPER_ADMIN">Super Admin</option>`.
   - Backend `user.service.ts:88` throws `403 Forbidden` if `ADMIN` attempts to create a Super Admin.
3. **Tenants Page UI vs Backend Rejection**:
   - Frontend allows `ADMIN` to open the "Onboard Lender Wizard" on `/tenants`.
   - Backend `POST /tenants/onboard-wizard` rejects `ADMIN` with `403 Forbidden`.

---

## 24. Hardcoded Role Checks Inventory

The following backend files contain hardcoded string checks for `ADMIN` / `COMPANY_ADMIN` that bypass granular permission checks:

1. [`backend/src/modules/underwriting/underwriting.service.ts:60,116`](file:///f:/LOAN/backend/src/modules/underwriting/underwriting.service.ts#L60): Hardcoded `DECISION_MAKER_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', ...]` and `isSuper = r === 'SUPER_ADMIN' || r === 'ADMIN'`.
2. [`backend/src/modules/disbursements/disbursement.service.ts:85,142`](file:///f:/LOAN/backend/src/modules/disbursements/disbursement.service.ts#L85): Hardcoded `['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', ...]` and `isSuperAdmin = r === 'ADMIN'`.
3. [`backend/src/modules/payments/payment.routes.ts:63,78,134`](file:///f:/LOAN/backend/src/modules/payments/payment.routes.ts#L63): Hardcoded `authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', ...)`.
4. [`backend/src/modules/restructuring/restructuring.routes.ts:23,39,55`](file:///f:/LOAN/backend/src/modules/restructuring/restructuring.routes.ts#L23): Hardcoded `authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', ...)`.
5. [`backend/src/modules/customer/customer.routes.ts:178,188,198,218,237`](file:///f:/LOAN/backend/src/modules/customer/customer.routes.ts#L178): Hardcoded `authorize('ADMIN', ...)` on mutation endpoints.
6. [`backend/src/modules/reconciliation/reconciliation.service.ts:456,517`](file:///f:/LOAN/backend/src/modules/reconciliation/reconciliation.service.ts#L456): Hardcoded `actor.roles.includes('ADMIN')` in adjustment approval.
7. [`backend/src/modules/partners/partner.routes.ts:17,66,84,179`](file:///f:/LOAN/backend/src/modules/partners/partner.routes.ts#L17): Hardcoded `authorize('ADMIN', ...)` on partner payouts and status.

---

## 25. Complete Route → Permission → Service Matrix

```
[Route]                                            [Method] [Role Check]  [Granular Perm]             [Service Function]                    [Result]
-----------------------------------------------------------------------------------------------------------------------------------------------------------
/api/v1/users                                      GET      ADMIN allowed TENANT_MANAGE_USERS         listUsers()                           Allowed (Scoped)
/api/v1/users                                      POST     ADMIN allowed TENANT_MANAGE_USERS         createUser()                          Allowed (Scoped)
/api/v1/roles                                      GET      ADMIN allowed TENANT_ASSIGN_ROLES         listRoles()                           Allowed (Scoped)
/api/v1/roles                                      POST     ADMIN allowed TENANT_ASSIGN_ROLES         createCustomRole()                    Allowed (SoD Bypass)
/api/v1/branches                                   POST     ADMIN allowed -                           createBranch()                        Allowed (Scoped)
/api/v1/customers/:id/kyc                          PATCH    ADMIN allowed -                           updateKycStatus()                     🚨 Unexpected Mutate
/api/v1/applications/:id/transition                POST     ADMIN allowed -                           transition()                          🚨 Unexpected State
/api/v1/underwriting/:id/decision                  POST     ADMIN allowed APPLICATIONS_APPROVE (hard) submitUnderwritingDecision()          🚨 Critical Decision
/api/v1/disbursements/execute                     POST     ADMIN allowed DISBURSEMENTS_EXECUTE (hard)executeDisbursement()                 🚨 Critical Payout
/api/v1/payments                                   POST     ADMIN allowed -                           processPayment()                      🚨 Critical Payment
/api/v1/payments/submissions/:id/verify            POST     ADMIN allowed -                           verifyPaymentSubmission()             🚨 Critical Verify
/api/v1/restructuring/settlement                   POST     ADMIN allowed COLLECTIONS_SETTLE_LOAN     executeSettlement()                   🚨 Critical OTS
/api/v1/restructuring/closure                      POST     ADMIN allowed -                           closeLoanAndIssueNoc()                🚨 Critical NOC
/api/v1/reconciliation/adjustments/:id/approve     POST     ADMIN allowed -                           approveAdjustment()                   🚨 Critical Recon
/api/v1/settings/:key                              PUT      ADMIN allowed -                           updateSetting()                       🚨 Global Leak
```

---

## 26. Complete System Admin Access Matrix

| Capability / Module | Intended | Current Actual | Access Mode | Tenant Isolation | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | YES | YES | Read-Only | Isolated | Low |
| **Staff Users** | YES | PARTIAL | Create / List | Isolated | Low |
| **Roles & RBAC** | YES | YES | Full CRUD | Isolated | High (SoD Override) |
| **Branches** | YES | YES | Full CRUD | Isolated | Low |
| **Loan Products** | YES | YES | Full CRUD & Versioning | Isolated | Low |
| **Workflows** | YES | YES | Full CRUD & Stages | Isolated | Low |
| **Policy Configuration** | YES | YES | Draft, Publish, Rollback | Isolated | Low |
| **Branding & White-Label**| YES | YES | Full Update | Isolated | Low |
| **System Settings** | YES | YES | Full Update | 🚨 **GLOBAL LEAK** | **CRITICAL** |
| **Audit Logs** | YES | YES | Read-Only & Verify Chain | Isolated | Low |
| **Integration Hub** | YES | YES | Full Config (Masked) | Isolated | Low |
| **Reports & Analytics** | YES | YES | Read & Export | Isolated | Low |
| **Operations Center** | YES | YES | Read & Run | Isolated | Low |
| **Compliance & Privacy** | YES | YES | Read & Purpose Config | Isolated | Low |
| **AI / Copilot** | YES | YES | Conversational Read | Isolated | Low |
| **Fraud Intelligence** | YES | YES | Read & Synthesize | Isolated | Low |
| **Early Warnings** | YES | YES | Read & Monitor | Isolated | Low |
| **EMI Calculator** | YES | YES | Simulation | Isolated | Low |
| **Customer Data Mutation**| NO | 🚨 YES | Full Mutation & KYC | Isolated | **CRITICAL** |
| **Loan Origination** | NO | 🚨 YES | Create Application | Isolated | High |
| **Underwriting Sanctions**| NO | 🚨 YES | Approve / Reject Proposals | Isolated | **CRITICAL** |
| **Disbursement Execution**| NO | 🚨 YES | Trigger Bank Payouts | Isolated | **CRITICAL** |
| **Payment Posting** | NO | 🚨 YES | Post Repayments | Isolated | **CRITICAL** |
| **Reconciliation Approvals**| NO| 🚨 YES | Approve Adjustments | Isolated | **CRITICAL** |
| **Restructuring & OTS** | NO | 🚨 YES | Restructure & Settle Debt| Isolated | **CRITICAL** |
| **Loan Closure & NOC** | NO | 🚨 YES | Issue Final NOCs | Isolated | **CRITICAL** |

---

## 27. Security Findings & Vulnerabilities

### Finding 1: Critical Segregation of Duties (SoD) Breakdown in Financial & Underwriting Execution
- **Severity**: **CRITICAL**
- **Affected Files**:
  - `backend/src/modules/underwriting/underwriting.routes.ts`
  - `backend/src/modules/disbursements/disbursement.routes.ts`
  - `backend/src/modules/payments/payment.routes.ts`
  - `backend/src/modules/restructuring/restructuring.routes.ts`
  - `backend/src/modules/reconciliation/reconciliation.routes.ts`
- **Current Behavior**: `ADMIN` is included in the route authorization arrays and hardcoded service checks for loan sanction, live disbursement, payment posting, OTS debt write-off, and ledger adjustment approval.
- **Expected Behavior**: System Admin should be strictly confined to IT administration, user provisioning, workflow setup, policy configuration, and audit inspection. Direct credit decisions, fund movements, and accounting adjustments must be restricted to Underwriters and Finance Officers.
- **Danger**: Rogue or compromised Admin credentials can sanction fraudulent loans and disburse funds without any maker-checker intervention.

---

### Finding 2: Global Setting Table Cross-Tenant Contamination
- **Severity**: **CRITICAL**
- **Affected Files**:
  - `database/prisma/schema.prisma:423` (`model SystemSetting`)
  - `backend/src/modules/settings/settings.service.ts:34`
- **Current Behavior**: The `SystemSetting` table has no `tenantId` column. An Admin from Tenant A updating `approval_limits` or `payment_allocation_order` overwrites the setting for all tenants on the instance.
- **Expected Behavior**: Settings must be scoped per-tenant (`tenantId`), with fallback to system defaults.

---

### Finding 3: Unrestricted Segregation of Duties Override in Custom Role Builder
- **Severity**: **HIGH**
- **Affected File**:
  - `backend/src/modules/roles/role-permission.service.ts:453`
- **Current Behavior**: System Admin can pass `allowSodOverride: true` to bypass critical banking SoD rule enforcement when creating custom roles.
- **Expected Behavior**: SoD overrides must require dual authorization or Super Admin signature.

---

### Finding 4: User Lifecycle Management Incompleteness (Deactivation & Password Reset Gaps)
- **Severity**: **HIGH**
- **Affected Files**:
  - `backend/src/modules/users/user.routes.ts`
  - `backend/src/modules/users/user.service.ts`
- **Current Behavior**: There are no API endpoints for System Admin to deactivate departed employees, lock suspicious accounts, or trigger administrative password resets.
- **Expected Behavior**: Complete lifecycle endpoints (`PATCH /users/:id/status`, `POST /users/:id/reset-password`).

---

### Finding 5: Payment Waterfall Configuration Naming Mismatch
- **Severity**: **MEDIUM**
- **Affected Files**:
  - `database/prisma/seed.ts:436`
  - `backend/src/modules/payments/payment.service.ts:263`
- **Current Behavior**: Seed initializes `payment_allocation_order` with `'PENALTIES'`, while `payment.service.ts` checks for `'PENALTY'`. If the database value is used, penalty allocation is skipped.
- **Expected Behavior**: Normalized uppercase bucket tokens with schema validation.

---

## 28. Missing Features (What System Admin SHOULD Have but Lacks)

1. **Staff Lifecycle Management**:
   - `PATCH /api/v1/users/:id/status` (Activate / Deactivate / Suspend staff).
   - `POST /api/v1/users/:id/reset-password` (Admin password reset).
   - `PUT /api/v1/users/:id` (Update staff name, employee ID, branch, assigned roles).
2. **Dual-Authorization / Maker-Checker on High-Risk Policy Changes**:
   - Changes to interest rate policies, approval limit tiers, or payment allocation order currently take effect immediately without dual sign-off.
3. **Session Revocation Management**:
   - While token revocation exists in `security.service.ts`, Admin has no endpoint to force-revoke all active sessions of a compromised employee.

---

## 29. Unnecessary Access (What Should be REMOVED from System Admin)

System Admin should be **completely removed** from the following routes and service permissions:

1. **Underwriting Sanctions**: Remove `ADMIN` from `POST /api/v1/underwriting/:id/decision`.
2. **Disbursement Execution**: Remove `ADMIN` from `POST /api/v1/disbursements/execute`.
3. **Payment Verification & Posting**: Remove `ADMIN` from `POST /api/v1/payments` and `POST /api/v1/payments/submissions/:id/verify`.
4. **Loan Restructuring & OTS Debt Settlement**: Remove `ADMIN` from `POST /api/v1/restructuring/restructure` and `POST /api/v1/restructuring/settlement`.
5. **Loan Closure & NOC Generation**: Remove `ADMIN` from `POST /api/v1/restructuring/closure`.
6. **Reconciliation Adjustment Approval**: Remove `ADMIN` from `POST /api/v1/reconciliation/adjustments/:id/approve` (make it Finance Controller / Officer only).
7. **Customer Demographics & KYC Alteration**: Remove `ADMIN` from `POST /api/v1/customers`, `PATCH /api/v1/customers/:id`, and `PATCH /api/v1/customers/:id/kyc`.

---

## 30. Recommended System Admin Sidebar

Based on banking IT governance and the principle of least privilege, the recommended System Admin sidebar is:

```
=== OVERVIEW ===
- Dashboard                     [/dashboard]                 [KEEP]

=== ADMINISTRATION ===
- Staff Directory & Users       [/users]                     [KEEP]
- Branch Directory              [/branches]                  [KEEP]
- Roles & RBAC Governance       [/roles]                     [KEEP]
- Workflow Studio               [/workflows]                 [KEEP]
- Policy Configuration          [/configuration]             [KEEP]
- Integration Hub               [/integrations]              [KEEP]
- Branding & White-Label        [/branding]                  [KEEP]
- System Settings               [/settings]                  [KEEP (Scoped)]
- Audit Logs & Evidence Chain   [/audit-logs]                [KEEP]
- Privacy & Consent             [/privacy]                   [KEEP]

=== LENDING & SERVICING CONFIGURATION ===
- Loan Products                 [/loan-products]             [KEEP]
- Partners & DSAs               [/partners]                  [READ-ONLY]
- Omnichannel Hub               [/communications]            [KEEP]
- Accounting & Recon            [/reconciliation]            [READ-ONLY (Remove adjustment approvals)]

=== INSIGHTS & OBSERVABILITY ===
- AI Command Center             [/command-center]            [KEEP]
- Operations & Observability    [/operations]                [KEEP]
- Regulatory & Compliance       [/compliance]                [KEEP]
- Reports & Analytics           [/reports]                   [KEEP]
- Fraud & Anomaly Intelligence  [/fraud-intelligence]        [KEEP]
- Early Warning Center          [/early-warnings]            [KEEP]
- EMI Calculator                [/emi-calculator]            [KEEP]

=== STRICTLY EXCLUDED FROM SIDEBAR & URLS ===
- Customers (Mutation)          [/customers]                 [EXCLUDED / READ-ONLY DIRECTORY]
- Loan Applications (Sanction)  [/applications]              [EXCLUDED / READ-ONLY PIPELINE]
- Credit Assessment Desk        [/underwriting]              [EXCLUDED]
- Disbursements Desk            [/disbursements]             [EXCLUDED]
- Payments Ledger               [/payments]                  [EXCLUDED / READ-ONLY AUDIT]
- Collections Desk              [/collections]               [EXCLUDED]
```

---

## 31. Recommended Permission Model

```typescript
export const SYSTEM_ADMIN_PERMISSIONS: PermissionCode[] = [
  // Tenant Administration
  'TENANT_MANAGE_USERS',
  'TENANT_ASSIGN_ROLES',
  'TENANT_VIEW_OPERATIONS_CENTER',
  'TENANT_CONFIGURE_BRANDING',

  // Configuration
  'CONFIGURATION_VIEW_POLICIES',
  'CONFIGURATION_DRAFT_POLICY',
  'CONFIGURATION_PUBLISH_POLICY',
  'CONFIGURATION_CONFIGURE_INTEGRATIONS',

  // Privacy & Audit
  'PRIVACY_VIEW_CONSENT_REGISTRY',
  'AUDIT_EXPORT_EVIDENCE_PACKAGE',
  'AUDIT_VERIFY_CHAIN',

  // Governance Read Access
  'APPLICATIONS_VIEW',
  'COLLECTIONS_VIEW_DPD',
  'UNDERWRITING_RUN_AI_ASSIST',
];
```

---

## 32. Production Readiness Verdict

### Verdict: **NO — NOT PRODUCTION READY**

| Issue Category | Critical | High | Medium | Low | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Segregation of Duties (Financial / Underwriting)** | 6 | 2 | 0 | 0 | **8** |
| **Multi-Tenant Isolation (SystemSetting)** | 1 | 0 | 0 | 0 | **1** |
| **Privilege Escalation (SoD Override)** | 0 | 1 | 0 | 0 | **1** |
| **Frontend/Backend Authorization Mismatch** | 0 | 3 | 2 | 0 | **5** |
| **User Lifecycle Gaps (Deactivation/Reset)** | 0 | 2 | 1 | 0 | **3** |
| **Total Security Issues** | **7** | **8** | **3** | **0** | **18** |

### Primary Blockers to Production:
1. **Severe Segregation of Duties Violations**: System Admin can directly disburse loan funds, sanction credit applications, post repayments, execute debt write-offs, and approve reconciliation adjustments.
2. **Global System Settings**: `SystemSetting` is not scoped by `tenantId`, allowing single-tenant Admins to alter multi-tenant platform configurations.
3. **Frontend Concealment Flaw**: Sensitive operational pages are hidden in the sidebar but fully functional upon direct URL navigation or REST API call.
4. **Uncontrolled SoD Override in Custom Role Creation**: Admin can bypass maker-checker separation rules when creating custom roles.

---

## 33. Exact Recommended Fixes (Blueprint for Remediation)

*(Note: In accordance with audit instructions, no code changes have been applied during this audit.)*

1. **Strip Operational Roles from Financial & Underwriting Routes**:
   - In `backend/src/modules/underwriting/underwriting.routes.ts`: Change `authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER')` to `authorize('SUPER_ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER')`.
   - In `backend/src/modules/disbursements/disbursement.routes.ts`: Change `authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', ...)` to `authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'FINANCE_CONTROLLER')`.
   - In `backend/src/modules/payments/payment.routes.ts`: Remove `'ADMIN'` from `/verify` and `POST /`.
   - In `backend/src/modules/restructuring/restructuring.routes.ts`: Remove `'ADMIN'` from `/restructure`, `/settlement`, and `/closure`.
   - In `backend/src/modules/reconciliation/reconciliation.routes.ts`: Remove `'ADMIN'` from `/adjustments/:id/approve`.
   - In `backend/src/modules/customer/customer.routes.ts`: Remove `'ADMIN'` from `POST /`, `PATCH /:id`, `PATCH /:id/kyc`, and `DELETE /:id`.
2. **Scope `SystemSetting` Table by `tenantId`**:
   - Add `tenantId String?` to `SystemSetting` in `schema.prisma` with compound index `@@unique([tenantId, key])`.
   - Update `settings.service.ts` to query and update settings per-tenant.
3. **Enforce Frontend Route Guards**:
   - In `frontend/src/components/AppShell.tsx` or Next.js middleware, check if the active path is in `ROLE_CONFIG[primaryRole].nav` and redirect unauthorized direct URL access to `/dashboard`.
4. **Disable Self-SoD Override in Custom Roles**:
   - In `role-permission.service.ts:453`, require `actor.roles.includes('SUPER_ADMIN')` to permit `allowSodOverride: true`.
5. **Implement Missing User Lifecycle APIs**:
   - Add `PATCH /api/v1/users/:id/status` (ACTIVE/INACTIVE/LOCKED), `POST /api/v1/users/:id/reset-password`, and `PUT /api/v1/users/:id`.
6. **Fix Payment Waterfall Keyword**:
   - Normalize `'PENALTIES'` vs `'PENALTY'` in `payment.service.ts` and `seed.ts`.
