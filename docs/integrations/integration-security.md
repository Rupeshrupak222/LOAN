# Integration Security, RBAC & Isolation

Security and multi-tenant isolation principles strictly govern all integration touchpoints.

---

## 1. Role-Based Access Control (RBAC) & Segregation of Duties (SoD)

| Role | Provider Configuration | Trigger Sandboxes / Verification | View System Health |
| :--- | :--- | :--- | :--- |
| **Borrower (CUSTOMER)** | **FORBIDDEN** (403) | Triggered via loan workflows | **FORBIDDEN** (403) |
| **Loan Officer / Underwriter** | **FORBIDDEN** (403) | Triggered via application lifecycle | **FORBIDDEN** (403) |
| **Finance / Ops** | **FORBIDDEN** (403) | Triggered via disbursement/payout queues | Read-Only |
| **Platform / Super Admin** | Authorized | Authorized | Full Access |

---

## 2. Borrower UX Sanitization (Zero Technical Leaks)

Borrower portal views and mobile responses must never expose technical provider names, API vendor codes, or raw stack traces.
- Display *"Verifying your identity..."* instead of *"Calling SandboxKycProvider..."*.
- Display *"We're verifying your bank account..."* instead of *"BANK_API_RESPONSE_PENDING"*.
- All internal scorecards and fraud graph signals remain strictly redacted from borrower views.
