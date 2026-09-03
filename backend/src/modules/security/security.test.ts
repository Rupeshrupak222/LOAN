import { describe, it, expect, beforeEach, vi } from 'vitest';
import { securityService } from './security.service';
import { signAccessToken } from '../auth/tokens';
import { authenticate } from '../../middleware/auth';
import { UnauthorizedError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 25: Enterprise Security Hardening', () => {
  beforeEach(() => {
    securityService.clearForTesting();
  });

  describe('1. Token Revocation & Session Invalidation', () => {
    it('revokes active token and rejects subsequent authentication attempts', () => {
      const token = signAccessToken({
        sub: 'usr-officer-1',
        email: 'officer@adyapan.dev',
        roles: ['LOAN_OFFICER'],
      });

      // Before revocation: valid
      expect(securityService.isTokenRevoked(token)).toBe(false);

      // Revoke token
      securityService.revokeToken(token, 'usr-officer-1', 'User logout');
      expect(securityService.isTokenRevoked(token)).toBe(true);

      // Verify authenticate middleware rejects revoked token
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const res: any = {};
      const next = vi.fn();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('2. Account Lockout & Brute-Force Protection', () => {
    it('locks account after 5 consecutive failed login attempts', () => {
      const email = 'victim@adyapan.dev';

      // Attempts 1 to 4: record failure without locking
      for (let i = 1; i <= 4; i++) {
        const res = securityService.recordFailedLogin(email, '192.0.2.1');
        expect(res.isLocked).toBe(false);
        expect(res.attemptsRemaining).toBe(5 - i);
      }

      // 5th attempt: triggers lock
      const fifth = securityService.recordFailedLogin(email, '192.0.2.1');
      expect(fifth.isLocked).toBe(true);
      expect(fifth.attemptsRemaining).toBe(0);

      // Account remains locked
      const lockCheck = securityService.isAccountLocked(email);
      expect(lockCheck.isLocked).toBe(true);
      expect(lockCheck.remainingLockMs).toBeGreaterThan(0);
    });

    it('resets failed attempt counter upon successful login', () => {
      const email = 'user@adyapan.dev';
      securityService.recordFailedLogin(email);
      securityService.recordFailedLogin(email);

      securityService.resetFailedAttempts(email);
      const lockCheck = securityService.isAccountLocked(email);
      expect(lockCheck.isLocked).toBe(false);
    });
  });

  describe('3. PII Masking Integrity', () => {
    it('masks PAN with strict first 5 and last 1 characters visible', () => {
      expect(securityService.maskPan('ABCDE1234F')).toBe('ABCDE****F');
      expect(securityService.maskPan(null)).toBe('NOT_PROVIDED');
    });

    it('masks Aadhaar showing only the last 4 digits', () => {
      expect(securityService.maskAadhaar('123456789012')).toBe('**** **** 9012');
      expect(securityService.maskAadhaar('1234 5678 9012')).toBe('**** **** 9012');
    });

    it('masks bank account number showing only the last 4 digits', () => {
      expect(securityService.maskBankAccount('987654321098')).toBe('******1098');
    });

    it('masks phone numbers preserving country code and ending digits', () => {
      expect(securityService.maskPhone('+919820012345')).toBe('+91*****45');
    });

    it('masks emails preserving first and last letter of username and domain', () => {
      expect(securityService.maskEmail('borrower@adyapan.dev')).toBe('b***r@adyapan.dev');
    });
  });

  describe('4. AES-256 Field-Level Encryption for Sensitive PII', () => {
    it('encrypts sensitive PII at rest and decrypts accurately', () => {
      const plainAadhaar = '998877665544';
      const encrypted = securityService.encryptPii(plainAadhaar);

      expect(encrypted.encrypted).not.toBe(plainAadhaar);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = securityService.decryptPii(encrypted);
      expect(decrypted).toBe(plainAadhaar);
    });
  });

  describe('5. Security Event & Compliance Audit Logging', () => {
    it('logs and retrieves security events by tenant and severity', () => {
      securityService.logSecurityEvent({
        tenantId: 'tenant-apex-nbfc',
        type: 'IDOR_BREACH_ATTEMPT',
        severity: 'CRITICAL',
        actorId: 'usr-hacker-1',
        details: { targetEntity: 'LoanApplication', targetId: 'app-999' },
      });

      const events = securityService.listSecurityEvents('tenant-apex-nbfc', { severity: 'CRITICAL' });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('IDOR_BREACH_ATTEMPT');
      expect(events[0].severity).toBe('CRITICAL');
    });
  });
});
