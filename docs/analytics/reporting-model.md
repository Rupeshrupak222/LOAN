# Reporting Model & Dimensional Aggregation

## 1. Supported Dimensions
The reporting engine supports multi-dimensional aggregation across 8 primary business dimensions:

1. **TENANT**: Multi-tenant institutional separation.
2. **BRANCH**: Physical and virtual lending branches.
3. **PRODUCT**: Loan products and pricing variants.
4. **CHANNEL**: Origination channels (`DIRECT_DIGITAL`, `PARTNER_LSP`, `BRANCH_ASSISTED`, `EMBEDDED`).
5. **PARTNER**: Third-party Lending Service Providers (LSPs) and DSAs.
6. **RISK_GRADE**: 5-tier borrower risk grading (`Grade A` to `Grade E`).
7. **LOAN_STATUS**: Operational loan states (`DRAFT`, `UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `DELINQUENT`, `CLOSED`).
8. **DPD_BUCKET**: Standard regulatory delinquency aging buckets (`CURRENT`, `1-30`, `31-60`, `61-90`, `91-180`, `180+`).

---

## 2. Snapshot Schema & Immutability
Periodic snapshots are stored as immutable point-in-time state objects:

```typescript
interface ReportingSnapshotRecord {
  id: string;
  snapshotDate: string; // YYYY-MM-DD
  snapshotType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  tenantId: string;
  totalAum: number;
  activeLoansCount: number;
  totalDisbursedMonth: number;
  totalCollectedMonth: number;
  totalOverdue: number;
  par30Amount: number;
  par90Amount: number;
  totalRevenueMonth: number;
  isImmutable: boolean;
  generatedAt: string;
  metadata?: Record<string, any>;
}
```
Historical reporting snapshots cannot be overwritten or mutated when product policies or pricing models are altered in future periods.
