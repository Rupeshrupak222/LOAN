'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { paymentsApi } from '@/features/payments/api';
import { PaymentItem } from '@/features/payments/types';
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge';
import { PaymentAllocationTable } from '@/features/payments/components/PaymentAllocationTable';
import { PaymentReceiptModal } from '@/features/payments/components/PaymentReceiptModal';
import { PaymentRefundModal } from '@/features/payments/components/PaymentRefundModal';
import { PaymentReverseModal } from '@/features/payments/components/PaymentReverseModal';
import {
  Receipt,
  ArrowLeft,
  Printer,
  RotateCcw,
  ShieldAlert,
  Clock,
  User,
  Building,
  CreditCard,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = String(params.id);

  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getPaymentDetail(paymentId);
      setPayment(data);
    } catch (err: any) {
      console.error('Failed to load payment detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400 text-sm animate-pulse">
        Loading payment transaction and ledger allocations...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <h3 className="text-lg font-bold">Payment Not Found</h3>
        <button
          onClick={() => router.push('/payments')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Payments
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/payments')}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payments Ledger
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setReceiptOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Official Receipt
          </button>

          {payment.status === 'SUCCESS' && (
            <>
              <button
                onClick={() => setRefundOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Process Refund
              </button>

              <button
                onClick={() => setReverseOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-semibold border border-orange-200 dark:border-orange-800 shadow-sm transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Reverse Payment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
              <PaymentStatusBadge status={payment.status} size="lg" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-mono">
              <span>Receipt: #{payment.paymentNo}</span>
              <span>•</span>
              <span>Method: {payment.method}</span>
              {payment.reference && (
                <>
                  <span>•</span>
                  <span>Ref: {payment.reference}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-500">Transaction Timestamp</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : 'N/A'}
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Allocation & Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waterfall Allocation Component */}
          <PaymentAllocationTable allocations={payment.allocations} totalAmount={payment.amount} />

          {/* Transaction Timeline */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Audit & State Timeline</h3>
            </div>

            <div className="space-y-4 border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 pl-5">
              {(payment.timeline || []).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-zinc-900" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{ev.status}</span>
                    <span className="text-zinc-400">{new Date(ev.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{ev.note}</p>
                  {ev.actorName && (
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Actor: {ev.actorName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Loan & Customer Summary) */}
        <div className="space-y-6">
          {/* Loan Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Loan Account Binding</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Loan Number:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  #{payment.loan?.loanNo || payment.loanNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Product:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {payment.loan?.product?.name || 'Loan'}
                </span>
              </div>
              {payment.loan && (
                <>
                  <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <span className="text-zinc-500">Outstanding Principal:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{Number(payment.loan.outstandingPrincipal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Outstanding Interest:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      ₹{Number(payment.loan.outstandingInterest).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Borrower Profile</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Borrower Name:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{payment.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer Code:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">{payment.customerCode || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentReceiptModal
        paymentId={payment.id}
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />

      <PaymentRefundModal
        paymentId={payment.id}
        paymentNo={payment.paymentNo}
        maxAmount={Number(payment.amount)}
        isOpen={refundOpen}
        onClose={() => setRefundOpen(false)}
        onSuccess={loadPayment}
      />

      <PaymentReverseModal
        paymentId={payment.id}
        paymentNo={payment.paymentNo}
        amount={Number(payment.amount)}
        isOpen={reverseOpen}
        onClose={() => setReverseOpen(false)}
        onSuccess={loadPayment}
      />
    </div>
  );
}
