# Configurable Workflow Engine Foundation

The **Workflow Engine** in Adyapan Lending OS governs how a loan application transitions from origination to disbursement and servicing based on product-bound stage gates, role-based SLAs, and automated trigger rules.

```text
PRODUCT
  └── WORKFLOW DEFINITION (Workflow ID, Version, Type: LOAN_ORIGINATION | DIGITAL_STP | RECOVERY)
       │
       ├── STAGE 1: Lead Submission (Role: LOAN_OFFICER, SLA: 2h)
       │    └── Trigger: Send Acknowledgment SMS / Email
       │
       ├── STAGE 2: Identity & eKYC Verification (Role: LOAN_OFFICER, SLA: 2h)
       │    ├── Mandatory Gate: ekycVerified == TRUE
       │    └── Mandatory Gate: panValidated == TRUE
       │
       ├── STAGE 3: Bureau & Risk Analysis (Role: UNDERWRITER, SLA: 4h)
       │    ├── Mandatory Gate: cibilScore >= 650
       │    ├── Mandatory Gate: fraudScore <= 40
       │    ├── Branch Rule: Fast-Track Prime (CIBIL >= 780 & Salaried) -> SANCTION_DISBURSEMENT
       │    └── Branch Rule: High-Value Escalation (Amount > 25L) -> COMMITTEE_REVIEW (Dual Approval)
       │
       ├── STAGE 4: Underwriting & Sanction (Role: UNDERWRITER, SLA: 6h)
       │    └── Mandatory Gate: foirPct <= Max FOIR Cap
       │
       ├── STAGE 5: Agreement & eSign (Role: BORROWER, SLA: 24h)
       │    ├── Mandatory Gate: sanctionAgreementSigned == TRUE
       │    └── Mandatory Gate: enachActive == TRUE
       │
       └── STAGE 6: Payout & Disbursement (Role: FINANCE_OFFICER, SLA: 2h)
            ├── Mandatory Gate: pennyDropVerified == TRUE
            └── Trigger: Queue Payout Batch to Payment Gateway
```

---

## 1. Workflow Domain Model

### 1.1 Workflow Definition
- `id`: Unique workflow identifier (`wf-orig-standard`, `wf-orig-digital`, etc.)
- `tenantId`: Scoped to lender organization
- `type`: `LOAN_ORIGINATION`, `HARDSHIP_RESTRUCTURING`, `SETTLEMENT_RECOVERY`, `PRODUCT_CUSTOM`
- `status`: `DRAFT`, `ACTIVE`, `ARCHIVED`
- `version`: Monotonically increasing definition version
- `stages`: Ordered array of `WorkflowStage` nodes

### 1.2 Stage Gate Criteria
Gates determine whether an application is permitted to transition to or exit a stage:
- **Operators:** `GTE`, `LTE`, `EQ`, `NEQ`, `IN`, `BOOLEAN_TRUE`, `BOOLEAN_FALSE`
- **Fields Evaluated:** `cibilScore`, `fraudScore`, `ekycVerified`, `panValidated`, `bankStatementAnalyzed`, `sanctionAgreementSigned`, `enachActive`, `loanAmount`, `employmentType`

### 1.3 Automated Triggers
Actions automatically dispatched upon stage entry or completion:
- `DISPATCH_COMMUNICATION`: Sends borrower notifications (SMS, Email, WhatsApp)
- `TRIGGER_AI_COPILOT`: Generates Gemini credit memo summaries or OCR fraud scans
- `QUEUE_PAYOUT_BATCH`: Queues disbursement instruction for finance release
- `NOTIFY_COMMITTEE`: Alerts credit committee members for dual-approval proposals

---

## 2. Product-to-Workflow Relationship

Products do not hardcode approval paths or origination rules. Instead, each product declares a `workflowId`:

```typescript
const product: LendingProduct = {
  id: 'prod-instant-digital-adyapan',
  workflowId: 'wf-orig-digital-adyapan', // Binds directly to the digital STP workflow
  // ...
};
```

### Multi-Tenancy Guarantee
- A product cannot bind to a workflow belonging to another tenant.
- Cross-tenant transition evaluations are strictly rejected at the service layer.

---

## 3. Workflow APIs

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workflows` | List all active workflows for current tenant | Authenticated |
| `GET` | `/api/v1/workflows/:type` | Get workflow definition by type | Authenticated |
| `POST` | `/api/v1/workflows` | Create custom workflow definition | Admin / SuperAdmin |
| `PUT` | `/api/v1/workflows/:id/stages` | Update stages, gate criteria, and branch rules | Admin / SuperAdmin |
| `POST` | `/api/v1/workflows/evaluate-transition` | Evaluate candidate transition against gates & rules | Authenticated |
