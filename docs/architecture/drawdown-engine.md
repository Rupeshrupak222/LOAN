# Drawdown Engine & Fee Deduction Architecture

## Drawdown Execution Lifecycle
1. **Validation Gate**:
   - Facility status MUST be `ACTIVE`.
   - Facility MUST NOT be expired (`expiresAt > now`).
   - Requested amount MUST satisfy:
     $$\text{minDrawdownAmount} \le \text{Requested Amount} \le \text{availableAmount}$$
   - Customer remaining exposure capacity MUST accommodate the drawdown.
2. **Statutory Fee Deductions (Decimal.js)**:
   $$\text{Platform Fee} = \max(\text{minFee}, \text{Requested} \times \text{feePct})$$
   $$\text{GST} = \text{Platform Fee} \times 18\%$$
   $$\text{Total Deductions} = \text{Platform Fee} + \text{GST}$$
   $$\text{Net Disbursed Amount} = \text{Requested Amount} - \text{Total Deductions}$$
3. **Atomic Balance Update**:
   - $\text{Utilized Amount} \leftarrow \text{Utilized Amount} + \text{Requested Amount}$
   - $\text{Available Amount} \leftarrow \text{Approved Limit} - \text{Utilized Amount}$
4. **Audit & LMS Linkage**:
   - Create `Drawdown` record with EMI schedule.
   - Record `DRAWDOWN` in `CreditFacilityTransaction` ledger.
