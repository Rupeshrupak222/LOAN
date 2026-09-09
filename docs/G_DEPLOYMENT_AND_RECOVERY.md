# ADYAPAN LENDING PLATFORM — DEPLOYMENT & DISASTER RECOVERY

## 1. Supported Enterprise Deployment Models
1. **Shared Multi-Tenant SaaS**: Single multi-tenant application stack with row-level tenant partitioning and shared ingress.
2. **Dedicated Tenant Deployment**: Isolated application container and dedicated database schema via `DEPLOYMENT_MODEL=DEDICATED_TENANT` and `TENANT_OVERRIDE_ID`.
3. **Enterprise Private Cloud**: VPC-isolated deployment with AWS Secrets Manager / HashiCorp Vault and private KMS.
4. **Air-Gapped Self-Hosted**: On-premise container stack with local rule engine AI fallback (`LOCAL_RULE_ONLY`) and local MinIO storage.

---

## 2. Pre-Deployment Validation & Safety
Before starting containers in production, the preflight validator executes automated checks:
- Verifies database connectivity and pooling parameters.
- Validates JWT secret entropy (minimum 32 characters, no placeholders).
- Confirms environment separation (ensuring staging/dev does not leak live payment gateway keys).

---

## 3. Safe Zero-Downtime Rollback Strategy
- **Forward-Fix & Non-Destructive Migrations**: The database schema uses additive, backward-compatible migrations.
- **Financial Ledger Immutability**: Rollbacks never truncate or drop loan ledger tables or payment receipts.
- **Audit Ledger Contiguity**: SHA-256 hash chains remain continuous across code rollbacks.
