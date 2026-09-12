# Financial Integrity & Standard Chart of Accounts

## 1. Standard Chart of Accounts Mapping

| Account Code | Account Name | Category | Normal Balance | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- |
| **`1010`** | Disbursement & Settlement Bank Account | Asset | Debit | Central nodal clearing bank account for disbursements, payouts, and collections. |
| **`1020`** | Loans & Advances to Customers (Principal Book) | Asset | Debit | Gross outstanding principal loan portfolio book. |
| **`1030`** | Interest Accrued but Not Due | Asset | Debit | Daily unbilled interest accrued on active loan portfolio. |
| **`1040`** | Interest Accrued and Due (Billed) | Asset | Debit | Overdue / billed interest receivable from borrowers. |
| **`1050`** | Penalties & Late Fees Receivable | Asset | Debit | Assessed late fees, bounce charges, and documentation fees. |
| **`2010`** | Customer Unallocated & Excess Repayment Deposits | Liability | Credit | Surplus borrower funds awaiting waterfall allocation or refund. |
| **`2020`** | Statutory GST Payable (18%) | Liability | Credit | Goods and Services Tax collected on origination fees and charges. |
| **`2030`** | Partner Commission Payable | Liability | Credit | Accrued origination commissions payable to lending partners and DSAs. |
| **`3010`** | Lending Capital & Retained Reserves | Equity | Credit | Tier-1 capital and institutional reserves funding the loan book. |
| **`4010`** | Interest Income on Loans | Income | Credit | Core lending yield recognized on active and standard loans. |
| **`4020`** | Loan Processing Fee Income | Income | Credit | Upfront origination fee income earned upon loan disbursement. |
| **`4030`** | Late Payment & Default Charges Income | Income | Credit | Penal interest and cheque bounce fee income collected. |
| **`5010`** | Gateway & Payment Processing Fee Expense | Expense | Debit | Interchange, PG gateway fees, and payout platform charges. |
| **`5020`** | NPA & Credit Loss Provision Expense | Expense | Debit | Statutory loan loss provisioning expense as per RBI prudential norms. |
| **`5030`** | Bad Debts Written Off Expense | Expense | Debit | Unrecoverable principal balances written off. |
| **`5040`** | Partner Origination Commission Expense | Expense | Debit | Channel partner and sourcing DSA payout commission expense. |

---

## 2. Invariant Double-Entry Validation

Every journal entry created in `GeneralLedgerService` executes strict debit-equals-credit invariant checking:

$$\left| \sum \text{Debits} - \sum \text{Credits} \right| \le 0.001$$

If any journal entry has an imbalance, a `BadRequestError` is thrown, preventing corrupted financial entries from being committed to the database.
