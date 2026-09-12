# Analytics Security & Data Governance

## 1. Multi-Tenant & Branch Scoping
Every analytical request is intercepted by `buildScopedPrismaFilter`:
- **Super Administrators (`SUPER_ADMIN`)**: May view cross-tenant analytics or specify `tenantId`.
- **Institution Admins (`COMPANY_ADMIN`)**: Scoped strictly to their own institution's `tenantId`. Attempting to access another tenant's metrics triggers a `403 ForbiddenError`.
- **Branch Managers & Officers**: Locked to their assigned `branchId`.
- **Lending Service Providers (`PARTNER`)**: Locked to their own `partnerId`. They can never access another partner's performance, commission, or borrower records.
- **Borrowers (`CUSTOMER`)**: Strictly forbidden from accessing internal analytics, collection scorecards, or command center dashboards.

---

## 2. PII Masking
When exporting reporting datasets, PII fields are masked by default:
- **Phone Numbers**: `+91 98****3210`
- **Email Addresses**: `r***a@example.com`
- **PAN Numbers**: `ABCDE****F`
- **Aadhaar Numbers**: `********9012`
- **Bank Account Numbers**: `*******61928`

Only compliance auditors and super administrators with explicit audit permissions can trigger unmasked evidence exports.
