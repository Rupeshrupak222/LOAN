import { describe, it, expect } from 'vitest';
import { rolePermissionService, ROLES } from '../roles/role-permission.service';

describe('Branch Manager Isolation & Governance Verification', () => {
  it('should restrict BRANCH_MANAGER role strictly to branch-level scope and deny unauthorized global operations', () => {
    const managerPermissions = rolePermissionService.getEffectivePermissions(['BRANCH_MANAGER'], 'tenant-adyapan-default');

    // Branch Manager MUST NOT have tenant-level management capabilities
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'tenant.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'user.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'role.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'permission.manage')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'config.manage')).toBe(false);

    // Branch Manager MUST NOT have unrestricted underwriting / fraud bypass capabilities
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'underwriting.override')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'fraud.case.close')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'fraud.hold.remove')).toBe(false);

    // Branch Manager MUST NOT have financial execution or GL mutations
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'payout.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'payment.reverse')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'payment.refund')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'accounting.journal.approve')).toBe(false);

    // Branch Manager MUST NOT have audit destruction capabilities
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'audit.delete')).toBe(false);
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'audit.update')).toBe(false);
    
    // Verify that the explicitly allowed delegated approval exists
    expect(rolePermissionService.hasPermission(['BRANCH_MANAGER'], 'APPROVE_WITHIN_DELEGATED_LIMIT')).toBe(true);

    // Verify correct scope constraint
    const roleDef = rolePermissionService.getRole('tenant-adyapan-default', 'BRANCH_MANAGER');
    expect(roleDef?.scope).toBe('BRANCH');
    
    // Verify sanction limit is strictly capped at ₹5L
    expect(roleDef?.sanctionLimitAmount).toBe(500000);
    expect(roleDef?.payoutLimitAmount).toBe(0);
  });
});
