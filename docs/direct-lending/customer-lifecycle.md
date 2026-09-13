# Customer Lifecycle Architecture

## 1. Deterministic Lifecycle States

```
NEW
 │ Customer registers with basic contact details
 ▼
PROFILE_INCOMPLETE
 │ Personal, employment, address, or banking data missing
 ▼
KYC_PENDING
 │ Aadhaar / PAN / Identity proofs submitted, awaiting verification
 ▼
KYC_VERIFIED
 │ Documents digitally verified; eligible to discover loan schemes
 ▼
ELIGIBILITY_PENDING
 │ Application submitted and undergoing automated BRE credit assessment
 ▼
ELIGIBLE
 │ Loan offer approved and awaiting digital acceptance / eSign
 ▼
ACTIVE_BORROWER
 │ Loan disbursed and currently in active repayment servicing
 ▼
REPEAT_BORROWER
 │ Historical loans successfully settled with clean track record
 ▼
CREDIT_LINE_CUSTOMER
 │ Revolving credit facility active with ongoing drawdowns and repayments
```

---

## 2. Personalized Next Action Engine
The `CustomerLifecycleService.deriveNextAction` endpoint inspects the borrower's state and returns the top priority action:
1. `PAY_EMI` (Overdue or upcoming installments take top priority)
2. `SIGN_AGREEMENT` (Pending eSign on approved offers)
3. `REVIEW_OFFER` (Approved offers awaiting acceptance)
4. `COMPLETE_KYC` (Unverified KYC)
5. `VERIFY_BANK` (Missing disbursement account)
6. `APPLY_REPEAT_LOAN` (Eligible zero-DPD repeat borrowers)
7. `CHECK_ELIGIBILITY` (Default discovery)
