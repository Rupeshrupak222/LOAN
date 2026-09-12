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

    // Phase 14: Analytics, MIS & Enterprise Command Center
    { code: 'ANALYTICS_VIEW', category: 'ANALYTICS_REPORTING', name: 'View Analytics Hub', description: 'Access enterprise analytics workspace and high-level KPI trends', riskLevel: 'LOW' },
    { code: 'ANALYTICS_PORTFOLIO', category: 'ANALYTICS_REPORTING', name: 'View Portfolio Analytics', description: 'Access AUM, exposure, concentration, and performance intelligence', riskLevel: 'LOW' },
    { code: 'ANALYTICS_CREDIT', category: 'ANALYTICS_REPORTING', name: 'View Credit & BRE Analytics', description: 'Access decision engine outcomes, approval rates, and policy bottlenecks', riskLevel: 'LOW' },
    { code: 'ANALYTICS_RISK', category: 'ANALYTICS_REPORTING', name: 'View Risk Analytics', description: 'Access risk grade distributions, score calibration, and delinquency cross-tabs', riskLevel: 'LOW' },
    { code: 'ANALYTICS_FRAUD', category: 'ANALYTICS_REPORTING', name: 'View Fraud Analytics', description: 'Access fraud risk tiers, anomaly patterns, and investigation resolutions', riskLevel: 'LOW' },
    { code: 'ANALYTICS_COLLECTIONS', category: 'ANALYTICS_REPORTING', name: 'View Collection & DPD Analytics', description: 'Access DPD roll rates, vintage cohorts, recovery efficiency, and scorecards', riskLevel: 'LOW' },
    { code: 'ANALYTICS_FINANCE', category: 'ANALYTICS_REPORTING', name: 'View Financial & Accounting Analytics', description: 'Access management P&L, balance sheet, cash flows, and GL drilldowns', riskLevel: 'MEDIUM' },
    { code: 'ANALYTICS_PARTNERS', category: 'ANALYTICS_REPORTING', name: 'View Partner & LSP Analytics', description: 'Access partner sourcing throughput, conversion, and commission analytics', riskLevel: 'LOW' },
    { code: 'ANALYTICS_BRANCHES', category: 'ANALYTICS_REPORTING', name: 'View Branch Performance Analytics', description: 'Access branch scorecards, TAT, approval rates, and staff productivity', riskLevel: 'LOW' },
    { code: 'ANALYTICS_PRODUCTS', category: 'ANALYTICS_REPORTING', name: 'View Product Performance Analytics', description: 'Access lending product margin indicators, version comparisons, and volumes', riskLevel: 'LOW' },
    { code: 'ANALYTICS_OPERATIONS', category: 'ANALYTICS_REPORTING', name: 'View Operational SLA Analytics', description: 'Access workflow stage bottlenecks, TAT benchmarks, and SLA breach tracking', riskLevel: 'LOW' },
    { code: 'ANALYTICS_SUPPORT', category: 'ANALYTICS_REPORTING', name: 'View Support & Grievance Analytics', description: 'Access ticket volume, resolution times, and grievance aging intelligence', riskLevel: 'LOW' },
    { code: 'ANALYTICS_COMMAND_CENTER', category: 'ANALYTICS_REPORTING', name: 'Access Enterprise Command Center', description: 'Executive operating cockpit with system-wide health and actionable telemetry', riskLevel: 'HIGH' },
    { code: 'REPORT_VIEW', category: 'ANALYTICS_REPORTING', name: 'View Reports Catalog', description: 'Inspect available MIS reports and generated summaries', riskLevel: 'LOW' },
    { code: 'REPORT_CREATE', category: 'ANALYTICS_REPORTING', name: 'Create Custom Report', description: 'Configure custom dimension and metric aggregations in Report Builder', riskLevel: 'MEDIUM' },
    { code: 'REPORT_EDIT', category: 'ANALYTICS_REPORTING', name: 'Edit Saved Report', description: 'Modify saved report configurations and scheduling options', riskLevel: 'MEDIUM' },
    { code: 'REPORT_EXECUTE', category: 'ANALYTICS_REPORTING', name: 'Execute Report Query', description: 'Run on-demand report generation and drilldown analytics', riskLevel: 'LOW' },
    { code: 'REPORT_EXPORT', category: 'ANALYTICS_REPORTING', name: 'Export Report Data (CSV/Excel)', description: 'Export authorized reporting datasets with audited PII masking', riskLevel: 'MEDIUM' },
    { code: 'REPORT_SHARE', category: 'ANALYTICS_REPORTING', name: 'Share Report Definition', description: 'Publish saved reports to team or tenant visibility', riskLevel: 'LOW' },
    { code: 'DASHBOARD_VIEW', category: 'ANALYTICS_REPORTING', name: 'View Analytics Dashboards', description: 'Access role-specific interactive widget dashboards', riskLevel: 'LOW' },
    { code: 'DASHBOARD_CONFIGURE', category: 'ANALYTICS_REPORTING', name: 'Configure Analytics Dashboards', description: 'Customize dashboard widget layouts, metrics, and refresh policies', riskLevel: 'MEDIUM' },
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
          description: 'Full platform governance, administration, and unrestricted operations',
          permissions: [...allPerms],
          scope: 'GLOBAL',
          sanctionLimit: 1000000000,
          payoutLimit: 1000000000,
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
          code: 'ADMIN',
          name: 'Institutional Administrator',
          description: 'Tenant management, user provisioning, policy and full operations',
          permissions: [...allPerms],
          scope: 'TENANT',
          sanctionLimit: 500000000,
          payoutLimit: 500000000,
        },
        {
          code: 'BRANCH_MANAGER',
          name: 'Branch Manager',
          description: 'Branch-level operational oversight, management review, and approval within ₹5L delegated limit',
          permissions: [
            'VIEW_BRANCH_APPLICATIONS',
            'VIEW_CUSTOMER_DETAILS',
            'VIEW_DOCUMENTS',
            'VIEW_CREDIT_ANALYST_REPORT',
            'VIEW_RISK_ASSESSMENT',
            'VIEW_REPAYMENT_ASSESSMENT',
            'REVIEW_APPLICATION',
            'APPROVE_WITHIN_DELEGATED_LIMIT',
            'SEND_BACK_FOR_CORRECTION',
            'ESCALATE_TO_UNDERWRITER',
            'ADD_MANAGER_REMARKS',
            'APPLICATIONS_VIEW',
            'APPLICATIONS_ASSIGN',
            'APPLICATIONS_REVIEW',
            'COLLECTIONS_VIEW_DPD',
            'COLLECTIONS_ASSIGN',
            'COLLECTIONS_CONTACT',
            'COLLECTIONS_RECORD_PTP',
            'COLLECTIONS_UPDATE_PTP',
            'COLLECTIONS_ESCALATE',
            'COLLECTIONS_SETTLEMENT_APPROVE',
            'COLLECTIONS_POLICY_VIEW',
            'COLLECTIONS_ANALYTICS_VIEW',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_BRANCHES',
            'ANALYTICS_PORTFOLIO',
            'ANALYTICS_COLLECTIONS',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
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
          code: 'RISK_ANALYST',
          name: 'Risk Governance Analyst',
          description: 'Deep-dive risk signal inspection, risk score calibration, and repayment capacity analytics',
          permissions: [
            'APPLICATIONS_VIEW',
            'APPLICATIONS_REVIEW',
            'UNDERWRITING_VIEW_BUREAU',
            'RISK_VIEW_SIGNALS',
            'RISK_EVALUATE',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_RISK',
            'ANALYTICS_CREDIT',
            'ANALYTICS_PORTFOLIO',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          sanctionLimit: 0,
        },
        {
          code: 'FRAUD_ANALYST',
          name: 'Fraud & AML Investigator',
          description: 'Identity mismatch detection, device fingerprint analysis, network anomalies, and fraud case investigations',
          permissions: [
            'APPLICATIONS_VIEW',
            'APPLICATIONS_REVIEW',
            'UNDERWRITING_VIEW_BUREAU',
            'FRAUD_VIEW_CASES',
            'FRAUD_INVESTIGATE',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_FRAUD',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          sanctionLimit: 0,
        },
        {
          code: 'RISK_MANAGER',
          name: 'Head of Risk & Fraud Prevention',
          description: 'Risk policy drafting & publishing, fraud rules governance, risk bands calibration, and audited overrides',
          permissions: [
            'APPLICATIONS_VIEW',
            'APPLICATIONS_REVIEW',
            'UNDERWRITING_VIEW_BUREAU',
            'RISK_VIEW_SIGNALS',
            'RISK_EVALUATE',
            'RISK_MANAGE_POLICIES',
            'RISK_OVERRIDE',
            'FRAUD_VIEW_CASES',
            'FRAUD_INVESTIGATE',
            'FRAUD_MANAGE_RULES',
            'FRAUD_OVERRIDE',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'ANALYTICS_RISK',
            'ANALYTICS_FRAUD',
            'ANALYTICS_PORTFOLIO',
            'ANALYTICS_CREDIT',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
          sanctionLimit: 5000000,
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
            'APPLICATIONS_VIEW',
            'COLLECTIONS_VIEW_DPD',
            'COLLECTIONS_ASSIGN',
            'COLLECTIONS_CONTACT',
            'COLLECTIONS_RECORD_PTP',
            'COLLECTIONS_UPDATE_PTP',
            'COLLECTIONS_ESCALATE',
            'COLLECTIONS_INITIATE_RECOVERY',
            'COLLECTIONS_SETTLEMENT_REQUEST',
            'COLLECTIONS_WRITEOFF_REQUEST',
            'COLLECTIONS_ANALYTICS_VIEW',
            'ANALYTICS_VIEW',
            'ANALYTICS_COLLECTIONS',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'DASHBOARD_VIEW',
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
            'APPLICATIONS_VIEW',
            'COLLECTIONS_VIEW_DPD',
            'CONFIGURATION_VIEW_POLICIES',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'AUDIT_EXPORT_EVIDENCE_PACKAGE',
            'AUDIT_VERIFY_CHAIN',
            'ACCOUNTING_VIEW',
            'COA_VIEW',
            'JOURNAL_VIEW',
            'PERIOD_VIEW',
            'TRIAL_BALANCE_VIEW',
            'FINANCIAL_STATEMENTS_VIEW',
            'CASH_FLOW_VIEW',
            'RECEIVABLES_VIEW',
            'PAYABLES_VIEW',
            'ACCRUAL_VIEW',
            'TAX_VIEW',
            'TAX_REPORT',
            'FINANCE_CONTROLS_VIEW',
            'ANALYTICS_VIEW',
            'ANALYTICS_PORTFOLIO',
            'ANALYTICS_FINANCE',
            'ANALYTICS_COLLECTIONS',
            'ANALYTICS_OPERATIONS',
            'REPORT_VIEW',
            'REPORT_EXECUTE',
            'REPORT_EXPORT',
            'DASHBOARD_VIEW',
          ],
          scope: 'TENANT',
        },
        {
          code: 'LOAN_OFFICER',
          name: 'Field Loan Sourcing Officer',
          description: 'Sources applications, submits borrower KYC documents, and tracks status',
          permissions: [
            'APPLICATIONS_CREATE',
            'APPLICATIONS_VIEW',
            'PRIVACY_VIEW_CONSENT_REGISTRY',
            'ANALYTICS_VIEW',
            'REPORT_VIEW',
            'DASHBOARD_VIEW',
          ],
          scope: 'BRANCH',
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
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
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
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
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

  public hasPermission(
    userOrRoles: AuthUser | string[],
    requiredPermission: PermissionCode,
    options?: { requiredSanctionAmount?: number }
  ): boolean {
    const roles = Array.isArray(userOrRoles) ? userOrRoles : userOrRoles.roles || [];
    const tenantId = Array.isArray(userOrRoles) ? 'tenant-adyapan-default' : userOrRoles.tenantId || 'tenant-adyapan-default';

    if (roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const effectivePermissions = this.getEffectivePermissions(roles, tenantId);

    if (!effectivePermissions.includes(requiredPermission)) {
      return false;
    }

    // Check financial sanction limit if required
    if (options?.requiredSanctionAmount !== undefined) {
      let maxSanctionLimit = 0;
      for (const roleCode of roles) {
        const key = `${tenantId}:${roleCode.toUpperCase()}`;
        const role = this.roles.get(key) || this.roles.get(`tenant-adyapan-default:${roleCode.toUpperCase()}`);
        if (role?.sanctionLimitAmount && role.sanctionLimitAmount > maxSanctionLimit) {
          maxSanctionLimit = role.sanctionLimitAmount;
        }
      }

      if (maxSanctionLimit < options.requiredSanctionAmount) {
        return false;
      }
    }

    return true;
  }

  public validateRoleAssignment(
    actor: { id: string; roles: string[]; tenantId?: string },
    targetRoleCode: string
  ): void {
    if (targetRoleCode.toUpperCase() === 'SUPER_ADMIN') {
      if (!actor.roles.includes('SUPER_ADMIN')) {
        throw new ForbiddenError('Privilege escalation denied: Only Super Admins can grant the SUPER_ADMIN role.');
      }
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
  rolePermissionService.validateRoleAssignment(actor, roleCode);
}
