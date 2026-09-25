# Adyapan Lending OS — Architecture, Security & Privacy Blueprint

---

## 1. Architectural Principles

1. **Decoupled Multi-Domain Engine**:
   - Clean domain boundaries across Origination, Credit Assessment, Underwriting, Offers, Contracts, Finance, Servicing, Collections, and Analytics.
   - Unified lifecycle orchestration governed by declarative state transitions and dynamic Approval Authority Matrix.

2. **Defense-in-Depth Security**:
   - Zero-trust server-side context resolution: role, permissions, tenant ID, and branch ID are strictly extracted from authenticated session tokens.
   - Anti-IDOR object-level guards prevent horizontal or cross-tenant data access.

3. **Privacy & Regulatory Compliance**:
   - Universal PII masking for sensitive national identifiers (PAN, Aadhaar, Bank Accounts).
   - Immutable audit logging and statutory consent recording adhering to RBI Digital Lending guidelines and DPDP Act.

4. **Financial Accuracy & Idempotency**:
   - Decimal-safe financial math using PostgreSQL NUMERIC and `Decimal.js`.
   - Fingerprinted cryptographic idempotency keys protect all disbursement, payment, and reversal mutations.

---

## 2. Role-Based Access Control (RBAC) & Portals

| Role | Portal Responsibility | Permitted Write Operations |
| :--- | :--- | :--- |
| **Loan Officer** | Borrower origination, lead capture, document upload | Create/edit draft applications, upload KYC docs |
| **Credit Analyst** | Credit profile analysis, bureau inquiry, BRE evaluation | Submit credit recommendation, run BRE rules |
| **Branch Manager** | Branch oversight, delegated authority loan approval (Level 1) | Approve loan within L1 limit or escalate to UW |
| **Underwriter** | Higher exposure underwriting (Level 2/3), risk waivers | Approve/Sanction loan above L1 or reject/condition |
| **Finance Officer** | Pre-disbursement checklist, payout maker/checker | Submit payout batch, approve payout (SoD checker) |
| **Collection Officer** | Delinquency queues, PTP recording, recovery actions | Record contact, record PTP, close case (if 0 overdue) |
| **Auditor** | Read-only compliance inspection, immutable audit trails | View audit logs, verify regulatory disclosures |
| **Customer / Borrower** | Self-serve portal, application, offer acceptance, eSign | Submit application, accept offer, execute eSign, pay EMI |
| **System Admin** | Tenant settings, product configuration, user management | Configure products, authority matrix, manage users |
