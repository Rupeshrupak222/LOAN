# Revolving Credit Line Experience

## 1. Credit Facility & Drawdown Flow
For revolving credit line products (Phase 5):
- Available Credit Limit is calculated in real time: `Available = Approved Limit - Utilized Amount`.
- Borrower enters desired drawdown amount within the available limit bounds.
- System automatically deducts platform fees + GST and calculates net payout.
- Instant IMPS payout is executed, and the credit limit utilization is incremented.

---

## 2. Limit Restoration & Reversals
- **Repayment Restoration**: When principal installments are paid via Phase 10 payments, available limit is automatically replenished.
- **Credit Limit Reassessment**: Periodic reviews and on-time repayment milestones allow credit limit increases with maker-checker approvals.
