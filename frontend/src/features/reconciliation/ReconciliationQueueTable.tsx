import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ExceptionItem {
  exceptionId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'ADJUSTED' | 'DISMISSED';
  loanNo?: string;
  loanId?: string;
  paymentId?: string;
  reference?: string;
  discrepancyAmount: number;
  whatHappened: string;
  evidence: string;
  recommendedAction: string;
  detectedAt: string;
}

interface Props {
  exceptions: ExceptionItem[];
  onProposeAdjustment: (exception: ExceptionItem) => void;
}

export const ReconciliationQueueTable: React.FC<Props> = ({ exceptions, onProposeAdjustment }) => {
  if (exceptions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">All Financial Ledgers Balanced</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          No active financial discrepancies or allocation imbalances detected across Provider, Internal Transactions, and Double-Entry GL Ledgers.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Exception ID & Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Loan / Ref</th>
              <th className="py-3 px-4">Discrepancy</th>
              <th className="py-3 px-4">Root Cause & Evidence</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {exceptions.map((exc) => (
              <tr key={exc.exceptionId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{exc.exceptionId}</div>
                  <div className="text-[11px] text-zinc-500">{exc.type}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(
                      exc.severity
                    )}`}
                  >
                    {exc.severity}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{exc.loanNo || 'N/A'}</div>
                  {exc.reference && <div className="text-[10px] text-zinc-400 font-mono">Ref: {exc.reference}</div>}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-rose-600 dark:text-rose-400">
                    ₹{exc.discrepancyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="py-3.5 px-4 max-w-sm">
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium truncate">{exc.whatHappened}</p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{exc.evidence}</p>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onProposeAdjustment(exc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
