'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  DollarSign,
  QrCode,
  Smartphone,
  Building,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomerPaymentsPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NETBANKING' | 'DEBIT_CARD'>('UPI');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me');
      const data = res.data.data;
      setCustomer(data);
      if (data?.loans?.length > 0) {
        setSelectedLoanId(data.loans[0].id);
        const nextEmi = data.loans[0].repaymentSchedule?.find(
          (s: any) => s.status === 'DUE' || s.status === 'UPCOMING' || s.status === 'OVERDUE'
        );
        if (nextEmi) {
          setPayAmount(String(parseFloat(nextEmi.totalDue || nextEmi.emiAmount || '0')));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch payments profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !payAmount || parseFloat(payAmount) <= 0) return;

    try {
      setPaying(true);
      setPayError(null);
      setPaySuccess(null);

      const refNo = `UPI-${Date.now().toString().slice(-8)}`;
      await api.post('/payments', {
        loanId: selectedLoanId,
        amount: parseFloat(payAmount),
        paymentMethod,
        referenceNumber: refNo,
      });

      setPaySuccess(`Payment of ₹${parseFloat(payAmount).toLocaleString('en-IN')} processed successfully! Ref: ${refNo}`);
      fetchProfile();
    } catch (err: any) {
      setPayError(err?.response?.data?.message || 'Payment submission failed. Please retry.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading repayment ledger...</p>
        </div>
      </div>
    );
  }

  const loans = customer?.loans || [];
  const selectedLoan = loans.find((l: any) => l.id === selectedLoanId) || loans[0];
  const payments = customer?.payments || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Repayment & Instant EMI Gateway
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Make instant loan repayments via UPI, Debit Card, or NetBanking with automatic ledger allocation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Instant EMI Payment
                  </h2>
                  <p className="text-xs text-slate-500">Secure 256-bit SSL encrypted transfer</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Lock className="h-3 w-3" /> PCI-DSS Compliant
              </span>
            </div>

            {paySuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{paySuccess}</span>
              </div>
            )}

            {payError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handlePayEmi} className="space-y-5">
              {/* Select Loan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Loan Account *
                </label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => {
                    setSelectedLoanId(e.target.value);
                    const l = loans.find((x: any) => x.id === e.target.value);
                    const next = l?.repaymentSchedule?.find(
                      (s: any) => s.status === 'DUE' || s.status === 'UPCOMING' || s.status === 'OVERDUE'
                    );
                    if (next) setPayAmount(String(parseFloat(next.totalDue || next.emiAmount || '0')));
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445] px-3 text-xs font-medium focus:border-brand-500 focus:outline-none"
                >
                  {loans.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.loanCode} — {l.product?.name || 'Loan'} (₹{parseFloat(l.principal).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Repayment Amount (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    required
                    className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445] pl-8 pr-3 text-sm font-bold focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mx-auto mb-1 text-brand-600" />
                    <span className="text-xs font-bold">UPI / GPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NETBANKING')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'NETBANKING'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building className="h-5 w-5 mx-auto mb-1 text-brand-600" />
                    <span className="text-xs font-bold">NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DEBIT_CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'DEBIT_CARD'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 mx-auto mb-1 text-brand-600" />
                    <span className="text-xs font-bold">Debit Card</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-blue-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {paying ? 'Processing Gateway Transaction...' : 'Pay EMI Now →'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Ledger Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand-600" />
              Repayment History
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No past payment transactions.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/40 border border-slate-100 dark:border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}</span>
                      <span className="font-mono">{p.referenceNumber || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
