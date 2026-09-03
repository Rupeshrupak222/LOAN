import { describe, it, expect, beforeEach } from 'vitest';
import { tenantProvisioningService } from './tenant-provisioning.service';
import { tenantService } from './tenant.service';
import { configurationService } from '../configuration/configuration.service';
import { tenantIntegrationService } from '../integrations/tenant-integrations.service';
import { brandingService } from '../branding/branding.service';

describe('Step 33: Enterprise Admin & Tenant Onboarding Platform', () => {
  const superAdmin = {
    id: 'usr-sa-001',
    email: 'superadmin@adyapan.dev',
    roles: ['SUPER_ADMIN'],
  };

  beforeEach(() => {
    tenantService.clearForTesting();
  });

  describe('1. Automated Institutional Onboarding & Bootstrap Orchestration', () => {
    it('orchestrates complete institutional provisioning: policies, integrations, branding, and consent templates', async () => {
      const summary = await tenantProvisioningService.onboardTenant(
        {
          organization: {
            code: 'NEO_CREDIT',
            name: 'NeoCredit Financial Technologies',
            tier: 'ENTERPRISE',
            cinNumber: 'U65999MH2024PTC123456',
            rbiRegistrationNo: 'RBI/NBFC/ND-NSI/2024/990',
            contactEmail: 'admin@neocredit.dev',
            supportPhone: '+91 1800 450 6789',
          },
          adminUser: {
            email: 'institution.admin@neocredit.dev',
            firstName: 'Aarav',
            lastName: 'Singhania',
          },
          policyTemplate: 'DIGITAL_FINTECH_LENDER',
          loanProductTemplates: ['PERSONAL_LOAN', 'BNPL_LINE'],
          primaryBranch: {
            branchCode: 'B-MUM-01',
            branchName: 'Mumbai Headquarters',
            city: 'Mumbai',
            state: 'Maharashtra',
          },
          integrationProviders: {
            creditBureau: 'TransUnion CIBIL Direct XML API',
            paymentGateway: 'Razorpay Standard Checkout & eNACH',
            disbursementPayout: 'Cashfree Bank Payout API (IMPS/NEFT)',
            kycProvider: 'Digilocker Government Gateway API',
          },
          branding: {
            brandName: 'NeoCredit',
            primaryColorHex: '#4F46E5',
            portalDomain: 'borrower.neocredit.dev',
          },
        },
        superAdmin
      );

      expect(summary.tenantId).toBeDefined();
      expect(summary.tenantCode).toBe('NEO_CREDIT');
      expect(summary.status).toBe('ACTIVE');
      expect(summary.tier).toBe('ENTERPRISE');
      expect(summary.rolesInitializedCount).toBe(6);
      expect(summary.integrationsConfiguredCount).toBe(4);
      expect(summary.brandingInitialized).toBe(true);
      expect(summary.consentTemplatesInitialized).toBe(true);
      expect(summary.auditEvidenceRef).toBeDefined();

      // Verify Policy Config initialized
      const config = configurationService.getTenantConfig<any>(summary.tenantId, 'FOIR_DTI');
      expect(config.maxDtiRatio).toBe(0.5); // Digital fintech template (50%)

      // Verify Integration Routings
      const routings = tenantIntegrationService.getTenantRoutings(summary.tenantId);
      expect(routings.length).toBe(4);

      // Verify White-Label Branding
      const brand = brandingService.getTenantBranding(summary.tenantId);
      expect(brand.institutionName).toBe('NeoCredit');
      expect(brand.primaryColor).toBe('#4F46E5');
    });
  });

  describe('2. Tenant Operations Center & Health Overview', () => {
    it('retrieves enterprise operations overview across institutions', () => {
      const overview = tenantProvisioningService.getOperationsOverview(superAdmin);
      expect(overview.totalTenants).toBeGreaterThanOrEqual(2);
      expect(overview.activeTenantsCount).toBeGreaterThanOrEqual(2);
      expect(overview.tenants[0].integrationHealth).toBe('100% HEALTHY');
    });
  });

  describe('3. Tenant Suspension & Reactivation Lifecycle', () => {
    it('suspends and reactivates a tenant cleanly with audit logging', async () => {
      // 1. Suspend
      const suspended = await tenantProvisioningService.suspendTenant(
        'tenant-apex-nbfc',
        'Annual statutory regulatory review pending',
        superAdmin
      );
      expect(suspended.status).toBe('SUSPENDED');

      // 2. Reactivate
      const reactivated = await tenantProvisioningService.reactivateTenant(
        'tenant-apex-nbfc',
        superAdmin
      );
      expect(reactivated.status).toBe('ACTIVE');
    });
  });

  describe('4. Institutional Setup Certificate Generation', () => {
    it('generates institutional compliance and setup certificate', () => {
      const cert = tenantProvisioningService.generateSetupCertificate('tenant-adyapan-default', superAdmin);
      expect(cert.certificateId).toContain('CERT-TENANT-');
      expect(cert.institutionName).toBe('Adyapan Prime Lending');
      expect(cert.statutoryComplianceCertified).toBe(true);
      expect(cert.governanceFramework).toContain('RBI NBFC Master Directions');
    });
  });

  describe('5. Strict RBAC Enforcement', () => {
    it('rejects borrower attempts to access operations center or provision tenants', async () => {
      const borrower = { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

      expect(() => tenantProvisioningService.getOperationsOverview(borrower)).toThrow(
        'Access forbidden: Insufficient permissions for Tenant Operations Center.'
      );

      await expect(
        tenantProvisioningService.onboardTenant(
          {
            organization: { code: 'HACK', name: 'Hacked', contactEmail: 'h@h.com', tier: 'STANDARD' },
            adminUser: { email: 'h@h.com', firstName: 'H', lastName: 'Admin' },
            policyTemplate: 'STANDARD_NBFC',
            primaryBranch: { branchCode: 'B1', branchName: 'B', city: 'C', state: 'S' },
            integrationProviders: { creditBureau: 'C', paymentGateway: 'P', disbursementPayout: 'D', kycProvider: 'K' },
            branding: { brandName: 'H', primaryColorHex: '#000' },
          },
          borrower
        )
      ).rejects.toThrow('Only Super Administrators can provision and activate new lending institutions.');
    });
  });
});
