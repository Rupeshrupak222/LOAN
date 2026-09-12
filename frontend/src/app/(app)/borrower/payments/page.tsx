'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Receipt,
  Download,
  ShieldCheck,
  Building2,
  Smartphone,
  Wallet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

export default function BorrowerPaymentsHubPage() {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState<number>(4500);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD'>('UPI');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Fetch loans
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['borrower-loans-payment'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/api/v1/borrower/loans');
      const list = res.data?.data || res.data || [];
      if (list.length > 0 && !selectedLoanId) {
        setSelectedLoanId(list[0].id);
        setRepayAmount(list[0].nextEmiAmount || 4500);
      }
      return list;
    },
  });

  const activeLoan = loans.find((l: any) => l.id === selectedLoanId) || loans[0];

  // Repayment Mutation
  const payMutation = useMutation({
    mutationFn: async (payload: { loanId: string; amount: number; paymentMethod: string }) => {
      const res = await api.post<{ data: any }>(`/api/v1/borrower/loans/${payload.loanId}/pay`, payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setIsPayModalOpen(false);
      success('Payment Successful!', data.message || `₹${repayAmount.toLocaleString('en-IN')} paid successfully.`);
      queryClient.invalidateQueries({ queryKey: ['borrower-loans'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans-payment'] });
    },
    onError: (err: any) => {
      error('Payment Failed', err.response?.data?.message || 'Error processing payment.');
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading payments & mandate hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Payments & Repayment Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Make instant EMI repayments, manage eNACH AutoPay, and download payment receipts
            </p>
          </div>
        </div>
      </div>

      {/* Main Payment & Mandate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Pay Box */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Pay EMI / Custom Amount
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
              Instant UPI Rails
            </span>
          </div>

          {activeLoan ? (
            <div className="space-y-4">
              {/* Select Loan Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Select Loan Account</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => {
                    setSelectedLoanId(e.target.value);
                    const l = loans.find((x: any) => x.id === e.target.value);
                    if (l) setRepayAmount(l.nextEmiAmount || 4500);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                >
                  {loans.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.loanAccountNumber} — {l.productName} (Outstanding: ₹{l.outstandingPrincipal?.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">Repayment Amount (₹)</span>
                  <span className="text-slate-400">
                    Next Due EMI: <strong className="text-white">₹{activeLoan.nextEmiAmount?.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-lg font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: Smartphone },
                    { id: 'NET_BANKING', label: 'Net Banking', icon: Building2 },
                    { id: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          paymentMethod === m.id
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-[11px]">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={() => setIsPayModalOpen(true)}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 shadow-lg shadow-emerald-500/20"
              >
                Proceed to Pay ₹{repayAmount?.toLocaleString('en-IN')}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active loans found to repay.</p>
          )}
        </div>

        {/* Mandate Status Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Auto-Debit Mandate</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
              ACTIVE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
            <div className="flex justify-between text-slate-400">
              <span>Mandate Type:</span>
              <span className="text-white font-semibold">eNACH / NPCI AutoPay</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Linked Bank:</span>
              <span className="text-white">HDFC Bank Ltd</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Next Auto-Debit:</span>
              <span className="text-emerald-400 font-semibold">
                {activeLoan?.nextEmiDueDate || '15th of next month'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Auto-Debit Limit:</span>
              <span className="text-slate-200">Up to ₹50,000 / cycle</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            Automatic debits occur on the scheduled due date. To change linked bank account or revoke consent, contact grievance support.
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Confirm Payment via {paymentMethod}</h3>
              </div>
              <span className="text-sm font-black text-emerald-400">₹{repayAmount?.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                You are initiating a real-time EMI repayment towards loan account <strong className="text-white">{activeLoan?.loanAccountNumber}</strong>.
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Payment Rail: UPI 2.0 Instant Settlement</div>
                <div>Allocated Bucket: Principal & Accrued Interest</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
                className="rounded-xl border-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  payMutation.mutate({
                    loanId: activeLoan.id,
                    amount: repayAmount,
                    paymentMethod,
                  })
                }
                disabled={payMutation.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {payMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Processing Txn...
                  </span>
                ) : (
                  'Authorize & Pay'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
