# Approval Authority Architecture

## 1. Executive Summary
The **Approval Authority Matrix** is a centralized, configuration-driven governance framework that determines sanction authority dynamically based on:
$$\text{Approval Authority} = f(\text{Product}, \text{Loan Amount}, \text{Risk Grade}, \text{BRE Decision}, \text{Branch Jurisdiction}, \text{SoD Rules})$$

It eliminates hardcoded approval thresholds across controllers and services, replacing static role checks with dynamic authority resolution.

```
Loan Application
  ↓
Product Version (Phase 1)
  ↓
BRE Decision Engine Verdict (Phase 2)
  ↓
Approval Authority Matrix Resolver (Phase 3)
  ↓
Hierarchical Approval Tasks (Level 1..Level N)
  ↓
Approver Eligibility & Four-Eyes SoD Validation
  ↓
Decision Actions (Approve / Send Back / Escalate / Reject)
  ↓
Immutable Approval Snapshot & Workflow Stage Advance
  ↓
Finance Disbursement Gate (Disbursement Locked until Final Sanction)
```

---

## 2. Core Architectural Principles
1. **Zero Hardcoded Limits**: Replaces legacy hardcoded checks (e.g. `amount <= 500000`) with tenant-configurable, versioned Authority Policies.
2. **Role $\ne$ Approval Authority**: Role membership is an input factor combined with amount bands, risk tiers, and branch scoping.
3. **Decimal.js Monetary Boundaries**: All financial amount limits and boundary comparisons use exact decimal arithmetic.
4. **Hierarchical Multi-Level Approval**: Supports stage-gated sequential approval (e.g., Level 1 Branch Manager $\to$ Level 2 Underwriter $\to$ Level 3 Credit Head).
5. **Auditable Lifecycle**: Every sanction, send-back, escalation, and delegation persists an immutable `ApprovalSnapshotRecord` and logs to `AuditLog`.
