# Feature-First Architecture

## 1. Domain Directory Organization

All business domain logic in Adyapan Lending OS is structured into modular feature packages under `src/features/`:

```text
src/features/
│
├── applications/               # LOS Application Intake, Returns, and Status Management
│   ├── types.ts                # Application data contracts
│   └── index.ts                # Public feature exports
│
├── customers/                  # Borrower 360, KYC verification, & Employment data
│
├── credit/                     # Credit Assessment, Banking Analytics, Capacity Scorer
│   └── index.ts
│
├── underwriting/               # Underwriting Committee, Sanctions, & KFS Integration
│   └── index.ts
│
├── disbursements/              # Payout Queue, Pre-Disbursal Gates, & Fund Release
│
├── loans/                      # Loan Servicing, Amortization, Restructuring, & Closures
│
├── payments/                   # Repayment allocations, UTR submissions, & Receipts
│
├── collections/                # Delinquency Management, DPD Aging Buckets, & PTPs
│
├── finance/                    # General Ledger (GL), Daily Accruals, NPA & Trial Balance
│   └── index.ts
│
├── bre/                        # Business Rules Engine (BRE) & Policy What-If Simulator
│   └── index.ts
│
├── compliance/                 # RBI Regulatory Compliance, DPDP Privacy, & Audit Logs
│
├── platform/                   # Multi-Tenant Control, Users, Roles, Workflows, Branding
│
└── borrower/                   # Customer Self-Service Experience & Payment Steps
    └── index.ts
```

---

## 2. Standard Feature Package Structure

Each feature owns its isolated contracts:
* `types.ts` — TypeScript domain models and DTOs.
* `api.ts` — Feature-specific HTTP client calls.
* `hooks/` — Custom React Query hooks (e.g. `useApplications`, `useCreditAssessment`).
* `components/` — Domain-specific UI widgets and dialogs.
* `index.ts` — Clean public barrel exports.
