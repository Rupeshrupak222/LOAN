# ADYAPAN LENDING PLATFORM — OPERATIONAL RUNBOOKS

## RUNBOOK 01: Application Server Outage / Container Crash
- **Symptoms**: Load balancer returns 502/503 HTTP status.
- **Remediation**:
  1. Inspect container logs: `docker logs adyapan-backend --tail 100`.
  2. Verify Node.js process restarted via PM2 / Kubernetes readiness probe.
  3. Query `GET /api/v1/deployment/detailed-health` to confirm healthy component recovery.

---

## RUNBOOK 02: Database Connection Interruption
- **Symptoms**: PrismaClientKnownRequestError / Pool exhaustion warnings.
- **Remediation**:
  1. Check PostgreSQL instance health on port 5432.
  2. Verify active connection pool utilization (`SELECT count(*) FROM pg_stat_activity;`).
  3. The platform Prisma client automatically reconnects with exponential backoff.

---

## RUNBOOK 03: External Gateway Outage & Automatic Failover
- **Symptoms**: Primary credit bureau or payment gateway returns 504 Gateway Timeout.
- **Remediation**:
  1. Integration Hub automatically switches routing from Primary (e.g. CRIF) to Secondary (e.g. EXPERIAN).
  2. Check Connector status via `/integrations` admin console.
  3. If secondary fails, applicant enters `MANUAL_REVIEW_QUEUE` with zero data loss.

---

## RUNBOOK 04: Disbursement Saga Partial Failure & Reversal
- **Symptoms**: Payout order dispatched at gateway but ledger write encounters lock conflict.
- **Remediation**:
  1. Sagas trigger automatic compensating action (voiding reservation / logging to Dead-Letter Queue).
  2. Query `GET /api/v1/jobs/dlq` to inspect pending unresolved reversal items.
  3. Execute reconciliation sweep via `POST /api/v1/reconciliation/run-daily-reconciliation`.

---

## RUNBOOK 05: Offline AI Copilot Fallback
- **Symptoms**: Gemini API unreachable (503 Service Unavailable / Rate Limit).
- **Remediation**:
  1. System automatically activates deterministic policy rule engine.
  2. Underwriting and origination workflows continue uninterrupted.
  3. AI advisory notes state: `AI Copilot Unavailable - Deterministic Rule Engine Active`.

---

## RUNBOOK 06: Security Incident & Instant Token Revocation
- **Symptoms**: Compromised user credentials or unauthorized access detected.
- **Remediation**:
  1. Lock user account via `POST /api/v1/security/lock-account`.
  2. Revoke active JWT access tokens via token blacklist registry.
  3. Verify cryptographic SHA-256 evidence chain integrity via `POST /api/v1/audit/verify-chain`.
