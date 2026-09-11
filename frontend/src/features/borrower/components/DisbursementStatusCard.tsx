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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Fund Transfer Status</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Direct Bank Account Disbursement
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant electronic fund transfer to your verified bank account
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isDisbursed
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse'
          }`}
        >
          {isDisbursed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          <span>{isDisbursed ? 'DISBURSEMENT COMPLETED' : 'PROCESSING PAYOUT'}</span>
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950 to-blue-950/30 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">Net Disbursed Amount</span>
          <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
            ₹{netDisbursedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">
            Principal: ₹{approvedAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Receiving Account</span>
          <div className="text-base font-bold text-white mt-1">{bankName}</div>
          <span className="text-xs text-slate-400 font-mono">{accountNumber}</span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Transaction Reference</span>
          <div className="text-sm font-mono font-bold text-blue-400 mt-1">
            UTR-{Date.now().toString().slice(-8)}
          </div>
          <span className="text-[11px] text-slate-500">RTGS / IMPS Direct Credit</span>
        </div>
      </div>

      {onViewLoan && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onViewLoan}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>Go to Active Loan & Repayment Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
