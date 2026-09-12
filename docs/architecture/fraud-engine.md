# Phase 9 Architecture: Advanced Fraud Engine

## 1. Executive Summary & Objective

The **Advanced Fraud Engine** identifies anomalies, identity manipulation, syndicate clusters, device tampering, and velocity abuse across direct, assisted, and partner/LSP loan applications. It produces an anomaly score between 0 and 100, an operational Fraud Outcome (`CLEAR`, `LOW_RISK`, `REVIEW`, `HIGH_RISK`, `BLOCK`), triggering anomaly flags, and an interactive Identity Graph cluster.

```
+-----------------------------------------------------------------------------------+
|                            5-PILLAR FRAUD SIGNALS                                 |
|                                                                                   |
|  [IDENTITY]       [BANK_ACCOUNT]    [DEVICE]       [NETWORK]     [VELOCITY]       |
|  PAN mismatch,    Account reuse,    Fingerprint,   Proxy/VPN,    Rapid apps,      |
|  Name distance    Penny-drop fail   Root/Emulator  IP cluster    Shared contact   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │   Configurable Fraud Rules Engine     │
                     │    Deterministic Penalty Operators    │
                     └───────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │ Fraud Score: 0 - 100  │                       │ Identity Graph        │
     │ Outcome: CLEAR..BLOCK │                       │ Cross-Entity Cluster  │
     │ Triggered Rule Flags  │                       │ Risk Score & Severity │
     └───────────────────────┘                       └───────────────────────┘
```

---

## 2. 5-Pillar Fraud Signal Taxonomy

1. **IDENTITY (Demographic & Document Consistency)**:
   - Evaluates PAN format validity, Levenshtein distance between declared name and bureau/penny-drop name, duplicate national ID registry match, Aadhaar/PAN mismatch.
2. **BANK_ACCOUNT (Disbursement Account Integrity)**:
   - Penny-drop account holder name divergence, shared bank account reuse across distinct borrower PANs, virtual payment address (VPA) velocity.
3. **DEVICE (Hardware & App Environment Integrity)**:
   - Device hardware fingerprinting, rooted / jailbroken device detection, emulator execution, mock location usage, high device-to-borrower ratio.
4. **NETWORK (IP & Infrastructure Hygiene)**:
   - Data center / Tor / VPN exit node detection, geo-location distance between IP and borrower residence, high IP sharing across concurrent applications.
5. **APPLICATION_VELOCITY (Velocity & Syndicate Patterns)**:
   - Rapid multiple loan submissions within 1h/24h, multiple applications across different LSP partners with shared device or contact, suspicious sudden limit surges.

---

## 3. Fraud Outcomes & Automated Routing

| Score Range | Outcome | Operational Routing | Hard Block Trigger |
|---|---|---|---|
| **0 – 15** | `CLEAR` | Straight-Through Processing (STP) | No |
| **16 – 35** | `LOW_RISK` | Standard Underwriting Verification | No |
| **36 – 65** | `REVIEW` | Route to Fraud Investigation Desk | No |
| **66 – 85** | `HIGH_RISK` | Senior Fraud Officer Inspection + Video KYC | Optional |
| **86 – 100** | `BLOCK` | Automated Hard Rejection / Blacklist | **Yes** |

---

## 4. Multi-Tenant Configurable Fraud Rules

The engine executes customizable deterministic rules with specific operator comparisons (`EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `IN`, `CONTAINS`, `REGEX`):
- `FRAUD_IDENTITY_PAN_NAME_MISMATCH`: High-severity penalty if name mismatch score exceeds 40.
- `FRAUD_BANK_ACCOUNT_REUSE`: High-severity penalty if disbursement account is reused across distinct PANs.
- `FRAUD_DEVICE_ROOTED`: Critical penalty if device is flagged as rooted or running in emulator.
- `FRAUD_VELOCITY_BURST`: Critical penalty if application velocity exceeds 3 submissions in 1 hour.
