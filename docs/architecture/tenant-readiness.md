# Tenant Readiness Validation Engine

## 8-Domain Governance Gate

To ensure institutional compliance and prevent premature lending origination on misconfigured systems, the `evaluateTenantReadiness` engine audits 8 operational domains:

| # | Domain | Verification Criteria | Blocking Condition |
| :- | :--- | :--- | :--- |
| 1 | **PRODUCTS** | At least 1 active Loan Product with valid limits, tenures, and interest rates | 0 active products |
| 2 | **WORKFLOWS** | At least 1 active origination workflow with stage gates | 0 workflows registered |
| 3 | **DECISION_RULES** | At least 1 active BRE policy set with rule groups (FOIR, Bureau, etc.) | 0 active decision policies |
| 4 | **PRICING** | Interest rate grids, fee schedules, and taxation configured | Missing pricing models |
| 5 | **APPROVAL_MATRIX** | Tiered approval levels configured with role-based sanction limits | 0 approval levels defined |
| 6 | **CREDIT_POLICIES** | Multi-cap facility rules and aggregate exposure limits | 0 credit policies initialized |
| 7 | **BRANCHES** | At least 1 active operational branch registered | 0 operational branches |
| 8 | **STAFF_USERS** | At least 1 active administrative or operational staff user | 0 staff users |

## Activation Gate Rule
- **Readiness Score**: `(passedDomains / 8) * 100`
- If `readinessScorePct < 100%`: Activation is strictly rejected by the backend with `BadRequestError` enumerating all blocking reasons.
- Once 100% verified, the tenant is unlocked for borrower application intake, decisioning, and drawdowns.
