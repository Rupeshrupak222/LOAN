// Step 34: Enterprise Dynamic Role & Permission Types

export type PermissionCategory =
  | 'APPLICATIONS'
  | 'UNDERWRITING'
  | 'DISBURSEMENTS'
  | 'COLLECTIONS'
  | 'CONFIGURATION'
  | 'PRIVACY_AUDIT'
  | 'TENANT_ADMIN';

export type PermissionCode =
  // Applications
  | 'APPLICATIONS_CREATE'
  | 'APPLICATIONS_VIEW'
  | 'APPLICATIONS_ASSIGN'
  | 'APPLICATIONS_REVIEW'
  | 'APPLICATIONS_APPROVE'
  | 'APPLICATIONS_REJECT'
  // Underwriting
  | 'UNDERWRITING_VIEW_BUREAU'
  | 'UNDERWRITING_RUN_AI_ASSIST'
  | 'UNDERWRITING_APPROVE_EXCEPTION'
  | 'UNDERWRITING_COMMITTEE_VOTE'
  // Disbursements
  | 'DISBURSEMENTS_INITIATE_PAYOUT'
  | 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'
  | 'DISBURSEMENTS_EXECUTE_TRANSFER'
  | 'DISBURSEMENTS_RECONCILE'
  // Collections
  | 'COLLECTIONS_VIEW_DPD'
  | 'COLLECTIONS_RECORD_PTP'
  | 'COLLECTIONS_INITIATE_RECOVERY'
  | 'COLLECTIONS_WAIVE_PENALTY'
  | 'COLLECTIONS_SETTLE_LOAN'
  // Configuration
  | 'CONFIGURATION_VIEW_POLICIES'
  | 'CONFIGURATION_DRAFT_POLICY'
  | 'CONFIGURATION_PUBLISH_POLICY'
  | 'CONFIGURATION_CONFIGURE_INTEGRATIONS'
  // Privacy & Audit
  | 'PRIVACY_VIEW_CONSENT_REGISTRY'
  | 'AUDIT_EXPORT_EVIDENCE_PACKAGE'
  | 'AUDIT_VERIFY_CHAIN'
  | 'PRIVACY_PURGE_PII'
  // Tenant Administration
  | 'TENANT_MANAGE_USERS'
  | 'TENANT_ASSIGN_ROLES'
  | 'TENANT_VIEW_OPERATIONS_CENTER'
  | 'TENANT_CONFIGURE_BRANDING';

export type ResourceScope = 'GLOBAL' | 'TENANT' | 'REGION' | 'BRANCH';

export interface PermissionDefinition {
  code: PermissionCode;
  category: PermissionCategory;
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CustomRole {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  parentRoleCode?: string;
  permissions: PermissionCode[];
  scope: ResourceScope;
  sanctionLimitAmount?: number; // Max loan sanction authority in INR
  payoutLimitAmount?: number; // Max payout execution limit in INR
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomRoleDto {
  code: string;
  name: string;
  description: string;
  parentRoleCode?: string;
  permissions: PermissionCode[];
  scope?: ResourceScope;
  sanctionLimitAmount?: number;
  payoutLimitAmount?: number;
  allowSodOverride?: boolean;
  overrideJustification?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: PermissionCode[];
  scope?: ResourceScope;
  sanctionLimitAmount?: number;
  payoutLimitAmount?: number;
}

export interface SodRule {
  id: string;
  code: string;
  name: string;
  description: string;
  conflictingPermissions: [PermissionCode, PermissionCode];
  severity: 'CRITICAL_BLOCK' | 'WARNING';
}

export interface SodConflictCheckResult {
  hasConflict: boolean;
  hasCriticalBlock: boolean;
  conflicts: Array<{
    ruleCode: string;
    ruleName: string;
    description: string;
    conflictingPair: [PermissionCode, PermissionCode];
    severity: 'CRITICAL_BLOCK' | 'WARNING';
  }>;
}
