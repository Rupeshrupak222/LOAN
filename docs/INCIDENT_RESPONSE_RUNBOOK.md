# Adyapan Lending OS — Operational Incident Response Runbook

**Classification:** Standard Operating Procedures (SOP)  
**Primary Roles:** On-Call SRE, Finance Lead, Security Operations  

---

## 1. Incident Classification Matrix

| Severity | Definition | Target Response (SLA) | Examples |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core lending/disbursement outage, data corruption, active security breach | ≤ 15 minutes | Database pool exhaustion, double-payout anomaly, token leak |
| **SEV-2 (High)** | Major workflow degraded, third-party provider failure with no fallback | ≤ 30 minutes | Webhook delivery drop, CIBIL gateway timeout, KYC outage |
| **SEV-3 (Medium)** | Non-blocking feature failure, isolated user errors | ≤ 2 hours | Delayed analytics refresh, notification delivery retry spike |

---

## 2. Standard Triage Runbooks

### 2.1 Failed Disbursement / Payout Ambiguity
**Symptom:** Payout request sent to bank provider, but response timed out or returned `PENDING_NETWORK_TIMEOUT`.

**Safety Rule:** NEVER blindly retry a payout without verifying downstream status!

**Procedure:**
1. Check provider transaction status via reference ID / UTR query.
2. If the provider reports transaction as `SUCCESS`:
   - Update `Disbursement` status to `COMPLETED`.
   - Activate Loan Account in LMS.
   - Post corresponding General Ledger entry.
3. If the provider reports transaction as `FAILED`:
   - Mark `Disbursement` as `FAILED`.
   - Application remains in `READY_FOR_DISBURSEMENT` queue for Finance re-attempt.
4. If status is indeterminate:
   - Mark task for manual checker review with `HOLD_INVESTIGATION`.

---

### 2.2 Inbound Webhook Replay or HMAC Signature Failure
**Symptom:** Inbound webhook logs report `INVALID_SIGNATURE` or `DUPLICATE_EVENT_DROPPED`.

**Procedure:**
1. Check `WebhookLog` table for incoming event ID and timestamp.
2. If `DUPLICATE_EVENT_DROPPED`:
   - Normal idempotent behavior; verify previous event was processed cleanly.
3. If `INVALID_SIGNATURE`:
   - Verify if provider rotated webhook signing secrets without configuration update.
   - If unauthorized external IP attempted payload injection, block IP at API gateway / WAF.

---

### 2.3 Stuck Workflow Triage
**Symptom:** Application sitting in `CREDIT_ASSESSMENT` or `UNDERWRITING` for > 48 hours without progress.

**Procedure:**
1. Fetch lifecycle projection for application:
   ```bash
   curl -X GET /api/v1/orchestration/lifecycle/APP-123456 -H "Authorization: Bearer $TOKEN"
   ```
2. Inspect `blockingReasons` and `activeRemediations` in response payload.
3. Re-assign task to active Branch Manager or Underwriter queue.
