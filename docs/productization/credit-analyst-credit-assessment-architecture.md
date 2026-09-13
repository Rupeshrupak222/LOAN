# Architecture: Credit Analyst Portal & Credit Assessment Workspace

## 1. Overview & Role Definition
The **Credit Analyst is the Credit Assessment & Verification Owner** in the ADYAPAN Lending OS.
- **Mandate**: Structured credit assessment, debt capacity analysis (FOIR/DTI), bureau analysis, dynamic document verification, discrepancy identification, and structured recommendation (`credit.recommend`).
- **Strict Boundary**: The Credit Analyst is **NOT** an Underwriter or Approval Authority. `credit.recommend` is an advisory recommendation and **NEVER** an approval or sanction decision.

---

## 2. Flat Sidebar Navigation
The Credit Analyst navigation is flat and self-explanatory without nested menus:
1. **Dashboard** (`/dashboard`): Operational credit work desk with live KPI counters (Pending Assessments, Verified, SLA, Risk distribution).
2. **Credit Assessment / Queue** (`/credit-assessment`): Interactive work queue and 6-step assessment desk.
3. **Applications** (`/applications`): Permitted application pipeline.
4. **Customers** (`/customers`): Customer profiles and verification records.
5. **Returned Applications** (`/returned-applications`): Applications sent back to Loan Officers for documentation/evidence correction.
6. **Tasks Desk** (`/tasks`): Actionable tasks assigned to the analyst.
7. **Support & Inquiries** (`/support`): Operational support and clarification tickets.

---

## 3. Strict RBAC & Segregation of Duties (SoD)
### Permitted Capabilities
- `credit.view`
- `credit.assess`
- `credit.recommend`
- `application.review`
- `underwriting.bureau_view`
- `customer.view`
- `task.view`

### Strictly Forbidden Capabilities (Backend Enforced)
- Final underwriting decision (`underwriting.decide`)
- Sanction approval / Exception overrides (`application.approve`, `underwriting.override`)
- Disbursement and payout execution (`disbursement.execute`, `payout.approve`)
- Accounting & GL mutation (`accounting.journal.post`, `accounting.journal.approve`)
- Policy & Risk configuration (`config.manage`, `risk.manage_policies`)
- Tenant / User administration (`tenant.manage`, `user.manage`)

---

## 4. Stage-Gated P4 Workflow Sequence
```
Loan Officer (Origination)
       ↓ [SUBMITTED]
Dynamic KYC & Document Verification
       ↓ [CREDIT_ASSESSMENT]
Credit Analyst Assessment Desk
       ↓ [RECOMMENDATION RECORDED]
Stage Gates Passed (KYC + Docs + Eligibility + Risk)
       ↓ [UNDERWRITING]
Underwriter (Sanction Decision)
```

---

## 5. Dynamic Document Engine Integration
Documents are validated against the dynamic rules engine (`document-rules.ts`) tailored to borrower employment:
- **Salaried**: Salary Slips + Salary Bank Account Statement + PAN + Aadhaar.
- **Self-Employed**: Business ITR + Current Account Statement + Business Registration.
- **Student**: Student ID / Admission Letter + Sponsor Co-Applicant Documents.
