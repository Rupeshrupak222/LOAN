'use client';

import React from 'react';
import {
  Wallet,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BorrowerFinancialMetrics } from './BorrowerTypes';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  metrics: BorrowerFinancialMetrics;
  onStartApplication: () => void;
  isDark: boolean;
}

export const BorrowerFinancialSummary: React.FC<Props> = ({
  metrics,
  onStartApplication,
  isDark,
}) => {
  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528]/80 text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  // Empty state when borrower has zero borrowing history
  if (metrics.totalLoansCount === 0) {
    return (
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent p-5 sm:p-6 border border-blue-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-600/15 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Borrower Financial Center
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                No loan history yet
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              You haven&apos;t taken a loan with Adyapan yet. Check your eligibility and get instant funds in under 90 seconds.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartApplication}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Start your first loan application</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your Financial Overview
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {metrics.totalLoansCount} Total {metrics.totalLoansCount === 1 ? 'Facility' : 'Facilities'}
        </span>
      </div>

      {/* 7-KPI Metric Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {/* KPI 1: Active Loans */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Active Loans
          </span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
              {metrics.activeLoansCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {metrics.closedLoansCount} closed
            </span>
          </div>
        </div>

        {/* KPI 2: Total Borrowed */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Total Borrowed
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate block">
              {formatMoney(metrics.totalBorrowed)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All-time sanction</span>
          </div>
        </div>

        {/* KPI 3: Total Repaid */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Total Repaid
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate block">
              {formatMoney(metrics.totalRepaid)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All payments</span>
          </div>
        </div>

        {/* KPI 4: Current Outstanding */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Outstanding
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold font-mono text-purple-600 dark:text-purple-400 truncate block">
              {formatMoney(metrics.currentOutstanding)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Principal due</span>
          </div>
        </div>

        {/* KPI 5: Next EMI */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Next EMI
          </span>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400 truncate block">
              {metrics.nextEmiAmount > 0 ? formatMoney(metrics.nextEmiAmount) : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {metrics.nextEmiDueDate ? formatDate(metrics.nextEmiDueDate) : 'No due date'}
            </span>
          </div>
        </div>

        {/* KPI 6: EMIs Paid */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            EMIs Paid
          </span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.paidInstallmentsCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cleared installments</span>
          </div>
        </div>

        {/* KPI 7: EMIs Remaining */}
        <div className={cn('p-3.5 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            EMIs Remaining
          </span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {metrics.remainingInstallmentsCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pending installments</span>
          </div>
        </div>
      </div>
    </div>
  );
};
