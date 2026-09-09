'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Wallet,
  Coins,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck,
  Plus,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { cn, formatMoney, formatDate } from '@/lib/utils';

interface Props {
  loan: any;
  onApplyNew?: () => void;
  isDark: boolean;
}

export const BorrowerActiveLoanView: React.FC<Props> = ({ loan, onApplyNew, isDark }) => {
  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const principal = Number(loan?.principal || 0);
  const outstanding = Number(loan?.outstandingPrincipal ?? principal);
  const emi = Number(loan?.emiAmount || 0);
  const tenure = Number(loan?.tenureMonths || 24);
  const interestRate = Number(loan?.interestRate || 12.5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Active Loan Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E38] to-[#152747] p-6 sm:p-8 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                Loan #{loan?.loanNo || 'LN-ACTIVE'}
              </span>
              <Badge status={loan?.status || 'ACTIVE'} />
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Disbursed on: {loan?.disbursementDate ? formatDate(loan.disbursementDate) : 'Active'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {loan?.productName || loan?.product?.name || 'Active Term Facility'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Your loan facility is in good standing. Automated e-NACH debits occur monthly.
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block font-medium">Monthly Installment</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                {formatMoney(emi)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Auto-debit active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Sanctioned Principal</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
              {formatMoney(principal)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Disbursed to bank</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Outstanding Balance</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatMoney(outstanding)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Remaining principal</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Interest Rate</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {interestRate}% p.a.
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Reducing balance</p>
          </div>
        </div>

        <div className={cn('p-4 rounded-2xl border flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Loan Tenure</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {tenure} Months
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Regular amortization</p>
          </div>
        </div>
      </div>

      {/* Action shortcuts & servicing links */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Account Servicing & Self-Service Downloads
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/loans/${loan.id}`} className="block">
            <Button size="sm" variant="secondary" className="w-full text-xs font-semibold py-3">
              Amortization Schedule (24-Mos) →
            </Button>
          </Link>

          <Link href="/payments" className="block">
            <Button size="sm" variant="ghost" className="w-full text-xs font-semibold py-3 border border-slate-200 dark:border-[#2B3566]">
              Payment Receipts & Ledger →
            </Button>
          </Link>

          {onApplyNew && (
            <Button
              type="button"
              onClick={onApplyNew}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-3 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for New Facility</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
