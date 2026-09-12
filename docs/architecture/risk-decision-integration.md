# Phase 9 Architecture: Risk & Fraud 2D Matrix and Decision Engine Integration

## 1. Unified 2D Risk x Fraud Matrix

The 2D Risk x Fraud Matrix maps independently calculated **Risk Bands** (Credit Repayment Capacity) and **Fraud Bands** (Integrity & Anomaly Risk) into an authoritative, unified operational action:

| Risk Band \ Fraud Band | `CLEAR` | `LOW_RISK` | `REVIEW` | `HIGH_RISK` | `CRITICAL_FRAUD` |
|---|---|---|---|---|---|
| **LOW (Grade A)** | `NORMAL` (Auto-Sanction) | `NORMAL` | `FRAUD_REVIEW` | `FRAUD_REVIEW` | `BLOCK` |
| **MODERATE (Grade B)** | `NORMAL` | `NORMAL` | `FRAUD_REVIEW` | `FRAUD_REVIEW` | `BLOCK` |
| **MEDIUM (Grade C)** | `CREDIT_REVIEW` | `CREDIT_REVIEW` | `ADDITIONAL_REVIEW` | `FRAUD_REVIEW` | `BLOCK` |
| **HIGH (Grade D)** | `CREDIT_REVIEW` | `CREDIT_REVIEW` | `ADDITIONAL_REVIEW` | `FRAUD_REVIEW` | `BLOCK` |
| **VERY_HIGH (Grade E)** | `BLOCK` | `BLOCK` | `BLOCK` | `BLOCK` | `BLOCK` |

---

## 2. Core Decision Engine (BRE) Telemetry Injection

The existing Decision Engine (`backend/src/modules/bre/decision-engine.service.ts`) is enriched via `DecisionContext`:
- Injects `riskScore`, `riskBand`, `riskGrade`, `riskRecommendation`.
- Injects `fraudScore`, `fraudOutcome`, `fraudFlags`, `matrixAction`.
- Injects `identityGraphClusterScore` and `maxLinkSeverity`.

### Strict Architectural Boundaries
- **No Parallel Decision Engines**: The Decision Engine continues to govern final sanction policies and credit limits.
- **Customer & Partner Data Redaction**: Public borrower and partner endpoints receive sanitized DTOs (`customer-safe view`) stripping internal fraud heuristics, syndicate cluster nodes, and proprietary scoring weights.
- **Non-Authoritative AI Assistant**: AI suggestions remain strictly advisory. Final decisions and automated matrix transitions are 100% deterministic policy-governed.
