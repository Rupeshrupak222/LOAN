# ADYAPAN LENDING PLATFORM — SECURITY & STATUTORY COMPLIANCE

## 1. Digital Personal Data Protection (DPDP) Act Compliance
- **Statutory Consent Registry**: Versioned borrower consent captures for Bureau Inquiries, Bank Statement Pulls, and WhatsApp Notifications.
- **Data Minimization & Redaction**: Sensitive borrower PII (PAN, Aadhaar, Account Numbers) is masked (`ABCDE****F`, `**** **** 9012`, `******1098`) across logs, exports, and AI contexts.

---

## 2. Authentication & Boundary Defense
- **Brute-Force Lockout**: 5 consecutive failed login attempts automatically lock the user account for 15 minutes.
- **Instant Token Revocation**: Revoked JWT tokens are tracked in an in-memory / Redis token blacklist.
- **Anti-IDOR Protection**: Explicit checks verify that borrowers can only view their own loan accounts, and staff users can only view records within their active tenant scope.

---

## 3. Advisory AI Security & Prompt Injection Defense
- **Context Minimization**: Document text and borrower notes are sanitized to remove jailbreak strings (`Ignore previous instructions...`).
- **Advisory Isolation**: AI copilot cannot perform financial mutations or approve credit sanctions without human underwriter confirmation.

---

## 4. Cryptographic SHA-256 Evidence Chain
- Critical mutations (Sanctions, Disbursements, Policy Changes, Controlled Offboardings) append an immutable node to the evidence ledger.
- Each node hashes the previous block's SHA-256 digest, creating an unbroken chain of custody verifiable via `POST /api/v1/audit/verify-chain`.
