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
  | 'RISK_ANALYST'
  | 'FRAUD_ANALYST'
  | 'RISK_MANAGER'
  | 'CUSTOMER';

export type NavKey =
  | 'dashboard'
  | 'customers'
  | 'applications'
  | 'returned-applications'
  | 'loan-products'
  | 'credit-assessment'
  | 'branch-review'
  | 'underwriting'
  | 'loans'
  | 'disbursements'
  | 'payments'
  | 'collections'
  | 'general-ledger'
  | 'accounting'
  | 'reports'
  | 'npa-monitoring'
  | 'emi-calculator'
  | 'branches'
  | 'users'
  | 'settings'
  | 'audit-logs'
  | 'fraud-intelligence'
  | 'risk'
  | 'risk-queue'
  | 'risk-policies'
  | 'fraud'
  | 'fraud-queue'
  | 'fraud-cases'
  | 'fraud-rules'
  | 'fraud-graph'
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
  | 'bre-studio'
  | 'configuration'
  | 'branding'
  | 'analytics';

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
  'returned-applications': { key: 'returned-applications', href: '/returned-applications', label: 'Returned Applications', group: 'LENDING' },
  'loan-products': { key: 'loan-products', href: '/loan-products', label: 'Loan Products', group: 'LENDING' },
  'credit-assessment': { key: 'credit-assessment', href: '/credit-assessment', label: 'Credit Assessment', group: 'LENDING' },
  'branch-review': { key: 'branch-review', href: '/branch-review', label: 'Branch Applications Desk', group: 'LENDING' },
  underwriting: { key: 'underwriting', href: '/underwriting', label: 'Underwriting Queue', group: 'LENDING' },
  loans: { key: 'loans', href: '/loans', label: 'Loan Accounts', group: 'LENDING' },
  disbursements: { key: 'disbursements', href: '/disbursements', label: 'Disbursements', group: 'LENDING' },
  partners: { key: 'partners', href: '/partners', label: 'Partners & DSAs', group: 'LENDING' },
  payments: { key: 'payments', href: '/payments', label: 'Payments Ledger', group: 'SERVICING' },
  collections: { key: 'collections', href: '/collections', label: 'Collections & Delinquency', group: 'SERVICING' },
  'general-ledger': { key: 'general-ledger', href: '/general-ledger', label: 'General Ledger (GL)', group: 'SERVICING' },
  accounting: { key: 'accounting', href: '/accounting', label: 'Accounting & Finance', group: 'SERVICING' },
  reconciliation: { key: 'reconciliation', href: '/reconciliation', label: 'Accounting & Recon', group: 'SERVICING' },
  communications: { key: 'communications', href: '/communications', label: 'Omnichannel Hub', group: 'SERVICING' },
  'command-center': { key: 'command-center', href: '/command-center', label: 'AI Command Center', group: 'INSIGHTS' },
  analytics: { key: 'analytics', href: '/analytics', label: 'Analytics Hub', group: 'INSIGHTS' },
  operations: { key: 'operations', href: '/operations', label: 'Operations & Observability', group: 'INSIGHTS' },
  compliance: { key: 'compliance', href: '/compliance', label: 'Regulatory & Compliance', group: 'INSIGHTS' },
  privacy: { key: 'privacy', href: '/privacy', label: 'Privacy & Consent', group: 'ADMINISTRATION' },
  reports: { key: 'reports', href: '/reports', label: 'Reports & Analytics', group: 'INSIGHTS' },
  'npa-monitoring': { key: 'npa-monitoring', href: '/npa-monitoring', label: 'NPA & Asset Quality', group: 'INSIGHTS' },
  'fraud-intelligence': { key: 'fraud-intelligence', href: '/fraud-intelligence', label: 'Fraud & Anomaly Intelligence', group: 'INSIGHTS' },
  risk: { key: 'risk', href: '/risk', label: 'Risk Intelligence Hub', group: 'INSIGHTS' },
  'risk-queue': { key: 'risk-queue', href: '/risk/queue', label: 'Risk Assessment Queue', group: 'LENDING' },
  'risk-policies': { key: 'risk-policies', href: '/risk/policies', label: 'Risk Policy Studio', group: 'ADMINISTRATION' },
  fraud: { key: 'fraud', href: '/fraud', label: 'Fraud Intelligence Hub', group: 'INSIGHTS' },
  'fraud-queue': { key: 'fraud-queue', href: '/fraud/queue', label: 'Fraud Review Queue', group: 'LENDING' },
  'fraud-cases': { key: 'fraud-cases', href: '/fraud/cases', label: 'Fraud Investigation Cases', group: 'INSIGHTS' },
  'fraud-rules': { key: 'fraud-rules', href: '/fraud/rules', label: 'Fraud Rules Engine', group: 'ADMINISTRATION' },
  'fraud-graph': { key: 'fraud-graph', href: '/fraud/graph', label: 'Identity Graph Visualizer', group: 'INSIGHTS' },
  'early-warnings': { key: 'early-warnings', href: '/early-warnings', label: 'Early Warning Center', group: 'INSIGHTS' },
  'emi-calculator': { key: 'emi-calculator', href: '/emi-calculator', label: 'EMI Calculator', group: 'INSIGHTS' },
  branches: { key: 'branches', href: '/branches', label: 'Branch Directory', group: 'ADMINISTRATION' },
  users: { key: 'users', href: '/users', label: 'Staff Users', group: 'ADMINISTRATION' },
  tenants: { key: 'tenants', href: '/tenants', label: 'Lender Tenants', group: 'ADMINISTRATION' },
  roles: { key: 'roles', href: '/roles', label: 'Roles & Permissions', group: 'ADMINISTRATION' },
  workflows: { key: 'workflows', href: '/workflows', label: 'Workflow Studio', group: 'ADMINISTRATION' },
  'bre-studio': { key: 'bre-studio', href: '/bre-studio', label: 'BRE & Policy Studio', group: 'ADMINISTRATION' },
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
      'returned-applications',
      'loan-products',
      'credit-assessment',
      'branch-review',
      'underwriting',
      'loans',
      'disbursements',
      'partners',
      'payments',
      'collections',
      'general-ledger',
      'accounting',
      'reconciliation',
      'communications',
      'command-center',
      'operations',
      'compliance',
      'privacy',
      'reports',
      'npa-monitoring',
      'fraud-intelligence',
      'risk',
      'risk-queue',
      'risk-policies',
      'fraud',
      'fraud-queue',
      'fraud-cases',
      'fraud-rules',
      'fraud-graph',
      'early-warnings',
      'emi-calculator',
      'branches',
      'users',
      'tenants',
      'roles',
      'workflows',
      'bre-studio',
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
      'applications',
      'returned-applications',
      'loan-products',
      'credit-assessment',
      'branch-review',
      'risk',
      'risk-queue',
      'risk-policies',
      'fraud',
      'fraud-queue',
      'fraud-cases',
      'fraud-rules',
      'fraud-graph',
      'general-ledger',
      'accounting',
      'npa-monitoring',
      'bre-studio',
      'configuration',
      'workflows',
      'settings',
      'branding',
      'integrations',
      'audit-logs',
      'privacy',
      'operations',
      'command-center',
      'compliance',
      'reports',
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
      'returned-applications',
      'loans',
      'loan-products',
      'communications',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'LOAN_OFFICER',
  },
  CREDIT_ANALYST: {
    label: 'Credit Analyst',
    description: 'Credit assessment, policy eligibility scoring, and repayment capacity evaluation',
    nav: [
      'dashboard',
      'customers',
      'credit-assessment',
      'applications',
      'returned-applications',
      'risk',
      'risk-queue',
      'fraud',
      'fraud-queue',
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
      'returned-applications',
      'underwriting',
      'risk',
      'risk-queue',
      'risk-policies',
      'fraud',
      'fraud-queue',
      'fraud-cases',
      'fraud-graph',
      'bre-studio',
      'loans',
      'reports',
      'fraud-intelligence',
      'early-warnings',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'UNDERWRITER',
  },
  RISK_ANALYST: {
    label: 'Risk Analyst',
    description: 'Credit risk modeling, 6-pillar signal analysis, score calibration, and portfolio risk telemetry',
    nav: [
      'dashboard',
      'risk',
      'risk-queue',
      'risk-policies',
      'fraud-intelligence',
      'early-warnings',
      'applications',
      'customers',
      'reports',
      'emi-calculator',
    ],
    landing: '/risk',
    dashboard: 'RISK_ANALYST',
  },
  FRAUD_ANALYST: {
    label: 'Fraud Investigator',
    description: 'Fraud detection, identity syndicate graph analysis, suspicious case investigation, and rule governance',
    nav: [
      'dashboard',
      'fraud',
      'fraud-queue',
      'fraud-cases',
      'fraud-rules',
      'fraud-graph',
      'fraud-intelligence',
      'early-warnings',
      'applications',
      'customers',
      'reports',
    ],
    landing: '/fraud',
    dashboard: 'FRAUD_ANALYST',
  },
  RISK_MANAGER: {
    label: 'Risk & Fraud Manager',
    description: 'Enterprise risk governance, 2D matrix controls, policy publishing, overrides, and escalation authority',
    nav: [
      'dashboard',
      'risk',
      'risk-queue',
      'risk-policies',
      'fraud',
      'fraud-queue',
      'fraud-cases',
      'fraud-rules',
      'fraud-graph',
      'underwriting',
      'applications',
      'customers',
      'bre-studio',
      'reports',
      'compliance',
      'audit-logs',
    ],
    landing: '/risk',
    dashboard: 'RISK_MANAGER',
  },
  FINANCE_OFFICER: {
    label: 'Finance Officer',
    description: 'Pre-disbursement checks, electronic fund release, repayments, and NOC closure',
    nav: [
      'dashboard',
      'customers',
      'disbursements',
      'payments',
      'general-ledger',
      'accounting',
      'reconciliation',
      'loans',
      'npa-monitoring',
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
      'loans',
      'customers',
      'payments',
      'early-warnings',
      'fraud-intelligence',
      'emi-calculator',
    ],
    landing: '/dashboard',
    dashboard: 'COLLECTION_OFFICER',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    description: 'Branch portfolio, local originations, management approvals within limit, and staff oversight',
    nav: [
      'dashboard',
      'branch-review',
      'applications',
      'returned-applications',
      'customers',
      'loans',
      'partners',
      'payments',
      'collections',
      'npa-monitoring',
      'users',
      'reports',
      'early-warnings',
      'fraud-intelligence',
      'branches',
      'communications',
      'command-center',
    ],
    landing: '/dashboard',
    dashboard: 'BRANCH_MANAGER',
  },
  AUDITOR: {
    label: 'Auditor',
    description: 'Independent tenant-wide compliance audit, immutable ledger, and security inspection',
    nav: [
      'dashboard',
      'customers',
      'applications',
      'loans',
      'payments',
      'general-ledger',
      'accounting',
      'reconciliation',
      'npa-monitoring',
      'collections',
      'underwriting',
      'disbursements',
      'compliance',
      'reports',
      'fraud-intelligence',
      'risk',
      'risk-policies',
      'fraud',
      'fraud-cases',
      'fraud-rules',
      'early-warnings',
      'privacy',
      'roles',
      'branches',
      'bre-studio',
      'configuration',
      'workflows',
      'settings',
      'integrations',
      'audit-logs',
      'command-center',
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
    landing: '/borrower',
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
