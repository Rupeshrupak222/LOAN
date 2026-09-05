// Step 33: Enterprise Admin & Multi-Tenant Types

export type TenantStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED';

export type TenantTier = 'ENTERPRISE' | 'GROWTH' | 'STANDARD';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
  tier: TenantTier;
  cinNumber?: string;
  rbiRegistrationNo?: string;
  domain?: string;
  contactEmail: string;
  supportPhone?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantContext {
  id: string;
  tenantId: string;
  code: string;
  tenantCode: string;
  name: string;
  isPrimary: boolean;
}

export interface CreateTenantDto {
  code: string;
  name: string;
  tier?: TenantTier;
  cinNumber?: string;
  rbiRegistrationNo?: string;
  domain?: string;
  contactEmail: string;
  supportPhone?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantStatusDto {
  status: TenantStatus;
  reason?: string;
}

export interface TenantOnboardingWizardDto {
  organization: {
    code: string;
    name: string;
    cinNumber?: string;
    rbiRegistrationNo?: string;
    tier: TenantTier;
    domain?: string;
    contactEmail: string;
    supportPhone?: string;
  };
  adminUser: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  policyTemplate: 'STANDARD_NBFC' | 'DIGITAL_FINTECH_LENDER' | 'ENTERPRISE_MICROFINANCE';
  loanProductTemplates?: string[];
  primaryBranch: {
    branchCode: string;
    branchName: string;
    city: string;
    state: string;
  };
  integrationProviders: {
    creditBureau: string;
    paymentGateway: string;
    disbursementPayout: string;
    kycProvider: string;
  };
  branding: {
    brandName: string;
    primaryColorHex: string;
    portalDomain?: string;
  };
}

export interface ProvisioningSummary {
  tenantId: string;
  tenantCode: string;
  name: string;
  status: TenantStatus;
  tier: TenantTier;
  adminEmail: string;
  branchCode: string;
  rolesInitializedCount: number;
  policiesInitializedCount: number;
  loanProductsCreatedCount: number;
  integrationsConfiguredCount: number;
  brandingInitialized: boolean;
  consentTemplatesInitialized: boolean;
  activatedAt: string;
  auditEvidenceRef: string;
}

export interface TenantOperationsOverview {
  totalTenants: number;
  activeTenantsCount: number;
  suspendedTenantsCount: number;
  enterpriseTierCount: number;
  tenants: Array<{
    id: string;
    code: string;
    name: string;
    tier: TenantTier;
    status: TenantStatus;
    domain?: string;
    activeLoanAccounts: number;
    activeCustomersCount: number;
    integrationHealth: string;
    createdAt: string;
  }>;
  updatedAt: string;
}
