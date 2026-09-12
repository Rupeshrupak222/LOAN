# Recovery, Debt Settlement & Controlled Write-Offs

## 1. Debt Settlement & Waiver Governance

For distressed borrowers, the system supports One-Time Settlements (OTS) with strict Maker-Checker dual control:

```
Collector / Officer (Maker)
  └─ Evaluates borrower financial hardship
  └─ Proposes settlement amount & requested waivers (Principal, Interest, Penalties)
  └─ Status set to PENDING_APPROVAL

Supervisor / Credit Authority (Checker)
  └─ Verifies audit trail & documentary proof
  └─ Enforces SoD (cannot approve own proposal)
  └─ Approves settlement with validity window (e.g. 15–30 days)

Payment Received
  └─ Payment allocated to agreed settlement amount
  └─ Automatic General Ledger (GL) Journal Entry posted for waived debt
  └─ Loan & Case status transitioned to CLOSED / SETTLED
```

---

## 2. Double-Entry General Ledger (GL) Integration

Every debt waiver or write-off generates a balanced Double-Entry GL Journal Entry ($\sum \text{Debits} \equiv \sum \text{Credits}$):

### Settlement Waiver Journal:
- **Debit**: `5030` — Bad Debts Written Off Expense (Total Waiver Amount)
- **Credit**: `1020` — Loans & Advances to Customers (Principal Haircut)
- **Credit**: `1040` — Interest Accrued and Due (Waived Interest)
- **Credit**: `1050` — Penalties & Late Fees Receivable (Waived Late Fees)

### Bad Debt Charge-Off (Write-Off) Journal:
- **Debit**: `5030` — Bad Debts Written Off Expense (Total Bad Debt Balance)
- **Credit**: `1020` — Loans & Advances to Customers (Gross Principal Charged-Off)
- **Credit**: `1040` — Interest Accrued and Due (Accrued Interest Balance)
- **Credit**: `1050` — Penalties & Late Fees Receivable (Unpaid Penalties)
