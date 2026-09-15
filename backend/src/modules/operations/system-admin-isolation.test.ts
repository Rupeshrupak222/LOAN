import { describe, it, expect } from 'vitest';
import { rolePermissionService, ROLES } from '../roles/role-permission.service';

describe('System Admin Isolation & Zero-Trust Verification', () => {
  it('should restrict SYSTEM_ADMIN strictly to operational scope and deny business-process authority', () => {
    // System Admin MUST have these permissions
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'tenant.manage')).toBe(true);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'user.manage')).toBe(true);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'role.manage')).toBe(true);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'config.manage')).toBe(true);

    // System Admin MUST NOT have underwriting or credit authority
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'underwriting.override')).toBe(false);
    
    // System Admin MUST NOT have financial, GL, or disbursement authority
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'payout.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'payment.refund')).toBe(false);

    // System Admin MUST NOT have fraud bypass capabilities
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'fraud.hold.remove')).toBe(false);
    expect(rolePermissionService.hasPermission(['SYSTEM_ADMIN'], 'fraud.override')).toBe(false);

    // Verify scope constraints
    const roleDef = rolePermissionService.getRole('tenant-adyapan-default', 'SYSTEM_ADMIN');
    expect(roleDef?.scope).toBe('TENANT');
    
    // Verify limits are strictly 0
    expect(roleDef?.sanctionLimitAmount).toBe(0);
    expect(roleDef?.payoutLimitAmount).toBe(0);
  });
});
