# Phase 14: Enterprise Executive Command Center

## 1. Overview
The Enterprise Command Center (`/command-center`) is the dedicated operational operating cockpit for C-suite executives, credit committee heads, and senior risk managers.

## 2. Telemetry Pillars
The Command Center aggregates real-time health across 8 core pillars:
1. **Enterprise Snapshot**: Gross AUM, active loans, daily disbursements, approval rate, collection efficiency, and composite portfolio risk indicator (`OPTIMAL`, `MODERATE`, `ELEVATED`, `HIGH`).
2. **Origination & Growth Velocity**: Application intake velocity, 7-day trend, and month-over-month growth rate.
3. **Credit & BRE Decisioning**: Approval vs rejection vs referral breakdown and top adverse action reasons.
4. **Portfolio Health & PAR Delinquency**: Live outstanding principal, PAR 30 rate, and PAR 90 (NPA) exposure.
5. **Collections & Recovery Performance**: PTP fulfillment %, recovered capital, and recovery conversion.
6. **Financial Controls & Exceptions**: Net operating cash movement and pending maker-checker adjustment approvals.
7. **Operational SLAs & Bottlenecks**: Workflow compliance percentage, stale queues (> 48h), and identified active bottleneck stage.
8. **Partner Distribution Contribution**: Sourced loan volume contribution and active partner metrics.

## 3. Executive Natural Language Query (NLQ)
The Command Center includes an AI Natural Language Query processor that translates natural language inquiries into authoritative telemetry. Supported query categories include:
- Branch disbursement volume comparison
- Risk policy exception approvals
- High-risk partner delinquency audits
- Maker-checker reconciliation discrepancies
- Portfolio PAR 30 and PAR 90 metrics
