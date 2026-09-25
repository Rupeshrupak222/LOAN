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
  ShieldAlert,
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
  const { data: homeData, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['borrower-home'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/borrower/home');
      return res.data?.data || res.data;
    },
  });

  const { data: overdueSummary } = useQuery({
    queryKey: ['borrower-overdue-summary'],
    queryFn: async () => {
      const res = await api.get('/borrower/overdue');
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

  if (isError || !homeData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to Load Borrower Workspace</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(error as any)?.message || 'There was a problem communicating with the loan service. Please check your connection and retry.'}
        </p>
        <Button onClick={() => refetch()} size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* 1. Header & Welcome Greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        {/* Glow orb background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              100% Digital Lending OS
            </span>
            <span className="text-2xs text-slate-400 font-mono">
              Borrower ID: {borrower?.customerCode || '—'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome, {[borrower?.firstName, borrower?.lastName].filter(Boolean).join(' ') || 'Borrower'} 👋
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Paperless digital credit, instant real-time bank transfers, and transparent RBI-regulated terms.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-2xl border-slate-700 bg-slate-800/80 text-xs text-slate-200 hover:text-white hover:bg-slate-700/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/borrower/apply">
            <Button size="sm" className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold shadow-lg shadow-blue-500/25 text-white px-5 py-2.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* 1.1 Overdue / Delinquency Warning Banner (Phase M7) */}
      {overdueSummary?.hasOverdue && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-red-500/10 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Overdue Payment Notice</span>
                <Badge className="bg-white/20 text-white text-[10px] font-bold">
                  {overdueSummary.maxDpd} DPD
                </Badge>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                You have ₹{overdueSummary.totalOverdueAmount.toLocaleString('en-IN')} overdue. Pay now or schedule a Promise to Pay.
              </p>
            </div>
          </div>
          <Link href="/borrower/overdue">
            <Button size="sm" className="bg-white hover:bg-rose-50 text-red-700 font-bold rounded-xl text-xs shadow-sm">
              Resolve Overdue <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Top Summary Grid with Virtual Credit Line Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Luxury Virtual Credit Line Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-500/30 shadow-xl shadow-indigo-950/20 flex flex-col justify-between group">
          {/* Card decorative elements */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-5 rounded-md bg-amber-400/90 flex items-center justify-center shadow-xs">
                <div className="w-5 h-3 border border-amber-600/60 rounded-xs" />
              </div>
              <span className="text-2xs font-mono font-bold tracking-widest text-indigo-300">
                INSTANT CREDIT
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="my-5">
            <span className="text-2xs uppercase tracking-wider text-indigo-300 block">
              {creditLimit?.isEligible && (creditLimit?.availableLimit ?? 0) > 0 ? 'Approved Credit Line' : 'Instant Pre-Approval'}
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-1 font-mono">
              {creditLimit?.isEligible && (creditLimit?.availableLimit ?? 0) > 0
                ? `₹${(creditLimit.availableLimit).toLocaleString('en-IN')}`
                : 'Up to ₹5,00,000'}
            </div>
            <p className="text-2xs text-slate-300 mt-1">
              {creditLimit?.isEligible && (creditLimit?.preApprovedLimit ?? 0) > 0
                ? `Total sanctioned limit: ₹${(creditLimit.preApprovedLimit).toLocaleString('en-IN')}`
                : '100% Paperless • Real-time bank transfer'}
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> RBI Protected
            </span>
            <Link
              href="/borrower/apply"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20 transition-all"
            >
              {creditLimit?.isEligible && (creditLimit?.availableLimit ?? 0) > 0 ? 'Draw Funds' : 'Unlock Capital'}{' '}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Loan & Next EMI Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Active Loan Servicing
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            {activeLoan ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {activeLoan.status === 'CLOSED' ? '₹0.00' : `₹${(activeLoan.nextEmiAmount || 0).toLocaleString('en-IN')}`}
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    activeLoan.status === 'CLOSED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                  }`}>
                    {activeLoan.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {activeLoan.status === 'CLOSED' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Loan fully paid & closed. NOC available.
                    </span>
                  ) : (
                    <>
                      Next EMI due on{' '}
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {activeLoan.nextEmiDueDate
                          ? new Date(activeLoan.nextEmiDueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'As per schedule'}
                      </span>
                    </>
                  )}
                </p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Repayment Progress</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {activeLoan.paidEmis} / {activeLoan.totalEmis} EMIs Paid
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (activeLoan.paidEmis / (activeLoan.totalEmis || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">No active loans currently.</p>
                <Link href="/borrower/apply">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-transparent">
                    Instant Loan Application
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {activeLoan && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <Link
                href={`/borrower/loans/${activeLoan.id}`}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {activeLoan.status === 'CLOSED' ? 'View Final Statement' : 'View Schedule'}
              </Link>
              {activeLoan.status === 'CLOSED' ? (
                <Link href={`/borrower/loans/${activeLoan.id}`}>
                  <Button size="sm" className="h-8 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">
                    View NOC
                  </Button>
                </Link>
              ) : (
                <Link href={`/borrower/payments`}>
                  <Button size="sm" className="h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-sm shadow-emerald-500/20">
                    Pay Next EMI
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* KYC & Identity Status Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Profile & Verification
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">DigiLocker KYC:</span>
                {borrower?.kycStatus === 'VERIFIED' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                  </span>
                ) : borrower?.kycStatus === 'SUBMITTED' || borrower?.kycStatus === 'UNDER_REVIEW' ? (
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> IN REVIEW
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {borrower?.kycStatus ? borrower.kycStatus.replace(/_/g, ' ') : 'NOT STARTED'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Registered PAN:</span>
                <span className={`font-mono font-semibold ${borrower?.panNumberMasked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                  {borrower?.panNumberMasked || 'Not Linked'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Repayment Mandate:</span>
                {borrower?.mandateStatus === 'ACTIVE' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">eNACH / Auto-Debit Ready</span>
                ) : borrower?.mandateStatus === 'PENDING' ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Setup Pending</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Not Configured</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
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
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 border border-blue-200 dark:border-blue-500/30 shadow-sm">
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

          {/* Journey Component - Clean Stepper */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium max-w-2xl">
             <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Application Started
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 40 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : activeApp.progressPercent >= 20 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 40 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-blue-500 mx-1 flex-shrink-0" />}
                KYC & Bank
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : activeApp.progressPercent >= 40 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 75 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : activeApp.progressPercent >= 40 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1 flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0" />}
                Sanction Decision
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent >= 95 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : activeApp.progressPercent >= 75 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent >= 95 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : activeApp.progressPercent >= 75 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1 flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0" />}
                Agreement & eSign
             </div>
             <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className={`flex items-center gap-1.5 ${activeApp.progressPercent === 100 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : activeApp.progressPercent >= 95 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {activeApp.progressPercent === 100 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : activeApp.progressPercent >= 95 ? <span className="w-2 h-2 rounded-full bg-blue-500 mx-1 flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0" />}
                Bank Payout
             </div>
          </div>
        </div>
      )}

      {/* 4. Quick Consumer Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Quick Services & Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/borrower/apply"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Apply for Loan</div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Instant credit up to ₹5L</div>
          </Link>

          <Link
            href="/borrower/loans"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Loan Passbook & SOA</div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Schedule, balance & NOC</div>
          </Link>

          <Link
            href="/borrower/payments"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Repay EMI Online</div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">UPI, Debit Card & Netbanking</div>
          </Link>

          <Link
            href="/borrower/support"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Support & Redressal</div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">RBI Nodal officer assistance</div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Transactions & Activity */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Payment Transactions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified automated receipts from digital payment rails
            </p>
          </div>
          <Link href="/borrower/payments" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
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
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{tx.amount.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{tx.status}</span>
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
