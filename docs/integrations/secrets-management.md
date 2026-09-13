# Secrets & Configuration Management Architecture

This document defines the secrets and configuration posture for integrations in Adyapan Lending OS.

---

## 1. Secrets Policy (Current vs Future)

- **Current Operational Status**:
  - **Zero production secrets required**: The current system functions completely using deterministic in-memory sandboxes.
  - **Zero fake production credentials**: No mock production API keys or fake vendor secrets exist in environment files or source code.
  - **Zero client-side exposure**: Integration configurations and secret variables are never bundled into frontend assets or exposed to borrower APIs.

- **Future Secret Injection Pattern**:
  - Future production API keys (`PROVIDER_API_KEY`, `PROVIDER_CLIENT_SECRET`, etc.) must be injected via secure runtime environment variables or Cloud Key Management (GCP KMS / AWS Secrets Manager).
  - All admin endpoints returning provider metadata automatically apply masking (`maskSecret`) to ensure raw tokens are never leaked in logs or API payloads.
