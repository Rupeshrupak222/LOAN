# Future Real Provider Activation Checklist

When commercial agreements and production API credentials are ready for external vendors, follow this checklist to safely activate production providers without altering core LMS logic.

---

## 1. Provider-by-Provider Activation Status

| Domain | Target Future Vendor | Code Status | Real Credentials Status |
| :--- | :--- | :--- | :--- |
| **KYC & Identity** | NSDL / Karza / HyperVerge | `KycProvider` Interface Ready | Real Provider Not Connected |
| **Credit Bureau** | CIBIL / Experian / CRIF | `BureauProvider` Interface Ready | Real Provider Not Connected |
| **Bank Verification** | Setu / Cashfree Bank Auth | `BankVerificationProvider` Ready | Real Provider Not Connected |
| **Account Aggregator**| Setu AA / Finvu / OneMoney | `AccountAggregatorProvider` Ready | Real Provider Not Connected |
| **Digital eSign** | Leegality / Signzy / Digio | `EsignProvider` Interface Ready | Real Provider Not Connected |
| **e-NACH Mandate** | Razorpay Mandate / Cashfree | `MandateProvider` Interface Ready | Real Provider Not Connected |
| **Payment Gateway** | Razorpay / Cashfree Collection | `PaymentProvider` Interface Ready | Real Provider Not Connected |
| **Disbursements** | RazorpayX / Cashfree Payouts | `PayoutProvider` Interface Ready | Real Provider Not Connected |
| **Communication** | Twilio / SendGrid / Meta WA | Communication Interfaces Ready | Real Provider Not Connected |

---

## 2. Safe Activation Sequence

1. Write provider adapter implementing the domain interface in `src/modules/integrations/adapters/`.
2. Securely store vendor API key and endpoint in environment vault.
3. Configure webhook endpoint signature verification in `WebhookFramework`.
4. Run staging sandbox verification suite.
5. Enable provider for target production tenant via Provider Registry.
