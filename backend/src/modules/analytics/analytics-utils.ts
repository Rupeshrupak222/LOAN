import { AnalyticsActorContext, AnalyticsQueryFilters, DateRangePreset, DataFreshnessInfo } from './analytics.types';
import { ForbiddenError } from '../../common/errors';

export function resolveAnalyticsDateRange(
  preset?: DateRangePreset,
  startDate?: string,
  endDate?: string
): { from?: Date; to?: Date } {
  if (startDate && endDate) {
    const from = new Date(startDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const now = new Date();
  const p = (preset || 'LAST_30_DAYS').toUpperCase() as DateRangePreset;

  switch (p) {
    case 'TODAY': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from, to };
    }
    case 'YESTERDAY': {
      const y = new Date(now.getTime() - 86400000);
      const from = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      const to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      return { from, to };
    }
    case 'LAST_7_DAYS': {
      const from = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'LAST_30_DAYS': {
      const from = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'THIS_MONTH': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'LAST_MONTH': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'THIS_QUARTER': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const from = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0);
      const to = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'LAST_QUARTER': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const year = qMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const normalizedQMonth = (qMonth + 12) % 12;
      const from = new Date(year, normalizedQMonth, 1, 0, 0, 0);
      const to = new Date(year, normalizedQMonth + 3, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'THIS_FINANCIAL_YEAR': {
      const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const from = new Date(fyStartYear, 3, 1, 0, 0, 0);
      const to = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999);
      return { from, to };
    }
    default:
      return {};
  }
}

export function buildScopedPrismaFilter(
  actor: AnalyticsActorContext,
  filters?: AnalyticsQueryFilters
): {
  tenantId?: string;
  branchId?: string;
  partnerId?: string;
} {
  const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor.roles.includes('COMPANY_ADMIN') || actor.roles.includes('ADMIN');
  const isPartner = actor.roles.includes('PARTNER') || Boolean(actor.partnerId);

  // 1. Tenant Scoping
  let effectiveTenantId: string | undefined;
  if (isSuperAdmin) {
    effectiveTenantId = filters?.tenantId || actor.tenantId;
  } else {
    // Non-superadmin cannot inspect other tenants
    if (filters?.tenantId && filters.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: You cannot access analytics for another tenant.');
    }
    effectiveTenantId = actor.tenantId || 'tenant-adyapan-default';
  }

  // 2. Branch Scoping
  let effectiveBranchId: string | undefined;
  if (isSuperAdmin || isCompanyAdmin) {
    effectiveBranchId = filters?.branchId;
  } else if (actor.branchId) {
    if (filters?.branchId && filters.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: You cannot access analytics outside your assigned branch.');
    }
    effectiveBranchId = actor.branchId;
  }

  // 3. Partner Scoping
  let effectivePartnerId: string | undefined;
  if (isPartner) {
    effectivePartnerId = actor.partnerId || actor.id;
    if (filters?.partnerId && filters.partnerId !== effectivePartnerId) {
      throw new ForbiddenError('Access forbidden: Partners can only access their own performance analytics.');
    }
  } else {
    effectivePartnerId = filters?.partnerId;
  }

  return {
    ...(effectiveTenantId ? { tenantId: effectiveTenantId } : {}),
    ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    ...(effectivePartnerId ? { partnerId: effectivePartnerId } : {}),
  };
}

export function createFreshnessMeta(calculatedAtDate?: Date): DataFreshnessInfo {
  const calculatedAt = (calculatedAtDate || new Date()).toISOString();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(calculatedAt).getTime()) / 1000));
  
  let text = 'Real-time (Live)';
  if (diffSeconds > 120) {
    const mins = Math.floor(diffSeconds / 60);
    text = `Snapshot from ${mins} minute${mins === 1 ? '' : 's'} ago`;
  } else if (diffSeconds > 10) {
    text = `Updated ${diffSeconds}s ago`;
  }

  return {
    calculatedAt,
    freshnessSec: diffSeconds,
    dataFreshnessText: text,
    isRealtime: diffSeconds <= 30,
  };
}
