/**
 * Phase 16: Frontend Workspace & Portal TypeScript Contracts
 */

export type PortalKey =
  | 'PUBLIC'
  | 'OPERATIONS'
  | 'CREDIT'
  | 'COLLECTIONS'
  | 'FINANCE'
  | 'MANAGEMENT'
  | 'ADMIN'
  | 'BORROWER'
  | 'PARTNER';

export type DepartmentKey =
  | 'OPERATIONS'
  | 'CREDIT'
  | 'COLLECTIONS'
  | 'FINANCE'
  | 'RISK'
  | 'MANAGEMENT'
  | 'EXECUTIVE'
  | 'ADMINISTRATION'
  | 'COMPLIANCE'
  | 'CUSTOMER_SERVICE'
  | 'PARTNER_NETWORK';

export type WorkspaceKey =
  | 'OPERATIONS_LENDING'
  | 'OPERATIONS_BRANCH'
  | 'OPERATIONS_ONBOARDING'
  | 'CREDIT_ASSESSMENT'
  | 'CREDIT_UNDERWRITING'
  | 'CREDIT_RISK_STUDIO'
  | 'COLLECTIONS_DELINQUENCY'
  | 'COLLECTIONS_RECOVERY'
  | 'COLLECTIONS_SETTLEMENTS'
  | 'FINANCE_GL'
  | 'FINANCE_TREASURY'
  | 'FINANCE_RECONCILIATION'
  | 'MANAGEMENT_COMMAND_CENTER'
  | 'MANAGEMENT_ANALYTICS'
  | 'MANAGEMENT_EARLY_WARNINGS'
  | 'ADMIN_ACCESS_CONTROL'
  | 'ADMIN_RULES_STUDIO'
  | 'ADMIN_CONFIGURATION'
  | 'ADMIN_AUDIT_COMPLIANCE'
  | 'BORROWER_SELF_SERVICE'
  | 'PARTNER_EMBEDDED_HUB';

export interface PortalDefinition {
  key: PortalKey;
  name: string;
  description: string;
  iconName: string;
  defaultWorkspace: WorkspaceKey;
  allowedRoles: string[];
  isEnabled: boolean;
}

export interface WorkspaceDefinition {
  key: WorkspaceKey;
  name: string;
  shortLabel: string;
  description: string;
  portal: PortalKey;
  department: DepartmentKey;
  iconName: string;
  defaultRoute: string;
  allowedRoles: string[];
  requiredPermissions?: string[];
  displayOrder: number;
  status: 'ACTIVE' | 'BETA' | 'INACTIVE';
}

export interface NavigationItemModel {
  id: string;
  label: string;
  icon: string;
  route: string;
  permission?: string;
  requiredAnyPermissions?: string[];
  workspace: WorkspaceKey;
  portal: PortalKey;
  group: 'OVERVIEW' | 'WORKFLOW' | 'OPERATIONS' | 'FINANCE' | 'GOVERNANCE' | 'REPORTS' | 'SETTINGS';
  parent?: string;
  children?: NavigationItemModel[];
  displayOrder: number;
  enabled: boolean;
  badge?: {
    text?: string;
    variant?: 'default' | 'danger' | 'warning' | 'info' | 'success';
    countQueryKey?: string;
  };
  featureFlag?: string;
}

export interface FeatureFlagConfig {
  [key: string]: boolean;
}

export interface UserAccessContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId?: string | null;
  };
  organization: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  department: {
    key: DepartmentKey;
    name: string;
  };
  roles: string[];
  primaryRole: string;
  availablePortals: PortalDefinition[];
  availableWorkspaces: WorkspaceDefinition[];
  activePortal: PortalDefinition;
  activeWorkspace: WorkspaceDefinition;
  permissions: string[];
  navigation: {
    items: NavigationItemModel[];
    groups: Array<{
      key: string;
      label: string;
      items: NavigationItemModel[];
    }>;
  };
  featureFlags: FeatureFlagConfig;
}
