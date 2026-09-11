# Partner & LSP Platform Architecture

## Overview

The Partner, LSP (Lending Service Provider) & Embedded Lending API subsystem transforms Adyapan Lending OS into an enterprise-grade BaaS (Banking-as-a-Service) and embedded credit platform. External fintechs, merchant platforms, neobanks, and corporate aggregators can programmatically integrate Adyapan credit facilities directly into their native applications while preserving authoritative core lending rules.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL PARTNER SYSTEMS & LSPs                           │
│  (Fintech Apps, E-commerce Checkouts, POS Terminals, Merchant Platforms)      │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS / REST (API Key + Secret / HMAC)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  ADYAPAN PARTNER & EMBEDDED API GATEWAY                      │
│  - Partner Authentication & Scoped Authorization                             │
│  - Rate Limiting (Sliding Window RPM & Burst Protection)                     │
│  - Anti-IDOR Tenant & Partner Isolation Verification                         │
│  - Idempotency Interceptor (x-idempotency-key Header)                        │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Internal Engine Dispatch
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       AUTHORITATIVE LENDING ENGINES                          │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────┐  │
│  │ Product Engine        │ │ BRE / Decision Engine │ │ Offer & KFS Engine │  │
│  └───────────────────────┘ └───────────────────────┘ └────────────────────┘  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────┐  │
│  │ Credit Limit Engine   │ │ LMS & Servicing Engine│ │ Outbound Webhooks  │  │
│  └───────────────────────┘ └───────────────────────┘ └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Architectural Principles

1. **Single Source of Truth**: External partners never duplicate credit calculation or sanction logic. The existing Product Engine, BRE, Offer Engine, Credit Limit Engine, and LMS remain the sole authoritative engines.
2. **Strict Anti-Permissions Boundary**: Partners are strictly untrusted external entities. They cannot approve loans, override BRE rules, bypass KYC/eSign requirements, or trigger unvetted direct payouts.
3. **Multi-Tenant & Partner Isolation**: Every resource (customers, applications, offers, credit lines, webhooks, analytics) is indexed by both `tenantId` and `partnerId`. Cross-partner IDOR attacks are rejected with `403 Forbidden`.
4. **Resilient Outbound Webhooks**: Event-driven architecture with HMAC-SHA256 request signatures, automatic exponential backoff retry schedules, delivery history logging, and manual event replay capabilities.
5. **Commercials & Monetization**: Built-in commission engine supporting upfront percentage fees, fixed processing fees, rev-share models, and volume milestone bonuses with real-time payout summaries.
