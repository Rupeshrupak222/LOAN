// Central role configuration for the Adyapan LMS.
// Single source of truth for: display labels, allowed navigation, landing page,
// and which dashboard preset each role sees.
//
// Roles must match the backend Role.name values (see database/prisma/seed.ts).

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

// All navigable feature keys in the app. Each maps to a route.
export type NavKey =
  | 'dashboard'
  | 'customers'
  | 'loan-products'
  | 'applications'
  | 'emi-calculator'
  | 'loans'
  | 'audit-logs';

export interface RoleConfig {
  label: string;
  description: string;
  // Which nav items (feature keys) this role may see, in display order.
  nav: NavKey[];
  // Where the user lands after login.
  landing: string;
  // Dashboard preset id used to pick role-specific widgets.
  dashboard: RoleName;
}

export const NAV_ROUTES: Record<NavKey, { href: string; label: string }> = {
  dashboard: { href: '/dashboard', label: 'Dashboard' },
  customers: { href: '/customers', label: 'Customers' },
  'loan-products': { href: '/loan-products', label: 'Loan Products' },
  applications: { href: '/applications', label: 'Applications' },
  'emi-calculator': { href: '/emi-calculator', label: 'EMI Calculator' },
  loans: { href: '/loans', label: 'Loans' },
  'audit-logs': { href: '/audit-logs', label: 'Audit Logs' },
};

export const ROLE_CONFIG: Record<RoleName, RoleConfig> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Full system access and configuration',
    nav: ['dashboard', 'customers', 'loan-products', 'applications', 'emi-calculator', 'loans', 'audit-logs'],
    landing: '/dashboard',
    dashboard: 'SUPER_ADMIN',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Operations administration',
    nav: ['dashboard', 'customers', 'loan-products', 'applications', 'emi-calculator', 'loans', 'audit-logs'],
    landing: '/dashboard',
    dashboard: 'ADMIN',
  },
  LOAN_OFFICER: {
    label: 'Loan Officer',
    description: 'Onboards customers and originates applications',
    nav: ['dashboard', 'customers', 'applications', 'emi-calculator', 'loan-products'],
    landing: '/dashboard',
    dashboard: 'LOAN_OFFICER',
  },
  CREDIT_ANALYST: {
    label: 'Credit Analyst',
    description: 'Assesses eligibility and credit risk',
    nav: ['dashboard', 'applications', 'customers', 'emi-calculator'],
    landing: '/dashboard',
    dashboard: 'CREDIT_ANALYST',
  },
  UNDERWRITER: {
    label: 'Underwriter',
    description: 'Makes final approval / rejection decisions',
    nav: ['dashboard', 'applications', 'customers', 'loan-products'],
    landing: '/dashboard',
    dashboard: 'UNDERWRITER',
  },
  FINANCE_OFFICER: {
    label: 'Finance Officer',
    description: 'Handles disbursement and payments',
    nav: ['dashboard', 'loans', 'applications', 'emi-calculator'],
    landing: '/dashboard',
    dashboard: 'FINANCE_OFFICER',
  },
  COLLECTION_OFFICER: {
    label: 'Collection Officer',
    description: 'Manages overdue accounts and recovery',
    nav: ['dashboard', 'loans', 'customers'],
    landing: '/dashboard',
    dashboard: 'COLLECTION_OFFICER',
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    description: 'Oversees branch portfolio and approvals',
    nav: ['dashboard', 'customers', 'applications', 'loans', 'loan-products', 'emi-calculator'],
    landing: '/dashboard',
    dashboard: 'BRANCH_MANAGER',
  },
  AUDITOR: {
    label: 'Auditor',
    description: 'Read-only oversight and audit trail',
    nav: ['dashboard', 'audit-logs', 'applications', 'loans', 'customers'],
    landing: '/dashboard',
    dashboard: 'AUDITOR',
  },
  CUSTOMER: {
    label: 'Customer',
    description: 'Views own loans and EMI schedule',
    nav: ['dashboard', 'loans', 'emi-calculator'],
    landing: '/dashboard',
    dashboard: 'CUSTOMER',
  },
};

const ROLE_PRIORITY: RoleName[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'BRANCH_MANAGER',
  'UNDERWRITER',
  'CREDIT_ANALYST',
  'FINANCE_OFFICER',
  'COLLECTION_OFFICER',
  'LOAN_OFFICER',
  'AUDITOR',
  'CUSTOMER',
];

/** Picks the highest-privilege role when a user holds several. */
export function primaryRole(roles: string[] | undefined): RoleName {
  if (!roles || roles.length === 0) return 'CUSTOMER';
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return (roles[0] as RoleName) ?? 'CUSTOMER';
}

export function roleConfigFor(roles: string[] | undefined): RoleConfig {
  return ROLE_CONFIG[primaryRole(roles)];
}

/** True if the user (by roles) is allowed to see a given feature/route. */
export function canAccess(roles: string[] | undefined, nav: NavKey): boolean {
  return roleConfigFor(roles).nav.includes(nav);
}

// ---------------------------------------------------------------------------
// Role-specific dashboard presets.
// Demo figures — replace with live aggregate endpoints as they are built.
// ---------------------------------------------------------------------------

export interface Kpi {
  label: string;
  value: string;
  hint?: string;
}

export interface FlowStep {
  step: string;
  detail: string;
}

export interface DashboardPreset {
  title: string;
  subtitle: string;
  kpis: Kpi[];
  // The role's typical workflow, shown as an ordered checklist on the dashboard.
  flow: FlowStep[];
  // Optional bar chart: label -> count.
  chart?: { title: string; data: { name: string; value: number }[] };
}

const inr = (n: number) => '\u20B9' + n.toLocaleString('en-IN');

export const DASHBOARD_PRESETS: Record<RoleName, DashboardPreset> = {
  SUPER_ADMIN: {
    title: 'Super Admin Dashboard',
    subtitle: 'Full portfolio, users and system health',
    kpis: [
      { label: 'Total Users', value: '38' },
      { label: 'Active Loans', value: '142' },
      { label: 'Total Disbursed', value: inr(24500000) },
      { label: 'Outstanding', value: inr(18320000) },
      { label: 'Overdue (PAR)', value: '6.7%', hint: inr(1240000) },
      { label: 'Branches', value: '4' },
    ],
    flow: [
      { step: 'Manage roles & users', detail: 'Provision staff, assign roles, reset access' },
      { step: 'Configure products & limits', detail: 'Interest, fees, approval chains' },
      { step: 'Monitor portfolio health', detail: 'Disbursement, PAR, collections' },
      { step: 'Review audit trail', detail: 'Every sensitive action is logged' },
    ],
    chart: {
      title: 'Loans by product',
      data: [
        { name: 'Personal', value: 64 },
        { name: 'Business', value: 42 },
        { name: 'Education', value: 28 },
        { name: 'Vehicle', value: 36 },
        { name: 'Emergency', value: 18 },
      ],
    },
  },
  ADMIN: {
    title: 'Admin Dashboard',
    subtitle: 'Operations overview',
    kpis: [
      { label: 'Total Customers', value: '1,284', hint: '+24 this month' },
      { label: 'Active Loans', value: '142' },
      { label: 'Applications Pending', value: '34' },
      { label: 'Total Disbursed', value: inr(24500000) },
      { label: 'Collected (Month)', value: inr(3120000) },
      { label: 'Overdue Amount', value: inr(1240000), hint: 'PAR 6.7%' },
    ],
    flow: [
      { step: 'Oversee daily operations', detail: 'Customers, applications, loans' },
      { step: 'Maintain loan products', detail: 'Keep rates and rules current' },
      { step: 'Support the team', detail: 'Unblock officers and analysts' },
      { step: 'Check audit logs', detail: 'Spot anomalies early' },
    ],
    chart: {
      title: 'Applications by status',
      data: [
        { name: 'Submitted', value: 34 },
        { name: 'Under Review', value: 22 },
        { name: 'Approved', value: 48 },
        { name: 'Rejected', value: 12 },
        { name: 'Disbursed', value: 40 },
      ],
    },
  },
  LOAN_OFFICER: {
    title: 'Loan Officer Dashboard',
    subtitle: 'Your customers and applications',
    kpis: [
      { label: 'My Customers', value: '86' },
      { label: 'Draft Applications', value: '7' },
      { label: 'Submitted This Week', value: '12' },
      { label: 'Pending KYC', value: '5', hint: 'Follow up' },
    ],
    flow: [
      { step: 'Onboard customer', detail: 'Capture KYC and income details' },
      { step: 'Create application', detail: 'Pick product, amount and tenure' },
      { step: 'Run EMI calculator', detail: 'Set expectations with the customer' },
      { step: 'Submit for assessment', detail: 'Hand off to Credit Analyst' },
    ],
    chart: {
      title: 'My applications by status',
      data: [
        { name: 'Draft', value: 7 },
        { name: 'Submitted', value: 12 },
        { name: 'KYC Pending', value: 5 },
        { name: 'Approved', value: 9 },
      ],
    },
  },
  CREDIT_ANALYST: {
    title: 'Credit Analyst Dashboard',
    subtitle: 'Eligibility and risk assessment queue',
    kpis: [
      { label: 'Awaiting Assessment', value: '18' },
      { label: 'Assessed Today', value: '9' },
      { label: 'High Risk Flagged', value: '4', hint: 'Escalate' },
      { label: 'Avg. Turnaround', value: '2.4h' },
    ],
    flow: [
      { step: 'Pick application from queue', detail: 'Submitted / KYC verified items' },
      { step: 'Check eligibility', detail: 'Income, obligations, product rules' },
      { step: 'Score credit risk', detail: 'LOW / MEDIUM / HIGH category' },
      { step: 'Forward to Underwriting', detail: 'Attach factors and notes' },
    ],
    chart: {
      title: 'Assessments by risk',
      data: [
        { name: 'Low', value: 22 },
        { name: 'Medium', value: 14 },
        { name: 'High', value: 4 },
      ],
    },
  },
  UNDERWRITER: {
    title: 'Underwriter Dashboard',
    subtitle: 'Approval decisions',
    kpis: [
      { label: 'Awaiting Decision', value: '11' },
      { label: 'Approved Today', value: '6' },
      { label: 'Sent Back', value: '3' },
      { label: 'Rejected Today', value: '2' },
    ],
    flow: [
      { step: 'Review assessed application', detail: 'Eligibility + risk report' },
      { step: 'Verify against limits', detail: 'Approval chain by amount' },
      { step: 'Decide', detail: 'Approve / conditions / send back / reject' },
      { step: 'Move to disbursement', detail: 'Ready-for-disbursement queue' },
    ],
    chart: {
      title: 'Decisions this week',
      data: [
        { name: 'Approved', value: 24 },
        { name: 'Conditions', value: 8 },
        { name: 'Sent Back', value: 6 },
        { name: 'Rejected', value: 5 },
      ],
    },
  },
  FINANCE_OFFICER: {
    title: 'Finance Officer Dashboard',
    subtitle: 'Disbursement and payments',
    kpis: [
      { label: 'Ready to Disburse', value: '9' },
      { label: 'Disbursed Today', value: inr(1450000) },
      { label: 'Payments Received', value: inr(3120000), hint: 'This month' },
      { label: 'Failed Transactions', value: '2' },
    ],
    flow: [
      { step: 'Pick approved loan', detail: 'Ready-for-disbursement queue' },
      { step: 'Disburse funds', detail: 'Record method and reference' },
      { step: 'Post repayments', detail: 'Allocate: fees, penalty, interest, principal' },
      { step: 'Reconcile', detail: 'Match transactions and ledger' },
    ],
    chart: {
      title: 'Collections trend',
      data: [
        { name: 'Apr', value: 1680000 },
        { name: 'May', value: 1420000 },
        { name: 'Jun', value: 2100000 },
        { name: 'Jul', value: 1950000 },
        { name: 'Aug', value: 2450000 },
      ],
    },
  },
  COLLECTION_OFFICER: {
    title: 'Collection Officer Dashboard',
    subtitle: 'Overdue accounts and recovery',
    kpis: [
      { label: 'Overdue Loans', value: '28' },
      { label: 'Overdue Amount', value: inr(1240000) },
      { label: 'Promised To Pay', value: '11' },
      { label: 'Recovered Today', value: inr(184000) },
    ],
    flow: [
      { step: 'Work the overdue queue', detail: 'Sorted by days past due' },
      { step: 'Contact customer', detail: 'Log promise-to-pay' },
      { step: 'Record recovery', detail: 'Payment reduces outstanding' },
      { step: 'Escalate hard cases', detail: 'Restructure or write-off review' },
    ],
    chart: {
      title: 'Overdue by bucket (days)',
      data: [
        { name: '1-30', value: 14 },
        { name: '31-60', value: 8 },
        { name: '61-90', value: 4 },
        { name: '90+', value: 2 },
      ],
    },
  },
  BRANCH_MANAGER: {
    title: 'Branch Manager Dashboard',
    subtitle: 'Branch portfolio and approvals',
    kpis: [
      { label: 'Branch Customers', value: '312' },
      { label: 'Active Loans', value: '58' },
      { label: 'Pending Approvals', value: '7' },
      { label: 'Branch Disbursed', value: inr(6800000) },
      { label: 'Branch Overdue', value: inr(420000), hint: 'PAR 6.2%' },
      { label: 'Team Members', value: '9' },
    ],
    flow: [
      { step: 'Review branch pipeline', detail: 'Applications and loans' },
      { step: 'Approve within limit', detail: 'First link in approval chain' },
      { step: 'Track team performance', detail: 'Officers, analysts, collections' },
      { step: 'Manage branch risk', detail: 'Overdue and recovery' },
    ],
    chart: {
      title: 'Branch loans by product',
      data: [
        { name: 'Personal', value: 22 },
        { name: 'Business', value: 14 },
        { name: 'Vehicle', value: 12 },
        { name: 'Education', value: 10 },
      ],
    },
  },
  AUDITOR: {
    title: 'Auditor Dashboard',
    subtitle: 'Read-only oversight and audit trail',
    kpis: [
      { label: 'Audit Events (Today)', value: '212' },
      { label: 'Sensitive Actions', value: '18' },
      { label: 'Approvals Reviewed', value: '46' },
      { label: 'Flags Raised', value: '3' },
    ],
    flow: [
      { step: 'Scan audit logs', detail: 'Who did what, when' },
      { step: 'Trace approvals', detail: 'Application to disbursement' },
      { step: 'Sample transactions', detail: 'Payments and allocations' },
      { step: 'Raise findings', detail: 'Read-only: no edits' },
    ],
    chart: {
      title: 'Events by entity',
      data: [
        { name: 'Auth', value: 64 },
        { name: 'Customer', value: 38 },
        { name: 'Application', value: 52 },
        { name: 'Loan', value: 34 },
        { name: 'Payment', value: 24 },
      ],
    },
  },
  CUSTOMER: {
    title: 'My Loans',
    subtitle: 'Your loans and upcoming EMIs',
    kpis: [
      { label: 'Active Loans', value: '1' },
      { label: 'Outstanding', value: inr(342000) },
      { label: 'Next EMI', value: inr(9450), hint: 'Due 5 Sep' },
      { label: 'EMIs Paid', value: '8 / 36' },
    ],
    flow: [
      { step: 'View your loan', detail: 'Principal, rate and status' },
      { step: 'Check EMI schedule', detail: 'Paid and upcoming installments' },
      { step: 'Plan with calculator', detail: 'Estimate a new loan EMI' },
      { step: 'Track payments', detail: 'History and receipts' },
    ],
    chart: {
      title: 'Repayment progress (EMIs)',
      data: [
        { name: 'Paid', value: 8 },
        { name: 'Remaining', value: 28 },
      ],
    },
  },
};

export function dashboardPresetFor(roles: string[] | undefined): DashboardPreset {
  return DASHBOARD_PRESETS[primaryRole(roles)];
}
