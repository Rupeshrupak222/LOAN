import { v4 as uuid } from 'uuid';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import {
  ConfigArea,
  CreateDraftConfigDto,
  FoirDtiParameters,
  EligibilityParameters,
  RiskParameters,
  UnderwritingParameters,
  CollectionsParameters,
  TenantPolicyConfig,
} from './configuration.types';

export class ConfigurationService {
  private static instance: ConfigurationService;

  // In-memory versioned repository: Map<configId, TenantPolicyConfig>
  private readonly configs = new Map<string, TenantPolicyConfig>();

  // System default baseline parameters
  private readonly systemDefaults: Record<ConfigArea, Record<string, any>> = {
    FOIR_DTI: {
      maxDtiRatio: 0.55, // 55% Default Maximum DTI
      warningDtiRatio: 0.45, // 45% Warning DTI threshold
      allowCoApplicantIncome: true,
      rentalIncomeHaircutPct: 20,
    },
    ELIGIBILITY: {
      minAge: 21,
      maxAge: 60,
      minSalariedIncome: 25000,
      minBusinessIncome: 50000,
      allowedEmploymentTypes: ['SALARIED', 'SELF_EMPLOYED_BUSINESS', 'SELF_EMPLOYED_PROFESSIONAL'],
    },
    RISK: {
      minBureauScore: 650,
      maxRiskScoreThreshold: 70,
      highRiskCutoff: 75,
      maxFoirDeviationAllowed: 0.05,
      requireFieldVerificationAboveAmount: 200000,
    },
    UNDERWRITING: {
      singleSignoffLimit: 50000,
      committeeSignoffLimit: 500000,
      mandatoryExceptionSignoff: true,
      maxTurnaroundHours: 24,
    },
    DOCUMENTS: {
      requiredCategories: ['IDENTITY', 'ADDRESS', 'INCOME', 'BANK_STATEMENT'],
      optionalCategories: ['BUSINESS', 'COLLATERAL'],
      mandatoryBankStatementMonths: 6,
    },
    COLLECTIONS: {
      gracePeriodDays: 3,
      softCollectionDpdCutoff: 30,
      hardCollectionDpdCutoff: 60,
      legalEscalationDpd: 90,
      maxPtpHours: 72,
    },
    NOTIFICATIONS: {
      sendSanctionEmail: true,
      sendEmiReminderSms: true,
      sendDisbursementWhatsapp: true,
      quietHoursStart: '19:00',
      quietHoursEnd: '08:00',
    },
  };

  private constructor() {
    this.seedDefaultConfigurations();
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  private seedDefaultConfigurations(): void {
    const now = new Date().toISOString();

    // Seed Tenant A (Primary: Adyapan Prime Lending - Default baseline)
    for (const [area, params] of Object.entries(this.systemDefaults)) {
      const cfgId = `cfg-adyapan-${area.toLowerCase()}-v1`;
      this.configs.set(cfgId, {
        id: cfgId,
        tenantId: 'tenant-adyapan-default',
        area: area as ConfigArea,
        version: 1,
        state: 'PUBLISHED',
        effectiveFrom: now,
        parameters: { ...params },
        changelog: 'Initial baseline enterprise lending configuration',
        createdBy: 'system',
        publishedBy: 'system',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed Tenant B (Apex Capital Partners - Custom Conservative Policy)
    // Example: Apex NBFC enforces tighter 45% FOIR limit and ₹100,000 signoff limit
    const apexFoirId = 'cfg-apex-foir_dti-v1';
    this.configs.set(apexFoirId, {
      id: apexFoirId,
      tenantId: 'tenant-apex-nbfc',
      area: 'FOIR_DTI',
      version: 1,
      state: 'PUBLISHED',
      effectiveFrom: now,
      parameters: {
        maxDtiRatio: 0.45, // 45% strict limit (vs 55% Adyapan default)
        warningDtiRatio: 0.35,
        allowCoApplicantIncome: true,
        rentalIncomeHaircutPct: 30,
      },
      changelog: 'Conservative institutional risk policy for prime borrowers',
      createdBy: 'system',
      publishedBy: 'system',
      createdAt: now,
      updatedAt: now,
    });

    const apexUnderwritingId = 'cfg-apex-underwriting-v1';
    this.configs.set(apexUnderwritingId, {
      id: apexUnderwritingId,
      tenantId: 'tenant-apex-nbfc',
      area: 'UNDERWRITING',
      version: 1,
      state: 'PUBLISHED',
      effectiveFrom: now,
      parameters: {
        singleSignoffLimit: 100000, // ₹1,00,000 single officer limit
        committeeSignoffLimit: 1000000,
        mandatoryExceptionSignoff: true,
        maxTurnaroundHours: 12,
      },
      changelog: 'Apex underwriting hierarchy sign-off limits',
      createdBy: 'system',
      publishedBy: 'system',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Resolves configuration with strict precedence:
   * System Default -> Tenant Active Configuration -> Optional Product Override
   */
  public getTenantConfig<T = Record<string, any>>(
    tenantId: string,
    area: ConfigArea,
    productOverride?: Partial<T>
  ): T {
    const baseDefault = this.systemDefaults[area] || {};

    const activePublished = Array.from(this.configs.values())
      .filter((c) => c.tenantId === tenantId && c.area === area && c.state === 'PUBLISHED')
      .sort((a, b) => b.version - a.version)[0];

    const tenantParams = activePublished ? activePublished.parameters : {};

    return {
      ...baseDefault,
      ...tenantParams,
      ...(productOverride || {}),
    } as T;
  }

  public getActiveConfigRecord(tenantId: string, area: ConfigArea): TenantPolicyConfig | undefined {
    return Array.from(this.configs.values())
      .filter((c) => c.tenantId === tenantId && c.area === area && c.state === 'PUBLISHED')
      .sort((a, b) => b.version - a.version)[0];
  }

  public listConfigVersions(tenantId: string, area: ConfigArea): TenantPolicyConfig[] {
    return Array.from(this.configs.values())
      .filter((c) => c.tenantId === tenantId && c.area === area)
      .sort((a, b) => b.version - a.version);
  }

  public validateParameters(area: ConfigArea, params: Record<string, any>): void {
    if (area === 'FOIR_DTI') {
      const p = params as Partial<FoirDtiParameters>;
      if (typeof p.maxDtiRatio === 'number') {
        if (p.maxDtiRatio <= 0 || p.maxDtiRatio > 1.0) {
          throw new BadRequestError('maxDtiRatio must be greater than 0 and less than or equal to 1.0 (100%).');
        }
      }
      if (typeof p.warningDtiRatio === 'number' && typeof p.maxDtiRatio === 'number') {
        if (p.warningDtiRatio > p.maxDtiRatio) {
          throw new BadRequestError('warningDtiRatio cannot exceed maxDtiRatio.');
        }
      }
    }

    if (area === 'ELIGIBILITY') {
      const p = params as Partial<EligibilityParameters>;
      if (typeof p.minAge === 'number' && typeof p.maxAge === 'number') {
        if (p.minAge < 18 || p.maxAge > 75 || p.minAge >= p.maxAge) {
          throw new BadRequestError('Invalid age criteria: minAge must be at least 18 and less than maxAge (up to 75).');
        }
      }
      if (typeof p.minSalariedIncome === 'number' && p.minSalariedIncome <= 0) {
        throw new BadRequestError('minSalariedIncome must be greater than 0.');
      }
    }

    if (area === 'UNDERWRITING') {
      const p = params as Partial<UnderwritingParameters>;
      if (typeof p.singleSignoffLimit === 'number' && typeof p.committeeSignoffLimit === 'number') {
        if (p.singleSignoffLimit <= 0 || p.singleSignoffLimit > p.committeeSignoffLimit) {
          throw new BadRequestError('singleSignoffLimit must be greater than 0 and cannot exceed committeeSignoffLimit.');
        }
      }
    }

    if (area === 'COLLECTIONS') {
      const p = params as Partial<CollectionsParameters>;
      if (typeof p.softCollectionDpdCutoff === 'number' && typeof p.hardCollectionDpdCutoff === 'number') {
        if (p.softCollectionDpdCutoff >= p.hardCollectionDpdCutoff) {
          throw new BadRequestError('softCollectionDpdCutoff must be less than hardCollectionDpdCutoff.');
        }
      }
    }
  }

  public async saveDraftConfig(
    tenantId: string,
    dto: CreateDraftConfigDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<TenantPolicyConfig> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot manage lender policy configurations.');
    }

    this.validateParameters(dto.area, dto.parameters);

    const versions = this.listConfigVersions(tenantId, dto.area);
    const nextVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;
    const now = new Date().toISOString();

    const configId = `cfg-${tenantId.replace('tenant-', '')}-${dto.area.toLowerCase()}-v${nextVersion}`;

    const draftConfig: TenantPolicyConfig = {
      id: configId,
      tenantId,
      area: dto.area,
      version: nextVersion,
      state: 'DRAFT',
      effectiveFrom: now,
      parameters: { ...dto.parameters },
      changelog: dto.changelog.trim(),
      createdBy: actor.email,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(draftConfig.id, draftConfig);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_CONFIG_DRAFT_CREATED',
      entity: 'TenantPolicyConfig',
      entityId: draftConfig.id,
      newValue: { area: draftConfig.area, version: draftConfig.version, parameters: draftConfig.parameters },
    }).catch(() => {});

    return draftConfig;
  }

  public async publishConfig(
    tenantId: string,
    configId: string,
    actor: { id: string; email: string; roles: string[] },
    effectiveFrom?: string
  ): Promise<TenantPolicyConfig> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot publish policy configurations.');
    }

    const config = this.configs.get(configId);
    if (!config || config.tenantId !== tenantId) {
      throw new NotFoundError(`Configuration '${configId}' not found for tenant '${tenantId}'.`);
    }

    if (config.state === 'PUBLISHED') {
      return config;
    }

    // Archive previous published configurations for this area
    const now = new Date().toISOString();
    for (const c of this.configs.values()) {
      if (c.tenantId === tenantId && c.area === config.area && c.state === 'PUBLISHED') {
        c.state = 'ARCHIVED';
        c.effectiveTo = effectiveFrom || now;
        c.updatedAt = now;
      }
    }

    config.state = 'PUBLISHED';
    config.publishedBy = actor.email;
    config.effectiveFrom = effectiveFrom || now;
    config.updatedAt = now;

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_CONFIG_PUBLISHED',
      entity: 'TenantPolicyConfig',
      entityId: config.id,
      newValue: {
        area: config.area,
        version: config.version,
        publishedBy: config.publishedBy,
        effectiveFrom: config.effectiveFrom,
      },
    }).catch(() => {});

    return config;
  }

  public async rollbackConfig(
    tenantId: string,
    area: ConfigArea,
    targetVersion: number,
    actor: { id: string; email: string; roles: string[] },
    reason: string
  ): Promise<TenantPolicyConfig> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot rollback policy configurations.');
    }

    const targetConfig = Array.from(this.configs.values()).find(
      (c) => c.tenantId === tenantId && c.area === area && c.version === targetVersion
    );

    if (!targetConfig) {
      throw new NotFoundError(`Target version '${targetVersion}' not found for area '${area}'.`);
    }

    // Create a new published version with the rolled back parameters to preserve full linear audit history
    const versions = this.listConfigVersions(tenantId, area);
    const nextVersion = Math.max(...versions.map((v) => v.version)) + 1;
    const now = new Date().toISOString();

    const rollbackConfigId = `cfg-${tenantId.replace('tenant-', '')}-${area.toLowerCase()}-v${nextVersion}-rollback`;

    // Archive current active
    for (const c of this.configs.values()) {
      if (c.tenantId === tenantId && c.area === area && c.state === 'PUBLISHED') {
        c.state = 'ARCHIVED';
        c.effectiveTo = now;
        c.updatedAt = now;
      }
    }

    const newConfig: TenantPolicyConfig = {
      id: rollbackConfigId,
      tenantId,
      area,
      version: nextVersion,
      state: 'PUBLISHED',
      effectiveFrom: now,
      parameters: { ...targetConfig.parameters },
      changelog: `Rollback to version ${targetVersion}. Reason: ${reason.trim()}`,
      createdBy: actor.email,
      publishedBy: actor.email,
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(newConfig.id, newConfig);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_CONFIG_ROLLED_BACK',
      entity: 'TenantPolicyConfig',
      entityId: newConfig.id,
      newValue: {
        area,
        restoredFromVersion: targetVersion,
        newVersion: nextVersion,
        reason,
      },
    }).catch(() => {});

    return newConfig;
  }

  public clearForTesting(): void {
    this.configs.clear();
    this.seedDefaultConfigurations();
  }
}

export const configurationService = ConfigurationService.getInstance();
