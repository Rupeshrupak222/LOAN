# Phase 11: Advanced Collections & Recovery Engine

## 1. System Overview

The **Collections & Recovery Management Platform** in Adyapan Lending OS orchestrates the end-to-end delinquency, outreach, assignment, promise tracking, settlement, and write-off lifecycle post-loan disbursement. 

It powers both:
1. **M2P-Style B2B Lender Infrastructure**: High-volume, tenant-isolated delinquency management across multiple co-lending banks, partner NBFCs, and DSA recovery networks.
2. **mPokket-Style Direct Digital Lending**: Real-time DPD tracking, automated conversational payment links, self-service promise-to-pay (PTP) recording, and instant debt resolution.

```
Loan / Credit Facility
        ↓
Repayment Schedule (Due Dates)
        ↓
Deterministic DPD Engine (0–180+ DPD & Aging Buckets)
        ↓
Multi-Factor Strategy Engine (0–100 Priority Scoring & SLA Governance)
        ↓
Collector Work Queues & Auto-Assignment (Round-Robin / Workload Balanced)
        ↓
Multi-Channel Contact History & Customer Signals
        ↓
Promise to Pay (PTP) & Broken Promise Automation
        ↓
Phase 10 Payment Engine Hook (Automatic PTP Fulfillment & Loan Curing)
        ↓
Multi-Tier Escalation Desk (Tier 1 → Tier 2 → Tier 3 → Tier 4 Legal)
        ↓
Controlled Debt Settlements & Write-Offs (Maker-Checker & Double-Entry GL)
```

---

## 2. Core Architecture Invariants

1. **Non-Duplication of Financial Engines**: Collections does **not** maintain a separate payment gateway, balance calculator, or ledger. All balance adjustments, repayments, and accounting movements strictly delegate to Phase 10 Payment, Allocation, and Double-Entry General Ledger (GL) services.
2. **Deterministic DPD Authority**: Days Past Due is computed deterministically from the oldest unpaid overdue schedule installment (`dueDate < now` and `outstanding > 0`).
3. **Pure Decimal Financial Accuracy**: All debt haircuts, waiver calculations, and write-off sums use `Decimal.js` to eliminate binary floating-point rounding errors.
4. **Maker-Checker & Segregation of Duties (SoD)**: Proposers of debt settlements or write-offs cannot approve their own requests.
5. **Redacted Safe Views**: Internal priority scores, fraud scores, and collector notes are strictly redacted from borrower and partner APIs.
