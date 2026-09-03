// Central role configuration and grouped navigation for the Adyapan LMS.
// Single source of truth for display labels, allowed navigation, landing page, and category grouping.

export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'LOAN_OFFICER'
  | 'CREDIT_ANALYST'
  | 'UNDERWRITER'
  | 'FINANCE_OFFICER'
  | 'COLLECTION_OFFICER'
  | 'BRANCH_MANAGER'
  | 'AUDITOR'
  | 'CUSTOMER';

export type NavKey =
  | 'dashboard'
  | 'customers'
  | 'applications'
  | 'loan-products'
  | 'underwriting'
  | 'loans'
  | 'disbursements'
  | 'payments'
  | 'collections'
  | 'reports'
  | 'emi-calculator'
  | 'branches'
  | 'users'
  | 'settings'
  | 'audit-logs'
  | 'fraud-intelligence'
  | 'integrations'
  | 'early-warnings'
  | 'reconciliation'
  | 'partners'
  | 'communications'
  | 'command-center'
  | 'operations'
  | 'compliance'
  | 'privacy'
  | 'tenants'
  | 'roles'
  | 'workflows'
  | 'configuration'
  | 'branding';

export type NavGroupKey =
  | 'OVERVIEW'
  | 'CUSTOMERS'
  | 'LENDING'
  | 'SERVICING'
  | 'INSIGHTS'
  | 'ADMINISTRATION';

export interface NavItemConfig {
  key: NavKey;
  href: string;
  label: string;
  group: NavGroupKey;
}

export const NAV_ITEMS: Record<NavKey, NavItemConfig> = {
  dashboard: { key: 'dashboard', href: '/dashboard', label: 'Dashboard', group: 'OVERVIEW' },
  customers: { key: 'customers', href: '/customers', label: 'Customers', group: 'CUSTOMERS' },
  applications: { key: 'applications', href: '/applications', label: 'Loan Applications', group: 'LENDING' },
  'loan-products': { key: 'loan-products', href: '/loan-products', label: 'Loan Products', group: 'LENDING' },
  underwriting: { key: 'underwriting', href: '/underwriting', label: 'Underwriting Queue', group: 'LENDING' },
  loans: { key: 'loans', href: '/loans', label: 'Loan Accounts', group: 'LENDING' },
  disbursements: { key: 'disbursements', href: '/disbursements', label: 'Disbursements', group: 'LENDING' },
  partners: { key: 'partners', href: '/partners', label: 'Partners & DSAs', group: 'LENDING' },
  payments: { key: 'payments', href: '/payments', label: 'Payments Ledger', group: 'SERVICING' },
  collections: { key: 'collections', href: '/collections', label: 'Collections & Delinquency', group: 'SERVICING' },
  reconciliation: { key: 'reconciliation', href: '/reconciliation', label: 'Accounting & Recon', group: 'SERVICING' },
  communications: { key: 'communications', href: '/communications', label: 'Omnichannel Hub', group: 'SERVICING' },
  'command-center': { key: 'command-center', href: '/command-center', label: 'AI Command Center', group: 'INSIGHTS' },
  operations: { key: 'operations', href: '/operations', label: 'Operations & Observability', group: 'INSIGHTS' },
  compliance: { key: 'compliance', href: '/compliance', label: 'Regulatory & Compliance', group: 'INSIGHTS' },
  privacy: { key: 'privacy', href: '/privacy', label: 'Privacy & Consent', group: 'ADMINISTRATION' },
  reports: { key: 'reports', href: '/reports', label: 'Reports & Analytics', group: 'INSIGHTS' },
  'fraud-intelligence': { key: 'fraud-intelligence', href: '/fraud-intelligence', label: 'Fraud & Anomaly Intelligence', group: 'INSIGHTS' },
  'early-warnings': { key: 'early-warnings', href: '/early-warnings', label: 'Early Warning Center', group: 'INSIGHTS' },
  'emi-calculator': { key: 'emi-calculator', href: '/emi-calculator', label: 'EMI Calculator', group: 'INSIGHTS' },
  branches: { key: 'branches', href: '/branches', label: 'Branch Directory', group: 'ADMINISTRATION' },
  users: { key: 'users', href: '/users', label: 'Staff Users', group: 'ADMINISTRATION' },
  tenants: { key: 'tenants', href: '/tenants', label: 'Lender Tenants', group: 'ADMINISTRATION' },
  roles: { key: 'roles', href: '/roles', label: 'Roles & Permissions', group: 'ADMINISTRATION' },
  workflows: { key: 'workflows', href: '/workflows', label: 'Workflow Studio', group: 'ADMINISTRATION' },
  configuration: { key: 'configuration', href: '/configuration', label: 'Policy Configuration', group: 'ADMINISTRATION' },
  branding: { key: 'branding', href: '/branding', label: 'Branding & White-Label', group: 'ADMINISTRATION' },
  settings: { key: 'settings', href: '/settings', label: 'System Settings', group: 'ADMINISTRATION' },
  'audit-logs': { key: 'audit-logs', href: '/audit-logs', label: 'Audit Logs', group: 'ADMINISTRATION' },
  integrations: { key: 'integrations', href: '/integrations', label: 'Integration Hub', group: 'ADMINISTRATION' },
};

export interface RoleConfig {
  label: string;
  description: string;
  nav: NavKey[];
  landing: string;
  dashboard: RoleName;
}

export const ROLE_CONFIG: Record<RoleName, RoleConfig> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Full enterprise governance, system administration, and portfolio control',
    nav: [
      'dashboard',
      'customers',
      'applications',
      'loan-products',
      'underwriting',
      'loans',
      'disbursements',
      'partners',
      'payments',
      'collections',
      'reconciliation',
      'communications',
      'command-center',
      'operations',
      'compliance',
      'privacy',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
      'branches',
      'users',
      'tenants',
      'roles',
      'workflows',
      'configuration',
      'branding',
      'settings',
      'audit-logs',
      'integrations',
    ],
    landing: '/dashboard',
    dashboard: 'SUPER_ADMIN',
  },
  ADMIN: {
    label: 'System Admin',
    description: 'System administration, user access control, and platform configuration',
    nav: [
      'dashboard',
      'users',
      'branches',
      'roles',
      'workflows',
      'loan-products',
      'partners',
      'configuration',
      'branding',
      'settings',
      'audit-logs',
      'integrations',
      'reports',
      'reconciliation',
      'communications',
      'command-center',
      'operations',
      'compliance',
      'privacy',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'ADMIN',
  },
  LOAN_OFFICER: {
    label: 'Loan Officer',
    description: 'Customer onboarding, KYC document collection, and loan intake',
    nav: [
      'dashboard',
      'customers',
      'applications',
      'loans',
      'loan-products',
      'partners',
      'communications',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'LOAN_OFFICER',
  },
  CREDIT_ANALYST: {
    label: 'Credit Analyst',
    description: 'Credit assessment, policy eligibility scoring, and 4-pillar risk analysis',
    nav: [
      'dashboard',
      'applications',
      'underwriting',
      'customers',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'CREDIT_ANALYST',
  },
  UNDERWRITER: {
    label: 'Underwriter',
    description: 'Credit committee decision queue, conditional sanction, and approval limits',
    nav: [
      'dashboard',
      'customers',
      'applications',
      'underwriting',
      'loans',
      'disbursements',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'UNDERWRITER',
  },
  FINANCE_OFFICER: {
    label: 'Finance Officer',
    description: 'Pre-disbursement checks, electronic fund release, repayments, and NOC closure',
    nav: [
      'dashboard',
      'loans',
      'disbursements',
      'partners',
      'payments',
      'reconciliation',
      'communications',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'FINANCE_OFFICER',
  },
  COLLECTION_OFFICER: {
    label: 'Collection Officer',
    description: 'Delinquency tracking, DPD aging buckets, customer follow-ups, and PTPs',
    nav: [
      'dashboard',
      'collections',
      'payments',
      'loans',
      'customers',
      'communications',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'COLLECTION_OFFICER',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    description: 'Branch portfolio, local originations, branch approvals, and staff oversight',
    nav: [
      'dashboard',
      'customers',
      'applications',
      'underwriting',
      'loans',
      'disbursements',
      'partners',
      'payments',
      'collections',
      'reconciliation',
      'communications',
      'command-center',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'branches',
      'users',
      'configuration',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'BRANCH_MANAGER',
  },
  AUDITOR: {
    label: 'Auditor',
    description: 'Read-only compliance audit, immutable ledger, and security inspection',
    nav: [
      'dashboard',
      'compliance',
      'privacy',
      'audit-logs',
      'integrations',
      'reports',
      'reconciliation',
      'partners',
      'communications',
      'command-center',
      'fraud-intelligence',
      'early-warnings',
      'customers',
      'applications',
      'loans',
      'disbursements',
      'payments',
    ],
    landing: '/dashboard',
    dashboard: 'AUDITOR',
  },
  CUSTOMER: {
    label: 'Borrower',
    description: 'Self-service borrower portal for active loans, repayments, and NOC certificates',
    nav: [
      'dashboard',
      'loans',
      'payments',
      'emi-calculator',
      'privacy',
    ],
    landing: '/dashboard',
    dashboard: 'CUSTOMER',
  },
};

export function roleConfigFor(roles?: string[]): RoleConfig {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return ROLE_CONFIG.ADMIN;
  }
  if (roles.includes('SUPER_ADMIN')) return ROLE_CONFIG.SUPER_ADMIN;
  if (roles.includes('ADMIN')) return ROLE_CONFIG.ADMIN;

  const primaryRole = roles[0] as RoleName;
  return ROLE_CONFIG[primaryRole] ?? ROLE_CONFIG.ADMIN;
}
