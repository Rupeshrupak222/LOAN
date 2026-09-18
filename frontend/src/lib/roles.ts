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
  | 'CUSTOMER'
  | 'PARTNER_ADMIN'
  | 'PARTNER_OPERATIONS'
  | 'PARTNER_AGENT'
  | 'PARTNER_FINANCE'
  | 'PARTNER_SUPPORT';

export type NavKey =
  | 'dashboard'
  | 'leads'
  | 'customers'
  | 'applications'
  | 'returned-applications'
  | 'review-complete'
  | 'submit-to-credit'
  | 'tasks'
  | 'support'
  | 'loan-products'
  | 'credit-assessment'
  | 'credit-queue'
  | 'verifications'
  | 'documents'
  | 'branch-review'
  | 'underwriting-queue'
  | 'my-cases'
  | 'approval-queue'
  | 'underwriting'
  | 'offers'
  | 'loans'
  | 'finance-queue'
  | 'disbursements'
  | 'payments'
  | 'collections'
  | 'collections-dashboard'
  | 'collections-queue'
  | 'collections-my-accounts'
  | 'collections-due-overdue'
  | 'collections-ptp'
  | 'collections-activities'
  | 'collections-payments'
  | 'collections-customers'
  | 'collections-tasks'
  | 'collections-reports'
  | 'collections-support'
  | 'general-ledger'
  | 'accounting'
  | 'reports'
  | 'analytics'
  | 'npa-monitoring'
  | 'emi-calculator'
  | 'branches'
  | 'users'
  | 'settings'
  | 'audit-logs'
  | 'fraud-intelligence'
  | 'risk'
  | 'risk-portfolio'
  | 'risk-cases'
  | 'risk-signals'
  | 'risk-policies'
  | 'risk-analytics'
  | 'risk-reports'
  | 'risk-tasks'
  | 'risk-support'
  | 'risk-queue'
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
  | 'partner-workspace'
  | 'partner-applications'
  | 'partner-credentials'
  | 'partner-webhooks'
  | 'partner-commissions'
  | 'partner-settings';

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
  'credit-queue': { key: 'credit-queue', href: '/credit-queue', label: 'Credit Queue', group: 'OVERVIEW' },
  applications: { key: 'applications', href: '/applications', label: 'Applications', group: 'OVERVIEW' },
  'credit-assessment': { key: 'credit-assessment', href: '/credit-assessment', label: 'Credit Assessment', group: 'OVERVIEW' },
  documents: { key: 'documents', href: '/documents', label: 'Documents', group: 'OVERVIEW' },
  verifications: { key: 'verifications', href: '/verifications', label: 'Verifications', group: 'OVERVIEW' },
  tasks: { key: 'tasks', href: '/tasks', label: 'Tasks', group: 'OVERVIEW' },
  support: { key: 'support', href: '/support', label: 'Support', group: 'OVERVIEW' },
  leads: { key: 'leads', href: '/leads', label: 'Leads & Sourcing', group: 'CUSTOMERS' },
  customers: { key: 'customers', href: '/customers', label: 'Customers', group: 'CUSTOMERS' },
  'returned-applications': { key: 'returned-applications', href: '/returned-applications', label: 'Returned Applications', group: 'LENDING' },
  'review-complete': { key: 'review-complete', href: '/review-complete', label: 'Review & Complete', group: 'OVERVIEW' },
  'submit-to-credit': { key: 'submit-to-credit', href: '/submit-to-credit', label: 'Submit to Credit', group: 'OVERVIEW' },
  'loan-products': { key: 'loan-products', href: '/loan-products', label: 'Loan Products', group: 'LENDING' },
  'branch-review': { key: 'branch-review', href: '/branch-review', label: 'Branch Review', group: 'LENDING' },
  'underwriting-queue': { key: 'underwriting-queue', href: '/underwriting-queue', label: 'Underwriting Queue', group: 'OVERVIEW' },
  'my-cases': { key: 'my-cases', href: '/my-cases', label: 'My Cases', group: 'OVERVIEW' },
  'approval-queue': { key: 'approval-queue', href: '/approval-queue', label: 'Approval Queue', group: 'OVERVIEW' },
  underwriting: { key: 'underwriting', href: '/underwriting', label: 'Underwriting', group: 'OVERVIEW' },
  offers: { key: 'offers', href: '/offers', label: 'Offers & Decisions', group: 'OVERVIEW' },
  loans: { key: 'loans', href: '/loans', label: 'Loan Accounts', group: 'LENDING' },
  disbursements: { key: 'disbursements', href: '/disbursements', label: 'Disbursements', group: 'LENDING' },
  'finance-queue': { key: 'finance-queue', href: '/finance-queue', label: 'Finance Queue', group: 'OVERVIEW' },
  partners: { key: 'partners', href: '/partners', label: 'Partners & DSAs', group: 'LENDING' },
  payments: { key: 'payments', href: '/payments', label: 'Repayments & Payments', group: 'SERVICING' },
  collections: { key: 'collections', href: '/collections', label: 'Collections & Delinquency', group: 'SERVICING' },
  'collections-dashboard': { key: 'collections-dashboard', href: '/collections', label: 'Dashboard', group: 'SERVICING' },
  'collections-queue': { key: 'collections-queue', href: '/collections/queue', label: 'Collection Queue', group: 'SERVICING' },
  'collections-my-accounts': { key: 'collections-my-accounts', href: '/collections/my-accounts', label: 'My Accounts', group: 'SERVICING' },
  'collections-due-overdue': { key: 'collections-due-overdue', href: '/collections/due-overdue', label: 'Due & Overdue', group: 'SERVICING' },
  'collections-ptp': { key: 'collections-ptp', href: '/collections/promise-to-pay', label: 'Promise to Pay', group: 'SERVICING' },
  'collections-activities': { key: 'collections-activities', href: '/collections/activities', label: 'Collection Activities', group: 'SERVICING' },
  'collections-payments': { key: 'collections-payments', href: '/collections/payments', label: 'Payments', group: 'SERVICING' },
  'collections-customers': { key: 'collections-customers', href: '/collections/customers', label: 'Customers', group: 'SERVICING' },
  'collections-tasks': { key: 'collections-tasks', href: '/collections/tasks', label: 'Tasks', group: 'SERVICING' },
  'collections-reports': { key: 'collections-reports', href: '/collections/reports', label: 'Reports', group: 'SERVICING' },
  'collections-support': { key: 'collections-support', href: '/collections/support', label: 'Support', group: 'SERVICING' },
  'general-ledger': { key: 'general-ledger', href: '/general-ledger', label: 'General Ledger (GL)', group: 'SERVICING' },
  accounting: { key: 'accounting', href: '/accounting', label: 'Accounting & Finance', group: 'SERVICING' },
  reconciliation: { key: 'reconciliation', href: '/reconciliation', label: 'Reconciliation', group: 'SERVICING' },
  communications: { key: 'communications', href: '/communications', label: 'Omnichannel Hub', group: 'SERVICING' },
  'command-center': { key: 'command-center', href: '/command-center', label: 'AI Command Center', group: 'INSIGHTS' },
  analytics: { key: 'analytics', href: '/analytics', label: 'Analytics Hub', group: 'INSIGHTS' },
  operations: { key: 'operations', href: '/operations', label: 'Operations & Observability', group: 'INSIGHTS' },
  compliance: { key: 'compliance', href: '/compliance', label: 'Regulatory & Compliance', group: 'INSIGHTS' },
  privacy: { key: 'privacy', href: '/privacy', label: 'Privacy & Consent', group: 'ADMINISTRATION' },
  reports: { key: 'reports', href: '/reports', label: 'Reports & Analytics', group: 'INSIGHTS' },
  'npa-monitoring': { key: 'npa-monitoring', href: '/npa-monitoring', label: 'NPA & Asset Quality', group: 'INSIGHTS' },
  'fraud-intelligence': { key: 'fraud-intelligence', href: '/fraud-intelligence', label: 'Fraud & Anomaly Intelligence', group: 'INSIGHTS' },
  risk: { key: 'risk', href: '/risk/dashboard', label: 'Dashboard', group: 'INSIGHTS' },
  'risk-portfolio': { key: 'risk-portfolio', href: '/risk/portfolio', label: 'Risk Portfolio', group: 'INSIGHTS' },
  'risk-cases': { key: 'risk-cases', href: '/risk/cases', label: 'Risk Cases', group: 'INSIGHTS' },
  'risk-signals': { key: 'risk-signals', href: '/risk/early-warnings', label: 'Early Warning Signals', group: 'INSIGHTS' },
  'risk-policies': { key: 'risk-policies', href: '/risk/policies', label: 'Risk Models & Policies', group: 'ADMINISTRATION' },
  'risk-analytics': { key: 'risk-analytics', href: '/risk/analytics', label: 'Risk Analytics', group: 'INSIGHTS' },
  'risk-reports': { key: 'risk-reports', href: '/risk/reports', label: 'Reports', group: 'INSIGHTS' },
  'risk-tasks': { key: 'risk-tasks', href: '/risk/tasks', label: 'Tasks', group: 'INSIGHTS' },
  'risk-support': { key: 'risk-support', href: '/risk/support', label: 'Support', group: 'INSIGHTS' },
  'risk-queue': { key: 'risk-queue', href: '/risk/queue', label: 'Risk Assessment Queue', group: 'LENDING' },
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
  'partner-workspace': { key: 'partner-workspace', href: '/partner', label: 'Partner Overview', group: 'OVERVIEW' },
  'partner-applications': { key: 'partner-applications', href: '/partner/applications', label: 'Applications Pipeline', group: 'LENDING' },
  'partner-credentials': { key: 'partner-credentials', href: '/partner/api-credentials', label: 'API Credentials', group: 'ADMINISTRATION' },
  'partner-webhooks': { key: 'partner-webhooks', href: '/partner/webhooks', label: 'Webhooks', group: 'ADMINISTRATION' },
  'partner-commissions': { key: 'partner-commissions', href: '/partner/reports', label: 'Commissions & Reports', group: 'INSIGHTS' },
  'partner-settings': { key: 'partner-settings', href: '/partner/settings', label: 'Partner Settings', group: 'ADMINISTRATION' },
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
    description: 'Lead sourcing, customer onboarding, dynamic document collection, and loan origination desk',
    nav: [
      'dashboard',
      'customers',
      'leads',
      'applications',
      'tasks',
      'support',
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
      'documents',
      'credit-assessment',
      'tasks',
      'support',
    ],
    landing: '/credit-assessment',
    dashboard: 'CREDIT_ANALYST',
  },
  UNDERWRITER: {
    label: 'Underwriter',
    description: 'Credit committee decision queue, conditional sanction, and approval limits',
    nav: [
      'dashboard',
      'my-cases',
      'applications',
      'underwriting-queue',
      'approval-queue',
      'tasks',
      'support',
    ],
    landing: '/underwriting-queue',
    dashboard: 'UNDERWRITER',
  },
  RISK_ANALYST: {
    label: 'Risk Analyst',
    description: 'Risk portfolio monitoring, case investigation, and analytics.',
    nav: [
      'risk',
      'risk-portfolio',
      'risk-cases',
      'risk-signals',
      'risk-policies',
      'risk-analytics',
      'risk-reports',
      'risk-tasks',
      'risk-support',
    ],
    landing: '/risk/dashboard',
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
    description: 'Financial controls, pre-disbursement verification, electronic fund release, repayments, and reconciliation',
    nav: [
      'dashboard',
      'applications',
      'finance-queue',
      'disbursements',
      'payments',
      'reconciliation',
      'tasks',
      'support',
    ],
    landing: '/finance-queue',
    dashboard: 'FINANCE_OFFICER',
  },
  COLLECTION_OFFICER: {
    label: 'Collection Officer',
    description: 'Delinquency tracking, DPD aging buckets, customer follow-ups, and PTPs',
    nav: [
      'collections-dashboard',
      'collections-queue',
      'collections-my-accounts',
      'collections-due-overdue',
      'collections-ptp',
      'collections-activities',
      'collections-payments',
      'collections-customers',
      'collections-tasks',
      'collections-reports',
      'collections-support',
    ],
    landing: '/collections',
    dashboard: 'COLLECTION_OFFICER',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    description: 'Branch portfolio, local originations, management approvals within limit, and staff oversight',
    nav: [
      'dashboard',
      'branch-review',
      'applications',
      'customers',
      'tasks',
      'support',
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
    landing: '/customer/dashboard',
    dashboard: 'CUSTOMER',
  },
  PARTNER_ADMIN: {
    label: 'Partner Administrator',
    description: 'Manage partner organization users, credentials, webhooks, and view pipeline overview',
    nav: [
      'partner-workspace',
      'partner-applications',
      'partner-credentials',
      'partner-webhooks',
      'partner-commissions',
      'partner-settings',
    ],
    landing: '/partner',
    dashboard: 'PARTNER_ADMIN',
  },
  PARTNER_OPERATIONS: {
    label: 'Partner Operations',
    description: 'Originate and track partner applications and submit applicant documents',
    nav: [
      'partner-workspace',
      'partner-applications',
    ],
    landing: '/partner',
    dashboard: 'PARTNER_OPERATIONS',
  },
  PARTNER_AGENT: {
    label: 'Partner Sourcing Agent',
    description: 'Originate, submit, and track applications in the field or embedded channel',
    nav: [
      'partner-workspace',
      'partner-applications',
    ],
    landing: '/partner',
    dashboard: 'PARTNER_AGENT',
  },
  PARTNER_FINANCE: {
    label: 'Partner Finance',
    description: 'Access partner commission statements, payout summaries, and settlement reconciliation',
    nav: [
      'partner-workspace',
      'partner-commissions',
    ],
    landing: '/partner',
    dashboard: 'PARTNER_FINANCE',
  },
  PARTNER_SUPPORT: {
    label: 'Partner Support',
    description: 'View applicant pipeline status and raise partner support cases',
    nav: [
      'partner-workspace',
      'partner-applications',
    ],
    landing: '/partner',
    dashboard: 'PARTNER_SUPPORT',
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
