# Rule Engine & Evaluation Matrix

## 1. Rule Resolution Pipeline
During evaluation, the rule engine processes rule groups hierarchically:

1. **Context Resolution**: The engine reads paths (e.g. `borrower.age`, `credit.bureauScore`, `financial.foir`, `derived.proposedEmi`) from the normalized `DecisionContext`.
2. **Derived Computations**: If a rule targets a derived metric, the calculation engine dynamically executes decimal-safe formulas.
3. **Operator Comparison**: The actual value is compared against `expectedValue` using the specified `RuleOperator`.
4. **Outcome Assignment**:
   - `passed = true` $\to$ `actionOnPass` (usually `PASS`)
   - `passed = false` $\to$ `actionOnFail` (`FAIL`, `REFER`, `WARNING`, `CONDITION`)
5. **Logical Group Aggregation**: Rules within a group are combined using `AND`, `OR`, or `NOT`.
6. **Risk Score Contribution**: Each passing rule contributes its configured positive weight; failing or risk rules apply penalties.

---

## 2. Risk Score & Grading Model
The total score ($0 \dots 100$) is mapped to risk grades:

| Total Risk Score | Risk Grade | Risk Tier Description | Underwriting Policy |
|---|---|---|---|
| 85 – 100 | **Grade A** | Super Prime | Straight-Through Processing (STP) Approval |
| 70 – 84 | **Grade B** | Prime | Standard Approval with mandatory e-KYC |
| 55 – 69 | **Grade C** | Near Prime | Conditional Approval or Minor Stipulation |
| 40 – 54 | **Grade D** | Subprime | Referral to Senior Underwriter Review |
| 0 – 39 | **Grade E** | High Risk | Automated Adverse Rejection |

---

## 3. Explainability Matrix
Every evaluated rule produces an explainability record containing:
- `ruleCode` & `ruleName`
- `category` & `severity`
- `actualValue` vs. `expectedValue`
- `passed` status
- `reasonCode` (internal underwriting diagnostics)
- `customerReason` (plain-language explanation for adverse action notices)
