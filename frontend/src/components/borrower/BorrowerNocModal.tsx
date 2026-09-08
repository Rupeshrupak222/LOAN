'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Award,
  Calendar,
  Building2,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface Props {
  loan: any;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const BorrowerNocModal: React.FC<Props> = ({ loan, isOpen, onClose, isDark }) => {
  if (!isOpen || !loan) return null;

  const closure = loan.closure;
  const nocNo = closure?.nocNumber || `NOC-${loan.loanNo?.replace('LN-', '') || '2026'}`;
  const loanNo = loan.loanNo || 'LN-CLOSED';
  const customerName = loan.customer
    ? `${loan.customer.firstName} ${loan.customer.lastName}`
    : 'Valued Borrower';
  const principal = Number(loan.principal || 0);
  const closedAt = closure?.closedAt || loan.closedAt || new Date().toISOString();
  const closureType = closure?.closureType
    ? closure.closureType.replace(/_/g, ' ')
    : 'FULL REPAYMENT & MATURITY';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div
        className={cn(
          'relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all print:border-none print:shadow-none',
          isDark ? 'bg-[#0B1528] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Certificate Golden Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white relative print:bg-none print:text-black">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors print:hidden cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                Official Certification
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                No Objection Certificate (NOC)
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1">
            Certificate of Complete Loan Repayment & Discharge of Liabilities
          </p>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Certificate Reference Number
            </span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 dark:text-white mt-1 block select-all">
              {nocNo}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
            <p>
              This is to certify that borrower{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{customerName}</strong> has
              satisfactorily liquidated all financial obligations pertaining to Loan Facility{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">{loanNo}</strong>{' '}
              sanctioned for the principal amount of{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{formatMoney(principal)}</strong>.
            </p>

            <p>
              As of <strong className="text-slate-900 dark:text-white">{formatDate(closedAt)}</strong>, the
              outstanding loan balance, interest, and related charges stand at{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">₹0.00 (NIL)</strong>.
              All hypothecations and lien claims are hereby extinguished.
            </p>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-blue-900/30">
              <span className="text-slate-400 block text-[11px]">Closure Type</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block uppercase">
                {closureType}
              </span>
            </div>

            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-blue-900/30">
              <span className="text-slate-400 block text-[11px]">Closure Date</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatDate(closedAt)}
              </span>
            </div>
          </div>

          {/* Seal & Signatures */}
          <div className="pt-3 border-t border-slate-200 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Issued by Adyapan Credit & Underwriting Committee</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              DIGITALLY VERIFIED
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Certificate</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
