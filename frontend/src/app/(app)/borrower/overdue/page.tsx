'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Info,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

interface OverdueInstallment {
  emiNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  feeDue: number;
  totalDue: number;
  outstanding: number;
  status: string;
}

interface OverdueLoanItem {
  loanId: string;
  loanAccountNumber: string;
  productName: string;
  totalOutstanding: number;
  overdueAmount: number;
  dpd: number;
  agingBucket: string;
  oldestOverdueDate: string | null;
  overdueInstallmentsCount: number;
  affectedInstallments: OverdueInstallment[];
  activePtp: {
    id: string;
    promisedDate: string;
    promisedAmount: number;
    paymentMode?: string;
    status: string;
    createdAt: string;
  } | null;
  borrowerMessage: string;
}

interface OverdueSummary {
  hasOverdue: boolean;
  totalOverdueAmount: number;
  maxDpd: number;
  overdueLoansCount: number;
  overdueLoans: OverdueLoanItem[];
}

export default function BorrowerOverduePage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  // Payment Modal State
  const [payingLoan, setPayingLoan] = useState<OverdueLoanItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD'>('UPI');
  const [upiId, setUpiId] = useState<string>('');

  // PTP Modal State
  const [ptpLoan, setPtpLoan] = useState<OverdueLoanItem | null>(null);
  const [ptpDate, setPtpDate] = useState<string>('');
  const [ptpAmount, setPtpAmount] = useState<string>('');
  const [ptpNotes, setPtpNotes] = useState<string>('');

  // 1. Fetch Authoritative Overdue Summary
  const {
    data: overdueSummary,
    isLoading,
    error: loadError,
    refetch,
    isRefetching,
  } = useQuery<OverdueSummary>({
    queryKey: ['borrower-overdue-summary'],
    queryFn: async () => {
      const res = await api.get('/borrower/overdue');
      return res.data?.data || res.data;
    },
  });

  // 2. Repayment Mutation
  const paymentMutation = useMutation({
    mutationFn: async (payload: { loanId: string; amount: number; paymentMethod: string; upiVpa?: string }) => {
      const res = await api.post('/borrower/payments', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      toastSuccess(
        'Payment Processed Successfully',
        `₹${data.amount?.toLocaleString('en-IN')} remitted. Your overdue status and loan ledger have been updated.`
      );
      setPayingLoan(null);
      queryClient.invalidateQueries({ queryKey: ['borrower-overdue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-loans'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
    },
    onError: (err: any) => {
      toastError(
        'Payment Failed',
        err.response?.data?.message || err.message || 'Unable to process repayment at this time.'
      );
    },
  });

  // 3. PTP Mutation
  const ptpMutation = useMutation({
    mutationFn: async (payload: { loanId: string; promisedDate: string; promisedAmount: number; notes?: string }) => {
      const res = await api.post('/borrower/ptp', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      toastSuccess(
        'Promise to Pay Confirmed',
        `Commitment of ₹${data.promisedAmount?.toLocaleString('en-IN')} by ${new Date(data.promisedDate).toLocaleDateString('en-IN')} recorded.`
      );
      setPtpLoan(null);
      queryClient.invalidateQueries({ queryKey: ['borrower-overdue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-ptps'] });
    },
    onError: (err: any) => {
      toastError(
        'PTP Registration Failed',
        err.response?.data?.message || err.message || 'Could not record Promise to Pay.'
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Checking overdue & delinquency status...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unable to Load Overdue Information</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {(loadError as any)?.response?.data?.message || (loadError as any)?.message || 'An error occurred while communicating with the lending server.'}
        </p>
        <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-500 text-white rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Status Check
        </Button>
      </div>
    );
  }

  const hasOverdue = overdueSummary?.hasOverdue;
  const overdueLoans = overdueSummary?.overdueLoans || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/borrower"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-xs rounded-xl border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 2. Overdue State vs Good Standing State */}
      {!hasOverdue ? (
        <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Overdue Payments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            All your loan accounts are in good standing with 0 Days Past Due (DPD). Keep up timely repayments to maintain your credit score.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/borrower/loans">
              <Button variant="outline" className="rounded-xl text-xs">
                View Active Loans
              </Button>
            </Link>
            <Link href="/borrower/payments">
              <Button className="rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900">
                Payment History
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue Alert Hero Banner */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-amber-700 text-white shadow-xl shadow-red-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {overdueSummary.maxDpd} Days Past Due (DPD)
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Delinquency Notice</h1>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-xs text-rose-100 font-medium uppercase tracking-wider">Total Overdue Payable</span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight">
                  ₹{overdueSummary.totalOverdueAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <p className="text-sm text-rose-100 max-w-2xl leading-relaxed border-t border-white/10 pt-4">
              Timely clearance prevents additional late fee penalties, legal recovery actions, and negative bureau reporting to credit rating agencies.
            </p>
          </div>

          {/* Overdue Loans List */}
          <div className="space-y-6">
            {overdueLoans.map((loan) => (
              <Card
                key={loan.loanId}
                className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-3xl shadow-sm space-y-6"
              >
                {/* Loan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{loan.productName}</h3>
                      <Badge variant="danger" className="text-[10px] uppercase font-bold tracking-wider">
                        Bucket: {loan.agingBucket}
                      </Badge>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800">
                        {loan.dpd} DPD
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      Account: {loan.loanAccountNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setPtpLoan(loan);
                        setPtpAmount(loan.overdueAmount.toString());
                        const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                        setPtpDate(inThreeDays.toISOString().split('T')[0]);
                      }}
                      variant="outline"
                      className="text-xs rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      Promise to Pay (PTP)
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setPayingLoan(loan);
                        setPayAmount(loan.overdueAmount.toString());
                      }}
                      className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-md shadow-red-500/20"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Pay ₹{loan.overdueAmount.toLocaleString('en-IN')}
                    </Button>
                  </div>
                </div>

                {/* Active PTP Banner (if any) */}
                {loan.activePtp && (
                  <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-200">
                          Active Promise to Pay Commitment
                        </span>
                        <Badge className="bg-blue-600 text-white text-[10px]">
                          {loan.activePtp.status}
                        </Badge>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        You have promised to pay ₹{loan.activePtp.promisedAmount.toLocaleString('en-IN')} by{' '}
                        <span className="font-bold">
                          {new Date(loan.activePtp.promisedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        . Honoring this commitment preserves your credit standing.
                      </p>
                    </div>
                  </div>
                )}

                {/* Affected Delinquent Installments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" /> Delinquent Installments ({loan.overdueInstallmentsCount})
                  </h4>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                        <tr>
                          <th className="px-4 py-3">EMI #</th>
                          <th className="px-4 py-3">Due Date</th>
                          <th className="px-4 py-3 text-right">Principal</th>
                          <th className="px-4 py-3 text-right">Interest</th>
                          <th className="px-4 py-3 text-right">Overdue Total</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loan.affectedInstallments.map((inst) => (
                          <tr key={inst.emiNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-medium">Installment {inst.emiNumber}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                              {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">₹{inst.principalDue.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right font-mono">₹{inst.interestDue.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 font-mono">
                              ₹{inst.totalDue.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold">
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Borrower Guidance */}
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{loan.borrowerMessage}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. Repayment Modal */}
      {payingLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Pay Overdue Amount</h3>
              </div>
              <button
                onClick={() => setPayingLoan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Payment Amount (₹)
                </label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="rounded-xl font-bold text-lg"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Total overdue: ₹{payingLoan.overdueAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NET_BANKING')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'NET_BANKING'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Net Banking</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DEBIT_CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'DEBIT_CARD'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Debit Card</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    UPI ID / VPA (Optional)
                  </label>
                  <Input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@okhdfcbank"
                    className="rounded-xl text-sm"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setPayingLoan(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amt = Number(payAmount);
                  if (!amt || amt <= 0) {
                    toastError('Invalid Amount', 'Please enter a valid payment amount.');
                    return;
                  }
                  paymentMutation.mutate({
                    loanId: payingLoan.loanId,
                    amount: amt,
                    paymentMethod,
                    upiVpa: upiId || undefined,
                  });
                }}
                disabled={paymentMutation.isPending}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                {paymentMutation.isPending ? <Spinner size="sm" /> : null}
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Promise to Pay (PTP) Modal */}
      {ptpLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Record Promise to Pay (PTP)</h3>
              </div>
              <button
                onClick={() => setPtpLoan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Commit to a future repayment date for account <span className="font-mono font-bold">{ptpLoan.loanAccountNumber}</span>.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Promised Repayment Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Promised Amount (₹)
                </label>
                <Input
                  type="number"
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(e.target.value)}
                  placeholder="Enter promised amount"
                  className="rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Reason / Notes (Optional)
                </label>
                <Input
                  type="text"
                  value={ptpNotes}
                  onChange={(e) => setPtpNotes(e.target.value)}
                  placeholder="e.g. Salary credited on 5th"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setPtpLoan(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const amt = Number(ptpAmount);
                  if (!amt || amt <= 0) {
                    toastError('Invalid Amount', 'Promised amount must be greater than zero.');
                    return;
                  }
                  if (!ptpDate) {
                    toastError('Missing Date', 'Please choose a valid promised date.');
                    return;
                  }
                  ptpMutation.mutate({
                    loanId: ptpLoan.loanId,
                    promisedDate: ptpDate,
                    promisedAmount: amt,
                    notes: ptpNotes || undefined,
                  });
                }}
                disabled={ptpMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
              >
                {ptpMutation.isPending ? <Spinner size="sm" /> : null}
                Record Commitment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
