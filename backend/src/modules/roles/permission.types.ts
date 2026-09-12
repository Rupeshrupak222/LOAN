// Step 34: Enterprise Dynamic Role & Permission Types

export type PermissionCategory =
  | 'APPLICATIONS'
  | 'UNDERWRITING'
  | 'CREDIT_ASSESSMENT'
  | 'BRANCH_MANAGEMENT'
  | 'DISBURSEMENTS'
  | 'COLLECTIONS'
  | 'CONFIGURATION'
  | 'PRIVACY_AUDIT'
  | 'TENANT_ADMIN'
  | 'RISK_GOVERNANCE'
  | 'FRAUD_OPS'
  | 'PAYMENTS_SETTLEMENTS'
  | 'ACCOUNTING_FINANCE'
  | 'COMMUNICATIONS_SUPPORT'
  | 'ANALYTICS_REPORTING';

export type PermissionCode =
  // Phase 14: Analytics, MIS & Enterprise Command Center
  | 'ANALYTICS_VIEW'
  | 'ANALYTICS_PORTFOLIO'
  | 'ANALYTICS_CREDIT'
  | 'ANALYTICS_RISK'
  | 'ANALYTICS_FRAUD'
  | 'ANALYTICS_COLLECTIONS'
  | 'ANALYTICS_FINANCE'
  | 'ANALYTICS_PARTNERS'
  | 'ANALYTICS_BRANCHES'
  | 'ANALYTICS_PRODUCTS'
  | 'ANALYTICS_OPERATIONS'
  | 'ANALYTICS_SUPPORT'
  | 'ANALYTICS_COMMAND_CENTER'
  | 'REPORT_VIEW'
  | 'REPORT_CREATE'
  | 'REPORT_EDIT'
  | 'REPORT_EXECUTE'
  | 'REPORT_EXPORT'
  | 'REPORT_SHARE'
  | 'DASHBOARD_VIEW'
  | 'DASHBOARD_CONFIGURE'
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
  // Credit Assessment
  | 'CREDIT_ASSESSMENT_VIEW'
  | 'CREDIT_ASSESSMENT_EVALUATE'
  | 'CREDIT_ASSESSMENT_SUBMIT'
  | 'CREDIT_ASSESSMENT_FORWARD'
  // Branch Management
  | 'VIEW_BRANCH_APPLICATIONS'
  | 'VIEW_CUSTOMER_DETAILS'
  | 'VIEW_DOCUMENTS'
  | 'VIEW_CREDIT_ANALYST_REPORT'
  | 'VIEW_RISK_ASSESSMENT'
  | 'VIEW_REPAYMENT_ASSESSMENT'
  | 'REVIEW_APPLICATION'
  | 'APPROVE_WITHIN_DELEGATED_LIMIT'
  | 'SEND_BACK_FOR_CORRECTION'
  | 'ESCALATE_TO_UNDERWRITER'
  | 'ADD_MANAGER_REMARKS'
  // Disbursements
  | 'DISBURSEMENTS_INITIATE_PAYOUT'
  | 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'
  | 'DISBURSEMENTS_EXECUTE_TRANSFER'
  | 'DISBURSEMENTS_RECONCILE'
  // Collections & Recovery (Phase 11)
  | 'COLLECTIONS_VIEW_DPD'
  | 'COLLECTIONS_ASSIGN'
  | 'COLLECTIONS_CONTACT'
  | 'COLLECTIONS_RECORD_PTP'
  | 'COLLECTIONS_UPDATE_PTP'
  | 'COLLECTIONS_ESCALATE'
  | 'COLLECTIONS_INITIATE_RECOVERY'
  | 'COLLECTIONS_WAIVE_PENALTY'
  | 'COLLECTIONS_SETTLE_LOAN'
  | 'COLLECTIONS_SETTLEMENT_REQUEST'
  | 'COLLECTIONS_SETTLEMENT_APPROVE'
  | 'COLLECTIONS_WRITEOFF_REQUEST'
  | 'COLLECTIONS_WRITEOFF_APPROVE'
  | 'COLLECTIONS_POLICY_VIEW'
  | 'COLLECTIONS_POLICY_MANAGE'
  | 'COLLECTIONS_ANALYTICS_VIEW'
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
  | 'TENANT_CONFIGURE_BRANDING'
  // Risk Governance (Phase 9)
  | 'RISK_VIEW_SIGNALS'
  | 'RISK_EVALUATE'
  | 'RISK_MANAGE_POLICIES'
  | 'RISK_OVERRIDE'
  // Fraud Operations & Investigation (Phase 9)
  | 'FRAUD_VIEW_CASES'
  | 'FRAUD_INVESTIGATE'
  | 'FRAUD_MANAGE_RULES'
  | 'FRAUD_OVERRIDE'
  // Payments, Reconciliation & Settlement (Phase 10)
  | 'PAYMENTS_VIEW'
  | 'PAYMENTS_CREATE'
  | 'PAYMENTS_CONFIRM'
  | 'PAYMENTS_REFUND'
  | 'PAYMENTS_REVERSE'
  | 'SETTLEMENTS_VIEW'
  | 'SETTLEMENTS_RECONCILE'
  | 'PAYOUTS_VIEW'
  | 'PAYOUTS_INITIATE'
  | 'PAYOUTS_APPROVE'
  | 'RECONCILIATION_VIEW'
  | 'RECONCILIATION_EXECUTE'
  | 'RECONCILIATION_ADJUST'
  | 'RECONCILIATION_RESOLVE'
  | 'DISPUTES_VIEW'
  | 'DISPUTES_MANAGE'
  // Accounting & Financial Operations (Phase 12)
  | 'ACCOUNTING_VIEW'
  | 'ACCOUNTING_DASHBOARD_VIEW'
  | 'COA_VIEW'
  | 'COA_CREATE'
  | 'COA_EDIT'
  | 'COA_ACTIVATE'
  | 'COA_ARCHIVE'
  | 'JOURNAL_VIEW'
  | 'JOURNAL_CREATE'
  | 'JOURNAL_EDIT'
  | 'JOURNAL_SUBMIT'
  | 'JOURNAL_APPROVE'
  | 'JOURNAL_POST'
  | 'JOURNAL_REJECT'
  | 'JOURNAL_REVERSE'
  | 'PERIOD_VIEW'
  | 'PERIOD_OPEN'
  | 'PERIOD_SOFT_CLOSE'
  | 'PERIOD_CLOSE'
  | 'PERIOD_REOPEN'
  | 'TRIAL_BALANCE_VIEW'
  | 'FINANCIAL_STATEMENTS_VIEW'
  | 'CASH_FLOW_VIEW'
  | 'RECEIVABLES_VIEW'
  | 'PAYABLES_VIEW'
  | 'PAYABLES_CREATE'
  | 'PAYABLES_APPROVE'
  | 'PAYABLES_PAY'
  | 'ACCRUAL_VIEW'
  | 'ACCRUAL_CREATE'
  | 'ACCRUAL_APPROVE'
  | 'ACCRUAL_POST'
  | 'ACCRUAL_REVERSE'
  | 'TAX_VIEW'
  | 'TAX_MANAGE'
  | 'TAX_REPORT'
  | 'SUSPENSE_MANAGE'
  | 'FINANCE_CONTROLS_VIEW'
  // Communications, Notifications & Support (Phase 13)
  | 'COMMUNICATIONS_VIEW'
  | 'COMMUNICATIONS_SEND'
  | 'COMMUNICATIONS_TEMPLATE_VIEW'
  | 'COMMUNICATIONS_TEMPLATE_CREATE'
  | 'COMMUNICATIONS_TEMPLATE_EDIT'
  | 'COMMUNICATIONS_TEMPLATE_ACTIVATE'
  | 'COMMUNICATIONS_POLICY_VIEW'
  | 'COMMUNICATIONS_POLICY_CREATE'
  | 'COMMUNICATIONS_POLICY_EDIT'
  | 'COMMUNICATIONS_DELIVERY_VIEW'
  | 'COMMUNICATIONS_PREFERENCE_VIEW'
  | 'COMMUNICATIONS_PREFERENCE_MANAGE'
  | 'SUPPORT_VIEW'
  | 'SUPPORT_TICKET_CREATE'
  | 'SUPPORT_TICKET_ASSIGN'
  | 'SUPPORT_TICKET_REPLY'
  | 'SUPPORT_TICKET_RESOLVE'
  | 'SUPPORT_TICKET_REOPEN'
  | 'SUPPORT_TICKET_ESCALATE'
  | 'SUPPORT_COMPLAINT_VIEW'
  | 'SUPPORT_COMPLAINT_MANAGE'
  | 'SUPPORT_REPORTS_VIEW';

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
