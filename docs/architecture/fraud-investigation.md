# Phase 9 Architecture: Fraud Investigation & Identity Graph

## 1. Fraud Investigation Case Desk

When an application receives a `REVIEW`, `HIGH_RISK`, or `BLOCK` outcome, an investigation case is automatically generated or escalated.

### Case Lifecycle

```
┌────────┐      Assign       ┌───────────┐     Escalate     ┌───────────┐
│  OPEN  │ ───────────────>  │ IN_REVIEW │ ───────────────> │ ESCALATED │
└────────┘                   └───────────┘                  └───────────┘
                                   │                              │
                                   ▼                              ▼
                             ┌──────────────────────────────────────────┐
                             │       RESOLVED: CLEARED / CONFIRMED      │
                             └──────────────────────────────────────────┘
                                                   │
                                                   ▼
                                             ┌───────────┐
                                             │  CLOSED   │
                                             └───────────┘
```

### Case Evidence & Audit Timeline
- **Timeline Notes**: Investigators log immutable commentary and interview findings with timestamp and user role.
- **Evidence Documents**: Attach bank statements, salary slips, video KYC screenshots, and third-party bureau/telecom reports.
- **Resolution Verdict**: Record final disposition (`CLEARED`, `CONFIRMED_FRAUD`, `FALSE_POSITIVE`, `REJECTED_LOAN`) with formal reason.

---

## 2. Identity Graph Cluster Analysis

The Identity Graph builds a cross-application entity network connecting:
- **Primary Customer Nodes**: Name, Mobile, Customer ID.
- **Identity Nodes**: PAN Number, Aadhaar Reference.
- **Financial Nodes**: Bank Account Number, IFSC, UPI VPA.
- **Device & Hardware Nodes**: Unique Device Fingerprint, IMEI hash.
- **Network Nodes**: Origination IP Address, Subnet.
- **Partner / LSP Nodes**: Channel Partner Org ID.

### Syndicate Detection
If 2 or more distinct borrower identities share a disbursement bank account, device fingerprint, or origination IP within a short window, a high-severity cluster alert is generated and attached to the fraud evaluation report.
