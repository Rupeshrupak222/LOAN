import { describe, it, expect, beforeEach } from 'vitest';
import { privacyConsentService } from './consent.service';

describe('Step 30: Privacy & Consent Management', () => {
  beforeEach(() => {
    privacyConsentService.clearForTesting();
  });

  describe('1. Purpose Catalog & Immutable Versioning', () => {
    it('seeds and lists default institutional consent purposes', () => {
      const purposes = privacyConsentService.listPurposes('tenant-adyapan-default');
      expect(purposes.length).toBeGreaterThanOrEqual(5);

      const codes = purposes.map((p) => p.purposeCode);
      expect(codes).toContain('PURPOSE-KYC-01');
      expect(codes).toContain('PURPOSE-BUREAU-02');
      expect(codes).toContain('PURPOSE-AA-BANK-03');
      expect(codes).toContain('PURPOSE-AI-ASSIST-04');
    });

    it('increments version when a purpose wording is updated without altering historical data', async () => {
      const updated = await privacyConsentService.upsertPurpose(
        'tenant-adyapan-default',
        {
          purposeCode: 'PURPOSE-KYC-01',
          title: 'Identity Verification & Digilocker eKYC Consent',
          description: 'Updated with DPDP Act 2023 compliance.',
          category: 'KYC_VERIFICATION',
          isMandatory: true,
          wordingText: 'Updated explicit statutory consent under Digital Personal Data Protection (DPDP) Act.',
        },
        { id: 'admin-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
      );

      expect(updated.activeVersion).toBe('v2.0');
    });
  });

  describe('2. Consent Lifecycle: Grant, Supersede, and Withdraw', () => {
    it('records consent grant and supersedes older version upon re-grant', async () => {
      // 1. First grant (v1.0)
      const grant1 = await privacyConsentService.grantConsent(
        {
          tenantId: 'tenant-adyapan-default',
          customerId: 'cust-priv-001',
          purposeCode: 'PURPOSE-KYC-01',
          channel: 'WEB_PORTAL',
          ipAddress: '103.21.54.10',
          userAgent: 'Mozilla/5.0 Chrome/120',
        },
        { id: 'cust-priv-001', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
      );

      expect(grant1.id).toBeDefined();
      expect(grant1.status).toBe('GRANTED');
      expect(grant1.version).toBe('v1.0');

      // 2. Second grant for same purpose
      const grant2 = await privacyConsentService.grantConsent(
        {
          tenantId: 'tenant-adyapan-default',
          customerId: 'cust-priv-001',
          purposeCode: 'PURPOSE-KYC-01',
          channel: 'MOBILE_APP',
        },
        { id: 'cust-priv-001', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
      );

      expect(grant2.status).toBe('GRANTED');
      expect(grant1.status).toBe('SUPERSEDED'); // Older grant superseded
    });

    it('withdraws active consent cleanly and updates timestamp', async () => {
      const grant = await privacyConsentService.grantConsent(
        {
          tenantId: 'tenant-adyapan-default',
          customerId: 'cust-priv-002',
          purposeCode: 'PURPOSE-MKTG-05',
          channel: 'WEB_PORTAL',
        },
        { id: 'cust-priv-002', email: 'cust2@adyapan.dev', roles: ['CUSTOMER'] }
      );

      expect(grant.status).toBe('GRANTED');

      const withdrawn = await privacyConsentService.withdrawConsent(
        grant.id,
        'Borrower opted out of promotional communications.',
        { id: 'cust-priv-002', email: 'cust2@adyapan.dev', roles: ['CUSTOMER'] }
      );

      expect(withdrawn.status).toBe('WITHDRAWN');
      expect(withdrawn.withdrawnAt).toBeDefined();
      expect(withdrawn.withdrawnReason).toContain('opted out');
    });
  });

  describe('3. Consent Enforcement Engine', () => {
    it('evaluates whether sensitive operations have required active consent', async () => {
      // Check before grant
      const checkBefore = privacyConsentService.checkEnforcement(
        'tenant-adyapan-default',
        'cust-enf-003',
        'BANK_ACCOUNT_ACCESS'
      );
      expect(checkBefore.granted).toBe(false);
      expect(checkBefore.reason).toContain('Active consent for \'BANK_ACCOUNT_ACCESS\' not recorded');

      // Grant consent
      await privacyConsentService.grantConsent(
        {
          tenantId: 'tenant-adyapan-default',
          customerId: 'cust-enf-003',
          purposeCode: 'PURPOSE-AA-BANK-03',
          channel: 'WEB_PORTAL',
        },
        { id: 'cust-enf-003', email: 'enf@adyapan.dev', roles: ['CUSTOMER'] }
      );

      // Check after grant
      const checkAfter = privacyConsentService.checkEnforcement(
        'tenant-adyapan-default',
        'cust-enf-003',
        'BANK_ACCOUNT_ACCESS'
      );
      expect(checkAfter.granted).toBe(true);
      expect(checkAfter.consentRecord?.status).toBe('GRANTED');
    });
  });

  describe('4. Privacy Preferences Management', () => {
    it('retrieves default and updates customer privacy preferences', async () => {
      const initial = privacyConsentService.getPreferences('cust-pref-004', 'tenant-adyapan-default');
      expect(initial.allowMarketing).toBe(false);

      const updated = await privacyConsentService.updatePreferences(
        'cust-pref-004',
        'tenant-adyapan-default',
        { allowMarketing: true, preferredChannel: 'WHATSAPP' },
        { id: 'cust-pref-004', email: 'pref@adyapan.dev', roles: ['CUSTOMER'] }
      );

      expect(updated.allowMarketing).toBe(true);
      expect(updated.preferredChannel).toBe('WHATSAPP');
    });
  });

  describe('5. AI Prompt Data Minimization & PII Sanitizer', () => {
    it('masks PII and scopes AI context based on active AI consent', () => {
      const rawCustomer = {
        id: 'cust-ai-005',
        name: 'Rajesh Sharma',
        pan: 'ABCDE1234F',
        aadhaar: '123456789012',
        bankAccount: '987654321098',
        phone: '+91 98200 12345',
        income: 85000,
        creditScore: 780,
        loanAmount: 500000,
      };

      const sanitized = privacyConsentService.sanitizeForAiPrompt('tenant-adyapan-default', rawCustomer);

      expect(sanitized.nameMasked).toBe('Rajesh ***');
      expect(sanitized.panMasked).toBe('ABCDE****F');
      expect(sanitized.aadhaarMasked).toBe('**** **** 9012');
      expect(sanitized.bankAccountMasked).toBe('******1098');
      expect(sanitized.financialSummary.monthlyIncome).toBe(85000);
      expect(sanitized.aiConsentGranted).toBe(false); // No active AI consent granted yet
      expect(sanitized.purposeScope).toBe('MINIMAL_RULES_ONLY');
    });
  });

  describe('6. RBAC & Borrower Isolation', () => {
    it('rejects borrower attempts to manage consent purpose templates', async () => {
      await expect(
        privacyConsentService.upsertPurpose(
          'tenant-adyapan-default',
          {
            purposeCode: 'MALICIOUS-01',
            title: 'Hacked',
            description: 'Test',
            category: 'KYC_VERIFICATION',
            isMandatory: false,
            wordingText: 'None',
          },
          { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow('Borrowers cannot manage consent templates.');
    });
  });
});
