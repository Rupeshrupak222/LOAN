import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Building2,
  Users,
  Sliders,
  ShieldCheck,
  CreditCard,
  GitBranch,
} from 'lucide-react';
import type { TenantReadinessResult, TenantReadinessDomain } from './types';
import { useActivateTenant } from './hooks/useTenants';

interface TenantReadinessWidgetProps {
  readiness: TenantReadinessResult;
  onNavigateTab?: (tabKey: string) => void;
  canActivate?: boolean;
}

const DOMAIN_ICONS: Record<TenantReadinessDomain, React.ReactNode> = {
  PRODUCTS: <Layers className="w-5 h-5 text-blue-400" />,
  WORKFLOWS: <GitBranch className="w-5 h-5 text-indigo-400" />,
  DECISION_RULES: <Sliders className="w-5 h-5 text-purple-400" />,
  PRICING: <CreditCard className="w-5 h-5 text-emerald-400" />,
  APPROVAL_MATRIX: <ShieldCheck className="w-5 h-5 text-amber-400" />,
  CREDIT_POLICIES: <ShieldAlert className="w-5 h-5 text-rose-400" />,
  BRANCHES: <Building2 className="w-5 h-5 text-cyan-400" />,
  STAFF_USERS: <Users className="w-5 h-5 text-teal-400" />,
};

const DOMAIN_TAB_MAP: Record<TenantReadinessDomain, string> = {
  PRODUCTS: 'products',
  WORKFLOWS: 'workflows',
  DECISION_RULES: 'bre',
  PRICING: 'products',
  APPROVAL_MATRIX: 'approval',
  CREDIT_POLICIES: 'credit-limits',
  BRANCHES: 'branches',
  STAFF_USERS: 'users',
};

export const TenantReadinessWidget: React.FC<TenantReadinessWidgetProps> = ({
  readiness,
  onNavigateTab,
  canActivate = true,
}) => {
  const activateMutation = useActivateTenant();
  const isAllReady = readiness.isOverallReady;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Tenant Readiness & Governance Engine
              </h3>
              <p className="text-sm text-slate-400">
                Multi-domain validation gate ensuring operational compliance before institution activation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-white">
              {readiness.readinessScorePct}%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {readiness.passedDomainsCount} of {readiness.totalDomainsCount} Domains Ready
            </div>
          </div>

          <div className="w-16 h-16 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isAllReady ? 'text-emerald-500' : 'text-blue-500'}
                strokeDasharray={`${readiness.readinessScorePct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute font-bold text-xs text-white">
              {readiness.readinessScorePct}%
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar & Action Banner */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          {isAllReady ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Institutional Readiness: 100% Verified. Ready for live origination.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>
                Configuration Incomplete: {readiness.totalDomainsCount - readiness.passedDomainsCount} domain(s) require setup.
              </span>
            </div>
          )}
        </div>

        {canActivate && (
          <button
            onClick={() => activateMutation.mutate(readiness.tenantId)}
            disabled={!isAllReady || activateMutation.isPending}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              isAllReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {activateMutation.isPending ? (
              'Activating Institution...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Activate Institution</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Domain Checklist Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {readiness.domains.map((check) => {
          const isDomainReady = check.isReady;
          return (
            <div
              key={check.domain}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isDomainReady
                  ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                      {DOMAIN_ICONS[check.domain]}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">{check.title}</h4>
                      <span className="text-xs text-slate-400 font-mono uppercase">{check.domain}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDomainReady
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isDomainReady ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready ({check.itemCount})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Blocker</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed">{check.details}</p>

                {check.blockingReason && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{check.blockingReason}</span>
                  </div>
                )}
              </div>

              {onNavigateTab && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end">
                  <button
                    onClick={() => onNavigateTab(DOMAIN_TAB_MAP[check.domain])}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Configure in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
