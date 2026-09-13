# Borrower Security, IDOR Protection & Safe Views

## 1. Security & Redaction Model
The Direct Lending API enforces strict data protection rules:
- **Zero Risk / Fraud Leakage**: Exact risk scores, signal weights, fraud syndicate graph nodes, and anomaly rule codes are never returned in borrower APIs.
- **Safe Decision Categories**: Rejection or referral reasons are mapped to approved customer-safe explanations.
- **Collector Note Shielding**: Internal collection priority scores and officer call notes are excluded from borrower views.

---

## 2. Multi-Tenant & IDOR Protection
- **Tenant Context**: Every database query is scoped to `req.user.tenantId`.
- **Borrower Ownership**: Customer can only access applications, loans, offers, documents, and payments associated with their authenticated `userId`.
- **IDOR Blocking**: Attempting to query another customer's loan ID immediately returns `NotFoundError` or `ForbiddenError`.
