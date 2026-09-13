# Operation Idempotency & Financial Safety

All state-changing and financial integration calls enforce strict idempotency guarantees.

---

## 1. Idempotency Invariants

- **Financial Safety**: Duplicate payout or payment callback requests produce **exactly one financial effect**.
- **In-Flight Locking**: While an operation with a specific key is running, concurrent requests with the identical key are rejected with `IDEMPOTENCY_IN_PROGRESS`.
- **Cached Response Replay**: Once completed, subsequent requests with the same key immediately return the cached result without re-executing backend side effects.

---

## 2. Code Example

```typescript
import { idempotencyEngine } from '../modules/integrations/resilience/idempotency.engine';

const payoutKey = `PAYOUT-IDEM-${loanId}-TRANCHE-1`;

const { result, isCached } = await idempotencyEngine.executeIdempotent(payoutKey, async () => {
  return await providerRegistry.payout.initiatePayout({
    payoutId: `PO-${loanId}`,
    amount: 50000,
    currency: 'INR',
    beneficiaryName: 'Borrower Name',
    accountNumber: '1122334455',
    ifscCode: 'SBIN0001234',
    paymentMode: 'IMPS',
    purpose: 'LOAN_DISBURSEMENT',
  }, 'CORR-12345');
});

// If called again with the same payoutKey:
// isCached is true, payout is not re-initiated to the bank.
```
