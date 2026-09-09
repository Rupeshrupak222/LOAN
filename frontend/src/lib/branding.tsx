'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface TenantBranding {
  tenantId: string;
  institutionName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  portalTitle: string;
  emailSignature: string;
  customDomain?: string;
  contrastRatio: number;
  isContrastSafe: boolean;
}

export const DEFAULT_BRANDING: TenantBranding = {
  tenantId: 'tenant-adyapan-default',
  institutionName: 'Adyapan Prime Lending',
  tagline: 'Enterprise Credit Intelligence Platform',
  logoUrl: '/logos/adyapan-prime.svg',
  faviconUrl: '/favicon.ico',
  primaryColor: '#2563EB',
  secondaryColor: '#1D4ED8',
  accentColor: '#10B981',
  surfaceColor: '#F8FAFC',
  fontFamily: 'Inter',
  portalTitle: 'Adyapan Enterprise LMS',
  emailSignature: 'Adyapan Lending Operations <ops@adyapan.dev>',
  contrastRatio: 4.68,
  isContrastSafe: true,
};

interface BrandingContextType {
  branding: TenantBranding;
  activeTenantId: string;
  switchTenantBrand: (tenantId: string) => void;
  previewBranding: (override: Partial<TenantBranding>) => void;
  resetPreview: () => void;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  activeTenantId: 'tenant-adyapan-default',
  switchTenantBrand: () => {},
  previewBranding: () => {},
  resetPreview: () => {},
  isLoading: false,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant-adyapan-default');
  const [previewOverride, setPreviewOverride] = useState<Partial<TenantBranding> | null>(null);

  // Fetch active branding from backend
  const { data: serverBranding, isLoading } = useQuery({
    queryKey: ['branding-active', activeTenantId],
    queryFn: async () => {
      const res = await api.get(`/branding/${activeTenantId}`);
      return res.data?.data as TenantBranding;
    },
    initialData: DEFAULT_BRANDING,
  });

  const activeBranding: TenantBranding = {
    ...DEFAULT_BRANDING,
    ...(serverBranding || {}),
    ...(previewOverride || {}),
  };

  // Dynamically inject CSS variables into document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', activeBranding.primaryColor);
      root.style.setProperty('--brand-secondary', activeBranding.secondaryColor);
      root.style.setProperty('--brand-accent', activeBranding.accentColor);
      root.style.setProperty('--brand-surface', activeBranding.surfaceColor);

      if (activeBranding.portalTitle) {
        document.title = `${activeBranding.institutionName} | ${activeBranding.portalTitle}`;
      }
    }
  }, [activeBranding]);

  const switchTenantBrand = (tenantId: string) => {
    setPreviewOverride(null);
    setActiveTenantId(tenantId);
  };

  const previewBranding = (override: Partial<TenantBranding>) => {
    setPreviewOverride(override);
  };

  const resetPreview = () => {
    setPreviewOverride(null);
  };

  return (
    <BrandingContext.Provider
      value={{
        branding: activeBranding,
        activeTenantId,
        switchTenantBrand,
        previewBranding,
        resetPreview,
        isLoading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
