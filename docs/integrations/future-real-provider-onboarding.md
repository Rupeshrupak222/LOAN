# Future Real Provider Onboarding Guide

When external vendor API contracts and credentials become available in the future, follow this streamlined onboarding process. **Core LMS business logic will not require any changes.**

---

## 1. Step-by-Step Onboarding Workflow

```text
1. Create Provider Adapter implementing domain interface (e.g. RealCibilBureauProvider implements BureauProvider)
                                     │
                                     ▼
2. Map outgoing request to vendor XML/JSON format
                                     │
                                     ▼
3. Map incoming vendor response to internal Normalized Contract (e.g. BureauReportResult)
                                     │
                                     ▼
4. Add HMAC webhook handler in WebhookFramework
                                     │
                                     ▼
5. Execute UAT certification suite
                                     │
                                     ▼
6. Register in ProviderRegistry & activate for production tenants
```

---

## 2. Code Adapter Pattern

```typescript
import { BureauProvider, BureauInquiryRequest, BureauReportResult } from './interfaces/bureau.interface';

export class RealCibilBureauProvider implements BureauProvider {
  readonly providerId = 'real_cibil';
  readonly name = 'TransUnion CIBIL Production Gateway';
  readonly environment = 'PRODUCTION' as const;

  constructor(private readonly apiKey: string, private readonly endpoint: string) {}

  public async fetchCreditReport(req: BureauInquiryRequest, correlationId: string): Promise<BureauReportResult> {
    // 1. Call real external API with apiKey
    // 2. Normalize CIBIL TUDF response into standard BureauReportResult
    // 3. Return normalized object
  }
}
```
Core underwriting, BRE rules, and loan applications automatically consume the real provider without modifying a single line of business code.
