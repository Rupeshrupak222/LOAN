# Adyapan Lending OS — Pricing Policy Engine

## Overview
Pricing policies configure interest models, risk-graded rate adjustments, amount slabs, tenure spreads, fee overrides, and statutory tax treatment across lending products and tenant institutions.

---

## 1. Risk-Graded Pricing Matrix

| Risk Grade | Credit Profile | Spread Adjustment | Net Example Rate | Offerability |
|---|---|---|---|---|
| **Grade A** | Prime ($750+$ score) | $-0.50\%$ ($-50\text{ bps}$) | $14.00\%$ | Direct STP |
| **Grade B** | Near-Prime ($700 - 749$) | $+0.00\%$ ($0\text{ bps}$) | $14.50\%$ | Standard Review |
| **Grade C** | Fair ($650 - 699$) | $+1.50\%$ ($+150\text{ bps}$) | $16.00\%$ | Underwriter Sanction |
| **Grade D** | Subprime ($600 - 649$) | $+3.00\%$ ($+300\text{ bps}$) | $17.50\%$ | Senior Credit Authority |
| **Grade E** | Elevated Risk ($<600$) | $+5.00\%$ ($+500\text{ bps}$) | $19.50\%$ | Exception Policy Only |

---

## 2. Policy Versioning

When pricing policies are modified:
1. Current policy remains `ACTIVE` for existing in-flight applications.
2. New draft version (`v2`) is created.
3. Upon activation, new applications evaluate against `v2`.
