'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  X,
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
  Clock,
  Filter,
  Users,
  AlertCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface WorkflowExceptionItem {
  exceptionId?: string;
  id?: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' | string;
  title: string;
  summary?: string;
  impact?: string;
  evidence?: any;
  rootCauseAnalysis?: string;
  workflowStage?: string;
  entityType: string;
  entityId?: string;
  entityCode?: string;
  referenceNo?: string;
  recommendedAction: string;
  suggestedOwner?: string;
  assignedRole?: string;
  relatedExceptionIds?: string[];
  [key: string]: any;
}

export interface WorkflowExceptionCenterData {
  generatedAt?: string;
  dataAsOf?: string;
  model?: string;
  summary?: string;
  confidence?: string | number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  executiveSummary?: string;
  healthStatus?: 'HEALTHY' | 'ACTION_REQUIRED' | 'ELEVATED_RISK' | 'CRITICAL_BOTTLENECK' | string;
  exceptions: WorkflowExceptionItem[];
  crossModuleChains?: Array<{
    rootCause: string;
    affectedDownstreamWorkflows: string[];
    explanation: string;
  }>;
  topPriorityExceptions?: Array<{
    title: string;
    suggestedAction: string;
    urgency: string;
    [key: string]: any;
  }>;
  systemicPatterns?: Array<{
    pattern: string;
    impactedCount: number;
    recommendedSystemicFix: string;
  }>;
  urgencyTimelineSummary?: string;
  [key: string]: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowExceptionCenterModal({ isOpen, onClose }: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<WorkflowExceptionCenterData | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/exceptions/center');
      return res.data?.data as WorkflowExceptionCenterData;
    },
    onSuccess: (result) => {
      setData(result);
      toast.success('Exception Center analysis synthesized.');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Exception Center Notice' });
    },
  });

  if (!isOpen) return null;

  const filteredExceptions = data?.exceptions.filter((e) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'CRITICAL_HIGH') return e.severity === 'CRITICAL' || e.severity === 'HIGH';
    return e.category === filterCategory;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className={cn(
          'w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all',
          isDark ? 'bg-[#0B1220] border-[#1E2445] text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 dark:border-[#1E2445] shrink-0 bg-slate-50/50 dark:bg-[#131E36] gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 via-amber-600 to-indigo-600 text-white shadow-sm shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold truncate">Operational Exception Center</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
                  Real-Time Center
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Centralized telemetry scanning blockers, stalled workflows, and compliance gaps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold shadow-md cursor-pointer text-xs"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : data ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Rescan</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>Scan Exceptions</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {data ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Executive Summary & Severity KPI Pills */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-3',
                  isDark ? 'bg-[#0F172A] border-[#1E2445]' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Exception Counts:
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-600 text-white">
                      {data.criticalCount} CRITICAL
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white">
                      {data.highCount} HIGH
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white">
                      {(data.mediumCount || 0) + (data.lowCount || 0)} MED / LOW
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Model: <strong className="text-slate-300">{data.model || 'Gemini'}</strong> · Confidence:{' '}
                    <strong className="text-emerald-400">{data.confidence || '94%'}</strong>
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {data.summary || data.executiveSummary}
                </p>
              </div>

              {/* Cross-Module Dependency Chains */}
              {data.crossModuleChains && data.crossModuleChains.length > 0 && (
                <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Cross-Module Bottleneck Chains ({data.crossModuleChains.length})</span>
                  </div>

                  <div className="space-y-2">
                    {data.crossModuleChains.map((chain, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#151E38] border border-indigo-100 dark:border-indigo-900/50 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">
                            Root: {chain.rootCause}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>Affects Workflows:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {chain.affectedDownstreamWorkflows.join(' ➔ ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{chain.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Priority Action Queue */}
              {data.topPriorityExceptions && data.topPriorityExceptions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <Activity className="h-4 w-4 text-rose-500" />
                    <span>Prioritized Operational Action Queue</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.topPriorityExceptions.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200">
                            {item.urgency || 'HIGH'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {item.suggestedAction || item.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtered Exceptions Browser */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>Active Lifecycle Exceptions ({filteredExceptions.length})</span>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {['ALL', 'KYC', 'ORIGINATION', 'UNDERWRITING', 'DISBURSEMENT', 'SERVICING', 'COLLECTIONS'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer whitespace-nowrap',
                          filterCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1A2342] dark:text-slate-300'
                        )}
                      >
                        {cat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredExceptions.map((ex, idx) => {
                    const key = ex.exceptionId || ex.id || `ex-${idx}`;
                    const owner = ex.suggestedOwner || ex.assignedRole || 'System Operator';
                    const summaryText = ex.summary || ex.impact || ex.rootCauseAnalysis || '';
                    const entityRef = ex.entityCode || ex.referenceNo || ex.entityId || '-';
                    const stageText = ex.workflowStage || ex.category || 'IN_PROGRESS';

                    return (
                      <div
                        key={key}
                        className={cn(
                          'p-3 rounded-xl border space-y-1.5 transition-all',
                          isDark ? 'bg-[#0D1533] border-[#1E2445]' : 'bg-white border-slate-200'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase',
                                ex.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : ex.severity === 'HIGH'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-blue-600 text-white'
                              )}
                            >
                              {ex.severity}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">[{ex.category}]</span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{ex.title}</span>
                          </div>

                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                            Owner: {owner}
                          </span>
                        </div>

                        {summaryText && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">{summaryText}</p>
                        )}

                        <div className="pt-1 border-t border-slate-100 dark:border-[#1E2445] flex items-center justify-between flex-wrap gap-2 text-[10px]">
                          <span className="text-slate-400 font-mono">
                            Entity: <strong>{ex.entityType} (#{entityRef})</strong> · Stage: <strong>{stageText}</strong>
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Action: {ex.recommendedAction}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                AI Decision-Support Only — Operational exceptions are evaluated from authoritative state machines. AI provides advisory detection and does not execute loan approvals, status changes, or disbursements.
              </p>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Run Centralized Exception Scan</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Gemini will scan active workflows across KYC, Underwriting, Disbursements, and Collections to identify pending blockers and cross-module bottlenecks.
              </p>
              <Button
                size="md"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold shadow-lg shadow-rose-600/25 text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Scanning Workflows...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-200" />
                    <span>Start Exception Scan</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
