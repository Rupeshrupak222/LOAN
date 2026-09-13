# Integration Architecture — Adyapan Lending OS

> **CRITICAL ENVIRONMENT NOTICE**:
> Real external production APIs are intentionally NOT connected in the current environment. The system operates 100% deterministically in-process using sandbox adapters. The architecture is cleanly decoupled so that real external adapters can be plugged in later behind standard interfaces without modifying core LMS business logic, financial ledgers, or underwriting engines.

---

## 1. High-Level Architectural Model

```text
                                 ADYAPAN LENDING OS (Core LMS)
                                               │
                                               ▼
                              CENTRALIZED PROVIDER REGISTRY
                                               │
               ┌───────────────────────┬───────┴───────────────────────┐
               ▼                       ▼                               ▼
      Identity & Verification    Credit & Underwriting          Financial Rails
      ├── KycProvider            ├── BureauProvider             ├── PaymentProvider
      ├── BankVerificationProvider └── AccountAggregatorProvider├── PayoutProvider
      ├── EsignProvider                                         └── MandateProvider
      └── CommunicationProviders (SMS, WA, Email, Push)
               │                       │                               │
               ▼                       ▼                               ▼
       Deterministic Sandbox   Deterministic Sandbox           Deterministic Sandbox
         (Scenario-Driven)       (Scenario-Driven)               (Scenario-Driven)
               │                       │                               │
               └───────────────────────┼───────────────────────────────┘
                                       │
                                       ▼
                       WEBHOOK & RESILIENCE FRAMEWORK
                       ├── Signature Verification Abstraction
                       ├── Deduplication & Replay Protection
                       ├── Idempotency Key Manager
                       └── Retry & Failure Normalization
```

---

## 2. Core Architectural Tenets

1. **Vendor Agnosticism**: Core business logic (BRE, Credit Assessment, Accounting GL, Offer Engine, Collections) interacts exclusively with normalized interfaces (`KycProvider`, `BureauProvider`, `BankVerificationProvider`, etc.) rather than vendor-specific SDKs.
2. **Zero External Network Dependencies**: In current mode, all operations execute in-process without network latency, rate limits, or API key requirements.
3. **Repeatable Deterministic Testing**: Sandbox providers support discrete scenario triggers (`GOOD_CREDIT`, `POOR_CREDIT`, `TIMEOUT`, `NAME_MISMATCH`, etc.) to guarantee predictable CI/CD test passes.
4. **Idempotency & Financial Safety**: State-changing operations (disbursements, repayments, mandate activations) enforce strict idempotency keys to eliminate double-crediting or duplicate processing.
5. **Multi-Tenant & Role Isolation**: Provider health and configuration are strictly segregated by tenant, and access is restricted to authorized platform administrators (borrowers and operational staff have zero visibility into internal provider wiring).
