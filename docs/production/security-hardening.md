# Security Hardening & Authorization Architecture

This document specifies the security controls and authorization barriers enforced across all layers of Adyapan Lending OS.

---

## 1. Authentication & Session Security

- **Password Hashing**: Salted bcrypt password hashing with non-reversible work factor.
- **JWT Architecture**:
  - Short-lived Access Tokens (15 minutes).
  - Refresh Tokens stored with rotation and server-side revocation tracking.
  - Startup enforcement: In production mode, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters and cannot use default placeholders.
- **Rate Limiting**: Tiered rate limiters protect login, OTP verification, password reset, and financial transaction endpoints.

---

## 2. Segregation of Duties (SoD) Invariants

| Action | Maker | Blocked Checker (SoD Rule) |
| :--- | :--- | :--- |
| **Loan Approval** | `LOAN_OFFICER` (Originator) | Originating Loan Officer cannot self-approve own application |
| **Ledger Adjustments** | `FINANCE_OFFICER` (Maker) | Self-approval blocked; distinct `FINANCE_OFFICER` (Checker) required |
| **Settlement & Waivers** | `COLLECTION_OFFICER` | Originating collector cannot approve own debt waiver proposal |
| **Write-offs** | `COLLECTION_OFFICER` | Requires independent Credit Committee / Supervisor approval |
| **Disbursements** | `FRAUD_ANALYST` | Fraud analysts strictly forbidden from initiating bank payouts |
| **Policy Publishing** | `AUDITOR` | Auditors have strictly read-only access and cannot publish policies |

---

## 3. Data Isolation & IDOR Protection

- **Tenant Isolation**: Every database query scopes through `tenantId`. Cross-tenant data tampering is rejected with 403 Forbidden.
- **Customer Ownership**: Direct API calls to customer resources (`/loans/:id`, `/applications/:id`, `/documents/:id`) verify `customerId === req.user.customerId`.
- **Borrower Safe Redaction**: Borrower endpoints strictly redact internal credit risk scores, fraud anomaly graphs, underwriting notes, and collection logs.
