import { RoleName } from '../roles';
import { PermissionKey } from './permissions.types';

// Canonical Role-to-Permissions Mapping for Adyapan Lending OS
export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  SUPER_ADMIN: [
    // SuperAdmin possesses universal permissions across all workspaces
    'customer.view', 'customer.create', 'customer.edit', 'customer.delete', 'customer.kyc',
    'application.view', 'application.create', 'application.edit', 'application.submit', 'application.review', 'application.return', 'application.resubmit',
    'credit.view', 'credit.assess', 'credit.recommend', 'credit.bank_intelligence', 'credit.fraud_score',
    'underwriting.view', 'underwriting.decide', 'underwriting.condition', 'underwriting.override', 'underwriting.kfs_generate',
    'approval.view', 'approval.review', 'approval.approve', 'approval.reject', 'approval.send_back', 'approval.escalate', 'approval.delegate', 'approval.queue.view',
    'authority.view', 'authority.create', 'authority.edit', 'authority.activate', 'authority.archive',
    'delegation.view', 'delegation.create', 'delegation.edit', 'delegation.revoke',
    'offer.view', 'offer.generate', 'offer.edit', 'offer.regenerate', 'offer.accept', 'offer.decline', 'offer.cancel', 'offer.simulate', 'offer.pricing.view', 'offer.pricing.configure', 'offer.policy.view', 'offer.policy.create', 'offer.policy.edit', 'offer.policy.activate', 'offer.policy.archive',
    'credit_limit.view', 'credit_limit.create', 'credit_limit.evaluate', 'credit_limit.approve', 'credit_limit.increase', 'credit_limit.decrease', 'credit_limit.suspend', 'credit_limit.freeze', 'credit_limit.resume', 'credit_limit.close',
    'credit_facility.view', 'credit_facility.create', 'credit_facility.edit',
    'drawdown.view', 'drawdown.request', 'drawdown.approve', 'drawdown.cancel',
    'credit_limit.policy.view', 'credit_limit.policy.create', 'credit_limit.policy.edit', 'credit_limit.policy.activate', 'credit_limit.policy.archive',
    'disbursement.view', 'disbursement.verify', 'disbursement.execute', 'disbursement.penny_drop',
    'loan.view', 'loan.manage', 'loan.restructure', 'loan.settle', 'loan.close', 'loan.noc_issue',
    'payment.view', 'payment.record', 'payment.verify',
    'collection.view', 'collection.manage', 'collection.activity', 'collection.ptp',
    'finance.gl.view', 'finance.gl.post', 'finance.trial_balance', 'finance.accrual.run', 'finance.npa.view', 'finance.recon.view', 'finance.recon.execute',
    'bre.view', 'bre.edit', 'bre.simulate',
    'decision.view', 'decision.evaluate', 'decision.simulate', 'decision.override',
    'decision.policy.view', 'decision.policy.create', 'decision.policy.edit', 'decision.policy.activate', 'decision.policy.archive',
    'decision.rules.view', 'decision.rules.create', 'decision.rules.edit', 'decision.rules.activate', 'decision.rules.archive',
    'risk.view', 'risk.fraud_intel', 'risk.early_warnings',
    'audit.view', 'compliance.view', 'privacy.manage', 'reports.view', 'reports.export',
    'partner.view', 'partner.manage', 'communications.view', 'communications.send',
    'product.view', 'product.create', 'product.edit', 'product.activate', 'product.deactivate', 'product.archive', 'product.configure', 'product.simulate',
    'workflow.view', 'workflow.create', 'workflow.edit', 'workflow.activate', 'workflow.archive', 'workflow.manage',
    'tenant.view', 'tenant.manage', 'branch.view', 'branch.manage', 'user.view', 'user.manage', 'role.view', 'role.manage',
    'config.view', 'config.manage', 'branding.view', 'branding.manage', 'integration.view', 'integration.manage',
    'settings.manage', 'system.observability', 'support.sla', 'analytics.command_center',
  ],

  ADMIN: [
    // Institutional System Administrator
    'customer.view', 'customer.create', 'customer.edit', 'customer.kyc',
    'application.view', 'application.create', 'application.edit', 'application.review', 'application.return',
    'credit.view', 'credit.assess', 'credit.recommend',
    'underwriting.view',
    'approval.view', 'approval.review', 'approval.approve', 'approval.reject', 'approval.send_back', 'approval.escalate', 'approval.delegate', 'approval.queue.view',
    'authority.view', 'authority.create', 'authority.edit', 'authority.activate', 'authority.archive',
    'delegation.view', 'delegation.create', 'delegation.edit', 'delegation.revoke',
    'offer.view', 'offer.generate', 'offer.edit', 'offer.regenerate', 'offer.cancel', 'offer.simulate', 'offer.pricing.view', 'offer.pricing.configure', 'offer.policy.view', 'offer.policy.create', 'offer.policy.edit', 'offer.policy.activate', 'offer.policy.archive',
    'credit_limit.view', 'credit_limit.create', 'credit_limit.evaluate', 'credit_limit.approve', 'credit_limit.increase', 'credit_limit.decrease', 'credit_limit.suspend', 'credit_limit.freeze', 'credit_limit.resume', 'credit_limit.close',
    'credit_facility.view', 'credit_facility.create', 'credit_facility.edit',
    'drawdown.view', 'drawdown.request', 'drawdown.approve', 'drawdown.cancel',
    'credit_limit.policy.view', 'credit_limit.policy.create', 'credit_limit.policy.edit', 'credit_limit.policy.activate', 'credit_limit.policy.archive',
    'disbursement.view',
    'loan.view', 'loan.manage',
    'payment.view', 'payment.record',
    'collection.view',
    'finance.gl.view', 'finance.trial_balance', 'finance.npa.view', 'finance.recon.view',
    'bre.view', 'bre.edit', 'bre.simulate',
    'decision.view', 'decision.evaluate', 'decision.simulate', 'decision.override',
    'decision.policy.view', 'decision.policy.create', 'decision.policy.edit', 'decision.policy.activate', 'decision.policy.archive',
    'decision.rules.view', 'decision.rules.create', 'decision.rules.edit', 'decision.rules.activate', 'decision.rules.archive',
    'risk.view', 'risk.fraud_intel', 'risk.early_warnings',
    'audit.view', 'compliance.view', 'privacy.manage', 'reports.view', 'reports.export',
    'partner.view', 'partner.manage', 'communications.view',
    'product.view', 'product.create', 'product.edit', 'product.activate', 'product.deactivate', 'product.archive', 'product.configure', 'product.simulate',
    'workflow.view', 'workflow.create', 'workflow.edit', 'workflow.activate', 'workflow.archive', 'workflow.manage',
    'branch.view', 'branch.manage', 'user.view', 'user.manage', 'role.view', 'role.manage',
    'config.view', 'config.manage', 'branding.view', 'branding.manage', 'integration.view', 'integration.manage',
    'settings.manage', 'system.observability', 'support.sla', 'analytics.command_center',
  ],

  BRANCH_MANAGER: [
    // Branch Governance, Approvals & Operations
    'customer.view', 'customer.create', 'customer.edit', 'customer.kyc',
    'application.view', 'application.create', 'application.review', 'application.return', 'application.resubmit',
    'credit.view',
    'approval.view', 'approval.review', 'approval.approve', 'approval.reject', 'approval.send_back', 'approval.escalate', 'approval.delegate', 'approval.queue.view',
    'authority.view',
    'delegation.view', 'delegation.create', 'delegation.revoke',
    'offer.view', 'offer.generate', 'offer.simulate', 'offer.pricing.view',
    'credit_limit.view', 'credit_facility.view', 'drawdown.view', 'credit_limit.policy.view',
    'loan.view',
    'payment.view', 'payment.record',
    'collection.view',
    'finance.npa.view',
    'risk.view', 'risk.early_warnings', 'risk.fraud_intel',
    'reports.view', 'reports.export',
    'partner.view', 'communications.view',
    'product.view', 'product.simulate', 'workflow.view',
    'decision.view', 'decision.evaluate', 'decision.simulate', 'decision.override',
    'branch.view', 'user.view', 'analytics.command_center',
  ],

  LOAN_OFFICER: [
    // Customer Intake, Origination & Returned Proposals
    'customer.view', 'customer.create', 'customer.edit', 'customer.kyc',
    'application.view', 'application.create', 'application.edit', 'application.submit', 'application.return', 'application.resubmit',
    'offer.view', 'offer.simulate',
    'credit_limit.view', 'credit_facility.view', 'drawdown.request', 'drawdown.view',
    'loan.view',
    'product.view', 'product.simulate',
    'decision.view', 'decision.evaluate', 'decision.simulate',
    'communications.view',
  ],

  CREDIT_ANALYST: [
    // Credit Assessment & Underwriting Recommendation
    'customer.view', 'customer.kyc',
    'application.view', 'application.review', 'application.return',
    'credit.view', 'credit.assess', 'credit.recommend', 'credit.bank_intelligence', 'credit.fraud_score',
    'approval.view', 'approval.review', 'approval.queue.view', 'approval.send_back',
    'authority.view',
    'offer.view', 'offer.simulate', 'offer.pricing.view',
    'credit_limit.view', 'credit_limit.evaluate', 'credit_facility.view', 'credit_limit.policy.view',
    'risk.view', 'risk.fraud_intel', 'risk.early_warnings',
    'product.view', 'product.simulate', 'workflow.view',
    'decision.view', 'decision.evaluate', 'decision.simulate', 'decision.policy.view', 'decision.rules.view',
    'reports.view',
  ],

  UNDERWRITER: [
    // Credit Underwriting Committee & Sanction Terms
    'customer.view',
    'application.view', 'application.review', 'application.return',
    'credit.view', 'credit.bank_intelligence',
    'underwriting.view', 'underwriting.decide', 'underwriting.condition', 'underwriting.override', 'underwriting.kfs_generate',
    'approval.view', 'approval.review', 'approval.approve', 'approval.reject', 'approval.send_back', 'approval.escalate', 'approval.delegate', 'approval.queue.view',
    'authority.view',
    'delegation.view', 'delegation.create',
    'offer.view', 'offer.generate', 'offer.edit', 'offer.regenerate', 'offer.cancel', 'offer.simulate', 'offer.pricing.view',
    'credit_limit.view', 'credit_limit.evaluate', 'credit_limit.approve', 'credit_limit.increase', 'credit_limit.decrease', 'credit_limit.suspend', 'credit_limit.freeze', 'credit_limit.resume', 'credit_limit.close',
    'credit_facility.view', 'credit_facility.create', 'credit_facility.edit',
    'drawdown.view', 'drawdown.approve', 'credit_limit.policy.view',
    'bre.view', 'bre.simulate',
    'decision.view', 'decision.evaluate', 'decision.simulate', 'decision.override', 'decision.policy.view', 'decision.rules.view',
    'loan.view',
    'risk.view', 'risk.fraud_intel', 'risk.early_warnings',
    'product.view', 'product.simulate', 'workflow.view',
    'reports.view',
  ],

  FINANCE_OFFICER: [
    // Pre-Disbursal Check, Payouts, GL & Accruals
    'customer.view',
    'approval.view',
    'offer.view',
    'credit_limit.view', 'credit_facility.view', 'drawdown.view', 'drawdown.approve',
    'disbursement.view', 'disbursement.verify', 'disbursement.execute', 'disbursement.penny_drop',
    'loan.view', 'loan.close', 'loan.noc_issue',
    'payment.view', 'payment.record', 'payment.verify',
    'finance.gl.view', 'finance.gl.post', 'finance.trial_balance', 'finance.accrual.run', 'finance.npa.view', 'finance.recon.view', 'finance.recon.execute',
    'reports.view', 'reports.export',
    'risk.view', 'risk.early_warnings',
    'product.view',
  ],

  COLLECTION_OFFICER: [
    // Delinquency Buckets, Calls, Visits, PTP & Restructuring
    'customer.view',
    'credit_limit.view', 'credit_facility.view',
    'loan.view', 'loan.restructure', 'loan.settle',
    'payment.view', 'payment.record',
    'collection.view', 'collection.manage', 'collection.activity', 'collection.ptp',
    'risk.view', 'risk.early_warnings',
    'product.view',
  ],

  AUDITOR: [
    // Read-Only Compliance & System Inspection
    'customer.view',
    'application.view',
    'credit.view',
    'underwriting.view',
    'approval.view',
    'authority.view',
    'delegation.view',
    'offer.view', 'offer.pricing.view', 'offer.policy.view',
    'credit_limit.view', 'credit_facility.view', 'drawdown.view', 'credit_limit.policy.view',
    'disbursement.view',
    'loan.view',
    'payment.view',
    'collection.view',
    'finance.gl.view', 'finance.trial_balance', 'finance.npa.view', 'finance.recon.view',
    'bre.view',
    'decision.view', 'decision.policy.view', 'decision.rules.view',
    'risk.view', 'risk.fraud_intel', 'risk.early_warnings',
    'audit.view', 'compliance.view', 'privacy.manage', 'reports.view', 'reports.export',
    'product.view', 'workflow.view',
    'branch.view', 'user.view', 'role.view', 'config.view', 'integration.view',
    'analytics.command_center',
  ],

  CUSTOMER: [
    // Borrower Self-Service
    'customer.view',
    'application.view',
    'offer.view', 'offer.accept', 'offer.decline',
    'credit_facility.view', 'drawdown.request', 'drawdown.view',
    'loan.view',
    'product.view', 'product.simulate',
    'payment.view', 'payment.record',
  ],
};

/**
 * Returns the merged list of distinct permissions granted to a user across ALL their roles.
 */
export function getEffectivePermissions(roles: string[] = []): PermissionKey[] {
  const permSet = new Set<PermissionKey>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as RoleName];
    if (perms) {
      perms.forEach((p) => permSet.add(p));
    }
  }
  return Array.from(permSet);
}
