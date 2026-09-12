import React, { useEffect, useState } from 'react';
import { paymentsApi } from '../api';
import { CustomerSafeReceipt } from '../types';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Building,
  CreditCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<Props> = ({ paymentId, isOpen, onClose }) => {
  const [receipt, setReceipt] = useState<CustomerSafeReceipt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      paymentsApi
        .getCustomerSafeReceipt(paymentId)
        .then((data) => setReceipt(data))
        .catch((err) => console.error('Failed to load receipt:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Official Payment Receipt
              </h3>
              <p className="text-xs text-zinc-500">Adyapan Lending OS — Verified Financial Acknowledgment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
              Generating verified financial receipt...
            </div>
          ) : receipt ? (
            <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 bg-zinc-50/50 dark:bg-zinc-950/40 relative">
              {/* Watermark Tag */}
              <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED TRANSACTION
              </div>

              {/* Institution Details */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  A
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">ADYAPAN NBFC & LENDING PLATFORM</div>
                  <div className="text-[11px] text-zinc-500">RBI Regulated NBFC-ND-SI • Digital Lending Partner</div>
                </div>
              </div>

              {/* Amount Banner */}
              <div className="text-center py-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
                <span className="text-xs font-medium text-zinc-500">Total Amount Paid</span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Successfully Settled via {receipt.method}
                </div>
              </div>

              {/* Transaction Key Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                <div>
                  <span className="text-zinc-400">Receipt No:</span>
                  <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{receipt.receiptNumber}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Loan Account:</span>
                  <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200">#{receipt.loanNo || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Date & Time:</span>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {new Date(receipt.paidAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400">Payment Status:</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">{receipt.status}</div>
                </div>
              </div>

              {/* Waterfall Breakdown */}
              <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs">
                <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Repayment Waterfall Allocation:</div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Principal Repaid:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{Number(receipt.principalPaid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Interest Servicing:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{Number(receipt.interestPaid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Fees & Charges Settled:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{Number(receipt.feesPaid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2 font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Remaining Loan Outstanding:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    ₹{Number(receipt.remainingLoanBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="mt-6 pt-4 border-t border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-6 h-6 text-zinc-400" />
                  <span>Scan to verify digital signature hash</span>
                </div>
                <span className="italic">Computer generated electronic receipt</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500 text-sm">Receipt details unavailable.</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
