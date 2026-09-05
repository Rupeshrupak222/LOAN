// Step 23: White-Label / Branding Engine Types

export interface TenantBranding {
  tenantId: string;
  institutionName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string; // hex (e.g. #2563EB)
  secondaryColor: string; // hex (e.g. #1D4ED8)
  accentColor: string; // hex (e.g. #10B981)
  surfaceColor: string; // hex (e.g. #F8FAFC)
  fontFamily: 'Inter' | 'Plus Jakarta Sans' | 'Outfit' | 'System';
  portalTitle: string;
  emailSignature: string;
  customDomain?: string;
  contrastRatio: number; // WCAG AA relative luminance ratio against white
  isContrastSafe: boolean; // contrastRatio >= 4.5
  updatedAt: string;
}

export interface UpdateBrandingDto {
  institutionName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  fontFamily?: 'Inter' | 'Plus Jakarta Sans' | 'Outfit' | 'System';
  portalTitle?: string;
  emailSignature?: string;
  customDomain?: string;
}
