# ADYAPAN LENDING OS — FINANCIAL CONTROL ARCHITECTURE (P5)

## 1. Executive Summary & Financial Safety Paradigm

In **Adyapan Lending OS**, financial mutations (disbursements, payouts, payments, debt settlements, bad debt write-offs, manual GL journals, refunds, and fee/interest adjustments) are governed by the authoritative **`FinancialControlService`**. 

No financial mutation can execute without passing through the complete security, authority, dual-control, anti-tampering, idempotency, and double-entry GL chain:

```text
REQUEST
   ↓
AUTHENTICATION
   ↓
CANONICAL PERMISSION (P2 domain.action)
   ↓
SERVER-DERIVED SCOPE (P2 ScopeResolver)
   ↓
WORKFLOW STATE (P4 WorkflowTransitionService)
   ↓
FINANCIAL VALIDATION (Beneficiary KYC, Inactive Account Guard)
   ↓
AUTHORITY LIMIT (ApprovalAuthority Level 1 - Level 4)
   ↓
SoD / MAKER-CHECKER (Maker != Checker, Dual-Control Payout)
   ↓
APPROVAL SNAPSHOT & SHA-256 FINGERPRINT
   ↓
IDEMPOTENCY (Tenant & Payload Scoped)
   ↓
CONCURRENCY CHECK (Optimistic Lock)
   ↓
EXECUTION (Domain Service / Sandbox Provider)
   ↓
DOUBLE-ENTRY GL (Total Debits == Total Credits via Decimal.js)
   ↓
IMMUTABLE AUDIT LOG (AuditLog)
```

---

## 2. Financial Operation Inventory & Risk Classification

All financial mutations are strictly categorized into risk tiers:

| Operation Key | Description | Risk Classification | Required Authority | Maker-Checker Required? |
| :--- | :--- | :--- | :--- | :--- |
| **`DISBURSEMENT`** | Release of loan principal to borrower bank account | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (UW) / Level 3 (Credit Head) | **Yes** (Finance Officer != Loan Approver) |
| **`PAYOUT`** | Direct bank IMPS/NEFT payout execution | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** (Checker signoff required) |
| **`SETTLEMENT_APPROVE`** | Concession / waiver on delinquent loan recovery | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (UW) / Level 3 (Credit Head) | **Yes** (Collections Maker != Checker) |
| **`WRITEOFF_APPROVE`** | Bad debt write-off on DPD 90+ NPA loan | `HIGH_RISK_FINANCIAL_MUTATION` | Level 3 (Credit Head) / Level 4 (Board) | **Yes** (Collections Maker != Checker) |
| **`MANUAL_JOURNAL_POST`** | Direct double-entry GL ledger journal posting | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** (Accounting Maker != Checker) |
| **`PAYMENT_REVERSAL`** | Non-destructive compensating reversal of payment | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** (Reversal Maker != Checker) |
| **`REFUND`** | Returning unallocated or excess borrower cash | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** (Checker signoff required) |
| **`SUSPENSE_CLEARING`** | Clearing unmatched funds from suspense accounts | `HIGH_RISK_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** (Accounting Maker != Checker) |
| **`PAYMENT_RECORD`** | Ingesting offline cash/cheque repayment | `SENSITIVE_FINANCIAL_MUTATION` | Level 1 (Branch Manager) | **Yes** |
| **`FEE_ADJUSTMENT`** | Manual waiver or surcharge on fee ledger | `SENSITIVE_FINANCIAL_MUTATION` | Level 2 (Finance Officer) | **Yes** |
| **`INTEREST_ADJUSTMENT`**| Interest rebate or accrual correction | `SENSITIVE_FINANCIAL_MUTATION` | Level 2 (Underwriter / Finance) | **Yes** |
| **`SCHEDULED_MANDATE`** | Automated e-NACH mandate debit | `LOW_RISK_FINANCIAL_MUTATION` | System automated | No (System-executed) |
| **`BORROWER_REPAYMENT`** | Self-serve UPI/Netbanking payment by borrower | `LOW_RISK_FINANCIAL_MUTATION` | Customer token | No (Automated gateway) |

---

## 3. Dual-Control Maker-Checker & SoD Invariants

1. **Maker != Checker Separation**:
   - The user who creates a financial proposal (`task.makerId`) cannot approve or sign off on it (`checker.id`).
   - Self-approval attempts are intercepted and thrown as `Maker-Checker conflict`.
2. **Dual Control on Disbursement**:
   - The underwriter who approves the credit sanction cannot be the officer releasing disbursement funds.
3. **Auditor Read-Only Lockdown**:
   - Users with `AUDITOR` or `OPERATIONS_VIEWER` roles are rejected with `403 FORBIDDEN` from initiating, approving, or executing any financial task.

---

## 4. Multi-Level Authority Matrix Integration

Financial approval authority is strictly gated by transaction amount tiers:

| Authority Tier | Permitted Roles | Max Single Exposure | Jurisdiction Scope | Escalation Target |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | `BRANCH_MANAGER` | ₹5,00,000 | Branch Local | Level 2 (Underwriter) |
| **Level 2** | `UNDERWRITER`, `SENIOR_UNDERWRITER`, `FINANCE_OFFICER` | ₹25,00,000 (UW) / ₹1,00,00,000 (FO) | Tenant Network | Level 3 (Credit Head) |
| **Level 3** | `CREDIT_HEAD`, `COMPANY_ADMIN` | ₹1,00,00,000 | Tenant Network | Level 4 (Board Committee) |
| **Level 4** | `SUPER_ADMIN`, Board Credit Committee | Unlimited (> ₹1,00,00,000) | Enterprise Wide | N/A |

---

## 5. Cryptographic Approval Fingerprinting & Anti-Tampering

To prevent man-in-the-middle attacks, client-side payload modification, or parameter tampering between checker approval and execution:

```typescript
const dataHash = crypto.createHash('sha256').update(JSON.stringify({
  tenantId: task.tenantId,
  branchId: task.branchId,
  resourceType: task.resourceType,
  resourceId: task.resourceId,
  operation: task.operation,
  amount: new Decimal(task.amount).toFixed(2),
  currency: task.currency,
  beneficiary: {
    accountNumber: task.beneficiary.accountNumber,
    ifsc: task.beneficiary.ifsc,
    upiId: task.beneficiary.upiId,
  },
  fees: new Decimal(task.fees).toFixed(2),
  tax: new Decimal(task.tax).toFixed(2),
  makerId: task.makerId,
  authorityPolicyVersion: 'v1.0'
})).digest('hex');
```

At execution time, the incoming execution payload is hashed and compared against `task.approvalDataHash`. Any variance (e.g. ₹50,000 modified to ₹5,00,000 or account number swapped) causes immediate rejection with `409 FINANCIAL_DATA_TAMPERED`.

---

## 6. Stale Approval & Expiry Protection

- High-risk financial approvals have a mandatory **24-hour Time-To-Live (TTL)**.
- Sensitive financial proposals have a **48-hour TTL**.
- Expired tasks transition to `EXPIRED` status and cannot be executed; a fresh maker-checker review cycle is enforced.

---

## 7. Tenant-Scoped Idempotency Guarding

All financial mutations require an `Idempotency-Key` header:
- Keys are scoped to `tenantId:operation:key`.
- An incoming request with a previously executed key and identical payload returns the cached result without duplicate execution.
- An incoming request reusing an existing key with altered financial amounts throws `409 IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH`.

---

## 8. Double-Entry GL Balance & Fiscal Period Protection

1. **Balance Invariant**:
   - Every manual journal, disbursement, payment, settlement, and write-off must verify `sum(Debits) === sum(Credits)` with `Decimal.js` before database commit.
   - Any imbalance throws `400 GL_IMBALANCE_REJECTED`.
2. **Closed Period Protection**:
   - Financial mutations cannot be backdated or posted into closed accounting periods. Verified via `accountingPeriodService.assertPeriodOpenForDate`.
3. **Historical Immutability**:
   - Financial records are never deleted; adjustments and corrections use auditable compensating reversal entries.
