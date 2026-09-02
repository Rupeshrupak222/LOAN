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
  | 'audit-logs';

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
  payments: { key: 'payments', href: '/payments', label: 'Payments Ledger', group: 'SERVICING' },
  collections: { key: 'collections', href: '/collections', label: 'Collections & Delinquency', group: 'SERVICING' },
  reports: { key: 'reports', href: '/reports', label: 'Reports & Analytics', group: 'INSIGHTS' },
  'emi-calculator': { key: 'emi-calculator', href: '/emi-calculator', label: 'EMI Calculator', group: 'INSIGHTS' },
  branches: { key: 'branches', href: '/branches', label: 'Branch Directory', group: 'ADMINISTRATION' },
  users: { key: 'users', href: '/users', label: 'Staff Users', group: 'ADMINISTRATION' },
  settings: { key: 'settings', href: '/settings', label: 'System Settings', group: 'ADMINISTRATION' },
  'audit-logs': { key: 'audit-logs', href: '/audit-logs', label: 'Audit Logs', group: 'ADMINISTRATION' },
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
      'payments',
      'collections',
      'reports',
      'emi-calculator',
      'branches',
      'users',
      'settings',
      'audit-logs',
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
      'loan-products',
      'settings',
      'audit-logs',
      'reports',
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
      'payments',
      'reports',
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
      'payments',
      'collections',
      'reports',
      'branches',
      'users',
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
      'audit-logs',
      'reports',
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
