// Step 25: Enterprise Security Hardening Types

export type SecurityEventType =
  | 'FAILED_LOGIN'
  | 'ACCOUNT_LOCKED'
  | 'CROSS_TENANT_BREACH_ATTEMPT'
  | 'IDOR_BREACH_ATTEMPT'
  | 'TOKEN_REVOCATION'
  | 'SSRF_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_EXPORT_ATTEMPT'
  | 'SUSPICIOUS_PAYLOAD_BLOCKED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  tenantId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface RevokedTokenRecord {
  tokenHash: string;
  userId: string;
  revokedAt: string;
  expiresAt: string;
  reason: string;
}

export interface PiiMaskingOptions {
  maskPan?: boolean;
  maskAadhaar?: boolean;
  maskBankAccount?: boolean;
  maskPhone?: boolean;
  maskEmail?: boolean;
}
