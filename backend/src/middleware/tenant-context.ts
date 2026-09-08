import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../common/errors';
import { TenantService, tenantService } from '../modules/tenants/tenant.service';

/**
 * Derives and validates tenant scope for requests.
 */
export function resolveTenantScope(req: {
  headers?: Record<string, any>;
  query?: Record<string, any>;
  user?: { id?: string; roles?: string[]; tenantId?: string };
}): { tenantId: string; code: string; name: string } {
  if (!req.user) {
    const defaultTenant = tenantService.getTenantById(TenantService.DEFAULT_PRIMARY_TENANT_ID);
    return { tenantId: defaultTenant.id, code: defaultTenant.code, name: defaultTenant.name };
  }

  const userTenantId = req.user.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;
  const headerTenantId = req.headers?.['x-tenant-id'] as string | undefined;
  const queryTenantId = req.query?.tenantId as string | undefined;
  const isSuperAdmin = req.user.roles?.includes('SUPER_ADMIN') ?? false;

  // Anti-Spoofing: Check header
  if (headerTenantId) {
    if (!isSuperAdmin && headerTenantId !== userTenantId) {
      throw new ForbiddenError(
        `Tenant context mismatch: Authenticated tenant is '${userTenantId}' but requested 'X-Tenant-ID' is '${headerTenantId}'. Cross-tenant access is prohibited.`
      );
    }
  }

  // Anti-Spoofing: Check query parameter
  if (queryTenantId) {
    if (!isSuperAdmin && queryTenantId !== userTenantId) {
      throw new ForbiddenError(
        `Tenant query mismatch: Authenticated tenant is '${userTenantId}' but requested query parameter 'tenantId' is '${queryTenantId}'. Cross-tenant access is prohibited.`
      );
    }
  }

  let effectiveTenantId = userTenantId;
  if (isSuperAdmin && (headerTenantId || queryTenantId)) {
    effectiveTenantId = headerTenantId || queryTenantId!;
  }

  const tenant = tenantService.getTenantById(effectiveTenantId);

  // Enforce Tenant Status: Block non-superadmins from accessing suspended institutions
  if (tenant.status === 'SUSPENDED' && !isSuperAdmin) {
    throw new ForbiddenError(
      `Tenant '${tenant.name}' (${tenant.code}) is SUSPENDED. User access is blocked until reactivation by Super Admin.`
    );
  }

  return {
    tenantId: tenant.id,
    code: tenant.code,
    name: tenant.name,
  };
}

export function tenantContext(req: Request, _res: Response, next: NextFunction): void {
  const scope = resolveTenantScope(req);
  req.tenant = {
    id: scope.tenantId,
    tenantId: scope.tenantId,
    code: scope.code,
    tenantCode: scope.code,
    name: scope.name,
    isPrimary: scope.tenantId === TenantService.DEFAULT_PRIMARY_TENANT_ID,
  };
  req.tenantId = scope.tenantId;
  next();
}
