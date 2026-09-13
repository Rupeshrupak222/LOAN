# ADYAPAN LENDING OS — LOAN OFFICER PORTAL & ORIGINATION ARCHITECTURE
## M2P / Industry-Standard LOS Benchmark Specification

**Document Version:** 1.0.0  
**Phase:** LOAN OFFICER PORTAL / ORIGINATION WORKSPACE PRODUCTIZATION  
**Status:** CERTIFIED & ACTIVE  

---

## 1. Executive Architecture Overview

The **Loan Officer Portal (Origination Workspace)** is the front-line origination and intake terminal of Adyapan Lending OS. Designed in alignment with top-tier digital lending and LOS benchmarks (such as M2P, Finflux, and modern NBFC platforms), it provides an auditable, high-velocity intake desk for branch-based and field-assisted loan operations.

```
                  ┌────────────────────────────────────────┐
                  │          LOAN OFFICER WORKSPACE        │
                  │   (/dashboard, /leads, /applications,  │
                  │     /customers, /tasks, /support)      │
                  └──────────────────┬─────────────────────┘
                                     │
                 Unified Sourcing Engine (Digital & Branch)
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │               CORE ORIGINATION SERVICES                │
        │                                                        │
        │  • LeadService (Intake, Anti-IDOR, Auto-Conversion)     │
        │  • Customer & Application Lifecycle Engine             │
        │  • Dynamic Document Matrix Engine (Salaried/Self/Stud) │
        │  • ScopeResolver (Multi-Tenant & Branch Data Boundary) │
        │  • SoD Validator (assertLoanOfficerSeparation)         │
        └────────────────────────────┬───────────────────────────┘
                                     │
                       Workflow Gated Handoff
              (Mandatory KYC, Docs, SanctionLimit=0)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │          CREDIT ANALYST QUEUE          │
                  │          (/credit-assessment)          │
                  └────────────────────────────────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Strict Role-Based Access Control (RBAC) & Principle of Least Privilege
The `LOAN_OFFICER` role is isolated to origination, document collation, KYC initiation, lead tracking, and application intake:
- **Zero Sanction & Payout Limits:** `sanctionLimitAmount = 0`, `payoutLimitAmount = 0`.
- **Zero Underwriting Authority:** Strict prohibition against underwriting evaluations, approval overrides, credit policy adjustments, or sanction determinations.
- **Zero Disbursement Authority:** Prohibited from executing payouts, creating disbursement batches, or approving transactions.
- **Permissions Matrix (14 Canonical Permissions):**
  1. `application.create`
  2. `application.view`
  3. `application.view.branch`
  4. `application.update.draft`
  5. `application.submit`
  6. `customer.create`
  7. `customer.view`
  8. `customer.kyc.initiate`
  9. `application.documents.upload`
  10. `application.documents.view`
  11. `bank-verification.initiate`
  12. `lead.manage`
  13. `task.view`
  14. `support.manage`

### 2.2 Segregation of Duties (SoD) & Anti-Bypass Guardrails
Under financial safety protocols (P5 / P8):
- **`assertLoanOfficerSeparation`**: Programmatically ensures that a loan officer who originated, drafted, or submitted an application CANNOT approve the loan, perform underwriting, or trigger disbursement.
- **Anti-Self Approval:** Prevents maker-checker collusion by enforcing strict actor ID distinctness.

### 2.3 Unified Application Sourcing (Digital & Assisted)
To prevent split workflows:
- Digital direct applications (`CUSTOMER` self-service via borrower portal) and assisted applications (`LOAN_OFFICER` intake) converge on the exact same authoritative `LoanApplication` schema and state machine.
- Lead lifecycle (`NEW` $\to$ `CONTACTED` $\to$ `QUALIFIED` $\to$ `CONVERTED`) flows seamlessly into `Customer` + `LoanApplication` creation with transactional integrity.

### 2.4 Dynamic Profile-Aware Document Matrix
Document requirements dynamically adjust based on borrower employment and profile types:
- **SALARIED:** Mandatory PAN, Aadhaar, Bank Statement, Salary Slips (Last 3 Months).
- **SELF_EMPLOYED:** Mandatory PAN, Aadhaar, Bank Statement, Business ITR (Last 2 Years), Business Proof. (Salary slips NOT required).
- **STUDENT:** Mandatory PAN, Aadhaar, Student ID Proof, Admission Letter / Fee Receipt, Co-Borrower KYC & Income. (Salary slips & Business ITR strictly NOT required).

---

## 3. Origination Workspace User Experience

The Loan Officer Portal sidebar and navigation are strictly restricted to 6 core operational modules:
1. **Dashboard (`/dashboard`):** Real-time operational work desk with 8 operational KPIs (`MY ONBOARDED BORROWERS`, `TOTAL APPLICATIONS`, `RETURNED FOR CORRECTIONS`, `KYC PENDING`, `DRAFT PROPOSALS`, `FORWARDED TO CREDIT`, `APPROVED PROPOSALS`), quick actions, and direct-action return queue.
2. **Leads (`/leads`):** Lead sourcing, tracking, qualification, and 1-click conversion to customer & loan proposal.
3. **Applications (`/applications`):** Branch application queue with multi-filter search, KYC statuses, document completeness, and stage tracking.
4. **Customers (`/customers`):** Branch borrower directory with KYC verification, contact information, and active loan history.
5. **Tasks (`/tasks`):** Prioritized operational workbench highlighting returned proposals, pending KYC docs, and draft proposals ready for submission.
6. **Support (`/support`):** Field operational assistance desk for raising branch support tickets and tracking internal query resolution.

---

## 4. Multi-Tenant & Branch Zero-Trust Scope Isolation
- All lead, customer, and application queries flow through `ScopeResolver.resolve(actor)`.
- Cross-tenant and cross-branch data access attempts without global super-admin clearance are denied with `403 Forbidden` / `404 Not Found` anti-IDOR protection.

---

## 5. Summary
The Loan Officer Portal provides a hardened, high-velocity intake desk that empowers branch officers while strictly safeguarding the credit underwriting and disbursement boundaries of Adyapan Lending OS.
