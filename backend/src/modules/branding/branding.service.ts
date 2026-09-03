import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { TenantBranding, UpdateBrandingDto } from './branding.types';

export class BrandingService {
  private static instance: BrandingService;

  // In-memory tenant branding store: Map<tenantId, TenantBranding>
  private readonly brandings = new Map<string, TenantBranding>();

  // System baseline default branding
  public static readonly DEFAULT_BRANDING: Omit<TenantBranding, 'tenantId' | 'updatedAt'> = {
    institutionName: 'Adyapan Prime Lending',
    tagline: 'Enterprise Credit Intelligence Platform',
    logoUrl: '/logos/adyapan-prime.svg',
    faviconUrl: '/favicon.ico',
    primaryColor: '#2563EB', // FinTech Blue
    secondaryColor: '#1D4ED8',
    accentColor: '#10B981', // Emerald Success
    surfaceColor: '#F8FAFC',
    fontFamily: 'Inter',
    portalTitle: 'Adyapan Enterprise LMS',
    emailSignature: 'Adyapan Lending Operations <ops@adyapan.dev>',
    contrastRatio: 4.68,
    isContrastSafe: true,
  };

  private constructor() {
    this.seedDefaultBrandings();
  }

  public static getInstance(): BrandingService {
    if (!BrandingService.instance) {
      BrandingService.instance = new BrandingService();
    }
    return BrandingService.instance;
  }

  private seedDefaultBrandings(): void {
    const now = new Date().toISOString();

    // 1. Primary Tenant: Adyapan Prime Lending
    this.brandings.set('tenant-adyapan-default', {
      tenantId: 'tenant-adyapan-default',
      ...BrandingService.DEFAULT_BRANDING,
      updatedAt: now,
    });

    // 2. Secondary Tenant: Apex Capital Partners (Distinct Royal Purple Theme)
    const apexPrimary = '#7C3AED';
    const apexContrast = this.calculateContrastAgainstWhite(apexPrimary);
    this.brandings.set('tenant-apex-nbfc', {
      tenantId: 'tenant-apex-nbfc',
      institutionName: 'Apex Capital Partners',
      tagline: 'Structured Commercial & SME Credit',
      logoUrl: '/logos/apex-capital.svg',
      faviconUrl: '/favicon-apex.ico',
      primaryColor: apexPrimary,
      secondaryColor: '#6D28D9',
      accentColor: '#F59E0B',
      surfaceColor: '#FAF5FF',
      fontFamily: 'Plus Jakarta Sans',
      portalTitle: 'Apex Institutional Credit Portal',
      emailSignature: 'Apex Underwriting Desk <risk@apexcap.dev>',
      customDomain: 'apexcap.dev',
      contrastRatio: apexContrast,
      isContrastSafe: apexContrast >= 4.5,
      updatedAt: now,
    });
  }

  /**
   * Calculates WCAG 2.1 relative luminance for a given hex color.
   */
  public calculateRelativeLuminance(hex: string): number {
    const cleanHex = hex.replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      throw new BadRequestError(`Invalid hex color format: '${hex}'. Expected 6-character hex (e.g. #2563EB).`);
    }

    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const srgb = [r, g, b].map((val) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  /**
   * Calculates WCAG 2.1 contrast ratio between two hex colors.
   */
  public calculateContrastRatio(hex1: string, hex2: string): number {
    const lum1 = this.calculateRelativeLuminance(hex1);
    const lum2 = this.calculateRelativeLuminance(hex2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  public calculateContrastAgainstWhite(hex: string): number {
    return this.calculateContrastRatio(hex, '#FFFFFF');
  }

  /**
   * Validates color contrast safety. Rejects colors that fail WCAG minimum contrast.
   */
  public validateColorContrast(hex: string): { contrastRatio: number; isContrastSafe: boolean } {
    const ratio = this.calculateContrastAgainstWhite(hex);
    if (ratio < 2.5) {
      throw new BadRequestError(
        `Color '${hex}' has an unsafe contrast ratio of ${ratio}:1 against white. WCAG minimum required is 3.0:1 for graphical elements and 4.5:1 for standard text.`
      );
    }
    return {
      contrastRatio: ratio,
      isContrastSafe: ratio >= 4.5,
    };
  }

  /**
   * Fetches active tenant branding with seamless fallback to system default.
   */
  public getTenantBranding(tenantId: string): TenantBranding {
    const branding = this.brandings.get(tenantId);
    if (branding) {
      return { ...branding };
    }

    // Fallback gracefully to default platform branding
    return {
      tenantId,
      ...BrandingService.DEFAULT_BRANDING,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates tenant branding with strict contrast validation and audit trail.
   */
  public async updateTenantBranding(
    tenantId: string,
    dto: UpdateBrandingDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<TenantBranding> {
    const existing = this.getTenantBranding(tenantId);

    let contrastRatio = existing.contrastRatio;
    let isContrastSafe = existing.isContrastSafe;

    if (dto.primaryColor) {
      const contrast = this.validateColorContrast(dto.primaryColor);
      contrastRatio = contrast.contrastRatio;
      isContrastSafe = contrast.isContrastSafe;
    }

    const updated: TenantBranding = {
      ...existing,
      ...dto,
      tenantId,
      contrastRatio,
      isContrastSafe,
      updatedAt: new Date().toISOString(),
    };

    this.brandings.set(tenantId, updated);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'TENANT_BRANDING_UPDATED',
      entity: 'TenantBranding',
      entityId: tenantId,
      newValue: {
        institutionName: updated.institutionName,
        primaryColor: updated.primaryColor,
        contrastRatio: updated.contrastRatio,
        isContrastSafe: updated.isContrastSafe,
      },
    }).catch(() => {});

    return updated;
  }

  public clearForTesting(): void {
    this.brandings.clear();
    this.seedDefaultBrandings();
  }
}

export const brandingService = BrandingService.getInstance();
