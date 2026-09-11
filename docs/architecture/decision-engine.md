# Adyapan Lending OS — Decision Engine Architecture

## 1. Overview
The Decision Engine is an enterprise-grade, deterministic underwriting framework designed to evaluate loan applications against configurable, product-bound Decision Policies. It acts as the core credit decisioning authority within Adyapan Lending OS, bridging the gap between product configurations and workflow execution.

```
Tenant
  ↓
Loan Product
  ↓
Product Version
  ↓
Decision Policy (v1..vN)
  ↓
Decision Context Builder (Normalized DB / Inputs)
  ↓
Financial Metrics Engine (Decimal.js FOIR / DTI / EMI)
  ↓
BRE Rule Group Evaluator (Logical Matrix)
  ↓
Decision Aggregator & Risk Scoring (Grades A–E, Score 0–100)
  ↓
Decision Snapshot (Immutable Audit Evidence)
  ↓
Workflow Engine Transition (State Machine Stage Advancement)
```

---

## 2. Core Architectural Principles
1. **Zero Hardcoded Rules**: Credit rules, knockouts, and affordability thresholds are never hardcoded in route handlers or controllers.
2. **Deterministic & Explainable**: Every rule evaluation generates actual vs. expected condition evidence, reason codes, and customer-facing explanations.
3. **Decimal Arithmetic**: All financial calculations (FOIR, DTI, Disposable Income, Reducing Balance EMI) utilize `Decimal.js` to prevent IEEE 754 floating-point inaccuracies.
4. **Historical Immutability**: Historical loan applications retain the exact decision snapshot, policy version, and rule definitions active at the time of evaluation.
5. **AI as Supporting Signal**: AI (e.g. Gemini / ML models) serves solely as an advisory risk signal or document extractor; deterministic credit rules remain the sole authoritative decision maker.
6. **Multi-Tenant Isolation**: Tenant boundaries are enforced through cryptographic JWT verification, `X-Tenant-ID` header validation, and database scoping.

---

## 3. Decision Outcomes
The Decision Engine outputs one of four authoritative verdicts:

| Outcome | Description | Default Workflow Routing |
|---|---|---|
| `APPROVE` | All mandatory rules passed, affordability criteria satisfied, risk score in prime bands. | `SANCTION_LETTER_ISSUANCE` / `OFFER_GENERATION` |
| `APPROVE_WITH_CONDITIONS` | Eligibility satisfied with non-blocking condition stipulations. | `STIPULATION_CLEARANCE` / `OFFER_ACCEPTANCE` |
| `REFER` | Borderline financial metrics, documentation gaps, or high FOIR requiring underwriter judgment. | `MANUAL_UNDERWRITING_REVIEW` |
| `REJECT` | Severe policy defect, HARD_STOP knockout, subprime bureau score, or fraud signal detected. | `ADVERSE_ACTION_REJECTION` |

---

## 4. Multi-Dimensional Amount Eligibility
Eligible loan amounts are calculated by taking the minimum across three independent financial boundaries:
1. **Product Policy Limit**: Maximum amount configured on the loan product version.
2. **Income & FOIR Affordability Limit**: Maximum loan supportable given the applicant's verified income and permissible FOIR cap.
3. **Risk-Tier Limit**: Maximum loan exposure allowed for the borrower's assigned risk grade (`A` to `E`).

$$\text{Eligible Amount} = \min(\text{ProductMax}, \text{AffordabilityMax}, \text{RiskMax})$$

---

## 5. Controlled Re-Evaluation & Manual Override
- **Re-Evaluation**: When updated credit reports or income proofs are uploaded, re-evaluating creates a new version (`v2`, `v3`) without overwriting historical records.
- **Manual Override**: Authorized roles (`UNDERWRITER`, `ADMIN`, `SUPER_ADMIN`) may override a system decision with mandatory reason codes, detailed justification comments, and immutable audit logging (`DECISION_OVERRIDDEN`).
