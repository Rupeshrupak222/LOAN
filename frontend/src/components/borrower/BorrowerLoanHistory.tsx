'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  Coins,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { BorrowerNocModal } from './BorrowerNocModal';

interface Props {
  loans: any[];
  onApplyNew?: () => void;
  isDark: boolean;
}

export const BorrowerLoanHistory: React.FC<Props> = ({ loans, onApplyNew, isDark }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED' | 'OVERDUE'>('ALL');
  const [selectedNocLoan, setSelectedNocLoan] = useState<any | null>(null);

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const rows = Array.isArray(loans) ? loans : [];

  const filteredRows = rows.filter((l) => {
    const status = String(l.status || '').toUpperCase();
    if (filter === 'ACTIVE' && !['ACTIVE', 'DISBURSED', 'RESTRUCTURED'].includes(status)) return false;
    if (filter === 'CLOSED' && !['CLOSED', 'SETTLED'].includes(status)) return false;
    if (filter === 'OVERDUE' && status !== 'OVERDUE') return false;
    return true;
  });

  const activeCount = rows.filter((l) => ['ACTIVE', 'DISBURSED', 'RESTRUCTURED'].includes(String(l.status || '').toUpperCase())).length;
  const closedCount = rows.filter((l) => ['CLOSED', 'SETTLED'].includes(String(l.status || '').toUpperCase())).length;
  const overdueCount = rows.filter((l) => String(l.status || '').toUpperCase() === 'OVERDUE').length;

  return (
    <div className={cn('p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in', cardBgClass)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold tracking-tight">Complete Loan History & Closures</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {rows.length} Total Facilities
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical portfolio of all your current and past borrowing accounts with Adyapan.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'ACTIVE', 'CLOSED', 'OVERDUE'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                filter === tab
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {tab === 'ALL' && `All (${rows.length})`}
              {tab === 'ACTIVE' && `Active (${activeCount})`}
              {tab === 'CLOSED' && `Closed (${closedCount})`}
              {tab === 'OVERDUE' && `Overdue (${overdueCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Cards List */}
      {filteredRows.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Wallet className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-400">
            {rows.length === 0
              ? "You don't have any loan accounts yet."
              : 'No loan records found matching the selected filter.'}
          </p>
          {onApplyNew && (
            <Button
              type="button"
              size="sm"
              onClick={onApplyNew}
              className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold mt-2"
            >
              Apply for a Loan →
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRows.map((loan) => {
            const status = String(loan.status || '').toUpperCase();
            const isClosed = ['CLOSED', 'SETTLED'].includes(status);
            const isOverdue = status === 'OVERDUE';
            const principal = Number(loan.principal || 0);
            const outstanding = Number(loan.outstandingPrincipal ?? (isClosed ? 0 : principal));
            const emiAmount = Number(loan.emiAmount || 0);
            const tenure = Number(loan.tenureMonths || 24);

            const schedule = Array.isArray(loan.schedule) ? loan.schedule : [];
            const paidEmis = schedule.filter((s: any) => s.status === 'PAID').length;
            const totalEmis = schedule.length > 0 ? schedule.length : tenure;

            const payments = Array.isArray(loan.payments) ? loan.payments : [];
            const totalRepaid = payments.reduce(
              (acc: number, p: any) => (p.status === 'SUCCESS' ? acc + Number(p.amount || 0) : acc),
              0
            );

            const closure = loan.closure;

            return (
              <div
                key={loan.id}
                className={cn(
                  'p-5 sm:p-6 rounded-2xl border transition-all space-y-4 relative overflow-hidden',
                  isClosed
                    ? 'border-emerald-500/25 bg-emerald-950/10 dark:bg-[#081814]'
                    : isOverdue
                    ? 'border-rose-500/30 bg-rose-950/10 dark:bg-[#1A080C]'
                    : 'border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-slate-900/40'
                )}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {loan.loanNo}
                    </span>
                    <Badge status={status} />
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {loan.disbursementDate ? `Disbursed ${formatDate(loan.disbursementDate)}` : 'Active'}
                  </span>
                </div>

                {/* Product Name */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {loan.product?.name || loan.productName || 'Personal Term Facility'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tenure} Months Tenure • {loan.interestRate || 12.5}% p.a.
                  </p>
                </div>

                {/* Financial Figures */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sanction Amount</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {formatMoney(principal)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">
                      {isClosed ? 'Total Repaid' : 'Outstanding Principal'}
                    </span>
                    <span
                      className={cn(
                        'font-mono font-bold text-base',
                        isClosed ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'
                      )}
                    >
                      {formatMoney(isClosed ? totalRepaid || principal : outstanding)}
                    </span>
                  </div>
                </div>

                {/* EMIs and Closure Info */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    {isClosed ? (
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Fully Repaid ({totalEmis}/{totalEmis} EMIs)
                      </strong>
                    ) : (
                      `${paidEmis} of ${totalEmis} EMIs Paid (${totalEmis - paidEmis} remaining)`
                    )}
                  </span>

                  {!isClosed && emiAmount > 0 && (
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatMoney(emiAmount)}/mo
                    </span>
                  )}
                </div>

                {/* Closed summary / NOC action */}
                {isClosed && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Closed {closure?.closedAt ? formatDate(closure.closedAt) : 'Account'}</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNocLoan(loan)}
                      className="text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 p-1 h-auto cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View NOC →</span>
                    </Button>
                  </div>
                )}

                {/* Details link */}
                <div className="pt-1">
                  <Link
                    href={`/loans/${loan.id}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 justify-end"
                  >
                    <span>View Full Ledger Detail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official NOC Certificate Modal */}
      {selectedNocLoan && (
        <BorrowerNocModal
          loan={selectedNocLoan}
          isOpen={!!selectedNocLoan}
          onClose={() => setSelectedNocLoan(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
