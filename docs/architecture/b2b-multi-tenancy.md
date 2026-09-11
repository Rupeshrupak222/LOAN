# Adyapan Lending OS — B2B Multi-Tenancy Architecture

## Executive Overview

Adyapan Lending OS is designed as a true enterprise-grade B2B lending platform inspired by global digital credit infrastructure like M2P Fintech.

One single deployed Lending OS runtime serves multiple independent Financial Institutions, Non-Banking Financial Companies (NBFCs), FinTech lenders, and Digital Co-Lenders, providing:
1. Complete Logical & Row-Level Data Isolation in PostgreSQL
2. Independent Product Engines, Versioning, and Rate Schedules per Tenant
3. Custom Orchestrated Workflows, Stage Gates, and SLA Monitors
4. Configurable Business Rules Engine (BRE) and Credit Decision Policies
5. Granular Approval Authority Matrices with Role-Based Sanction Limits & SoD
6. Dynamic Multi-Cap Credit Limits & Revolving Facilities
7. Tenant-Scoped Branch Networks and Staff User Administration
8. White-Label Custom Branding with WCAG 2.1 Contrast Safety

```text
                               ADYAPAN LENDING OS PLATFORM
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           ▼                                ▼                                ▼
  ┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
  │  Tenant: Prime   │            │   Tenant: Apex   │            │ Tenant: Fintech  │
  │  Adyapan Prime   │            │   Apex Capital   │            │ Digital Micro    │
  ├──────────────────┤            ├──────────────────┤            ├──────────────────┤
  │ • Salaried PL    │            │ • SME Business   │            │ • Nano BNPL Line │
  │ • 14.5% Reducing │            │ • 16.0% Reducing │            │ • 24.0% Flat     │
  │ • Bureau >= 700  │            │ • GST Flow >= 1Cr│            │ • Alternative DTI│
  │ • BM limit: ₹5L  │            │ • BM limit: ₹10L │            │ • Auto-Sanction  │
  │ • Theme: FinBlue │            │ • Theme: Purple  │            │ • Theme: Emerald │
  └──────────────────┘            └──────────────────┘            └──────────────────┘
```

## Multi-Tenant Engine Scoping

All core lending engines are shared singleton services in memory, but execute strictly with tenant-scoped state partitions:

| Engine | Scoping Mechanism | Isolation Guarantee |
| :--- | :--- | :--- |
| **Product Engine** | `tenantId:productId` key maps & PostgreSQL foreign keys | Independent catalog, rates, tenures, fees, and KFS simulators |
| **Workflow Engine** | `tenantId:workflowType` stage mappings | Custom lifecycle states, automated triggers, and stage SLAs |
| **BRE / Decision Engine**| `tenantId:policyId` rule groups | Unique underwriting policies, credit score cutoffs, FOIR ratios |
| **Approval Authority** | `tenantId:policyId` authority levels | Tiered sanction limits, four-eyes committee rules, delegations |
| **Credit Limit Engine**| `tenantId:facilityId` & `tenantId:drawdownId` | Autonomous credit lines, revolving caps, and exposure tracking |
| **LMS / Servicing** | Row-level `tenantId` in Prisma schema & SQL queries | Zero cross-tenant data visibility for loans, schedules, payments |
| **White-Label Branding**| `brandings.get(tenantId)` | Independent logos, colors, domains, portals, and email templates |
