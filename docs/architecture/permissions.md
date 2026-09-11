# Centralized Permission Taxonomy

Adyapan Lending OS adheres to standard `domain.action` permission naming.

## Complete Permission Taxonomy

### Customer Domain
* `customer.view` — View customer lists, 360 overview, and basic details.
* `customer.create` — Onboard new retail or SME borrowers.
* `customer.edit` — Update borrower demographic, address, or employment info.
* `customer.delete` — Archive or deactivate customer profiles.
* `customer.kyc` — Review and verify Aadhaar/PAN identity documents.

### Application (LOS) Domain
* `application.view` — View loan applications list and timeline.
* `application.create` — Initiate new loan applications.
* `application.edit` — Modify loan amounts, tenures, or draft details.
* `application.submit` — Submit application to credit queue.
* `application.review` — Inspect application credit memo and risk scores.
* `application.return` — View and manage returned applications desk.
* `application.resubmit` — Resubmit rectified proposals to credit analysts.

### Credit Assessment Domain
* `credit.view` — View credit assessments and scorecards.
* `credit.assess` — Compute FOIR, DTI, disposable income, and initial recommendations.
* `credit.bank_intelligence` — Execute and review bank statement analytics.
* `credit.fraud_score` — Trigger AI fraud anomaly scorecard.

### Underwriting & Approvals Domain
* `underwriting.view` — Access credit committee decision queue.
* `underwriting.decide` — Issue final APPROVE, CONDITIONAL, SEND_BACK, or REJECT decisions.
* `underwriting.condition` — Apply formal sanction covenants and stipulations.
* `underwriting.override` — Override BRE soft fails with justification.
* `underwriting.kfs_generate` — Generate statutory Key Fact Statement (KFS).
* `approval.view` — View branch approval queues.
* `approval.approve` — Sanction application within branch authority limit.
* `approval.escalate` — Escalate high-ticket loans to central committee.

### Disbursements & Payouts
* `disbursement.view` — View pre-disbursal queue.
* `disbursement.verify` — Validate signed KFS and active eNACH mandate.
* `disbursement.execute` — Release funds via IMPS/NEFT gateway.
* `disbursement.penny_drop` — Execute bank penny drop verification.

### Loan Servicing & Collections
* `loan.view` — Access active loan accounts, schedules, and statements.
* `loan.manage` — Update servicing details.
* `loan.restructure` — Propose tenure extensions and moratoriums.
* `loan.settle` — Authorize one-time settlement and waivers.
* `loan.close` — Issue formal loan closure and No Objection Certificate (NOC).
* `payment.view` — View repayment transaction records.
* `payment.record` — Record cash/cheque/UTR repayments.
* `collection.view` — Access delinquency cases and DPD aging buckets.
* `collection.manage` — Assign collection cases to field officers.
* `collection.ptp` — Record Promise-To-Pay (PTP) commitments.

### Financial Core & Accounting
* `finance.gl.view` — Inspect General Ledger and Chart of Accounts.
* `finance.gl.post` — Post manual double-entry journal entries.
* `finance.trial_balance` — Generate live balanced Trial Balance.
* `finance.accrual.run` — Execute EOD daily interest accrual batch.
* `finance.npa.view` — View RBI NPA portfolio classification and PCR.
* `finance.recon.view` — Inspect bank settlement reconciliation.

### Platform & Governance
* `tenant.manage` — Provision and configure lender tenants.
* `branch.manage` — Create and configure physical branches.
* `user.manage` — Provision staff users and assign roles.
* `role.manage` — Configure RBAC permissions and Segregation of Duties (SoD).
* `workflow.manage` — Build and edit stage-gate workflow pipelines.
* `bre.view` / `bre.edit` / `bre.simulate` — Configure and simulate BRE policy rules.
* `settings.manage` — System-wide settings and parameters.
* `audit.view` — Inspect immutable security audit trails.
* `compliance.view` — RBI compliance audits and DLA agreements.
* `privacy.manage` — DPDP Act consent and data privacy preferences.
