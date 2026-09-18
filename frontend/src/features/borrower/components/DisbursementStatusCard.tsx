import React from 'react';
import {
  Wallet,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Receipt,
} from 'lucide-react';

interface DisbursementStatusCardProps {
  approvedAmount: number;
  netDisbursedAmount: number;
  bankName?: string;
  accountNumber?: string;
  isDisbursed?: boolean;
  onViewLoan?: () => void;
}

export const DisbursementStatusCard: React.FC<DisbursementStatusCardProps> = ({
  approvedAmount,
  netDisbursedAmount,
  bankName = 'HDFC Bank Ltd.',
  accountNumber = '•••• •••• 9812',
  isDisbursed = true,
  onViewLoan,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Fund Transfer Status</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Direct Bank Account Disbursement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instant electronic fund transfer to your verified bank account
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isDisbursed
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 animate-pulse'
          }`}
        >
          {isDisbursed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          <span>{isDisbursed ? 'DISBURSEMENT COMPLETED' : 'PROCESSING PAYOUT'}</span>
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-blue-50/70 dark:from-emerald-950/30 dark:via-slate-950 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Disbursed Amount</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ₹{netDisbursedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">
            Principal: ₹{approvedAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Receiving Account</span>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{bankName}</div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{accountNumber}</span>
        </div>

        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transaction Reference</span>
          <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
            UTR-{Date.now().toString().slice(-8)}
          </div>
          <span className="text-[11px] text-slate-500">RTGS / IMPS Direct Credit</span>
        </div>
      </div>

      {onViewLoan && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onViewLoan}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <span>Go to Active Loan & Repayment Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
