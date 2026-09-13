# Environment Separation & Configuration Architecture

Strict separation is enforced across development, testing, staging, and production environments.

---

## 1. Environment Matrix

| Environment | Purpose | Database | Providers | Money Movement |
| :--- | :--- | :--- | :--- | :--- |
| **Development (`development`)** | Local feature coding | Local Postgres | In-Memory Sandbox | ❌ Disabled |
| **Test / CI (`test`)** | Automated CI/CD suites | Isolated Test DB | Deterministic Sandbox | ❌ Disabled |
| **Sandbox / Staging (`staging`)** | Pre-production UAT | Staging Postgres | In-Memory Sandbox | ❌ Disabled |
| **Production (`production`)** | Live Institutional Lending | Multi-AZ Postgres | Production Adapters (Future) | ✅ Real Banking Rails |

---

## 2. Production Guardrails

- **Startup Validation**: `enforceProductionEnvironmentValidation()` rejects boot if placeholder secrets or localhost databases are detected in production mode.
- **Data Isolation**: Production databases never receive development seed fixtures or test identities.
