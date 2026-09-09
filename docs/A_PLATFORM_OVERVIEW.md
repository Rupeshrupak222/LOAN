# ADYAPAN LENDING PLATFORM — ARCHITECTURE & PLATFORM OVERVIEW

## 1. Executive Summary
Adyapan is a production-grade, multi-tenant digital lending operating system built for Non-Banking Financial Companies (NBFCs), digital banks, and retail credit institutions.

---

## 2. High-Level Architecture Topology

```
                                  ┌───────────────────────────────┐
                                  │      Next.js 14 Frontend      │
                                  │  (57 Dynamic & Static Pages)  │
                                  └───────────────┬───────────────┘
                                                  │ HTTPS / WSS
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Express API Gateway (Node)  │
                                  │   Rate Limiting & Tracing     │
                                  └───────┬───────────────┬───────┘
                                          │               │
                  ┌───────────────────────┼───────────────┼───────────────────────┐
                  │                       │               │                       │
                  ▼                       ▼               ▼                       ▼
      ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
      │ Multi-Tenant Context  │ │ Dynamic Workflows │ │ Product Catalog   │ │ Integration Hub   │
      │ Row-Level Isolation   │ │ Transition Gates  │ │ KFS & Pricing     │ │ AES-256 Routing   │
      └───────────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘
                  │                       │               │                       │
                  └───────────────────────┼───────────────┼───────────────────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │ PostgreSQL 16     │
                                │ (Prisma ORM)      │
                                └───────────────────┘
```

---

## 3. Core System Principles

1. **Deterministic Financial Calculation Engine**:
   - Monthly reducing-balance EMI schedule calculations, KFS annual percentage rates (APR), and statutory repayment priority allocations (`Penalties` $\rightarrow$ `Fees` $\rightarrow$ `Interest` $\rightarrow$ `Principal` $\rightarrow$ `Excess Refund`) are calculated with mathematical precision (zero decimal drift).

2. **Strict Multi-Tenant Row-Level Isolation**:
   - Every database query, cache key, background job, and audit trail is partitioned by `tenantId`.
   - Cross-tenant data leakage is strictly blocked by kernel-level middleware.

3. **Advisory AI Boundaries**:
   - Generative AI copilots (Gemini 1.5/Flash) provide real-time advisory credit summaries and fraud analysis.
   - AI outputs can **never** bypass hard deterministic policy rules, override human underwriter sanction authority, or alter immutable financial ledgers.

4. **Cryptographic SHA-256 Audit Trail**:
   - State mutations (sanctions, disbursements, policy modifications) produce immutable evidence nodes hash-chained to the prior state block, creating a verifiable tamper-proof audit trail.
