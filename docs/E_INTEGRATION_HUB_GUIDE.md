# ADYAPAN LENDING PLATFORM — INTEGRATION HUB GUIDE

## 1. Multi-Tenant Connector Architecture
The Integration Hub enables distinct institutions to securely configure their own external provider credentials:
- **Credit Bureaus**: CRIF High Mark, Experian, CIBIL, Equifax.
- **Payment Gateways**: Razorpay, Cashfree, PayU, Stripe.
- **Identity & eKYC**: Digilocker, NSDL PAN, UIDAI Aadhaar XML.
- **Account Aggregators**: Setu AA, Anumati, OneMoney, Finvu.

---

## 2. AES-256-GCM Credential Encryption
- All secret API keys, webhook secrets, and private certificates are encrypted using **AES-256-GCM** with unique Initialization Vectors (IVs) and authentication tags.
- Plaintext secrets are never written to database tables or logged to stdout.
- Decryption occurs strictly in-memory during outbound HTTP dispatch.

---

## 3. Webhook HMAC-SHA256 Signature Verification
- Inbound webhooks from payment gateways and bureaus must include an HMAC-SHA256 signature in the HTTP headers.
- The platform uses constant-time verification (`crypto.timingSafeEqual`) to prevent timing attacks.
- Tampered payloads are rejected with HTTP 401 Unauthorized.

---

## 4. Outbound SSRF Protection
- Outbound custom integration endpoints are validated against private IP spaces.
- Requests targeting loopback (`127.0.0.1`), RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS IMDS (`169.254.169.254`) are strictly blocked with HTTP 400 Bad Request.
