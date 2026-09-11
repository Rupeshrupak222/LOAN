# Authority Matrix & Level Specification

## 1. Policy Structure
An **Approval Authority Policy** defines the sanction rules assigned to a Loan Product or Tenant:

```typescript
export interface ApprovalAuthorityPolicy {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  levels: ApprovalLevelDefinition[];
  multiLevelApprovalEnabled: boolean;
  maxDelegationDays: number;
  sodRules: {
    preventApplicantApproval: boolean;
    preventOriginatorApproval: boolean;
    preventDisbursementMakerApproval: boolean;
    requireFourEyesOnHighRisk: boolean;
  };
}
```

---

## 2. Standard Hierarchy Levels

| Level | Code | Name | Authorized Roles | Amount Band | Risk Grades | Scope |
|---|---|---|---|---|---|---|
| **Level 1** | `LEVEL_1_BRANCH_MANAGER` | Branch Manager Authority | `BRANCH_MANAGER` | ₹0 – ₹5,00,000 | A, B | Branch (Local) |
| **Level 2** | `LEVEL_2_UNDERWRITER` | Senior Credit Underwriter | `UNDERWRITER`, `ADMIN` | ₹5,00,001 – ₹25,00,000 | A, B, C | Tenant (Global) |
| **Level 3** | `LEVEL_3_CREDIT_HEAD` | Head of Credit / VP | `CREDIT_HEAD`, `COMPANY_ADMIN` | ₹25,00,001 – ₹1,00,00,000 | A, B, C, D, E | Tenant (Global) |
| **Level 4** | `LEVEL_4_CREDIT_COMMITTEE` | Board Credit Committee | `CREDIT_COMMITTEE`, `SUPER_ADMIN` | > ₹1,00,00,000 | A, B, C, D, E | Tenant (Global) |

---

## 3. Policy Versioning & Lifecycle
- **`DRAFT`**: Authoring mode for risk officers; not used in live evaluations.
- **`ACTIVE`**: The single live authority policy for the product.
- **`ARCHIVED`**: Historical versions retained for audit reproducibility.
- When an active policy is updated, an incremental clone (`v+1`) is automatically versioned.
