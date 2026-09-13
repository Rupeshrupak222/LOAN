# Retry Resilience & Error Classification

Integration requests through Adyapan Lending OS are governed by a resilient error-handling policy with exponential backoff and strict timeout safety rules.

---

## 1. Error Classification Matrix

| Error Type | Status Codes / Signals | Classification | Action |
| :--- | :--- | :--- | :--- |
| **Network Timeout** | `PROVIDER_TIMEOUT`, `ECONNRESET` | `RETRYABLE` | Retry with exponential backoff up to max attempts |
| **Rate Limit** | HTTP 429 Too Many Requests | `RETRYABLE` | Exponential backoff with jitter |
| **Gateway Downtime** | HTTP 502, 503, 504 | `RETRYABLE` | Retry up to max configured limit |
| **Validation Error** | HTTP 400, 422, Schema failure | `NON_RETRYABLE`| Immediate fast-fail, no retries |
| **Authentication Error** | HTTP 401, 403 Forbidden | `NON_RETRYABLE`| Log security alert, immediate failure |

---

## 2. Timeout Safety Rule

If a timeout occurs on an asynchronous or money-moving operation:
- The system **NEVER** auto-approves or auto-disburses the loan.
- The application/transaction state remains in a controlled **`PENDING`** state awaiting manual ops verification or reconciliation batch processing.
