# Provider Interfaces & Normalized Contracts

This document specifies the standard TypeScript interfaces implemented across all 12 integration domains in Adyapan Lending OS.

---

## 1. Interface Catalog

| Domain | Interface Name | Key Operations | Normalized Status Codes |
| :--- | :--- | :--- | :--- |
| **KYC & Identity** | `KycProvider` | `verifyPan`, `verifyAadhaarDigilocker`, `verifyFace`, `extractDocumentOcr` | `VERIFIED`, `FAILED`, `PENDING`, `REQUIRES_ACTION` |
| **Credit Bureau** | `BureauProvider` | `fetchCreditReport` | `COMPLETED`, `NO_RECORD`, `FAILED`, `TIMEOUT` |
| **Bank Verification**| `BankVerificationProvider` | `verifyBankAccount` | `VALID_ACCOUNT`, `INVALID_ACCOUNT`, `NAME_MATCH`, `NAME_MISMATCH` |
| **Account Aggregator**| `AccountAggregatorProvider` | `createConsent`, `checkConsentStatus`, `fetchFinancialTelemetry` | `CONSENT_CREATED`, `CONSENT_APPROVED`, `CONSENT_REJECTED`, `DATA_AVAILABLE` |
| **Digital eSign** | `EsignProvider` | `createSigningSession`, `checkSigningStatus` | `SESSION_CREATED`, `SIGN_PENDING`, `SIGNED`, `FAILED`, `EXPIRED` |
| **e-NACH Mandate** | `MandateProvider` | `createMandate`, `verifyMandate`, `cancelMandate` | `MANDATE_CREATED`, `MANDATE_PENDING`, `MANDATE_ACTIVE`, `MANDATE_CANCELLED` |
| **Payment Gateway** | `PaymentProvider` | `createOrder`, `verifyPayment` | `PAYMENT_SUCCESS`, `PAYMENT_PENDING`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED` |
| **Disbursements** | `PayoutProvider` | `initiatePayout`, `checkPayoutStatus` | `PAYOUT_SUCCESS`, `PAYOUT_PENDING`, `PAYOUT_FAILED`, `PAYOUT_REVERSED` |
| **SMS / WA / Email**| `SmsProvider`, `WhatsAppProvider`, `EmailProvider`, `PushProvider` | `sendSms`, `sendWhatsApp`, `sendEmail`, `sendPush` | `QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `REJECTED` |

---

## 2. Normalized Data Normalization Example (Credit Bureau)

Raw bureau reports contain thousands of vendor-specific XML/JSON tags. The `BureauProvider` contract extracts a normalized scorecard:

```typescript
export interface BureauReportResult {
  status: 'COMPLETED' | 'NO_RECORD' | 'FAILED' | 'TIMEOUT';
  bureauName: 'CIBIL' | 'EXPERIAN' | 'EQUIFAX' | 'CRIF' | 'SANDBOX_BUREAU';
  score: number; // 300 - 900 (-1 for NTC)
  scoreTier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NO_HISTORY';
  totalAccounts: number;
  activeAccounts: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  dpd30PlusCount: number;
  dpd90PlusCount: number;
  writtenOffCount: number;
  settledCount: number;
  recentInquiriesLast30Days: number;
  tradelines: BureauTradelineSummary[];
}
```
Core risk assessment engines consume this contract directly, remaining completely insulated from underlying bureau vendor schema changes.
