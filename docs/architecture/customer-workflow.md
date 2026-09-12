# Customer Workflow & Orchestration Engine

## Dynamic Stage Advancement

The customer workflow coordinates synchronous frontend UI flows with asynchronous backend services.

```text
[Borrower Action] ──► [Workflow Transition Evaluator] ──► [Trigger Engine Action]
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        [Preconditions Met]           [Missing Requisites]
                │                             │
        [State Advanced]             [Stage-Gated UI Prompt]
```

## Stage Advancement Rules

| From State | Trigger Action | Required Validations | Target State |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `SUBMIT_APPLICATION` | Mandatory KYC fields complete, income declared, valid bank IFSC | `SUBMITTED` |
| `SUBMITTED` | `EVALUATE_RULES` | CIBIL >= 650, FOIR <= 60%, Identity cleared | `APPROVED` |
| `APPROVED` | `GENERATE_OFFER` | Approval Authority sanction active | `OFFER_GENERATED` |
| `OFFER_GENERATED` | `ACCEPT_OFFER` | `kfsAccepted: true`, `termsAccepted: true` | `OFFER_ACCEPTED` |
| `OFFER_ACCEPTED` | `EXECUTE_ESIGN` | Digital signature verified via OTP/Aadhaar | `AGREEMENT_SIGNED` |
| `AGREEMENT_SIGNED`| `REGISTER_MANDATE`| eNACH mandate confirmed by NPCI | `MANDATE_ACTIVE` |
| `MANDATE_ACTIVE` | `EXECUTE_PAYOUT` | LMS Loan record created, IMPS UTR generated | `DISBURSED` |

## UI Synchronization
The `<StageGatedJourney />` header component reads current application and offer state to highlight the active step, render checkmarks for completed milestones, and display actionable CTAs (e.g. "Review & Sign Offer", "Set Up eNACH", "View Repayments").
