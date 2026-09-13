# Production Readiness Architecture — Adyapan Lending OS

> **CRITICAL ENVIRONMENT DECLARATION**:
> The system is architecturally hardened for production. In accordance with current project capabilities, **no real external production APIs are connected**. The system operates deterministically using in-memory sandbox adapters for all 12 institutional domains. Production deployment readiness is achieved while keeping provider adapters ready for future external credentials.

---

## 1. System Architecture Overview

```text
                    ADYAPAN LENDING OS (Production Hardened)
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
   Borrower Experience         Operations Command            Platform Governance
   ├── Masked PII              ├── RBAC / SoD Barriers       ├── Tenant Isolation
   ├── Safe Error Copy         ├── Branch / Partner Scopes   ├── Audit Immutability
   └── Redacted Risk/Fraud     └── Maker-Checker Controls    └── Secret Vaults
                                       │
                                       ▼
                              CORE LENDING ENGINE
             (BRE, Risk, Fraud, Offers, Facility, Payments, GL, Comms)
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
   Financial Integrity        Security & Observability       Sandbox Gateways
   ├── Decimal.js Math         ├── Prometheus Metrics (/metrics)├── 12 Sandbox Adapters
   ├── Double-Entry Invariant  ├── Correlation ID Tracing     └── Future Adapter
   ├── Pre-Payout Gatekeeper   ├── Health Probes (Live/Ready)     Readiness
   └── Idempotency Locks       └── Rate Limiting & Helmet
```

---

## 2. Production Hardening Tenets

1. **Defense-in-Depth**: Every API route enforces server-side authentication, tenant context extraction, role authorization, and Segregation of Duties (SoD).
2. **Deterministic Financial Safety**: Zero floating-point math; all monetary calculations use `Decimal.js` and enforce `Total Debits == Total Credits` double-entry ledger balance.
3. **Pre-Disbursement 10-Point Gatekeeper**: Disallowing tranche payout until application, KYC, Bank, BRE, Risk/Fraud, eSign, and Mandate criteria are met.
4. **Complete Data Isolation**: Strict tenant, branch, partner, and customer IDOR prevention.
5. **Observability & Health Telemetry**: Kubernetes-ready liveness (`/health/live`), readiness (`/health/ready`), startup (`/health/startup`), and Prometheus (`/metrics`) endpoints.
