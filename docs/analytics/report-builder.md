# Dynamic Report Builder & Saved Reports

## 1. Safe Dimension & Metric Slicing
The report builder allows authorized users to slice institutional datasets without exposing raw SQL or arbitrary filter execution.

### Whitelisted Dimensions
- `TENANT`
- `BRANCH`
- `PRODUCT`
- `CHANNEL`
- `PARTNER`
- `RISK_GRADE`
- `LOAN_STATUS`
- `DPD_BUCKET`
- `MONTH`
- `STAFF`

### Whitelisted Metrics
- `APPLICATION_COUNT`
- `APPROVAL_RATE`
- `REQUESTED_AMOUNT`
- `APPROVED_AMOUNT`
- `DISBURSED_AMOUNT`
- `OUTSTANDING_PRINCIPAL`
- `OVERDUE_AMOUNT`
- `COLLECTED_AMOUNT`
- `COLLECTION_EFFICIENCY`
- `INTEREST_INCOME`
- `FEE_INCOME`
- `COMMISSION_AMOUNT`
- `PTP_FULFILLMENT_RATE`

---

## 2. Saved Reports Governance
Users can save report queries with three distinct visibility tiers:
- **PRIVATE**: Visible only to the report owner and Super Administrators.
- **TEAM**: Shared with staff in the same department/branch.
- **TENANT**: Available to all authorized employees within the institution.
