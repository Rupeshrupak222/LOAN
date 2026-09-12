# RBI Digital Lending Guidelines Compliance Architecture

## Regulatory Reference
- **RBI Circular:** Guidelines on Digital Lending (RBI/2022-23/111 DOR.CRE.REC.66/21.07.001/2022-23)
- **Applicability:** All Regulated Entities (REs) — Commercial Banks, NBFCs, and Lending Service Providers (LSPs).

---

## 1. Key Fact Statement (KFS) Standardization

Adyapan Lending OS enforces mandatory generation and borrower consent of the Key Fact Statement prior to contract execution:

| KFS Field | Regulatory Purpose | Platform Implementation |
|:---|:---|:---|
| **Loan Sanction Amount** | Gross facility sanctioned | Explicit currency value (e.g. ₹1,50,000) |
| **Annual Percentage Rate (APR)** | True all-inclusive cost of credit | Dynamically computed factoring nominal interest rate, processing fee, and 18% GST |
| **Recovery / Processing Fees** | Upfront deductions | Broken down into Processing Fee + GST + Documentation Charges |
| **Net Disbursed Amount** | Actual credit transferred | Sanction Amount minus Upfront Deductions |
| **Total Amount to be Paid** | Total lifetime cashflow | Sum of all scheduled EMIs |
| **Cooling-Off / Look-up Period** | Grace exit window | Minimum 3 days for personal loans $\ge 7$ days tenure |
| **Penal Charges Disclosure** | Transparency on late payments | Stated as APR penalty on overdue principal, non-compounded |
| **Grievance Redressal Officer (GRO)** | Nodal escalation point | Name, Designation, Direct Email, Phone, and Office Address displayed prominently |

---

## 2. Customer Consent & Data Minimization

1. **Explicit Consents:**
   - Bureau pull consent obtained with timestamped audit logs.
   - Purpose-limited data access agreements.
2. **Zero Internal Jargon Leakage:**
   - Consumers never see internal risk tiers, credit score cutoffs, fraud suspicion weights, or collector notes.
   - Rejections or limitations are communicated using neutral, constructive messaging.
3. **Data Protection:**
   - PAN numbers and Aadhaar numbers are masked in all consumer-facing screens and downloaded PDFs (`ABCDE****F`, `XXXX-XXXX-1234`).
   - Secure TLS 1.3 in-transit and AES-256 at-rest encryption.

---

## 3. Direct Fund Flow Architecture

- **Disbursement:** Disbursed directly from the Regulated Entity's nodal bank account into the borrower's verified bank account without passing through third-party LSP pool accounts.
- **Repayments:** Direct settlement from borrower account via eNACH / UPI AutoPay / Gateway into the RE's repayment collection account.

---

## 4. Grievance Redressal & Ombudsman Integration

- **Turnaround SLA:** Automated 24-hour response SLA on consumer-logged tickets.
- **Escalation Matrix:** Clear instructions on escalating unresolved grievances to the RBI Ombudsman under the Reserve Bank - Integrated Ombudsman Scheme (RB-IOS).
