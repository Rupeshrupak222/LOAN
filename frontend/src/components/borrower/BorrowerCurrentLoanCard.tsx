'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Wallet,
  TrendingUp,
  Coins,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  Send,
  Building,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  loan: any;
  onPayEmi: () => void;
  onViewSchedule: () => void;
  onViewPayments: () => void;
  isDark: boolean;
}

export const BorrowerCurrentLoanCard: React.FC<Props> = ({
  loan,
  onPayEmi,
  onViewSchedule,
  onViewPayments,
  isDark,
}) => {
  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const principal = Number(loan?.principal || 0);
  const outstandingPrincipal = Number(loan?.outstandingPrincipal ?? principal);
  const outstandingInterest = Number(loan?.outstandingInterest || 0);
  const emiAmount = Number(loan?.emiAmount || 0);
  const tenure = Number(loan?.tenureMonths || 24);
  const interestRate = Number(loan?.interestRate || 12.5);
  const status = String(loan?.status || 'ACTIVE').toUpperCase();
  const isOverdue = status === 'OVERDUE';

  // Calculate paid & remaining EMIs from schedule
  const schedule = Array.isArray(loan?.schedule) ? loan.schedule : [];
  const totalInstallments = schedule.length > 0 ? schedule.length : tenure;
  const paidInstallments = schedule.filter((s: any) => s.status === 'PAID').length;
  const remainingInstallments = totalInstallments - paidInstallments;

  // Total paid calculation
  const payments = Array.isArray(loan?.payments) ? loan.payments : [];
  const totalRepaid = payments.reduce(
    (acc: number, p: any) => (p.status === 'SUCCESS' ? acc + Number(p.amount || 0) : acc),
    0
  );

  // Progress percentage based on principal amortized
  const principalRepaid = Math.max(0, principal - outstandingPrincipal);
  const progressPercent = principal > 0 ? Math.min(100, Math.round((principalRepaid / principal) * 100)) : 0;

  // Next upcoming due installment
  const nextInstallment = schedule.find(
    (s: any) => ['UPCOMING', 'DUE', 'OVERDUE', 'PARTIALLY_PAID'].includes(s.status)
  );
  const nextDueDate = nextInstallment?.dueDate || loan?.nextDueDate;
  const nextDueAmount = Number(nextInstallment?.totalDue || nextInstallment?.outstanding || emiAmount);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Overdue Payment Alert Banner (Only if overdue) */}
      {isOverdue && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-[#220B11] to-rose-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Immediate Payment Due
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  OVERDUE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Installment of <strong className="text-white font-mono">{formatMoney(nextDueAmount)}</strong> was due on{' '}
                <strong className="text-white">{nextDueDate ? formatDate(nextDueDate) : 'Previous Due Date'}</strong>.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onPayEmi}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-lg shadow-rose-600/30"
          >
            Make Payment Now →
          </Button>
        </div>
      )}

      {/* Prominent Current Loan Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E38] to-[#152747] p-6 sm:p-8 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar: Loan No, Status, Next Due Date */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                {loan?.loanNo || 'LN-ACTIVE'}
              </span>
              <Badge status={status} />
              <span className="text-xs text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {loan?.product?.name || loan?.productName || 'Personal Term Loan'}
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {nextDueDate ? `Next Due: ${formatDate(nextDueDate)}` : 'Auto-debit active'}
              </span>
            </div>
          </div>

          {/* Hero Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Sanctioned Loan Amount
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1 block">
                {formatMoney(principal)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                @ {interestRate}% p.a. • {tenure} Months Tenure
              </span>
            </div>

            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Outstanding Principal
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono mt-1 block">
                {formatMoney(outstandingPrincipal)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {formatMoney(principalRepaid)} Principal Repaid
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Monthly Installment (EMI)
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">
                {formatMoney(emiAmount)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {paidInstallments} of {totalInstallments} EMIs Paid ({remainingInstallments} remaining)
              </span>
            </div>
          </div>

          {/* Visual Repayment Progress Component */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Loan Repayment Progress</span>
                <span className="font-mono text-emerald-400 font-bold">{progressPercent}% Cleared</span>
              </div>
              <span className="font-mono text-slate-300">
                {formatMoney(totalRepaid)} Total Paid to Date
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
              <span>{paidInstallments} Installments Paid</span>
              <span>{remainingInstallments} Installments Remaining</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onPayEmi}
                className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pay EMI / Submit Proof</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewSchedule}
                className="text-xs text-white border-white/20 hover:bg-white/10 cursor-pointer"
              >
                <span>Repayment Schedule</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewPayments}
                className="text-xs text-white border-white/20 hover:bg-white/10 cursor-pointer"
              >
                <span>Payment History</span>
              </Button>
            </div>

            <Link href={`/loans/${loan.id}`} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
              <span>View Full Ledger Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
