'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  FileCheck,
  Percent,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { BorrowerLoanSummary, BorrowerRepaymentScheduleItem } from '../types';
import { usePayLoanEmi } from '../hooks/useBorrower';

interface ActiveLoanManagerProps {
  loans: BorrowerLoanSummary[];
  onRefresh?: () => void;
}

export const ActiveLoanManager: React.FC<ActiveLoanManagerProps> = ({ loans, onRefresh }) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD'>('UPI');
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HISTORY'>('SCHEDULE');
  const [isNocModalOpen, setIsNocModalOpen] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any>(null);

  const payEmiMutation = usePayLoanEmi();

  const selectedLoan = loans.find((l) => l.id === selectedLoanId) || loans[0];

  if (!loans || loans.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <CreditCard className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Loans</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          You do not have any active or past loans with us yet. Discover our tailored financing products to get started.
        </p>
      </div>
    );
  }

  const repaidPrincipal = selectedLoan ? Math.max(0, selectedLoan.principal - selectedLoan.outstandingPrincipal) : 0;
  const progressPercent = selectedLoan ? Math.min(100, Math.round((repaidPrincipal / selectedLoan.principal) * 100)) : 0;

  const handleOpenPayModal = (amount: number) => {
    setPaymentAmount(amount);
    setIsPayModalOpen(true);
    setPaymentSuccessReceipt(null);
  };

  const handleExecutePayment = async () => {
    if (!selectedLoan || paymentAmount <= 0) return;
    try {
      const res = await payEmiMutation.mutateAsync({
        loanId: selectedLoan.id,
        data: {
          amount: paymentAmount,
          method: paymentMethod,
          reference: `BORROWER_PORTAL_${Date.now()}`,
        },
      });
      setPaymentSuccessReceipt(res);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Selector if multiple loans */}
      {loans.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {loans.map((loan) => (
            <button
              key={loan.id}
              onClick={() => setSelectedLoanId(loan.id)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedLoanId === loan.id
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>{loan.product?.name || 'Loan'} • {loan.loanNo}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full uppercase ${
                loan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-300'
              }`}>
                {loan.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Loan Overview Dashboard */}
      {selectedLoan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Loan Status Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  {selectedLoan.product?.name || 'Term Loan'}
                </span>
                <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-3">
                  Loan #{selectedLoan.loanNo}
                  {selectedLoan.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active & Servicing
                    </span>
                  )}
                  {selectedLoan.status === 'CLOSED' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Closed / Settled
                    </span>
                  )}
                </h2>
              </div>

              {selectedLoan.status === 'CLOSED' ? (
                <button
                  onClick={() => setIsNocModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  Download NOC Certificate
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPayModal(selectedLoan.emiAmount)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Upcoming EMI
                </button>
              )}
            </div>

            {/* Repayment Progress Bar */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Outstanding Principal</div>
                  <div className="text-3xl font-extrabold text-white mt-0.5">
                    ₹{selectedLoan.outstandingPrincipal.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Sanctioned Amount</div>
                  <div className="text-base font-bold text-slate-300 mt-0.5">
                    ₹{selectedLoan.principal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-3 p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                <span>Repaid: ₹{repaidPrincipal.toLocaleString('en-IN')} ({progressPercent}%)</span>
                <span>Tenure: {selectedLoan.tenureMonths} Months</span>
              </div>
            </div>

            {/* Loan Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Monthly EMI</div>
                <div className="text-lg font-bold text-white mt-1">₹{selectedLoan.emiAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Interest Rate</div>
                <div className="text-lg font-bold text-blue-400 mt-1">{selectedLoan.interestRate}% p.a.</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Disbursed Date</div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  {selectedLoan.disbursementDate ? new Date(selectedLoan.disbursementDate).toLocaleDateString('en-IN') : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Next Due Date</div>
                <div className="text-sm font-semibold text-amber-400 mt-1">
                  {selectedLoan.nextDueDate ? new Date(selectedLoan.nextDueDate).toLocaleDateString('en-IN') : 'Completed'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Pay / Next Installment Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                Next Payment Due
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Installment Details</h3>

              <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Amount:</span>
                  <span className="font-bold text-white">₹{selectedLoan.emiAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="font-semibold text-amber-300">
                    {selectedLoan.nextDueDate ? new Date(selectedLoan.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Auto-Debit Status:</span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    eNACH Active
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Your monthly installment will be automatically deducted from your registered bank account on the scheduled due date. You can also pay manually in advance.
              </p>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => handleOpenPayModal(selectedLoan.emiAmount)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Pay Early via UPI / NetBanking
              </button>
              <button
                onClick={() => handleOpenPayModal(selectedLoan.outstandingPrincipal)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
              >
                Prepay Full Outstanding Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Repayment Schedule vs Transaction History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('SCHEDULE')}
              className={`pb-2 text-sm font-bold transition-all relative ${
                activeTab === 'SCHEDULE' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              Repayment Schedule ({selectedLoan?.schedule?.length || 0} EMIs)
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-2 text-sm font-bold transition-all relative ${
                activeTab === 'HISTORY' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
              }`}
            >
              Payment History ({selectedLoan?.payments?.length || 0})
            </button>
          </div>
        </div>

        {/* Repayment Schedule Tab */}
        {activeTab === 'SCHEDULE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Principal</th>
                  <th className="py-3 px-4">Interest</th>
                  <th className="py-3 px-4">Total Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {selectedLoan?.schedule && selectedLoan.schedule.length > 0 ? (
                  selectedLoan.schedule.map((item) => (
                    <tr key={item.id || item.emiNumber} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-300">#{item.emiNumber}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">₹{item.principal.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-slate-400">₹{item.interest.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 font-bold text-white">₹{item.totalDue.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4">
                        {item.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </span>
                        )}
                        {item.status === 'DUE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Due Now
                          </span>
                        )}
                        {item.status === 'UPCOMING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Upcoming
                          </span>
                        )}
                        {item.status === 'OVERDUE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status !== 'PAID' ? (
                          <button
                            onClick={() => handleOpenPayModal(item.totalDue)}
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition-all"
                          >
                            Pay
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">Receipt Available</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No schedule entries available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'HISTORY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {selectedLoan?.payments && selectedLoan.payments.length > 0 ? (
                  selectedLoan.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-400">{p.paymentNo}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {new Date(p.paidAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.method}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{p.reference || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay EMI Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Loan Repayment Portal</h3>
            <p className="text-xs text-slate-400 mb-6">
              Instant double-entry repayment credited directly against Loan #{selectedLoan?.loanNo}.
            </p>

            {paymentSuccessReceipt ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-lg font-bold text-emerald-300">Payment Successful!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Receipt #{paymentSuccessReceipt.paymentNo || 'RCPT_' + Date.now()}
                  </p>
                  <div className="text-2xl font-extrabold text-white mt-3">
                    ₹{paymentAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="text-white font-semibold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ledger State:</span>
                    <span className="text-emerald-400 font-semibold">Principal & Interest Adjusted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="text-white font-mono">{new Date().toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Repayment Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Select Payment Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'NET_BANKING', 'DEBIT_CARD'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          paymentMethod === method
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Payments are processed instantly through RBI-compliant secure banking gateways.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={payEmiMutation.isPending || paymentAmount <= 0}
                    onClick={handleExecutePayment}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {payEmiMutation.isPending ? 'Processing...' : `Pay ₹${paymentAmount.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loan NOC Certificate Modal */}
      {isNocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Official Certificate</span>
                <h3 className="text-xl font-bold text-white mt-1">No Objection Certificate (NOC)</h3>
              </div>
              <FileCheck className="w-8 h-8 text-purple-400" />
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <p>
                This certifies that Loan Account <strong className="text-white">#{selectedLoan?.loanNo}</strong> sanctioned for the principal amount of <strong className="text-white">₹{selectedLoan?.principal.toLocaleString('en-IN')}</strong> has been <strong className="text-emerald-400">FULLY SETTLED AND CLOSED</strong> with zero outstanding liabilities.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-slate-400">
                <div>
                  <span>NOC Reference:</span>
                  <div className="text-white font-mono font-semibold">NOC-{selectedLoan?.loanNo}-SETTLED</div>
                </div>
                <div>
                  <span>Date of Issue:</span>
                  <div className="text-white font-semibold">{new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsNocModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
