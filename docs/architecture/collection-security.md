# Collection Security, RBAC & Redacted Safe Views

## 1. Role-Based Access Control (RBAC)

Phase 11 registers fine-grained collections and recovery permissions:
- `collections.assign`: Assign and reallocate cases to collection officers.
- `collections.contact`: Log phone calls, SMS notifications, and field visits.
- `collections.record_ptp` / `collections.update_ptp`: Manage borrower promises to pay.
- `collections.escalate`: Route cases to higher supervisory or legal tiers.
- `collections.settlement.request` / `collections.settlement.approve`: Maker-Checker debt settlement workflows.
- `collections.writeoff.request` / `collections.writeoff.approve`: Maker-Checker loan write-off controls.
- `collections.policy.view` / `collections.policy.manage`: Strategy and rule configuration.
- `collections.analytics.view`: Delinquency migration and collector scorecard access.

---

## 2. Segregation of Duties (SoD) Invariants

The platform enforces strict cryptographic and authorization boundaries:
1. **`SOD_COLLECTOR_SETTLEMENT_APPROVER`**: The user who proposes a debt settlement waiver cannot be the same user who authorizes the settlement.
2. **`SOD_COLLECTOR_WRITEOFF_APPROVER`**: The user who proposes a bad debt write-off cannot approve the charge-off.
3. **Anti-IDOR Multi-Tenancy**: Institution-level tenant boundaries and branch scopes are verified on every collection action.

---

## 3. Redacted Safe Views

### Borrower Safe View
Exposes clear, customer-friendly outstanding amounts, installment breakdown, active PTP details, and direct Phase 10 payment links while **redacting**:
- Internal priority scores (0–100)
- Fraud anomaly indicators and risk grades
- Collector internal notes and skip-tracing records

### Partner Safe View
Exposes high-level loan delinquency status, DPD, aging bucket, and portfolio summary for co-lending partners and LSPs while **redacting**:
- Collector personal PII (email, phone, direct IDs)
- Detailed agent-borrower dispute transcripts
