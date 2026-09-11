# Institutional Tenant Onboarding Workflow

## Onboarding Orchestrator

The institutional onboarding wizard (`POST /api/v1/tenants/onboard-wizard`) automates the transactional creation of a new lender tenant:

```text
  1. Organization Profile Validation (Code, Legal Name, Contact, CIN, RBI Reg)
       ↓
  2. Transactional PostgreSQL Tenant Creation
       ↓
  3. Head Office Operating Branch Creation
       ↓
  4. Company Admin User Provisioning & Password Hashing (Argon2id)
       ↓
  5. Canonical Engine Seeding (Products, Workflows, BRE Rules, Approvals, Credit Limits)
       ↓
  6. Statutory Privacy & KYC Purpose Seeding
       ↓
  7. Integration Gateway Routing Defaults (CIBIL, Razorpay, Digilocker, SendGrid)
       ↓
  8. Cryptographic Setup Certificate & SHA-256 Audit Evidence Generation
```

### Institutional Setup Certificate
Every provisioned tenant receives a verifiable institutional setup certificate containing:
- `certificateId`: Unique certificate identifier
- `institutionName` & `tenantCode`
- `statutoryComplianceCertified`: True (RBI NBFC Master Directions compliance)
- `integritySignature`: Cryptographic SHA-256 hash of institutional attributes
- `isolationLevel`: `POSTGRESQL_ROW_LEVEL_MULTITENANT_SCOPING`
