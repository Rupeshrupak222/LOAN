import { describe, it, expect, beforeEach } from 'vitest';
import { clientOnboardingService } from './client-onboarding.service';

describe('Step 42: Commercial Client Onboarding & Lifecycle Platform', () => {
  const superAdmin = {
    id: 'usr-sa-01',
    email: 'superadmin@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  const regularAdmin = {
    id: 'usr-admin-01',
    email: 'admin@adyapan.dev',
    roles: ['ADMIN'],
  };

  const staffBorrower = {
    id: 'usr-cust-01',
    email: 'borrower@adyapan.dev',
    roles: ['CUSTOMER'],
  };

  beforeEach(() => {
    clientOnboardingService.clearForTesting();
  });

  // =========================================================================
  // 1. INITIATION & 16-POINT CHECKLIST SEEDING
  // =========================================================================
  describe('1. Commercial Onboarding Initiation & Checklist', () => {
    it('initiates client onboarding with complete 16-point institutional checklist', async () => {
      const record = await clientOnboardingService.initiateOnboarding(
        {
          code: 'KOTAK_PRIME',
          name: 'Kotak Prime Auto Finance',
          tier: 'ENTERPRISE',
          primaryContact: {
            name: 'Anand Mahindra',
            email: 'anand@kotakprime.com',
            phone: '+91 99000 11223',
          },
          organizationDetails: {
            cinNumber: 'U65990MH1996PLC098765',
            rbiRegistrationNo: 'N-13.00199',
            domain: 'kotakprime.adyapan.dev',
          },
        },
        superAdmin
      );

      expect(record.code).toBe('KOTAK_PRIME');
      expect(record.stage).toBe('ONBOARDING');
      expect(record.checklist.length).toBe(16);
      expect(record.completionPercentage).toBe(0);
      expect(record.retentionPolicy.financialRecordsRetentionYears).toBe(8);

      const mandatoryItems = record.checklist.filter((t) => t.isMandatory);
      expect(mandatoryItems.length).toBeGreaterThanOrEqual(10);
    });

    it('rejects duplicate onboarding requests for the same institution code', async () => {
      await clientOnboardingService.initiateOnboarding(
        {
          code: 'BAJAJ_FIN',
          name: 'Bajaj Finance Limited',
          primaryContact: { name: 'Sanjiv Bajaj', email: 'sanjiv@bajaj.com', phone: '+91 98888 77777' },
        },
        superAdmin
      );

      await expect(
        clientOnboardingService.initiateOnboarding(
          {
            code: 'BAJAJ_FIN',
            name: 'Bajaj Finance Duplicate',
            primaryContact: { name: 'Sanjiv Bajaj', email: 'sanjiv2@bajaj.com', phone: '+91 98888 77777' },
          },
          superAdmin
        )
      ).rejects.toThrow('already exists');
    });
  });

  // =========================================================================
  // 2. CHECKLIST PROGRESSION & GO-LIVE VALIDATION
  // =========================================================================
  describe('2. Checklist Progression & Go-Live Validation', () => {
    it('advances lifecycle stage and percentage as checklist tasks are completed', async () => {
      const record = await clientOnboardingService.initiateOnboarding(
        {
          code: 'TATA_CAPITAL',
          name: 'Tata Capital Financial Services',
          primaryContact: { name: 'Rajiv Sabharwal', email: 'rajiv@tatacapital.com', phone: '+91 99999 88888' },
        },
        superAdmin
      );

      // Complete organization profile
      const updated1 = clientOnboardingService.updateChecklistItem(
        record.id,
        'ORGANIZATION_PROFILE',
        'COMPLETED',
        undefined,
        superAdmin
      );

      expect(updated1.completionPercentage).toBe(6);
      expect(updated1.stage).toBe('CONFIGURATION');

      const pct1 = updated1.completionPercentage;

      // Complete admin account
      const updated2 = clientOnboardingService.updateChecklistItem(
        record.id,
        'ADMIN_ACCOUNT',
        'COMPLETED',
        undefined,
        superAdmin
      );

      expect(updated2.completionPercentage).toBeGreaterThan(pct1);
      expect(updated2.completionPercentage).toBe(13);
    });

    it('fails go-live readiness validation when mandatory tasks are missing or blocked', async () => {
      const record = await clientOnboardingService.initiateOnboarding(
        {
          code: 'CHOLA_FIN',
          name: 'Cholamandalam Investment and Finance',
          primaryContact: { name: 'Vellayan Subbiah', email: 'vellayan@chola.murugappa.com', phone: '+91 98222 33445' },
        },
        superAdmin
      );

      // Block an item
      clientOnboardingService.updateChecklistItem(
        record.id,
        'INTEGRATION_GATEWAYS',
        'BLOCKED',
        'Awaiting Razorpay production MID whitelist',
        superAdmin
      );

      const validation = clientOnboardingService.validateGoLiveReadiness(record.id);

      expect(validation.readyForActivation).toBe(false);
      expect(validation.pendingMandatoryCount).toBeGreaterThan(0);
      expect(validation.blockedCount).toBe(1);
      expect(validation.validationIssues.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // 3. APPROVAL, PROVISIONING & STATUTORY RETENTION OFFBOARDING
  // =========================================================================
  describe('3. Super Admin Approval, Idempotent Provisioning & Offboarding', () => {
    it('approves and provisions institution when Super Admin signs off', async () => {
      const record = await clientOnboardingService.initiateOnboarding(
        {
          code: 'PIRAMAL_CAPITAL',
          name: 'Piramal Capital and Housing Finance',
          primaryContact: { name: 'Ajay Piramal', email: 'ajay@piramal.com', phone: '+91 98111 22334' },
        },
        superAdmin
      );

      // Super Admin issues final approval & provisioning
      const provisioned = await clientOnboardingService.approveAndProvisionTenant(
        record.id,
        'Executive commercial clearance granted after legal audit.',
        superAdmin
      );

      expect(provisioned.stage).toBe('ACTIVE');
      expect(provisioned.completionPercentage).toBe(100);
      expect(provisioned.approvalDetails?.approvedBy).toBe('superadmin@adyapan.dev');
      expect(provisioned.checklist.every((t) => t.status === 'COMPLETED')).toBe(true);
    });

    it('executes controlled offboarding while enforcing statutory 8-year financial record retention', async () => {
      const record = await clientOnboardingService.initiateOnboarding(
        {
          code: 'LEGACY_FIN',
          name: 'Legacy Microfinance Co',
          primaryContact: { name: 'Manager', email: 'mgr@legacy.com', phone: '+91 90000 00000' },
        },
        superAdmin
      );

      await clientOnboardingService.approveAndProvisionTenant(record.id, 'Initial launch', superAdmin);

      // Now offboard
      const offboarded = await clientOnboardingService.deactivateTenantWithRetention(
        record.id,
        'Institution business merger into parent group.',
        superAdmin
      );

      expect(offboarded.stage).toBe('DEACTIVATED');
      expect(offboarded.retentionPolicy.financialRecordsRetentionYears).toBe(8);
      expect(offboarded.retentionPolicy.auditTrailImmutable).toBe(true);
    });
  });
});
