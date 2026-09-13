# ADYAPAN LENDING OS — PARTNER & CO-LENDING PORTAL FORTIFICATION ARCHITECTURE

## 1. Executive Summary & Design Principles

**Phase**: P7 — Partner & Co-Lending Portal Fortification  
**Scope**: Partner & Embedded Lending Workspace (`/partner`), Inbound & Outbound Partner APIs, LSP/Co-Lending Boundary Allocations, Cryptographic Security & Anti-IDOR Protections.

The Adyapan Lending OS partner ecosystem enables seamless embedded finance, Fintech/LSP integration, and co-lending distribution. Phase P7 hardens and fortifies this architecture to guarantee:

1. **Strict Separation of Concerns**:
   - **Internal Lender Workspace (`/partners/*`)**: Restricted to internal lender executives (`SUPER_ADMIN`, `ADMIN`, `BRANCH_MANAGER`, `FINANCE_OFFICER`, `AUDITOR`) for partner registration, commercial agreement configuration, credit line limits, and audit tracking.
   - **Partner Self-Service Workspace (`/partner/*`)**: Dedicated to external partner staff (`PARTNER_ADMIN`, `PARTNER_OPERATIONS`, `PARTNER_AGENT`, `PARTNER_FINANCE`, `PARTNER_SUPPORT`) with scoped, safe capabilities for origination, customer intake, and commission visibility.
2. **Zero-Trust Scope Derivation & Anti-IDOR Defense**:
   - Never trust client-supplied `partnerId`, `tenantId`, `customerId`, or `applicationId`.
   - The authoritative `partnerId` and `tenantId` are strictly derived from the authenticated session token or cryptographic API key prefix.
   - Any attempt by Partner A to access, update, or submit Partner B's entities triggers immediate `[IDOR_BLOCKED]` with an HTTP 403 Forbidden error.
3. **Internal Data Leakage Prevention**:
   - Partner responses project through an authoritative sanitization layer (`partnerFortificationService`).
   - Zero exposure of internal BRE rule names, rule IDs, evaluation traces, internal risk/fraud scores, fraud syndicate signals, underwriter remarks, internal maker/checker user IDs, GL account numbers, or raw credit bureau data.
4. **Authoritative PII Masking**:
   - Sensitive personal information is uniformly masked across all partner portal views and API responses:
     - **PAN**: `ABXXXXXX4F` (first 2 and last 2 characters only)
     - **Aadhaar**: `XXXXXXXX1234` (last 4 digits only)
     - **Mobile Phone**: `******3210` (last 4 digits only)
     - **Email**: `jo***@domain.com` (first 2 characters and domain only)
     - **Bank Account**: `********1234` (last 4 digits only)
5. **State-Gated Lending Integration (P4 Alignment)**:
   - Partner users are restricted to legitimate sourcing transitions (`SUBMIT_APPLICATION`, `UPLOAD_DOCUMENT`, `ACCEPT_OFFER`).
   - Attempting internal transitions (`APPROVE_CREDIT`, `OVERRIDE_FRAUD_SCORE`, `EXECUTE_DISBURSEMENT`, `POST_GL_JOURNAL`) is rejected with HTTP 403 Forbidden.
6. **Financial Dual-Control & Commission Hardening (P5 Alignment)**:
   - Partner roles cannot disburse loans, clear payouts, or execute commission payouts.
   - Payout proposals must be originated by internal finance makers and approved by independent checkers through `financialControlService.createFinancialTask` (`PENDING_CHECKER`).
   - All commission calculations, sourcing fees, disbursement shares, and clawback formulas are computed using `Decimal.js` to eradicate IEEE-754 floating-point rounding errors.
7. **Outbound Webhook Security & Anti-Replay Defense**:
   - Outbound webhook deliveries are signed using HMAC-SHA256: `t={timestamp},v1={hex_hash}`.
   - Replay protection verifies timestamps within an authoritative 300-second tolerance window.
   - Webhook deliveries and replays are tenant and partner scoped.
8. **Co-Lending Boundary Allocation (RBI CLM Framework)**:
   - Deterministic 80:20 (or configured) sharing models between institutional lender and sourcing partner.
   - Exact mathematical reconciliation guarantees `lenderShare + partnerShare === totalSanctioned` with zero penny leakage.

---

## 2. Canonical Partner Permissions & Role Taxonomy

### 2.1 Partner Permissions Matrix

| Permission Identifier | Category | Allowed Actions | Description |
| :--- | :--- | :--- | :--- |
| `partner.access` | `PARTNER_ECOSYSTEM` | Access | Basic access to the partner workspace |
| `partner.read` | `PARTNER_ECOSYSTEM` | Read | Read own partner profile and commercial policy |
| `partner.update` | `PARTNER_ECOSYSTEM` | Update | Update own partner metadata and contact details |
| `partner.credentials.read` | `PARTNER_ECOSYSTEM` | Read | View API credentials and key prefixes |
| `partner.credentials.manage` | `PARTNER_ECOSYSTEM` | Create/Update | Request API key generation or secret rotation |
| `partner.customer.read` | `PARTNER_ECOSYSTEM` | Read | View partner-sourced customer records (sanitized) |
| `partner.customer.create` | `PARTNER_ECOSYSTEM` | Create | Register a new borrower through partner channel |
| `partner.application.read` | `PARTNER_ECOSYSTEM` | Read | View partner-sourced loan application status |
| `partner.application.create` | `PARTNER_ECOSYSTEM` | Create | Draft a new partner-sourced loan application |
| `partner.application.update` | `PARTNER_ECOSYSTEM` | Update | Update draft application details |
| `partner.application.submit` | `PARTNER_ECOSYSTEM` | Submit | Submit completed partner application for review |
| `partner.document.read` | `PARTNER_ECOSYSTEM` | Read | List uploaded application documents |
| `partner.document.upload` | `PARTNER_ECOSYSTEM` | Create | Upload required borrower verification documents |
| `partner.offer.read` | `PARTNER_ECOSYSTEM` | Read | View sanctioned loan offer and KFS details |
| `partner.offer.accept` | `PARTNER_ECOSYSTEM` | Update | Assist borrower in recording offer acceptance |
| `partner.loan.read` | `PARTNER_ECOSYSTEM` | Read | Track active loan accounts originated by partner |
| `partner.repayment.read` | `PARTNER_ECOSYSTEM` | Read | View loan repayment schedule and payment history |
| `partner.credit_limit.read` | `PARTNER_ECOSYSTEM` | Read | View revolving credit limit utilization |
| `partner.drawdown.create` | `PARTNER_ECOSYSTEM` | Create | Initiate credit line drawdown request |
| `partner.commissions.read` | `PARTNER_ECOSYSTEM` | Read | Inspect earned commissions and payout status |
| `partner.webhook.manage` | `PARTNER_ECOSYSTEM` | Manage | Configure webhook endpoints and test pings |
| `partner.reporting.read` | `PARTNER_ECOSYSTEM` | Read | View sourcing conversion metrics and analytics |

### 2.2 Normalized Partner Roles

1. **`PARTNER_ADMIN`**:
   - Executive administrator of the partner entity.
   - Capabilities: Manage API credentials, webhook endpoints, company settings, reports, and staff users.
   - Restrictions: No access to internal credit policies, underwriting committee, GL postings, or disbursement execution.
2. **`PARTNER_OPERATIONS`**:
   - Operational manager coordinating sourcing pipeline.
   - Capabilities: Application intake, document uploads, tracking approvals, and assisting offer acceptance.
   - Restrictions: No access to API secrets, webhook configuration, or payout execution.
3. **`PARTNER_AGENT`**:
   - Front-line field sourcing or digital intake agent.
   - Capabilities: Customer registration, application drafting, document collection.
4. **`PARTNER_FINANCE`**:
   - Partner accounting and settlements officer.
   - Capabilities: Commission statement inspection, payout batch tracking, reconciliation logs.
   - Restrictions: Cannot self-approve or execute payout settlements.
5. **`PARTNER_SUPPORT`**:
   - Customer servicing desk agent.
   - Capabilities: Read-only access to customer-safe application status and repayment schedule.
6. **`PARTNER_API_CLIENT`**:
   - Machine-to-machine service principal authenticated via hashed API keys.
   - Capabilities: Bounded strictly to explicit scopes granted during credential issuance.

---

## 3. Data Sanitization & Projection Layer

To eliminate information asymmetry and protect internal proprietary credit and risk intelligence, all responses served through `/api/v1/partner-*` routes are filtered through `partnerFortificationService`.

### 3.1 Terminology & Projection Translation Matrix

| Internal / Backend Entity | Partner-Safe Projection | Handling / Masking Strategy |
| :--- | :--- | :--- |
| `pan: "ABCDE1234F"` | `maskedPan: "ABXXXXXX4F"` | Only first 2 and last 2 characters visible |
| `aadhaar: "123456789012"` | `maskedAadhaar: "XXXXXXXX9012"` | Only last 4 digits visible |
| `mobile: "9876543210"` | `maskedPhone: "******3210"` | Only last 4 digits visible |
| `bankAccountNo: "50100234567890"` | `maskedBankAccount: "********7890"` | Only last 4 digits visible |
| `breRuleResults: [...]` | **PURGED (Not Present)** | Proprietary credit rule definitions completely stripped |
| `breEvaluationTrace: {...}` | **PURGED (Not Present)** | FOIR, DTI, and internal calculations stripped |
| `internalRiskScore: 785` | **PURGED (Not Present)** | Institutional risk score stripped |
| `fraudRiskScore: 15` | **PURGED (Not Present)** | Fraud model output stripped |
| `fraudSyndicateSignals: [...]` | **PURGED (Not Present)** | Consortium signals stripped |
| `underwriterRemarks: "..."` | **PURGED (Not Present)** | Internal committee discussions stripped |
| `makerUserId` / `checkerUserId` | **PURGED (Not Present)** | Internal employee identities protected |
| `glDebitAccount` / `glCreditAccount` | **PURGED (Not Present)** | Internal general ledger architecture protected |
| `status: "DECISION"` | `partnerSafeStatus: "APPLICATION_UNDER_REVIEW"` | Clear, standardized lifecycle terminology |
| `status: "APPROVED"` | `partnerSafeStatus: "OFFER_AVAILABLE"` | Clear indication of next borrower action |
| `status: "OFFER_ACCEPTED"` | `partnerSafeStatus: "AGREEMENT_PENDING"` | Actionable indicator for contract signing |

---

## 4. API Credential Lifecycle & Rate Limiting

```
[ LENDER ADMIN ] 
       │
       ▼ POST /api/v1/partners/:id/credentials
 ┌────────────────────────────────────────────────────────┐
 │ Status: ACTIVE                                         │
 │ - apiKey generated (pk_live_...)                      │
 │ - secret generated and hashed (SHA-256)                │
 │ - plainSecret returned ONCE during creation            │
 └─────────────────────────┬──────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │ POST .../rotate                       │ POST .../revoke
       ▼                                       ▼
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │ Status: ACTIVE (Rotated)  │   │ Status: REVOKED           │
 │ - New secret generated    │   │ - Permanently deactivated │
 │ - Old secret invalidated  │   │ - All API calls rejected  │
 │ - updatedAt stamped       │   │ - revokedAt stamped       │
 └───────────────────────────┘   └───────────────────────────┘
```

1. **Storage Security**: Secrets are hashed using `crypto.createHash('sha256')`. Raw secrets are never stored in the database or cache.
2. **Scope Allow-List**: Every API request is verified against the credential's explicit scope list (`requirePartnerScope('partner.application.submit')`).
3. **Rate Limiting**: Tenant- and partner-scoped token bucket rate limiting prevents API abuse and denial-of-service attempts.
4. **Idempotency**: All mutation endpoints require an `Idempotency-Key`. The request payload is hashed with SHA-256; replaying an identical key with a different payload returns HTTP 409 Conflict.

---

## 5. Commercials & Commission Engine (`Decimal.js`)

All partner financial calculations are performed using `Decimal.js` to ensure zero rounding discrepancies:

```
Total Pre-Tax Commission = (DisbursedAmount * (SourcingFeePct + DisbursementPct) / 100) + FlatFee
Tax Amount (GST)         = Total Pre-Tax Commission * (18.0 / 100)
Net Payable Commission   = Total Pre-Tax Commission + Tax Amount
```

### Maker-Checker Bridge for Payouts
1. Partner payouts can never be triggered directly by partner users.
2. An authorized lender `FINANCE_OFFICER` submits a payout batch proposal.
3. The proposal enters `financialControlService.createFinancialTask` with status `PENDING_CHECKER`.
4. Segregation of Duties (SoD) prevents the maker from self-approving the payout task.

---

## 6. Co-Lending Boundary Allocation Architecture (RBI CLM Model)

Under the RBI Co-Lending Model (CLM), loans are jointly originated between an institutional bank/lender and an NBFC/sourcing partner:

- **Principal Allocation**: `sanctionedAmount * (lenderSharePct / 100)`
- **Partner Allocation**: `sanctionedAmount * (partnerSharePct / 100)`
- **Reconciliation Invariant**: `lenderShare + partnerShare === sanctionedAmount`

The engine validates that calculations on odd fractions (e.g. ₹333,333.33) allocate precise shares to the exact cent without penny leakage.
