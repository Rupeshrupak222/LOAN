'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  Zap,
  Building2,
  Receipt
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomerDashboardPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me');
      setCustomer(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch customer profile:', err);
      setError(err?.response?.data?.message || 'Unable to load borrower dashboard profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading your loan dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer Profile Pending</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error || 'No active borrower record linked to your user account. Please contact your loan officer or branch.'}
        </p>
        <div className="pt-2">
          <Link
            href="/customer/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-md"
          >
            <span>Apply for First Loan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const loans = customer.loans || [];
  const activeLoans = loans.filter((l: any) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const primaryLoan = activeLoans[0] || loans[0];

  // Calculate totals
  const totalOutstanding = loans.reduce(
    (acc: number, l: any) => acc + (parseFloat(l.outstandingPrincipal || '0') + parseFloat(l.outstandingInterest || '0')),
    0
  );
  const totalBorrowed = loans.reduce((acc: number, l: any) => acc + parseFloat(l.principal || '0'), 0);
  const payments = customer.payments || [];
  const totalRepaid = payments.reduce(
    (acc: number, p: any) => (p.status === 'SUCCESS' ? acc + parseFloat(p.amount || '0') : acc),
    0
  );

  // Payoff percentage
  const payoffPercent = totalBorrowed > 0 ? Math.min(100, Math.round((totalRepaid / totalBorrowed) * 100)) : 0;

  // Next EMI details
  const nextScheduleItem = primaryLoan?.repaymentSchedule?.find(
    (s: any) => s.status === 'DUE' || s.status === 'UPCOMING' || s.status === 'OVERDUE'
  );

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-blue-600 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-15 pointer-events-none">
          <ShieldCheck className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Welcome Back, {customer.firstName}!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Adyapan FinTech Borrower Portal
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Manage your active loans, track EMI schedules, download agreements, and make instant secure repayments anytime.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono font-medium border border-white/15">
              Customer Code: <span className="font-bold text-amber-300">{customer.customerCode}</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>KYC: {customer.kycStatus || 'VERIFIED'}</span>
            </div>
            {customer.riskCategory && (
              <div className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium border border-white/15">
                Risk Tier: <span className="font-bold">{customer.riskCategory}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Active Loan Principal */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Borrowed
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totalBorrowed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Across {loans.length} loan account(s)
            </p>
          </div>
        </div>

        {/* Current Outstanding */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Principal & accrued interest
            </p>
          </div>
        </div>

        {/* Next EMI Due */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-500/10 to-blue-500/5 dark:from-brand-950/40 dark:to-blue-950/20 border border-brand-500/30 dark:border-brand-500/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Next EMI Due
            </span>
            <div className="p-2 rounded-xl bg-brand-500 text-white">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
              {nextScheduleItem
                ? `₹${parseFloat(nextScheduleItem.totalDue || nextScheduleItem.emiAmount || '0').toLocaleString('en-IN')}`
                : 'No EMI Due'}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {nextScheduleItem?.dueDate
                ? `Due on ${new Date(nextScheduleItem.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'All payments current ✓'}
            </p>
          </div>
        </div>

        {/* Total Repaid */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Repaid
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalRepaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {payoffPercent}% loan payoff completed
            </p>
          </div>
        </div>
      </div>

      {/* Payoff Progress Bar */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Overall Loan Payoff Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track your repayment trajectory towards 100% debt closure
            </p>
          </div>
          <span className="text-lg font-black text-brand-600 dark:text-brand-400">
            {payoffPercent}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${payoffPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/customer/payments"
          className="group rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
              <Zap className="h-5 w-5 text-amber-300" />
            </div>
            <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h4 className="font-extrabold text-base">Make Instant EMI Payment</h4>
            <p className="text-xs text-blue-100 mt-1">
              Pay via UPI, NetBanking, or Debit Card with instant receipt generation
            </p>
          </div>
        </Link>

        <Link
          href="/customer/loans"
          className="group rounded-2xl p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-500/50 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">View Repayment Schedule</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check monthly principal & interest breakup for all installments
            </p>
          </div>
        </Link>

        <Link
          href="/customer/documents"
          className="group rounded-2xl p-5 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-brand-500/50 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Download Loan Documents</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Access sanction letters, loan agreements, and NOC certificates
            </p>
          </div>
        </Link>
      </div>

      {/* Active Loan Account Details */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Loan Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loan Code: <span className="font-mono font-bold text-brand-600">{primaryLoan?.loanCode || 'N/A'}</span>
              </p>
            </div>
          </div>
          <Link
            href="/customer/loans"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All Loans</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {primaryLoan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Loan Scheme / Product</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {primaryLoan.product?.name || 'Personal Loan Scheme'}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Sanctioned Amount</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                ₹{parseFloat(primaryLoan.principal || '0').toLocaleString('en-IN')}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-slate-500">Interest Rate & Tenure</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {primaryLoan.interestRate}% p.a. • {primaryLoan.tenureMonths} Months
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs text-slate-500">No active loan accounts registered currently.</p>
            <Link
              href="/customer/applications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              <span>Submit Loan Application</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Payments History */}
      <div className="rounded-3xl p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            Recent Payment Ledger
          </h3>
          <Link
            href="/customer/payments"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Full Statement →
          </Link>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No repayment transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Ref No.</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.slice(0, 5).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-medium">
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {p.paymentMethod || 'UPI / Transfer'}
                    </td>
                    <td className="py-3 font-mono text-slate-500">{p.referenceNumber || p.id.slice(0, 8)}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        SUCCESS ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
