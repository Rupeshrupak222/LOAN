# Collection Workflow, Work Queues & Promise Tracking

## 1. Collector Work Queues

Cases are segmented into three operational queue views:
- **`My Queue`**: Active cases assigned specifically to the logged-in collection officer.
- **`Team Queue`**: Branch/tenant-wide active cases visible to supervisors and credit managers.
- **`Unassigned Queue`**: Delinquent cases requiring automated or manual collector allocation.

---

## 2. Promise to Pay (PTP) Automation

```
1. Customer commits to payment amount and future date.
2. PTP created in status 'PENDING', case marked 'PROMISED'.
3. On payment arrival (Phase 10 Payment Webhook / Confirmation):
   - If paymentAmount >= promisedAmount → Status marked 'KEPT' / 'FULFILLED'.
   - If paymentAmount < promisedAmount → Status marked 'PARTIALLY_FULFILLED'.
4. Scheduled Cron Sync:
   - If promisedDate < now and status == 'PENDING' → Status marked 'BROKEN'.
   - Case priority bumped, broken PTP count incremented, case returned to 'IN_PROGRESS'.
```

---

## 3. Multi-Tier Escalations

- **`TIER_1_COLLECTOR`**: Digital outreach and direct phone engagement.
- **`TIER_2_SUPERVISOR`**: Field recovery scheduling, dispute resolution, and repayment rescheduling.
- **`TIER_3_COLLECTION_MANAGER`**: Debt settlement evaluation, waiver structuring, and NPA review.
- **`TIER_4_LEGAL_RECOVERY`**: Formal legal notices (Section 138 / Section 25), arbitration, and debt recovery tribunals.
