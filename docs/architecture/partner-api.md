# Partner & Embedded Lending API Reference Architecture

## Base URL & Versioning
- Base Path: `/api/v1`
- Content Type: `application/json`
- Character Set: `UTF-8`

## Standard Request Headers
| Header | Type | Required | Description |
|---|---|---|---|
| `x-api-key` | String | Yes | Partner Public Key (e.g. `pk_live_...`) |
| `x-api-secret` | String | Yes | Partner Private Secret |
| `x-idempotency-key` | String | Cond. | Required for state-mutating requests (POST/PUT) |
| `x-tenant-id` | String | No | Optional tenant override (defaults to partner's tenant) |

---

## 1. Customers API
- `POST /api/v1/partner-customers`: Register an embedded customer with mandatory digital consent timestamp & IP address.
- `GET /api/v1/partner-customers/:id`: Retrieve customer profile and identity verification status.
- `GET /api/v1/partner-customers`: List partner-owned customer records with pagination.

---

## 2. Applications API
- `POST /api/v1/partner-applications`: Create a new application draft referencing `partnerApplicationId` and `productId`.
- `GET /api/v1/partner-applications/:id`: Retrieve application details, current workflow state, and stage progression.
- `PUT /api/v1/partner-applications/:id`: Update draft loan parameters and borrower metadata.
- `POST /api/v1/partner-applications/:id/submit`: Transition application into the underwriting engine (`PENDING_BRE_DECISION`).

---

## 3. Offers & KFS API
- `GET /api/v1/partner-offers/:applicationId`: Retrieve customer-safe sanction terms, loan amount, APR, reducing EMI schedule, and breakdown.
- `POST /api/v1/partner-offers/:applicationId/accept`: Borrower accepts sanction terms (requires customer signature / consent evidence).

---

## 4. Credit Lines & Drawdown API
- `GET /api/v1/partner-credit-lines/:customerId`: Retrieve sanctioned credit line limit, available drawdown balance, and active drawdowns.
- `POST /api/v1/partner-credit-lines/:id/drawdown`: Execute a revolving drawdown against the approved credit line with automated fee & GST calculation.

---

## 5. Webhooks API
- `POST /api/v1/partner-webhooks/subscriptions`: Register a webhook endpoint with custom event subscriptions.
- `GET /api/v1/partner-webhooks/subscriptions`: List active partner webhook endpoints.
- `DELETE /api/v1/partner-webhooks/subscriptions/:id`: Unsubscribe an endpoint.
- `GET /api/v1/partner-webhooks/deliveries`: Query historical delivery logs, HTTP response status codes, and latency.
- `POST /api/v1/partner-webhooks/deliveries/:id/replay`: Replay a failed or past webhook event.

---

## 6. Reports & Commissions API
- `GET /api/v1/partner-reports/summary`: Aggregate loan application metrics, conversion funnels, and approval ratios.
- `GET /api/v1/partner-reports/commissions`: Real-time commission ledger detailing upfront, recurring, and milestone earnings per disbursed loan.
