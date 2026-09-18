import { v4 as uuid } from 'uuid';
import {
  PermissionCategory,
  PermissionCode,
  PermissionDefinition,
  CustomRole,
  CreateCustomRoleDto,
  UpdateRoleDto,
  SodRule,
  SodConflictCheckResult,
  ResourceScope,
} from './permission.types';
import { AuthUser } from '../../middleware/auth';
import { evidenceAuditService } from '../audit/evidence.service';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

export const PERMISSION_ALIAS_MAP: Record<string, string[]> = {
  // Customer
  'customer.view': ['customer.view', 'VIEW_CUSTOMER_DETAILS', 'CUSTOMERS_VIEW', 'CUST_VIEW', 'PRIVACY_VIEW_CONSENT_REGISTRY'],
  'customer.create': ['customer.create', 'CUSTOMERS_CREATE', 'APPLICATIONS_CREATE'],
  'customer.update': ['customer.update', 'customer.edit', 'CUSTOMERS_EDIT', 'APPLICATIONS_CREATE'],
  'customer.edit': ['customer.edit', 'customer.update', 'CUSTOMERS_EDIT', 'APPLICATIONS_CREATE'],
  'customer.kyc': ['customer.kyc', 'PRIVACY_VIEW_CONSENT_REGISTRY', 'KYC_INITIATE'],
  'customer.kyc.initiate': ['customer.kyc.initiate', 'KYC_INITIATE', 'customer.kyc', 'PRIVACY_VIEW_CONSENT_REGISTRY'],
  'customer.kyc.view': ['customer.kyc.view', 'customer.kyc', 'VIEW_CUSTOMER_DETAILS', 'PRIVACY_VIEW_CONSENT_REGISTRY'],
  'KYC_INITIATE': ['KYC_INITIATE', 'customer.kyc.initiate', 'customer.kyc', 'PRIVACY_VIEW_CONSENT_REGISTRY'],

  // Leads
  'lead.view': ['lead.view', 'APPLICATIONS_VIEW', 'CUSTOMERS_VIEW', 'VIEW_BRANCH_APPLICATIONS'],
  'lead.create': ['lead.create', 'APPLICATIONS_CREATE', 'CUSTOMERS_CREATE'],
  'lead.update': ['lead.update', 'APPLICATIONS_EDIT', 'CUSTOMERS_EDIT', 'APPLICATIONS_CREATE'],

  // Applications
  'application.view': ['application.view', 'APPLICATIONS_VIEW', 'VIEW_BRANCH_APPLICATIONS'],
  'application.create': ['application.create', 'APPLICATIONS_CREATE'],
  'application.update': ['application.update', 'application.edit', 'APPLICATIONS_EDIT', 'APPLICATIONS_CREATE'],
  'application.edit': ['application.edit', 'application.update', 'APPLICATIONS_EDIT'],
  'application.submit': ['application.submit', 'APPLICATIONS_SUBMIT', 'APPLICATIONS_CREATE'],
  'application.review': ['application.review', 'APPLICATIONS_REVIEW', 'REVIEW_APPLICATION'],
  'application.return': ['application.return', 'SEND_BACK_FOR_CORRECTION'],
  'application.resubmit': ['application.resubmit', 'APPLICATIONS_RESUBMIT'],
  'application.approve': ['application.approve', 'APPLICATIONS_APPROVE', 'APPROVE_WITHIN_DELEGATED_LIMIT'],
  'application.reject': ['application.reject', 'APPLICATIONS_REJECT'],

  // Dynamic Documents
  'application.documents.view': ['application.documents.view', 'VIEW_DOCUMENTS', 'APPLICATIONS_VIEW', 'VIEW_BRANCH_APPLICATIONS'],
  'application.documents.upload': ['application.documents.upload', 'VIEW_DOCUMENTS', 'APPLICATIONS_CREATE', 'APPLICATIONS_VIEW'],
  'application.documents.request': ['application.documents.request', 'VIEW_DOCUMENTS', 'APPLICATIONS_CREATE', 'APPLICATIONS_VIEW'],

  // Bank Verification
  'bank-verification.initiate': ['bank-verification.initiate', 'APPLICATIONS_CREATE', 'CUSTOMERS_CREATE', 'VIEW_DOCUMENTS'],
  'bank-verification.view': ['bank-verification.view', 'VIEW_CUSTOMER_DETAILS', 'CUSTOMERS_VIEW', 'APPLICATIONS_VIEW'],

  // Tasks & Support
  'task.view': ['task.view', 'APPLICATIONS_VIEW', 'VIEW_BRANCH_APPLICATIONS'],
  'support.create': ['support.create', 'SUPPORT_TICKET_CREATE'],
  'support.view': ['support.view', 'SUPPORT_VIEW'],

  // Loans & Servicing
  'loan.view': ['loan.view', 'APPLICATIONS_VIEW', 'VIEW_BRANCH_APPLICATIONS', 'PAYMENTS_VIEW'],
  'loan.manage': ['loan.manage', 'APPLICATIONS_APPROVE', 'COLLECTIONS_ASSIGN'],

  // Credit
  'credit.view': ['credit.view', 'CREDIT_ASSESSMENT_VIEW', 'VIEW_CREDIT_ANALYST_REPORT'],
  'credit.assess': ['credit.assess', 'CREDIT_ASSESSMENT_EVALUATE', 'VIEW_REPAYMENT_ASSESSMENT'],
  'credit.recommend': ['credit.recommend', 'CREDIT_ASSESSMENT_SUBMIT'],
  'credit.bank_intelligence': ['credit.bank_intelligence', 'CREDIT_ASSESSMENT_EVALUATE'],
  'credit.fraud_score': ['credit.fraud_score', 'VIEW_RISK_ASSESSMENT'],

  // Underwriting & Approvals
  'underwriting.view': ['underwriting.view', 'UNDERWRITING_VIEW_BUREAU'],
  'underwriting.bureau_view': ['underwriting.bureau_view', 'UNDERWRITING_VIEW_BUREAU'],
  'underwriting.decide': ['underwriting.decide', 'APPLICATIONS_APPROVE', 'APPROVE_WITHIN_DELEGATED_LIMIT'],
  'underwriting.condition': ['underwriting.condition', 'ADD_MANAGER_REMARKS'],
  'underwriting.override': ['underwriting.override', 'UNDERWRITING_APPROVE_EXCEPTION'],
  'approval.view': ['approval.view', 'APPLICATIONS_VIEW'],
  'approval.approve': ['approval.approve', 'APPLICATIONS_APPROVE', 'APPROVE_WITHIN_DELEGATED_LIMIT'],
  'approval.reject': ['approval.reject', 'APPLICATIONS_REJECT'],
  'approval.send_back': ['approval.send_back', 'SEND_BACK_FOR_CORRECTION'],
  'approval.escalate': ['approval.escalate', 'ESCALATE_TO_UNDERWRITER'],
  'offer.view': ['offer.view', 'APPLICATIONS_VIEW', 'VIEW_BRANCH_APPLICATIONS'],
  'offer.generate': ['offer.generate', 'APPLICATIONS_APPROVE', 'APPLICATIONS_REVIEW', 'APPROVE_WITHIN_DELEGATED_LIMIT'],
  'offer.accept': ['offer.accept', 'APPLICATIONS_CREATE', 'APPLICATIONS_VIEW'],

  // Disbursements & Payouts
  'disbursement.view': ['disbursement.view', 'PAYOUTS_VIEW'],
  'disbursement.execute': ['disbursement.execute', 'DISBURSEMENTS_EXECUTE_TRANSFER', 'PAYOUTS_INITIATE', 'DISBURSEMENTS_INITIATE_PAYOUT'],
  'disbursement.verify': ['disbursement.verify', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
  'payout.view': ['payout.view', 'PAYOUTS_VIEW'],
  'payout.create': ['payout.create', 'PAYOUTS_INITIATE', 'DISBURSEMENTS_INITIATE_PAYOUT'],
  'payout.initiate': ['payout.initiate', 'PAYOUTS_INITIATE', 'DISBURSEMENTS_INITIATE_PAYOUT'],
  'payout.approve': ['payout.approve', 'PAYOUTS_APPROVE', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
  'payout.cancel': ['payout.cancel', 'PAYOUTS_VIEW'],

  // Payments & Reconciliation
  'payment.view': ['payment.view', 'PAYMENTS_VIEW'],
  'payment.create': ['payment.create', 'PAYMENTS_CREATE'],
  'payment.record': ['payment.record', 'PAYMENTS_CREATE'],
  'payment.confirm': ['payment.confirm', 'PAYMENTS_CONFIRM'],
  'payment.refund': ['payment.refund', 'PAYMENTS_REFUND'],
  'payment.reverse': ['payment.reverse', 'PAYMENTS_REVERSE'],
  'settlement.view': ['settlement.view', 'SETTLEMENTS_VIEW'],
  'settlement.reconcile': ['settlement.reconcile', 'SETTLEMENTS_RECONCILE'],
  'recon.view': ['recon.view', 'RECONCILIATION_VIEW'],
  'recon.execute': ['recon.execute', 'RECONCILIATION_EXECUTE'],
  'recon.resolve': ['recon.resolve', 'RECONCILIATION_RESOLVE'],

  // Collections
  'collection.view': ['collection.view', 'COLLECTIONS_VIEW_DPD'],
  'collection.assign': ['collection.assign', 'COLLECTIONS_ASSIGN'],
  'collection.contact': ['collection.contact', 'COLLECTIONS_CONTACT'],
  'collection.activity': ['collection.activity', 'COLLECTIONS_CONTACT'],
  'collection.ptp': ['collection.ptp', 'COLLECTIONS_RECORD_PTP'],
  'collection.create_ptp': ['collection.create_ptp', 'COLLECTIONS_RECORD_PTP'],
  'collection.update_ptp': ['collection.update_ptp', 'COLLECTIONS_UPDATE_PTP'],
  'collection.escalate': ['collection.escalate', 'COLLECTIONS_ESCALATE'],
  'collection.settle': ['collection.settle', 'COLLECTIONS_SETTLE_LOAN', 'COLLECTIONS_SETTLEMENT_REQUEST'],
  'collection.settlement.request': ['collection.settlement.request', 'COLLECTIONS_SETTLEMENT_REQUEST'],
  'collection.settlement.approve': ['collection.settlement.approve', 'COLLECTIONS_SETTLEMENT_APPROVE'],
  'collection.writeoff': ['collection.writeoff', 'COLLECTIONS_WRITEOFF_REQUEST'],
  'collection.writeoff.request': ['collection.writeoff.request', 'COLLECTIONS_WRITEOFF_REQUEST'],
  'collection.writeoff.approve': ['collection.writeoff.approve', 'COLLECTIONS_WRITEOFF_APPROVE'],

  // Accounting & GL
  'finance.gl.view': ['finance.gl.view', 'ACCOUNTING_VIEW', 'accounting.view'],
  'finance.gl.post': ['finance.gl.post', 'JOURNAL_POST'],
  'accounting.view': ['accounting.view', 'ACCOUNTING_VIEW'],
  'accounting.dashboard.view': ['accounting.dashboard.view', 'ACCOUNTING_DASHBOARD_VIEW'],
  'accounting.coa.view': ['accounting.coa.view', 'COA_VIEW'],
  'accounting.coa.manage': ['accounting.coa.manage', 'COA_CREATE', 'COA_EDIT'],
  'accounting.period.view': ['accounting.period.view', 'PERIOD_VIEW'],
  'accounting.period.manage': ['accounting.period.manage', 'PERIOD_OPEN', 'PERIOD_CLOSE', 'PERIOD_SOFT_CLOSE'],
  'accounting.journal.view': ['accounting.journal.view', 'JOURNAL_VIEW'],
  'accounting.journal.create': ['accounting.journal.create', 'JOURNAL_CREATE'],
  'accounting.journal.approve': ['accounting.journal.approve', 'JOURNAL_APPROVE'],
  'accounting.journal.post': ['accounting.journal.post', 'JOURNAL_POST'],
  'accounting.journal.reverse': ['accounting.journal.reverse', 'JOURNAL_REVERSE'],
  'accounting.trial_balance.view': ['accounting.trial_balance.view', 'TRIAL_BALANCE_VIEW'],
  'accounting.financial_statements.view': ['accounting.financial_statements.view', 'FINANCIAL_STATEMENTS_VIEW'],
  'accounting.receivables.view': ['accounting.receivables.view', 'RECEIVABLES_VIEW'],
  'accounting.payables.view': ['accounting.payables.view', 'PAYABLES_VIEW'],
  'accounting.payables.manage': ['accounting.payables.manage', 'PAYABLES_CREATE', 'PAYABLES_APPROVE'],
  'accounting.payables.approve': ['accounting.payables.approve', 'PAYABLES_APPROVE'],
  'accounting.accruals.view': ['accounting.accruals.view', 'ACCRUAL_VIEW'],
  'accounting.accruals.run': ['accounting.accruals.run', 'ACCRUAL_POST'],
  'accounting.tax.view': ['accounting.tax.view', 'TAX_VIEW'],
  'accounting.tax.manage': ['accounting.tax.manage', 'TAX_MANAGE'],
  'accounting.suspense.view': ['accounting.suspense.view', 'SUSPENSE_MANAGE'],
  'accounting.suspense.clear': ['accounting.suspense.clear', 'SUSPENSE_MANAGE'],

  // Risk & Fraud
  'risk.view': ['risk.view', 'RISK_VIEW_SIGNALS', 'VIEW_RISK_ASSESSMENT'],
  'risk.evaluate': ['risk.evaluate', 'RISK_EVALUATE'],
  'risk.manage_policies': ['risk.manage_policies', 'RISK_MANAGE_POLICIES'],
  'risk.override': ['risk.override', 'RISK_OVERRIDE'],
  'fraud.view_cases': ['fraud.view_cases', 'FRAUD_VIEW_CASES'],
  'fraud.investigate': ['fraud.investigate', 'FRAUD_INVESTIGATE'],
  'fraud.manage_rules': ['fraud.manage_rules', 'FRAUD_MANAGE_RULES'],
  'fraud.override': ['fraud.override', 'FRAUD_OVERRIDE'],

  // Communications & Support
  'communications.view': ['communications.view', 'COMMUNICATIONS_VIEW'],
  'communications.send': ['communications.send', 'COMMUNICATIONS_SEND'],
  'support.ticket.view': ['support.ticket.view', 'SUPPORT_VIEW'],
  'support.ticket.create': ['support.ticket.create', 'SUPPORT_TICKET_CREATE'],
  'support.ticket.assign': ['support.ticket.assign', 'SUPPORT_TICKET_ASSIGN'],
  'support.ticket.reply': ['support.ticket.reply', 'SUPPORT_TICKET_REPLY'],
  'support.ticket.resolve': ['support.ticket.resolve', 'SUPPORT_TICKET_RESOLVE'],
  'support.complaint.view': ['support.complaint.view', 'SUPPORT_COMPLAINT_VIEW'],
  'support.complaint.manage': ['support.complaint.manage', 'SUPPORT_COMPLAINT_MANAGE'],

  // Administration & Governance (Platform Control-Plane)
  'audit.view': ['audit.view', 'AUDIT_EXPORT_EVIDENCE_PACKAGE', 'AUDIT_VERIFY_CHAIN'],
  'audit.export': ['audit.export', 'AUDIT_EXPORT_EVIDENCE_PACKAGE'],
  'security.view': ['security.view', 'audit.view', 'AUDIT_VERIFY_CHAIN'],
  'configuration_history.view': ['configuration_history.view', 'audit.view', 'CONFIGURATION_VIEW_POLICIES'],
  'financial_control.view': ['financial_control.view', 'audit.view', 'ACCOUNTING_VIEW'],
  'workflow_history.view': ['workflow_history.view', 'audit.view', 'APPLICATIONS_VIEW'],
  'compliance.view': ['compliance.view', 'CONFIGURATION_VIEW_POLICIES'],
  'privacy.manage': ['privacy.manage', 'PRIVACY_PURGE_PII'],
  'privacy.view': ['privacy.view', 'PRIVACY_VIEW_CONSENT_REGISTRY'],
  
  // Tenant Management
  'tenant.view': ['tenant.view', 'TENANT_VIEW_OPERATIONS_CENTER'],
  'tenant.manage': ['tenant.manage', 'TENANT_MANAGE_USERS', 'TENANT_ASSIGN_ROLES'],
  'tenant.create': ['tenant.create', 'tenant.manage', 'TENANT_MANAGE_USERS'],
  'tenant.update': ['tenant.update', 'tenant.manage', 'TENANT_MANAGE_USERS'],
  'tenant.activate': ['tenant.activate', 'tenant.manage', 'TENANT_MANAGE_USERS'],
  'tenant.suspend': ['tenant.suspend', 'tenant.manage', 'TENANT_MANAGE_USERS'],
  'tenant.configure': ['tenant.configure', 'tenant.manage', 'TENANT_CONFIGURE_BRANDING'],

  // Branch Management
  'branch.view': ['branch.view', 'VIEW_BRANCH_APPLICATIONS'],
  'branch.manage': ['branch.manage', 'branch.view', 'VIEW_BRANCH_APPLICATIONS'],
  'branch.create': ['branch.create', 'branch.manage', 'VIEW_BRANCH_APPLICATIONS'],
  'branch.update': ['branch.update', 'branch.manage', 'VIEW_BRANCH_APPLICATIONS'],
  'branch.activate': ['branch.activate', 'branch.manage', 'VIEW_BRANCH_APPLICATIONS'],
  'branch.suspend': ['branch.suspend', 'branch.manage', 'VIEW_BRANCH_APPLICATIONS'],

  // User & Access Management
  'user.view': ['user.view', 'TENANT_MANAGE_USERS'],
  'user.manage': ['user.manage', 'TENANT_MANAGE_USERS'],
  'user.create': ['user.create', 'user.manage', 'TENANT_MANAGE_USERS'],
  'user.update': ['user.update', 'user.manage', 'TENANT_MANAGE_USERS'],
  'user.activate': ['user.activate', 'user.manage', 'TENANT_MANAGE_USERS'],
  'user.deactivate': ['user.deactivate', 'user.manage', 'TENANT_MANAGE_USERS'],
  'role.view': ['role.view', 'TENANT_ASSIGN_ROLES'],
  'role.manage': ['role.manage', 'TENANT_ASSIGN_ROLES'],
  'role.assign': ['role.assign', 'role.manage', 'TENANT_ASSIGN_ROLES'],
  'permission.view': ['permission.view', 'role.view', 'TENANT_ASSIGN_ROLES'],
  'access.review': ['access.review', 'role.view', 'TENANT_ASSIGN_ROLES'],

  // Product Management
  'product.view': ['product.view', 'CONFIGURATION_VIEW_POLICIES'],
  'product.manage': ['product.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'product.create': ['product.create', 'product.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'product.update': ['product.update', 'product.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'product.version': ['product.version', 'product.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'product.publish': ['product.publish', 'product.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'product.retire': ['product.retire', 'product.manage', 'CONFIGURATION_PUBLISH_POLICY'],

  // Policy Management
  'policy.view': ['policy.view', 'CONFIGURATION_VIEW_POLICIES'],
  'policy.manage': ['policy.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'policy.create': ['policy.create', 'policy.manage', 'CONFIGURATION_DRAFT_POLICY'],
  'policy.update': ['policy.update', 'policy.manage', 'CONFIGURATION_DRAFT_POLICY'],
  'policy.version': ['policy.version', 'policy.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'policy.publish': ['policy.publish', 'policy.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'policy.retire': ['policy.retire', 'policy.manage', 'CONFIGURATION_PUBLISH_POLICY'],

  // BRE Management
  'bre.view': ['bre.view', 'CONFIGURATION_VIEW_POLICIES'],
  'bre.configure': ['bre.configure', 'CONFIGURATION_PUBLISH_POLICY'],
  'bre.version': ['bre.version', 'CONFIGURATION_PUBLISH_POLICY'],
  'bre.publish': ['bre.publish', 'CONFIGURATION_PUBLISH_POLICY'],

  // Workflow Management
  'workflow.view': ['workflow.view', 'CONFIGURATION_VIEW_POLICIES'],
  'workflow.configure': ['workflow.configure', 'CONFIGURATION_PUBLISH_POLICY'],
  'workflow.version': ['workflow.version', 'CONFIGURATION_PUBLISH_POLICY'],
  'workflow.publish': ['workflow.publish', 'CONFIGURATION_PUBLISH_POLICY'],

  // Approval Configuration
  'approval.configure': ['approval.configure', 'CONFIGURATION_PUBLISH_POLICY'],
  'authority.view': ['authority.view', 'CONFIGURATION_VIEW_POLICIES'],
  'authority.configure': ['authority.configure', 'CONFIGURATION_PUBLISH_POLICY'],
  'deviation.view': ['deviation.view', 'CONFIGURATION_VIEW_POLICIES'],
  'deviation.configure': ['deviation.configure', 'CONFIGURATION_PUBLISH_POLICY'],

  // Integration Management
  'config.view': ['config.view', 'CONFIGURATION_VIEW_POLICIES'],
  'config.manage': ['config.manage', 'CONFIGURATION_PUBLISH_POLICY'],
  'integration.view': ['integration.view', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'integration.manage': ['integration.manage', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'integration.configure': ['integration.configure', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'integration.enable': ['integration.enable', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'integration.disable': ['integration.disable', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'webhook.view': ['webhook.view', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],
  'webhook.configure': ['webhook.configure', 'CONFIGURATION_CONFIGURE_INTEGRATIONS'],

  // Platform Operations
  'platform.health.view': ['platform.health.view', 'ANALYTICS_VIEW', 'ANALYTICS_COMMAND_CENTER'],
  'platform.jobs.view': ['platform.jobs.view', 'ANALYTICS_VIEW', 'ANALYTICS_COMMAND_CENTER'],
  'platform.queues.view': ['platform.queues.view', 'ANALYTICS_VIEW', 'ANALYTICS_COMMAND_CENTER'],
  'platform.alerts.view': ['platform.alerts.view', 'ANALYTICS_VIEW', 'ANALYTICS_COMMAND_CENTER'],
  'platform.feature_flags.view': ['platform.feature_flags.view', 'CONFIGURATION_VIEW_POLICIES'],
  'platform.feature_flags.manage': ['platform.feature_flags.manage', 'CONFIGURATION_PUBLISH_POLICY'],

  // Analytics & Reporting
  'analytics.view': ['analytics.view', 'ANALYTICS_VIEW'],
  'analytics.command_center': ['analytics.command_center', 'ANALYTICS_COMMAND_CENTER'],
  'reports.view': ['reports.view', 'REPORT_VIEW'],
  'reports.export': ['reports.export', 'REPORT_EXPORT'],

  // Partner & Ecosystem Domain (P7 Normalized)
  'partner.dashboard.view': ['partner.dashboard.view', 'partner.view'],
  'partner.users.view': ['partner.users.view', 'partner.view'],
  'partner.users.manage': ['partner.users.manage', 'partner.manage'],
  'partner.applications.create': ['partner.applications.create', 'partner.application.create', 'APPLICATIONS_CREATE'],
  'partner.applications.view': ['partner.applications.view', 'partner.application.read', 'partner.view'],
  'partner.applications.update': ['partner.applications.update', 'partner.application.update'],
  'partner.applications.submit': ['partner.applications.submit', 'partner.application.submit'],
  'partner.applications.documents.view': ['partner.applications.documents.view', 'partner.applications.view'],
  'partner.applications.documents.upload': ['partner.applications.documents.upload', 'partner.applications.update'],
  'partner.application.status.view': ['partner.application.status.view', 'partner.applications.view'],
  'partner.offers.view': ['partner.offers.view', 'partner.offer.read', 'offer.view'],
  'partner.offers.accept': ['partner.offers.accept', 'partner.offer.accept', 'offer.accept'],
  'partner.customers.view': ['partner.customers.view', 'partner.customer.read'],
  'partner.webhooks.view': ['partner.webhooks.view', 'partner.webhooks.manage', 'partner.webhook.manage'],
  'partner.webhooks.replay': ['partner.webhooks.replay', 'partner.webhooks.manage', 'partner.webhook.manage'],
  'partner.api_credentials.view': ['partner.api_credentials.view', 'partner.credentials.manage'],
  'partner.api_credentials.create': ['partner.api_credentials.create', 'partner.credentials.manage'],
  'partner.api_credentials.rotate': ['partner.api_credentials.rotate', 'partner.credentials.manage'],
  'partner.api_credentials.revoke': ['partner.api_credentials.revoke', 'partner.credentials.manage'],
  'partner.commissions.view': ['partner.commissions.view', 'partner.reports.view'],
  'partner.settlements.view': ['partner.settlements.view', 'partner.reports.view'],
  'partner.support.create': ['partner.support.create'],
  'partner.support.view': ['partner.support.view'],
  'partner.view': ['partner.view', 'partner.dashboard.view'],
  'partner.manage': ['partner.manage', 'partner.users.manage'],
  'partner.credentials.manage': ['partner.credentials.manage', 'partner.api_credentials.create'],
  'partner.webhooks.manage': ['partner.webhooks.manage', 'partner.webhooks.view'],
  'partner.reports.view': ['partner.reports.view', 'partner.commissions.view'],
};

export class RolePermissionService {
  private static instance: RolePermissionService;

  // Granular Permission Catalog
  private readonly permissions: PermissionDefinition[] = [
    // Applications
    { code: 'APPLICATIONS_CREATE', category: 'APPLICATIONS', name: 'Create Loan Application', description: 'Initiate and submit new borrower loan applications', riskLevel: 'LOW' },
    { code: 'APPLICATIONS_VIEW', category: 'APPLICATIONS', name: 'View Loan Applications', description: 'Read loan applications within authorized branch/tenant scope', riskLevel: 'LOW' },
    { code: 'APPLICATIONS_ASSIGN', category: 'APPLICATIONS', name: 'Assign Loan Application', description: 'Assign application to underwriters or field officers', riskLevel: 'MEDIUM' },
    { code: 'APPLICATIONS_REVIEW', category: 'APPLICATIONS', name: 'Review Application Data', description: 'Analyze applicant financials, bureau, and fraud signals', riskLevel: 'MEDIUM' },
    { code: 'APPLICATIONS_APPROVE', category: 'APPLICATIONS', name: 'Sanction Loan Application', description: 'Issue final credit sanction within sign-off limits', riskLevel: 'HIGH' },
    { code: 'APPLICATIONS_REJECT', category: 'APPLICATIONS', name: 'Reject Application', description: 'Formally reject application with adverse action notice', riskLevel: 'MEDIUM' },

    // Underwriting
    { code: 'UNDERWRITING_VIEW_BUREAU', category: 'UNDERWRITING', name: 'Pull & View Credit Bureau', description: 'View CIBIL/Experian reports and score factors', riskLevel: 'MEDIUM' },
    { code: 'UNDERWRITING_RUN_AI_ASSIST', category: 'UNDERWRITING', name: 'Run AI Underwriting Copilot', description: 'Invoke advisory AI underwriting synthesis', riskLevel: 'LOW' },
    { code: 'UNDERWRITING_APPROVE_EXCEPTION', category: 'UNDERWRITING', name: 'Approve Policy Exception', description: 'Authorize FOIR or risk score exception deviations', riskLevel: 'HIGH' },
    { code: 'UNDERWRITING_COMMITTEE_VOTE', category: 'UNDERWRITING', name: 'Credit Committee Vote', description: 'Cast vote in high-value loan approval committees', riskLevel: 'HIGH' },

    // Credit Assessment
    { code: 'CREDIT_ASSESSMENT_VIEW', category: 'APPLICATIONS', name: 'View Credit Assessment Desk', description: 'Access financial capacity, DTI, and FOIR records', riskLevel: 'LOW' },
    { code: 'CREDIT_ASSESSMENT_EVALUATE', category: 'APPLICATIONS', name: 'Evaluate Repayment Capacity', description: 'Verify income, calculate FOIR and assign risk grades', riskLevel: 'MEDIUM' },
    { code: 'CREDIT_ASSESSMENT_SUBMIT', category: 'APPLICATIONS', name: 'Submit Credit Recommendation', description: 'Record ELIGIBLE or NOT_ELIGIBLE recommendation with justification', riskLevel: 'MEDIUM' },
    { code: 'CREDIT_ASSESSMENT_FORWARD', category: 'APPLICATIONS', name: 'Forward Assessment to Underwriting', description: 'Forward completed assessment to Branch Manager or Underwriter', riskLevel: 'LOW' },

    // Branch Management
    { code: 'VIEW_BRANCH_APPLICATIONS', category: 'BRANCH_MANAGEMENT', name: 'View Branch Applications', description: 'View loan applications assigned to authorized branch', riskLevel: 'LOW' },
    { code: 'VIEW_CUSTOMER_DETAILS', category: 'BRANCH_MANAGEMENT', name: 'View Customer Details', description: 'Inspect borrower contact and demographic profile', riskLevel: 'LOW' },
    { code: 'VIEW_DOCUMENTS', category: 'BRANCH_MANAGEMENT', name: 'View Documents', description: 'View and preview submitted borrower KYC and financial documents', riskLevel: 'LOW' },
    { code: 'VIEW_CREDIT_ANALYST_REPORT', category: 'BRANCH_MANAGEMENT', name: 'View Credit Analyst Report', description: 'Inspect completed credit eligibility report and recommendation (read-only)', riskLevel: 'LOW' },
    { code: 'VIEW_RISK_ASSESSMENT', category: 'BRANCH_MANAGEMENT', name: 'View Risk Assessment', description: 'Inspect credit bureau score and 4-pillar risk assessment (read-only)', riskLevel: 'LOW' },
    { code: 'VIEW_REPAYMENT_ASSESSMENT', category: 'BRANCH_MANAGEMENT', name: 'View Repayment Assessment', description: 'Inspect borrower monthly income, liabilities, and FOIR calculation (read-only)', riskLevel: 'LOW' },
    { code: 'REVIEW_APPLICATION', category: 'BRANCH_MANAGEMENT', name: 'Review Application', description: 'Conduct branch-level management review of loan proposals', riskLevel: 'MEDIUM' },
    { code: 'APPROVE_WITHIN_DELEGATED_LIMIT', category: 'BRANCH_MANAGEMENT', name: 'Approve Within Delegated Limit', description: 'Record first-level management approval up to ₹5,00,000 threshold', riskLevel: 'HIGH' },
    { code: 'SEND_BACK_FOR_CORRECTION', category: 'BRANCH_MANAGEMENT', name: 'Send Back for Correction', description: 'Return proposal to Loan Officer or Credit Analyst for correction', riskLevel: 'MEDIUM' },
    { code: 'ESCALATE_TO_UNDERWRITER', category: 'BRANCH_MANAGEMENT', name: 'Escalate to Underwriter', description: 'Escalate high-value, high-risk, or policy-exception proposals to Underwriter', riskLevel: 'MEDIUM' },
    { code: 'ADD_MANAGER_REMARKS', category: 'BRANCH_MANAGEMENT', name: 'Add Manager Remarks', description: 'Record management review comments and notes in application history', riskLevel: 'LOW' },

    // Disbursements
    { code: 'DISBURSEMENTS_INITIATE_PAYOUT', category: 'DISBURSEMENTS', name: 'Initiate Payout Batch (Maker)', description: 'Create disbursement payment order to bank account', riskLevel: 'HIGH' },
    { code: 'DISBURSEMENTS_APPROVE_MAKER_CHECKER', category: 'DISBURSEMENTS', name: 'Approve Payout Batch (Checker)', description: 'Secondary authorization of disbursement batches', riskLevel: 'CRITICAL' },
    { code: 'DISBURSEMENTS_EXECUTE_TRANSFER', category: 'DISBURSEMENTS', name: 'Execute Fund Transfer Gateway', description: 'Trigger live IMPS/NEFT fund transfer via Cashfree/RazorpayX', riskLevel: 'CRITICAL' },
    { code: 'DISBURSEMENTS_RECONCILE', category: 'DISBURSEMENTS', name: 'Reconcile Bank Payouts', description: 'Match settlement statements against ledger balances', riskLevel: 'MEDIUM' },

    // Collections & Recovery (Phase 11)
    { code: 'COLLECTIONS_VIEW_DPD', category: 'COLLECTIONS', name: 'View Overdue & DPD Portfolios', description: 'Monitor delinquency aging and default queues', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_ASSIGN', category: 'COLLECTIONS', name: 'Assign Collection Cases', description: 'Assign or reassign delinquent cases to collectors or agencies', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_CONTACT', category: 'COLLECTIONS', name: 'Log Customer Contact Activity', description: 'Record phone calls, notices, SMS outreach, and field visits', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_RECORD_PTP', category: 'COLLECTIONS', name: 'Record Promise-to-Pay', description: 'Log borrower repayment commitments and interaction notes', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_UPDATE_PTP', category: 'COLLECTIONS', name: 'Update / Cancel PTP', description: 'Modify or cancel active promise to pay records', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_ESCALATE', category: 'COLLECTIONS', name: 'Escalate Delinquent Case', description: 'Escalate collection cases to supervisory or legal recovery tiers', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_INITIATE_RECOVERY', category: 'COLLECTIONS', name: 'Initiate Legal / Field Recovery', description: 'Trigger legal notices and assign field recovery agents', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_WAIVE_PENALTY', category: 'COLLECTIONS', name: 'Waive Overdue Charges & Penalty', description: 'Authorize penalty interest fee waivers', riskLevel: 'HIGH' },
    { code: 'COLLECTIONS_SETTLE_LOAN', category: 'COLLECTIONS', name: 'Authorize One-Time Settlement (OTS)', description: 'Execute principal write-off and debt settlement agreements', riskLevel: 'CRITICAL' },
    { code: 'COLLECTIONS_SETTLEMENT_REQUEST', category: 'COLLECTIONS', name: 'Request Debt Settlement (Maker)', description: 'Propose loan debt settlement and discount waivers', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_SETTLEMENT_APPROVE', category: 'COLLECTIONS', name: 'Approve Debt Settlement (Checker)', description: 'Authoritative sign-off on debt settlement and waiver amounts', riskLevel: 'CRITICAL' },
    { code: 'COLLECTIONS_WRITEOFF_REQUEST', category: 'COLLECTIONS', name: 'Request Bad Debt Write-Off (Maker)', description: 'Propose write-off for unrecoverable delinquent balances', riskLevel: 'HIGH' },
    { code: 'COLLECTIONS_WRITEOFF_APPROVE', category: 'COLLECTIONS', name: 'Approve Bad Debt Write-Off (Checker)', description: 'Credit committee authorization of loan balance write-offs', riskLevel: 'CRITICAL' },
    { code: 'COLLECTIONS_POLICY_VIEW', category: 'COLLECTIONS', name: 'View Collection Strategies & Policies', description: 'Inspect active and historical collection policy versions', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_POLICY_MANAGE', category: 'COLLECTIONS', name: 'Manage Collection Strategies & Rules', description: 'Create, update, version and activate collection strategies', riskLevel: 'HIGH' },
    { code: 'COLLECTIONS_ANALYTICS_VIEW', category: 'COLLECTIONS', name: 'View Collection Analytics & Dashboards', description: 'Access portfolio delinquency, roll-forward, and collector metrics', riskLevel: 'LOW' },

    // Configuration
    { code: 'CONFIGURATION_VIEW_POLICIES', category: 'CONFIGURATION', name: 'View Lending Policies', description: 'Read active FOIR, interest, and credit policies', riskLevel: 'LOW' },
    { code: 'CONFIGURATION_DRAFT_POLICY', category: 'CONFIGURATION', name: 'Draft Lending Policy', description: 'Create draft policy versions without activating', riskLevel: 'MEDIUM' },
    { code: 'CONFIGURATION_PUBLISH_POLICY', category: 'CONFIGURATION', name: 'Publish Institutional Policy', description: 'Activate new underwriting parameters across institution', riskLevel: 'HIGH' },
    { code: 'CONFIGURATION_CONFIGURE_INTEGRATIONS', category: 'CONFIGURATION', name: 'Configure Integration Gateways', description: 'Update API keys, endpoints, and failover routes', riskLevel: 'HIGH' },

    // Privacy & Audit
    { code: 'PRIVACY_VIEW_CONSENT_REGISTRY', category: 'PRIVACY_AUDIT', name: 'View Statutory Consent Registry', description: 'Inspect borrower DPDP consent artifacts and versions', riskLevel: 'LOW' },
    { code: 'AUDIT_EXPORT_EVIDENCE_PACKAGE', category: 'PRIVACY_AUDIT', name: 'Export Institutional Evidence Package', description: 'Download chronological execution logs and audit packages', riskLevel: 'HIGH' },
    { code: 'AUDIT_VERIFY_CHAIN', category: 'PRIVACY_AUDIT', name: 'Verify Cryptographic Audit Chain', description: 'Execute continuous SHA-256 ledger tamper verification', riskLevel: 'LOW' },
    { code: 'PRIVACY_PURGE_PII', category: 'PRIVACY_AUDIT', name: 'Execute Statutory PII Erasure', description: 'Execute right to be forgotten under DPDP statutory rules', riskLevel: 'CRITICAL' },

    // Tenant Administration
    { code: 'TENANT_MANAGE_USERS', category: 'TENANT_ADMIN', name: 'Manage Staff Users', description: 'Create, update, and deactivate lender employee accounts', riskLevel: 'HIGH' },
    { code: 'TENANT_ASSIGN_ROLES', category: 'TENANT_ADMIN', name: 'Assign User Roles', description: 'Grant custom roles and scopes to employees', riskLevel: 'HIGH' },
    { code: 'TENANT_VIEW_OPERATIONS_CENTER', category: 'TENANT_ADMIN', name: 'View Tenant Operations Center', description: 'Access enterprise portfolio health and quotas', riskLevel: 'MEDIUM' },
    { code: 'TENANT_CONFIGURE_BRANDING', category: 'TENANT_ADMIN', name: 'Configure White-Label Portal', description: 'Update institution logo, brand colors, and portal domain', riskLevel: 'MEDIUM' },

    // Risk Governance (Phase 9)
    { code: 'RISK_VIEW_SIGNALS', category: 'RISK_GOVERNANCE', name: 'View Risk Signals & Profiles', description: 'Inspect borrower 6-pillar risk signals, scores, and bands', riskLevel: 'LOW' },
    { code: 'RISK_EVALUATE', category: 'RISK_GOVERNANCE', name: 'Execute Risk Evaluation', description: 'Trigger deterministic risk engine assessment and re-evaluations', riskLevel: 'MEDIUM' },
    { code: 'RISK_MANAGE_POLICIES', category: 'RISK_GOVERNANCE', name: 'Manage Risk Policies', description: 'Draft, configure weights, and publish institutional risk policies', riskLevel: 'HIGH' },
    { code: 'RISK_OVERRIDE', category: 'RISK_GOVERNANCE', name: 'Override Risk Score & Grade', description: 'Record audited manual risk score overrides with mandatory justification', riskLevel: 'CRITICAL' },

    // Fraud Operations & Investigation (Phase 9)
    { code: 'FRAUD_VIEW_CASES', category: 'FRAUD_OPS', name: 'View Fraud Queue & Cases', description: 'Inspect anomaly signals, device fingerprints, and identity graph', riskLevel: 'LOW' },
    { code: 'FRAUD_INVESTIGATE', category: 'FRAUD_OPS', name: 'Investigate Fraud Cases', description: 'Assign, escalate, add evidence, and update fraud case statuses', riskLevel: 'MEDIUM' },
    { code: 'FRAUD_MANAGE_RULES', category: 'FRAUD_OPS', name: 'Configure Fraud Rules', description: 'Create, version, activate and deactivate fraud detection rules', riskLevel: 'HIGH' },
    { code: 'FRAUD_OVERRIDE', category: 'FRAUD_OPS', name: 'Override Fraud Outcome', description: 'Manually clear or block fraud outcomes with mandatory audit justification', riskLevel: 'CRITICAL' },

    // Payments, Reconciliation & Settlement (Phase 10)
    { code: 'PAYMENTS_VIEW', category: 'PAYMENTS_SETTLEMENTS', name: 'View Payments Ledger', description: 'Inspect borrower repayment transactions, allocation breakdowns, and receipts', riskLevel: 'LOW' },
    { code: 'PAYMENTS_CREATE', category: 'PAYMENTS_SETTLEMENTS', name: 'Initiate Repayment Transaction', description: 'Record manual offline or initiate gateway borrower repayments', riskLevel: 'MEDIUM' },
    { code: 'PAYMENTS_CONFIRM', category: 'PAYMENTS_SETTLEMENTS', name: 'Confirm & Allocate Payment', description: 'Confirm settlement and trigger waterfall allocation against loan schedules', riskLevel: 'HIGH' },
    { code: 'PAYMENTS_REFUND', category: 'PAYMENTS_SETTLEMENTS', name: 'Authorize Payment Refund', description: 'Authorize full or partial refund of customer excess deposits or erroneous payments', riskLevel: 'CRITICAL' },
    { code: 'PAYMENTS_REVERSE', category: 'PAYMENTS_SETTLEMENTS', name: 'Execute Payment Reversal', description: 'Execute audited payment reversal with compensating double-entry GL entries', riskLevel: 'CRITICAL' },
    { code: 'PAYOUTS_VIEW', category: 'PAYMENTS_SETTLEMENTS', name: 'View Disbursement Payouts', description: 'View loan disbursement payout transactions and UTR reference tracking', riskLevel: 'LOW' },
    { code: 'PAYOUTS_INITIATE', category: 'PAYMENTS_SETTLEMENTS', name: 'Initiate Disbursement Payout', description: 'Stage-gated initiation of loan fund transfer to borrower bank account', riskLevel: 'HIGH' },
    { code: 'PAYOUTS_APPROVE', category: 'PAYMENTS_SETTLEMENTS', name: 'Approve Disbursement Payout', description: 'Secondary authorization of high-value payout batches (Checker)', riskLevel: 'CRITICAL' },
    { code: 'RECONCILIATION_VIEW', category: 'PAYMENTS_SETTLEMENTS', name: 'View Reconciliation Queue', description: 'Inspect tri-party match queues, amount variances, and duplicate flags', riskLevel: 'LOW' },
    { code: 'RECONCILIATION_RESOLVE', category: 'PAYMENTS_SETTLEMENTS', name: 'Resolve Reconciliation Discrepancy', description: 'Execute manual matching, adjustments, and reconciliation exception resolutions', riskLevel: 'HIGH' },
    { code: 'SETTLEMENTS_VIEW', category: 'PAYMENTS_SETTLEMENTS', name: 'View Gateway Settlements', description: 'Inspect provider settlement batches, gross fees, and GST tax breakdowns', riskLevel: 'LOW' },
    { code: 'SETTLEMENTS_RECONCILE', category: 'PAYMENTS_SETTLEMENTS', name: 'Reconcile Settlement Batch', description: 'Reconcile gateway net credits against nodal bank account ledger balance', riskLevel: 'HIGH' },

    // Accounting & Financial Operations (Phase 12)
    { code: 'ACCOUNTING_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Accounting Hub', description: 'Access financial operations, accounting dashboard, and ledger summaries', riskLevel: 'LOW' },
    { code: 'ACCOUNTING_DASHBOARD_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Finance Dashboard', description: 'Access executive financial health, liquidity, and profitability KPIs', riskLevel: 'LOW' },
    { code: 'COA_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Chart of Accounts', description: 'Inspect standard and custom chart of accounts hierarchy and categories', riskLevel: 'LOW' },
    { code: 'COA_CREATE', category: 'ACCOUNTING_FINANCE', name: 'Create GL Account', description: 'Create new custom asset, liability, revenue, or expense accounts', riskLevel: 'MEDIUM' },
    { code: 'COA_EDIT', category: 'ACCOUNTING_FINANCE', name: 'Edit GL Account', description: 'Update non-system account descriptions and sub-categories', riskLevel: 'MEDIUM' },
    { code: 'COA_ACTIVATE', category: 'ACCOUNTING_FINANCE', name: 'Activate GL Account', description: 'Activate deactivated chart of accounts codes', riskLevel: 'MEDIUM' },
    { code: 'COA_ARCHIVE', category: 'ACCOUNTING_FINANCE', name: 'Archive GL Account', description: 'Deactivate non-system GL accounts', riskLevel: 'HIGH' },
    { code: 'JOURNAL_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Journals', description: 'Inspect manual and system-generated accounting journal entries', riskLevel: 'LOW' },
    { code: 'JOURNAL_CREATE', category: 'ACCOUNTING_FINANCE', name: 'Create Manual Journal (Maker)', description: 'Draft and propose multi-line manual accounting journals', riskLevel: 'MEDIUM' },
    { code: 'JOURNAL_EDIT', category: 'ACCOUNTING_FINANCE', name: 'Edit Draft Journal', description: 'Modify draft journal lines prior to submission', riskLevel: 'LOW' },
    { code: 'JOURNAL_SUBMIT', category: 'ACCOUNTING_FINANCE', name: 'Submit Journal for Approval', description: 'Submit drafted manual journal to credit/finance checker queue', riskLevel: 'LOW' },
    { code: 'JOURNAL_APPROVE', category: 'ACCOUNTING_FINANCE', name: 'Approve Manual Journal (Checker)', description: 'Authorize proposed manual journal entry under maker-checker controls', riskLevel: 'CRITICAL' },
    { code: 'JOURNAL_POST', category: 'ACCOUNTING_FINANCE', name: 'Post Journal to General Ledger', description: 'Commit approved manual journal to double-entry general ledger', riskLevel: 'CRITICAL' },
    { code: 'JOURNAL_REJECT', category: 'ACCOUNTING_FINANCE', name: 'Reject Manual Journal', description: 'Decline proposed manual journal entry with remarks', riskLevel: 'MEDIUM' },
    { code: 'JOURNAL_REVERSE', category: 'ACCOUNTING_FINANCE', name: 'Reverse Posted Journal', description: 'Create compensating reversal journal for committed general ledger entries', riskLevel: 'CRITICAL' },
    { code: 'PERIOD_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Accounting Periods', description: 'Inspect status, dates, and checklists of fiscal periods', riskLevel: 'LOW' },
    { code: 'PERIOD_OPEN', category: 'ACCOUNTING_FINANCE', name: 'Open Accounting Period', description: 'Initialize new monthly or quarterly financial period', riskLevel: 'MEDIUM' },
    { code: 'PERIOD_SOFT_CLOSE', category: 'ACCOUNTING_FINANCE', name: 'Soft-Close Accounting Period', description: 'Restrict non-adjustment postings during period-end closing', riskLevel: 'HIGH' },
    { code: 'PERIOD_CLOSE', category: 'ACCOUNTING_FINANCE', name: 'Hard-Close Accounting Period', description: 'Formally close financial period upon checklist validation', riskLevel: 'CRITICAL' },
    { code: 'PERIOD_REOPEN', category: 'ACCOUNTING_FINANCE', name: 'Reopen Closed Period', description: 'Reopen closed period with mandatory audited justification', riskLevel: 'CRITICAL' },
    { code: 'TRIAL_BALANCE_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Trial Balance', description: 'Access live and comparative double-entry trial balance reports', riskLevel: 'LOW' },
    { code: 'FINANCIAL_STATEMENTS_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Financial Statements', description: 'Generate Profit & Loss (P&L) and Balance Sheet reports', riskLevel: 'LOW' },
    { code: 'CASH_FLOW_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Cash Flow Statement', description: 'Inspect operating, investing, and financing cash movements', riskLevel: 'LOW' },
    { code: 'RECEIVABLES_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Receivables & Aging', description: 'Monitor principal, interest, fees, and overdue receivables waterfall', riskLevel: 'LOW' },
    { code: 'PAYABLES_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Accounts Payable', description: 'Track partner commissions, vendor invoices, and tax liabilities', riskLevel: 'LOW' },
    { code: 'PAYABLES_CREATE', category: 'ACCOUNTING_FINANCE', name: 'Create Payable (Maker)', description: 'Draft and propose partner commission or vendor payables', riskLevel: 'MEDIUM' },
    { code: 'PAYABLES_APPROVE', category: 'ACCOUNTING_FINANCE', name: 'Approve Payable (Checker)', description: 'Authorize payable for disbursement settlement', riskLevel: 'HIGH' },
    { code: 'PAYABLES_PAY', category: 'ACCOUNTING_FINANCE', name: 'Execute Payable Payout', description: 'Trigger bank payout for approved accounts payable', riskLevel: 'CRITICAL' },
    { code: 'ACCRUAL_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Accruals', description: 'Inspect daily interest and periodic expense accrual schedules', riskLevel: 'LOW' },
    { code: 'ACCRUAL_CREATE', category: 'ACCOUNTING_FINANCE', name: 'Create Accrual Entry (Maker)', description: 'Propose periodic interest or expense accrual adjustments', riskLevel: 'MEDIUM' },
    { code: 'ACCRUAL_APPROVE', category: 'ACCOUNTING_FINANCE', name: 'Approve Accrual Entry (Checker)', description: 'Authorize accrual entries for general ledger posting', riskLevel: 'HIGH' },
    { code: 'ACCRUAL_POST', category: 'ACCOUNTING_FINANCE', name: 'Post Accruals', description: 'Execute automated daily or monthly accrual journal posting', riskLevel: 'HIGH' },
    { code: 'ACCRUAL_REVERSE', category: 'ACCOUNTING_FINANCE', name: 'Reverse Accrual', description: 'Trigger beginning-of-period automatic accrual reversals', riskLevel: 'MEDIUM' },
    { code: 'TAX_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Tax Accounting', description: 'Inspect GST input, output, CGST, SGST, IGST liabilities', riskLevel: 'LOW' },
    { code: 'TAX_MANAGE', category: 'ACCOUNTING_FINANCE', name: 'Manage Tax Rates & Rules', description: 'Configure GST rates and tax rule effective dates', riskLevel: 'HIGH' },
    { code: 'TAX_REPORT', category: 'ACCOUNTING_FINANCE', name: 'Generate Tax Reports', description: 'Export periodic GST liability and compliance summaries', riskLevel: 'LOW' },
    { code: 'SUSPENSE_MANAGE', category: 'ACCOUNTING_FINANCE', name: 'Manage Suspense Accounts', description: 'Investigate unallocated balances and post resolution adjustments', riskLevel: 'HIGH' },
    { code: 'FINANCE_CONTROLS_VIEW', category: 'ACCOUNTING_FINANCE', name: 'View Finance Control Center', description: 'Access reconciliation exception desks and suspense aging', riskLevel: 'LOW' },

    // Communications, Notifications & Customer Support (Phase 13)
    { code: 'COMMUNICATIONS_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Communication Hub', description: 'Access communication overview, message logs, and channel health', riskLevel: 'LOW' },
    { code: 'COMMUNICATIONS_SEND', category: 'COMMUNICATIONS_SUPPORT', name: 'Send Direct Communication', description: 'Trigger manual SMS, email, or WhatsApp customer outreach', riskLevel: 'MEDIUM' },
    { code: 'COMMUNICATIONS_TEMPLATE_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Communication Templates', description: 'Inspect system and tenant message templates across channels', riskLevel: 'LOW' },
    { code: 'COMMUNICATIONS_TEMPLATE_CREATE', category: 'COMMUNICATIONS_SUPPORT', name: 'Create Communication Template', description: 'Draft new message templates with DLT and variable schemas', riskLevel: 'MEDIUM' },
    { code: 'COMMUNICATIONS_TEMPLATE_EDIT', category: 'COMMUNICATIONS_SUPPORT', name: 'Edit Communication Template', description: 'Modify and version existing communication templates', riskLevel: 'MEDIUM' },
    { code: 'COMMUNICATIONS_TEMPLATE_ACTIVATE', category: 'COMMUNICATIONS_SUPPORT', name: 'Activate Template', description: 'Publish template version into production active routing', riskLevel: 'HIGH' },
    { code: 'COMMUNICATIONS_POLICY_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Routing Policies', description: 'Inspect event routing rules, quiet hours, and channel fallbacks', riskLevel: 'LOW' },
    { code: 'COMMUNICATIONS_POLICY_CREATE', category: 'COMMUNICATIONS_SUPPORT', name: 'Create Routing Policy', description: 'Create event channel routing policies and retry rules', riskLevel: 'MEDIUM' },
    { code: 'COMMUNICATIONS_POLICY_EDIT', category: 'COMMUNICATIONS_SUPPORT', name: 'Edit Routing Policy', description: 'Update quiet hours, debounce windows, and retry limits', riskLevel: 'HIGH' },
    { code: 'COMMUNICATIONS_DELIVERY_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Delivery Outbox', description: 'Inspect message delivery statuses, external IDs, and error reasons', riskLevel: 'LOW' },
    { code: 'COMMUNICATIONS_PREFERENCE_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Customer Preferences', description: 'Inspect borrower channel opt-in/opt-out configurations', riskLevel: 'LOW' },
    { code: 'COMMUNICATIONS_PREFERENCE_MANAGE', category: 'COMMUNICATIONS_SUPPORT', name: 'Manage Customer Preferences', description: 'Update borrower channel settings and quiet hours preferences', riskLevel: 'MEDIUM' },
    { code: 'SUPPORT_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Support Operations', description: 'Access support desk, tickets queue, and SLA dashboards', riskLevel: 'LOW' },
    { code: 'SUPPORT_TICKET_CREATE', category: 'COMMUNICATIONS_SUPPORT', name: 'Create Support Ticket', description: 'Open new customer support ticket or inquiry', riskLevel: 'LOW' },
    { code: 'SUPPORT_TICKET_ASSIGN', category: 'COMMUNICATIONS_SUPPORT', name: 'Assign Support Ticket', description: 'Assign support ticket to customer service agent or team', riskLevel: 'LOW' },
    { code: 'SUPPORT_TICKET_REPLY', category: 'COMMUNICATIONS_SUPPORT', name: 'Reply to Support Ticket', description: 'Send public customer message or add internal staff note', riskLevel: 'LOW' },
    { code: 'SUPPORT_TICKET_RESOLVE', category: 'COMMUNICATIONS_SUPPORT', name: 'Resolve Support Ticket', description: 'Close and resolve support ticket with customer feedback', riskLevel: 'MEDIUM' },
    { code: 'SUPPORT_TICKET_REOPEN', category: 'COMMUNICATIONS_SUPPORT', name: 'Reopen Support Ticket', description: 'Reopen previously closed or resolved support ticket', riskLevel: 'MEDIUM' },
    { code: 'SUPPORT_TICKET_ESCALATE', category: 'COMMUNICATIONS_SUPPORT', name: 'Escalate Support Ticket', description: 'Escalate ticket to supervisory, nodal, or grievance tier', riskLevel: 'HIGH' },
    { code: 'SUPPORT_COMPLAINT_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Grievance Complaints', description: 'Inspect RBI regulatory complaints register and details', riskLevel: 'LOW' },
    { code: 'SUPPORT_COMPLAINT_MANAGE', category: 'COMMUNICATIONS_SUPPORT', name: 'Manage Grievance Complaints', description: 'Investigate, resolve, or award concessions on grievance cases', riskLevel: 'HIGH' },
    { code: 'SUPPORT_REPORTS_VIEW', category: 'COMMUNICATIONS_SUPPORT', name: 'View Support Analytics', description: 'Access SLA compliance, response times, and CSAT metrics', riskLevel: 'LOW' },

    // Analytics, MIS & Enterprise Command Center (Phase 14)
    { code: 'ANALYTICS_VIEW', category: 'ANALYTICS_MIS', name: 'View Analytics Hub', description: 'Access centralized analytics dashboards and high-level KPI trends', riskLevel: 'LOW' },
    { code: 'ANALYTICS_PORTFOLIO', category: 'ANALYTICS_MIS', name: 'View Portfolio Analytics', description: 'Inspect active portfolio, exposure, vintage, and aging metrics', riskLevel: 'LOW' },
    { code: 'ANALYTICS_CREDIT', category: 'ANALYTICS_MIS', name: 'View Credit & BRE Analytics', description: 'Inspect decision engine rule execution, rejection reasons, and approval rates', riskLevel: 'LOW' },
    { code: 'ANALYTICS_RISK', category: 'ANALYTICS_MIS', name: 'View Risk Analytics', description: 'Inspect portfolio risk grade distribution and risk vs delinquency correlation', riskLevel: 'LOW' },
    { code: 'ANALYTICS_FRAUD', category: 'ANALYTICS_MIS', name: 'View Fraud Analytics', description: 'Inspect fraud signal volume, syndicate clustering, and case resolution rates', riskLevel: 'LOW' },
    { code: 'ANALYTICS_COLLECTIONS', category: 'ANALYTICS_MIS', name: 'View Collections & Recovery Analytics', description: 'Inspect DPD migration, roll rates, collector scorecards, and recovery metrics', riskLevel: 'LOW' },
    { code: 'ANALYTICS_FINANCE', category: 'ANALYTICS_MIS', name: 'View Financial & Accounting Analytics', description: 'Inspect management-level cash flow, fee income, P&L, and GL ledger telemetry', riskLevel: 'MEDIUM' },
    { code: 'ANALYTICS_PARTNERS', category: 'ANALYTICS_MIS', name: 'View Partner Performance Analytics', description: 'Inspect partner sourcing, approval rates, and commission payouts', riskLevel: 'LOW' },
    { code: 'ANALYTICS_BRANCHES', category: 'ANALYTICS_MIS', name: 'View Branch Performance Analytics', description: 'Inspect branch turnaround times, disbursements, and staff productivity', riskLevel: 'LOW' },
    { code: 'ANALYTICS_PRODUCTS', category: 'ANALYTICS_MIS', name: 'View Product Analytics', description: 'Inspect loan product performance, conversion rates, and portfolio profitability', riskLevel: 'LOW' },
    { code: 'ANALYTICS_OPERATIONS', category: 'ANALYTICS_MIS', name: 'View Operational SLA Analytics', description: 'Inspect bottleneck stages, SLA breaches, and workflow cycle times', riskLevel: 'LOW' },
    { code: 'ANALYTICS_SUPPORT', category: 'ANALYTICS_MIS', name: 'View Customer Support Analytics', description: 'Inspect ticket categories, resolution times, and customer grievances', riskLevel: 'LOW' },
    { code: 'ANALYTICS_COMMAND_CENTER', category: 'ANALYTICS_MIS', name: 'View Executive Command Center', description: 'Access real-time executive command cockpit and natural language query processor', riskLevel: 'HIGH' },
    { code: 'REPORT_VIEW', category: 'ANALYTICS_MIS', name: 'View Reports & MIS', description: 'Access saved reports, MIS report catalog, and standard queries', riskLevel: 'LOW' },
    { code: 'REPORT_CREATE', category: 'ANALYTICS_MIS', name: 'Create Custom Reports', description: 'Build and save custom report queries using approved dimensions and metrics', riskLevel: 'MEDIUM' },
    { code: 'REPORT_EDIT', category: 'ANALYTICS_MIS', name: 'Edit Saved Reports', description: 'Modify report filters, metric selections, and visual layout configuration', riskLevel: 'MEDIUM' },
    { code: 'REPORT_EXECUTE', category: 'ANALYTICS_MIS', name: 'Execute On-Demand Reports', description: 'Run on-demand parameterized queries against reporting layer', riskLevel: 'LOW' },
    { code: 'REPORT_EXPORT', category: 'ANALYTICS_MIS', name: 'Export Reporting Data', description: 'Download CSV and Excel-compatible report outputs with PII masking', riskLevel: 'HIGH' },
    { code: 'REPORT_SHARE', category: 'ANALYTICS_MIS', name: 'Share Reports', description: 'Publish and share custom report configurations with team or tenant', riskLevel: 'MEDIUM' },
    { code: 'DASHBOARD_VIEW', category: 'ANALYTICS_MIS', name: 'View Configured Dashboards', description: 'Access user-customized analytics widgets and dashboard views', riskLevel: 'LOW' },
    { code: 'DASHBOARD_CONFIGURE', category: 'ANALYTICS_MIS', name: 'Configure Dashboard Widgets', description: 'Add, remove, reorder, and customize analytics dashboard widgets', riskLevel: 'MEDIUM' },

    // Partner & Ecosystem (Phase P7 Normalized)
    { code: 'partner.dashboard.view', category: 'PARTNER_ECOSYSTEM', name: 'View Partner Dashboard', description: 'Access partner workspace overview, pipelines, and summary telemetry', riskLevel: 'LOW' },
    { code: 'partner.users.view', category: 'PARTNER_ECOSYSTEM', name: 'View Partner Users', description: 'List partner organization internal team members', riskLevel: 'LOW' },
    { code: 'partner.users.manage', category: 'PARTNER_ECOSYSTEM', name: 'Manage Partner Users', description: 'Create and assign roles to partner team members', riskLevel: 'MEDIUM' },
    { code: 'partner.applications.create', category: 'PARTNER_ECOSYSTEM', name: 'Originate Partner Application', description: 'Create new partner-sourced loan application', riskLevel: 'LOW' },
    { code: 'partner.applications.view', category: 'PARTNER_ECOSYSTEM', name: 'View Partner Applications', description: 'Access partner-assigned loan application pipeline', riskLevel: 'LOW' },
    { code: 'partner.applications.update', category: 'PARTNER_ECOSYSTEM', name: 'Update Draft Application', description: 'Modify draft loan terms and applicant parameters', riskLevel: 'LOW' },
    { code: 'partner.applications.submit', category: 'PARTNER_ECOSYSTEM', name: 'Submit Partner Application', description: 'Formally submit completed partner application to decision engine', riskLevel: 'MEDIUM' },
    { code: 'partner.applications.documents.view', category: 'PARTNER_ECOSYSTEM', name: 'View Required Documents', description: 'Inspect required checklist and document status', riskLevel: 'LOW' },
    { code: 'partner.applications.documents.upload', category: 'PARTNER_ECOSYSTEM', name: 'Upload Partner Document', description: 'Upload KYC or income document for applicant', riskLevel: 'LOW' },
    { code: 'partner.application.status.view', category: 'PARTNER_ECOSYSTEM', name: 'View Application Status', description: 'Inspect sanitized partner-safe status timeline', riskLevel: 'LOW' },
    { code: 'partner.offers.view', category: 'PARTNER_ECOSYSTEM', name: 'View Loan Offer & KFS', description: 'Inspect approved offer terms and statutory Key Fact Statement', riskLevel: 'LOW' },
    { code: 'partner.offers.accept', category: 'PARTNER_ECOSYSTEM', name: 'Accept Loan Offer', description: 'Record partner-assisted borrower offer acceptance with KFS acknowledgment', riskLevel: 'MEDIUM' },
    { code: 'partner.customers.view', category: 'PARTNER_ECOSYSTEM', name: 'View Partner Customers', description: 'Inspect masked applicant identity and contact data', riskLevel: 'LOW' },
    { code: 'partner.webhooks.view', category: 'PARTNER_ECOSYSTEM', name: 'View Webhook Deliveries', description: 'Inspect webhook subscriptions and delivery attempt logs', riskLevel: 'LOW' },
    { code: 'partner.webhooks.replay', category: 'PARTNER_ECOSYSTEM', name: 'Replay Webhook Event', description: 'Trigger replay of authorized webhook delivery', riskLevel: 'MEDIUM' },
    { code: 'partner.api_credentials.view', category: 'PARTNER_ECOSYSTEM', name: 'View API Credentials', description: 'Inspect API client IDs, key prefixes, and scopes', riskLevel: 'LOW' },
    { code: 'partner.api_credentials.create', category: 'PARTNER_ECOSYSTEM', name: 'Generate API Credential', description: 'Issue new scoped partner API keys and secrets', riskLevel: 'HIGH' },
    { code: 'partner.api_credentials.rotate', category: 'PARTNER_ECOSYSTEM', name: 'Rotate API Secret', description: 'Rotate HMAC client secret for partner API credential', riskLevel: 'HIGH' },
    { code: 'partner.api_credentials.revoke', category: 'PARTNER_ECOSYSTEM', name: 'Revoke API Credential', description: 'Deactivate and revoke active partner API credential', riskLevel: 'HIGH' },
    { code: 'partner.commissions.view', category: 'PARTNER_ECOSYSTEM', name: 'View Commission Statements', description: 'Inspect partner sourcing fees, disbursement commissions, and ledger balances', riskLevel: 'LOW' },
    { code: 'partner.settlements.view', category: 'PARTNER_ECOSYSTEM', name: 'View Settlements', description: 'Inspect partner settlement summaries and payout batch references', riskLevel: 'LOW' },
    { code: 'partner.support.create', category: 'PARTNER_ECOSYSTEM', name: 'Create Partner Support Ticket', description: 'Open support case for partner operational or technical inquiries', riskLevel: 'LOW' },
    { code: 'partner.support.view', category: 'PARTNER_ECOSYSTEM', name: 'View Partner Support Tickets', description: 'Track status and replies on partner support tickets', riskLevel: 'LOW' },
  ];

  // Banking Segregation of Duties (SoD) Rules
  private readonly sodRules: SodRule[] = [
    {
      id: 'sod-01',
      code: 'SOD_MAKER_CHECKER_PAYOUT',
      name: 'Disbursement Maker-Checker Separation',
      description: 'A single user cannot both initiate a payout batch and approve/sign off on that batch.',
      conflictingPermissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-02',
      code: 'SOD_SANCTION_DISBURSER',
      name: 'Credit Sanction vs Fund Execution Separation',
      description: 'Underwriters who approve loan sanctions cannot directly execute gateway fund transfers.',
      conflictingPermissions: ['APPLICATIONS_APPROVE', 'DISBURSEMENTS_EXECUTE_TRANSFER'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-03',
      code: 'SOD_AUDITOR_POLICY_MAKER',
      name: 'Independent Auditor vs Policy Publisher Separation',
      description: 'Internal and external compliance auditors cannot publish credit policies.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'CONFIGURATION_PUBLISH_POLICY'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-04',
      code: 'SOD_AUDITOR_DISBURSER',
      name: 'Independent Auditor vs Payout Operator Separation',
      description: 'Auditors verifying the cryptographic audit chain cannot originate disbursements.',
      conflictingPermissions: ['AUDIT_VERIFY_CHAIN', 'DISBURSEMENTS_INITIATE_PAYOUT'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-05',
      code: 'SOD_UNDERWRITER_SETTLEMENT',
      name: 'Underwriter vs Loan Debt Settlement Separation',
      description: 'Credit sanctioning underwriters cannot author one-time loan debt settlements (OTS).',
      conflictingPermissions: ['APPLICATIONS_APPROVE', 'COLLECTIONS_SETTLE_LOAN'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-06',
      code: 'SOD_FRAUD_ANALYST_DISBURSER',
      name: 'Fraud Investigator vs Disbursement Operator Separation',
      description: 'Fraud analysts who investigate or override fraud cases cannot originate or execute fund disbursements.',
      conflictingPermissions: ['FRAUD_INVESTIGATE', 'DISBURSEMENTS_INITIATE_PAYOUT'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-07',
      code: 'SOD_AUDITOR_RISK_POLICY_PUBLISHER',
      name: 'Auditor vs Risk Policy Publisher Separation',
      description: 'Independent compliance auditors cannot publish institutional risk policies or alter fraud rules.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'RISK_MANAGE_POLICIES'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-08',
      code: 'SOD_RECONCILIATION_RESOLVER_AUDITOR',
      name: 'Reconciliation Exception Resolver vs Compliance Auditor',
      description: 'Auditors auditing financial statements cannot execute reconciliation manual adjustments.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'RECONCILIATION_RESOLVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-09',
      code: 'SOD_PAYOUT_INITIATOR_APPROVER',
      name: 'Payout Initiator vs Payout Approver Separation',
      description: 'A single officer cannot both initiate and approve the same payout batch.',
      conflictingPermissions: ['PAYOUTS_INITIATE', 'PAYOUTS_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-10',
      code: 'SOD_COLLECTOR_SETTLEMENT_APPROVER',
      name: 'Debt Settlement Requester vs Approver Separation',
      description: 'A collection officer requesting debt settlement/waiver cannot authorize or sign off on that settlement.',
      conflictingPermissions: ['COLLECTIONS_SETTLEMENT_REQUEST', 'COLLECTIONS_SETTLEMENT_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-11',
      code: 'SOD_COLLECTOR_WRITEOFF_APPROVER',
      name: 'Loan Write-Off Requester vs Approver Separation',
      description: 'A collection officer proposing bad debt write-off cannot authorize or post the accounting write-off.',
      conflictingPermissions: ['COLLECTIONS_WRITEOFF_REQUEST', 'COLLECTIONS_WRITEOFF_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-12',
      code: 'SOD_JOURNAL_MAKER_APPROVER',
      name: 'Journal Maker vs Approver Separation',
      description: 'The user drafting or proposing a manual accounting journal cannot approve or post that journal.',
      conflictingPermissions: ['JOURNAL_CREATE', 'JOURNAL_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-13',
      code: 'SOD_JOURNAL_APPROVER_AUDITOR',
      name: 'Journal Approver vs Compliance Auditor Separation',
      description: 'Independent compliance auditors cannot approve or post financial journals.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'JOURNAL_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-14',
      code: 'SOD_PERIOD_CLOSER_AUDITOR',
      name: 'Period Closer vs Compliance Auditor Separation',
      description: 'Independent compliance auditors cannot execute fiscal period close or reopen operations.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'PERIOD_CLOSE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-15',
      code: 'SOD_ACCRUAL_MAKER_APPROVER',
      name: 'Accrual Creator vs Approver Separation',
      description: 'A finance officer proposing an accounting accrual adjustment cannot approve that accrual.',
      conflictingPermissions: ['ACCRUAL_CREATE', 'ACCRUAL_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-16',
      code: 'SOD_PAYABLE_MAKER_APPROVER',
      name: 'Accounts Payable Creator vs Approver Separation',
      description: 'A user drafting a partner or vendor payable cannot authorize that payable payout.',
      conflictingPermissions: ['PAYABLES_CREATE', 'PAYABLES_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-17',
      code: 'SOD_PARTNER_CREDIT_UNDERWRITING',
      name: 'Partner vs Internal Credit Sanction Separation',
      description: 'Partner users originating applications cannot possess credit underwriting or sanctioning authority.',
      conflictingPermissions: ['partner.applications.create', 'APPLICATIONS_APPROVE'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-18',
      code: 'SOD_PARTNER_FINANCE_DISBURSER',
      name: 'Partner vs Fund Disbursement Execution Separation',
      description: 'Partner users cannot execute bank fund transfers or authorize disbursement batches.',
      conflictingPermissions: ['partner.dashboard.view', 'DISBURSEMENTS_EXECUTE_TRANSFER'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-19',
      code: 'SOD_PARTNER_GENERAL_LEDGER',
      name: 'Partner vs General Ledger Posting Separation',
      description: 'Partner users cannot post manual or automated accounting journals to the General Ledger.',
      conflictingPermissions: ['partner.commissions.view', 'JOURNAL_POST'],
      severity: 'CRITICAL_BLOCK',
    },
  ];

  // In-memory tenant role registry: Map<`${tenantId}:${roleCode}`, CustomRole>
  private readonly roles = new Map<string, CustomRole>();

  private constructor() {
    this.seedSystemRoles('tenant-adyapan-default');
    this.seedSystemRoles('tenant-apex-nbfc');
  }

  public static getInstance(): RolePermissionService {
    if (!RolePermissionService.instance) {
      RolePermissionService.instance = new RolePermissionService();
    }
    return RolePermissionService.instance;
  }

  public seedSystemRoles(tenantId: string): void {
    const now = new Date().toISOString();

    const allPerms = this.permissions.map((p) => p.code);

    const systemRoleTemplates: Array<{
      code: string;
      name: string;
      description: string;
      permissions: PermissionCode[];
      scope: ResourceScope;
      sanctionLimit?: number;
      payoutLimit?: number;
    }> = [
        {
          code: 'SUPER_ADMIN',
          name: 'Platform Super Administrator',
          description: 'Platform control-plane governance, tenant lifecycle, and system configuration oversight',
          permissions: [
            // 1. Tenant & Branch Administration
            'TENANT_MANAGE_USERS',
            'TENANT_ASSIGN_ROLES',
            'TENANT_VIEW_OPERATIONS_CENTER',
            'TENANT_CONFIGURE_BRANDING',
            'VIEW_BRANCH_APPLICATIONS',
            // 2. Configuration, Products, BRE & Policies
            'CONFIGURATION_VIEW_POLICIES',
            'CONFIGURATION_DRAFT_POLICY',
            'CONFIGURATION_PUBLISH_POLICY',
            'CONFIGURATION_CONFIGURE_INTEGRATIONS',
            'COLLECTIONS_POLICY_VIEW',
            'COLLECTIONS_POLICY_MANAGE',
            'RISK_MANAGE_POLICIES',
            'FRAUD_MANAGE_RULES',
            // 3. Privacy, Audit & Cryptographic Verification
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'AUDIT_EXPORT_EVIDENCE_PACKAGE',
            'AUDIT_VERIFY_CHAIN',
            'PRIVACY_PURGE_PII',
            // 4. Analytics & Command Center Observability
            'ANALYTICS_VIEW',
            'ANALYTICS_BRANCHES',
            'ANALYTICS_PORTFOLIO',
            'ANALYTICS_COLLECTIONS',
            'COLLECTIONS_ANALYTICS_VIEW',
            // 5. Read-Only Business Visibility (Oversight Only - No Operational Mutations)
            'APPLICATIONS_VIEW',
            'VIEW_CUSTOMER_DETAILS',
            'VIEW_DOCUMENTS',
            'VIEW_CREDIT_ANALYST_REPORT',
            'VIEW_RISK_ASSESSMENT',
            'VIEW_REPAYMENT_ASSESSMENT',
            'CREDIT_ASSESSMENT_VIEW',
            'UNDERWRITING_VIEW_BUREAU',
            'COLLECTIONS_VIEW_DPD',
            'PAYMENTS_VIEW',
            'PAYOUTS_VIEW',
            'RECONCILIATION_VIEW',
            'SETTLEMENTS_VIEW',
            'ACCOUNTING_VIEW',
            'ACCOUNTING_DASHBOARD_VIEW',
            'COA_VIEW',
            'JOURNAL_VIEW',
            'PERIOD_VIEW',
            'RISK_VIEW_SIGNALS',
            'FRAUD_VIEW_CASES',
            'COMMUNICATIONS_VIEW',
            'SUPPORT_VIEW',
            'SUPPORT_COMPLAINT_VIEW',
          ],
          scope: 'GLOBAL',
          sanctionLimit: 0,
          payoutLimit: 0,
        },
        {
          code: 'COMPANY_ADMIN',
          name: 'Company / Institution Administrator',
          description: 'Tenant management, staff provisioning, policy and operations for own company',
          permissions: [...allPerms],
          scope: 'TENANT',
          sanctionLimit: 500000000,
          payoutLimit: 500000000,
        },
        {
          code: 'SYSTEM_ADMIN',
          name: 'System Administrator',
          description: 'Tenant management, user provisioning, policy and system health',
          permissions: [
            'tenant.view',
            'tenant.manage',
            'user.view',
            'user.manage',
            'role.view',
            'role.manage',
            'branch.view',
            'branch.manage',
            'config.view',
            'config.manage',
            'integration.view',
            'integration.manage',
            'system.observability',
            'audit.view',
            'support.view',
            'support.tickets.view',
            'reports.view',
            'reports.execute'
          ],
          scope: 'TENANT',
          sanctionLimit: 0,
          payoutLimit: 0,
        },
        {
          code: 'BRANCH_MANAGER',
          name: 'Branch Manager',
          description: 'Branch-level operational oversight, management review, and approval within ₹5L delegated limit',
          permissions: [
            'application.view',
            'customer.view',
            'loan.view',
            'branch.view',
            'branch.operations.view',
            'branch.performance.view',
            'task.view',
            'task.update',
            'task.assign',
            'collection.view',
            'report.view',
            'report.export',
            'support.view',
            'support.create',
            'APPROVE_WITHIN_DELEGATED_LIMIT'
          ],
          scope: 'BRANCH',
          sanctionLimit: 500000, // ₹5 Lakh delegated authority limit
          payoutLimit: 0, // Strictly no disbursement authority
        },
        {
          code: 'CREDIT_ANALYST',
          name: 'Credit & Risk Analyst',
          description: 'Financial statement analysis, bureau review, FOIR calculation, and credit eligibility recommendation',
          permissions: [
            'APPLICATIONS_VIEW',
            'APPLICATIONS_REVIEW',
            'UNDERWRITING_VIEW_BUREAU',
            'UNDERWRITING_RUN_AI_ASSIST',
            'CREDIT_ASSESSMENT_VIEW',
            'CREDIT_ASSESSMENT_EVALUATE',
            'CREDIT_ASSESSMENT_SUBMIT',
            'CREDIT_ASSESSMENT_FORWARD',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_CREDIT',
            'ANALYTICS_RISK',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          sanctionLimit: 0,
        },
        {
          code: 'UNDERWRITER',
          name: 'Credit Underwriter',
          description: 'Credit assessment, bureau analysis, and loan application sanctioning',
          permissions: [
            'APPLICATIONS_VIEW',
            'APPLICATIONS_REVIEW',
            'APPLICATIONS_APPROVE',
            'APPLICATIONS_REJECT',
            'UNDERWRITING_VIEW_BUREAU',
            'UNDERWRITING_RUN_AI_ASSIST',
            'UNDERWRITING_APPROVE_EXCEPTION',
            'UNDERWRITING_COMMITTEE_VOTE',
            'RISK_VIEW_SIGNALS',
            'RISK_EVALUATE',
            'FRAUD_VIEW_CASES',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_CREDIT',
            'ANALYTICS_RISK',
            'ANALYTICS_FRAUD',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          sanctionLimit: 1000000, // ₹10 Lakh standard underwriter sanction limit
        },
        {
          code: 'FINANCE_OFFICER',
          name: 'Finance & Accounts Officer',
          description: 'Payment transaction processing, waterfall allocation, disbursements, reconciliation, and accounting',
          permissions: [
            'APPLICATIONS_VIEW',
            'PAYMENTS_VIEW',
            'PAYMENTS_CREATE',
            'PAYMENTS_CONFIRM',
            'PAYMENTS_REFUND',
            'PAYMENTS_REVERSE',
            'PAYOUTS_VIEW',
            'PAYOUTS_INITIATE',
            'PAYOUTS_APPROVE',
            'RECONCILIATION_VIEW',
            'RECONCILIATION_RESOLVE',
            'SETTLEMENTS_VIEW',
            'SETTLEMENTS_RECONCILE',
            'DISBURSEMENTS_INITIATE_PAYOUT',
            'DISBURSEMENTS_EXECUTE_TRANSFER',
            'DISBURSEMENTS_RECONCILE',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ACCOUNTING_VIEW',
            'COA_VIEW',
            'COA_CREATE',
            'COA_EDIT',
            'JOURNAL_VIEW',
            'JOURNAL_CREATE',
            'JOURNAL_EDIT',
            'JOURNAL_SUBMIT',
            'PERIOD_VIEW',
            'TRIAL_BALANCE_VIEW',
            'FINANCIAL_STATEMENTS_VIEW',
            'CASH_FLOW_VIEW',
            'RECEIVABLES_VIEW',
            'PAYABLES_VIEW',
            'PAYABLES_CREATE',
            'ACCRUAL_VIEW',
            'ACCRUAL_CREATE',
            'TAX_VIEW',
            'TAX_REPORT',
            'SUSPENSE_MANAGE',
            'FINANCE_CONTROLS_VIEW',
            'ANALYTICS_VIEW',
            'ANALYTICS_FINANCE',
            'ANALYTICS_PORTFOLIO',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          payoutLimit: 10000000,
        },
        {
          code: 'RECON_ANALYST',
          name: 'Reconciliation & Settlement Analyst',
          description: 'Tri-party gateway, ledger, and loan account reconciliation, exception resolution, and settlement tracking',
          permissions: [
            'APPLICATIONS_VIEW',
            'PAYMENTS_VIEW',
            'RECONCILIATION_VIEW',
            'RECONCILIATION_RESOLVE',
            'SETTLEMENTS_VIEW',
            'SETTLEMENTS_RECONCILE',
            'DISBURSEMENTS_RECONCILE',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_FINANCE',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          payoutLimit: 0,
        },
        {
          code: 'DISBURSEMENT_OFFICER',
          name: 'Disbursement Maker Officer',
          description: 'Prepares loan payout batches and initiates bank disbursements',
          permissions: [
            'APPLICATIONS_VIEW',
            'PAYOUTS_VIEW',
            'PAYOUTS_INITIATE',
            'DISBURSEMENTS_INITIATE_PAYOUT',
            'DISBURSEMENTS_RECONCILE',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'REPORT_VIEW',
            'DASHBOARD_VIEW',
          ],
          scope: 'BRANCH',
          payoutLimit: 5000000,
        },
        {
          code: 'FINANCE_CONTROLLER',
          name: 'Finance Checker & Gateway Officer',
          description: 'Authorizes maker disbursement batches, approves manual journals, closes accounting periods, and triggers payment gateway transfers',
          permissions: [
            'APPLICATIONS_VIEW',
            'PAYOUTS_VIEW',
            'PAYOUTS_APPROVE',
            'PAYMENTS_REFUND',
            'PAYMENTS_REVERSE',
            'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
            'DISBURSEMENTS_EXECUTE_TRANSFER',
            'DISBURSEMENTS_RECONCILE',
            'SETTLEMENTS_VIEW',
            'SETTLEMENTS_RECONCILE',
            'ACCOUNTING_VIEW',
            'COA_VIEW',
            'COA_CREATE',
            'COA_EDIT',
            'COA_ACTIVATE',
            'COA_ARCHIVE',
            'JOURNAL_VIEW',
            'JOURNAL_APPROVE',
            'JOURNAL_POST',
            'JOURNAL_REJECT',
            'JOURNAL_REVERSE',
            'PERIOD_VIEW',
            'PERIOD_OPEN',
            'PERIOD_SOFT_CLOSE',
            'PERIOD_CLOSE',
            'PERIOD_REOPEN',
            'TRIAL_BALANCE_VIEW',
            'FINANCIAL_STATEMENTS_VIEW',
            'CASH_FLOW_VIEW',
            'RECEIVABLES_VIEW',
            'PAYABLES_VIEW',
            'PAYABLES_APPROVE',
            'PAYABLES_PAY',
            'ACCRUAL_VIEW',
            'ACCRUAL_APPROVE',
            'ACCRUAL_POST',
            'ACCRUAL_REVERSE',
            'TAX_VIEW',
            'TAX_MANAGE',
            'TAX_REPORT',
            'SUSPENSE_MANAGE',
            'FINANCE_CONTROLS_VIEW',
            'ANALYTICS_VIEW',
            'ANALYTICS_FINANCE',
            'ANALYTICS_PORTFOLIO',
            'ANALYTICS_COMMAND_CENTER',
            'REPORT_VIEW',
            'REPORT_CREATE',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
            'DASHBOARD_CONFIGURE',
          ],
          scope: 'TENANT',
          payoutLimit: 50000000,
        },
        {
          code: 'COLLECTION_OFFICER',
          name: 'Collections Officer',
          description: 'Branch collections portfolio oversight, delinquent borrower engagement, PTP tracking, and settlement initiation',
          permissions: [
            'collection.view',
            'collection.account.view',
            'collection.queue.view',
            'collection.activity.view',
            'collection.activity.create',
            'collection.promise.view',
            'collection.promise.create',
            'collection.promise.update',
            'collection.payment.view',
            'customer.view',
            'loan.view',
            'task.view',
            'task.update',
            'report.view',
            'report.export',
            'support.view',
            'support.create',
          ],
          scope: 'BRANCH',
        },
        {
          code: 'COLLECTION_AGENT',
          name: 'Collections & Recovery Agent',
          description: 'Manages overdue accounts, records customer interactions and promises to pay, and initiates recovery actions',
          permissions: [
            'APPLICATIONS_VIEW',
            'COLLECTIONS_VIEW_DPD',
            'COLLECTIONS_CONTACT',
            'COLLECTIONS_RECORD_PTP',
            'COLLECTIONS_UPDATE_PTP',
            'COLLECTIONS_ESCALATE',
            'COLLECTIONS_INITIATE_RECOVERY',
            'COLLECTIONS_SETTLEMENT_REQUEST',
            'ANALYTICS_VIEW',
            'ANALYTICS_COLLECTIONS',
            'REPORT_VIEW',
            'DASHBOARD_VIEW',
          ],
          scope: 'REGION',
        },
        {
          code: 'AUDITOR',
          name: 'Compliance & Regulatory Auditor',
          description: 'Independent tenant-wide evidence auditing, consent verification, and ledger inspection',
          permissions: [
            'application.view',
            'customer.view',
            'loan.view',
            'credit.view',
            'underwriting.view',
            'finance.view',
            'accounting.view',
            'partner.view',
            'audit.view',
            'audit.export',
            'report.view',
            'report.export',
            'support.view',
          ],
          scope: 'TENANT',
        },
        {
          code: 'LOAN_OFFICER',
          name: 'Field Loan Sourcing Officer',
          description: 'Sources applications, collects customer profile and dynamic KYC documents, and submits to Credit Analyst',
          permissions: [
            'APPLICATIONS_CREATE',
            'APPLICATIONS_VIEW',
            'VIEW_BRANCH_APPLICATIONS',
            'VIEW_CUSTOMER_DETAILS',
            'VIEW_DOCUMENTS',
            'KYC_INITIATE',
            'COMMUNICATIONS_VIEW',
            'COMMUNICATIONS_SEND',
            'SUPPORT_VIEW',
            'SUPPORT_TICKET_CREATE',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'REPORT_VIEW',
            'DASHBOARD_VIEW',
          ],
          scope: 'BRANCH',
          sanctionLimit: 0,
          payoutLimit: 0,
        },
        {
          code: 'PARTNER',
          name: 'Lending Service Provider / Channel Partner',
          description: 'Sourced application submission, status checking, and partner commission tracking',
          permissions: [
            'APPLICATIONS_CREATE',
            'APPLICATIONS_VIEW',
            'ANALYTICS_VIEW',
            'ANALYTICS_PARTNERS',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
        },
        {
          code: 'CUSTOMER',
          name: 'Borrower',
          description: 'Self-service loan application submission, eKYC, and EMI payment',
          permissions: [
            'APPLICATIONS_CREATE',
            'APPLICATIONS_VIEW',
          ],
          scope: 'GLOBAL',
        },
        {
          code: 'PARTNER_ADMIN',
          name: 'Partner / LSP Administrator',
          description: 'Manage partner users, API credentials, webhook endpoints, and view partner dashboard',
          permissions: [
            'partner.dashboard.view',
            'partner.users.view',
            'partner.users.manage',
            'partner.applications.create',
            'partner.applications.view',
            'partner.applications.update',
            'partner.applications.submit',
            'partner.applications.documents.view',
            'partner.applications.documents.upload',
            'partner.application.status.view',
            'partner.offers.view',
            'partner.offers.accept',
            'partner.customers.view',
            'partner.webhooks.view',
            'partner.webhooks.replay',
            'partner.api_credentials.view',
            'partner.api_credentials.create',
            'partner.api_credentials.rotate',
            'partner.api_credentials.revoke',
            'partner.commissions.view',
            'partner.settlements.view',
            'partner.support.create',
            'partner.support.view',
          ],
          scope: 'PARTNER',
        },
        {
          code: 'PARTNER_OPERATIONS',
          name: 'Partner Operations / Lead Desk',
          description: 'Originate, submit, and track partner-sourced applications and upload documents',
          permissions: [
            'partner.dashboard.view',
            'partner.applications.create',
            'partner.applications.view',
            'partner.applications.update',
            'partner.applications.submit',
            'partner.applications.documents.view',
            'partner.applications.documents.upload',
            'partner.application.status.view',
            'partner.offers.view',
            'partner.offers.accept',
            'partner.customers.view',
            'partner.support.create',
            'partner.support.view',
          ],
          scope: 'PARTNER',
        },
        {
          code: 'PARTNER_AGENT',
          name: 'Partner Sourcing Agent / DSA',
          description: 'Field sourcing agent originating and submitting loan applications on partner channels',
          permissions: [
            'partner.dashboard.view',
            'partner.applications.create',
            'partner.applications.view',
            'partner.applications.update',
            'partner.applications.submit',
            'partner.applications.documents.view',
            'partner.applications.documents.upload',
            'partner.application.status.view',
            'partner.offers.view',
            'partner.offers.accept',
            'partner.customers.view',
            'partner.support.create',
            'partner.support.view',
          ],
          scope: 'PARTNER',
        },
        {
          code: 'PARTNER_FINANCE',
          name: 'Partner Finance Officer',
          description: 'View partner commission statements, payout summaries, and settlement reconciliation',
          permissions: [
            'partner.dashboard.view',
            'partner.commissions.view',
            'partner.settlements.view',
            'partner.support.create',
            'partner.support.view',
          ],
          scope: 'PARTNER',
        },
        {
          code: 'PARTNER_SUPPORT',
          name: 'Partner Support Specialist',
          description: 'Track application and customer servicing status and raise partner support inquiries',
          permissions: [
            'partner.dashboard.view',
            'partner.applications.view',
            'partner.application.status.view',
            'partner.customers.view',
            'partner.support.create',
            'partner.support.view',
          ],
          scope: 'PARTNER',
        },
        {
          code: 'PARTNER_API_CLIENT',
          name: 'Partner Machine-to-Machine API Client',
          description: 'Machine-to-machine integration client governed strictly by assigned API scopes',
          permissions: [
            'partner.applications.create',
            'partner.applications.view',
            'partner.applications.update',
            'partner.applications.submit',
            'partner.offers.view',
            'partner.offers.accept',
            'partner.customers.view',
            'partner.webhooks.view',
            'partner.webhooks.replay',
          ],
          scope: 'PARTNER',
        },
      ];

    for (const tpl of systemRoleTemplates) {
      const key = `${tenantId}:${tpl.code}`;
      this.roles.set(key, {
        id: `role-${tpl.code.toLowerCase()}-${tenantId.replace('tenant-', '')}`,
        tenantId,
        code: tpl.code,
        name: tpl.name,
        description: tpl.description,
        isSystemRole: true,
        permissions: tpl.permissions,
        scope: tpl.scope,
        sanctionLimitAmount: tpl.sanctionLimit,
        payoutLimitAmount: tpl.payoutLimit,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // --- 1. PERMISSION CATALOG & SOD MATRIX ---

  public getPermissionCatalog(): PermissionDefinition[] {
    return [...this.permissions];
  }

  public getSodRules(): SodRule[] {
    return [...this.sodRules];
  }

  public checkSodConflicts(permissions: PermissionCode[]): SodConflictCheckResult {
    const conflicts: Array<{
      ruleCode: string;
      ruleName: string;
      description: string;
      conflictingPair: [PermissionCode, PermissionCode];
      severity: 'CRITICAL_BLOCK' | 'WARNING';
    }> = [];

    const permSet = new Set(permissions);

    for (const rule of this.sodRules) {
      const [p1, p2] = rule.conflictingPermissions;
      if (permSet.has(p1) && permSet.has(p2)) {
        conflicts.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          description: rule.description,
          conflictingPair: rule.conflictingPermissions,
          severity: rule.severity,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      hasCriticalBlock: conflicts.some((c) => c.severity === 'CRITICAL_BLOCK'),
      conflicts,
    };
  }

  // --- 2. CUSTOM ROLE BUILDER & HIERARCHY ---

  public listRoles(tenantId: string): CustomRole[] {
    const result: CustomRole[] = [];
    for (const role of this.roles.values()) {
      if (role.tenantId === tenantId) {
        result.push(role);
      }
    }
    return result;
  }

  public getRole(tenantId: string, roleCode: string): CustomRole {
    const key = `${tenantId}:${roleCode.toUpperCase()}`;
    const role = this.roles.get(key);
    if (!role) {
      throw new NotFoundError(`Role '${roleCode}' not found for tenant '${tenantId}'.`);
    }
    return role;
  }

  public async createCustomRole(
    tenantId: string,
    dto: CreateCustomRoleDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CustomRole> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('SYSTEM_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Administrators can create custom roles.');
    }

    // System Admin cannot self-authorize SoD override
    if (dto.allowSodOverride && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Privilege escalation denied: Only Super Admins can authorize Segregation of Duties (SoD) overrides.');
    }

    const cleanCode = dto.code.toUpperCase().replace(/\s+/g, '_');
    const key = `${tenantId}:${cleanCode}`;

    if (this.roles.has(key)) {
      throw new BadRequestError(`Role '${cleanCode}' already exists for this institution.`);
    }

    // Resolve inherited permissions from parent role if specified
    let finalPermissions = [...dto.permissions];
    if (dto.parentRoleCode) {
      const parentRole = this.getRole(tenantId, dto.parentRoleCode);
      finalPermissions = Array.from(new Set([...parentRole.permissions, ...finalPermissions]));
    }

    // Check Segregation of Duties conflicts
    const sodCheck = this.checkSodConflicts(finalPermissions);
    if (sodCheck.hasCriticalBlock && (!dto.allowSodOverride || !actor.roles.includes('SUPER_ADMIN'))) {
      const conflictNames = sodCheck.conflicts.map((c) => c.ruleName).join(', ');
      throw new BadRequestError(
        `Segregation of Duties (SoD) Conflict Detected: [${conflictNames}]. Banking regulations prohibit combining these permissions in a single role without Super Admin authorization.`
      );
    }

    const now = new Date().toISOString();
    const newRole: CustomRole = {
      id: `role-custom-${uuid().slice(0, 8)}`,
      tenantId,
      code: cleanCode,
      name: dto.name.trim(),
      description: dto.description.trim(),
      isSystemRole: false,
      parentRoleCode: dto.parentRoleCode,
      permissions: finalPermissions,
      scope: dto.scope || 'BRANCH',
      sanctionLimitAmount: dto.sanctionLimitAmount,
      payoutLimitAmount: dto.payoutLimitAmount,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(key, newRole);

    // Record SHA-256 evidence node
    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'PERMISSION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'CUSTOM_ROLE',
      entityId: newRole.id,
      action: 'CUSTOM_ROLE_CREATED',
      correlationId: `corr-role-${newRole.id}`,
      beforeState: {},
      afterState: {
        code: cleanCode,
        name: newRole.name,
        permissionsCount: finalPermissions.length,
        sodOverride: Boolean(dto.allowSodOverride),
      },
      timestamp: now,
    });

    logAudit({
      userId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor.id) ? actor.id : undefined,
      role: actor.roles[0],
      action: 'CUSTOM_ROLE_CREATED',
      entity: 'CustomRole',
      entityId: newRole.id,
      newValue: { code: cleanCode, permissions: finalPermissions },
    }).catch(() => { });

    return newRole;
  }

  public async updateRole(
    tenantId: string,
    roleId: string,
    dto: UpdateRoleDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CustomRole> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('SYSTEM_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Administrators can modify roles.');
    }

    let targetRole: CustomRole | undefined;
    for (const r of this.roles.values()) {
      if (r.id === roleId && r.tenantId === tenantId) {
        targetRole = r;
        break;
      }
    }

    if (!targetRole) {
      throw new NotFoundError(`Role '${roleId}' not found.`);
    }

    // Protection of built-in system roles
    if (targetRole.isSystemRole) {
      if (!actor.roles.includes('SUPER_ADMIN')) {
        throw new ForbiddenError(
          `Cannot modify protected built-in system role '${targetRole.code}'. Built-in operational and governance roles cannot be altered by tenant administrators.`
        );
      }
      if (targetRole.code === 'SUPER_ADMIN') {
        throw new BadRequestError('Cannot modify platform Super Administrator system role.');
      }
    }

    if (dto.permissions) {
      const sodCheck = this.checkSodConflicts(dto.permissions);
      if (sodCheck.hasCriticalBlock && !actor.roles.includes('SUPER_ADMIN')) {
        throw new BadRequestError(
          `Segregation of Duties (SoD) Conflict Detected: [${sodCheck.conflicts.map((c) => c.ruleName).join(', ')}].`
        );
      }
      targetRole.permissions = dto.permissions;
    }

    if (dto.name) targetRole.name = dto.name;
    if (dto.description) targetRole.description = dto.description;
    if (dto.scope) targetRole.scope = dto.scope;
    if (dto.sanctionLimitAmount !== undefined) targetRole.sanctionLimitAmount = dto.sanctionLimitAmount;
    if (dto.payoutLimitAmount !== undefined) targetRole.payoutLimitAmount = dto.payoutLimitAmount;
    targetRole.updatedAt = new Date().toISOString();

    return targetRole;
  }

  // --- 3. DYNAMIC RBAC EVALUATION ENGINE ---

  public getEffectivePermissions(userRoles: string[], tenantId: string): PermissionCode[] {
    const effectiveSet = new Set<PermissionCode>();

    for (const roleCode of userRoles) {
      const key = `${tenantId}:${roleCode.toUpperCase()}`;
      let role = this.roles.get(key);

      // Fallback to default tenant if not found in specific tenant
      if (!role) {
        role = this.roles.get(`tenant-adyapan-default:${roleCode.toUpperCase()}`);
      }

      if (role) {
        for (const perm of role.permissions) {
          effectiveSet.add(perm);
        }
      }
    }

    return Array.from(effectiveSet);
  }

  private checkFinancialLimits(roles: string[], tenantId: string, requiredSanctionAmount?: number): boolean {
    if (requiredSanctionAmount === undefined) {
      return true;
    }
    let maxSanctionLimit = 0;
    for (const roleCode of roles) {
      const key = `${tenantId}:${roleCode.toUpperCase()}`;
      const role = this.roles.get(key) || this.roles.get(`tenant-adyapan-default:${roleCode.toUpperCase()}`);
      if (role?.sanctionLimitAmount && role.sanctionLimitAmount > maxSanctionLimit) {
        maxSanctionLimit = role.sanctionLimitAmount;
      }
    }
    return maxSanctionLimit >= requiredSanctionAmount;
  }

  public hasPermission(
    userOrRoles: AuthUser | string[],
    requiredPermission: PermissionCode,
    options?: { requiredSanctionAmount?: number }
  ): boolean {
    const roles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles.roles || [];
    const tenantId = Array.isArray(userOrRoles) ? 'tenant-adyapan-default' : userOrRoles.tenantId || 'tenant-adyapan-default';

    const effectivePermissions = this.getEffectivePermissions(roles, tenantId);

    // 1. Direct match
    if (effectivePermissions.includes(requiredPermission)) {
      return this.checkFinancialLimits(roles, tenantId, options?.requiredSanctionAmount);
    }

    // 2. Forward alias match (requiredPermission -> aliases)
    const aliases = PERMISSION_ALIAS_MAP[requiredPermission] || [];
    if (aliases.some((a) => effectivePermissions.includes(a))) {
      return this.checkFinancialLimits(roles, tenantId, options?.requiredSanctionAmount);
    }

    // 3. Reverse alias match (effectivePermissions -> aliases containing requiredPermission)
    for (const p of effectivePermissions) {
      const pAliases = PERMISSION_ALIAS_MAP[p] || [];
      if (pAliases.includes(requiredPermission)) {
        return this.checkFinancialLimits(roles, tenantId, options?.requiredSanctionAmount);
      }
    }

    return false;
  }

  public validateRoleAssignment(
    actor: { id: string; roles: string[]; tenantId?: string },
    targetRoleCode: string,
    targetUserId?: string
  ): void {
    if (targetRoleCode.toUpperCase() === 'SUPER_ADMIN') {
      if (!actor.roles.includes('SUPER_ADMIN')) {
        throw new ForbiddenError('Privilege escalation denied: Only Super Admins can grant the SUPER_ADMIN role.');
      }
    }
    // Prevent self-escalation: Super Admin cannot assign operational lending roles to their own account
    if (actor.roles.includes('SUPER_ADMIN') && targetUserId && targetUserId === actor.id && targetRoleCode.toUpperCase() !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Self-escalation denied: Super Admin cannot assign operational lending roles to their own account.');
    }
  }

  public clearForTesting(): void {
    this.roles.clear();
    this.seedSystemRoles('tenant-adyapan-default');
    this.seedSystemRoles('tenant-apex-nbfc');
  }
}

export const rolePermissionService = RolePermissionService.getInstance();

export function validateRoleAssignment(
  actor: { id: string; roles: string[]; tenantId?: string },
  targetUserIdOrRole: string,
  targetRoleCode?: string
): void {
  const roleCode = targetRoleCode || targetUserIdOrRole;
  const targetUserId = targetRoleCode ? targetUserIdOrRole : undefined;
  rolePermissionService.validateRoleAssignment(actor, roleCode, targetUserId);
}
