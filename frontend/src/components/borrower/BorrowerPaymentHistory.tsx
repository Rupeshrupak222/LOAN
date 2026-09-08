'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ArrowDownLeft,
  CreditCard,
  Send,
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { BorrowerReceiptModal } from './BorrowerReceiptModal';

interface Props {
  payments: any[];
  onPayEmi?: () => void;
  isDark: boolean;
}

export const BorrowerPaymentHistory: React.FC<Props> = ({ payments, onPayEmi, isDark }) => {
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0E1528] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const rows = Array.isArray(payments) ? payments : [];

  const filteredRows = rows.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const idMatch = (p.paymentNo || p.id || '').toLowerCase().includes(q);
    const loanMatch = (p.loan?.loanNo || p.loanNo || '').toLowerCase().includes(q);
    const refMatch = (p.reference || '').toLowerCase().includes(q);
    const methodMatch = (p.method || '').toLowerCase().includes(q);
    return idMatch || loanMatch || refMatch || methodMatch;
  });

  return (
    <div className={cn('p-6 sm:p-8 rounded-3xl border space-y-6 animate-fade-in', cardBgClass)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold tracking-tight">Payment & Repayment History</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {rows.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of all electronic repayments, UPI transfers, and digital transaction receipts.
          </p>
        </div>

        {onPayEmi && (
          <Button
            type="button"
            size="sm"
            onClick={onPayEmi}
            className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Make Payment / Submit Proof</span>
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="max-w-xs">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Payment ID, UTR, or Loan #..."
          className="text-xs"
        />
      </div>

      {/* Table / List View */}
      {filteredRows.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Receipt className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-400">
            {rows.length === 0
              ? 'No payments recorded yet. Your repayment transaction receipts will appear here.'
              : 'No payment records match your search criteria.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1E2445]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-[#1E2445] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Loan Account</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2445]">
                {filteredRows.map((p) => {
                  const paymentNo = p.paymentNo || `PAY-${p.id?.slice(0, 8)?.toUpperCase()}`;
                  const loanNo = p.loan?.loanNo || p.loanNo || 'LN-ACTIVE';
                  const amount = Number(p.amount || 0);
                  const paidAt = p.paidAt || p.createdAt;
                  const method = p.method ? p.method.replace(/_/g, ' ') : 'UPI / Transfer';
                  const reference = p.reference || '—';
                  const status = p.status || 'SUCCESS';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white select-all">
                        {paymentNo}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {loanNo}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {formatDate(paidAt)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold uppercase text-slate-600 dark:text-slate-400">
                        {method}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 truncate max-w-[150px] select-all">
                        {reference}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReceipt(p)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Receipt</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRows.map((p) => {
              const paymentNo = p.paymentNo || `PAY-${p.id?.slice(0, 8)?.toUpperCase()}`;
              const loanNo = p.loan?.loanNo || p.loanNo || 'LN-ACTIVE';
              const amount = Number(p.amount || 0);
              const paidAt = p.paidAt || p.createdAt;
              const method = p.method ? p.method.replace(/_/g, ' ') : 'UPI / Transfer';
              const status = p.status || 'SUCCESS';

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-slate-900/40 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {paymentNo}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{loanNo}</span>
                    </div>
                    <Badge status={status} />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Amount Paid</span>
                      <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {formatMoney(amount)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block uppercase">{method}</span>
                      <span className="text-slate-400 text-[11px]">{formatDate(paidAt)}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReceipt(p)}
                    className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 mt-2"
                  >
                    <span>View Digital Receipt →</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <BorrowerReceiptModal
          payment={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
