# Product Engine Architecture

The **Adyapan Lending OS Product Engine** transitions the platform from hardcoded loan parameters to a multi-tenant, configurable, version-aware lending product system inspired by enterprise platforms such as M2P Fintech.

```text
TENANT
  │
  └── PRODUCT (Identity, Status: DRAFT | ACTIVE | INACTIVE | ARCHIVED, Version)
       │
       ├── Amount Configuration (Min, Max, Increment, Default)
       ├── Tenure Configuration (Min, Max, Allowed Tenures)
       ├── Interest Configuration (Flat, Reducing Balance, Floating MCLR)
       ├── Fee Schedule (Processing Fee, Documentation, Platform Fee, Taxes)
       ├── Penalty Configuration (Late Payment %, Bounce Charges, Grace Period)
       ├── Eligibility Configuration (Age, Income, Employment Types, Segments)
       ├── Document Requirements (Mandatory & Optional KYC/Income Proofs)
       ├── Credit Policy (Min CIBIL Score, Max FOIR %, Max DTI %)
       ├── Risk Policy (Risk Grade, Max Fraud Score, Penny Drop, Liveness)
       ├── Approval Authority (BM Limit, Credit Analyst Limit, UW Limit)
       ├── Channels (Borrower Direct, Loan Officer, Branch, Partner, API)
       └── Workflow Binding (Workflow Definition ID & Version)
            │
            └── LOAN APPLICATION & SANCTION (Version Snapshot at Origination)
```

---

## 1. Product Identity & Lifecycle State Machine

Each lending product is uniquely identified within a tenant organization:

- **Unique Constraint:** `(tenantId, code)`
- **Lifecycle States:**
  1. `DRAFT`: Initial creation state where parameters, policies, and fees are configured without affecting live borrowers.
  2. `ACTIVE`: The product is verified against mandatory activation rules and open for application intake across enabled channels.
  3. `INACTIVE`: Temporarily paused for new originations. Existing active loans and historical applications continue repayment and servicing normally.
  4. `ARCHIVED`: Historical record permanently retired. Preserved for regulatory audits and historical ledger reconciliation. Deletion is blocked if loans or applications are attached.

### Activation Validation Guard
Transition from `DRAFT` to `ACTIVE` requires:
- `minAmount <= maxAmount` with `minAmount > 0`
- `minTenureMonths <= maxTenureMonths` with `minTenureMonths > 0`
- `baseInterestRateAnnualPct >= 0`
- Valid `feeSchedule` configured
- `minMonthlyIncome > 0` and age limits set
- At least one mandatory KYC/income document requirement assigned
- `minCibilScore` defined in credit policy
- Valid tenant-scoped `workflowId` assigned

---

## 2. Supported Product Types

The Product Engine natively supports extensible loan categories:

| Product Type | Identifier | Primary Use Case |
| :--- | :--- | :--- |
| **Personal Loan** | `PERSONAL_LOAN` | Standard unsecured term loans for salaried/professional borrowers |
| **Instant Personal Loan** | `INSTANT_PERSONAL_LOAN` | Straight-through-processing (STP) digital loans with AA & DigiLocker |
| **Salary Loan** | `SALARY_LOAN` | Short-term salary advance against payroll integration |
| **SME Business Loan** | `BUSINESS_LOAN` | Working capital and equipment term loans for GST-registered MSMEs |
| **Merchant Cash Advance** | `MERCHANT_LOAN` | Daily POS card & UPI settlement recovery lines |
| **Credit Line** | `CREDIT_LINE` | Revolving credit line with drawdown and repayment schedules |
| **BNPL** | `BNPL` | Zero-cost merchant checkout installment lines |
| **Education Loan** | `EDUCATION_LOAN` | Student and skill-advancement tuition financing |

---

## 3. Product Versioning & Historical Snapshot Strategy

When an administrator modifies an `ACTIVE` product:
1. The current configuration is captured as an immutable historical snapshot:  
   `historicalSnapshots: Map<"${tenantId}:${productId}:v${version}", LendingProduct>`
2. The product's `version` increments by 1.
3. Historical loan applications and active loans maintain their link to the snapshot active at their origination date. Future fee or interest rate changes never silently alter historical loan obligations.

---

## 4. Statutory Pricing Simulation & RBI Key Fact Statement (KFS)

The Product Engine includes an RBI-compliant pricing simulator:

### 4.1 Interest & EMI Calculation
- **Reducing Balance Method:** Standard annuity formula:
  $$EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$$
- **Fixed Flat Method:** Equal distribution of total interest across all tenure months.

### 4.2 Statutory Annual Percentage Rate (APR)
Calculated via Newton-Raphson internal rate of return (IRR) approximation factoring in all upfront processing fees, documentation charges, and 18% GST against net disbursement:
$$\text{Net Disbursed} = \sum_{t=1}^{n} \frac{EMI}{(1 + r_{\text{eff}})^t}$$
$$\text{APR} = r_{\text{eff}} \times 12 \times 100$$

### 4.3 Key Fact Statement (KFS)
Generates transparent borrower disclosure statements containing:
- Sanction Amount
- Rate of Interest Type & Applied Rate %
- Monthly Installment & Total Repayment
- Breakdown of Processing & Documentation Fees with GST
- Foreclosure Terms & Lock-in Periods
- Overdue Penalty Schedules & Grace Period Days
- Cooling-off Period (3 business days)

---

## 5. REST API Specifications

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/loan-products` | List products with status, type, channel, and search filters | Authenticated |
| `GET` | `/api/v1/loan-products/:id` | Get full product configuration breakdown | Authenticated |
| `POST` | `/api/v1/loan-products` | Create product in `DRAFT` status | Admin / SuperAdmin |
| `PUT` | `/api/v1/loan-products/:id` | Update configuration (versions if active) | Admin / SuperAdmin |
| `POST` | `/api/v1/loan-products/:id/activate` | Validate and transition to `ACTIVE` | Admin / SuperAdmin |
| `POST` | `/api/v1/loan-products/:id/deactivate` | Deactivate for new originations | Admin / SuperAdmin |
| `POST` | `/api/v1/loan-products/:id/archive` | Archive product safely | Admin / SuperAdmin |
| `POST` | `/api/v1/loan-products/simulate-pricing`| Calculate EMI, statutory APR, KFS & FOIR | Authenticated |
