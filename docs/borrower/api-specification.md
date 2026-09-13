# Borrower Digital Lending API Specification

Base Endpoint: `/api/v1/borrower`
Authentication: Bearer JWT Token (`CUSTOMER` or borrower role)

---

## Endpoints

### 1. `GET /api/v1/borrower/home`
Returns borrower dashboard summary, pre-approved limit, active application tracker, and active loan servicing overview.

**Response `200 OK`:**
```json
{
  "borrower": {
    "id": "cust-uuid",
    "customerCode": "CUST-856383",
    "firstName": "Ananya",
    "lastName": "Sharma",
    "email": "ananya@adyapan.com",
    "mobile": "9876543210",
    "kycStatus": "VERIFIED",
    "panNumberMasked": "ABCDE****F"
  },
  "creditLimit": {
    "preApprovedLimit": 250000,
    "availableLimit": 250000,
    "utilizedLimit": 0,
    "currency": "INR",
    "isEligible": true
  },
  "activeApplication": null,
  "activeLoan": null,
  "recentTransactions": []
}
```

---

### 2. `POST /api/v1/borrower/eligibility`
Calculates instant borrowing eligibility using FOIR formula.

**Request Body:**
```json
{
  "productId": "prod-uuid",
  "monthlyIncome": 75000,
  "existingMonthlyEmi": 15000,
  "requestedAmount": 200000,
  "requestedTenureMonths": 24,
  "employmentType": "SALARIED"
}
```

**Response `200 OK`:**
```json
{
  "isEligible": true,
  "maxEligibleAmount": 466326,
  "minEligibleAmount": 10000,
  "recommendedTenureMonths": 24,
  "indicativeInterestRateApr": 14.5,
  "indicativeEmiAmount": 9650,
  "productName": "Personal Loan",
  "productCode": "PL",
  "safeMessage": "Congratulations! You are eligible for loans up to ₹4,66,326.",
  "keyHighlights": [
    "Zero prepayment penalty after 6 months",
    "Instant bank disbursement via IMPS/NEFT",
    "Statutory KFS with transparent APR"
  ]
}
```

---

### 3. `POST /api/v1/borrower/apply`
Submits multi-step digital loan application.

**Request Body:**
```json
{
  "productId": "prod-uuid",
  "requestedAmount": 150000,
  "tenureMonths": 18,
  "purpose": "Home Renovation",
  "firstName": "Ananya",
  "lastName": "Sharma",
  "dob": "1994-06-15",
  "gender": "FEMALE",
  "addressLine1": "Flat 402, Lotus Tower",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400050",
  "employmentType": "SALARIED",
  "employerName": "Tech Innovations Ltd",
  "monthlyIncome": 80000,
  "existingEmiObligations": 10000,
  "panNumber": "ABCPS1234F",
  "aadhaarNumberMasked": "XXXX-XXXX-5544",
  "kycConsentGiven": true,
  "accountHolderName": "Ananya Sharma",
  "accountNumber": "987654321012",
  "ifscCode": "HDFC0001234",
  "bankName": "HDFC Bank",
  "accountType": "SAVINGS",
  "creditBureauConsent": true,
  "termsAccepted": true
}
```

**Response `201 Created`:**
```json
{
  "applicationId": "app-uuid",
  "applicationNumber": "APP-293196-213",
  "status": "APPROVED",
  "offerId": "off-3fc40808",
  "sanctionedAmount": 150000,
  "tenureMonths": 18,
  "emiAmount": 9324,
  "apr": 15.75,
  "netDisbursement": 147050
}
```

---

### 4. `GET /api/v1/borrower/offers/:offerId/kfs`
Retrieves statutory Key Fact Statement (KFS) formatted per RBI rules.

---

### 5. `POST /api/v1/borrower/offers/:offerId/accept`
Accepts the binding loan offer.

---

### 6. `POST /api/v1/borrower/applications/:id/esign`
Executes simulated Aadhaar OTP eSign on the digital loan contract.

---

### 7. `POST /api/v1/borrower/applications/:id/mandate-disburse`
Sets up eNACH mandate and disburses active loan account into LMS.

---

### 8. `GET /api/v1/borrower/loans/:id`
Fetches active loan account details, repayment schedule, and transaction history.

---

### 9. `POST /api/v1/borrower/repay`
Processes instant digital loan repayment (UPI / NetBanking) with waterfall schedule allocation.

---

### 10. `GET /api/v1/borrower/loans/:id/noc`
Generates verifiable No-Objection Certificate with SHA-256 digital signature hash.

---

### 11. `POST /api/v1/borrower/support`
Creates a 24-hour turnaround consumer support ticket.
