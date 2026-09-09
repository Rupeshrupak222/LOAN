import { env } from '../../config/env';
import { ProviderConfig, IntegrationCategory } from './integration.types';
import { IntegrationHubError } from './integration.errors';

/**
 * Mask sensitive credentials for safe logging or admin API display.
 * Never leaks raw secrets.
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return 'NOT_SET';
  const str = secret.trim();
  if (str.length <= 6) return '******';
  return `${str.slice(0, 3)}****${str.slice(-3)}`;
}

/**
 * SSRF and Outbound URL Security Validator
 * Blocks loopback, RFC 1918 private subnets, cloud metadata IPs (169.254.169.254),
 * and enforces HTTPS in production/staging.
 */
export function validateOutboundUrl(rawUrl: string, allowLocalDev: boolean = false): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new IntegrationHubError(400, 'SSRF_BLOCKED', `Invalid outbound provider URL: ${rawUrl}`);
  }

  // 1. Protocol validation
  const isHttps = parsed.protocol.toLowerCase() === 'https:';
  const isHttp = parsed.protocol.toLowerCase() === 'http:';

  if (!isHttps && !isHttp) {
    throw new IntegrationHubError(
      400,
      'SSRF_BLOCKED',
      `Unsupported protocol '${parsed.protocol}'. Outbound provider requests must use HTTP/HTTPS.`
    );
  }

  if (env.isProduction && !isHttps) {
    throw new IntegrationHubError(
      400,
      'SSRF_BLOCKED',
      `Insecure protocol '${parsed.protocol}' rejected. Production integrations strictly require HTTPS.`
    );
  }

  // 2. Hostname & IP range validation
  const host = parsed.hostname.toLowerCase();

  // Allow explicit localhost testing only in development if allowLocalDev is true
  if (allowLocalDev && (host === 'localhost' || host === '127.0.0.1')) {
    return parsed;
  }

  const blockedPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/, // Loopback IPv4
    /^10\.\d+\.\d+\.\d+$/, // RFC 1918 Class A
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // RFC 1918 Class B
    /^192\.168\.\d+\.\d+$/, // RFC 1918 Class C
    /^169\.254\.\d+\.\d+$/, // Link-local / Cloud Metadata (AWS/GCP/Azure)
    /^0\.0\.0\.0$/,
    /^\.local$/i,
    /^\.internal$/i,
    /^\[?::1\]?$/, // IPv6 loopback
    /^\[?fe80:/i, // IPv6 link-local
    /^\[?fc00:/i, // IPv6 unique-local
    /^\[?fd00:/i, // IPv6 unique-local
    /^0x[0-9a-f]+$/i, // Hex IP representation
    /^\d+$/, // Decimal IP representation (e.g. 2130706433)
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(host)) {
      throw new IntegrationHubError(
        400,
        'SSRF_BLOCKED',
        `[SSRF_BLOCKED] Access to internal, private, or link-local address '${host}' is blocked for security.`
      );
    }
  }

  return parsed;
}

/**
 * Default configurations for all 7 standard LMS provider categories.
 * Derived from environment variables without hardcoding.
 */
export function getProviderConfigurations(): Record<string, ProviderConfig> {
  const nodeEnv = (env.nodeEnv || 'development') as 'development' | 'staging' | 'production';

  // 1. Credit Bureau (CIBIL / Experian)
  const creditBureauKey = process.env.CREDIT_BUREAU_API_KEY;
  const creditBureauUrl = process.env.CREDIT_BUREAU_BASE_URL;

  // 2. KYC / Identity (PAN / Aadhaar / NSDL)
  const kycApiKey = process.env.KYC_GATEWAY_API_KEY;
  const kycBaseUrl = process.env.KYC_GATEWAY_BASE_URL;

  // 3. Banking Data (Account Aggregator / Setu / Finvu)
  const bankingApiKey = process.env.ACCOUNT_AGGREGATOR_API_KEY;
  const bankingBaseUrl = process.env.ACCOUNT_AGGREGATOR_BASE_URL;

  // 4. Payment Gateway (Razorpay / Cashfree)
  const paymentKey = process.env.PAYMENT_GATEWAY_KEY_ID;
  const paymentSecret = process.env.PAYMENT_GATEWAY_KEY_SECRET;
  const paymentBaseUrl = process.env.PAYMENT_GATEWAY_BASE_URL;
  const paymentWebhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;

  // 5. Disbursement Payout Gateway (Cashfree Payouts / RazorpayX)
  const disbKey = process.env.DISBURSEMENT_GATEWAY_KEY;
  const disbBaseUrl = process.env.DISBURSEMENT_GATEWAY_BASE_URL;

  // 6. Communication (SendGrid / Twilio / Meta WhatsApp)
  const emailKey = process.env.SENDGRID_API_KEY || process.env.SMTP_HOST;
  const smsKey = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_API_KEY;

  // 7. Document Services (Cloudinary Storage Vault - already configured)
  const hasCloudinary = Boolean(env.cloudinary.apiKey && env.cloudinary.cloudName);

  return {
    credit_bureau: {
      providerId: 'credit_bureau',
      name: 'Credit Bureau Gateway (CIBIL / Experian)',
      category: 'CREDIT',
      description: 'Official credit score inquiry and credit history report retrieval',
      enabled: Boolean(creditBureauKey && creditBureauUrl),
      environment: nodeEnv,
      baseUrl: creditBureauUrl || undefined,
      timeoutMs: 10000,
      maxRetries: 2,
      rateLimitPerMinute: 60,
      authType: 'BEARER_TOKEN',
      isConfigured: Boolean(creditBureauKey && creditBureauUrl),
      maskedConfigSummary: {
        baseUrl: creditBureauUrl || 'NOT_SET',
        apiKey: maskSecret(creditBureauKey),
        timeoutMs: 10000,
      },
    },

    kyc_identity: {
      providerId: 'kyc_identity',
      name: 'Identity & KYC Verification (NSDL / UIDAI GSP)',
      category: 'KYC',
      description: 'Authoritative PAN verification, Aadhaar OTP XML, and name matching',
      enabled: Boolean(kycApiKey && kycBaseUrl),
      environment: nodeEnv,
      baseUrl: kycBaseUrl || undefined,
      timeoutMs: 8000,
      maxRetries: 2,
      rateLimitPerMinute: 120,
      authType: 'API_KEY',
      isConfigured: Boolean(kycApiKey && kycBaseUrl),
      maskedConfigSummary: {
        baseUrl: kycBaseUrl || 'NOT_SET',
        apiKey: maskSecret(kycApiKey),
        timeoutMs: 8000,
      },
    },

    banking_data: {
      providerId: 'banking_data',
      name: 'Account Aggregator & Bank Verification (RBI AA)',
      category: 'BANKING',
      description: 'Consent-based bank statement fetch and penny-drop account verification',
      enabled: Boolean(bankingApiKey && bankingBaseUrl),
      environment: nodeEnv,
      baseUrl: bankingBaseUrl || undefined,
      timeoutMs: 12000,
      maxRetries: 1,
      rateLimitPerMinute: 60,
      authType: 'BEARER_TOKEN',
      isConfigured: Boolean(bankingApiKey && bankingBaseUrl),
      maskedConfigSummary: {
        baseUrl: bankingBaseUrl || 'NOT_SET',
        apiKey: maskSecret(bankingApiKey),
        timeoutMs: 12000,
      },
    },

    payment_gateway: {
      providerId: 'payment_gateway',
      name: 'Payment Gateway (Razorpay / Cashfree Collection)',
      category: 'PAYMENT',
      description: 'Borrower EMI collections, UPI intent, mandate links, and webhooks',
      enabled: Boolean(paymentKey && paymentSecret),
      environment: nodeEnv,
      baseUrl: paymentBaseUrl || 'https://api.razorpay.com/v1',
      timeoutMs: 15000,
      maxRetries: 1,
      rateLimitPerMinute: 300,
      authType: 'BASIC_AUTH',
      webhookSecret: paymentWebhookSecret || undefined,
      isConfigured: Boolean(paymentKey && paymentSecret),
      maskedConfigSummary: {
        baseUrl: paymentBaseUrl || 'https://api.razorpay.com/v1',
        keyId: maskSecret(paymentKey),
        keySecret: maskSecret(paymentSecret),
        webhookSecret: maskSecret(paymentWebhookSecret),
        timeoutMs: 15000,
      },
    },

    disbursement_payout: {
      providerId: 'disbursement_payout',
      name: 'Commercial Banking & Payout Gateway (IMPS / NEFT)',
      category: 'DISBURSEMENT',
      description: 'Direct corporate banking API for automated loan tranche disbursement',
      enabled: Boolean(disbKey && disbBaseUrl),
      environment: nodeEnv,
      baseUrl: disbBaseUrl || undefined,
      timeoutMs: 15000,
      maxRetries: 0, // Zero retries for payouts without idempotency guarantee
      rateLimitPerMinute: 60,
      authType: 'BEARER_TOKEN',
      isConfigured: Boolean(disbKey && disbBaseUrl),
      maskedConfigSummary: {
        baseUrl: disbBaseUrl || 'NOT_SET',
        apiKey: maskSecret(disbKey),
        timeoutMs: 15000,
      },
    },

    communication_gateway: {
      providerId: 'communication_gateway',
      name: 'Omnichannel Communication (SendGrid / Twilio)',
      category: 'COMMUNICATION',
      description: 'Transactional borrower emails, SMS alerts, and payment reminders',
      enabled: Boolean(emailKey || smsKey),
      environment: nodeEnv,
      timeoutMs: 5000,
      maxRetries: 2,
      rateLimitPerMinute: 500,
      authType: 'API_KEY',
      isConfigured: Boolean(emailKey || smsKey),
      maskedConfigSummary: {
        emailProviderConfigured: Boolean(emailKey),
        smsProviderConfigured: Boolean(smsKey),
        emailKey: maskSecret(process.env.SENDGRID_API_KEY),
        smsKey: maskSecret(process.env.TWILIO_AUTH_TOKEN),
        timeoutMs: 5000,
      },
    },

    document_storage: {
      providerId: 'document_storage',
      name: 'Document Storage Vault (Cloudinary Encrypted CDN)',
      category: 'DOCUMENT',
      description: 'Encrypted object storage for borrower KYC, proofs, and sanction letters',
      enabled: hasCloudinary,
      environment: nodeEnv,
      baseUrl: 'https://api.cloudinary.com/v1_1/' + env.cloudinary.cloudName,
      timeoutMs: 15000,
      maxRetries: 2,
      rateLimitPerMinute: 1000,
      authType: 'API_KEY',
      isConfigured: hasCloudinary,
      maskedConfigSummary: {
        cloudName: env.cloudinary.cloudName,
        apiKey: maskSecret(env.cloudinary.apiKey),
        timeoutMs: 15000,
      },
    },
  };
}
