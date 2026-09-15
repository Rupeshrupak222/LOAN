import { describe, it, expect } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';

describe('Collection Officer Isolation & Governance Verification', () => {
  it('should restrict COLLECTION_OFFICER role to explicitly allowed read-only and collection capabilities', () => {
    // Expected strict bounded permissions for COLLECTION_OFFICER
    const expectedPermissions = [
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
    ];

    const officerPermissions = rolePermissionService.getEffectivePermissions(['COLLECTION_OFFICER'], 'tenant-adyapan-default');

    // Officer must have exactly these permissions and NO MORE
    expect(officerPermissions).toEqual(expect.arrayContaining(expectedPermissions));
    expect(officerPermissions.length).toBe(expectedPermissions.length);

    // Officer MUST NOT have originations or mutation capabilities on sensitive domains
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'application.create')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'application.update')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'application.submit')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'application.approve')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'underwriting.decide')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'underwriting.override')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'disbursement.execute')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'accounting.journal.post')).toBe(false);
    
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'payment.reverse')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'loan.modify_sanction')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'loan.writeoff.approve')).toBe(false);
    expect(rolePermissionService.hasPermission(['COLLECTION_OFFICER'], 'config.manage')).toBe(false);
  });
});
