'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface CreditIntelligenceData {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  overallSummary: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  positiveFactors: string[];
  riskFactors: {
    issue: string;
    whyItMatters: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  missingInformation: string[];
  policyObservations: string[];
  financialAnalysis: {
    incomeVsObligations: string;
    repaymentCapacity: string;
    dtiAssessment: string;
  };
  riskPillarAnalysis: {
    employmentStability: string;
    debtServiceCapacity: string;
    kycCompleteness: string;
    creditHistory: string;
  };
  recommendedReviewActions: string[];
}

interface Props {
  applicationId: string;
  applicationNo?: string;
  initialData?: CreditIntelligenceData | null;
}

export function CreditIntelligenceCard({ applicationId, applicationNo, initialData }: Props) {
  const { isDark } = useTheme();
  const [data, setData] = useState<CreditIntelligenceData | null>(initialData || null);
  const [showDetails, setShowDetails] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/applications/${applicationId}/credit-intelligence`);
      return res.data?.data as CreditIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
    },
    onError: (err: any) => {
      alert(`Credit Intelligence Error: ${apiErrorMessage(err)}`);
    },
  });

  return (
    <Card className="space-y-4 border-2 border-indigo-500/20 dark:border-indigo-500/30 overflow-hidden relative">
      {/* Decorative gradient glow top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Credit Intelligence & Decision Support</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Gemini Synthesized
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evidence-based evaluation synthesized from KYC completeness, DTI ratios, policy criteria & 4-pillar risk outputs.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-sm cursor-pointer shrink-0"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing LMS Data...</span>
            </>
          ) : data ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-Analyze with Gemini</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Generate AI Assessment</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Assessment Body */}
      {data ? (
        <div className="space-y-4 pt-2 animate-in fade-in">
          {/* Overall Summary & Completeness Banner */}
          <div
            className={cn(
              'p-4 rounded-xl border space-y-2.5',
              isDark ? 'bg-[#0F172A] border-[#1E2445]' : 'bg-slate-50/80 border-slate-200/80'
            )}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Credit Summary</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Data Completeness:</span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                    data.confidence === 'HIGH'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : data.confidence === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                  )}
                >
                  {data.confidence} CONFIDENCE
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium font-sans">
              {data.overallSummary}
            </p>

            {data.confidenceReason && (
              <p className="text-[11px] text-slate-400 italic">
                ℹ️ {data.confidenceReason}
              </p>
            )}
          </div>

          {/* Missing / Incomplete Information Alert (if any) */}
          {data.missingInformation && data.missingInformation.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/50 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Information Gaps & Pending Verifications Detected</span>
              </div>
              <ul className="list-disc list-inside text-xs text-amber-900 dark:text-amber-200 space-y-0.5 pl-1">
                {data.missingInformation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Positive vs Risk Factors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Positive Factors */}
            <div
              className={cn(
                'p-3.5 rounded-xl border space-y-2',
                isDark ? 'bg-[#0B132B] border-emerald-900/40' : 'bg-emerald-50/40 border-emerald-200'
              )}
            >
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Strengths & Supporting Factors ({data.positiveFactors.length})</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {data.positiveFactors.length > 0 ? (
                  data.positiveFactors.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No strong positive factors highlighted.</li>
                )}
              </ul>
            </div>

            {/* Risk Factors */}
            <div
              className={cn(
                'p-3.5 rounded-xl border space-y-2',
                isDark ? 'bg-[#1A1020] border-rose-900/40' : 'bg-rose-50/40 border-rose-200'
              )}
            >
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <ShieldAlert className="h-4 w-4" />
                <span>Identified Risks & Vulnerabilities ({data.riskFactors.length})</span>
              </div>
              <div className="space-y-2 text-xs">
                {data.riskFactors.length > 0 ? (
                  data.riskFactors.map((rf, idx) => (
                    <div key={idx} className="space-y-0.5 border-b border-rose-100 dark:border-rose-950/60 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-rose-900 dark:text-rose-200">{rf.issue}</span>
                        <span
                          className={cn(
                            'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0',
                            rf.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : rf.severity === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {rf.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-500">Why it matters:</span> {rf.whyItMatters}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Zero critical credit risk vulnerabilities detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Review Actions */}
          {data.recommendedReviewActions && data.recommendedReviewActions.length > 0 && (
            <div
              className={cn(
                'p-3.5 rounded-xl border space-y-2',
                isDark ? 'bg-[#131B2E] border-blue-900/50' : 'bg-blue-50/50 border-blue-200'
              )}
            >
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
                <TrendingUp className="h-4 w-4" />
                <span>Recommended Credit Analyst Review Actions ({data.recommendedReviewActions.length})</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1 pl-1">
                {data.recommendedReviewActions.map((action, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Collapsible Deep Financial & Risk Pillar Analysis */}
          <div>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E2445] transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-500" />
                {showDetails ? 'Hide Deep Financial & 4-Pillar Interpretation' : 'View Deep Financial & 4-Pillar Interpretation'}
              </span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-1 animate-in fade-in">
                {/* Financial Capacity Breakdown */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445]/40 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Financial Capacity Interpretation</h4>
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Income vs Debt:</span> {data.financialAnalysis.incomeVsObligations}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">DTI Assessment:</span> {data.financialAnalysis.dtiAssessment}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Repayment Capacity:</span> {data.financialAnalysis.repaymentCapacity}</p>
                  </div>
                </div>

                {/* 4-Pillar Risk Breakdown */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445]/40 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">4-Pillar Risk Model Interpretation</h4>
                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Employment Vintage:</span> {data.riskPillarAnalysis.employmentStability}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Debt Service:</span> {data.riskPillarAnalysis.debtServiceCapacity}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">KYC Completeness:</span> {data.riskPillarAnalysis.kycCompleteness}</p>
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Credit History:</span> {data.riskPillarAnalysis.creditHistory}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compliance Disclaimer Footnote */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-[#1E2445] pt-2">
            <span>Model: <span className="font-mono">{data.model}</span> · Generated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
            <span className="italic">Decision Support Assistant Only — Does not make credit sanction decisions.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#2B3566] p-6 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <strong className="text-blue-600">&quot;Generate AI Assessment&quot;</strong> to synthesize KYC completeness, debt ratios, policy rules, and 4-pillar risk outputs into an actionable credit decision-support report.
          </p>
        </div>
      )}
    </Card>
  );
}
