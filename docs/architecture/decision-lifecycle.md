# Decision Lifecycle & Workflow Integration

## 1. End-to-End Decision Lifecycle
From loan application intake through disbursement, the decision lifecycle ensures automated rigor with complete segregation of duties (SoD):

```
1. Application Intake & Document Upload (DRAFT / SUBMITTED)
   ↓
2. Statutory KYC & Deduplication Checks (KYC_COMPLETED)
   ↓
3. Context Building & Normalization (DecisionContext)
   ↓
4. BRE Evaluation (Decision Engine Service)
   ↓
5. Output Snapshot Generation (DecisionSnapshotRecord v1)
   ↓
6. Workflow Transition:
   ├─ APPROVE                 → Offer Generation / Sanction Letter
   ├─ APPROVE_WITH_CONDITIONS → Stipulation Clearance Node
   ├─ REFER                   → Manual Underwriter Queue
   └─ REJECT                  → Adverse Action Notice Rejection
```

---

## 2. Re-Evaluation Handling
When an underwriter or applicant provides updated information (e.g. updated bank statement or lower requested amount):
- A new decision evaluation request is dispatched.
- The system checks existing snapshot records for the application.
- The decision version increments (`v1` $\to$ `v2`).
- The new snapshot record is persisted alongside prior versions, maintaining a full audit timeline.

---

## 3. Manual Override Governance
If an underwriter exercises policy exception authority:
1. The user must possess the `decision.override` permission.
2. The user submits the desired `finalDecision`, a mandatory predefined `reason` code, and mandatory underwriting comments.
3. The original `systemDecision` remains completely unaltered in the database.
4. The snapshot's `finalDecision` is updated and an `override` metadata block is attached.
5. An immutable `DECISION_OVERRIDDEN` event is logged to the system audit trail.
