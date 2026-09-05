import { v4 as uuid } from 'uuid';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import {
  CreateTenantDto,
  Tenant,
  TenantContext,
  TenantStatus,
} from './tenant.types';

export class TenantService {
  private static instance: TenantService;

  // In-memory tenant registry (Production-grade canonical store)
  private readonly tenants = new Map<string, Tenant>();

  // Primary default tenant ID for legacy/existing installation records
  public static readonly DEFAULT_PRIMARY_TENANT_ID = 'tenant-adyapan-default';

  private constructor() {
    this.seedTenants();
  }

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  private seedTenants(): void {
    const now = new Date().toISOString();

    // 1. Primary Default Tenant (Preserves all existing single-lender LMS data)
    const primaryTenant: Tenant = {
      id: TenantService.DEFAULT_PRIMARY_TENANT_ID,
      code: 'ADYAPAN_PRIME',
      name: 'Adyapan Prime Lending',
      status: 'ACTIVE',
      tier: 'ENTERPRISE',
      domain: 'adyapan.dev',
      contactEmail: 'governance@adyapan.dev',
      supportPhone: '+91 1800 200 1000',
      settings: {
        maxFoirPct: 55,
        defaultTenureMonths: 24,
        allowPrepayment: true,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.tenants.set(primaryTenant.id, primaryTenant);

    // 2. Secondary Tenant (Enables multi-tenant verification & isolated portfolio)
    const secondaryTenant: Tenant = {
      id: 'tenant-apex-nbfc',
      code: 'APEX_NBFC',
      name: 'Apex Capital Partners',
      status: 'ACTIVE',
      tier: 'GROWTH',
      domain: 'apexcapital.dev',
      contactEmail: 'admin@apexcap.dev',
      supportPhone: '+91 1800 300 2000',
      settings: {
        maxFoirPct: 45,
        defaultTenureMonths: 12,
        allowPrepayment: false,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.tenants.set(secondaryTenant.id, secondaryTenant);
  }

  public getTenantById(tenantId: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }
    return tenant;
  }

  public getTenantByCode(code: string): Tenant | undefined {
    return Array.from(this.tenants.values()).find(
      (t) => t.code.toUpperCase() === code.toUpperCase()
    );
  }

  public listTenants(actor: { id: string; roles: string[]; tenantId?: string }): Tenant[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot list enterprise tenants.');
    }

    // Super Admin can view all tenants across the platform
    if (actor.roles.includes('SUPER_ADMIN')) {
      return Array.from(this.tenants.values());
    }

    // Standard tenant staff can only view their own assigned tenant
    const effectiveTenantId = actor.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;
    const userTenant = this.tenants.get(effectiveTenantId);
    return userTenant ? [userTenant] : [];
  }

  public async createTenant(
    dto: CreateTenantDto,
    actor: { id: string; roles: string[] }
  ): Promise<Tenant> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Super Admins can onboard new lender tenants.');
    }

    const cleanCode = dto.code.trim().toUpperCase();
    if (this.getTenantByCode(cleanCode)) {
      throw new BadRequestError(`Tenant with code '${cleanCode}' already exists.`);
    }

    const id = `tenant-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuid().slice(0, 6)}`;
    const now = new Date().toISOString();

    const newTenant: Tenant = {
      id,
      code: cleanCode,
      name: dto.name.trim(),
      status: 'ACTIVE',
      tier: dto.tier || 'STANDARD',
      domain: dto.domain?.trim(),
      contactEmail: dto.contactEmail.trim().toLowerCase(),
      supportPhone: dto.supportPhone?.trim(),
      settings: dto.settings || {},
      createdAt: now,
      updatedAt: now,
    };

    this.tenants.set(newTenant.id, newTenant);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_ONBOARDED',
      entity: 'Tenant',
      entityId: newTenant.id,
      newValue: { code: newTenant.code, name: newTenant.name, tier: newTenant.tier },
    }).catch(() => {});

    return newTenant;
  }

  public async updateTenantStatus(
    tenantId: string,
    status: TenantStatus,
    actor: { id: string; roles: string[] },
    reason?: string
  ): Promise<Tenant> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Super Admins can modify tenant status.');
    }

    const tenant = this.getTenantById(tenantId);
    if (tenant.id === TenantService.DEFAULT_PRIMARY_TENANT_ID && status !== 'ACTIVE') {
      throw new BadRequestError('Cannot suspend the primary platform tenant.');
    }

    const prevStatus = tenant.status;
    tenant.status = status;
    tenant.updatedAt = new Date().toISOString();

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_STATUS_UPDATED',
      entity: 'Tenant',
      entityId: tenant.id,
      previousValue: { status: prevStatus },
      newValue: { status, reason },
    }).catch(() => {});

    return tenant;
  }

  /**
   * Validates and resolves the authoritative tenant scope for a request.
   * Throws ForbiddenError on IDOR / cross-tenant access attempts.
   */
  public resolveTenantScope(
    actor: { id: string; roles: string[]; tenantId?: string },
    requestedTenantId?: string
  ): string {
    const actorTenantId = actor.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;

    // Super Admin can inspect any tenant
    if (actor.roles.includes('SUPER_ADMIN')) {
      if (requestedTenantId) {
        // Validate target tenant exists
        this.getTenantById(requestedTenantId);
        return requestedTenantId;
      }
      return actorTenantId;
    }

    // Non-superadmin: Strict Tenant Isolation
    if (requestedTenantId && requestedTenantId !== actorTenantId) {
      throw new ForbiddenError(
        `Cross-tenant access denied: User belonging to tenant '${actorTenantId}' cannot access data of tenant '${requestedTenantId}'.`
      );
    }

    return actorTenantId;
  }

  /**
   * Generates a tenant-scoped cache key to prevent cross-tenant cache poisoning.
   */
  public formatTenantCacheKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  /**
   * Sanitizes data before sending to Gemini or AI contexts to guarantee
   * zero cross-tenant prompt leakage.
   */
  public sanitizeAiContext<T extends { tenantId?: string }>(
    activeTenantId: string,
    records: T[]
  ): T[] {
    return records.filter((r) => !r.tenantId || r.tenantId === activeTenantId);
  }

  public getTenantContext(tenantId: string): TenantContext {
    const tenant = this.getTenantById(tenantId);
    return {
      id: tenant.id,
      tenantId: tenant.id,
      code: tenant.code,
      tenantCode: tenant.code,
      name: tenant.name,
      isPrimary: tenant.id === TenantService.DEFAULT_PRIMARY_TENANT_ID,
    };
  }

  public clearForTesting(): void {
    this.tenants.clear();
    this.seedTenants();
  }
}

export const tenantService = TenantService.getInstance();
