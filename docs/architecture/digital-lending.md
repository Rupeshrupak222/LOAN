# Digital Lending & Borrower Experience Architecture

## Overview

The Digital Lending & Borrower Experience subsystem of Adyapan Lending OS provides a modern, responsive, and secure customer-facing portal that interfaces directly with core lending engines. It eliminates fragmented multi-app flows by unifying product discovery, identity verification, automated underwriting, statutory offer acceptance, legally binding digital contracts, auto-debit registration, automated payouts, double-entry repayment servicing, and revolving credit drawdowns into a single stage-gated architecture.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BORROWER PORTAL UI                                 │
│  (Discovery ➔ Intake Draft ➔ e-KYC ➔ Offer/KFS ➔ eSign ➔ eNACH ➔ Repayment)  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ REST / API Gateway
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DIGITAL LENDING BACKEND ORCHESTRATION                     │
├─────────────────┬───────────────────┬──────────────────┬─────────────────────┤
│ Product Engine  │ BRE / Underwrite  │ Offer Engine     │ Contracts & eSign   │
│ (v1.0.0 Catalog)│ (Auto Sanction)   │ (RBI KFS/APR)    │ (Aadhaar / OTP)     │
├─────────────────┼───────────────────┼──────────────────┼─────────────────────┤
│ eNACH Mandates  │ Payment Rails     │ LMS Servicing    │ Credit Limit Engine │
│ (NPCI Debit)    │ (IMPS / UPI Payout│ (Double-Entry)   │ (Revolving Limits)  │
└─────────────────┴───────────────────┴──────────────────┴─────────────────────┘
```

## Core Principles

1. **Zero Mocked Calculations**: Every monetary figure, EMI, APR, tax breakdown (18% GST), interest accrual, and exposure cap is computed server-side by authoritative domain engines.
2. **Strict Multi-Tenancy**: All customer interactions are tenant-scoped via the borrower's authentication context and tenant subdomains/headers.
3. **Stage-Gated Integrity**: Transitions between application stages enforce prerequisite completion (e.g., eSign and eNACH are mandatory prior to disbursement execution).
4. **Regulatory Adherence**: Full compliance with RBI Digital Lending Directions, mandatory Key Fact Statement (KFS) explicit acknowledgment, and anti-IDOR security guards.
