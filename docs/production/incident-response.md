# Incident Response Runbook & Severity Matrix

Follow this standard procedure during critical production incidents.

---

## 1. Severity Classification

| Severity | Definition | Target Response Time | Escalation Path |
| :--- | :--- | :--- | :--- |
| **SEV-1 (CRITICAL)** | Total platform outage, financial ledger corruption, or active security breach | < 15 Minutes | CTO, Lead Architect, Platform Ops |
| **SEV-2 (HIGH)** | Core service degraded (e.g. Disbursements blocked, KYC failing) | < 1 Hour | Engineering Lead, Domain Lead |
| **SEV-3 (MEDIUM)** | Non-critical reporting issue or single-tenant intermittent error | < 4 Hours | On-call Engineer |
| **SEV-4 (LOW)** | Minor cosmetic defect or documentation discrepancy | Next Business Day | Product Team |

---

## 2. Standard Incident Response Workflow

```text
Detect (Alert/Monitoring)
           │
           ▼
Contain (Pause affected worker queues / block rogue IP)
           │
           ▼
Investigate (Review sanitized logs with Correlation IDs)
           │
           ▼
Correct (Apply hotfix or execute rollback runbook)
           │
           ▼
Reconcile (Run 3-way financial reconciliation engine)
           │
           ▼
Audit & RCA (Publish root-cause analysis within 24h)
```
