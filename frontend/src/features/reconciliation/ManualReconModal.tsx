import React, { useState } from 'react';
import { paymentsApi } from '../payments/api';
import { X, FileCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  exception: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualReconModal: React.FC<Props> = ({ exception, isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState('LEDGER_CORRECTION');
  const [amount, setAmount] = useState(exception?.discrepancyAmount?.toString() || '0');
  const [reason, setReason] = useState(
    `Manual adjustment to reconcile ${exception?.type || 'exception'} for ${exception?.loanNo || 'loan'}`
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !exception) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await paymentsApi.proposeAdjustment({
        type,
        loanId: exception.loanId || 'loan-manual',
        exceptionId: exception.exceptionId,
        amount: Number(amount),
        reason,
      });

      alert('Ledger adjustment proposed! Auto-resolved or routed to Checker approval.');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to propose adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Manual Exception Resolution
              </h3>
              <p className="text-xs text-zinc-500">Maker-Checker Dual Control Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Exception ID:</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{exception.exceptionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Discrepancy:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                ₹{Number(exception.discrepancyAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Adjustment Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="LEDGER_CORRECTION">Ledger Correction</option>
              <option value="REALLOCATION">Bucket Reallocation</option>
              <option value="WAIVER">Penalty / Fee Waiver</option>
              <option value="REVERSAL">Payment Reversal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Adjustment Amount (₹) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Audit Rationale / Justification *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detailed justification for financial ledger audit trail..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
