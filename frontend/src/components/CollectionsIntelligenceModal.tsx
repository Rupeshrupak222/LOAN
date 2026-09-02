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
  PhoneCall,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Building,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn, formatMoney } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface CollectionIntelligenceData {
  caseId: string;
  caseNo: string;
  loanNo: string;
  borrowerName: string;
  generatedAt: string;
  model: string;
  collectionPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW_REQUIRED';
  priorityReasons: string[];
  accountSummary: string;
  delinquencySignals: {
    signal: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    evidence: string;
    whyItMatters: string;
    suggestedAction: string;
  }[];
  observedTrends: string[];
  paymentBehaviorSummary: string;
  collectionActivitySummary: string;
  ptpSummary: {
    activePtpStatus: string;
    brokenPtpCount: number;
    totalPtpCount: number;
    observations: string;
  };
  exceptions: {
    exception: string;
    impact: string;
    evidence: string;
    recommendedAction: string;
  }[];
  recommendedActions: string[];
  escalationRecommendation: {
    escalate: boolean;
    targetRole?: string;
    rationale?: string;
  };
  dataGaps: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
  colCase: {
    id: string;
    caseNo: string;
    loanNo: string;
    customerName: string;
    dpd: number;
    overdueAmount: string | number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionsIntelligenceModal({ colCase, isOpen, onClose }: Props) {
  const { isDark } = useTheme();
  const [data, setData] = useState<CollectionIntelligenceData | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/collections/${colCase.id}/intelligence`);
      return res.data?.data as CollectionIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
    },
    onError: (err: any) => {
      alert(`Collections Intelligence Error: ${apiErrorMessage(err)}`);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div
        className={cn(
          'w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all',
          isDark ? 'bg-[#0B1220] border-[#1E2445] text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#1E2445] shrink-0 bg-slate-50/50 dark:bg-[#131E36]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">AI Predictive Collections & Recovery Briefing</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Gemini Recovery Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                Case: {colCase.caseNo} · Borrower: <span className="font-semibold text-slate-300">{colCase.customerName}</span> · DPD: <span className="text-rose-500 font-bold">{colCase.dpd} Days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold shadow-sm cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Evaluating Risk...</span>
                </>
              ) : data ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-Analyze</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>Run AI Assessment</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {data ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Priority & Executive Summary Banner */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-2',
                  isDark ? 'bg-[#0F172A] border-[#1E2445]' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Priority:</span>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase',
                        data.collectionPriority === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : data.collectionPriority === 'HIGH'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : data.collectionPriority === 'MEDIUM'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                      )}
                    >
                      {data.collectionPriority} PRIORITY
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Analysis Confidence: <strong className="text-slate-300">{data.confidence}</strong>
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                  {data.accountSummary}
                </p>

                {data.priorityReasons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#1E2445]">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Key Priority Triggers:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                      {data.priorityReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Delinquency Warning Signals */}
              {data.delinquencySignals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <span>Early Warning & Delinquency Signals ({data.delinquencySignals.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {data.delinquencySignals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-rose-900 dark:text-rose-200">{sig.signal}</span>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase shrink-0',
                              sig.severity === 'HIGH'
                                ? 'bg-rose-600 text-white'
                                : sig.severity === 'MEDIUM'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            )}
                          >
                            {sig.severity} RISK
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          <strong className="text-slate-700 dark:text-slate-200">Why it matters:</strong> {sig.whyItMatters}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <strong>Evidence:</strong> {sig.evidence}
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                          <strong>Action:</strong> {sig.suggestedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PTP & Payment Behavior Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* PTP Track Record */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span>Promise-to-Pay (PTP) Audit</span>
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active PTP:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{data.ptpSummary.activePtpStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Broken PTPs:</span>
                      <span className={cn('font-bold', data.ptpSummary.brokenPtpCount > 0 ? 'text-rose-500' : 'text-emerald-500')}>
                        {data.ptpSummary.brokenPtpCount} / {data.ptpSummary.totalPtpCount} Commitments
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-[#1E2445]">
                      {data.ptpSummary.observations}
                    </p>
                  </div>
                </div>

                {/* Next Best Action Checklist */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>Recommended Next Actions</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                    {data.recommendedActions.map((action, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Escalation Recommendation Banner (if needed) */}
              {data.escalationRecommendation.escalate && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900/50 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <Building className="h-4 w-4 shrink-0" />
                    <span>Manager Escalation Recommended: {data.escalationRecommendation.targetRole || 'Branch Manager'}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-200">
                    {data.escalationRecommendation.rationale}
                  </p>
                </div>
              )}

              {/* Compliance Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                AI Decision-Support Only — AI does not contact borrowers, record commitments, or modify loan terms. Collection operations remain under the authorized Collection Officer.
              </p>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Run Predictive Collections Intelligence</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Gemini will synthesize overdue history, DPD progression, broken PTP patterns, and call records to recommend prioritized recovery actions.
              </p>
              <Button
                size="md"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="gap-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold shadow-lg shadow-amber-600/20 text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                {mutation.isPending ? 'Analyzing Delinquency...' : 'Start Collections Assessment'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
