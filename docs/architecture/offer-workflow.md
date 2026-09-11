# Adyapan Lending OS — Offer Workflow Gating & Integration

## Overview
The Offer Engine integrates directly with the Workflow Engine to enforce strict prerequisite checks and downstream gating rules.

---

## 1. Upstream Gate: Approval Authority Verification

```
[ Application Submitted ] ──► [ BRE Decision: APPROVE ] ──► [ Approval Authority Matrix ]
                                                                       │
                                              ┌────────────────────────┴────────────────────────┐
                                              ▼                                                 ▼
                                     [ Tasks Pending ]                                [ Approval Complete ]
                                              │                                                 │
                                              ▼                                                 ▼
                                     [ Offer Locked 🔒 ]                             [ Offer Generated ✓ ]
```

Backend rejects any attempt to generate an offer if approval tasks are incomplete.

---

## 2. Downstream Gate: Agreement & Disbursement Lock

- Until the customer reviews and accepts the loan offer (`ACCEPTED`), the **Digital Agreement eSign** stage remains locked.
- The **Finance Disbursement** gate remains locked until both Offer Acceptance and Agreement eSign are finalized.
