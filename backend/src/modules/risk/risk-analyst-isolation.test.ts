import { describe, it, expect } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Risk Analyst Isolation & Governance Verification', () => {
  it('should restrict RISK_ANALYST role to explicitly allowed risk-analysis capabilities', () => {
    const expectedPermissions = [
      'risk.view',
      'risk.analyse',
      'risk.case.view',
      'risk.case.manage',
      'risk.signal.view',
      'risk.signal.review',
      'risk.analytics.view',
      'risk.report.view',
      'task.view',
      'task.manage',
    ];

    const analystPermissions = rolePermissionService.getEffectivePermissions(['RISK_ANALYST'], 'tenant-adyapan-default');

    // Risk Analyst must have exactly these permissions and NO MORE
    expect(analystPermissions).toEqual(expect.arrayContaining(expectedPermissions));
    expect(analystPermissions.length).toBe(expectedPermissions.length);

    // Risk Analyst MUST NOT have origination capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'application.create')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'application.update')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'application.submit')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'application.reject')).toBe(false);
    
    // Risk Analyst MUST NOT have final underwriting capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'underwriting.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'underwriting.override')).toBe(false);
    
    // Risk Analyst MUST NOT have financial mutation capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'payout.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'payment.reverse')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'payment.refund')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'accounting.journal.approve')).toBe(false);
    
    // Risk Analyst MUST NOT have collection override capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'collection.writeoff.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'collection.activity.create')).toBe(false);
    
    // Risk Analyst MUST NOT have loan modification capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'loan.modify_pricing')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'loan.modify_sanction')).toBe(false);
    
    // Risk Analyst MUST NOT have system configuration or tenant management capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'tenant.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'user.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'role.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'permission.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'config.manage')).toBe(false);
    
    // Risk Analyst MUST NOT have audit destruction capabilities
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'audit.delete')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'audit.update')).toBe(false);
    
    // Risk Analyst MUST NOT bypass workflow transitions directly
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'workflow.transition')).toBe(false);

    // Risk Analyst MUST NOT have fraud case closing or fraud hold removal
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'fraud.case.close')).toBe(false);
    expect(rolePermissionService.hasPermission(['RISK_ANALYST'], 'fraud.hold.remove')).toBe(false);
  });
});
