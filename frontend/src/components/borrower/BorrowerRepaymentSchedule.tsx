'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  schedule: any[];
  loanNo: string;
  isDark: boolean;
}

export const BorrowerRepaymentSchedule: React.FC<Props> = ({ schedule, loanNo, isDark }) => {
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'UPCOMING' | 'OVERDUE'>('ALL');
  const [search, setSearch] = useState('');

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const rows = Array.isArray(schedule) ? schedule : [];

  const filteredRows = rows.filter((inst) => {
    const status = String(inst.status || '').toUpperCase();
    if (filter === 'PAID' && status !== 'PAID') return false;
    if (filter === 'UPCOMING' && !['UPCOMING', 'DUE'].includes(status)) return false;
    if (filter === 'OVERDUE' && status !== 'OVERDUE') return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const emiMatch = String(inst.emiNumber).includes(q);
      const dateMatch = inst.dueDate && formatDate(inst.dueDate).toLowerCase().includes(q);
      if (!emiMatch && !dateMatch) return false;
    }

    return true;
  });

  const paidCount = rows.filter((r) => r.status === 'PAID').length;
  const overdueCount = rows.filter((r) => r.status === 'OVERDUE').length;

  return (
    <div className={cn('p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in', cardBgClass)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold tracking-tight">Repayment Schedule & Amortization</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
              Loan #{loanNo}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete schedule of monthly installments, principal reduction, and interest allocation.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'PAID', 'UPCOMING', 'OVERDUE'] as const).map((tab) => (
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
              {tab === 'PAID' && `Paid (${paidCount})`}
              {tab === 'UPCOMING' && 'Upcoming'}
              {tab === 'OVERDUE' && `Overdue (${overdueCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-xs">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by EMI # or date..."
          className="text-xs"
        />
      </div>

      {/* Schedule Table for Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1E2445]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-[#1E2445] text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">EMI #</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Installment</th>
              <th className="py-3 px-4">Principal</th>
              <th className="py-3 px-4">Interest</th>
              <th className="py-3 px-4">Remaining Balance</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#1E2445]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No installment records found matching filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((inst) => {
                const status = String(inst.status || 'UPCOMING').toUpperCase();
                const isPaid = status === 'PAID';
                const isInstOverdue = status === 'OVERDUE';

                return (
                  <tr
                    key={inst.id || inst.emiNumber}
                    className={cn(
                      'transition-colors',
                      isPaid ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : isInstOverdue ? 'bg-rose-50/30 dark:bg-rose-950/15' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    )}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{inst.emiNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {formatDate(inst.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatMoney(Number(inst.totalDue || 0))}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {formatMoney(Number(inst.principal || 0))}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {formatMoney(Number(inst.interest || 0))}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {formatMoney(Number(inst.outstanding || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge status={status} />
                      {inst.paidDate && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Paid {formatDate(inst.paidDate)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive Cards for Mobile */}
      <div className="md:hidden space-y-3">
        {filteredRows.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No installment records found matching filter.
          </div>
        ) : (
          filteredRows.map((inst) => {
            const status = String(inst.status || 'UPCOMING').toUpperCase();
            const isPaid = status === 'PAID';
            const isInstOverdue = status === 'OVERDUE';

            return (
              <div
                key={inst.id || inst.emiNumber}
                className={cn(
                  'p-4 rounded-2xl border transition-all space-y-2.5 text-xs',
                  isPaid
                    ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/15'
                    : isInstOverdue
                    ? 'border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-slate-900/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      EMI #{inst.emiNumber}
                    </span>
                    <span className="text-slate-400 text-xs">• {formatDate(inst.dueDate)}</span>
                  </div>
                  <Badge status={status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Installment Amount</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatMoney(Number(inst.totalDue || 0))}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Principal + Interest</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatMoney(Number(inst.principal || 0))} + {formatMoney(Number(inst.interest || 0))}
                    </span>
                  </div>
                </div>

                {inst.paidDate && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Paid on {formatDate(inst.paidDate)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
