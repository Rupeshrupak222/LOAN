// Centralized Workspaces Taxonomy for Adyapan Lending OS

export type WorkspaceId =
  | 'PLATFORM'      // Multi-tenant governance, system settings, workflows, integrations
  | 'OPERATIONS'    // Core lending operations (LOS, LMS, Underwriting, Disbursements, Payments, GL)
  | 'BRANCH'        // Branch Manager portfolio oversight, local approvals, staff
  | 'COMPLIANCE'    // Regulatory compliance, DPDP consent, immutable audit trail
  | 'BORROWER'      // Customer self-service portal
  | 'PARTNER';      // Partner, LSP & Embedded Lending portal

export interface WorkspaceConfig {
  id: WorkspaceId;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  defaultRoute: string;
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceConfig> = {
  OPERATIONS: {
    id: 'OPERATIONS',
    name: 'Lending Operations',
    shortLabel: 'Operations',
    description: 'Loan origination, credit assessment, underwriting, disbursements, servicing & collections',
    iconName: 'Activity',
    defaultRoute: '/dashboard',
  },
  PLATFORM: {
    id: 'PLATFORM',
    name: 'Platform Governance & Config',
    shortLabel: 'Platform',
    description: 'Tenants, users, roles, workflow studio, BRE rules, branding, and core integrations',
    iconName: 'Layers',
    defaultRoute: '/command-center',
  },
  BRANCH: {
    id: 'BRANCH',
    name: 'Branch Operations',
    shortLabel: 'Branch Desk',
    description: 'Branch portfolio review, local approval queues, and branch staff oversight',
    iconName: 'Building2',
    defaultRoute: '/branch-review',
  },
  COMPLIANCE: {
    id: 'COMPLIANCE',
    name: 'Regulatory & Compliance',
    shortLabel: 'Compliance',
    description: 'RBI digital lending audits, DPDP consent registry, and immutable security audit logs',
    iconName: 'ShieldCheck',
    defaultRoute: '/compliance',
  },
  BORROWER: {
    id: 'BORROWER',
    name: 'Borrower Self-Service',
    shortLabel: 'Borrower',
    description: 'Customer application tracking, loan statements, instant repayment, and NOC issuance',
    iconName: 'User',
    defaultRoute: '/dashboard',
  },
  PARTNER: {
    id: 'PARTNER',
    name: 'Partner / Embedded Hub',
    shortLabel: 'Partner Hub',
    description: 'Partner application tracking, customer pipeline, API credentials, webhooks, and analytics',
    iconName: 'Handshake',
    defaultRoute: '/partner',
  },
};
