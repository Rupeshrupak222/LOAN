# Decision Policy & Versioning Architecture

## 1. Concept & Relationship
A **Decision Policy** defines the underwriting rulebook assigned to a **Loan Product**.

```
Tenant
  └── Loan Product (e.g. Personal Loan)
        └── Product Version (e.g. v2)
              └── Decision Policy (e.g. POLICY_PL_PRIME_v2)
                    ├── Rule Group 1 (ELIGIBILITY) [AND]
                    ├── Rule Group 2 (CREDIT) [AND]
                    ├── Rule Group 3 (FINANCIAL) [AND]
                    ├── Rule Group 4 (BANKING) [AND]
                    ├── Rule Group 5 (KYC_DOCS) [AND]
                    └── Rule Group 6 (FRAUD_RISK) [AND]
```

---

## 2. Policy Lifecycle & Statuses
Policies transition through deterministic lifecycle stages:
- **`DRAFT`**: Policy is under construction or being edited by Risk Managers. Not used for live borrower decisions.
- **`ACTIVE`**: The currently authoritative underwriting policy for the tenant/product. Applications evaluated under this policy reference this exact version.
- **`ARCHIVED`**: Deprecated policy versions preserved for retrospective auditability.

---

## 3. Versioning Strategy
1. **Incremental Clones**: When an active policy is updated, the system creates an incremental version (`v+1`).
2. **Historical Reproducibility**: Completed loans reference the immutable policy version snapshot active at the time the decision was made.
3. **Audit Ledger**: Every policy activation, modification, and deprecation writes a structured record to `AuditLog`.
