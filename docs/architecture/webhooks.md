# Webhook Notification Architecture

## Overview

The Webhook Engine delivers real-time, asynchronous lifecycle notifications to partner systems as loan applications, KYC events, underwriting decisions, and disbursement transfers progress through Adyapan Lending OS.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CORE LENDING EVENT OCCURS                            │
│ (e.g. application.approved, offer.generated, loan.disbursed, drawdown.funded)│
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          WEBHOOK DISPATCH ENGINE                             │
│  - Lookup Active Subscriptions for (tenantId, partnerId, eventType)          │
│  - Assemble Standardized JSON Payload with Timestamp & Event ID              │
│  - Compute HMAC-SHA256 Signature using Subscription Secret                   │
│  - Append Headers: x-adyapan-signature, x-adyapan-event, x-adyapan-delivery  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS POST
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PARTNER HTTP ENDPOINT                              │
│                    (Returns HTTP 200/201 on Success)                         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Fail / Timeout (Non-2xx)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       RETRY QUEUE & EXPONENTIAL BACKOFF                      │
│     (Attempts: 1min ➔ 5min ➔ 15min ➔ 1hr ➔ 6hr ➔ Max 5 Retries)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Supported Event Types

| Event Code | Trigger Condition |
|---|---|
| `application.created` | Partner application draft created |
| `application.submitted` | Application submitted for underwriting |
| `application.approved` | Sanctioned by BRE or Credit Committee |
| `application.rejected` | Rejected with regulatory reason codes |
| `offer.generated` | Key Fact Statement (KFS) generated |
| `offer.accepted` | Borrower accepted loan agreement |
| `kyc.completed` | Identity verification confirmed |
| `loan.disbursed` | Funds wired via IMPS / NEFT / RTGS |
| `repayment.received` | Borrower installment settled |
| `credit_line.drawdown_created` | Drawdown disbursed to borrower account |

## Security: HMAC-SHA256 Signatures

Every webhook delivery includes an `x-adyapan-signature` header:
```text
x-adyapan-signature: t=1757600000,v1=9b73489c72e2d93e8e7a098ef7321689df9c3e21
```
Partners verify authenticity by hashing the raw request body with their unique webhook signing secret:
$$\text{Signature} = \text{HMAC-SHA256}(\text{payload}, \text{webhookSigningSecret})$$
