# Route Inventory & Ownership

## Operational Staff Routes (`src/app/(app)/*`)

| Route Path | Workspace | Domain Feature | Primary Role(s) | Permission Guard |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | OPERATIONS | `dashboard` | All Staff | Authenticated |
| `/customers` | OPERATIONS | `customers` | Staff | `customer.view` |
| `/customers/[id]` | OPERATIONS | `customers` | Staff | `customer.view` |
| `/customers/new` | OPERATIONS | `customers` | LO, Admin | `customer.create` |
| `/applications` | OPERATIONS | `applications` | Staff | `application.view` |
| `/applications/[id]` | OPERATIONS | `applications` | Staff | `application.view` |
| `/applications/new` | OPERATIONS | `applications` | LO, Admin | `application.create` |
| `/returned-applications` | OPERATIONS | `applications` | LO, BM, Admin | `application.return` |
| `/credit-assessment` | OPERATIONS | `credit` | Analyst, Admin | `credit.assess` |
| `/branch-review` | BRANCH | `branch` | BM, Admin | `approval.view` |
| `/underwriting` | OPERATIONS | `underwriting` | Underwriter, Admin | `underwriting.view` |
| `/disbursements` | OPERATIONS | `disbursements` | Finance, Admin | `disbursement.view` |
| `/loans` | OPERATIONS | `loans` | Staff | `loan.view` |
| `/loans/[id]` | OPERATIONS | `loans` | Staff | `loan.view` |
| `/payments` | OPERATIONS | `payments` | Finance, Collection | `payment.view` |
| `/general-ledger` | OPERATIONS | `finance` | Finance, Auditor | `finance.gl.view` |
| `/reconciliation` | OPERATIONS | `finance` | Finance, Auditor | `finance.recon.view` |
| `/collections` | OPERATIONS | `collections` | Collection, Admin | `collection.view` |
| `/communications` | OPERATIONS | `platform` | Staff | `communications.view` |
| `/reports` | OPERATIONS | `compliance` | Staff | `reports.view` |
| `/npa-monitoring` | OPERATIONS | `finance` | Finance, BM, Auditor | `finance.npa.view` |
| `/risk` | OPERATIONS | `risk` | Risk Analyst, Risk Manager, Admin | `risk.view` |
| `/risk/queue` | OPERATIONS | `risk` | Risk Analyst, Credit Analyst, Underwriter | `risk.view_signals` |
| `/risk/policies` | PLATFORM | `risk` | Risk Manager, Admin | `risk.manage_policies` |
| `/risk/evaluations/[id]` | OPERATIONS | `risk` | Risk Analyst, Underwriter, Admin | `risk.view_signals` |
| `/fraud` | OPERATIONS | `fraud` | Fraud Analyst, Risk Manager, Admin | `risk.fraud_intel` |
| `/fraud/queue` | OPERATIONS | `fraud` | Fraud Analyst, Underwriter | `fraud.view_cases` |
| `/fraud/cases` | OPERATIONS | `fraud` | Fraud Analyst, Risk Manager | `fraud.investigate` |
| `/fraud/cases/[id]` | OPERATIONS | `fraud` | Fraud Analyst, Risk Manager | `fraud.investigate` |
| `/fraud/rules` | PLATFORM | `fraud` | Risk Manager, Admin | `fraud.manage_rules` |
| `/fraud/graph` | OPERATIONS | `fraud` | Fraud Analyst, Risk Manager | `fraud.view_cases` |
| `/fraud-intelligence` | OPERATIONS | `credit` | Risk, Underwriter | `risk.fraud_intel` |
| `/early-warnings` | OPERATIONS | `credit` | Staff | `risk.early_warnings` |
| `/emi-calculator` | OPERATIONS | `finance` | Staff | None |
| `/compliance` | COMPLIANCE | `compliance` | Auditor, Admin | `compliance.view` |
| `/privacy` | COMPLIANCE | `compliance` | Auditor, Admin | `privacy.manage` |
| `/audit-logs` | COMPLIANCE | `compliance` | Auditor, Admin | `audit.view` |
| `/tenants` | PLATFORM | `platform` | SuperAdmin | `tenant.manage` |
| `/branches` | PLATFORM | `platform` | BM, Admin | `branch.view` |
| `/users` | PLATFORM | `platform` | BM, Admin | `user.view` |
| `/roles` | PLATFORM | `platform` | Admin | `role.view` |
| `/workflows` | PLATFORM | `platform` | Admin | `workflow.view` |
| `/bre-studio` | PLATFORM | `bre` | Underwriter, Admin | `bre.view` |
| `/configuration` | PLATFORM | `platform` | Admin | `config.view` |
| `/branding` | PLATFORM | `platform` | Admin | `branding.manage` |
| `/integrations` | PLATFORM | `platform` | Admin | `integration.view` |
| `/settings` | PLATFORM | `platform` | Admin | `settings.manage` |
| `/operations` | PLATFORM | `platform` | Admin | `system.observability` |
| `/command-center` | PLATFORM | `platform` | SuperAdmin | `analytics.command_center` |

---

## Borrower Portal Routes (`src/app/customer/*`)

| Route Path | Workspace | Domain Feature | Primary Role(s) | Permission Guard |
| :--- | :--- | :--- | :--- | :--- |
| `/customer/dashboard` | BORROWER | `borrower` | `CUSTOMER` | `customer.view` |
| `/customer/loans` | BORROWER | `borrower` | `CUSTOMER` | `loan.view` |
| `/customer/applications` | BORROWER | `borrower` | `CUSTOMER` | `application.view` |
| `/customer/payments` | BORROWER | `borrower` | `CUSTOMER` | `payment.record` |
| `/customer/documents` | BORROWER | `borrower` | `CUSTOMER` | `customer.view` |
