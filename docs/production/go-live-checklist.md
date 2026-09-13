# Production Go-Live Verification Checklist

Complete this verification checklist prior to opening institutional lending traffic on Adyapan Lending OS.

---

## 1. Pre-Launch Verification Matrix

### A. Infrastructure & Database
- [x] Multi-AZ PostgreSQL cluster provisioned with automated WAL archiving.
- [x] Prisma database schema migrations applied (`npx prisma migrate deploy`).
- [x] Connection pool limits tuned to container memory allocations.
- [x] Liveness (`/health/live`) and Readiness (`/health/ready`) probes configured.

### B. Security & Authentication
- [x] `NODE_ENV=production` set across all services.
- [x] High-entropy `JWT_ACCESS_SECRET` (32+ chars) and `JWT_REFRESH_SECRET` configured.
- [x] CORS restricted to exact production origin domains (no wildcard `*`).
- [x] Rate limiters enabled on login, OTP, and financial endpoints.
- [x] Segregation of Duties (SoD) verified across underwriting, finance, and collections.

### C. Financial & Ledger Integrity
- [x] Zero floating-point math verified (100% `Decimal.js` math).
- [x] Double-entry GL invariant verified (`Total Debits == Total Credits`).
- [x] Pre-Disbursement 10-point gatekeeper active.
- [x] Idempotency locks active on all payout and payment endpoints.

### D. Observability & Runbooks
- [x] Prometheus `/metrics` endpoint reachable by telemetry scraper.
- [x] Sanitized structured logging enabled (zero secret leak).
- [x] Disaster recovery and rollback runbooks verified.
