import React, { useState } from 'react';
import { paymentsApi } from '../api';
import { X, RotateCcw, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';

interface Props {
  paymentId: string;
  paymentNo: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentReverseModal: React.FC<Props> = ({
  paymentId,
  paymentNo,
  amount,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('Cheque / NACH mandate bounced by bank');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await paymentsApi.reversePayment(paymentId, {
        reason,
        comments,
      });
      alert('Payment reversed! Schedule installments and outstanding loan balances have been restored with compensating GL entry.');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reverse payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Reverse Payment (Bounce / Rollback)
              </h3>
              <p className="text-xs text-zinc-500">Payment #{paymentNo} (₹{amount.toFixed(2)})</p>
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
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-800 dark:text-orange-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Compensating General Ledger Rollback
            </div>
            <p>
              Reversing this payment will automatically reopen paid schedule installments, restore outstanding principal and interest balances, and post a counter-balancing journal entry to the GL.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Reversal Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="Cheque / NACH mandate bounced by bank">Cheque / NACH mandate bounced by bank</option>
              <option value="UPI payment chargeback / bank revocation">UPI payment chargeback / bank revocation</option>
              <option value="Fraudulent transaction claim">Fraudulent transaction claim</option>
              <option value="Settlement netting cancellation">Settlement netting cancellation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Audit Rationale / Banking Reference
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Bank return memo #RET-9921 insufficient funds..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 outline-none"
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
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Reversal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
