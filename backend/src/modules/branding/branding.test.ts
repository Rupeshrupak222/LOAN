import { describe, it, expect, beforeEach, vi } from 'vitest';
import { brandingService } from './branding.service';
import { BadRequestError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Step 23: White-Label / Branding Engine', () => {
  beforeEach(() => {
    brandingService.clearForTesting();
  });

  describe('1. Institutional Multi-Tenant Branding Profiles', () => {
    it('provides distinct institutional branding for Tenant A and Tenant B', () => {
      const tenantA = brandingService.getTenantBranding('tenant-adyapan-default');
      expect(tenantA.institutionName).toBe('Adyapan Prime Lending');
      expect(tenantA.primaryColor).toBe('#2563EB');
      expect(tenantA.portalTitle).toBe('Adyapan Enterprise LMS');

      const tenantB = brandingService.getTenantBranding('tenant-apex-nbfc');
      expect(tenantB.institutionName).toBe('Apex Capital Partners');
      expect(tenantB.primaryColor).toBe('#7C3AED'); // Distinct Royal Purple
      expect(tenantB.portalTitle).toBe('Apex Institutional Credit Portal');
    });

    it('falls back seamlessly to system default branding when tenant brand is unspecified', () => {
      const fallback = brandingService.getTenantBranding('tenant-unconfigured-nbfc');
      expect(fallback).toBeDefined();
      expect(fallback.institutionName).toBe('Adyapan Prime Lending');
      expect(fallback.primaryColor).toBe('#2563EB');
      expect(fallback.isContrastSafe).toBe(true);
    });
  });

  describe('2. WCAG 2.1 Contrast Safety & Relative Luminance', () => {
    it('accurately calculates relative luminance and contrast ratio', () => {
      // Pure black (#000000) on white (#FFFFFF) has 21:1 contrast
      const maxContrast = brandingService.calculateContrastRatio('#000000', '#FFFFFF');
      expect(maxContrast).toBe(21);

      // White on white has 1:1 contrast
      const minContrast = brandingService.calculateContrastRatio('#FFFFFF', '#FFFFFF');
      expect(minContrast).toBe(1);

      // Standard Blue on white passes WCAG AA (> 4.5:1)
      const blueContrast = brandingService.calculateContrastAgainstWhite('#2563EB');
      expect(blueContrast).toBeGreaterThan(4.5);
    });

    it('rejects low-contrast unreadable primary colors that violate accessibility', () => {
      // Pale yellow on white has ~1.07:1 contrast (completely unreadable)
      expect(() => {
        brandingService.validateColorContrast('#FFFF55');
      }).toThrow(BadRequestError);

      // Light gray on white has ~1.4:1 contrast
      expect(() => {
        brandingService.validateColorContrast('#E5E7EB');
      }).toThrow(BadRequestError);
    });

    it('rejects malformed hex color formats', () => {
      expect(() => {
        brandingService.calculateRelativeLuminance('not-a-color');
      }).toThrow(BadRequestError);

      expect(() => {
        brandingService.calculateRelativeLuminance('#FFF'); // Must be 6 digits
      }).toThrow(BadRequestError);
    });
  });

  describe('3. Institutional Branding Customization & Persistence', () => {
    it('updates tenant branding and validates contrast before saving', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      // Update to Deep Indigo (#4338CA - contrast ~7.8:1)
      const updated = await brandingService.updateTenantBranding(
        'tenant-apex-nbfc',
        {
          primaryColor: '#4338CA',
          tagline: 'Premier Institutional Commercial Lending',
        },
        actor
      );

      expect(updated.primaryColor).toBe('#4338CA');
      expect(updated.tagline).toBe('Premier Institutional Commercial Lending');
      expect(updated.isContrastSafe).toBe(true);

      // Verify persistence
      const reloaded = brandingService.getTenantBranding('tenant-apex-nbfc');
      expect(reloaded.primaryColor).toBe('#4338CA');
    });

    it('rejects update if proposed primary color fails WCAG minimum threshold', async () => {
      const actor = { id: 'usr-admin-1', email: 'admin@apexcap.dev', roles: ['ADMIN'] };

      await expect(
        brandingService.updateTenantBranding(
          'tenant-apex-nbfc',
          { primaryColor: '#FFFFA0' },
          actor
        )
      ).rejects.toThrow(BadRequestError);
    });
  });
});
