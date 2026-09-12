# Authoritative Metric Definitions & Sources of Truth

| Metric Domain | Metric Name | Mathematical Formula / Definition | Authoritative Source of Truth |
|---|---|---|---|
| **Originations** | Approval Rate (%) | `(Approved + Sanctioned + Disbursed Apps) / Total Sourced Apps * 100` | `LoanApplication` (Status) |
| **Originations** | Turnaround Time (TAT) | `Application Submission Timestamp → Final Sanction Decision Timestamp` | `ApplicationStatusHistory` |
| **Portfolio** | Total AUM | `Sum(Loan.outstandingPrincipal)` for all active / disbursed loans | `Loan.outstandingPrincipal` |
| **Delinquency** | PAR 30 Ratio (%) | `Sum(Loan.outstandingPrincipal where DPD >= 30) / Total Active Principal * 100` | Phase 11 `CollectionCase.dpd` |
| **Delinquency** | Gross NPA Ratio (%) | `Sum(Loan.outstandingPrincipal where DPD >= 90) / Total Active Principal * 100` | Phase 11 `CollectionCase.dpd` |
| **Collections** | Collection Efficiency (%) | `Collected Amount / (Collected Amount + Overdue Demand) * 100` | Phase 10 `Payment` & Phase 11 `CollectionCase` |
| **Collections** | PTP Fulfillment Rate (%) | `Kept Promises to Pay / Total Promises to Pay * 100` | `PromiseToPay.status` |
| **Financials** | Gross Operating Revenue | `Interest Income + Processing Fees + Penalty Charges + Documentation Fees` | Phase 12 `financialStatementsService` |
| **Financials** | Net Operating Income | `Gross Operating Revenue - Partner Commissions - Operating Expenses` | Phase 12 `ProfitAndLossReport` |
| **Risk / Fraud** | High-Risk Portfolio Share (%) | `Sum(Exposure on Grade D & E Loans) / Total Portfolio * 100` | Phase 9 `RiskAssessment` & `Loan` |
| **Operational SLA** | Stage SLA Breach Rate (%) | `Breached Stage Tasks / Total Processed Stage Tasks * 100` | Workflow Execution Timers |
| **Support** | Grievance Resolution TAT | `Grievance Registration Date → Formal Concession / Resolution Date` | Phase 13 `SupportComplaint` |
