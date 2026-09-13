# Deterministic Sandbox Providers

Adyapan Lending OS includes complete in-memory deterministic sandbox adapters for all 12 institutional domains. These providers require **zero API keys, zero network connections, and execute in sub-milliseconds**.

---

## 1. Supported Test Scenarios by Domain

### A. KYC Sandbox (`SandboxKycProvider`)
- **Success Case**: Standard 10-digit PAN (e.g. `ABCDE1234F`) returns `VERIFIED` with high name match score (98%).
- **Name Mismatch**: PANs ending with `8888M` or forcing scenario `NAME_MISMATCH` returns 35% match score.
- **Invalid / Failed Record**: PANs ending with `9999F` return `FAILED` (`isPanValid: false`).
- **Timeout Simulation**: PANs ending with `0000T` throw a simulated `PROVIDER_TIMEOUT`.
- **Pending Verification**: PANs ending with `0000P` return status `PENDING`.

### B. Credit Bureau Sandbox (`SandboxBureauProvider`)
- **`GOOD_CREDIT`**: Returns 785 score, 0 DPD, 0 written-off accounts, 0 recent inquiries.
- **`AVERAGE_CREDIT`**: Returns 685 score, clean repayment, minor inquiry count.
- **`POOR_CREDIT`**: Returns 520 score, active write-offs, 90+ DPD history.
- **`NO_HISTORY` (NTC)**: Returns score `-1`, 0 tradelines.
- **`HIGH_DPD`**: Returns 550 score, active 120 DPD on consumer durable loan.
- **`HIGH_ENQUIRY`**: Returns 640 score with 12 inquiries in the last 30 days.

### C. Bank Verification Sandbox (`SandboxBankVerificationProvider`)
- **`VALID`**: Account verified with State Bank of India via simulated penny drop.
- **`INVALID`**: Account `9999999999` returns `INVALID_ACCOUNT`.
- **`NAME_MISMATCH`**: Accounts ending in `8888` return `NAME_MISMATCH`.
- **`PENDING`**: Accounts ending in `0000` return `PENDING`.

### D. Digital eSign Sandbox (`SandboxEsignProvider`)
- Simulates session creation, signing URL, and signing completion with digital certificate thumbprints (`SHA256:7B:...`).

### E. e-NACH Mandate Sandbox (`SandboxMandateProvider`)
- Simulates mandate registration, authorization URLs, and returns deterministic UMRN identifiers.

### F. Payment & Payout Sandbox (`SandboxPaymentProvider`, `SandboxPayoutProvider`)
- Simulates UPI/Netbanking order creation, payment verification, and 24x7 IMPS bank payouts with deterministic UTRs.
