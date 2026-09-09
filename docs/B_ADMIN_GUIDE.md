# ADYAPAN LENDING PLATFORM — ADMINISTRATOR GUIDE

## 1. Multi-Tenant Administration
- **Institutional Onboarding**: Navigate to `/client-onboarding` to initiate and track the 16-point commercial setup checklist.
- **Tenant Isolation**: Each institution operates with dedicated branding, custom domains, distinct integration keys, and custom underwriting policies.

---

## 2. Dynamic RBAC & Segregation of Duties (SoD)
- **Granular Permission Catalog**: 28 distinct permissions across Applications, Underwriting, Disbursements, Collections, and Settings.
- **Statutory SoD Rules**:
  - `MAKER_CHECKER_DISBURSEMENT`: Users who initiate payout orders (`DISBURSEMENTS_INITIATE_PAYOUT`) cannot approve payout executions (`DISBURSEMENTS_APPROVE_MAKER_CHECKER`).
  - `UNDERWRITER_DISBURSER_SEPARATION`: Users who approve credit sanctions cannot disburse funds to borrower accounts.

---

## 3. Product Catalog & Statutory Key Fact Statements (KFS)
- **Product Parameters**: Loan amount bounds, tenure limits, reducing-balance base interest rates, and processing fee percentages.
- **Statutory KFS Generation**: Complies with Reserve Bank of India (RBI) digital lending guidelines:
  - Annual Percentage Rate (APR) breakdown
  - Cooling-off / look-up cancellation window (minimum 3 business days)
  - Prepayment and foreclosure penalty ceilings

---

## 4. Dynamic Workflow Engine
- **Stage Definitions**: Origination, Document Verification, Bureau Check, Risk Assessment, Underwriting Approval, Sanction Letter Acceptance, Disbursement Execution, and Repayment Servicing.
- **Transition Gates**: Mandatory automated policy criteria (e.g. CIBIL >= 650, FOIR <= 65%, DPDP Consent Signed) before application transition.
