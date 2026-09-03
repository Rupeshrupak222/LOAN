import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors';
import { TenantService, tenantService } from '../modules/tenants/tenant.service';

/**
 * Authoritative Server-Side Tenant Context Middleware
 *
 * Enforces:
 * 1. Derives tenant context directly from authenticated user identity.
 * 2. Blocks tenant header spoofing (rejects non-super-admin mismatched X-Tenant-ID with 403).
 * 3. Permits Super Admins to explicitly switch tenant context for oversight.
 * 4. Binds default primary tenant for backwards compatibility.
 */
export function tenantContext(req: Request, _res: Response, next: NextFunction): void {
  // If not authenticated yet, proceed (for public endpoints) or use default primary tenant
  if (!req.user) {
    const defaultTenant = tenantService.getTenantById(TenantService.DEFAULT_PRIMARY_TENANT_ID);
    req.tenant = {
      id: defaultTenant.id,
      tenantId: defaultTenant.id,
      code: defaultTenant.code,
      tenantCode: defaultTenant.code,
      name: defaultTenant.name,
      isPrimary: true,
    };
    return next();
  }

  const userTenantId = req.user.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;
  const headerTenantId = req.headers['x-tenant-id'] as string | undefined;

  let effectiveTenantId = userTenantId;

  if (headerTenantId) {
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isSuperAdmin && headerTenantId !== userTenantId) {
      throw new ForbiddenError(
        `Tenant context mismatch: Authenticated tenant is '${userTenantId}' but requested 'X-Tenant-ID' is '${headerTenantId}'. Cross-tenant access is prohibited.`
      );
    }

    if (isSuperAdmin) {
      // Validate that requested target tenant exists
      tenantService.getTenantById(headerTenantId);
      effectiveTenantId = headerTenantId;
    }
  }

  const tenant = tenantService.getTenantById(effectiveTenantId);

  req.tenant = {
    id: tenant.id,
    tenantId: tenant.id,
    code: tenant.code,
    tenantCode: tenant.code,
    name: tenant.name,
    isPrimary: tenant.id === TenantService.DEFAULT_PRIMARY_TENANT_ID,
  };

  next();
}
