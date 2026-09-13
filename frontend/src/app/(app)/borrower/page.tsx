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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Consumer Digital Lending
            </span>
            <span className="text-xs text-slate-400">
              ID: {borrower?.customerCode || 'CUST-LIVE'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {borrower?.firstName || 'Borrower'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Instant paperless credit with 100% transparent pricing and RBI fair practice protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/borrower/apply">
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold shadow-lg shadow-blue-500/20 text-white">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pre-Approved Limit Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-blue-900/30 via-slate-900/90 to-slate-900 border border-blue-500/30 shadow-xl shadow-blue-950/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Pre-Approved Limit
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            ₹{creditLimit?.availableLimit ? creditLimit.availableLimit.toLocaleString('en-IN') : '1,50,000'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total pre-approved credit line: ₹{creditLimit?.preApprovedLimit ? creditLimit.preApprovedLimit.toLocaleString('en-IN') : '1,50,000'}
          </p>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Pre-Qualified
            </span>
            <Link
              href="/borrower/apply"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
            >
              Draw Funds <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Active Loan & Next EMI Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Loan Servicing
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          {activeLoan ? (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">
                  ₹{activeLoan.nextEmiAmount.toLocaleString('en-IN')}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  {activeLoan.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Next EMI due on{' '}
                <span className="text-slate-200 font-medium">
                  {activeLoan.nextEmiDueDate || '15th of next month'}
                </span>
              </p>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Repayment Progress</span>
                  <span>
                    {activeLoan.paidEmis} of {activeLoan.totalEmis} EMIs Paid
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    style={{
                      width: `${Math.min(100, (activeLoan.paidEmis / (activeLoan.totalEmis || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/borrower/loans/${activeLoan.id}`}
                  className="text-xs text-slate-400 hover:text-white"
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
              <p className="text-xs text-slate-400 mb-3">No active running loans currently.</p>
              <Link href="/borrower/apply">
                <Button size="sm" variant="outline" className="text-xs rounded-xl border-slate-700 text-slate-300">
                  Instant Loan Application
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* KYC & Identity Status Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Profile & KYC Status
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">DigiLocker e-KYC:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Registered PAN:</span>
              <span className="text-slate-200 font-mono">{borrower?.panNumberMasked || 'ABCDE****F'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Repayment Mandate:</span>
              <span className="text-blue-400 font-medium">eNACH / Auto-Debit Ready</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Bank Details Linked</span>
            <Link
              href="/borrower/profile"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Manage Profile <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Live Application Tracker Banner (if an application is in progress) */}
      {activeApp && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/30 border border-blue-500/30 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs border-blue-500/30 bg-blue-500/10 text-blue-400">
                  Application #{activeApp.applicationNumber}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">
                  {activeApp.productName} • ₹{activeApp.requestedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Stage: {activeApp.currentStage}
              </h3>
              <p className="text-xs text-slate-400">
                Next action: <span className="text-blue-300 font-medium">{activeApp.nextRequiredAction}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="hidden md:block text-right">
                <div className="text-xs text-slate-400">Progress</div>
                <div className="text-sm font-bold text-white">{activeApp.progressPercent}%</div>
              </div>
              <Link href={activeApp.actionUrl} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
                  Continue Application <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Consumer Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
          Quick Consumer Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/borrower/apply"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-white">New Loan</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Instant paperless application</div>
          </Link>

          <Link
            href="/borrower/loans"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-white">Statement & SOA</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Download repayment ledger</div>
          </Link>

          <Link
            href="/borrower/payments"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-white">Repay Online</div>
            <div className="text-[11px] text-slate-400 mt-0.5">UPI, Cards & NetBanking</div>
          </Link>

          <Link
            href="/borrower/support"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-white">Help & Grievance</div>
            <div className="text-[11px] text-slate-400 mt-0.5">RBI Nodal officer support</div>
          </Link>
        </div>
      </div>

      {/* 5. Recent Transactions & Activity */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Payment Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified automated receipts from digital payment rails
            </p>
          </div>
          <Link href="/borrower/payments" className="text-xs text-blue-400 hover:underline">
            View All Ledger
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">EMI Repayment via {tx.paymentMethod}</div>
                    <div className="text-slate-400 text-[11px]">Ref: {tx.reference} • {tx.paymentDate}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">₹{tx.amount.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400 uppercase">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            No recent payment transactions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
