'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
  ShieldCheck,
  ShieldAlert,
  Building,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface DecisionIntelligenceData {
  generatedAt: string;
  dataAsOf: string;
  model: string;
  roleScope: string;
  executiveSummary: string;
  kpisInterpretation: {
    kpi: string;
    currentValue: string;
    status: 'HEALTHY' | 'WATCH' | 'CRITICAL';
    interpretation: string;
  }[];
  keyChanges: {
    metric: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    observation: string;
    possibleDriver: string;
  }[];
  bottlenecks: {
    stage: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    impact: string;
    suggestedInvestigation: string;
  }[];
  branchInsights: {
    branchName: string;
    status: 'STRONG' | 'STABLE' | 'NEEDS_ATTENTION';
    observations: string;
  }[];
  collectionInsights: {
    totalOverdue: number;
    parRatio: string;
    delinquencyTrajectory: string;
    observations: string;
  };
  whatShouldILookAt: {
    priority: number;
    area: string;
    reason: string;
    recommendedAction: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function DecisionIntelligenceCard() {
  const { isDark } = useTheme();
  const [data, setData] = useState<DecisionIntelligenceData | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/dashboard/decision-intelligence');
      return res.data?.data as DecisionIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
    },
    onError: (err: any) => {
      alert(`Decision Intelligence Error: ${apiErrorMessage(err)}`);
    },
  });

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 md:p-6 my-1 transition-all shadow-sm overflow-hidden',
        isDark
          ? 'bg-gradient-to-b from-[#111936] to-[#0A0E24] border-[#202B52] text-white'
          : 'bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white border-blue-200/80 text-slate-900'
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3.5 border-b border-blue-100 dark:border-[#202B52]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">AI Executive Decision Intelligence</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                Gemini Synthesized
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Transforming raw portfolio telemetry into explainable executive decision support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Data as of {new Date(data.dataAsOf).toLocaleTimeString()}
            </span>
          )}

          <Button
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-sm cursor-pointer text-xs py-1"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Evaluating Telemetry...</span>
              </>
            ) : data ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh AI Insights</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>Analyze Dashboard with AI</span>
              </>
            )}
          </Button>

          {data && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {data ? (
        isExpanded && (
          <div className="mt-4 space-y-4 animate-in fade-in text-xs">
            {/* Executive Summary */}
            <div
              className={cn(
                'p-3.5 rounded-xl border leading-relaxed font-medium',
                isDark ? 'bg-[#0B1129] border-[#1F2B57] text-slate-200' : 'bg-white border-blue-200/80 text-slate-800'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Portfolio Briefing:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Confidence: <strong className="text-emerald-400">{data.confidence}</strong>
                </span>
              </div>
              <p className="text-xs">{data.executiveSummary}</p>
            </div>

            {/* "What Should I Look At?" Prioritized Focus Radar */}
            {data.whatShouldILookAt.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs">
                  <Activity className="h-4 w-4 text-rose-500" />
                  <span>Prioritized Executive Attention Radar</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {data.whatShouldILookAt.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-xl border space-y-1',
                        idx === 0
                          ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/60'
                          : 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">{item.area}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase">
                          Priority #{item.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{item.reason}</p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                        <strong>Next Step:</strong> {item.recommendedAction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPIs Interpretation Grid */}
            {data.kpisInterpretation.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span>Telemetry Interpretation & "Why Did This Change?"</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.kpisInterpretation.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white/70 dark:bg-[#0D1533] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">{kpi.kpi}</span>
                        <span
                          className={cn(
                            'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase',
                            kpi.status === 'CRITICAL'
                              ? 'bg-rose-600 text-white'
                              : kpi.status === 'WATCH'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          )}
                        >
                          {kpi.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{kpi.currentValue}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{kpi.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operational Bottlenecks & Recommended Strategic Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Operational Bottlenecks */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white/60 dark:bg-[#0D1533] space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>Workflow Bottlenecks ({data.bottlenecks.length})</span>
                </div>
                {data.bottlenecks.length > 0 ? (
                  <div className="space-y-2">
                    {data.bottlenecks.map((b, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#151F42] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{b.stage}</span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase">
                            {b.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{b.impact}</p>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400">
                          <strong>Action:</strong> {b.suggestedInvestigation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No critical pipeline bottlenecks detected.</p>
                )}
              </div>

              {/* Recommended Strategic Actions */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white/60 dark:bg-[#0D1533] space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>Recommended Strategic Next Steps</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                  {data.recommendedActions.map((action, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Compliance Disclaimer */}
            <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              AI Decision-Support Only — Telemetry and KPIs are derived from authoritative backend ledgers. AI provides advisory interpretation and does not modify portfolio policies or targets.
            </p>
          </div>
        )
      ) : (
        <div className="p-4 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Click <strong>"Analyze Dashboard with AI"</strong> to synthesize real-time portfolio metrics, pipeline bottlenecks, delinquency trends, and prioritized executive action items.
          </p>
        </div>
      )}
    </div>
  );
}
