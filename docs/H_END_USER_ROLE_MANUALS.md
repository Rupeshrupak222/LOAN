# ADYAPAN LENDING PLATFORM — END-USER ROLE MANUALS

## 1. Loan Officer
- **Key Responsibilities**: Sourcing borrower applications, uploading KYC documents, triggering DPDP consent requests, and monitoring pipeline stage transitions.
- **Primary Pages**: `/applications`, `/applications/new`, `/customers`.

---

## 2. Credit Analyst & Underwriter
- **Key Responsibilities**: Reviewing bureau scores (CIBIL/Experian), analyzing bank statement cashflow intelligence, evaluating FOIR/DTI capacity, assessing fraud alerts, and issuing formal credit sanctions with sanction letter generation.
- **Primary Pages**: `/underwriting`, `/fraud-intelligence`, `/decision-intelligence`.

---

## 3. Finance & Disbursement Officer
- **Key Responsibilities**: Verifying bank account penny-drop penny validations, validating Maker-Checker payout orders, initiating IMPS/NEFT/UPI gateway transfers, and monitoring settlement reconciliations.
- **Primary Pages**: `/disbursements`, `/reconciliation`, `/payments`.

---

## 4. Collection & Recovery Officer
- **Key Responsibilities**: Tracking early warning delinquency signals, monitoring DPD aging (SMA-0, SMA-1, SMA-2, NPA), recording field collections, and applying prioritized recovery payments (`Penalties` $\rightarrow$ `Fees` $\rightarrow$ `Interest` $\rightarrow$ `Principal`).
- **Primary Pages**: `/collections`, `/early-warnings`, `/loans`.

---

## 5. Compliance Auditor & Legal Officer
- **Key Responsibilities**: Verifying DPDP consent chains, inspecting cryptographic SHA-256 evidence packages, auditing permission logs, and exporting compliance reports.
- **Primary Pages**: `/compliance`, `/privacy`, `/audit-logs`.

---

## 6. Retail Borrower
- **Key Responsibilities**: Applying for loans, providing digital DPDP consent, reviewing Key Fact Statements (KFS), signing sanction terms, tracking repayments, and downloading digital No Objection Certificates (NOC) upon payoff.
- **Primary Pages**: `/dashboard`, `/loans`, `/emi-calculator`, `/payments`.
