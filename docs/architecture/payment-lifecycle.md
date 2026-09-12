# Payment & Payout Transaction Lifecycles

## 1. Repayment Lifecycle & State Machine

Every repayment transaction adheres to a finite state machine with immutable audit logging and state transitions:

```mermaid
stateDiagram-v2
    [*] --> INITIATED: Customer / LSP initiates checkout
    INITIATED --> PENDING: Gateway order created
    PENDING --> PROCESSING: Webhook payment.authorized
    PROCESSING --> SUCCESS: Webhook payment.captured / verified
    PENDING --> FAILED: Card declined / Insufficient funds
    PROCESSING --> FAILED: Bank network error

    SUCCESS --> REFUND_REQUESTED: Finance Officer raises refund
    REFUND_REQUESTED --> REFUNDED: Refund settled to customer account
    REFUND_REQUESTED --> PARTIALLY_REFUNDED: Partial surplus returned

    SUCCESS --> REVERSED: NACH / Cheque Bounced (Compensating GL Journal)
    SUCCESS --> CHARGEBACK: Bank Dispute / Customer Chargeback
```

### State Definitions
- **`INITIATED`**: Checkout intent created; unique idempotency token and order generated.
- **`PENDING`**: Waiting for customer OTP / UPI PIN authentication.
- **`PROCESSING`**: Authorized by payment gateway; awaiting confirmation and settlement capture.
- **`SUCCESS`**: Funds captured; pure waterfall allocation executed; loan balances reduced; double-entry repayment journal posted.
- **`FAILED`**: Explicit decline or timeout from bank/gateway.
- **`REFUNDED`**: Funds returned to borrower; unallocated excess or payment reversed via `postRefundJournal`.
- **`REVERSED`**: Payment revoked/bounced; schedule items and loan balances restored; compensating reversal entry posted via `postReversalJournal`.
- **`CHARGEBACK`**: Bank dispute deduction provisioned via `postChargebackJournal`.

---

## 2. Disbursement / Payout Lifecycle

```mermaid
stateDiagram-v2
    [*] --> CREATED: Loan sanction / Drawdown approved
    CREATED --> VALIDATING: Penny drop / Name matching
    VALIDATING --> PROCESSING: Sent to Banking Payout Gateway (NEFT/IMPS)
    PROCESSING --> SUCCESS: Funds credited & Bank UTR generated
    PROCESSING --> FAILED: Beneficiary routing error / Invalid IFSC
    FAILED --> RETRYING: Automatic retry with exponential backoff
    RETRYING --> SUCCESS: Retry settled
    RETRYING --> FAILED: Max retry limit reached (3 attempts)
```
