import { describe, it, expect } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Risk & Fraud Manager Isolation & Governance Verification', () => {
  it('should restrict RISK_FRAUD_MANAGER role to explicitly allowed control and investigation capabilities', () => {
    const expectedPermissions = [
      'risk.view',
      'risk.review',
      'risk.alert.view',
      'risk.alert.create',
      'risk.investigation.view',
      'risk.investigation.create',
      'risk.investigation.update',
      'risk.case.view',
      'risk.case.create',
      'risk.case.update',
      'fraud.view',
      'fraud.review',
      'fraud.case.view',
      'fraud.case.create',
      'fraud.case.update',
      'fraud.hold.create',
      'fraud.hold.remove',
      'application.view',
      'customer.view',
      'loan.view',
      'task.view',
      'task.update',
      'report.view',
      'report.export',
      'support.view',
      'support.create',
      'watchlist.view',
      'watchlist.create',
      'watchlist.update',
    ];

    const managerPermissions = rolePermissionService.getEffectivePermissions(['RISK_FRAUD_MANAGER'], 'tenant-adyapan-default');

    // Manager must have exactly these permissions and NO MORE
    expect(managerPermissions).toEqual(expect.arrayContaining(expectedPermissions));
    expect(managerPermissions.length).toBe(expectedPermissions.length);

    // Manager MUST NOT have origination or underwriting capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'application.create')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'application.update')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'application.submit')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'application.reject')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'credit.assess')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'credit.recommend')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'underwriting.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'underwriting.override')).toBe(false);
    
    // Manager MUST NOT have financial mutation capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'payout.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'payment.reverse')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'payment.refund')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'accounting.journal.approve')).toBe(false);
    
    // Manager MUST NOT have collection override capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'collection.writeoff.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'collection.activity.create')).toBe(false);
    
    // Manager MUST NOT have loan modification capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'loan.modify_pricing')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'loan.modify_sanction')).toBe(false);
    
    // Manager MUST NOT have system configuration or tenant management capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'tenant.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'user.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'role.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'permission.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'config.manage')).toBe(false);
    
    // Manager MUST NOT have audit destruction capabilities
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'audit.delete')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'audit.update')).toBe(false);
    
    // Manager MUST NOT bypass workflow transitions directly
    expect(rolePermissionService.hasPermission(['RISK_FRAUD_MANAGER'], 'workflow.transition')).toBe(false);
  });
});
