'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCheck,
  TrendingUp,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Scale,
  Building,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface UnderwritingIntelligenceData {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  executiveSummary: string;
  creditSummary: string;
  recommendedReviewPosition?: 'SUITABLE_FOR_SANCTION_CONSIDERATION' | 'PROCEED_WITH_STIPULATED_CONDITIONS' | 'ADDITIONAL_VERIFICATION_REQUIRED' | 'UNFAVORABLE_HIGH_RISK' | string;
  recommendationRationale?: string;
  approvalAuthorityNotice?: string;
  financialAssessment: {
    incomeVsObligations: string;
    netSurplusCashflow: string;
    dtiAssessment: string;
    tenureAndRateSuitability: string;
  };
  riskAssessment: {
    overallTier: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number;
    employmentPillar: string;
    debtPillar: string;
    kycPillar: string;
    creditHistoryPillar: string;
  };
  policyAssessment: {
    status: 'PASSED' | 'FAILED' | 'EXCEPTIONS_DETECTED' | 'INSUFFICIENT_DATA';
    passedRules: string[];
    failedOrWarningRules: string[];
    exceptionsDetected: string[];
  };
  kycDocumentAssessment: {
    kycStatus: string;
    verifiedDocumentsCount: number;
    totalDocumentsCount: number;
    observations: string;
  };
  redFlags: {
    issue: string;
    whyItMatters: string;
    supportingLmsData: string;
    suggestedReviewAction: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  missingInformation: string[];
  suggestedConditions: {
    type: 'PRE_DISBURSEMENT' | 'POST_DISBURSEMENT' | 'DOCUMENTATION';
    condition: string;
    rationale: string;
  }[];
  stipulations: string[];
  conditionsPrecedent: string[];
  conditionsSubsequent: string[];
  governanceSignoffRecommendation: string;
}

interface Props {
  applicationId: string;
  applicationNo?: string;
  initialData?: UnderwritingIntelligenceData | null;
}

export function UnderwritingIntelligenceCard({ applicationId, applicationNo, initialData }: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<UnderwritingIntelligenceData | null>(initialData || null);
  const [showDeepBreakdown, setShowDeepBreakdown] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/applications/${applicationId}/underwriting-intelligence`);
      return res.data?.data as UnderwritingIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
      toast.success('Underwriting intelligence generated successfully.');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Intelligence Notice' });
    },
  });

  return (
    <Card className="space-y-4 border-2 border-purple-500/20 dark:border-purple-500/30 overflow-hidden relative">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Underwriting Decision Support Briefing</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Gemini Underwriting Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Executive synthesis of proposal viability, underwriting red flags, policy exceptions & suggested sanction conditions.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-sm cursor-pointer shrink-0"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Synthesizing Proposal...</span>
            </>
          ) : data ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-Evaluate Underwriting</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Generate Underwriter Briefing</span>
            </>
          )}
        </Button>
      </div>

      {data ? (
        <div className="space-y-4 pt-2 animate-in fade-in">
          {/* Review Position & Authority Banner */}
          <div
            className={cn(
              'p-4 rounded-xl border space-y-2.5',
              isDark ? 'bg-[#0E1528] border-[#1E2445]' : 'bg-purple-50/40 border-purple-200/80'
            )}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI Recommended Review Position
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase',
                  data.recommendedReviewPosition === 'SUITABLE_FOR_SANCTION_CONSIDERATION'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : data.recommendedReviewPosition === 'PROCEED_WITH_STIPULATED_CONDITIONS'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                    : data.recommendedReviewPosition === 'ADDITIONAL_VERIFICATION_REQUIRED'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                )}
              >
                {data.recommendedReviewPosition ? data.recommendedReviewPosition.replace(/_/g, ' ') : 'UNDER REVIEW'}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {data.recommendationRationale}
            </p>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {data.executiveSummary}
            </p>

            {data.approvalAuthorityNotice && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-purple-100 dark:border-[#1E2445] pt-2 font-mono">
                <Building className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>{data.approvalAuthorityNotice}</span>
              </div>
            )}
          </div>

          {/* Underwriting Red Flags (if any) */}
          {data.redFlags && data.redFlags.length > 0 ? (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Underwriting Red Flags & Vulnerabilities ({data.redFlags.length})</span>
                </div>
              </div>

              <div className="space-y-2">
                {data.redFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-rose-200/80 bg-white dark:bg-[#12101F] dark:border-rose-950/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-rose-900 dark:text-rose-200">{flag.issue}</span>
                      <span
                        className={cn(
                          'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0',
                          flag.severity === 'HIGH'
                            ? 'bg-rose-600 text-white'
                            : flag.severity === 'MEDIUM'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {flag.severity} RISK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-700 dark:text-slate-200">Why it matters:</strong> {flag.whyItMatters}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <strong>LMS Evidence:</strong> {flag.supportingLmsData}
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                      <strong>Action:</strong> {flag.suggestedReviewAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Zero critical underwriting red flags detected. Proposal aligns with standard credit parameters.</span>
            </div>
          )}

          {/* Suggested Sanction Conditions Checklist */}
          {data.suggestedConditions && data.suggestedConditions.length > 0 && (
            <div
              className={cn(
                'p-3.5 rounded-xl border space-y-2',
                isDark ? 'bg-[#121B33] border-blue-900/40' : 'bg-blue-50/40 border-blue-200'
              )}
            >
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs">
                <ListChecks className="h-4 w-4" />
                <span>Suggested Underwriting Conditions ({data.suggestedConditions.length})</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {data.suggestedConditions.map((cond, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-[#1A2342] border border-blue-100 dark:border-blue-900/50">
                    <span
                      className={cn(
                        'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5',
                        cond.type === 'PRE_DISBURSEMENT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                      )}
                    >
                      {cond.type.replace('_', ' ')}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{cond.condition}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{cond.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep Breakdown Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowDeepBreakdown((prev) => !prev)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E2445] transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-purple-500" />
                {showDeepBreakdown
                  ? 'Hide Policy Checks & Financial Capacity Breakdown'
                  : 'View Policy Checks & Financial Capacity Breakdown'}
              </span>
              {showDeepBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDeepBreakdown && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-1 animate-in fade-in">
                {/* Financial Assessment */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445]/40 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Financial Capacity & Cashflow</h4>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <p><strong className="text-slate-700 dark:text-slate-300">Income vs Obligations:</strong> {data.financialAssessment.incomeVsObligations}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Net Surplus Buffer:</strong> {data.financialAssessment.netSurplusCashflow}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">DTI Assessment:</strong> {data.financialAssessment.dtiAssessment}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Tenure & Rate Suitability:</strong> {data.financialAssessment.tenureAndRateSuitability}</p>
                  </div>
                </div>

                {/* Policy & KYC Review */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#1E2445]/40 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Policy & Document Audit</h4>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <p><strong className="text-slate-700 dark:text-slate-300">Policy Status:</strong> {data.policyAssessment.status}</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">KYC Status:</strong> {data.kycDocumentAssessment.kycStatus} ({data.kycDocumentAssessment.verifiedDocumentsCount}/{data.kycDocumentAssessment.totalDocumentsCount} verified files)</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Document Observations:</strong> {data.kycDocumentAssessment.observations}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compliance Disclaimer Footnote */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-[#1E2445] pt-2">
            <span>Model: <span className="font-mono">{data.model}</span> · Generated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
            <span className="italic">AI Decision Support Assistant Only — Does not make credit sanction decisions.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#2B3566] p-6 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <strong className="text-purple-600">&quot;Generate Underwriter Briefing&quot;</strong> to synthesize case merits, red flags, policy exceptions, and suggested sanction conditions.
          </p>
        </div>
      )}
    </Card>
  );
}
