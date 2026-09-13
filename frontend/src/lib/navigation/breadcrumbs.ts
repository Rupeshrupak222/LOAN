/**
 * Phase 16: Centralized Route-to-Breadcrumb Resolver
 */

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: 'Overview',
  applications: 'Loan Applications',
  'returned-applications': 'Returned Applications',
  customers: 'Customer 360',
  'credit-assessment': 'Credit Assessment',
  underwriting: 'Underwriting Queue',
  'approval-queue': 'Approval Matrix',
  'approval-tasks': 'My Approval Tasks',
  'authority-matrix': 'Authority Matrix',
  'credit-facilities': 'Credit Facilities',
  offers: 'Offers & Pricing',
  loans: 'Active Loans',
  disbursements: 'Disbursements',
  payments: 'Payments Ledger',
  collections: 'Collections',
  'general-ledger': 'General Ledger',
  accounting: 'Accounting',
  reconciliation: 'Bank Reconciliation',
  'command-center': 'AI Command Center',
  analytics: 'Portfolio Analytics',
  reports: 'MIS Reports',
  'npa-monitoring': 'NPA Monitoring',
  'early-warnings': 'Early Warnings',
  'fraud-intelligence': 'Fraud Intelligence',
  risk: 'Risk Hub',
  fraud: 'Fraud Hub',
  compliance: 'DPDP & Compliance',
  privacy: 'Privacy & Consent',
  users: 'Staff Users',
  roles: 'Roles & RBAC',
  permissions: 'Permissions Matrix',
  branches: 'Branch Network',
  'branch-review': 'Branch Applications',
  tenants: 'Lender Tenants',
  configuration: 'Configuration',
  branding: 'White-Label Branding',
  'audit-logs': 'Immutable Audit Logs',
  workflows: 'Workflow Studio',
  'bre-studio': 'BRE Rule Studio',
  borrower: 'Borrower Portal',
  partner: 'Partner Hub',
  partners: 'Partner Directory',
  settings: 'Settings',
  support: 'Support & Help',
  profile: 'My Profile',
};

export function resolveBreadcrumbs(pathname: string, activeWorkspaceName?: string): BreadcrumbSegment[] {
  if (!pathname || pathname === '/' || pathname === '/dashboard') {
    return [
      { label: activeWorkspaceName || 'Lending Operations', href: '/dashboard' },
      { label: 'Dashboard', isCurrent: true },
    ];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  if (activeWorkspaceName) {
    breadcrumbs.push({ label: activeWorkspaceName, href: '/dashboard' });
  }

  let accumulatedPath = '';
  segments.forEach((seg, idx) => {
    accumulatedPath += `/${seg}`;
    const isLast = idx === segments.length - 1;

    // Check if segment is a UUID or dynamic ID
    const isId = /^[0-9a-fA-F-]{8,}$/.test(seg) || /^[A-Z0-9_-]{6,}$/.test(seg);
    const label = isId ? `#${seg.slice(0, 8).toUpperCase()}` : ROUTE_NAME_MAP[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbs.push({
      label,
      href: isLast ? undefined : accumulatedPath,
      isCurrent: isLast,
    });
  });

  return breadcrumbs;
}
