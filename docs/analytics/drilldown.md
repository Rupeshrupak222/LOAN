# Interactive Drill-Down Pathways

## 1. Drill-Down Mappings

### A. Portfolio Exposure
```
Total Outstanding Portfolio AUM
  ↳ Breakdown by Product (e.g., Personal Loan Express)
      ↳ Breakdown by Branch (e.g., Mumbai Central Flagship)
          ↳ Individual Active Loan Account (/loans/:id)
              ↳ Repayment Ledger & Amortization Schedule
```

### B. Credit Conversion Funnel
```
Origination Pipeline (e.g., 78.4% Approval Rate)
  ↳ Decision Breakdown (Approve, Conditions, Refer, Reject)
      ↳ Top Policy Rejection Reasons (e.g., FOIR ceiling exceeded)
          ↳ Underlying Loan Application (/applications/:id)
```

### C. Delinquency & DPD Migration
```
Gross NPA & PAR 30 Ratio
  ↳ DPD Aging Bucket (e.g., 31-60 DPD / SMA-1)
      ↳ Collection Case Dossier (/collections)
          ↳ Promise-to-Pay (PTP) Commitment & Field Recovery Logs
```

---

## 2. Filter & Scope Preservation
All drill-down interactions preserve the active date range (`TODAY`, `LAST_30_DAYS`, `THIS_FINANCIAL_YEAR`), product scope, and branch role boundaries.
