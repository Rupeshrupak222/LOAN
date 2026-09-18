'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Coins,
  RefreshCw,
  Search,
  PhoneCall,
  Calendar,
  CreditCard,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Building,
  Sliders,
  DollarSign,
  AlertCircle,
  XCircle,
  Check,
  PlusCircle,
  Layers,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn, formatMoney, formatDate } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { collectionsApi } from '@/features/collections/api';
import { ContactActivityModal } from '@/features/collections/ContactActivityModal';
import { PtpModal } from '@/features/collections/PtpModal';
import type { CollectionCaseSummary } from '@/features/collections/types';

export function CollectionOfficerDashboardView() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'DELINQUENCY_QUEUE' | 'PTP_TRACKER' | 'PAYMENT_INTIMATIONS'>('DELINQUENCY_QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals state
  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);

  // Direct Repayment Modal state
  const [directPayModalOpen, setDirectPayModalOpen] = useState(false);
  const [directLoanId, setDirectLoanId] = useState('');
  const [directAmount, setDirectAmount] = useState('');
  const [directMethod, setDirectMethod] = useState('UPI');
  const [directRef, setDirectRef] = useState('');
  const [directNotes, setDirectNotes] = useState('');

  // 1. Fetch Collection Dashboard KPIs & Summary
  const {
    data: collectionsData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['collection-dashboard-kpis'],
    queryFn: () => collectionsApi.getDashboard(),
    refetchInterval: 15000,
  });

  // 2. Fetch Delinquent Cases in Queue
  const {
    data: casesResponse,
    isLoading: isCasesLoading,
    refetch: refetchCases,
  } = useQuery({
    queryKey: ['collection-dashboard-cases', bucketFilter, searchQuery],
    queryFn: () =>
      collectionsApi.listCases({
        bucket: bucketFilter || undefined,
        search: searchQuery || undefined,
        pageSize: 50,
      }),
    refetchInterval: 15000,
  });

  // 3. Fetch Borrower Payment Submissions / Intimations
  const { data: submissionsData } = useQuery({
    queryKey: ['collection-dashboard-submissions'],
    queryFn: async () => {
      const res = await api.get('/payments/submissions');
      return (res.data?.data || []) as any[];
    },
    refetchInterval: 15000,
  });

  // 4. Fetch Active & Overdue Loans for Direct Pay Modal
  const { data: loansData } = useQuery({
    queryKey: ['collection-loans-list'],
    queryFn: async () => {
      const res = await api.get('/loans', { params: { pageSize: 100 } });
      const raw = res.data?.data;
      return (Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []) as any[];
    },
  });

  // Auto Assign Delinquencies Mutation
  const autoAssignMutation = useMutation({
    mutationFn: async () => collectionsApi.autoAssign(),
    onSuccess: (res: any) => {
      toast.success(`Auto-assigned ${res?.assignedCount || 0} delinquent cases to active officers.`);
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-kpis'] });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });

  // Direct Repayment Mutation
  const directPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!directLoanId || !directAmount) return;
      return api.post(`/loans/${directLoanId}/payments`, {
        amount: parseFloat(directAmount),
        channel: directMethod,
        reference: directRef || `COLLECT-${Date.now()}`,
        notes: directNotes || 'Direct collection payment posted by Collection Officer',
      });
    },
    onSuccess: () => {
      toast.success('Repayment successfully posted and auto-allocated to loan schedule!');
      setDirectPayModalOpen(false);
      setDirectLoanId('');
      setDirectAmount('');
      setDirectRef('');
      setDirectNotes('');
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['collection-loans-list'] });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0C152B] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-2xs';

  const casesList = Array.isArray(casesResponse?.data) ? casesResponse.data : [];
  const submissionsList = Array.isArray(submissionsData) ? submissionsData : [];
  const loansList = Array.isArray(loansData) ? loansData : [];

  // Filter cases based on priority if selected
  const filteredCases = casesList.filter((c: any) => {
    if (priorityFilter && c.priority !== priorityFilter) return false;
    return true;
  });

  // KPI aggregates (100% Dynamic DB calculations)
  const totalOverdue = collectionsData?.summary?.totalOverdueAmount ?? casesList.reduce((sum: number, c: any) => sum + Number(c.overdueAmount || 0), 0);
  const activeCasesCount = collectionsData?.summary?.activeCases ?? casesList.length;
  const pendingPtpsCount = collectionsData?.summary?.pendingPtps ?? casesList.filter((c: any) => c.status === 'PROMISE_TO_PAY' || !!c.ptpDate).length;
  const pendingIntimationsCount = submissionsList.filter((s: any) => s.status === 'PENDING_VERIFICATION').length;
  const totalCollected = collectionsData?.summary?.collectionsRecovered ?? 0;

  // Dynamic portfolio health rate
  const totalLoansCount = loansList.length;
  const overdueLoansCount = loansList.filter((l: any) => l.status === 'OVERDUE' || Number(l.overdueAmount || 0) > 0).length;
  const dynamicRecoveryRate = totalLoansCount > 0
    ? Math.max(0, Math.round(((totalLoansCount - overdueLoansCount) / totalLoansCount) * 1000) / 10)
    : (activeCasesCount === 0 ? 100 : 0);

  // Dynamic Aging Bucket Calculations
  const agingBuckets = collectionsData?.agingBuckets || [];
  const totalAgingSum = agingBuckets.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0) || totalOverdue || 1;

  const getBucketAmount = (key: string) => {
    return Number(agingBuckets.find((b: any) => b.bucket === key)?.totalAmount || 0);
  };

  const getBucketCount = (key: string) => {
    return Number(agingBuckets.find((b: any) => b.bucket === key)?.count || 0);
  };

  const getBucketPercent = (key: string) => {
    const amt = getBucketAmount(key);
    if (totalAgingSum <= 0 || amt <= 0) return 0;
    return Math.min(100, Math.max(0, (amt / totalAgingSum) * 100));
  };

  const openDirectPayForCase = (c: any) => {
    setDirectLoanId(c.loanId || '');
    if (c.overdueAmount) {
      setDirectAmount(String(c.overdueAmount));
    }
    setDirectPayModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner strictly for Collection Officer */}
      <div className={cn(
        "rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors",
        isDark ? "bg-[#0C152B] border-[#1E2445]" : "bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-blue-500/5 border-amber-200/80"
      )}>
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Collection & Delinquency Recovery Desk
              </h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live Delinquency Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prioritized recovery queue, 5 DPD aging buckets (SMA-0 to NPA), Promise-to-Pay (PTP) tracker, and borrower payment posting.
            </p>
          </div>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => autoAssignMutation.mutate()}
            disabled={autoAssignMutation.isPending}
            className="text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", autoAssignMutation.isPending && "animate-spin")} />
            {autoAssignMutation.isPending ? 'Assigning...' : 'Auto-Assign Queue'}
          </Button>

          <Button
            size="sm"
            onClick={() => setDirectPayModalOpen(true)}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Post Repayment
          </Button>

          <Link href="/collections">
            <Button
              size="sm"
              className="text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5 shadow-sm shadow-blue-600/20"
            >
              Collections Workspace →
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top 6 Pure Collection KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Total Overdue Outstanding */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL OVERDUE
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatMoney(totalOverdue)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>{activeCasesCount} Overdue Accounts</span>
              <span className="text-rose-500 font-bold">Action Needed</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Delinquencies */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACTIVE DELINQUENCIES
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeCasesCount}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Recovery cases in queue</span>
              <span className="text-amber-500 font-bold">Assigned</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Promises to Pay */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PROMISES-TO-PAY (PTP)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {pendingPtpsCount}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Committed payment dates</span>
              <span className="text-purple-400 font-bold">Tracking</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Payment Intimations */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PAYMENT PROOFS
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {pendingIntimationsCount}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Borrower UTR proofs</span>
              {pendingIntimationsCount > 0 ? (
                <span className="text-blue-500 font-bold">Verify UTR</span>
              ) : (
                <span className="text-emerald-500">Up to date</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 5: Recovered Amount */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              COLLECTED RECOVERED
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalCollected)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>This Month Realized</span>
              <span className="text-emerald-500 font-bold">✓ Settled</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Portfolio Recovery Rate */}
        <div className={cn('rounded-2xl border p-4 flex flex-col justify-between', cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              RECOVERY RATE
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {Number(dynamicRecoveryRate).toFixed(1)}%
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Healthy vs Delinquent</span>
              <span className="text-emerald-500 font-bold">Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Segmented Queues & Action Desks */}
        <div className="lg:col-span-8 space-y-6">
          <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
            {/* Tab Navigation Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445]/70 border border-slate-200/60 dark:border-[#1E2445]">
                <button
                  type="button"
                  onClick={() => setActiveTab('DELINQUENCY_QUEUE')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    activeTab === 'DELINQUENCY_QUEUE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Delinquent Queue ({filteredCases.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PTP_TRACKER')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    activeTab === 'PTP_TRACKER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  PTP Tracker ({pendingPtpsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PAYMENT_INTIMATIONS')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    activeTab === 'PAYMENT_INTIMATIONS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Payment Proofs ({pendingIntimationsCount})
                </button>
              </div>

              <Link
                href="/collections"
                className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
              >
                Full Recovery Workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* TAB 1: DELINQUENT BORROWERS QUEUE */}
            {activeTab === 'DELINQUENCY_QUEUE' && (
              <div className="space-y-3.5">
                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search borrower, loan #, mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        'w-full h-8.5 rounded-xl border pl-8.5 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500',
                        isDark ? 'border-[#1E2445] bg-[#1E2445]/50 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                      )}
                    />
                  </div>

                  <select
                    value={bucketFilter}
                    onChange={(e) => setBucketFilter(e.target.value)}
                    className={cn(
                      'h-8.5 rounded-xl border px-3 text-xs focus:outline-none focus:border-blue-500',
                      isDark ? 'border-[#1E2445] bg-[#1E2445]/50 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    )}
                  >
                    <option value="">All Aging Buckets</option>
                    <option value="0-30">1-30 DPD (SMA-0)</option>
                    <option value="31-60">31-60 DPD (SMA-1)</option>
                    <option value="61-90">61-90 DPD (SMA-2)</option>
                    <option value="91-180">91-180 DPD (NPA-Substandard)</option>
                    <option value="180+">180+ DPD (Doubtful/Loss)</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className={cn(
                      'h-8.5 rounded-xl border px-3 text-xs focus:outline-none focus:border-blue-500',
                      isDark ? 'border-[#1E2445] bg-[#1E2445]/50 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                    )}
                  >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                {/* Delinquency Cases List */}
                <div className="divide-y divide-slate-100 dark:divide-[#1E2445] text-xs">
                  {isCasesLoading ? (
                    <div className="py-8 text-center text-slate-400">Loading delinquent queue...</div>
                  ) : filteredCases.length > 0 ? (
                    filteredCases.map((c: any) => (
                      <div
                        key={c.id}
                        className="py-3 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-[#1E2445]/40 rounded-xl"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {c.customerName || 'Borrower'}
                            </span>
                            <span className="font-mono text-[10px] text-blue-500 font-semibold">
                              Loan #{c.loanNo}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              c.dpd > 90
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : c.dpd > 60
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                : c.dpd > 30
                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            )}>
                              {c.dpd} DPD · {c.agingBucket || 'SMA'}
                            </span>
                            {c.priority && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase",
                                c.priority === 'CRITICAL' || c.priority === 'HIGH'
                                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              )}>
                                {c.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>📞 {c.mobile || '-'}</span>
                            <span>·</span>
                            <span>📍 {c.city || 'N/A'}</span>
                            {c.lastContactedAt && (
                              <>
                                <span>·</span>
                                <span>Last Call: {formatDate(c.lastContactedAt)}</span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <div className="text-right mr-2">
                            <p className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                              {formatMoney(c.overdueAmount || 0)}
                            </p>
                            <p className="text-[10px] text-slate-400">Overdue Installment</p>
                          </div>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedCase(c);
                              setActivityModalOpen(true);
                            }}
                            title="Log Follow-up Call"
                            className="h-8 text-xs font-semibold px-2.5"
                          >
                            <PhoneCall className="h-3 w-3 mr-1" />
                            Log Call
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedCase(c);
                              setPtpModalOpen(true);
                            }}
                            title="Record Promise to Pay"
                            className="h-8 text-xs font-semibold px-2.5 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            PTP
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => openDirectPayForCase(c)}
                            title="Collect Repayment"
                            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                          >
                            <Coins className="h-3 w-3 mr-1" />
                            Collect
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1.5">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">No overdue accounts matching filters.</p>
                      <p className="text-[11px] text-slate-400">All loans are currently performing in good standing.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROMISE-TO-PAY (PTP) TRACKER */}
            {activeTab === 'PTP_TRACKER' && (
              <div className="space-y-3">
                <div className="divide-y divide-slate-100 dark:divide-[#1E2445] text-xs">
                  {casesList.filter((c: any) => c.status === 'PROMISE_TO_PAY' || c.ptpDate).length > 0 ? (
                    casesList
                      .filter((c: any) => c.status === 'PROMISE_TO_PAY' || c.ptpDate)
                      .map((c: any) => (
                        <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{c.customerName || 'Borrower'}</span>
                              <span className="font-mono text-[10px] text-blue-500 font-bold">Loan #{c.loanNo}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                PTP Date: {c.ptpDate ? formatDate(c.ptpDate) : 'Pending'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Promised Amount: <strong className="text-emerald-500">{formatMoney(c.ptpAmount || c.overdueAmount || 0)}</strong> · Mode: {c.ptpMode || 'UPI / Bank'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => openDirectPayForCase(c)}
                              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Receive Payment →
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No pending Promise-to-Pay (PTP) commitments currently open.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BORROWER PAYMENT INTIMATIONS */}
            {activeTab === 'PAYMENT_INTIMATIONS' && (
              <div className="space-y-3">
                <div className="divide-y divide-slate-100 dark:divide-[#1E2445] text-xs">
                  {submissionsList.length > 0 ? (
                    submissionsList.slice(0, 8).map((sub: any) => (
                      <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{sub.customerName || 'Borrower'}</span>
                            <span className="font-mono text-[10px] text-blue-500 font-bold">Loan #{sub.loanNo}</span>
                            <span className="font-mono text-[10px] text-slate-400">UTR: {sub.reference || 'N/A'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Method: <strong>{sub.method}</strong> · Submitted: {sub.createdAt ? formatDate(sub.createdAt) : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatMoney(sub.amount || 0)}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              sub.status === 'VERIFIED'
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : sub.status === 'REJECTED'
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {sub.status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' : sub.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No recent payment intimations submitted by borrowers.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: DPD Aging Breakdown & Quick Portals */}
        <div className="lg:col-span-4 space-y-6">
          {/* DPD Aging Breakdown Card */}
          <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
            <div>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">DPD Aging Buckets</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Regulatory SMA-0 to NPA staging</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  RBI Compliant
                </span>
              </div>

              <div className="space-y-3 pt-3 text-xs">
                {/* 1-30 Days */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>1–30 Days (SMA-0) · <strong className="text-slate-300">{getBucketCount('0-30')} cases</strong></span>
                    <span className="font-bold text-amber-500">
                      {formatMoney(getBucketAmount('0-30'))}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1E2445] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${getBucketPercent('0-30')}%` }}
                    />
                  </div>
                </div>

                {/* 31-60 Days */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>31–60 Days (SMA-1) · <strong className="text-slate-300">{getBucketCount('31-60')} cases</strong></span>
                    <span className="font-bold text-orange-500">
                      {formatMoney(getBucketAmount('31-60'))}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1E2445] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${getBucketPercent('31-60')}%` }}
                    />
                  </div>
                </div>

                {/* 61-90 Days */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>61–90 Days (SMA-2) · <strong className="text-slate-300">{getBucketCount('61-90')} cases</strong></span>
                    <span className="font-bold text-rose-500">
                      {formatMoney(getBucketAmount('61-90'))}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1E2445] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${getBucketPercent('61-90')}%` }}
                    />
                  </div>
                </div>

                {/* 91-180 Days */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>91–180 Days (NPA - Substandard) · <strong className="text-slate-300">{getBucketCount('91-180')} cases</strong></span>
                    <span className="font-bold text-purple-500">
                      {formatMoney(getBucketAmount('91-180'))}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1E2445] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${getBucketPercent('91-180')}%` }}
                    />
                  </div>
                </div>

                {/* 180+ Days */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>180+ Days (Doubtful / Loss) · <strong className="text-slate-300">{getBucketCount('180+')} cases</strong></span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      {formatMoney(getBucketAmount('180+'))}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1E2445] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-700 rounded-full transition-all duration-500"
                      style={{ width: `${getBucketPercent('180+')}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Navigation Links */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-[#1E2445]">
              <Link href="/collections" className="block">
                <Button size="sm" className="w-full text-xs text-white bg-[#2563EB] hover:bg-blue-700 font-semibold shadow-sm">
                  Open Delinquency Recovery Desk →
                </Button>
              </Link>
              <Link href="/payments" className="block">
                <Button size="sm" variant="secondary" className="w-full text-xs font-semibold">
                  Payments & Waterfall Ledger →
                </Button>
              </Link>
              <Link href="/early-warnings" className="block">
                <Button size="sm" variant="ghost" className="w-full text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                  <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                  Early Warning Anomaly Radar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}
      {/* A. Contact Activity Log Modal */}
      {selectedCase && (
        <ContactActivityModal
          isOpen={activityModalOpen}
          onClose={() => {
            setActivityModalOpen(false);
            setSelectedCase(null);
          }}
          caseItem={selectedCase}
        />
      )}

      {/* B. PTP Record Modal */}
      {selectedCase && (
        <PtpModal
          isOpen={ptpModalOpen}
          onClose={() => {
            setPtpModalOpen(false);
            setSelectedCase(null);
          }}
          caseItem={selectedCase}
        />
      )}

      {/* C. Direct EMI Repayment Posting Modal */}
      {directPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-all',
              isDark ? 'bg-[#0C152B] border-[#1E2445] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2445]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    Record Direct EMI Repayment
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Post collected installment and auto-allocate across loan schedule
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Select Loan */}
              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Select Active Loan Account *
                </label>
                <select
                  value={directLoanId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setDirectLoanId(lId);
                    const chosen = loansList.find((l: any) => l.id === lId);
                    if (chosen?.emiAmount && !directAmount) {
                      setDirectAmount(String(chosen.emiAmount));
                    }
                  }}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#1E2445] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                  )}
                  required
                >
                  <option value="">-- Select Active Loan Account --</option>
                  {loansList
                    .filter((l: any) => l.status === 'ACTIVE' || l.status === 'OVERDUE' || l.status === 'DISBURSED')
                    .map((l: any) => {
                      const cName =
                        l.customerName ||
                        l.customer?.name ||
                        (l.customer?.firstName ? `${l.customer.firstName} ${l.customer.lastName || ''}`.trim() : '') ||
                        'Borrower';
                      return (
                        <option key={l.id} value={l.id}>
                          Loan #{l.loanNo} · {cName} (EMI: {formatMoney(l.emiAmount || 0)} · Outstanding: {formatMoney(l.outstandingPrincipal || 0)})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Repayment Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                  />
                </div>
                <div>
                  <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Payment Channel *
                  </label>
                  <select
                    value={directMethod}
                    onChange={(e) => setDirectMethod(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                      isDark ? 'border-[#1E2445] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                    )}
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="CASH">Branch Cash Counter</option>
                    <option value="CHEQUE">Cheque / DD</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Bank Transaction / UTR Reference
                </label>
                <Input
                  value={directRef}
                  onChange={(e) => setDirectRef(e.target.value)}
                  placeholder="e.g. UPI-9988771122 or BANK-NEFT-5544"
                />
              </div>

              {/* Notes */}
              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Audit Settlement Notes
                </label>
                <Input
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  placeholder="e.g. Monthly installment paid via branch counter"
                />
              </div>

              {/* Waterfall Info Banner */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] border border-blue-100 dark:border-[#1E2445] text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                  <Layers className="w-3.5 h-3.5" /> Automated Waterfall Hierarchy:
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Payment will settle automatically: <strong>1. Fees</strong> ➔ <strong>2. Penalty</strong> ➔ <strong>3. Interest</strong> ➔ <strong>4. Principal</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1E2445]">
                <Button variant="ghost" size="sm" onClick={() => setDirectPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!directLoanId || !directAmount || directPaymentMutation.isPending}
                  onClick={() => directPaymentMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {directPaymentMutation.isPending ? 'Recording...' : 'Confirm & Post Repayment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
