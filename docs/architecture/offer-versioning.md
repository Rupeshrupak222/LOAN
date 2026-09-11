# Adyapan Lending OS — Offer Versioning & Immutable Snapshots

## Overview
Every generated loan offer is immutable. Changes to amount, tenure, or pricing produce a new offer version (`v1` $\to$ `v2`), preserving previous records for audit and compliance inspection.

---

## 1. Offer Snapshot Data Schema

Each offer record stores:
- `offerNo`: Unique identifier including version suffix (e.g. `OFFER-APP-2026-001-1`).
- `version`: Monotonically increasing integer ($1, 2, 3$).
- `productVersion`: Product engine version at time of offer.
- `decisionVersion`: BRE decision engine version authorizing the loan.
- `approvalPolicyVersion`: Authority matrix version under which sanction was granted.
- `pricingPolicyVersion`: Pricing policy version applied.
- `offeredAmount`, `tenureMonths`, `annualInterestRatePct`, `monthlyEmi`.
- `totalFeesAndTaxes`: Exact fee breakdown with 18% GST.
- `netDisbursedAmount`: Final amount payable to borrower bank account.
- `annualPercentageRateApr`: Statutory APR.
- `schedulePreview`: Complete amortization schedule table.
- `kfsDocument`: Key Fact Statement terms.
