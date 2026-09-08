'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomerLoansPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me');
      const data = res.data.data;
      setCustomer(data);
      if (data?.loans?.length > 0) {
        setSelectedLoanId(data.loans[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch customer loans:', err);
      setError(err?.response?.data?.message || 'Failed to load loan accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading loan account details...</p>
        </div>
      </div>
    );
  }

  const loans = customer?.loans || [];
  const selectedLoan = loans.find((l: any) => l.id === selectedLoanId) || loans[0];
  const schedule = selectedLoan?.repaymentSchedule || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Loan Accounts & Amortization
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View active loan balances, detailed monthly installment breakdown, and loan agreements
          </p>
        </div>
        <Link
          href="/customer/payments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Zap className="h-4 w-4 text-amber-300" />
          <span>Pay EMI Now</span>
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-4">
          <CreditCard className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Loan Accounts Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You do not currently have any active or past loan accounts. Submit a new loan application to get started.
          </p>
          <Link
            href="/customer/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold"
          >
            Submit Loan Application →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Loan Cards Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Loan Account ({loans.length})
            </h3>
            {loans.map((loan: any) => {
              const isSelected = loan.id === selectedLoan?.id;
              const outstanding = parseFloat(loan.outstandingPrincipal || '0') + parseFloat(loan.outstandingInterest || '0');
              return (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-white dark:bg-[#1E2445] border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-white/60 dark:bg-[#111625] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                      {loan.loanCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loan.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : loan.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      ₹{parseFloat(loan.principal || '0').toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {loan.product?.name || 'Personal Loan'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>Outstanding:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Loan Summary & Amortization Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {selectedLoan && (
              <>
                {/* Selected Loan Overview Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        LOAN CODE: {selectedLoan.loanCode}
                      </span>
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {selectedLoan.product?.name || 'Personal Loan Scheme'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/customer/documents"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Agreement Document</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                      <div className="text-slate-400 font-medium">Sanctioned Principal</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        ₹{parseFloat(selectedLoan.principal || '0').toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                      <div className="text-slate-400 font-medium">Interest Rate</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedLoan.interestRate}% p.a.
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                      <div className="text-slate-400 font-medium">Tenure</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedLoan.tenureMonths} Months
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                      <div className="text-slate-400 font-medium">Disbursed Date</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedLoan.disbursementDate
                          ? new Date(selectedLoan.disbursementDate).toLocaleDateString('en-IN')
                          : 'Active'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amortization Schedule Table */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-600" />
                      Repayment Amortization Schedule
                    </h3>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {schedule.length} Installment(s)
                    </span>
                  </div>

                  {schedule.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      Schedule generation in progress.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="py-2.5">Inst. #</th>
                            <th className="py-2.5">Due Date</th>
                            <th className="py-2.5">Principal</th>
                            <th className="py-2.5">Interest</th>
                            <th className="py-2.5">Total EMI</th>
                            <th className="py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {schedule.map((item: any) => {
                            const isPaid = item.status === 'PAID';
                            const isOverdue = item.status === 'OVERDUE';
                            return (
                              <tr key={item.id || item.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-3 font-mono font-bold">#{item.installmentNumber}</td>
                                <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">
                                  {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 font-medium">₹{parseFloat(item.principalDue || '0').toLocaleString('en-IN')}</td>
                                <td className="py-3 font-medium">₹{parseFloat(item.interestDue || '0').toLocaleString('en-IN')}</td>
                                <td className="py-3 font-bold text-slate-900 dark:text-white">
                                  ₹{parseFloat(item.totalDue || item.emiAmount || '0').toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 text-right">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isPaid
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                        : isOverdue
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
