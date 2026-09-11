# Digital Banking & Regulatory Integrations

## Supported Rail Integrations

Adyapan Lending OS integrates with standard financial and regulatory infrastructure across the Indian digital lending ecosystem.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DIGITAL LENDING ADAPTERS                        │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Integration Domain  │ Adapter Standard │ Production Service / Provider │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ Identity / e-KYC    │ DigiLocker / UIDAI│ Aadhaar OTP eKYC, PAN NSDL    │
│ Credit Bureau       │ CIR XML / JSON   │ CIBIL, Experian, CRIF HighMark│
│ Bank Verification   │ Open Banking AA  │ Account Aggregator (Setu/Anum)│
│ Digital Contracts   │ PKI / UIDAI eSign│ Aadhaar eSign (Digiio/Leegality│
│ Auto-Debit Mandate  │ NPCI eNACH       │ NetBanking / Debit Card eNACH │
│ Payment Payouts     │ Banking IMPS/NEFT│ Direct Bank Host-to-Host Rails│
│ Collections Rails   │ BBPS / UPI Intent│ UPI Dynamic QR & Payment Links│
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

## Integration Lifecycle

1. **DigiLocker & PAN Verification**: Verifies borrower KYC details and fetches verified XML proof with zero document forgery risk.
2. **Account Aggregator**: Fetches 6-month bank statements directly from the customer's financial institution with explicit consent.
3. **Aadhaar eSign**: Generates a PDF agreement with legally binding SHA-256 digital signatures timestamped and registered under the IT Act 2000.
4. **NPCI eNACH**: Generates Unique Mandate Reference Number (UMRN) and registers standing instruction on borrower bank account with max recurring limit cap.
5. **IMPS / Payout Gateway**: Executes instant real-time gross settlement directly to verified borrower bank account.
