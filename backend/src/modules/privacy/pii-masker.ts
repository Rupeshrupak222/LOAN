/**
 * Centralized PII & Secret Masking Utility
 * Ensures data minimization and regulatory compliance (DPDP Act / RBI Guidelines).
 * Masks sensitive identifiers in logs, error payloads, and audit trails.
 */

export class PiiMasker {
  /**
   * Mask PAN Number (e.g. ABCDE1234F -> AB******4F)
   */
  public static maskPan(pan?: string | null): string {
    if (!pan) return 'NOT_PROVIDED';
    const trimmed = pan.trim().toUpperCase();
    if (trimmed.length < 5) return '*****';
    return `${trimmed.slice(0, 2)}******${trimmed.slice(-2)}`;
  }

  /**
   * Mask Aadhaar Number (e.g. 123456789012 -> XXXX-XXXX-9012)
   */
  public static maskAadhaar(aadhaar?: string | null): string {
    if (!aadhaar) return 'NOT_PROVIDED';
    const clean = aadhaar.replace(/[\s-]/g, '');
    if (clean.length < 4) return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }

  /**
   * Mask Bank Account Number (e.g. 1234567890123 -> XXXXXXXX0123)
   */
  public static maskBankAccount(accountNo?: string | null): string {
    if (!accountNo) return 'NOT_PROVIDED';
    const clean = accountNo.trim();
    if (clean.length <= 4) return '****';
    return `${'X'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
  }

  /**
   * Mask Phone / Mobile Number (e.g. 9876543210 -> +91 ******3210)
   */
  public static maskPhone(phone?: string | null): string {
    if (!phone) return 'NOT_PROVIDED';
    const clean = phone.replace(/[\s+-]/g, '');
    if (clean.length < 4) return '******';
    return `+91 ******${clean.slice(-4)}`;
  }

  /**
   * Mask Email Address (e.g. ramesh.sharma@example.com -> r***a@example.com)
   */
  public static maskEmail(email?: string | null): string {
    if (!email) return 'NOT_PROVIDED';
    const parts = email.split('@');
    if (parts.length !== 2) return '*****@***.***';
    const [name, domain] = parts;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}***${name.slice(-1)}@${domain}`;
  }

  /**
   * Mask Secret / API Key / Token (e.g. live_secret_9988 -> liv****988)
   */
  public static maskSecret(secret?: string | null): string {
    if (!secret) return 'NOT_SET';
    const trimmed = secret.trim();
    if (trimmed.length <= 6) return '******';
    return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`;
  }

  /**
   * Deeply sanitize any object to remove raw passwords, tokens, API keys, and mask PII fields
   */
  public static sanitizeObject(obj: any, depth: number = 0): any {
    if (depth > 8 || obj === null || obj === undefined) return obj;

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => PiiMasker.sanitizeObject(item, depth + 1));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Redact credentials and raw secrets
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        sanitized[key] = typeof value === 'string' ? PiiMasker.maskSecret(value) : '[REDACTED]';
        continue;
      }

      // Mask PAN
      if (lowerKey === 'pan' || lowerKey === 'pannumber' || lowerKey === 'pan_number') {
        sanitized[key] = typeof value === 'string' ? PiiMasker.maskPan(value) : value;
        continue;
      }

      // Mask Aadhaar
      if (lowerKey === 'aadhaar' || lowerKey === 'aadhaarnumber' || lowerKey === 'aadhaar_number') {
        sanitized[key] = typeof value === 'string' ? PiiMasker.maskAadhaar(value) : value;
        continue;
      }

      // Mask Bank Account
      if (lowerKey === 'bankaccountno' || lowerKey === 'accountnumber' || lowerKey === 'bank_account_no') {
        sanitized[key] = typeof value === 'string' ? PiiMasker.maskBankAccount(value) : value;
        continue;
      }

      // Recurse for nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = PiiMasker.sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
