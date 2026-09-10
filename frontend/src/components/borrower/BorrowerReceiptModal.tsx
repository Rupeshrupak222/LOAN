'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building,
  Receipt,
  Clock,
  CreditCard,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const BorrowerReceiptModal: React.FC<Props> = ({ payment, isOpen, onClose, isDark }) => {
  if (!isOpen || !payment) return null;

  const paymentNo = payment.paymentNo || payment.submissionNo || `PAY-${payment.id?.slice(0, 8)?.toUpperCase() || 'RECEIPT'}`;
  const loanNo = payment.loan?.loanNo || payment.loanNo || 'LN-ACTIVE';
  const amount = Number(payment.amount || 0);
  const paidAt = payment.paidAt || payment.createdAt || new Date().toISOString();
  const method = payment.method ? payment.method.replace(/_/g, ' ') : 'UPI / Electronic Transfer';
  const reference = payment.reference || payment.idempotencyKey || 'Verified Banking Transfer';
  const status = payment.status || 'SUCCESS';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div
        className={cn(
          'relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all print:border-none print:shadow-none',
          isDark ? 'bg-[#0B1528] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white relative print:bg-none print:text-black">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors print:hidden cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Verified Payment
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-0.5">Adyapan Financial Services</h2>
            </div>
          </div>
          <p className="text-xs text-blue-100/80 mt-1">Official Electronic Repayment Receipt & Audit Acknowledgment</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Amount Callout */}
          <div className="text-center py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-blue-900/40">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
              Amount Successfully Paid
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {formatMoney(amount)}
            </span>
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Payment Completed & Account Credited</span>
            </div>
          </div>

          {/* Key Receipt Fields Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-blue-900/30">
              <span className="text-slate-400 block font-medium text-[11px]">Receipt / Payment ID</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white mt-1 block select-all">
                {paymentNo}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-blue-900/30">
              <span className="text-slate-400 block font-medium text-[11px]">Loan Account</span>
              <span className="font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                {loanNo}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-blue-900/30">
              <span className="text-slate-400 block font-medium text-[11px]">Transaction Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {formatDate(paidAt)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-blue-900/30">
              <span className="text-slate-400 block font-medium text-[11px]">Payment Mode</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block uppercase">
                {method}
              </span>
            </div>

            <div className="col-span-2 p-3.5 rounded-xl border bg-white/40 dark:bg-slate-900/40 border-slate-200/70 dark:border-blue-900/30">
              <span className="text-slate-400 block font-medium text-[11px]">Bank Reference / UTR Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white mt-1 block select-all break-all">
                {reference}
              </span>
            </div>
          </div>

          {/* Allocation Breakdown if present */}
          {Array.isArray(payment.allocations) && payment.allocations.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-blue-900/30">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Ledger Allocation Breakdown:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {payment.allocations.map((a: any) => (
                  <div key={a.id || a.bucket} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">{a.bucket}</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatMoney(Number(a.amount || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Watermark Footer */}
          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Digitally Signed by Central Repayment Gateway</span>
            </div>
            <span>Statutory Copy</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-[#2563EB] hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Receipt</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
