import React, { useState } from 'react';
import { paymentsApi } from '../payments/api';
import { X, Coins, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSettlementModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [providerCode, setProviderCode] = useState('RAZORPAY');
  const [grossAmount, setGrossAmount] = useState('250000');
  const [transactionCount, setTransactionCount] = useState('45');
  const [contractedMdrPct, setContractedMdrPct] = useState('1.75');
  const [deductedFees, setDeductedFees] = useState('5162.50');
  const [utrNumber, setUtrNumber] = useState(`UTR-SETTLE-${Date.now().toString().slice(-6)}`);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(grossAmount) <= 0) return;

    setLoading(true);
    try {
      await paymentsApi.createSettlementBatch({
        providerCode,
        grossAmount: Number(grossAmount),
        transactionCount: Number(transactionCount),
        contractedMdrPct: Number(contractedMdrPct),
        deductedFees: Number(deductedFees),
        utrNumber,
      });

      alert('Settlement batch recorded & fee variance calculated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create settlement batch');
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
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Record PG Settlement Batch
              </h3>
              <p className="text-xs text-zinc-500">Gateway Remittance & Fee Variance Reconciliation</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Payment Provider *
              </label>
              <select
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="RAZORPAY">Razorpay</option>
                <option value="CASHFREE">Cashfree</option>
                <option value="PAYTM">Paytm PG</option>
                <option value="HDFC_NODAL">HDFC Nodal Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Transaction Count *
              </label>
              <input
                type="number"
                required
                min="1"
                value={transactionCount}
                onChange={(e) => setTransactionCount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Gross Collected Volume (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Agreed MDR Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={contractedMdrPct}
                onChange={(e) => setContractedMdrPct(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Total Fees Deducted (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={deductedFees}
                onChange={(e) => setDeductedFees(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Bank Nodal UTR / Reference
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
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
              Save Settlement Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
