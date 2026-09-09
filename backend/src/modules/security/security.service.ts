import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { encryptSecret, decryptSecret, EncryptedPayload } from '../../common/crypto';
import { SecurityEvent, SecurityEventType, SecuritySeverity, RevokedTokenRecord } from './security.types';
import { logger } from '../../config/logger';

export class SecurityService {
  private static instance: SecurityService;

  // In-memory token revocation blacklist: Map<tokenHash, RevokedTokenRecord>
  private readonly revokedTokens = new Map<string, RevokedTokenRecord>();

  // Failed login attempts tracker: Map<identifier, { attempts: number; lockedUntil?: number }>
  private readonly failedLogins = new Map<string, { attempts: number; lockedUntil?: number }>();

  // Security event telemetry log: SecurityEvent[]
  private readonly securityEvents: SecurityEvent[] = [];

  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // --- 1. TOKEN REVOCATION & SESSION INVALIDATION ---

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  public revokeToken(token: string, userId: string, reason: string = 'User Logout or Admin Revocation'): void {
    const hash = this.hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.revokedTokens.set(hash, {
      tokenHash: hash,
      userId,
      revokedAt: now.toISOString(),
      expiresAt,
      reason,
    });

    this.logSecurityEvent({
      tenantId: 'system',
      type: 'TOKEN_REVOCATION',
      severity: 'LOW',
      actorId: userId,
      details: { tokenHash: `${hash.slice(0, 8)}...`, reason },
    });
  }

  public isTokenRevoked(token: string): boolean {
    const hash = this.hashToken(token);
    return this.revokedTokens.has(hash);
  }

  // --- 2. ACCOUNT LOCKOUT & BRUTE-FORCE PROTECTION ---

  public recordFailedLogin(identifier: string, ip?: string): { isLocked: boolean; attemptsRemaining: number } {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    const record = this.failedLogins.get(key) || { attempts: 0 };

    // If previously locked but lock expired, reset
    if (record.lockedUntil && record.lockedUntil <= now) {
      record.attempts = 0;
      record.lockedUntil = undefined;
    }

    record.attempts += 1;

    if (record.attempts >= SecurityService.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + SecurityService.LOCKOUT_DURATION_MS;
      this.failedLogins.set(key, record);

      this.logSecurityEvent({
        tenantId: 'system',
        type: 'ACCOUNT_LOCKED',
        severity: 'HIGH',
        ipAddress: ip,
        details: {
          identifier: key,
          attempts: record.attempts,
          lockoutMinutes: SecurityService.LOCKOUT_DURATION_MS / 60000,
        },
      });

      return { isLocked: true, attemptsRemaining: 0 };
    }

    this.failedLogins.set(key, record);

    this.logSecurityEvent({
      tenantId: 'system',
      type: 'FAILED_LOGIN',
      severity: 'LOW',
      ipAddress: ip,
      details: { identifier: key, attemptNumber: record.attempts },
    });

    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, SecurityService.MAX_FAILED_ATTEMPTS - record.attempts),
    };
  }

  public isAccountLocked(identifier: string): { isLocked: boolean; remainingLockMs?: number } {
    const key = identifier.toLowerCase().trim();
    const record = this.failedLogins.get(key);
    if (!record || !record.lockedUntil) {
      return { isLocked: false };
    }

    const now = Date.now();
    if (record.lockedUntil > now) {
      return { isLocked: true, remainingLockMs: record.lockedUntil - now };
    }

    // Lock expired
    this.failedLogins.delete(key);
    return { isLocked: false };
  }

  public resetFailedAttempts(identifier: string): void {
    this.failedLogins.delete(identifier.toLowerCase().trim());
  }

  // --- 3. PII MASKING & FIELD-LEVEL ENCRYPTION ---

  public maskPan(pan?: string | null): string {
    if (!pan) return 'NOT_PROVIDED';
    const clean = pan.trim().toUpperCase();
    if (clean.length !== 10) return '******';
    return `${clean.slice(0, 5)}****${clean.slice(-1)}`;
  }

  public maskAadhaar(aadhaar?: string | null): string {
    if (!aadhaar) return 'NOT_PROVIDED';
    const clean = aadhaar.replace(/\s+/g, '');
    if (clean.length !== 12) return '************';
    return `**** **** ${clean.slice(-4)}`;
  }

  public maskBankAccount(accountNumber?: string | null): string {
    if (!accountNumber) return 'NOT_PROVIDED';
    const clean = accountNumber.trim();
    if (clean.length <= 4) return '******';
    return `******${clean.slice(-4)}`;
  }

  public maskPhone(phone?: string | null): string {
    if (!phone) return 'NOT_PROVIDED';
    const clean = phone.trim();
    if (clean.length < 10) return '**********';
    return `${clean.slice(0, 3)}*****${clean.slice(-2)}`;
  }

  public maskEmail(email?: string | null): string {
    if (!email || !email.includes('@')) return '******@******';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `*@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  public encryptPii(plainText: string): EncryptedPayload {
    return encryptSecret(plainText);
  }

  public decryptPii(payload: EncryptedPayload): string {
    return decryptSecret(payload);
  }

  // --- 4. SECURITY EVENT AUDIT & RBI COMPLIANCE LOGGING ---

  public logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const record: SecurityEvent = {
      id: `sec-evt-${uuid().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.securityEvents.unshift(record);

    // Keep memory bounded to last 2000 events
    if (this.securityEvents.length > 2000) {
      this.securityEvents.pop();
    }

    if (record.severity === 'HIGH' || record.severity === 'CRITICAL') {
      logger.warn({ securityEvent: record }, `[SECURITY_ALERT] ${record.type} on tenant '${record.tenantId}'`);
    }

    return record;
  }

  public listSecurityEvents(
    tenantId?: string,
    filter?: { type?: SecurityEventType; severity?: SecuritySeverity }
  ): SecurityEvent[] {
    return this.securityEvents.filter((e) => {
      if (tenantId && tenantId !== 'system' && e.tenantId !== tenantId && e.tenantId !== 'system') return false;
      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.severity && e.severity !== filter.severity) return false;
      return true;
    });
  }

  public clearForTesting(): void {
    this.revokedTokens.clear();
    this.failedLogins.clear();
    this.securityEvents.length = 0;
  }
}

export const securityService = SecurityService.getInstance();
