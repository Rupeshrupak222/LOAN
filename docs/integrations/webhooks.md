# Webhook Ingestion & Normalization Framework

Adyapan Lending OS implements a robust webhook processing framework with **cryptographic signature verification, replay attack prevention, deduplication, and domain event dispatching**.

---

## 1. Webhook Pipeline Lifecycle

```text
Inbound Webhook HTTP Request
            │
            ▼
Signature Verification (HMAC-SHA256 / Timing-Safe Comparison)
            │
            ▼
Replay Protection (Timestamp validation within 5m drift window)
            │
            ▼
Idempotency & Deduplication (LRU / TTL cache on providerId:eventId)
            │
            ▼
Payload Normalization (Vendor JSON -> Normalized Domain Event)
            │
            ▼
Domain Event Dispatch & Audit Log
```

---

## 2. Testing Webhooks in Sandbox Mode

Use the built-in `generateSandboxSignature` helper to simulate signed webhook requests from mock gateways:

```typescript
import { generateSandboxSignature } from '../modules/integrations/webhooks/signature.verifier';
import { webhookFramework } from '../modules/integrations/webhooks/webhook-framework.service';

const rawPayload = JSON.stringify({ orderId: 'ORD-1001', amount: 25000, status: 'captured' });
const secret = 'adyapan_sandbox_payment_secret_2026';
const signature = generateSandboxSignature(rawPayload, secret);

const result = await webhookFramework.processInboundWebhook({
  providerId: 'sandbox_payment',
  eventId: 'evt_sim_99812',
  eventType: 'payment.authorized',
  rawPayload,
  signature,
  timestamp: new Date().toISOString(),
});

console.log(result.status); // 'PROCESSED'
console.log(result.domainEvent); // 'PAYMENT_COLLECTION_RECEIVED'
```
