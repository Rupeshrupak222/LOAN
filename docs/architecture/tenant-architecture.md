# Multi-Tenant System Architecture

## Architecture Principles

1. **Shared-Process, Tenant-Partitioned Data**: A single backend process runs the core business logic, serving requests across all registered tenants while isolating database records and memory caches.
2. **Deterministic Context Resolution**: The `tenantContext` middleware inspects the authenticated session, resolves the user's authoritative `tenantId`, and assigns `req.tenant`.
3. **Defense-in-Depth IDOR Prevention**: Controllers and services execute `tenantService.resolveTenantScope(actor, requestedTenantId)` on every access point to prevent spoofing.
4. **Readiness-Gated Activation**: Tenants cannot accept loan applications or issue credit until all 8 operational domains pass validation.

## Tenant Lifecycle States

```text
  ┌──────────────┐       Provisioning       ┌──────────────┐
  │  DRAFT /     │ ───────────────────────► │ ONBOARDING / │
  │ PROVISIONING │                          │ CONFIGURING  │
  └──────────────┘                          └──────────────┘
                                                   │
                                                   │ Readiness Check Passed (100%)
                                                   ▼
  ┌──────────────┐       Suspend Loan       ┌──────────────┐
  │  SUSPENDED   │ ◄─────────────────────── │    ACTIVE    │
  │ (Servicing)  │ ───────────────────────► │ (Full LMS)   │
  └──────────────┘      Reactivation        └──────────────┘
```

- **PROVISIONING / DRAFT**: Initial creation; canonical engines seeded; setup certificate generated.
- **ONBOARDING / CONFIGURING**: Admin configures products, workflows, rules, pricing, approval matrix, credit limits, branches, and staff.
- **ACTIVE**: All 8 readiness domains verified; originations, drawdowns, and borrower portal operational.
- **SUSPENDED**: New loan applications and credit facility drawdowns blocked; existing loan repayments, collections, and LMS servicing active.
- **TERMINATED**: Institutional offboarding and archive.
