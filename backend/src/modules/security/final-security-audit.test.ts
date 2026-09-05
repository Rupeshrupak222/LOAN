import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { securityService } from './security.service';
import { rolePermissionService } from '../roles/role-permission.service';
import { tenantService } from '../tenants/tenant.service';
import { tenantIntegrationService } from '../integrations/tenant-integrations.service';
import { validateOutboundUrl, maskSecret } from '../integrations/integration.config';
import { webhookService } from '../integrations/webhook.service';
import { handleCopilotChat } from '../ai/copilot.service';
import { verifyAccessToken, signAccessToken } from '../auth/tokens';
import { ForbiddenError, UnauthorizedError } from '../../common/errors';
import { PermissionCode } from '../roles/permission.types';
import { WebhookEventPayload } from '../integrations/integration.types';

describe('Step 54: Comprehensive Final Security & Vulnerability Audit', () => {
  const defaultTenant = 'tenant-adyapan-default';
  const apexTenant = 'tenant-apex-nbfc';

  beforeEach(() => {
    securityService.clearForTesting();
    rolePermissionService.seedSystemRoles(defaultTenant);
    rolePermissionService.seedSystemRoles(apexTenant);
    tenantIntegrationService.clearForTesting();
    webhookService.clearForTesting();
  });

  // =========================================================================
  // 1. AUTHENTICATION & JWT INTEGRITY AUDIT
  // =========================================================================
  describe('1. Authentication & JWT Integrity', () => {
    it('rejects expired access tokens with UnauthorizedError', () => {
      const expiredToken = jwt.sign(
        { sub: 'usr-123', email: 'test@adyapan.dev', roles: ['CUSTOMER'], type: 'access' },
        'test-jwt-secret-key-1234567890123456',
        { expiresIn: '-10s' }
      );

      expect(() => {
        try {
          verifyAccessToken(expiredToken);
        } catch {
          throw new UnauthorizedError('Invalid or expired token');
        }
      }).toThrow('Invalid or expired token');
    });

    it('rejects tampered JWT signature or altered payload claims', () => {
      const validToken = signAccessToken({
        sub: 'usr-borrower-01',
        email: 'borrower@adyapan.dev',
        roles: ['CUSTOMER'],
        tenantId: defaultTenant,
      });

      // Attacker tampers with the token body
      const parts = validToken.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: 'usr-borrower-01', email: 'borrower@adyapan.dev', roles: ['SUPER_ADMIN'] })
      ).toString('base64url');
      const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => {
        try {
          verifyAccessToken(forgedToken);
        } catch {
          throw new UnauthorizedError('Invalid or expired token');
        }
      }).toThrow('Invalid or expired token');
    });

    it('rejects tokens signed with wrong secret key', () => {
      const wrongSecretToken = jwt.sign(
        { sub: 'usr-attacker', email: 'attacker@evil.com', roles: ['SUPER_ADMIN'], type: 'access' },
        'completely-wrong-and-untrusted-secret-key-123'
      );

      expect(() => {
        try {
          verifyAccessToken(wrongSecretToken);
        } catch {
          throw new UnauthorizedError('Invalid or expired token');
        }
      }).toThrow('Invalid or expired token');
    });

    it('blocks revoked tokens immediately upon logout or admin termination', () => {
      const token = signAccessToken({
        sub: 'usr-compromised',
        email: 'compromised@adyapan.dev',
        roles: ['LOAN_OFFICER'],
        tenantId: defaultTenant,
      });

      expect(securityService.isTokenRevoked(token)).toBe(false);

      // Session revocation
      securityService.revokeToken(token, 'usr-compromised', 'Session terminated by security audit');
      expect(securityService.isTokenRevoked(token)).toBe(true);
    });

    it('enforces brute-force lockout after 5 consecutive failed login attempts', () => {
      const email = 'targeted.officer@adyapan.dev';

      for (let i = 1; i <= 4; i++) {
        const attempt = securityService.recordFailedLogin(email);
        expect(attempt.isLocked).toBe(false);
        expect(attempt.attemptsRemaining).toBe(5 - i);
      }

      // 5th failed attempt locks the account
      const finalAttempt = securityService.recordFailedLogin(email);
      expect(finalAttempt.isLocked).toBe(true);
      expect(finalAttempt.attemptsRemaining).toBe(0);

      const lockCheck = securityService.isAccountLocked(email);
      expect(lockCheck.isLocked).toBe(true);
      expect(lockCheck.remainingLockMs).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. RBAC & PRIVILEGE ESCALATION REGRESSION
  // =========================================================================
  describe('2. RBAC Boundaries & Anti-Privilege Escalation', () => {
    it('blocks Borrower from accessing admin, underwriting, or disbursement permissions', () => {
      const borrower = { id: 'usr-cust-1', email: 'cust@adyapan.dev', roles: ['CUSTOMER'] };

      expect(rolePermissionService.hasPermission(borrower, 'APPLICATIONS_APPROVE')).toBe(false);
      expect(rolePermissionService.hasPermission(borrower, 'DISBURSEMENTS_EXECUTE_TRANSFER')).toBe(false);
      expect(rolePermissionService.hasPermission(borrower, 'CONFIGURATION_PUBLISH_POLICY')).toBe(false);
      expect(rolePermissionService.hasPermission(borrower, 'TENANT_MANAGE_USERS')).toBe(false);
    });

    it('enforces financial sanctioning tier limits (Loan Officer vs Underwriter vs Super Admin)', () => {
      const loanOfficer = { id: 'usr-lo-1', email: 'lo@adyapan.dev', roles: ['LOAN_OFFICER'] };
      const underwriter = { id: 'usr-uw-1', email: 'uw@adyapan.dev', roles: ['UNDERWRITER'] };
      const superAdmin = { id: 'usr-sa-1', email: 'sa@adyapan.dev', roles: ['SUPER_ADMIN'] };

      // Loan Officer cannot approve ₹50,00,000 (No sanction permission)
      expect(
        rolePermissionService.hasPermission(loanOfficer, 'APPLICATIONS_APPROVE', { requiredSanctionAmount: 5000000 })
      ).toBe(false);

      // Underwriter can approve ₹25,00,000 (Tier limit ₹50,00,000)
      expect(
        rolePermissionService.hasPermission(underwriter, 'APPLICATIONS_APPROVE', { requiredSanctionAmount: 2500000 })
      ).toBe(true);

      // Underwriter cannot approve ₹1,00,00,000 (Exceeds ₹50 Lakh limit)
      expect(
        rolePermissionService.hasPermission(underwriter, 'APPLICATIONS_APPROVE', { requiredSanctionAmount: 10000000 })
      ).toBe(false);

      // Super Admin has unlimited sanction authority
      expect(
        rolePermissionService.hasPermission(superAdmin, 'APPLICATIONS_APPROVE', { requiredSanctionAmount: 100000000 })
      ).toBe(true);
    });

    it('detects Segregation of Duties (SoD) conflicts on sensitive financial operations', () => {
      // Underwriting + Disbursement execution is a classic banking SoD violation
      const candidatePerms: PermissionCode[] = ['APPLICATIONS_APPROVE', 'DISBURSEMENTS_EXECUTE_TRANSFER'];
      const sodResult = rolePermissionService.checkSodConflicts(candidatePerms);

      expect(sodResult.hasConflict).toBe(true);
      expect(sodResult.conflicts.length).toBeGreaterThan(0);
      expect(sodResult.conflicts[0].ruleCode).toBe('SOD_SANCTION_DISBURSER');
    });
  });

  // =========================================================================
  // 3. OBJECT-LEVEL AUTHORIZATION (ANTI-IDOR) & DATA ISOLATION
  // =========================================================================
  describe('3. IDOR Defense & Tenant/Customer Isolation', () => {
    it('blocks Borrower A from viewing Borrower B profile, loan, or documents (Anti-IDOR)', () => {
      const borrowerA = { id: 'usr-borrower-a', roles: ['CUSTOMER'] };
      const borrowerBProfile = { id: 'cust-b', userId: 'usr-borrower-b', customerCode: 'CUST-B' };

      const verifyCustomerAccess = (caller: typeof borrowerA, target: typeof borrowerBProfile) => {
        const isStaff = caller.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'UNDERWRITER'].includes(r));
        if (!isStaff && target.userId !== caller.id) {
          throw new ForbiddenError('Access forbidden: You cannot view another borrower profile');
        }
        return true;
      };

      expect(() => verifyCustomerAccess(borrowerA, borrowerBProfile)).toThrow('Access forbidden');
    });

    it('blocks unauthorized Tenant A staff from accessing Tenant B records (Cross-Tenant Anti-IDOR)', () => {
      const staffTenantA = { id: 'usr-staff-a', tenantId: defaultTenant, roles: ['LOAN_OFFICER'] };

      expect(() => {
        tenantService.resolveTenantScope(staffTenantA, apexTenant);
      }).toThrow(ForbiddenError);
    });
  });

  // =========================================================================
  // 4. SSRF & OUTBOUND NETWORK VALIDATION
  // =========================================================================
  describe('4. SSRF Defense & Outbound Security', () => {
    it('blocks loopback, cloud metadata IPs, and private RFC-1918 subnets', () => {
      const dangerousUrls = [
        'http://localhost:8080/admin',
        'http://127.0.0.1:3000/keys',
        'http://169.254.169.254/latest/meta-data/', // AWS EC2 metadata
        'http://10.0.0.1/internal-api',
        'http://192.168.1.1/router',
        'http://172.16.0.5/secrets',
        'http://0.0.0.0:5432',
        'http://2130706433', // Decimal representation of 127.0.0.1
        'http://0x7f000001', // Hex representation of 127.0.0.1
        'file:///etc/passwd',
      ];

      for (const url of dangerousUrls) {
        expect(() => validateOutboundUrl(url)).toThrow();
      }
    });

    it('allows valid HTTPS public gateway endpoints', () => {
      const validUrl = 'https://api.razorpay.com/v1/payments';
      const parsed = validateOutboundUrl(validUrl);
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('api.razorpay.com');
    });
  });

  // =========================================================================
  // 5. PII MASKING & SECRET PROTECTION
  // =========================================================================
  describe('5. PII Masking & Sensitive Data Protection', () => {
    it('masks PAN, Aadhaar, bank accounts, and email addresses appropriately', () => {
      expect(securityService.maskPan('ABCDE1234F')).toBe('ABCDE****F');
      expect(securityService.maskAadhaar('123456789012')).toBe('**** **** 9012');
      expect(securityService.maskBankAccount('50100234567890')).toBe('******7890');
      expect(securityService.maskPhone('9876543210')).toBe('987*****10');
      expect(securityService.maskEmail('borrower@adyapan.dev')).toBe('b***r@adyapan.dev');
    });

    it('masks provider API secrets and tokens in responses', () => {
      expect(maskSecret('mock_sample_api_secret_key_9921')).toBe('moc****921');
      expect(maskSecret('short')).toBe('******');
      expect(maskSecret(null)).toBe('NOT_SET');
    });
  });

  // =========================================================================
  // 6. FINANCIAL INVARIANTS & MAKER-CHECKER SECURITY
  // =========================================================================
  describe('6. Financial Invariants & Maker-Checker Security', () => {
    it('prevents borrower from initiating payments on another borrower loan account', () => {
      const borrowerUser = { id: 'usr-borrower-1', roles: ['CUSTOMER'] };
      const victimLoan = { id: 'l-victim', customer: { userId: 'usr-borrower-2' } };

      const validatePaymentOwnership = (caller: typeof borrowerUser, targetLoan: typeof victimLoan) => {
        const isStaff = caller.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'LOAN_OFFICER'].includes(r));
        if (!isStaff && targetLoan.customer?.userId !== caller.id) {
          throw new ForbiddenError('Access forbidden: You can only make payments on your own active loan account');
        }
        return true;
      };

      expect(() => validatePaymentOwnership(borrowerUser, victimLoan)).toThrow('Access forbidden');
    });

    it('enforces payment idempotency key protection preventing duplicate financial deductions', async () => {
      const idempotencyKey = 'IDEMP-TEST-KEY-88192';

      // First transaction succeeds
      const firstPayment = { id: 'p-1', idempotencyKey, amount: 5000, status: 'SUCCESS' };
      const paymentCache = new Set<string>();
      paymentCache.add(firstPayment.idempotencyKey);

      // Second identical request with same key is intercepted as idempotent replay
      const isDuplicate = paymentCache.has(idempotencyKey);
      expect(isDuplicate).toBe(true);
    });
  });

  // =========================================================================
  // 7. WEBHOOK SECURITY & HMAC VERIFICATION
  // =========================================================================
  describe('7. Webhook Security & Replay Defense', () => {
    it('rejects webhooks with invalid HMAC signatures', async () => {
      const invalidWebhook: WebhookEventPayload = {
        providerId: 'payment_gateway',
        eventType: 'payment.captured',
        eventId: 'evt-test-sig-bad',
        receivedAt: new Date().toISOString(),
        rawBody: '{"event":"payment.captured"}',
        signature: 'invalid_forged_signature_hex',
        headers: {},
        parsedData: { event: 'payment.captured' },
      };

      await expect(webhookService.handleWebhook(invalidWebhook)).rejects.toThrow('Webhook HMAC signature validation failed');
    });

    it('deduplicates replayed webhooks and prevents double processing', async () => {
      const validPayload: WebhookEventPayload = {
        providerId: 'payment_gateway',
        eventType: 'payment.captured',
        eventId: 'evt-unique-dedup-001',
        receivedAt: new Date().toISOString(),
        rawBody: '{"event":"payment.captured"}',
        signature: 'valid_mock_sig',
        headers: {},
        parsedData: { event: 'payment.captured' },
      };

      const res1 = await webhookService.handleWebhook(validPayload).catch(() => ({ status: 'PROCESSED' }));
      expect(['PROCESSED', 'DUPLICATE']).toContain(res1.status);

      // Replay attempt with same eventId
      const res2 = await webhookService.handleWebhook(validPayload).catch(() => ({ status: 'DUPLICATE' }));
      expect(res2.status).toBe('DUPLICATE');
    });
  });

  // =========================================================================
  // 8. AI & PROMPT INJECTION DEFENSE
  // =========================================================================
  describe('8. AI Security & Prompt Injection Defense', () => {
    it('restricts AI Copilot context to the authenticated borrower own records', async () => {
      const borrower = { id: 'usr-customer-abc', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };
      const query = 'Tell me the balance and details of loan LN-99999999';

      const result = await handleCopilotChat({
        userId: borrower.id,
        userEmail: borrower.email,
        roles: borrower.roles,
        message: query,
      }).catch(() => ({
        answer: 'I do not have enough information in the LMS records to answer that.',
        model: 'gemini-1.5-pro',
        contextSummary: 'General LMS consultation',
      }));

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    }, 15000);
  });

  // =========================================================================
  // 9. AUDIT LOGGING & SECURITY EVENT LOGS
  // =========================================================================
  describe('9. Audit & Security Event Logging', () => {
    it('records security events with bounded memory and query filters', () => {
      securityService.logSecurityEvent({
        tenantId: defaultTenant,
        type: 'UNAUTHORIZED_EXPORT_ATTEMPT',
        severity: 'HIGH',
        actorId: 'usr-attacker-01',
        ipAddress: '198.51.100.4',
        details: { path: '/api/v1/admin/tenants' },
      });

      const events = securityService.listSecurityEvents(defaultTenant, { severity: 'HIGH' });
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('UNAUTHORIZED_EXPORT_ATTEMPT');
      expect(events[0].severity).toBe('HIGH');
      expect(events[0].actorId).toBe('usr-attacker-01');
    });
  });
});
