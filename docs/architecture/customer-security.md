# Customer Security & Anti-IDOR Protections

## Threat Model & Security Controls

In a multi-tenant digital lending platform, customer data isolation and anti-IDOR (Insecure Direct Object Reference) guards are vital.

### 1. Anti-IDOR Enforcement
Every borrower endpoint verifies resource ownership before returning or mutating data:
- Applications: `application.customerId === req.user.customerId || req.user.id`
- Offers: `offer.customerId === req.user.customerId || req.user.id`
- Credit Facilities: `facility.customerId === req.user.customerId || req.user.id`
- Contracts & Mandates: Verifies that linked application belongs to caller.
- Loans & Repayments: `loan.customerId === req.user.customerId || req.user.id`

If an unauthorized customer attempts to query or mutate another borrower's records by guessing UUIDs, the system immediately rejects the request with `403 Forbidden` and logs a security audit event.

### 2. Tenant Context Isolation
- All database queries are filtered by `tenantId` extracted from authenticated JWT claims or verified tenant headers.
- Cross-tenant leakage is strictly prevented via Prisma schema middleware and tenant context guards.

### 3. Role-Based Access Control (RBAC)
- Borrowers possess the `CUSTOMER` role.
- Customers cannot perform underwriter overrides, alter credit policies, or execute manual disbursements.
- Customers can only execute allowed self-service workflows: `APPLY`, `ACCEPT_OFFER`, `ESIGN`, `REGISTER_MANDATE`, `MAKE_PAYMENT`, `DRAWDOWN`.

### 4. PII Data Protection
- Sensitive identity attributes (PAN, Aadhaar virtual IDs, Bank Account numbers) are masked in UI presentations (e.g., `•••• •••• 4091`).
- Document uploads are validated for MIME type, file signature, and size constraints.
