# Embedded Lending Architecture & Integration Models

## Overview

Adyapan Lending OS supports four primary integration archetypes for embedded lending:

1. **Merchant Checkout BNPL / Split Pay**: Instant point-of-sale credit lines embedded in e-commerce checkouts.
2. **Fintech Sourcing / LSP Co-Lending**: Sourcing partners collecting leads, initiating pre-qualification, and routing applicants to Adyapan for underwriting.
3. **Corporate Payroll Advance / EWA**: Earned wage access and employee personal loans integrated with HRMS/payroll platforms.
4. **Supply Chain & Vendor Invoice Financing**: Embedded B2B revolving credit lines tied to merchant ERP invoices.

---

## 1. End-to-End Embedded Flow

```text
Partner Frontend/App              Adyapan Embedded API                 Lending Engine
        │                                  │                                  │
  1. Capture User & Consent                │                                  │
        ├─────────────────────────────────>│                                  │
        │ POST /partner-customers          │ ➔ Register Customer & Store      │
        │                                  │   Digital Consent Record         │
        │                                  │                                  │
  2. Initiate Application Draft            │                                  │
        ├─────────────────────────────────>│                                  │
        │ POST /partner-applications       │ ➔ Validate Product Policy & Risk │
        │                                  │                                  │
  3. Submit for Underwriting               │                                  │
        ├─────────────────────────────────>│                                  │
        │ POST /partner-applications/submit│ ➔ Trigger BRE / Credit Engine    │
        │                                  │ ➔ Webhook: application.approved  │
        │                                  │                                  │
  4. Fetch KFS & Sanction Offer            │                                  │
        ├─────────────────────────────────>│                                  │
        │ GET /partner-offers/:id          │ ➔ Return Customer-Safe KFS Terms │
        │                                  │                                  │
  5. Accept Terms (Borrower Consent)       │                                  │
        ├─────────────────────────────────>│                                  │
        │ POST /partner-offers/:id/accept  │ ➔ Execute Facility Activation    │
        │                                  │ ➔ Webhook: offer.accepted        │
        │                                  │                                  │
  6. Execute Drawdown (e.g. at Checkout)   │                                  │
        ├─────────────────────────────────>│                                  │
        │ POST /partner-credit-lines/draw  │ ➔ Deduct Limit, Accrue 18% GST   │
        │                                  │ ➔ LMS Double-Entry Booking       │
```

---

## 2. Borrower Transparency & Fair Practices

- **Customer-Safe Disclosures**: The Partner API filters internal credit risk scores and approval authority delegation notes before returning offers to the partner.
- **Statutory KFS Compliance**: All interest rates, APR, penal charges, and processing fees are computed deterministically per RBI Digital Lending Directions.
- **Explicit Consent**: Embedded registrations capture borrower IP, user agent, consent version, and timestamp to satisfy digital audit guidelines.
