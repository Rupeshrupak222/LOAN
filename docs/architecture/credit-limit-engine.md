# Phase 5 — Credit Limit Engine Architecture

## Overview
The **Credit Limit Engine** within the Adyapan Lending OS determines and manages a borrower's sanctioned credit capacity across institutional lending products, supporting revolving credit lines, overdraft limits, BNPL facilities, and multi-drawdown structures alongside traditional term loans.

The engine answers:
> *"How much credit capacity can this customer have, how much has been used, and how much is currently available?"*

---

## 1. Credit Facility vs. Sanctioned Loan
A critical architectural separation is maintained between:
- **Credit Limit / Facility (`CreditFacility`)**: The master approved credit capacity (e.g. ₹2,00,000 sanctioned revolving line) with risk grade, versioning, validity period, and exposure bounds.
- **Drawdown / Loan (`Drawdown` & LMS `Loan`)**: An individual cash withdrawal against the active facility (e.g. Drawdown 1: ₹60,000, Drawdown 2: ₹40,000), carrying its own fee deductions, repayment schedule, and monthly EMI.

---

## 2. Mathematical Balance Invariants
All balance movements are calculated using `Decimal.js` (`Money.round`):
$$\text{Available Amount} = \max(0, \text{Approved Limit} - \text{Utilized Amount})$$

### Excess Exposure Handling
When an institutional underwriter or periodic review decreases a credit limit below current utilized balance (e.g., limit reduced from ₹2,00,000 to ₹1,50,000 when ₹1,70,000 is utilized):
- $\text{Approved Limit} = ₹1,50,000$
- $\text{Utilized Amount} = ₹1,70,000$
- $\text{Available Amount} = ₹0$ (never negative)
- $\text{Excess Exposure} = ₹20,000$ (explicitly recorded and tracked)

---

## 3. Double-Entry Immutable Ledger
Every state change produces an auditable `CreditFacilityTransaction`:
- `LIMIT_ASSIGNED`: Initial facility activation from accepted offer.
- `LIMIT_INCREASED` / `LIMIT_DECREASED` / `LIMIT_OVERRIDDEN`: Controlled versioned adjustments.
- `DRAWDOWN`: Utilization increase and balance debit upon cash transfer.
- `REPAYMENT_CREDIT`: Automatic restoration of available limit on principal settlement.
- `REPAYMENT_REVERSED`: Immediate re-utilization upon payment chargeback/reversal.
- `SUSPENSION` / `RESUMPTION` / `CLOSURE`: Operational risk events.
