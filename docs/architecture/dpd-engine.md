# DPD Engine & Aging Bucket Classification

## 1. DPD Calculation Model

Days Past Due (DPD) measures the continuous elapsed delinquency of an account since the earliest unpaid installment was due.

$$\text{DPD} = \max\left(1, \left\lfloor \frac{\text{Current Date} - \text{Oldest Overdue Due Date}}{86,400,000 \text{ ms}} \right\rfloor\right)$$

If an account has no overdue installments (`outstanding == 0` for all $dueDate < now$), the authoritative DPD is `0`.

---

## 2. Standard Aging Buckets

Adyapan Lending OS maps calculated DPD to standardized industry aging buckets:

| Aging Bucket | DPD Range | Classification / Regulatory Status | Primary Operational Strategy |
| :--- | :--- | :--- | :--- |
| **`0-30`** | $1 - 30$ | Standard / Early Delinquency | Digital Reminders (SMS, Push, In-App) |
| **`31-60`** | $31 - 60$ | SMA-1 (Special Mention Account 1) | Collector Assignment & Phone Outreach |
| **`61-90`** | $61 - 90$ | SMA-2 (Special Mention Account 2) | Supervisor Escalation & Field Visits |
| **`91-180`** | $91 - 180$ | NPA Substandard | Specialized Recovery & Legal Demand Notices |
| **`180+`** | $181+$ | NPA Doubtful / Loss Asset | One-Time Settlement (OTS) or Bad Debt Write-Off |

---

## 3. Delinquency Curing

When an incoming payment is allocated across overdue installments via the Phase 10 Payment Engine:
1. `resolveCollectionCasesOnPayment(loanId)` checks if any overdue installments remain.
2. If all past due installments are satisfied, the case status moves to `RESOLVED`, `dpd` is reset to `0`, and `overdueAmount` is set to `0`.
