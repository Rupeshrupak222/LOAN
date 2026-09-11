# Business Rules Engine (BRE) Specification

## 1. Role in Adyapan Lending OS
The Business Rules Engine (BRE) evaluates normalized borrower, credit, financial, banking, and fraud data structures (`DecisionContext`) against structured rule definitions.

---

## 2. Rule Model & Attributes
Each rule is defined as a typed, serializable entity:

```typescript
export interface DecisionRule {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  expectedValue: any;
  severity: RuleSeverity;
  actionOnPass: RuleAction;
  actionOnFail: RuleAction;
  reasonCode: string;
  customerReason?: string;
  weight: number;
  enabled: boolean;
  priority: number;
}
```

---

## 3. Rule Categories
1. **`ELIGIBILITY`**: Applicant age (e.g., 21–58 years), nationality, residence type, minimum work experience.
2. **`CREDIT`**: Bureau score floor (e.g., CIBIL $\ge$ 650), max DPD in last 12 months, maximum recent enquiries, zero written-off accounts.
3. **`FINANCIAL`**: Minimum verified monthly salary, maximum permissible FOIR (e.g., $\le$ 55%), maximum DTI, minimum net disposable income.
4. **`BANKING`**: Average monthly balance (AMB), inward cheque/ECS return count in 90 days, direct salary credit verification.
5. **`KYC_DOCS`**: PAN NSDL verification, Aadhaar eKYC, address proof verification, mandatory income document uploads.
6. **`FRAUD_RISK`**: Automated fraud risk score cap, duplicate applicant matching, device fingerprint anomaly, negative pincode zones.
7. **`PRODUCT_POLICY`**: Product tenure limits, amount caps, customer segment restrictions.

---

## 4. Evaluation Operators
The BRE supports 13 standard operators:
- `EQUALS` / `NOT_EQUALS`
- `GREATER_THAN` / `GREATER_THAN_OR_EQUAL`
- `LESS_THAN` / `LESS_THAN_OR_EQUAL`
- `BETWEEN` (Range `[min, max]`)
- `IN` / `NOT_IN` (Set membership)
- `EXISTS` / `NOT_EXISTS` (Field presence and non-null check)
- `CONTAINS` / `NOT_CONTAINS` (Substrings / Array element inclusion)

---

## 5. Severity & Action Hierarchy
Rules have a severity classification determining their impact on the aggregated decision:
- **`HARD_STOP`**: If failed, instantly forces a `REJECT` decision (e.g., fake PAN, active suit-filed delinquency).
- **`HIGH`**: Major defect; typically triggers `REJECT` or high-grade condition depending on policy configuration.
- **`MEDIUM`**: Triggers `REFER` to manual underwriting or an `APPROVE_WITH_CONDITIONS` requirement.
- **`LOW`** / **`INFO`**: Advisory warnings that adjust the weighted risk score without blocking automated approvals.
