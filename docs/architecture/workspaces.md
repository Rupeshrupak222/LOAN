# Workspaces Architecture

The Adyapan Lending OS groups operational functions into **5 standard workspaces**:

```text
ADYAPAN LENDING OS WORKSPACES
│
├── 1. LENDING OPERATIONS (OPERATIONS)
│   ├── Dashboard (/dashboard)
│   ├── Customers (/customers, /customers/[id], /customers/new)
│   ├── Loan Applications (/applications, /applications/[id], /applications/new)
│   ├── Returned Proposals Desk (/returned-applications)
│   ├── Credit Assessment (/credit-assessment)
│   ├── Underwriting Committee (/underwriting)
│   ├── Disbursements (/disbursements)
│   ├── Active Loans (/loans, /loans/[id])
│   ├── Payments & Repayments (/payments)
│   ├── General Ledger (/general-ledger)
│   ├── Reconciliation (/reconciliation)
│   ├── Collections & Delinquency (/collections)
│   ├── Partner Channels (/partners)
│   ├── Omnichannel Hub (/communications)
│   └── Reports & NPA Analytics (/reports, /npa-monitoring)
│
├── 2. PLATFORM GOVERNANCE (PLATFORM)
│   ├── AI Command Center (/command-center)
│   ├── Tenant Directory (/tenants)
│   ├── Client Onboarding (/client-onboarding)
│   ├── Loan Products (/loan-products)
│   ├── Workflow Studio (/workflows)
│   ├── BRE Policy Studio (/bre-studio)
│   ├── Policy Configuration (/configuration)
│   ├── Staff Users (/users)
│   ├── Branch Directory (/branches)
│   ├── Roles & Permissions (/roles)
│   ├── Branding & White-Label (/branding)
│   ├── Integration Hub (/integrations)
│   ├── System Settings (/settings)
│   └── Observability (/operations, /support-sla)
│
├── 3. BRANCH OPERATIONS (BRANCH)
│   ├── Branch Review Desk (/branch-review)
│   ├── Local Customer Portfolio
│   ├── Approval Queue within Limits
│   └── Branch Performance & NPA
│
├── 4. REGULATORY & COMPLIANCE (COMPLIANCE)
│   ├── Compliance Overview (/compliance)
│   ├── DPDP Privacy & Consent (/privacy)
│   └── Immutable Audit Trail (/audit-logs)
│
└── 5. BORROWER SELF-SERVICE (BORROWER)
    ├── Borrower Dashboard (/customer/dashboard)
    ├── Active Loans & Repayment Schedule (/customer/loans)
    ├── Application Tracker (/customer/applications)
    ├── Repayment Submissions (/customer/payments)
    └── Document Vault (/customer/documents)
```

## Workspace Access by Role

| Role | Operations Workspace | Platform Workspace | Branch Workspace | Compliance Workspace | Borrower Workspace |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | ✓ (Full) | ✓ (Full) | ✓ (Full) | ✓ (Full) | - |
| **ADMIN / COMPANY_ADMIN** | ✓ (Ops) | ✓ (Tenant) | ✓ (All Branches) | ✓ (Full) | - |
| **BRANCH_MANAGER** | ✓ (Branch Scoped) | - | ✓ (Full) | ✓ (Read) | - |
| **LOAN_OFFICER** | ✓ (Intake & Returns) | - | - | - | - |
| **CREDIT_ANALYST** | ✓ (Assess & Score) | - | - | - | - |
| **UNDERWRITER** | ✓ (Sanction & BRE) | ✓ (BRE Studio) | - | - | - |
| **FINANCE_OFFICER** | ✓ (Disbursal & GL) | - | - | - | - |
| **COLLECTION_OFFICER** | ✓ (Collections & PTP) | - | - | - | - |
| **AUDITOR** | ✓ (Read-Only) | ✓ (Read-Only) | ✓ (Read-Only) | ✓ (Full) | - |
| **CUSTOMER** | - | - | - | - | ✓ (Full) |
