# Adyapan Lending OS — Disaster Recovery & Backup Runbook

**Document Owner:** DevOps & Infrastructure Engineering  
**Classification:** Operational Runbook  
**Applicability:** Production & Staging Environments  

---

## 1. Database Backup Strategy

### 1.1 Automated Continuous Backups
- **Continuous Archiving:** PostgreSQL Write-Ahead Logs (WAL-G / Supabase continuous archiving) streamed to encrypted multi-region object storage.
- **Daily Full Snapshots:** Physical snapshot executed daily at 01:30 AM IST (low-traffic window) with 30-day snapshot retention.
- **Point-in-Time Recovery (PITR):** Target Recovery Point Objective (RPO) = ≤ 5 minutes; Target Recovery Time Objective (RTO) = ≤ 30 minutes.

### 1.2 Manual Snapshot Trigger
To take an on-demand pre-deployment backup:
```bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -Fc -f backup_adyapan_$(date +%Y%m%d_%H%M%S).dump
```

---

## 2. Database Restore & Point-in-Time Recovery (PITR) Procedure

### Step 1: Isolate Production Ingress
1. Route API Gateway traffic to maintenance holding page:
   ```bash
   kubectl scale deployment adyapan-backend --replicas=0
   ```
2. Stop background worker jobs to avoid outbox message race conditions:
   ```bash
   kubectl scale deployment adyapan-worker --replicas=0
   ```

### Step 2: Provision & Restore Clean PostgreSQL Replica
1. Restore target snapshot to isolated database instance:
   ```bash
   pg_restore -h $RESTORE_HOST -U $DB_USER -d $RESTORE_DB -v backup_adyapan_20260920_013000.dump
   ```
2. Replay WAL archives up to target timestamp:
   ```sql
   -- postgresql.conf recovery target
   restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
   recovery_target_time = '2026-09-20 09:45:00+05:30'
   ```

### Step 3: Run Database Integrity Checks
Verify that table constraints, indexes, and foreign keys are valid:
```sql
SELECT count(*) FROM "Loan";
SELECT count(*) FROM "LoanApplication";
SELECT count(*) FROM "AuditLog";
SELECT count(*) FROM "CustomerConsent";
```

---

## 3. Post-Recovery Ledger Reconciliation

Following any database restoration, run the authoritative financial reconciliation suite to verify that:
1. All Loan Account balances match the sum of their active repayment schedules.
2. All General Ledger journal entries are balanced (`SUM(debit) == SUM(credit)`).
3. Any in-flight disbursements during the failure window are identified and checked against bank payout gateway callbacks:

```bash
cd backend
npm run tsx -- scripts/reconcile-ledger.ts --tenantId=all --dryRun=false
```

---

## 4. Disaster Recovery Testing & Drills

- **Schedule:** Bi-annual simulated failover drills to Secondary Region (ap-south-2 / Hyderabad).
- **Verification:** Spin up restored database in isolated VPC, execute the automated Phase 9K test suite, and verify that 100% of financial, workflow, and tenant isolation tests pass.
