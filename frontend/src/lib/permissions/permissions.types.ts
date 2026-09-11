// Centralized Permission Taxonomy for Adyapan Lending OS
// Convention: domain.action

export type PermissionKey =
  // Customer Domain
  | 'customer.view'
  | 'customer.create'
  | 'customer.edit'
  | 'customer.delete'
  | 'customer.kyc'
  
  // Application / LOS Domain
  | 'application.view'
  | 'application.create'
  | 'application.edit'
  | 'application.submit'
  | 'application.review'
  | 'application.return'
  | 'application.resubmit'
  
  // Credit Assessment Domain
  | 'credit.view'
  | 'credit.assess'
  | 'credit.recommend'
  | 'credit.bank_intelligence'
  | 'credit.fraud_score'
  
  // Underwriting & Sanction Domain
  | 'underwriting.view'
  | 'underwriting.decide'
  | 'underwriting.condition'
  | 'underwriting.override'
  | 'underwriting.kfs_generate'
  
  // Approval Authority Matrix, Tasks & Delegations Domain
  | 'approval.view'
  | 'approval.review'
  | 'approval.approve'
  | 'approval.reject'
  | 'approval.send_back'
  | 'approval.escalate'
  | 'approval.delegate'
  | 'approval.queue.view'
  | 'authority.view'
  | 'authority.create'
  | 'authority.edit'
  | 'authority.activate'
  | 'authority.archive'
  | 'delegation.view'
  | 'delegation.create'
  | 'delegation.edit'
  | 'delegation.revoke'
  
  // Offer Engine & Pricing Policies Domain
  | 'offer.view'
  | 'offer.generate'
  | 'offer.edit'
  | 'offer.regenerate'
  | 'offer.accept'
  | 'offer.decline'
  | 'offer.cancel'
  | 'offer.simulate'
  | 'offer.pricing.view'
  | 'offer.pricing.configure'
  | 'offer.policy.view'
  | 'offer.policy.create'
  | 'offer.policy.edit'
  | 'offer.policy.activate'
  | 'offer.policy.archive'
  
  // Credit Limit Engine & Revolving Facilities Domain
  | 'credit_limit.view'
  | 'credit_limit.create'
  | 'credit_limit.evaluate'
  | 'credit_limit.approve'
  | 'credit_limit.increase'
  | 'credit_limit.decrease'
  | 'credit_limit.suspend'
  | 'credit_limit.freeze'
  | 'credit_limit.resume'
  | 'credit_limit.close'
  | 'credit_facility.view'
  | 'credit_facility.create'
  | 'credit_facility.edit'
  | 'drawdown.view'
  | 'drawdown.request'
  | 'drawdown.approve'
  | 'drawdown.cancel'
  | 'credit_limit.policy.view'
  | 'credit_limit.policy.create'
  | 'credit_limit.policy.edit'
  | 'credit_limit.policy.activate'
  | 'credit_limit.policy.archive'
  
  // Disbursement & Payout Domain
  | 'disbursement.view'
  | 'disbursement.verify'
  | 'disbursement.execute'
  | 'disbursement.penny_drop'
  
  // Loan Servicing Domain
  | 'loan.view'
  | 'loan.manage'
  | 'loan.restructure'
  | 'loan.settle'
  | 'loan.close'
  | 'loan.noc_issue'
  
  // Payments & Collections Domain
  | 'payment.view'
  | 'payment.record'
  | 'payment.verify'
  | 'collection.view'
  | 'collection.manage'
  | 'collection.activity'
  | 'collection.ptp'
  
  // Financial Core, GL & Accounting
  | 'finance.gl.view'
  | 'finance.gl.post'
  | 'finance.trial_balance'
  | 'finance.accrual.run'
  | 'finance.npa.view'
  | 'finance.recon.view'
  | 'finance.recon.execute'
  
  // Business Rules Engine (BRE) & Decision Engine Domain
  | 'bre.view'
  | 'bre.edit'
  | 'bre.simulate'
  | 'decision.view'
  | 'decision.evaluate'
  | 'decision.simulate'
  | 'decision.override'
  | 'decision.policy.view'
  | 'decision.policy.create'
  | 'decision.policy.edit'
  | 'decision.policy.activate'
  | 'decision.policy.archive'
  | 'decision.rules.view'
  | 'decision.rules.create'
  | 'decision.rules.edit'
  | 'decision.rules.activate'
  | 'decision.rules.archive'
  
  // Risk & Early Warnings
  | 'risk.view'
  | 'risk.fraud_intel'
  | 'risk.early_warnings'
  
  // Compliance & Regulatory
  | 'audit.view'
  | 'compliance.view'
  | 'privacy.manage'
  | 'reports.view'
  | 'reports.export'
  
  // Partner & Ecosystem
  | 'partner.view'
  | 'partner.manage'
  | 'partner.credentials.manage'
  | 'partner.webhooks.manage'
  | 'partner.reports.view'
  | 'partner.applications.view'
  | 'communications.view'
  | 'communications.send'
  
  // Product Engine & Catalog Domain
  | 'product.view'
  | 'product.create'
  | 'product.edit'
  | 'product.activate'
  | 'product.deactivate'
  | 'product.archive'
  | 'product.configure'
  | 'product.simulate'

  // Workflow Engine Domain
  | 'workflow.view'
  | 'workflow.create'
  | 'workflow.edit'
  | 'workflow.activate'
  | 'workflow.archive'
  | 'workflow.manage'

  // Platform & Tenant Administration
  | 'tenant.view'
  | 'tenant.manage'
  | 'branch.view'
  | 'branch.manage'
  | 'user.view'
  | 'user.manage'
  | 'role.view'
  | 'role.manage'
  | 'config.view'
  | 'config.manage'
  | 'branding.view'
  | 'branding.manage'
  | 'integration.view'
  | 'integration.manage'
  | 'settings.manage'
  | 'system.observability'
  | 'support.sla'
  | 'analytics.command_center';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  domain: string;
  category: 'LENDING_OPS' | 'FINANCE_SERVICING' | 'RISK_COMPLIANCE' | 'PLATFORM_ADMIN';
}
