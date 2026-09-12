# Customer Application Flow & Data Persistence

## Application State Machine

Applications submitted by borrowers traverse defined operational statuses:

```text
DRAFT ──► SUBMITTED ──► UNDER_REVIEW ──► APPROVED ──► OFFER_GENERATED ──► OFFER_ACCEPTED ──► DISBURSED
  │           │              │
  ▼           ▼              ▼
CANCELLED  REJECTED       REJECTED
```

## Intake API Endpoints

1. **Create Draft**:
   - `POST /api/v1/applications`
   - Body: `{ customerId, productId, requestedAmount, requestedTenureMonths, purpose, channel: 'ONLINE' }`
   - Role Required: `CUSTOMER` or `ADMIN`
   - Returns: Application record with initial status `DRAFT`.

2. **Patch Draft**:
   - `PATCH /api/v1/applications/:id`
   - Body: `{ requestedAmount?, requestedTenureMonths?, purpose?, draftData? }`
   - Access Control: Verifies borrower identity (`req.user.customerId === application.customerId`).

3. **Submit Application**:
   - `POST /api/v1/applications/:id/submit`
   - Transitions status from `DRAFT` to `SUBMITTED`, triggers KYC validation check, and feeds into the BRE (Decision Engine).

4. **Query Applications**:
   - `GET /api/v1/applications`
   - Filtered automatically to the authenticated customer's own applications if called by a `CUSTOMER` token.

## Form Wizard Persistence

The frontend `<ApplicationWizard />` component implements dual-tier persistence:
- **Client-Side Cache**: Local state stored in `localStorage` under `borrower_app_draft_${productId}` to prevent loss during network disconnects.
- **Server-Side Autosave**: Debounced updates dispatched to `PATCH /api/v1/applications/:id` after each step completion (Personal Info, Employment, Bank Details).
