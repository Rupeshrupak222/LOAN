'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Percent,
  Calendar,
  Wallet,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { EligibilityResultData } from './BorrowerTypes';
import { Button } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

interface Props {
  data: EligibilityResultData;
  onProceed: () => void;
  onRecalculate: () => void;
  isDark: boolean;
}

export const BorrowerEligibilityResult: React.FC<Props> = ({
  data,
  onProceed,
  onRecalculate,
  isDark,
}) => {
  const isEligible = data.result === 'ELIGIBLE';
  const isConditional = data.result === 'CONDITIONALLY_ELIGIBLE';

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Result Status Banner */}
      <div
        className={cn(
          'rounded-3xl p-6 sm:p-8 border relative overflow-hidden transition-all',
          isEligible
            ? 'bg-gradient-to-br from-emerald-950/40 via-[#0B231A] to-[#061811] border-emerald-500/40 text-emerald-100'
            : isConditional
            ? 'bg-gradient-to-br from-amber-950/40 via-[#271E0B] to-[#181306] border-amber-500/40 text-amber-100'
            : 'bg-gradient-to-br from-rose-950/40 via-[#260C14] to-[#19060B] border-rose-500/40 text-rose-100'
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border backdrop-blur-md uppercase tracking-wider">
              {isEligible ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300">Pre-Qualified · High Approval Likelihood</span>
                </>
              ) : isConditional ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300">Conditional Qualification</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <span className="text-rose-300">Threshold Requirements Not Met</span>
                </>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isEligible
                ? 'Congratulations! You are eligible for instant loan processing'
                : isConditional
                ? 'You are conditionally eligible for credit assistance'
                : 'Your current capacity is below the minimum threshold'}
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl">
              {isEligible
                ? `Based on your monthly income and current obligation ratio, you comfortably qualify for loans up to ${data.maxEligibleAmount}.`
                : isConditional
                ? `You can proceed with application, but a co-applicant or adjusted loan tenure might be recommended during underwriting.`
                : `We recommend lowering your requested loan amount or increasing tenure to lower the debt-to-income (DTI) ratio.`}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-[140px]">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Actuarial Score
            </span>
            <span
              className={cn(
                'text-4xl font-extrabold mt-1 tracking-tight',
                isEligible ? 'text-emerald-400' : isConditional ? 'text-amber-400' : 'text-rose-400'
              )}
            >
              {data.score}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">out of 100</span>
          </div>
        </div>
      </div>

      {/* Numerical Actuarial Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Eligible Range</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {data.maxEligibleAmount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Maximum borrowing ceiling</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Estimated EMI</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {data.estimatedEmi}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Per month for {data.tenureMonths} mos</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Interest Rate</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-purple-600 dark:text-purple-400">
              {data.interestRate}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Reducing balance method</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Repayment</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {data.totalRepayment}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Principal + Total Interest</p>
          </div>
        </div>
      </div>

      {/* Eligibility Factors Evaluation Card */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>Underwriting Factors Assessment</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent breakdown of your actuarial risk checks according to regulatory standards
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Real Backend Evaluation
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#2B3566]">
          {data.factors.map((f, idx) => (
            <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">{f.factor}</span>
                <p className="text-slate-500 dark:text-slate-400">{f.detail}</p>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider shrink-0',
                  f.status === 'PASS'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : f.status === 'WARNING'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                )}
              >
                {f.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRecalculate}
          className="w-full sm:w-auto text-xs flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Modify Income / Obligations</span>
        </Button>

        <Button
          type="button"
          onClick={onProceed}
          className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <span>Continue Application (Personal Profile)</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
