# Production Secrets & Credential Management

This document defines the secrets posture and credential rotation policies for Adyapan Lending OS.

---

## 1. Secrets Policy

1. **Zero Hardcoded Secrets**: Secrets, private keys, and passwords must NEVER be committed to Git repositories or hardcoded in source code.
2. **Runtime Secret Injection**: Production secrets must be injected via secure container environment variables or Cloud Key Management (GCP KMS / AWS Secrets Manager / Vault).
3. **Automatic Masking**: Admin telemetry and log outputs automatically mask secrets (`maskSecret`), ensuring tokens are never visible in logs or UI dashboards.

---

## 2. Mandatory Secret Checklist for Production

- `DATABASE_URL`: Authenticated PostgreSQL connection string with SSL mode enforced.
- `JWT_ACCESS_SECRET`: High-entropy secret string (min 32 characters).
- `JWT_REFRESH_SECRET`: High-entropy secret string (min 32 characters).
- `CORS_ORIGIN`: Exact production domain URLs (e.g. `https://borrower.adyapan.io,https://ops.adyapan.io`).
- `CLOUDINARY_API_SECRET` (if cloud vault enabled): Secure storage secret.
