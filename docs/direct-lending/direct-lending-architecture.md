# Direct Lending & Instant Loan Architecture

## 1. Overview & System Purpose
The Adyapan Direct Lending Platform is an enterprise-grade digital lending layer built on top of the Adyapan Lending OS. It provides an instantaneous, consumer-focused loan origination and servicing experience (mPokket/KreditBee quality) while reusing the core domain engines from Phases 0–14:
- **Phase 1 Product Engine**: Product schemes, interest rates, tenure bounds, and pricing.
- **Phase 2 BRE / Decision Engine**: Automated rule-based credit scoring and policy checks.
- **Phase 3 Approval Authority**: Tiered approval hierarchy and Maker-Checker governance.
- **Phase 4 Offer Engine**: Statutory Key Fact Statements (KFS), APR calculation, and terms generation.
- **Phase 5 Credit Facility**: Revolving credit lines, limits, and drawdown management.
- **Phase 6 Multi-Tenant Platform**: Complete institutional data isolation.
- **Phase 9 Risk & Fraud Engine**: Risk grades (A–E), anomaly rules, and syndicate fraud detection.
- **Phase 10 Payments Engine**: IMPS/UPI disbursement and automated repayment allocation.
- **Phase 11 Collections Engine**: Deterministic DPD calculations and overdue management.
- **Phase 12 General Ledger**: Double-entry financial balancing for all transactions.
- **Phase 13 Support & Comms**: Context-aware ticket management and compliant notifications.
- **Phase 14 Analytics & MIS**: Channel-wise origination and performance tracking.

---

## 2. High-Level Architecture Flow

```
[Borrower Web / Future Mobile App]
                │
                ▼
[Direct Lending API: /api/v1/direct-lending/*]
                │
  ┌─────────────┼─────────────────────────┐
  ▼             ▼                         ▼
[Consent]  [Lifecycle Engine]    [Pre-Qualification & Fast-Track]
  │             │                         │
  │             │     ┌───────────────────┼───────────────────┐
  │             │     ▼                   ▼                   ▼
  │             │ [Product Engine]   [BRE Engine]      [Risk/Fraud Engine]
  │             │   (Phase 1)          (Phase 2)           (Phase 9)
  │             │                         │                   │
  │             ▼                         └─────────┬─────────┘
  │       [Next Action Router]                      ▼
  │                                           [Offer & KFS]
  │                                             (Phase 4)
  │                                                 │
  │                                                 ▼
  │                                          [eSign & Mandate]
  │                                                 │
  │                                                 ▼
  │                                          [Disbursement]
  │                                            (Phase 10)
  │                                                 │
  └─────────────────────────────────────────────────┴──► [Active Servicing & GL]
                                                          (Phase 11 & 12)
```

---

## 3. Core Principles
1. **Zero Logic Duplication**: Reuses authoritative services for DPD, Risk, Accounting, and Decisioning.
2. **Deterministic Stage-Gating**: Applications must satisfy KYC, Decision, Offer, eSign, and Mandate before disbursement.
3. **Redacted Safe Views**: Protects internal risk weight matrices, fraud scores, and collector logs from borrower leakage.
4. **Multi-Tenant Isolation**: Enforces tenant-scoping on every direct lending request.
5. **Continuous Repeat Intelligence**: Existing borrowers are dynamically evaluated for higher limits and lower rates with instant pre-qualification.
