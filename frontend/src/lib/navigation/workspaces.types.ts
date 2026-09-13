// Centralized Workspaces Taxonomy for Adyapan Lending OS (Phase P3)
// 7 Authoritative Business Hubs + Borrower Self-Service

import { RoleName } from '../roles';

export type WorkspaceId =
  | 'ORIGINATION'   // Hub 1: Front-Office Sourcing, Leads, Applications, Customers, Documents
  | 'CREDIT'        // Hub 2: Credit Appraisal, Underwriting Queue, BRE, Risk & Fraud Review
  | 'FINANCE'       // Hub 3: Active Loans, Disbursements (Gatekeeper), Payments, GL, Accounting, Recon
  | 'COLLECTIONS'   // Hub 4: Delinquency Tracking, DPD Queues, PTP Desk, Settlements, Write-offs
  | 'PARTNER'       // Hub 5: Partner/DSA Sourcing, Applications, Commissions, API Credentials
  | 'SUPPORT'       // Hub 6: Customer Operations, Tickets & SLA, Omnichannel Hub, Grievances
  | 'PLATFORM'      // Hub 7: Multi-Tenant Governance, Branches, Users, Roles, Workflows, Integrations, Audit
  | 'BORROWER';     // Customer Self-Service Portal (/customer/*)

export interface WorkspaceConfig {
  id: WorkspaceId;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  defaultRoute: string;
  primaryRoles: RoleName[];
  allowedRoles: RoleName[];
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceConfig> = {
  ORIGINATION: {
    id: 'ORIGINATION',
    name: 'Origination & Front-Office Hub',
    shortLabel: 'Origination',
    description: 'Lead sourcing, loan applications intake, customer onboarding, dynamic KYC, and document verification',
    iconName: 'FileText',
    defaultRoute: '/applications',
    primaryRoles: ['LOAN_OFFICER', 'BRANCH_MANAGER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR'],
  },
  CREDIT: {
    id: 'CREDIT',
    name: 'Credit & Underwriting Hub',
    shortLabel: 'Credit & UW',
    description: 'Credit appraisal, financial analysis, BRE policy rules, 6-pillar risk scoring, fraud review, and credit sanctions',
    iconName: 'ShieldCheck',
    defaultRoute: '/credit-assessment',
    primaryRoles: ['CREDIT_ANALYST', 'UNDERWRITER', 'RISK_MANAGER', 'BRANCH_MANAGER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'RISK_MANAGER', 'RISK_ANALYST', 'FRAUD_ANALYST', 'AUDITOR'],
  },
  FINANCE: {
    id: 'FINANCE',
    name: 'Finance & Servicing Hub',
    shortLabel: 'Finance & GL',
    description: 'Active loan accounts, 10-point pre-disbursement gatekeeper, payments ledger, double-entry GL, and automated recon',
    iconName: 'DollarSign',
    defaultRoute: '/disbursements',
    primaryRoles: ['FINANCE_OFFICER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'AUDITOR'],
  },
  COLLECTIONS: {
    id: 'COLLECTIONS',
    name: 'Collections & Recovery Hub',
    shortLabel: 'Collections',
    description: 'Delinquency monitoring, DPD aging buckets, collector queues, PTP tracking, and dual-control write-off proposals',
    iconName: 'AlertTriangle',
    defaultRoute: '/collections',
    primaryRoles: ['COLLECTION_OFFICER', 'BRANCH_MANAGER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'],
  },
  PARTNER: {
    id: 'PARTNER',
    name: 'Partner & Embedded Lending Hub',
    shortLabel: 'Partner Hub',
    description: 'Partner/LSP sourced applications, pipeline telemetry, commission ledgers, API keys, and webhooks',
    iconName: 'Handshake',
    defaultRoute: '/partners',
    primaryRoles: ['BRANCH_MANAGER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'],
  },
  SUPPORT: {
    id: 'SUPPORT',
    name: 'Customer & Support Hub',
    shortLabel: 'Support & Ops',
    description: 'Customer directory, support ticket queues, SLA resolution, omnichannel communications, and statutory grievances',
    iconName: 'Headphones',
    defaultRoute: '/communications',
    primaryRoles: ['BRANCH_MANAGER', 'LOAN_OFFICER'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR'],
  },
  PLATFORM: {
    id: 'PLATFORM',
    name: 'Platform & Governance Hub',
    shortLabel: 'Platform & Admin',
    description: 'Multi-tenant institutions, branch hierarchy, staff users, RBAC roles & permissions, workflows, integrations, and audit trail',
    iconName: 'Layers',
    defaultRoute: '/command-center',
    primaryRoles: ['SUPER_ADMIN', 'ADMIN'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'],
  },
  BORROWER: {
    id: 'BORROWER',
    name: 'Borrower Self-Service Portal',
    shortLabel: 'Customer Portal',
    description: 'Mobile-first loan tracking, instant credit lines, statement generation, online repayments, and NOC certificates',
    iconName: 'User',
    defaultRoute: '/customer/dashboard',
    primaryRoles: ['CUSTOMER'],
    allowedRoles: ['CUSTOMER'],
  },
};

/**
 * Returns all workspaces accessible by a given role or array of roles.
 */
export function getAuthorizedWorkspacesForRoles(roles: RoleName[]): WorkspaceConfig[] {
  if (!roles || roles.length === 0) return [];
  if (roles.includes('SUPER_ADMIN')) {
    return Object.values(WORKSPACES).filter((w) => w.id !== 'BORROWER');
  }

  return Object.values(WORKSPACES).filter((workspace) =>
    roles.some((role) => workspace.allowedRoles.includes(role))
  );
}
