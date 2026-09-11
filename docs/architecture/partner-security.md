# Partner Platform Security Architecture

## Overview

The Partner Security layer establishes zero-trust boundaries between external integrations (LSPs, fintechs, merchants) and Adyapan Lending OS internal execution engines.

## 1. Authentication Mechanisms

Adyapan Partner APIs support dual authentication methods:
- **Header-Based Authentication**:
  - `x-api-key`: Environment-prefixed unique identifier (e.g. `pk_live_...` or `pk_test_...`).
  - `x-api-secret`: High-entropy cryptographically secure token.
- **HTTP Basic Authentication**: Standard `Authorization: Basic base64(apiKey:apiSecret)`.
- **Bearer Token**: For session-based partner portal workflows.

### Credential Storage & Rotation
- API Secrets are hashed with **SHA-256** prior to database storage.
- Plaintext secrets are only shown once during key provisioning or rotation.
- Instant key revocation and rotation capabilities allow zero-downtime key transition without affecting active loan operations.

## 2. Authorization & Scopes

API Keys are bound to explicit permission scopes:
| Scope | Purpose |
|---|---|
| `customers:read` / `customers:write` | Register, query, and manage partner-referred borrowers. |
| `applications:read` / `applications:write` | Draft, update, and submit loan applications. |
| `offers:read` / `offers:write` | View customer-safe KFS terms and submit borrower acceptances. |
| `credit-lines:read` / `credit-lines:drawdown` | View revolving limit facilities and request sanctioned drawdowns. |
| `webhooks:manage` | Configure webhook endpoints, inspect delivery logs, and trigger replays. |
| `reports:read` | Query disbursement volume, status funnels, and commission ledgers. |

### Anti-Permissions (Strictly Denied)
- `loans:approve` (Only internal credit committee/underwriters can approve).
- `bre:override` (Partners cannot bypass risk policies).
- `disbursements:execute_direct` (Disbursements must pass through core treasury rails).
- `tenants:manage` (Cross-tenant modifications are blocked).

## 3. Anti-IDOR & Multi-Tenant Isolation

Every partner API route enforces multi-tier ownership validation:
1. Extract `partnerId` from authenticated API credentials.
2. For all resource lookups (e.g. `GET /api/v1/partner-applications/:id`), verify:
   $$\text{Resource.partnerId} == \text{Authenticated.partnerId}$$
3. Any attempt to access, modify, or query an unowned entity or cross-partner reference triggers an immediate `403 Forbidden` response and records a security audit log.

## 4. Rate Limiting & DoS Protection

- **Sliding Window Algorithm**: Tracks requests per minute (RPM) per API credential.
- **Burst Capacity**: Configurable burst tokens prevent transient traffic spikes from dropping legitimate checkout requests.
- **HTTP 429 Status**: Exceeded quotas return `429 Too Many Requests` with `Retry-After` header.

## 5. Idempotency

- All mutating requests (`POST /partner-applications`, `POST /partner-offers/:id/accept`, `POST /partner-credit-lines/:id/drawdown`) require an `x-idempotency-key` header.
- Cached responses are returned verbatim for duplicate keys within a 24-hour TTL window, preventing double disbursement or duplicate applications.
