# Phase 9 Architecture: Advanced Risk Engine

## 1. Executive Summary & Objective

The **Advanced Risk Engine** in Adyapan Lending OS provides deterministic, multi-dimensional credit risk assessment and capacity analysis without replacing or conflicting with the Core Decision Engine. It evaluates borrower risk profiles across 6 canonical pillars, producing an aggregate score between 0 and 100, a calibrated Risk Band (LOW to VERY_HIGH), an A–E Risk Grade, and actionable key risk drivers.

```
+-----------------------------------------------------------------------------------+
|                            6-PILLAR RISK VECTORS                                  |
|                                                                                   |
|  [CUSTOMER]       [FINANCIAL]       [CREDIT]       [BANKING]     [APPLICATION]    [BEHAVIORAL]  |
|  Stability,       FOIR, DTI,        Bureau Score,  AMB, Inflow,  Ticket Size,     Channel Risk, |
|  Vintage, Age     Dispos. Income    DPD Vintage    Bounce Count  Tenure, Type     Digital Trace |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │   Deterministic Weighted Aggregation  │
                     │    Policy: Weights & Score Cutoffs    │
                     └───────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │ Risk Score: 0 - 100   │                       │ Key Risk Drivers &    │
     │ Bands: LOW to V_HIGH  │                       │ Pillar Sub-Scores     │
     │ Risk Grade: A, B, C.. │                       │ Recommendations       │
     └───────────────────────┘                       └───────────────────────┘
```

---

## 2. 6-Pillar Risk Signal Taxonomy

1. **CUSTOMER (Demographic & Employment Vintage)**:
   - Evaluates applicant age, residential stability, employment vintage (e.g., minimum 12 months in current role), employer categorization (Cat A/B/C/Govt/Self-Employed).
2. **FINANCIAL (Repayment Capacity & Leverage)**:
   - Evaluates Net Monthly Income (NMI), Fixed Obligation to Income Ratio (FOIR benchmark <= 50%), Debt-to-Income (DTI), and disposable monthly cash surplus.
3. **CREDIT (Credit Bureau & Historical Repayment)**:
   - Bureau score mapping (CIBIL/Equifax/Experian 300–900 converted to standardized credit risk), 30/60/90+ DPD vintage in past 24 months, active credit lines, and write-off flags.
4. **BANKING (Cash Flow & Account Hygiene)**:
   - Average Monthly Balance (AMB), monthly credit turnover vs declared income, inward/outward cheque bounce count in past 90 days, debit-to-credit ratio.
5. **APPLICATION (Structure & Product Fit)**:
   - Requested loan amount relative to maximum product limit, requested tenure, loan-to-value (LTV) for secured products, product category (Unsecured Personal, Digital Credit Line, BNPL).
6. **BEHAVIORAL (Origination Velocity & Channel Telemetry)**:
   - Application channel (Assisted vs Direct Borrower Portal vs LSP API), digital onboarding friction indicators, repeat loan behavior and previous vintage performance.

---

## 3. Score Band Calibration & Risk Grades

| Score Range | Risk Band | Risk Grade | Default Risk Profile | Recommended Action |
|---|---|---|---|---|
| **0 – 20** | `LOW` | **A** | Prime / Super-Prime | Automated Instant Approval / STP |
| **21 – 40** | `MODERATE` | **B** | Near-Prime / Standard | Standard Automated Processing |
| **41 – 60** | `MEDIUM` | **C** | Moderate Risk / Thin File | Credit Officer Review Required |
| **61 – 80** | `HIGH` | **D** | Elevated Default Risk | Senior Underwriter Review / Enhanced Collateral |
| **81 – 100** | `VERY_HIGH` | **E** | Severe Delinquency Risk | Hard Auto-Reject or Exception Committee |

---

## 4. Snapshot Immutability & Reproducibility

Every evaluation executes against an immutable **Policy Version** (e.g., `v1`, `v2`) and persists a complete evaluation snapshot (`RiskEvaluationResult`).
- Re-evaluations increment the version counter (`evaluationVersion: 2, 3...`) while preserving historical versions.
- Audited overrides capture previous vs new scores, approving officer identity, override role, and mandatory business justification.
