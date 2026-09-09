# ADYAPAN LENDING PLATFORM — DEVELOPER & REST API REFERENCE

## 1. Authentication & Tenant Header
- **Authentication**: Bearer JWT token in HTTP Authorization Header:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Tenant Context**: Automatically parsed from authenticated user or explicit header:
  ```http
  X-Tenant-Id: tenant-adyapan-default
  ```

---

## 2. Global Error Format
All errors follow standard RFC-7807 structure:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User lacks required permission: DISBURSEMENTS_APPROVE_MAKER_CHECKER",
    "details": {}
  }
}
```

---

## 3. Core Module REST Endpoints

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — User authentication & JWT issuance (Subject to 5-attempt brute force lock).
- `POST /api/v1/auth/refresh` — Refresh expired access token.
- `POST /api/v1/auth/logout` — Revoke active token.

### Loan Products & KFS (`/api/v1/loan-products`)
- `GET /api/v1/loan-products/catalog` — Get active product catalog with statutory KFS schedules.
- `POST /api/v1/loan-products/simulate-pricing` — High-speed deterministic EMI, APR, and fee simulation.

### Dynamic Workflows (`/api/v1/workflows`)
- `GET /api/v1/workflows/definitions` — Retrieve active workflow stages and policy transition gates.
- `POST /api/v1/workflows/evaluate-transition` — Real-time transition gate rule evaluation.

### Client Onboarding (`/api/v1/client-onboarding`)
- `GET /api/v1/client-onboarding` — List commercial onboarding dossiers.
- `POST /api/v1/client-onboarding/initiate` — Start institutional onboarding with 16-point checklist.
- `PUT /api/v1/client-onboarding/:id/checklist` — Update checklist task status.
- `GET /api/v1/client-onboarding/:id/validate` — Run pre-activation go-live validation.
- `POST /api/v1/client-onboarding/:id/approve-provision` — Super Admin idempotent provisioning.
- `POST /api/v1/client-onboarding/:id/deactivate` — Controlled offboarding with statutory 8-year retention lock.

### Deployment & Health (`/api/v1/deployment`)
- `GET /api/v1/deployment/profile` — Public deployment topology & active storage/secret drivers.
- `GET /api/v1/deployment/detailed-health` — Deep component health checks (DB, Storage, Cache, Audit Chain).
- `GET /api/v1/deployment/preflight` — Super Admin pre-deployment safety validation.
- `GET /api/v1/deployment/rollback-plan` — Non-destructive forward-fix rollback runbook.
