'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useTenantConfiguration } from '@/features/tenants/hooks/useTenants';
import { TenantConfigurationCenter } from '@/features/tenants/TenantConfigurationCenter';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function TenantSettingsPage() {
  const { user } = useAuth();
  const effectiveTenantId = user?.tenantId || 'tenant-adyapan-default';
  const { data: bundle, isLoading, isError, error, refetch } = useTenantConfiguration(effectiveTenantId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !bundle) {
    return (
      <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Failed to Load Institutional Configuration</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'Unable to retrieve configuration for this institution.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || false;

  return <TenantConfigurationCenter bundle={bundle} isSuperAdmin={isSuperAdmin} />;
}
