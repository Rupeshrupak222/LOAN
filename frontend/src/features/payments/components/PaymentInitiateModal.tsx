import React, { useState } from 'react';
import { paymentsApi } from '../api';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultLoanId?: string;
  defaultAmount?: number;
}

export const PaymentInitiateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultLoanId = '',
  defaultAmount = 5000,
}) => {
  const [loanId, setLoanId] = useState(defaultLoanId);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [method, setMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'GATEWAY'>('UPI');
  const [type, setType] = useState('EMI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    paymentId: string;
    paymentNo: string;
    checkoutUrl?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanId || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const res = await paymentsApi.initiatePayment({
        loanId,
        amount: Number(amount),
        method,
        type,
        notes,
      });
      setCheckoutData(res);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSimulation = async () => {
    if (!checkoutData) return;
    setLoading(true);
    try {
      await paymentsApi.confirmPayment(checkoutData.paymentId, {
        utrNumber: `UTR-UPI-${Date.now()}`,
      });
      alert('Payment confirmed & allocated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {checkoutData ? 'Complete Payment' : 'Initiate Payment / EMI'}
              </h3>
              <p className="text-xs text-zinc-500">M2P & mPokket-Grade Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!checkoutData ? (
          <form onSubmit={handleInitiate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Loan ID / Reference *
              </label>
              <input
                type="text"
                required
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="e.g. loan-id-123"
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payment Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="EMI">Monthly EMI</option>
                  <option value="PARTIAL_EMI">Partial Repayment</option>
                  <option value="FULL_REPAYMENT">Full Foreclosure</option>
                  <option value="CREDIT_LINE_REPAYMENT">Credit Line Repay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="GATEWAY">Razorpay / PG</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Notes / Audit Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional payment remarks..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Proceed to Checkout
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-9 h-9" />
            </div>

            <div>
              <div className="text-xs text-zinc-500 font-medium">Order #{checkoutData.paymentNo}</div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Scan via any UPI App or complete simulation</div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Virtual VPA:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">adyapan.repay@hdfcbank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment ID:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{checkoutData.paymentId}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmSimulation}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Simulate Successful Bank Payment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 py-1"
              >
                Cancel / Pay Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
