import React, { useState } from 'react';
import { paymentsApi } from '../api';
import { X, Send, Building, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayoutInitiateModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState('50000');
  const [beneficiaryName, setBeneficiaryName] = useState('Rahul Sharma');
  const [beneficiaryAccountNo, setBeneficiaryAccountNo] = useState('918237465012');
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState('HDFC0000128');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) return;

    setLoading(true);
    try {
      const payout = await paymentsApi.initiatePayout({
        loanId: loanId || undefined,
        amount: Number(amount),
        beneficiaryName,
        beneficiaryAccountNo,
        beneficiaryIfsc,
      });

      alert(`Disbursement payout initiated! Status: ${payout.status}. UTR: ${payout.utrNumber || 'Processing'}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate payout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Initiate Direct Loan Payout
              </h3>
              <p className="text-xs text-zinc-500">Automated NEFT / IMPS Banking Disbursement Desk</p>
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
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Loan ID / Reference (Optional)
            </label>
            <input
              type="text"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              placeholder="e.g. loan-123"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Sanctioned Loan Principal (₹) *
            </label>
            <input
              type="number"
              required
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 dark:text-blue-400"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Net payout after upfront fee deduction (₹500 + 18% GST = ₹590): ₹
              {(Number(amount) - 590 > 0 ? Number(amount) - 590 : 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Beneficiary Name *
            </label>
            <input
              type="text"
              required
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                required
                value={beneficiaryAccountNo}
                onChange={(e) => setBeneficiaryAccountNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Bank IFSC Code *
              </label>
              <input
                type="text"
                required
                value={beneficiaryIfsc}
                onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
              />
            </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Execute Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
