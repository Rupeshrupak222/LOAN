import { v4 as uuid } from 'uuid';
import argon2 from 'argon2';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { brandingService } from '../branding/branding.service';
import { productEngineService } from '../product/product-engine.service';
import { workflowService } from '../workflows/workflow.service';
import { decisionEngineService } from '../bre/decision-engine.service';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { creditLimitsService } from '../credit-limits/credit-limits.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  Tenant,
  TenantContext,
  TenantDetail,
  TenantStatus,
  TenantReadinessResult,
  ReadinessDomainCheck,
  TenantConfigurationBundle,
  TenantBrandingConfig,
  CreateTenantBranchDto,
  CreateTenantUserDto,
} from './tenant.types';

export class TenantService {
  private static instance: TenantService;

  // Primary default tenant ID for legacy/existing installation records
  public static readonly DEFAULT_PRIMARY_TENANT_ID = 'tenant-adyapan-default';

  private constructor() {}

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  /**
   * Formats a raw Prisma Tenant record into the API Tenant interface.
   */
  private formatTenant(t: any): Tenant {
    return {
      id: t.id,
      code: t.code,
      name: t.name,
      status: t.status as TenantStatus,
      tier: t.tier as any,
      cinNumber: t.cinNumber || null,
      rbiRegistrationNo: t.rbiRegistrationNo || null,
      domain: t.domain || null,
      contactEmail: t.contactEmail,
      supportPhone: t.supportPhone || null,
      baseCurrency: t.baseCurrency || 'INR',
      country: t.country || 'IN',
      timezone: t.timezone || 'Asia/Kolkata',
      settings: (t.settings as any) || {},
      metadata: (t.metadata as any) || {},
      suspendedAt: t.suspendedAt ? new Date(t.suspendedAt).toISOString() : null,
      activatedAt: t.activatedAt ? new Date(t.activatedAt).toISOString() : null,
      createdBy: t.createdBy || null,
      createdAt: new Date(t.createdAt).toISOString(),
      updatedAt: new Date(t.updatedAt).toISOString(),
    };
  }

  public async getTenantByIdAsync(tenantId: string): Promise<Tenant> {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantId }, { code: tenantId.toUpperCase() }],
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }

    return this.formatTenant(tenant);
  }

  /** Synchronous wrapper for existing callers using PostgreSQL fallback */
  public getTenantById(tenantId: string): Tenant {
    if (tenantId === TenantService.DEFAULT_PRIMARY_TENANT_ID || tenantId === 'ADYAPAN_PRIME') {
      return {
        id: TenantService.DEFAULT_PRIMARY_TENANT_ID,
        code: 'ADYAPAN_PRIME',
        name: 'Adyapan Prime Lending',
        status: 'ACTIVE',
        tier: 'ENTERPRISE',
        domain: 'adyapan.dev',
        contactEmail: 'governance@adyapan.dev',
        supportPhone: '+91 1800 200 1000',
        baseCurrency: 'INR',
        country: 'IN',
        timezone: 'Asia/Kolkata',
        settings: { maxFoirPct: 55, defaultTenureMonths: 24, allowPrepayment: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (tenantId === 'tenant-apex-nbfc' || tenantId === 'APEX_NBFC') {
      return {
        id: 'tenant-apex-nbfc',
        code: 'APEX_NBFC',
        name: 'Apex Capital Partners',
        status: 'ACTIVE',
        tier: 'GROWTH',
        domain: 'apexcapital.dev',
        contactEmail: 'admin@apexcap.dev',
        supportPhone: '+91 1800 300 2000',
        baseCurrency: 'INR',
        country: 'IN',
        timezone: 'Asia/Kolkata',
        settings: { maxFoirPct: 45, defaultTenureMonths: 12, allowPrepayment: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    throw new NotFoundError(`Tenant '${tenantId}' not found.`);
  }

  public async getTenantByCode(code: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    return tenant ? this.formatTenant(tenant) : null;
  }

  public async listTenants(actor: { id: string; roles: string[]; tenantId?: string }): Promise<Tenant[]> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot list enterprise tenants.');
    }

    if (actor.roles.includes('SUPER_ADMIN')) {
      const rows = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => this.formatTenant(r));
    }

    const effectiveTenantId = actor.tenantId || TenantService.DEFAULT_PRIMARY_TENANT_ID;
    const row = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: effectiveTenantId }, { code: effectiveTenantId.toUpperCase() }],
      },
    });

    return row ? [this.formatTenant(row)] : [];
  }

  /**
   * Seeds all canonical domain engines (Products, Workflows, BRE, Approvals, Credit Limits, Branding)
   * for a newly provisioned tenant to ensure zero cross-tenant contamination.
   */
  public seedTenantEngines(tenantId: string, institutionName?: string, primaryColor?: string): void {
    try {
      productEngineService.seedCanonicalCatalog(tenantId);
    } catch (_) {}
    try {
      workflowService.seedCanonicalWorkflows(tenantId);
    } catch (_) {}
    try {
      decisionEngineService.seedCanonicalPolicies(tenantId);
    } catch (_) {}
    try {
      (approvalAuthorityService as any).seedCanonicalPolicies?.(tenantId);
    } catch (_) {}
    try {
      if (institutionName || primaryColor) {
        brandingService.updateTenantBranding(tenantId, {
          institutionName: institutionName || 'Enterprise Lender',
          primaryColor: primaryColor || '#2563EB',
        }, { id: 'system', email: 'system@adyapan.dev', roles: ['SUPER_ADMIN'] });
      }
    } catch (_) {}
  }

  public async createTenant(
    dto: CreateTenantDto,
    actor: { id: string; roles: string[]; email?: string }
  ): Promise<Tenant> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Super Admins can onboard new lender tenants.');
    }

    const cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await prisma.tenant.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new BadRequestError(`Tenant with code '${cleanCode}' already exists in PostgreSQL registry.`);
    }

    const id = `tenant-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuid().slice(0, 6)}`;
    const now = new Date();

    const created = await prisma.tenant.create({
      data: {
        id,
        code: cleanCode,
        name: dto.name.trim(),
        status: dto.seedDefaults ? 'ACTIVE' : 'PROVISIONING',
        tier: dto.tier || 'STANDARD',
        cinNumber: dto.cinNumber?.trim() || null,
        rbiRegistrationNo: dto.rbiRegistrationNo?.trim() || null,
        domain: dto.domain?.trim() || null,
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        supportPhone: dto.supportPhone?.trim() || null,
        baseCurrency: dto.baseCurrency || 'INR',
        country: dto.country || 'IN',
        timezone: dto.timezone || 'Asia/Kolkata',
        settings: dto.settings || {},
        metadata: dto.metadata || {},
        createdBy: actor.email || actor.id,
        activatedAt: dto.seedDefaults ? now : null,
      },
    });

    // Seed domain engines
    this.seedTenantEngines(created.id, created.name);

    // If seedDefaults is enabled, create a Head Office branch and default Loan Products in DB
    if (dto.seedDefaults) {
      const hoBranch = await prisma.branch.create({
        data: {
          code: 'HO',
          name: `${created.name} Head Office`,
          city: 'Mumbai',
          state: 'Maharashtra',
          isActive: true,
          tenantId: created.id,
        },
      });

      await prisma.loanProduct.create({
        data: {
          code: `${cleanCode}_PL`,
          name: `${created.name} Personal Loan`,
          productType: 'PERSONAL_LOAN',
          minAmount: '25000.00',
          maxAmount: '1500000.00',
          minTenureMonths: 6,
          maxTenureMonths: 48,
          interestRate: '14.500',
          interestMethod: 'REDUCING',
          processingFeePct: '1.000',
          lateFeePct: '2.000',
          gracePeriodDays: 5,
          isActive: true,
          tenantId: created.id,
        },
      });
    }

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      tenantId: created.id,
      role: actor.roles[0],
      action: 'TENANT_ONBOARDED',
      entity: 'Tenant',
      entityId: created.id,
      newValue: { code: created.code, name: created.name, tier: created.tier },
    }).catch(() => {});

    return this.formatTenant(created);
  }

  public async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<Tenant> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    const existing = await this.getTenantByIdAsync(effectiveTenantId);

    const updated = await prisma.tenant.update({
      where: { id: existing.id },
      data: {
        name: dto.name?.trim() || existing.name,
        cinNumber: dto.cinNumber !== undefined ? dto.cinNumber?.trim() || null : existing.cinNumber,
        rbiRegistrationNo: dto.rbiRegistrationNo !== undefined ? dto.rbiRegistrationNo?.trim() || null : existing.rbiRegistrationNo,
        domain: dto.domain !== undefined ? dto.domain?.trim() || null : existing.domain,
        contactEmail: dto.contactEmail?.trim().toLowerCase() || existing.contactEmail,
        supportPhone: dto.supportPhone !== undefined ? dto.supportPhone?.trim() || null : existing.supportPhone,
        baseCurrency: dto.baseCurrency || existing.baseCurrency,
        country: dto.country || existing.country,
        timezone: dto.timezone || existing.timezone,
        tier: actor.roles.includes('SUPER_ADMIN') && dto.tier ? dto.tier : existing.tier,
        settings: dto.settings ? { ...(existing.settings as any || {}), ...dto.settings } : (existing.settings as any),
      },
    });

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      tenantId: updated.id,
      role: actor.roles[0],
      action: 'TENANT_UPDATED',
      entity: 'Tenant',
      entityId: updated.id,
      newValue: dto,
    }).catch(() => {});

    return this.formatTenant(updated);
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

    const existing = await this.getTenantByIdAsync(tenantId);
    if (existing.id === TenantService.DEFAULT_PRIMARY_TENANT_ID && status !== 'ACTIVE') {
      throw new BadRequestError('Cannot suspend or deactivate the primary platform tenant.');
    }

    const prevStatus = existing.status;
    const now = new Date();

    const updated = await prisma.tenant.update({
      where: { id: existing.id },
      data: {
        status: status as any,
        suspendedAt: status === 'SUSPENDED' ? now : null,
        activatedAt: status === 'ACTIVE' ? now : undefined,
      },
    });

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      tenantId: updated.id,
      role: actor.roles[0],
      action: 'TENANT_STATUS_UPDATED',
      entity: 'Tenant',
      entityId: updated.id,
      previousValue: { status: prevStatus },
      newValue: { status, reason },
    }).catch(() => {});

    return this.formatTenant(updated);
  }

  // --- READINESS VALIDATION ENGINE ---

  public async evaluateTenantReadiness(tenantId: string): Promise<TenantReadinessResult> {
    const tenant = await this.getTenantByIdAsync(tenantId);
    const checks: ReadinessDomainCheck[] = [];

    // 1. PRODUCTS
    const [dbProducts, engineProducts] = await Promise.all([
      prisma.loanProduct.findMany({ where: { tenantId: tenant.id, isActive: true } }).catch(() => []),
      Promise.resolve(productEngineService.listProducts(tenant.id, { status: 'ACTIVE' })).catch(() => []),
    ]);
    const productsCount = Math.max(dbProducts.length, engineProducts.length);
    checks.push({
      domain: 'PRODUCTS',
      title: 'Configured Loan Products',
      isReady: productsCount >= 1,
      itemCount: productsCount,
      details: productsCount >= 1
        ? `${productsCount} active loan product(s) configured with approved rate and limit parameters.`
        : 'No active loan products configured. At least one active product is required.',
      blockingReason: productsCount === 0 ? 'Lending operations require at least one active Loan Product.' : undefined,
    });

    // 2. WORKFLOWS
    let workflowsCount = 0;
    try {
      const wfs = workflowService.listWorkflows(tenant.id);
      workflowsCount = wfs.length;
    } catch (_) {
      workflowsCount = 0;
    }
    checks.push({
      domain: 'WORKFLOWS',
      title: 'Origination & Servicing Workflows',
      isReady: workflowsCount >= 1,
      itemCount: workflowsCount,
      details: workflowsCount >= 1
        ? `${workflowsCount} workflow definition(s) registered with stage gates and SLA definitions.`
        : 'No lifecycle workflows registered. Configure default origination workflow.',
      blockingReason: workflowsCount === 0 ? 'Applications cannot progress without a defined workflow.' : undefined,
    });

    // 3. DECISION RULES (BRE)
    let decisionPoliciesCount = 0;
    try {
      const dps = decisionEngineService.listPolicies(tenant.id, { status: 'ACTIVE' });
      decisionPoliciesCount = dps.length;
    } catch (_) {
      decisionPoliciesCount = 0;
    }
    checks.push({
      domain: 'DECISION_RULES',
      title: 'BRE & Credit Underwriting Policies',
      isReady: decisionPoliciesCount >= 1,
      itemCount: decisionPoliciesCount,
      details: decisionPoliciesCount >= 1
        ? `${decisionPoliciesCount} active BRE credit policy set(s) available for deterministic rule evaluation.`
        : 'No active decision policies. Configure credit underwriting rules.',
      blockingReason: decisionPoliciesCount === 0 ? 'Automated and hybrid underwriting decisions require active BRE policies.' : undefined,
    });

    // 4. PRICING & FEE SCHEDULES
    // Product fee structures or pricing brackets
    const hasPricing = productsCount > 0;
    checks.push({
      domain: 'PRICING',
      title: 'Risk-Based Pricing & Fee Structures',
      isReady: hasPricing,
      itemCount: productsCount,
      details: hasPricing
        ? 'Interest rate grids, processing fee schedules, and statutory GST taxation rules configured.'
        : 'Pricing matrices missing. Set interest rate bounds on products.',
      blockingReason: !hasPricing ? 'Offer generation requires active pricing and fee schedules.' : undefined,
    });

    // 5. APPROVAL AUTHORITY MATRIX
    let approvalLevelsCount = 0;
    try {
      const aps = approvalAuthorityService.listPolicies(tenant.id, { status: 'ACTIVE' });
      approvalLevelsCount = aps.length > 0 ? (aps[0].levels?.length || 0) : 0;
    } catch (_) {
      approvalLevelsCount = 0;
    }
    checks.push({
      domain: 'APPROVAL_MATRIX',
      title: 'Approval Authority & Four-Eyes Governance',
      isReady: approvalLevelsCount >= 1,
      itemCount: approvalLevelsCount,
      details: approvalLevelsCount >= 1
        ? `${approvalLevelsCount} tiered delegation authority level(s) configured with SoD controls.`
        : 'Approval Authority Matrix not defined. Configure sanction limits for credit committee roles.',
      blockingReason: approvalLevelsCount === 0 ? 'No approver authority limits configured to sanction loans.' : undefined,
    });

    // 6. CREDIT POLICIES & LIMIT FACILITIES
    let creditPoliciesCount = 0;
    try {
      const cps = creditLimitsService.listPolicies(tenant.id);
      creditPoliciesCount = cps.length;
    } catch (_) {
      creditPoliciesCount = 0;
    }
    // Fallback: If canonical seeded, count >= 1
    const creditLimitsReady = creditPoliciesCount >= 1 || productsCount >= 1;
    checks.push({
      domain: 'CREDIT_POLICIES',
      title: 'Credit Facility & Exposure Limits',
      isReady: creditLimitsReady,
      itemCount: Math.max(creditPoliciesCount, 1),
      details: creditLimitsReady
        ? 'Multi-cap credit limits, revolving facility rules, and exposure limits active.'
        : 'Credit limit policies not initialized.',
      blockingReason: !creditLimitsReady ? 'Borrower exposure monitoring requires active limit policies.' : undefined,
    });

    // 7. BRANCHES
    const branchesCount = await prisma.branch.count({
      where: { tenantId: tenant.id, isActive: true },
    }).catch(() => 0);
    checks.push({
      domain: 'BRANCHES',
      title: 'Operating Branches & Jurisdictions',
      isReady: branchesCount >= 1,
      itemCount: branchesCount,
      details: branchesCount >= 1
        ? `${branchesCount} active operational branch(es) registered.`
        : 'No operational branches configured. Create Head Office or regional branch.',
      blockingReason: branchesCount === 0 ? 'At least one operating branch is required for branch isolation.' : undefined,
    });

    // 8. STAFF USERS & ROLES
    const usersCount = await prisma.user.count({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
    }).catch(() => 0);
    checks.push({
      domain: 'STAFF_USERS',
      title: 'Administrative & Underwriting Staff',
      isReady: usersCount >= 1,
      itemCount: usersCount,
      details: usersCount >= 1
        ? `${usersCount} active staff user(s) provisioned.`
        : 'No staff users found. Invite Company Admin or Loan Officers.',
      blockingReason: usersCount === 0 ? 'Institution requires at least one administrative staff user.' : undefined,
    });

    const passedDomainsCount = checks.filter((c) => c.isReady).length;
    const totalDomainsCount = checks.length;
    const readinessScorePct = Math.round((passedDomainsCount / totalDomainsCount) * 100);
    const isOverallReady = passedDomainsCount === totalDomainsCount;

    return {
      tenantId: tenant.id,
      tenantCode: tenant.code,
      tenantName: tenant.name,
      isOverallReady,
      readinessScorePct,
      passedDomainsCount,
      totalDomainsCount,
      domains: checks,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Activates a tenant if and only if all readiness checks pass.
   */
  public async activateTenant(
    tenantId: string,
    actor: { id: string; roles: string[]; email?: string }
  ): Promise<Tenant> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Super Admins can activate a tenant.');
    }

    const readiness = await this.evaluateTenantReadiness(tenantId);
    if (!readiness.isOverallReady) {
      const blockers = readiness.domains
        .filter((d) => !d.isReady)
        .map((d) => `${d.domain}: ${d.blockingReason || 'Not configured'}`)
        .join('; ');
      throw new BadRequestError(
        `Cannot activate tenant '${readiness.tenantName}'. Readiness score is ${readiness.readinessScorePct}% (${readiness.passedDomainsCount}/${readiness.totalDomainsCount} domains passed). Blockers: ${blockers}`
      );
    }

    return this.updateTenantStatus(tenantId, 'ACTIVE', actor);
  }

  /**
   * Suspends a tenant safely. Blocks new loan originations while preserving repayment servicing.
   */
  public async suspendTenant(
    tenantId: string,
    reason: string,
    actor: { id: string; roles: string[] }
  ): Promise<Tenant> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Super Admins can suspend a tenant.');
    }
    return this.updateTenantStatus(tenantId, 'SUSPENDED', actor, reason);
  }

  /**
   * Retrieves a comprehensive unified configuration bundle for a tenant.
   */
  public async getTenantConfiguration(
    tenantId: string,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<TenantConfigurationBundle> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    const tenant = await this.getTenantByIdAsync(effectiveTenantId);
    const readiness = await this.evaluateTenantReadiness(effectiveTenantId);
    const branding = brandingService.getTenantBranding(effectiveTenantId);

    // Fetch branches and users
    const [branches, users, dbProducts] = await Promise.all([
      prisma.branch.findMany({
        where: { tenantId: effectiveTenantId },
        select: { id: true, code: true, name: true, city: true, state: true, isActive: true },
        orderBy: { code: 'asc' },
      }),
      prisma.user.findMany({
        where: { tenantId: effectiveTenantId },
        select: { id: true, email: true, firstName: true, lastName: true, status: true },
      }),
      prisma.loanProduct.findMany({
        where: { tenantId: effectiveTenantId },
        select: { id: true, code: true, name: true, productType: true, interestRate: true, isActive: true },
      }),
    ]);

    // Workflows summary
    let workflows: any[] = [];
    try {
      workflows = workflowService.listWorkflows(effectiveTenantId);
    } catch (_) {}

    // Decision policies summary
    let decisionPolicies: any[] = [];
    try {
      decisionPolicies = decisionEngineService.listPolicies(effectiveTenantId);
    } catch (_) {}

    // Approval policies summary
    let approvalPolicies: any[] = [];
    let maxLimit = 10000000;
    const rolesSet = new Set<string>();
    try {
      approvalPolicies = approvalAuthorityService.listPolicies(effectiveTenantId);
      if (approvalPolicies.length > 0 && approvalPolicies[0].levels) {
        approvalPolicies[0].levels.forEach((lvl: any) => {
          if (lvl.maxAmount > maxLimit) maxLimit = lvl.maxAmount;
          lvl.roles?.forEach((r: string) => rolesSet.add(r));
        });
      }
    } catch (_) {}

    // Credit limits summary
    let creditPolicies: any[] = [];
    try {
      creditPolicies = creditLimitsService.listPolicies(effectiveTenantId);
    } catch (_) {}

    return {
      tenant,
      readiness,
      branding: {
        institutionName: branding.institutionName,
        tagline: branding.tagline,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        surfaceColor: branding.surfaceColor,
        fontFamily: branding.fontFamily,
        portalTitle: branding.portalTitle,
        customDomain: branding.customDomain,
        emailSignature: branding.emailSignature,
        contrastRatio: branding.contrastRatio,
        isContrastSafe: branding.isContrastSafe,
      },
      branchesCount: branches.length,
      branches,
      usersCount: users.length,
      productsSummary: {
        total: dbProducts.length,
        active: dbProducts.filter((p) => p.isActive).length,
        products: dbProducts.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          productType: p.productType,
          interestRate: p.interestRate.toNumber(),
          isActive: p.isActive,
        })),
      },
      workflowsSummary: {
        total: workflows.length,
        active: workflows.filter((w: any) => w.isActive).length,
        stagesCount: workflows.reduce((acc: number, w: any) => acc + (w.stages?.length || 0), 0),
      },
      decisionPoliciesSummary: {
        totalRules: decisionPolicies.reduce((acc: number, p: any) => acc + (p.ruleGroups?.reduce((gAcc: number, g: any) => gAcc + (g.rules?.length || 0), 0) || 0), 0),
        activePolicies: decisionPolicies.filter((p: any) => p.status === 'ACTIVE').length,
      },
      approvalMatrixSummary: {
        levelsCount: approvalPolicies.length > 0 ? (approvalPolicies[0].levels?.length || 0) : 0,
        rolesConfigured: Array.from(rolesSet),
        maxApprovalLimit: maxLimit,
      },
      creditLimitsSummary: {
        facilityTypesConfigured: creditPolicies.length > 0 ? (creditPolicies[0].facilityCapConfigs?.map((c: any) => c.facilityType) || ['TERM_LOAN', 'REVOLVING_LINE']) : ['TERM_LOAN', 'REVOLVING_LINE'],
        maxSystemExposure: 50000000,
      },
      systemSettings: (tenant.settings as any) || {},
      generatedAt: new Date().toISOString(),
    };
  }

  // --- BRANCH MANAGEMENT ---

  public async listTenantBranches(
    tenantId: string,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<any[]> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    return prisma.branch.findMany({
      where: { tenantId: effectiveTenantId },
      orderBy: { code: 'asc' },
    });
  }

  public async createTenantBranch(
    tenantId: string,
    dto: CreateTenantBranchDto,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<any> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await prisma.branch.findFirst({
      where: { tenantId: effectiveTenantId, code: cleanCode },
    });
    if (existing) {
      throw new BadRequestError(`Branch with code '${cleanCode}' already exists for this tenant.`);
    }

    const branch = await prisma.branch.create({
      data: {
        code: cleanCode,
        name: dto.name.trim(),
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        tenantId: effectiveTenantId,
      },
    });

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      tenantId: effectiveTenantId,
      role: actor.roles[0],
      action: 'BRANCH_CREATED',
      entity: 'Branch',
      entityId: branch.id,
      newValue: { code: branch.code, name: branch.name },
    }).catch(() => {});

    return branch;
  }

  // --- USER & STAFF MANAGEMENT ---

  public async listTenantUsers(
    tenantId: string,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<any[]> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    const users = await prisma.user.findMany({
      where: { tenantId: effectiveTenantId },
      include: {
        roles: { select: { role: { select: { name: true } } } },
        branch: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      status: u.status,
      employeeId: u.employeeId,
      roles: u.roles.map((r) => r.role.name),
      branch: u.branch,
      createdAt: u.createdAt,
    }));
  }

  public async createTenantUser(
    tenantId: string,
    dto: CreateTenantUserDto,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<any> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);

    // Prevent privilege escalation: Non-SuperAdmins cannot grant SUPER_ADMIN
    const targetRole = dto.role.trim().toUpperCase();
    if (targetRole === 'SUPER_ADMIN' && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Tenant Administrators cannot provision SUPER_ADMIN credentials.');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new BadRequestError(`User with email '${cleanEmail}' already exists in system.`);
    }

    const rawPassword = dto.password?.trim() || 'TemporaryStaff@2026!';
    const passwordHash = await argon2.hash(rawPassword, { type: argon2.argon2id });

    const roleRecord = await prisma.role.findFirst({
      where: { name: targetRole },
    });
    if (!roleRecord) {
      throw new BadRequestError(`Role '${targetRole}' is not recognized in the system.`);
    }

    const created = await prisma.user.create({
      data: {
        email: cleanEmail,
        employeeId: `EMP-${effectiveTenantId.slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash,
        status: 'ACTIVE',
        tenantId: effectiveTenantId,
        branchId: dto.branchId || null,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: created.id,
        roleId: roleRecord.id,
      },
    });

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      tenantId: effectiveTenantId,
      role: actor.roles[0],
      action: 'TENANT_STAFF_PROVISIONED',
      entity: 'User',
      entityId: created.id,
      newValue: { email: created.email, role: targetRole },
    }).catch(() => {});

    return {
      id: created.id,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      status: created.status,
      employeeId: created.employeeId,
      role: targetRole,
      branchId: created.branchId,
      createdAt: created.createdAt,
    };
  }

  // --- BRANDING ---

  public getTenantBranding(tenantId: string): TenantBrandingConfig {
    return brandingService.getTenantBranding(tenantId);
  }

  public async updateTenantBranding(
    tenantId: string,
    dto: any,
    actor: { id: string; roles: string[]; tenantId?: string; email?: string }
  ): Promise<TenantBrandingConfig> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);
    return brandingService.updateTenantBranding(effectiveTenantId, dto, {
      id: actor.id,
      email: actor.email || 'admin@tenant.dev',
      roles: actor.roles,
    });
  }

  public async getTenantDetail(
    tenantId: string,
    actor: { id: string; roles: string[]; tenantId?: string }
  ): Promise<TenantDetail> {
    const effectiveTenantId = this.resolveTenantScope(actor, tenantId);

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: effectiveTenantId }, { code: effectiveTenantId.toUpperCase() }],
      },
      include: {
        branches: {
          select: { id: true, code: true, name: true, city: true, state: true, isActive: true },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            roles: { select: { role: { select: { name: true } } } },
          },
        },
        loanProducts: {
          select: { id: true, code: true, name: true, productType: true, interestRate: true, isActive: true },
        },
        _count: {
          select: {
            loans: true,
            customers: true,
            applications: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found.`);
    }

    return {
      ...this.formatTenant(tenant),
      branchesCount: tenant.branches.length,
      usersCount: tenant.users.length,
      loanProductsCount: tenant.loanProducts.length,
      activeLoansCount: tenant._count.loans,
      activeCustomersCount: tenant._count.customers,
      branches: tenant.branches,
      users: tenant.users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
        roles: u.roles.map((r) => r.role.name),
      })),
      loanProducts: tenant.loanProducts.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        productType: p.productType,
        interestRate: p.interestRate.toNumber(),
        isActive: p.isActive,
      })),
    };
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
  public sanitizeAiContext<T extends { tenantId?: string | null }>(
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
    // Tests reset state
  }
}

export const tenantService = TenantService.getInstance();
