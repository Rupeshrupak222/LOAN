# Multi-Pillar Reconciliation & Financial Exception Handling

## 1. 5-Pillar Matching Engine

The automated reconciliation engine performs exhaustive multi-way matching across:
1. **Gateway / Bank Statement Records** (External Webhook / Bank Settlement feed)
2. **Internal Transaction Logs** (`prisma.transaction` and `PaymentSubmission`)
3. **Double-Entry General Ledger (GL)** (`GeneralLedgerService` & Trial Balance)
4. **Loan Repayment Schedules** (`RepaymentScheduleItem` paid vs outstanding)
5. **Customer Exposure & Facility Balances** (`CreditFacility` utilized vs approved)

```mermaid
flowchart TD
    subgraph DataSources ["Financial Sources"]
        PGFeed["1. Payment Gateway Feed"]
        TxLog["2. Internal Transactions"]
        GLLedger["3. General Ledger (GL)"]
        Schedule["4. Repayment Schedules"]
    end

    subgraph MatchingPillars ["5-Pillar Tri-Party Engine"]
        P1["Pillar 1: Repayment Allocation Consistency (Sum Buckets == Amount)"]
        P2["Pillar 2: Outstanding Principal vs Schedule Balance"]
        P3["Pillar 3: Missing Transactions / Unlinked Submissions"]
        P4["Pillar 4: Duplicate Bank References / UTR Scanning"]
        P5["Pillar 5: Disbursement Bank Instruction Status"]
    end

    subgraph ResolutionDesk ["Maker-Checker Resolution Desk"]
        ExceptionQueue["Exception Queue (Critical / High / Medium)"]
        AdjustmentMaker["Maker: Propose Ledger Adjustment"]
        AdjustmentChecker["Checker: Independent Approval Dual Control"]
    end

    DataSources --> MatchingPillars
    MatchingPillars --> ExceptionQueue
    ExceptionQueue --> AdjustmentMaker
    AdjustmentMaker --> AdjustmentChecker
```

---

## 2. Maker-Checker Segregation of Duties

- Any financial adjustment $\ge \text{₹5,000}$, ledger correction, or payment reversal triggers `PENDING_APPROVAL` status.
- **SoD Policy (`SOD_RECONCILIATION_RESOLVER_AUDITOR`)**: The user proposing an adjustment cannot approve their own adjustment. A distinct Finance Officer or Super Admin Checker must validate the audit justification.
