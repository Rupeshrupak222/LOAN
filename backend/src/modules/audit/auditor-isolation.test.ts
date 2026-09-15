import { describe, it, expect } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Auditor Isolation & Governance Verification', () => {
  it('should restrict AUDITOR role to read-only capabilities', () => {
    // Expected strict read-only permissions for AUDITOR
    const expectedPermissions = [
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
    ];

    const auditorPermissions = rolePermissionService.getEffectivePermissions(['AUDITOR'], 'tenant-adyapan-default');

    // Auditor must have exactly these permissions and NO MORE
    expect(auditorPermissions).toEqual(expect.arrayContaining(expectedPermissions));
    expect(auditorPermissions.length).toBe(expectedPermissions.length);

    // Auditor MUST NOT have mutation capabilities
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'application.create')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'application.update')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'application.submit')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'application.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'underwriting.override')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'finance.gl.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'accounting.journal.post')).toBe(false);
    expect(rolePermissionService.hasPermission(['AUDITOR'], 'audit.delete')).toBe(false);
  });
});
