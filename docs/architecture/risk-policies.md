# Phase 9 Architecture: Risk Policies & Governance

## 1. Risk Policy Model

Risk policies define how 6-pillar risk signals are weighted and translated into risk scores, bands, and credit limits. Each policy is tenant-scoped, optionally product-scoped, and versioned.

```json
{
  "code": "RISK_POL_STANDARD_RETAIL",
  "name": "Standard Retail Unsecured Risk Policy",
  "version": 1,
  "status": "ACTIVE",
  "categoryWeights": {
    "CUSTOMER": 15,
    "FINANCIAL": 25,
    "CREDIT": 25,
    "BANKING": 20,
    "APPLICATION": 10,
    "BEHAVIORAL": 5
  },
  "bands": [
    { "minScore": 0, "maxScore": 20, "band": "LOW", "riskGrade": "A" },
    { "minScore": 21, "maxScore": 40, "band": "MODERATE", "riskGrade": "B" },
    { "minScore": 41, "maxScore": 60, "band": "MEDIUM", "riskGrade": "C" },
    { "minScore": 61, "maxScore": 80, "band": "HIGH", "riskGrade": "D" },
    { "minScore": 81, "maxScore": 100, "band": "VERY_HIGH", "riskGrade": "E" }
  ]
}
```

---

## 2. Policy Lifecycle

1. **DRAFT**: Created by `RISK_ANALYST` or `ADMIN`. Weights and cutoffs can be modified and simulated against test portfolios.
2. **ACTIVE**: Published by `RISK_MANAGER` or `SUPER_ADMIN`. Active policies immediately govern live risk evaluations. Previous active version is archived.
3. **ARCHIVED**: Read-only historical version preserved for audit reproducibility.

---

## 3. Segregation of Duties (SoD) & Overrides

1. **Policy Publishing SoD**:
   - `SOD_AUDITOR_RISK_POLICY_PUBLISHER`: Compliance Auditors (`AUDITOR`) are strictly blocked from publishing risk policies or altering weights.
2. **Operational Overrides SoD**:
   - Only authorized roles (`RISK_MANAGER`, `UNDERWRITER`, `SUPER_ADMIN`) can override calculated risk scores.
   - Overrides require mandatory justification text (>= 5 characters).
   - The original pre-override evaluation snapshot is permanently preserved in the audit log.
