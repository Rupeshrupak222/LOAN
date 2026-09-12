import React from 'react';
import Link from 'next/link';
import { Building2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useTenantConfiguration } from './hooks/useTenants';
import { TenantConfigurationCenter } from './TenantConfigurationCenter';

interface TenantDetailProps {
  tenantId: string;
}

export const TenantDetailView: React.FC<TenantDetailProps> = ({ tenantId }) => {
  const { data: bundle, isLoading, isError, error, refetch } = useTenantConfiguration(tenantId);

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
        <h3 className="text-lg font-bold text-white">Failed to Load Institution Configuration</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as any)?.response?.data?.message || (error as any)?.message || 'Unable to retrieve institutional configuration.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/tenants"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Return to Institutions Directory
          </Link>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/tenants"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Institutions Directory</span>
        </Link>
      </div>

      <TenantConfigurationCenter bundle={bundle} isSuperAdmin={true} />
    </div>
  );
};
