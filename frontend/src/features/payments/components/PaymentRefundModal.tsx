import React, { useState } from 'react';
import { paymentsApi } from '../api';
import { X, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  paymentId: string;
  paymentNo: string;
  maxAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentRefundModal: React.FC<Props> = ({
  paymentId,
  paymentNo,
  maxAmount,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [reason, setReason] = useState('Customer requested surplus refund');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0 || Number(amount) > maxAmount) {
      alert(`Refund amount must be between ₹1 and ₹${maxAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await paymentsApi.processRefund(paymentId, {
        amount: Number(amount),
        reason,
        comments,
      });
      alert('Refund processed and Double-Entry GL Journal posted successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Process Payment Refund
              </h3>
              <p className="text-xs text-zinc-500">Payment #{paymentNo}</p>
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
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Refund will debit Customer Unallocated Deposits (GL 2010) and credit Bank Account (GL 1010).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Refund Amount (Max: ₹{maxAmount.toFixed(2)}) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={maxAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-purple-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Refund Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="Customer requested surplus refund">Customer requested surplus refund</option>
              <option value="Duplicate payment received">Duplicate payment received</option>
              <option value="Incorrect loan account credited">Incorrect loan account credited</option>
              <option value="Loan settlement excess refund">Loan settlement excess refund</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Internal Audit Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide reason and approval note..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-purple-500 outline-none"
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
