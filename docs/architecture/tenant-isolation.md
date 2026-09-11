# Cross-Tenant Data Isolation & Security

## Multi-Tenant Security Model

### 1. Database Row-Level Scoping
Every major business model in the PostgreSQL database contains a mandatory `tenantId` foreign key referencing the `Tenant` table:
- `User.tenantId`
- `Branch.tenantId`
- `Customer.tenantId`
- `LoanProduct.tenantId`
- `LoanApplication.tenantId`
- `Loan.tenantId`
- `Payment.tenantId`
- `AuditLog.tenantId`

All Prisma queries execute with explicit `where: { tenantId }` constraints.

### 2. Request Scoping & Anti-Spoofing
The `tenantService.resolveTenantScope(actor, requestedTenantId)` function governs access:
- If `actor.roles.includes('SUPER_ADMIN')`: Access to any tenant is authorized.
- If non-SuperAdmin: The actor's `tenantId` is mandatory. Any attempt to supply a different `requestedTenantId` in query parameters or URL route segments raises `ForbiddenError('Cross-tenant access denied')`.

### 3. In-Memory Engine Partitioning
Engines that utilize in-memory caching prefix all primary keys with `tenantId`:
- `ProductEngineService`: `Map<${tenantId}:${productId}, LendingProduct>`
- `WorkflowService`: `Map<${tenantId}:${workflowType}, WorkflowDefinition>`
- `DecisionEngineService`: `Map<${tenantId}:${policyId}, DecisionPolicy>`
- `ApprovalAuthorityService`: `Map<${tenantId}:${policyId}, ApprovalAuthorityPolicy>`
- `CreditLimitsService`: `Map<${tenantId}:${policyId}, CreditLimitPolicy>`
- `BrandingService`: `Map<tenantId, TenantBranding>`

### 4. Zero Cross-Tenant AI / Gemini Leakage
The `tenantService.sanitizeAiContext(activeTenantId, records)` method strips any record belonging to a different tenant before injecting context into AI prompts or analytics engines.
