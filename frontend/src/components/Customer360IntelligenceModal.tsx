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
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  User,
  Building,
  Wallet,
  Landmark,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn, formatMoney } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface Customer360IntelligenceData {
  customerId: string;
  customerCode: string;
  customerName: string;
  generatedAt: string;
  dataAsOf: string;
  model: string;
  lifecycleStage: string;
  customerSummary: string;
  lifecycleSummary: string;
  portfolioSummary: {
    totalLoans: number;
    activeLoans: number;
    totalSanctionedAmount: number;
    totalOutstandingPrincipal: number;
    totalOverdueAmount: number;
    overallServicingStatus: string;
  };
  repaymentInsights: {
    complianceRate: string;
    paidInstallmentsCount: number;
    overdueInstallmentsCount: number;
    behaviorTrend: string;
    observations: string;
  };
  riskAndCreditContext: {
    initialRiskTier: string;
    initialRiskScore: number;
    currentTrajectory: string;
    observations: string;
  };
  kycDocumentContext: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    missingCategories: string[];
    observations: string;
  };
  collectionsContext: {
    activeCasesCount: number;
    maxDpd: number;
    ptpStatus: string;
    observations: string;
  };
  timeline: {
    timestamp: string;
    event: string;
    category: 'ONBOARDING' | 'KYC' | 'ORIGINATION' | 'UNDERWRITING' | 'DISBURSEMENT' | 'REPAYMENT' | 'COLLECTION' | 'SERVICING';
    description: string;
  }[];
  changesDetected: {
    change: string;
    previousState: string;
    currentState: string;
    whyItMatters: string;
  }[];
  positiveSignals: string[];
  attentionRequired: {
    category: string;
    issue: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    recommendedReview: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
  customerId: string;
  customerCode?: string;
  customerName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Customer360IntelligenceModal({ customerId, customerCode, customerName, isOpen, onClose }: Props) {
  const { isDark } = useTheme();
  const [data, setData] = useState<Customer360IntelligenceData | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/customers/${customerId}/customer-360`);
      return res.data?.data as Customer360IntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
    },
    onError: (err: any) => {
      alert(`Customer 360 Intelligence Error: ${apiErrorMessage(err)}`);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className={cn(
          'w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all',
          isDark ? 'bg-[#0B1220] border-[#1E2445] text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#1E2445] shrink-0 bg-slate-50/50 dark:bg-[#131E36]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">AI Customer 360 & Lifecycle Intelligence</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                  Gemini Synthesized
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-lg">
                Profile: {customerCode || 'Borrower'} · Name: <span className="font-semibold text-slate-300">{customerName || 'Borrower'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-sm cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing 360...</span>
                </>
              ) : data ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-Analyze 360</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>Generate Customer 360</span>
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
              {/* Executive Summary & Lifecycle Stage Banner */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-2.5',
                  isDark ? 'bg-[#0F172A] border-[#1E2445]' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifecycle Stage:</span>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase',
                        data.lifecycleStage === 'SERVICING_DELINQUENT'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : data.lifecycleStage === 'SERVICING_HEALTHY'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-blue-600 text-white border-blue-700'
                      )}
                    >
                      {data.lifecycleStage.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Model: <strong className="text-slate-300">{data.model}</strong> · Confidence: <strong className="text-emerald-400">{data.confidence}</strong>
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {data.customerSummary}
                </p>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  <strong>Lifecycle Journey:</strong> {data.lifecycleSummary}
                </p>
              </div>

              {/* Portfolio Snapshot KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Sanctioned</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {formatMoney(data.portfolioSummary.totalSanctionedAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
                  <span className="text-[10px] text-slate-400 font-medium block">Outstanding Balance</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {formatMoney(data.portfolioSummary.totalOutstandingPrincipal)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Overdue</span>
                  <p className={cn("text-sm font-bold font-mono mt-0.5", data.portfolioSummary.totalOverdueAmount > 0 ? "text-rose-500" : "text-emerald-500")}>
                    {formatMoney(data.portfolioSummary.totalOverdueAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
                  <span className="text-[10px] text-slate-400 font-medium block">Repayment Compliance</span>
                  <p className="text-sm font-bold text-indigo-500 font-mono mt-0.5">
                    {data.repaymentInsights.complianceRate}
                  </p>
                </div>
              </div>

              {/* "What Changed?" Intelligence */}
              {data.changesDetected.length > 0 && (
                <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                    <RotateCcw className="h-4 w-4 shrink-0" />
                    <span>Key State Transitions & Lifecycle Deltas ({data.changesDetected.length})</span>
                  </div>

                  <div className="space-y-1.5">
                    {data.changesDetected.map((ch, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-white dark:bg-[#151E38] border border-indigo-100 dark:border-indigo-900/50 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">{ch.change}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{ch.previousState}</span>
                          <ArrowRight className="h-3 w-3 text-indigo-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{ch.currentState}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Why it matters:</strong> {ch.whyItMatters}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Positive Signals vs Attention Required Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Positive Signals */}
                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verified Positive Signals ({data.positiveSignals.length})</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {data.positiveSignals.map((sig, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Attention Required */}
                <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Attention Required ({data.attentionRequired.length})</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {data.attentionRequired.map((att, idx) => (
                      <div key={idx} className="space-y-0.5 border-b border-rose-100 dark:border-rose-950/60 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-rose-900 dark:text-rose-200">{att.issue}</span>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0',
                              att.severity === 'HIGH'
                                ? 'bg-rose-600 text-white'
                                : att.severity === 'MEDIUM'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            )}
                          >
                            {att.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {att.recommendedReview}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chronological Customer Timeline */}
              {data.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Chronological Lifecycle Event History ({data.timeline.length} Events)</span>
                  </h4>

                  <div className="rounded-xl border border-slate-200 dark:border-[#1E2445] divide-y divide-slate-100 dark:divide-[#1E2445] max-h-48 overflow-y-auto">
                    {data.timeline.map((ev, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-3 text-xs bg-white dark:bg-[#131E38]/60">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{ev.event}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1C2647] text-slate-500">
                              {ev.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{ev.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Next Best Actions */}
              {data.recommendedActions.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>Recommended Next Best Actions</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {data.recommendedActions.map((action, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Compliance Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                AI Decision-Support Only — Extracted insights are advisory and do not automatically alter customer, loan, or repayment records.
              </p>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Synthesize Customer 360 Intelligence</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Gemini will combine onboarding records, loan proposals, KYC documents, repayment trends, and collection history into a connected 360 view.
              </p>
              <Button
                size="md"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-600/20 text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                {mutation.isPending ? 'Synthesizing Profile...' : 'Start Customer 360 Analysis'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
