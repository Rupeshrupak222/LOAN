'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Download,
  Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';

export default function BorrowerHomePage() {
  const { data: homeData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['borrower-home'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/api/v1/borrower/home');
      return res.data?.data || res.data;
    },
  });

  const borrower = homeData?.borrower;
  const creditLimit = homeData?.creditLimit;
  const activeLoan = homeData?.activeLoan;
  const activeApp = homeData?.activeApplication;
  const transactions = homeData?.recentTransactions || [];

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading your borrower workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* 1. Header & Welcome Greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 p-6 rounded-3xl border border-blue-100 dark:border-slate-800/80 backdrop-blur-xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              Consumer Digital Lending
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ID: {borrower?.customerCode || '—'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {[borrower?.firstName, borrower?.lastName].filter(Boolean).join(' ') || 'Borrower'} 👋
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Instant paperless credit with 100% transparent pricing and RBI fair practice protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/borrower/apply">
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold shadow-md shadow-blue-500/20 text-white">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pre-Approved Limit Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50/40 dark:from-blue-900/30 dark:via-slate-900/90 dark:to-slate-900 border border-blue-200 dark:border-blue-500/30 shadow-sm shadow-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Pre-Approved Limit
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{(creditLimit?.availableLimit ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {creditLimit?.isEligible && (creditLimit?.preApprovedLimit ?? 0) > 0
              ? `Total pre-approved credit line: ₹${(creditLimit?.preApprovedLimit ?? 0).toLocaleString('en-IN')}`
              : 'Complete profile & KYC to unlock pre-approved limits'}
          </p>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            {creditLimit?.isEligible && (creditLimit?.availableLimit ?? 0) > 0 ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Pre-Qualified
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Complete Verification
              </span>
            )}
            <Link
              href="/borrower/apply"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group"
            >
              {creditLimit?.isEligible && (creditLimit?.availableLimit ?? 0) > 0 ? 'Draw Funds' : 'Check Offers'}{' '}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Active Loan & Next EMI Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Loan Servicing
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          {activeLoan ? (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹{(activeLoan.nextEmiAmount || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  {activeLoan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Next EMI due on{' '}
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {activeLoan.nextEmiDueDate
                    ? new Date(activeLoan.nextEmiDueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'As per schedule'}
                </span>
              </p>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Repayment Progress</span>
                  <span>
                    {activeLoan.paidEmis} of {activeLoan.totalEmis} EMIs Paid
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    style={{
                      width: `${Math.min(100, (activeLoan.paidEmis / (activeLoan.totalEmis || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/borrower/loans/${activeLoan.id}`}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  View Schedule
                </Link>
                <Link href={`/borrower/payments`}>
                  <Button size="sm" className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                    Pay EMI
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">No active running loans currently.</p>
              <Link href="/borrower/apply">
                <Button size="sm" variant="outline" className="text-xs rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-transparent">
                  Instant Loan Application
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* KYC & Identity Status Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Profile & KYC Status
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">DigiLocker e-KYC:</span>
              {borrower?.kycStatus === 'VERIFIED' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                </span>
              ) : borrower?.kycStatus === 'SUBMITTED' || borrower?.kycStatus === 'UNDER_REVIEW' ? (
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> IN REVIEW
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {borrower?.kycStatus ? borrower.kycStatus.replace(/_/g, ' ') : 'NOT STARTED'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Registered PAN:</span>
              <span className={`font-mono ${borrower?.panNumberMasked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                {borrower?.panNumberMasked || 'Not Linked'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Repayment Mandate:</span>
              {borrower?.mandateStatus === 'ACTIVE' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">eNACH / Auto-Debit Ready</span>
              ) : borrower?.mandateStatus === 'PENDING' ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Mandate Setup Pending</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-medium">Not Configured</span>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[170px]" title={borrower?.bankName || 'No Bank Linked'}>
              {borrower?.bankName ? `${borrower.bankName}` : 'No Bank Linked'}
            </span>
            <Link
              href="/borrower/profile"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Manage Profile <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Live Application Tracker Banner (if an application is in progress) */}
      {activeApp && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 border border-blue-200 dark:border-blue-500/30 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
                  Application #{activeApp.applicationNumber}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {activeApp.productName} • ₹{activeApp.requestedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Stage: {activeApp.currentStage}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Next action: <span className="text-blue-600 dark:text-blue-300 font-medium">{activeApp.nextRequiredAction}</span>
              </p>
            </div>

            <div className="flex flex-col sm:items-end w-full sm:w-auto mt-4 sm:mt-0 gap-3">
              <Link href={activeApp.actionUrl} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white px-6 py-5 shadow-md shadow-blue-500/20">
                  {activeApp.nextRequiredAction} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Journey Component */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium max-w-2xl">
             <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Application Started
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 40 ? 'text-emerald-600 dark:text-emerald-400' : activeApp.progressPercent >= 20 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 40 ? <CheckCircle2 className="w-4 h-4" /> : activeApp.progressPercent >= 20 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1" /> : <span className="w-2 h-2 rounded-full border border-slate-300 dark:border-slate-600 mx-1" />}
                Documents & KYC
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' : activeApp.progressPercent >= 40 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 75 ? <CheckCircle2 className="w-4 h-4" /> : activeApp.progressPercent >= 40 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1" /> : <span className="w-2 h-2 rounded-full border border-slate-300 dark:border-slate-600 mx-1" />}
                Underwriting
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 95 ? 'text-emerald-600 dark:text-emerald-400' : activeApp.progressPercent >= 75 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 95 ? <CheckCircle2 className="w-4 h-4" /> : activeApp.progressPercent >= 75 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1" /> : <span>🔒</span>}
                Offer & Agreement
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : activeApp.progressPercent >= 95 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent === 100 ? <CheckCircle2 className="w-4 h-4" /> : activeApp.progressPercent >= 95 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1" /> : <span>🔒</span>}
                Disbursement
             </div>
          </div>
        </div>
      )}

      {/* 4. Quick Consumer Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Quick Consumer Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/borrower/apply"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">New Loan</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Instant paperless application</div>
          </Link>

          <Link
            href="/borrower/loans"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Statement & SOA</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Download repayment ledger</div>
          </Link>

          <Link
            href="/borrower/payments"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Repay Online</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">UPI, Cards & NetBanking</div>
          </Link>

          <Link
            href="/borrower/support"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Help & Grievance</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">RBI Nodal officer support</div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Transactions & Activity */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Payment Transactions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified automated receipts from digital payment rails
            </p>
          </div>
          <Link href="/borrower/payments" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            View All Ledger
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">EMI Repayment via {tx.paymentMethod}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">Ref: {tx.reference} • {tx.paymentDate}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">₹{tx.amount.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
            No recent payment transactions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
