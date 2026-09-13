# Phase 14: Analytics Metric Definitions & Formulas

This document establishes the authoritative definitions for all business and financial KPIs across the Adyapan Lending OS platform.

## 1. Origination & Funnel Metrics
- **Total Applications**: Total loan applications received within the reporting interval.
- **Approval Rate (%)**: `(Approved Applications + Disbursed Applications) / Total Evaluated Applications × 100`
- **Rejection Rate (%)**: `Rejected Applications / Total Evaluated Applications × 100`
- **Referral Rate (%)**: `(Under Review + Submitted) / Total Evaluated Applications × 100`
- **Conversion Rate (%)**: `Stage Count / Total Applications Sourced × 100`
- **Drop-off Rate (%)**: `(Stage Count (N-1) - Stage Count (N)) / Stage Count (N-1) × 100`

## 2. Portfolio & Exposure Metrics
- **AUM / Portfolio Outstanding**: Sum of active loan principal balances (`outstandingPrincipal`).
- **Total Exposure**: `Outstanding Principal + Outstanding Interest + Outstanding Fees & Penalties`.
- **Average Ticket Size**: `Total Disbursed Principal / Completed Disbursement Count`.

## 3. Delinquency & DPD Asset Quality Metrics (Authoritative Phase 11 DPD)
- **PAR 30 (Portfolio at Risk 30+)**: `Principal on Loans with DPD ≥ 30 / Total Active Principal × 100`
- **PAR 60 (Portfolio at Risk 60+)**: `Principal on Loans with DPD ≥ 60 / Total Active Principal × 100`
- **PAR 90 (NPA / Non-Performing Asset)**: `Principal on Loans with DPD ≥ 90 / Total Active Principal × 100`
- **Cure Rate (%)**: `Loans migrating from 30+ DPD back to Current / Total Delinquent Loans × 100`
- **SMA Classification**:
  - **SMA-0**: 1 – 30 DPD
  - **SMA-1**: 31 – 60 DPD
  - **SMA-2**: 61 – 90 DPD
  - **NPA**: 90+ DPD

## 4. Collections & Recovery Metrics
- **Collection Efficiency (%)**: `Realized Collections / Expected Scheduled Receivables for Period × 100`
- **PTP Fulfillment Rate (%)**: `Kept PTPs / Total Created Promise-to-Pays × 100`
- **Recovery Rate (%)**: `Recovered Amounts on Overdue / Total Gross Overdue × 100`

## 5. Financial & General Ledger Metrics (Authoritative Phase 10/12 GL)
- **Net Cash Flow**: `Gross Customer Repayments - Gross Loan Disbursement Outflows`
- **Interest Income**: General Ledger Code `4010` credit balance.
- **Fee Revenue**: General Ledger Code `4020` processing and penal fee credit balance.
- **Partner Commission Expense**: General Ledger Code `5010` debit balance.
