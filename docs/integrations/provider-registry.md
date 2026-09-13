# Centralized Provider Registry

The `ProviderRegistryService` manages all active integration adapters across the platform.

---

## 1. Active Mode Architecture

In the current operational state, **all registered providers run in `SANDBOX` mode**:

```typescript
import { providerRegistry } from '../modules/integrations/provider-registry.service';

const health = await providerRegistry.getHealthSummary();
```

Output:
```json
[
  { "domain": "KYC & Identity", "providerId": "sandbox_kyc", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Credit Bureau", "providerId": "sandbox_bureau", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Bank Verification", "providerId": "sandbox_bank", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Account Aggregator", "providerId": "sandbox_aa", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Digital eSign", "providerId": "sandbox_esign", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "e-NACH Mandate", "providerId": "sandbox_mandate", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Payment Gateway", "providerId": "SANDBOX", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Payouts & Disbursement", "providerId": "SANDBOX", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "SMS Communication", "providerId": "sandbox_sms", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Email Communication", "providerId": "sandbox_email", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "WhatsApp Communication", "providerId": "sandbox_whatsapp", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false },
  { "domain": "Push Notifications", "providerId": "sandbox_push", "mode": "SANDBOX", "status": "HEALTHY", "isExternalApiConnected": false }
]
```

---

## 2. API Endpoints

- `GET /api/v1/integrations/health`: Returns health summary for all 12 domains. Restricted to authorized staff (`SUPER_ADMIN`, `ADMIN`, `PLATFORM_ADMIN`). Borrowers are strictly forbidden.
- `GET /api/v1/integrations/providers`: Returns provider details and masked config summaries.
