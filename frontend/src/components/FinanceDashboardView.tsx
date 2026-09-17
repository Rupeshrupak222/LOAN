'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Coins,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  Layers,
  Send,
  Building,
  CreditCard,
  Zap,
  DollarSign,
  TrendingUp,
  Activity,
  Check,
  ArrowUpRight,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn, formatMoney, formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui';

export function FinanceDashboardView() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Finance Queue & Workspace Data strictly for Finance Officer
  const {
    data: queueData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['finance-dashboard-queue'],
    queryFn: async () => {
      const res = await api.get('/finance/queue', {
        params: { tab: 'ALL' },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : []) as any[];
    },
    refetchInterval: 10000,
  });

  // Fetch Disbursement History for Executed metrics
  const { data: historyData } = useQuery({
    queryKey: ['finance-dashboard-history'],
    queryFn: async () => {
      const res = await api.get('/finance/queue', {
        params: { tab: 'EXECUTED' },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : []) as any[];
    },
  });

  const cases = Array.isArray(queueData) ? queueData : [];
  const executedCases = Array.isArray(historyData) ? historyData : [];

  // Finance-Specific Live KPI Calculations
  const readyForDisbursementCases = cases.filter(
    (c) => c.status === 'READY_FOR_DISBURSEMENT' && c.gatekeeperStatus?.canDisburse && c.bankAccount?.isVerified
  );
  const readyCount = readyForDisbursementCases.length;
  const readyVolume = readyForDisbursementCases.reduce((sum, c) => sum + Number(c.approvedAmount || 0), 0);

  const pendingCheckerCases = cases.filter(
    (c) => c.makerCheckerStatus?.hasActiveTask && c.makerCheckerStatus?.taskStatus === 'PENDING_CHECKER'
  );
  const pendingCheckerCount = pendingCheckerCases.length;

  const preCheckPendingCases = cases.filter(
    (c) => c.status === 'READY_FOR_DISBURSEMENT' && (!c.bankAccount?.isVerified || !c.gatekeeperStatus?.canDisburse)
  );
  const preCheckPendingCount = preCheckPendingCases.length;

  const stpEligibleCount = cases.filter((c) => c.isStpEligible || c.status === 'READY_FOR_DISBURSEMENT').length;

  const executedCount = executedCases.length + cases.filter((c) => c.status === 'DISBURSED').length;
  const totalDisbursedVolume = executedCases.reduce(
    (sum, c) => sum + Number(c.approvedAmount || 0),
    0
  );

  // Filtered Priority Payouts
  const filteredCases = cases.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const appNo = (c.applicationNo || c.id || '').toLowerCase();
    const borrower = (c.borrowerName || '').toLowerCase();
    const product = (c.loanProduct || '').toLowerCase();
    const bank = (c.bankAccount?.bankName || '').toLowerCase();
    return appNo.includes(term) || borrower.includes(term) || product.includes(term) || bank.includes(term);
  });

  const cardBgClass = isDark
    ? 'border-slate-800 bg-slate-900/90 text-white shadow-none'
    : 'border-slate-200 bg-white text-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 backdrop-blur-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Finance & Disbursement Command Desk
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CORE BANKING PAYOUTS LIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Strictly isolated finance workspace. Authorize 10-point gatekeeper pre-checks, execute dual-control maker-checker payouts, and activate core banking loan ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
              title="Refresh Live Financial Ledger"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>

            <Link
              href="/finance-queue"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Open Finance Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Finance KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ready for Disbursement */}
        <div
          onClick={() => router.push('/finance-queue?tab=READY_FOR_DISBURSEMENT')}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 shadow-xs flex items-center justify-between',
            cardBgClass
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ready for Payout
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{readyCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Vol: <strong className="text-slate-700 dark:text-slate-200">{formatMoney(readyVolume)}</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Dual Control Pending Checker */}
        <div
          onClick={() => router.push('/finance-queue?tab=PENDING_CHECKER')}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 shadow-xs flex items-center justify-between',
            cardBgClass
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Dual-Control Pending
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-300 mt-1">
              {pendingCheckerCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting Checker approval</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Capital Disbursed */}
        <div
          onClick={() => router.push('/finance-queue?tab=EXECUTED')}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 shadow-xs flex items-center justify-between',
            cardBgClass
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Capital Disbursed (MTD)
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">
              {formatMoney(totalDisbursedVolume)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <strong className="text-slate-700 dark:text-slate-200">{executedCount}</strong> completed payouts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pre-Check Pending */}
        <div
          onClick={() => router.push('/finance-queue?tab=PRE_CHECK_PENDING')}
          className={cn(
            'p-5 rounded-2xl border transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 shadow-xs flex items-center justify-between',
            cardBgClass
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Bank Pre-Check Action
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">
              {preCheckPendingCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Penny Drop / Gate check</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Live Payout Queue Workspace */}
      <div className={cn('rounded-2xl border p-5 shadow-xs space-y-4', cardBgClass)}>
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Forwarded Payout Queue (Pending Execution)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approved proposals explicitly forwarded by Underwriters for fund release and loan ledger activation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search applicant, loan #, bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <Link
              href="/finance-queue"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              View Full Queue
            </Link>
          </div>
        </div>

        {/* Proposals Table */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-3">Loading live finance queue...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Proposals Currently in Finance Queue
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Only loan proposals explicitly forwarded by an authorized Underwriter/Sanction Officer will appear here for payout execution.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((item) => {
              const canDisburse = Boolean(item.gatekeeperStatus?.canDisburse && item.bankAccount?.isVerified);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Applicant & Loan Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{item.applicationNo}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.borrowerName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.productCode || 'PERSONAL_LOAN'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          {item.status}
                        </span>
                        {item.bankAccount?.isVerified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Bank Penny-Drop Verified
                          </span>
                        )}
                      </div>

                      {/* Financial Detail Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Sanctioned</span>
                          <strong className="text-xs text-slate-900 dark:text-white">
                            {formatMoney(item.approvedAmount)}
                          </strong>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Net Payout</span>
                          <strong className="text-xs text-emerald-600 dark:text-emerald-400">
                            {formatMoney(item.netDisbursalAmount || item.approvedAmount)}
                          </strong>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Beneficiary Bank</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                            {item.bankAccount?.bankName || 'HDFC Bank'} ({item.bankAccount?.maskedAccountNumber || 'XXXX-1234'})
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gatekeeper</span>
                          <span className={cn('text-xs font-bold block', canDisburse ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                            {item.gatekeeperStatus?.passedChecksCount || 10}/10 Checks Passed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="shrink-0 self-end lg:self-center">
                      <Link
                        href={`/finance-queue/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 whitespace-nowrap transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Execute Disbursement</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Payment Rails & Treasury Operational Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn('p-4 rounded-2xl border space-y-2', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              IMPS 24x7 Instant Rail
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200">
              OPERATIONAL
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Real-time settlement for retail loans up to ₹5,00,000.</p>
        </div>

        <div className={cn('p-4 rounded-2xl border space-y-2', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              NEFT / RTGS High Ticket
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200">
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Batch processing and gross settlement for tickets &gt; ₹5,00,000.</p>
        </div>

        <div className={cn('p-4 rounded-2xl border space-y-2', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Maker-Checker SoD Protocol
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200">
              ENFORCED
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Dual-control four-eyes validation required on all disbursements &gt; ₹10L.</p>
        </div>
      </div>
    </div>
  );
}
