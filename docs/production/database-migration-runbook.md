# Database Migration & Schema Safety Runbook

Adyapan Lending OS uses Prisma with PostgreSQL for strongly-typed relational data storage.

---

## 1. Migration Invariants

- **Non-Destructive Migrations**: Production migrations must NEVER execute `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` operations on transactional tables.
- **Backward & Forward Compatibility**: When adding new columns or tables, make fields optional or provide default values so old and new application instances can co-exist during rolling deployments.
- **Index Addition Safety**: Always add indexes concurrently or during low-traffic windows to avoid write lockups on high-volume tables (e.g. `LoanApplication`, `GeneralLedgerEntry`).

---

## 2. Running Production Migrations

```bash
# Apply pending migration files safely
cd backend
npx prisma migrate deploy

# Verify schema sync status
npx prisma migrate status
```

---

## 3. Handling Migration Failures

If a migration fails or encounters a lock:
1. Check active database locks via `SELECT * FROM pg_locks;`.
2. Inspect the migration record in `_prisma_migrations`.
3. If marked failed, resolve the underlying constraint issue and mark as resolved using:
   ```bash
   npx prisma migrate resolve --applied "migration_name"
   ```
