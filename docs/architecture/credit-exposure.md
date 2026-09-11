# Customer Total Exposure Engine

## Multi-Product Exposure Calculation
Customer total exposure aggregates obligations across all active loans and credit facilities:

$$\text{Total Customer Exposure} = \sum \text{Term Loan Outstanding Principal} + \sum \text{Credit Facility Utilized Balances}$$

$$\text{Remaining Exposure Capacity} = \max(0, \text{Max Customer Exposure Cap} - \text{Total Customer Exposure})$$

## Policy-Level Constraints
The `CreditLimitPolicy` enforces:
- `maxCustomerExposure`: Upper ceiling (e.g. ₹10,00,000) across all products for a single customer.
- `maxActiveFacilitiesPerCustomer`: Maximum concurrent active credit lines.
- `maxConcurrentDrawdowns`: Maximum active outstanding drawdowns.
- `riskLimitCaps`: Risk grade-specific ceilings (`A`: ₹5,00,000, `B`: ₹3,00,000, `C`: ₹1,50,000, `D`: ₹50,000, `E`: Ineligible).
