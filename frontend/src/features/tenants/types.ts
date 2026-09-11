// Adyapan Lending OS — Phase 6: Frontend Tenant Types

export type TenantStatus =
  | 'PROVISIONING'
  | 'DRAFT'
  | 'ONBOARDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'TERMINATED';

export type TenantTier = 'ENTERPRISE' | 'GROWTH' | 'STANDARD';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
  tier: TenantTier;
  cinNumber?: string | null;
  rbiRegistrationNo?: string | null;
  domain?: string | null;
  contactEmail: string;
  supportPhone?: string | null;
  baseCurrency?: string;
  country?: string;
  timezone?: string;
  settings?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  suspendedAt?: string | null;
  activatedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TenantReadinessDomain =
  | 'PRODUCTS'
  | 'WORKFLOWS'
  | 'DECISION_RULES'
  | 'PRICING'
  | 'APPROVAL_MATRIX'
  | 'CREDIT_POLICIES'
  | 'BRANCHES'
  | 'STAFF_USERS';

export interface ReadinessDomainCheck {
  domain: TenantReadinessDomain;
  title: string;
  isReady: boolean;
  itemCount: number;
  details: string;
  blockingReason?: string;
}

export interface TenantReadinessResult {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  isOverallReady: boolean;
  readinessScorePct: number;
  passedDomainsCount: number;
  totalDomainsCount: number;
  domains: ReadinessDomainCheck[];
  evaluatedAt: string;
}

export interface TenantBrandingConfig {
  institutionName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  fontFamily?: string;
  portalTitle?: string;
  customDomain?: string;
  emailSignature?: string;
  supportEmail?: string;
  supportPhone?: string;
  contrastRatio?: number;
  isContrastSafe?: boolean;
}

export interface TenantBranch {
  id: string;
  code: string;
  name: string;
  city?: string | null;
  state?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  employeeId?: string | null;
  roles: string[];
  branch?: { id: string; code: string; name: string } | null;
  createdAt?: string;
}

export interface TenantConfigurationBundle {
  tenant: Tenant;
  readiness: TenantReadinessResult;
  branding: TenantBrandingConfig;
  branchesCount: number;
  branches: TenantBranch[];
  usersCount: number;
  users: TenantUser[];
  productsSummary: {
    total: number;
    active: number;
    products: Array<{ id: string; code: string; name: string; productType: string; interestRate: number; isActive: boolean }>;
  };
  workflowsSummary: {
    total: number;
    active: number;
    stagesCount: number;
  };
  decisionPoliciesSummary: {
    totalRules: number;
    activePolicies: number;
  };
  approvalMatrixSummary: {
    levelsCount: number;
    rolesConfigured: string[];
    maxApprovalLimit: number;
  };
  creditLimitsSummary: {
    facilityTypesConfigured: string[];
    maxSystemExposure: number;
  };
  systemSettings: Record<string, any>;
  generatedAt: string;
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
  baseCurrency?: string;
  country?: string;
  timezone?: string;
  settings?: Record<string, any>;
  seedDefaults?: boolean;
}

export interface UpdateTenantDto {
  name?: string;
  cinNumber?: string;
  rbiRegistrationNo?: string;
  domain?: string;
  contactEmail?: string;
  supportPhone?: string;
  baseCurrency?: string;
  country?: string;
  timezone?: string;
  tier?: TenantTier;
  settings?: Record<string, any>;
}

export interface CreateTenantBranchDto {
  code: string;
  name: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export interface CreateTenantUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
  password?: string;
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
    domain?: string | null;
    activeLoanAccounts: number;
    activeCustomersCount: number;
    integrationHealth: string;
    readinessScorePct?: number;
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface TenantDetail extends Tenant {
  branchesCount: number;
  usersCount: number;
  loanProductsCount: number;
  activeLoansCount: number;
  activeCustomersCount: number;
  branches: TenantBranch[];
  users: Array<{ id: string; email: string; firstName: string; lastName: string; status: string; roles: string[] }>;
  loanProducts: Array<{ id: string; code: string; name: string; productType: string; interestRate: string | number; isActive: boolean }>;
}
