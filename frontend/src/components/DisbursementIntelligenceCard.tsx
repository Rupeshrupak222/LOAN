'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Landmark,
  Wallet,
  Receipt,
  FileCheck,
  Building,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn, formatMoney } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface DisbursementIntelligenceData {
  applicationId: string;
  applicationNo: string;
  generatedAt: string;
  model: string;
  readinessStatus: 'READY' | 'NEEDS_REVIEW' | 'NOT_READY' | 'BLOCKED';
  executiveSummary: string;
  completedChecks: {
    name: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    details: string;
  }[];
  blockers: string[];
  warnings: string[];
  financialConsistency: {
    sanctionedAmount: number;
    processingFeeAmount: number;
    netDisbursementAmount: number;
    status: 'CONSISTENT' | 'DISCREPANCY_DETECTED';
    observations: string;
  };
  bankAccountReview: {
    beneficiaryName: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
    isVerified: boolean;
    nameMatchStatus: 'MATCH' | 'PARTIAL_MATCH' | 'UNVERIFIED' | 'MISMATCH';
    observations: string;
  };
  transactionReview?: {
    utrReference?: string;
    formatValid?: boolean;
    duplicateDetected?: boolean;
    observations?: string;
  };
  exceptions: {
    exception: string;
    impact: string;
    evidence: string;
    recommendedAction: string;
    escalationRole?: string;
  }[];
  recommendedActions: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
  applicationId: string;
  applicationNo?: string;
  utrReference?: string;
}

export function DisbursementIntelligenceCard({ applicationId, applicationNo, utrReference }: Props) {
  const { isDark } = useTheme();
  const [data, setData] = useState<DisbursementIntelligenceData | null>(null);
  const [showDeepBreakdown, setShowDeepBreakdown] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/ai/applications/${applicationId}/disbursement-intelligence`, {
        utrReference: utrReference || undefined,
      });
      return res.data?.data as DisbursementIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
    },
    onError: (err: any) => {
      alert(`Disbursement Intelligence Error: ${apiErrorMessage(err)}`);
    },
  });

  return (
    <Card className="space-y-4 border-2 border-emerald-500/20 dark:border-emerald-500/30 overflow-hidden relative">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Disbursement & Treasury Readiness</h3>
              <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Gemini Treasury Layer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pre-disbursement control audits, fee deduction verification, beneficiary integrity & UTR conflict detection.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-sm cursor-pointer shrink-0"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Auditing Payout...</span>
            </>
          ) : data ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-Audit Payout</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Analyze Disbursement with AI</span>
            </>
          )}
        </Button>
      </div>

      {data ? (
        <div className="space-y-4 pt-2 animate-in fade-in">
          {/* Readiness Status Banner */}
          <div
            className={cn(
              'p-4 rounded-xl border space-y-2.5',
              isDark ? 'bg-[#0B1520] border-[#1E2445]' : 'bg-emerald-50/40 border-emerald-200/80'
            )}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Treasury Payout Readiness
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase',
                  data.readinessStatus === 'READY'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : data.readinessStatus === 'NEEDS_REVIEW'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                )}
              >
                {data.readinessStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
              {data.executiveSummary}
            </p>
          </div>

          {/* Financial Breakdown & Net Payout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
              <span className="text-[11px] text-slate-400 font-medium">Sanctioned Principal</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {formatMoney(data.financialConsistency.sanctionedAmount)}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33]">
              <span className="text-[11px] text-slate-400 font-medium">Processing Fee Deductions</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                - {formatMoney(data.financialConsistency.processingFeeAmount)}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/30">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">Net Payout to Transfer</span>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatMoney(data.financialConsistency.netDisbursementAmount)}
              </p>
            </div>
          </div>

          {/* Mandatory Pre-Disbursement Checks Audit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <span>Authoritative Pre-Disbursement Compliance Checks</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                {data.completedChecks.filter((c) => c.status === 'PASSED').length} / {data.completedChecks.length} Checks Passed
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#1E2445] divide-y divide-slate-100 dark:divide-[#1E2445] overflow-hidden">
              {data.completedChecks.map((check, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs bg-white dark:bg-[#131E38]/60">
                  <div className="flex items-center gap-2">
                    {check.status === 'PASSED' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : check.status === 'WARNING' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{check.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{check.details}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border shrink-0',
                      check.status === 'PASSED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : check.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                    )}
                  >
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Beneficiary & Transaction Integrity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Beneficiary Details */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Landmark className="h-4 w-4 text-blue-500" />
                <span>Beneficiary Account Integrity</span>
              </h4>
              <dl className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiary Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{data.bankAccountReview.beneficiaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank Institution:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{data.bankAccountReview.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.bankAccountReview.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{data.bankAccountReview.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className={cn('font-bold', data.bankAccountReview.isVerified ? 'text-emerald-600' : 'text-amber-500')}>
                    {data.bankAccountReview.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </span>
                </div>
              </dl>
            </div>

            {/* Recommended Action Checklist */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#121B33] space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Recommended Finance Officer Actions</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                {data.recommendedActions.length > 0 ? (
                  data.recommendedActions.map((action, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {action}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">Verify transfer reference and execute disbursement in core banking.</li>
                )}
              </ol>
            </div>
          </div>

          {/* Blockers & Exceptions (if any) */}
          {data.blockers.length > 0 && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900/50 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Disbursement Blockers ({data.blockers.length})</span>
              </div>
              <ul className="list-disc list-inside text-rose-900 dark:text-rose-200 space-y-0.5 pl-1">
                {data.blockers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance Disclaimer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-[#1E2445] pt-2">
            <span>Model: <span className="font-mono">{data.model}</span> · Audited: {new Date(data.generatedAt).toLocaleTimeString()}</span>
            <span className="italic">AI Decision Support Only — Payout execution requires authorized Finance Officer action.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#2B3566] p-6 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <strong className="text-emerald-600">&quot;Analyze Disbursement with AI&quot;</strong> to evaluate pre-disbursement compliance checks, fee deductions, beneficiary integrity, and UTR validity.
          </p>
        </div>
      )}
    </Card>
  );
}
