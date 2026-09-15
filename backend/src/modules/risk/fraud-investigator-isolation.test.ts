import { describe, it, expect } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Fraud Investigator Isolation & Governance Verification', () => {
  it('should restrict FRAUD_INVESTIGATOR role to explicitly allowed investigation capabilities', () => {
    const expectedPermissions = [
      'fraud.view',
      'fraud.alert.view',
      'fraud.case.view',
      'fraud.case.create',
      'fraud.case.update',
      'fraud.investigation.view',
      'fraud.investigation.create',
      'fraud.investigation.update',
      'fraud.evidence.view',
      'fraud.evidence.create',
      'application.view',
      'customer.view',
      'loan.view',
      'task.view',
      'task.update',
      'report.view',
      'report.export',
      'support.view',
      'support.create',
    ];

    const investigatorPermissions = rolePermissionService.getEffectivePermissions(['FRAUD_INVESTIGATOR'], 'tenant-adyapan-default');

    // Investigator must have exactly these permissions and NO MORE
    expect(investigatorPermissions).toEqual(expect.arrayContaining(expectedPermissions));
    expect(investigatorPermissions.length).toBe(expectedPermissions.length);

    // Investigator MUST NOT have origination or underwriting capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'application.create')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'application.update')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'application.submit')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'application.reject')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'credit.assess')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'credit.recommend')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'underwriting.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'underwriting.override')).toBe(false);
    
    // Investigator MUST NOT have financial mutation capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'payout.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'payment.reverse')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'payment.refund')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'accounting.journal.approve')).toBe(false);
    
    // Investigator MUST NOT have collection override capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'collection.writeoff.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'collection.activity.create')).toBe(false);
    
    // Investigator MUST NOT have loan modification capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'loan.modify_pricing')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'loan.modify_sanction')).toBe(false);
    
    // Investigator MUST NOT have system configuration or tenant management capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'tenant.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'user.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'role.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'permission.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'config.manage')).toBe(false);
    
    // Investigator MUST NOT have audit destruction capabilities
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'audit.delete')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'audit.update')).toBe(false);
    
    // Investigator MUST NOT bypass workflow transitions directly
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'workflow.transition')).toBe(false);

    // Investigator MUST NOT have fraud hold removal directly (only manager can)
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'fraud.hold.remove')).toBe(false);
    expect(rolePermissionService.hasPermission(['FRAUD_INVESTIGATOR'], 'fraud.hold.create')).toBe(false);
  });
});
