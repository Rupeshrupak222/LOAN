import { describe, it, expect } from 'vitest';
import { analyticsService } from './analytics.service';
import { AnalyticsActorContext } from './analytics.types';

describe('Phase 14: Analytics, MIS & Enterprise Command Center', () => {
  const superAdminActor: AnalyticsActorContext = {
    id: 'usr-admin-01',
    roles: ['SUPER_ADMIN'],
    tenantId: 'tenant-apex-nbfc',
  };

  const branchManagerActor: AnalyticsActorContext = {
    id: 'usr-bm-01',
    roles: ['BRANCH_MANAGER'],
    tenantId: 'tenant-apex-nbfc',
    branchId: 'BR-MUM-01',
  };

  const borrowerActor: AnalyticsActorContext = {
    id: 'usr-cust-01',
    roles: ['CUSTOMER'],
    tenantId: 'tenant-apex-nbfc',
  };

  it('should resolve date ranges accurately', () => {
    const todayRange = analyticsService.resolveDateRange({ timeRange: 'today' });
    expect(todayRange.from).toBeDefined();
    expect(todayRange.to).toBeDefined();

    const monthRange = analyticsService.resolveDateRange({ timeRange: 'this_month' });
    expect(monthRange.from?.getDate()).toBe(1);
  });

  it('should enforce role scope on analytics queries', () => {
    expect(() => {
      analyticsService.buildSecurityScope(borrowerActor);
    }).toThrow(/Access Forbidden: Customer role is not permitted/);

    const bmScope = analyticsService.buildSecurityScope(branchManagerActor);
    expect(bmScope.branchFilter.branchId).toBe('BR-MUM-01');
    expect(bmScope.tenantFilter.tenantId).toBe('tenant-apex-nbfc');

    const adminScope = analyticsService.buildSecurityScope(superAdminActor, { tenantId: 'tenant-custom' });
    expect(adminScope.tenantFilter.tenantId).toBe('tenant-custom');
  });
});
