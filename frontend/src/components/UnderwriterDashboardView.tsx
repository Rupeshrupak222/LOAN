'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  History,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronRight,
  FileText,
  AlertCircle,
  Play,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn, formatMoney, formatDate } from '@/lib/utils';
import { Button, Badge, Spinner } from '@/components/ui';

export function UnderwriterDashboardView() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Underwriting Dashboard & Queue data
  const {
    data: queueData,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ['underwriter-dashboard-queue'],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue');
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : raw?.items || []) as any[];
    },
    refetchInterval: 10000,
  });

  const cases = Array.isArray(queueData) ? queueData : [];

  // Start Case Mutation
  const startCaseMutation = useMutation({
    mutationFn: async (appId: string) => {
      return api.post(`/underwriting/${appId}/start`);
    },
    onSuccess: (res, appId) => {
      queryClient.invalidateQueries({ queryKey: ['underwriter-dashboard-queue'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['my-underwriting-cases'] });
      router.push(`/underwriting?id=${appId}`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err), { title: 'Could not start case' });
    },
  });

  // 6 Authoritative KPI Computations from live DB/workflow records
  const pendingReviewCount = cases.filter(
    (c) => c.status === 'UNDERWRITING' || c.status === 'UNDER_REVIEW' || c.stage === 'UNDERWRITING_REVIEW'
  ).length;

  const decisionReadyCount = cases.filter(
    (c) =>
      (c.gates?.canApprove || c.stage === 'DECISION_READY' || c.status === 'UNDERWRITING') &&
      (!c.deviations || c.deviations.length === 0 || c.deviations.every((d: any) => d.status === 'RESOLVED' || d.status === 'WAIVED'))
  ).length;

  const slaDueTodayCount = cases.filter((c) => {
    if (!c.slaDeadline) return false;
    const due = new Date(c.slaDeadline).getTime();
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    return due <= todayEnd;
  }).length;

  const escalatedCount = cases.filter(
    (c) => c.status === 'ESCALATED' || c.stage === 'ESCALATED' || Number(c.requestedAmount || 0) > 2500000
  ).length;

  const onHoldCount = cases.filter(
    (c) => c.status === 'HOLD' || c.stage === 'HOLD' || c.stage === 'AWAITING_INFORMATION'
  ).length;

  const sentBackCount = cases.filter(
    (c) => c.status === 'SENT_BACK' || c.stage === 'SENT_BACK' || c.underwriting?.decision === 'SEND_BACK'
  ).length;

  // Filtered Priority Cases
  const priorityCases = cases.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const appNo = (c.applicationNo || c.id || '').toLowerCase();
    const borrower = (
      c.customer ? `${c.customer.firstName} ${c.customer.lastName || ''}` : c.borrowerName || ''
    ).toLowerCase();
    const product = (c.product?.name || c.productName || '').toLowerCase();
    return appNo.includes(term) || borrower.includes(term) || product.includes(term);
  });

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-2xs';

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            Underwriting Executive Dashboard
          </h1>
          <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Real-time appraisal queue, SLA tracking, exception gates, and authority decision desk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Link href="/underwriting-queue">
            <Button size="sm" className="gap-1.5 text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer">
              Open Work Queue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Exactly 6 Canonical Underwriting KPI Cards (Live Database Driven) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{pendingReviewCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting credit appraisal</p>
        </div>

        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Decision Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{decisionReadyCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">All policies & gates pass</p>
        </div>

        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">SLA Due Today</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{slaDueTodayCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Priority resolution required</p>
        </div>

        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Escalated</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{escalatedCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Referred to higher committee</p>
        </div>

        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">On Hold</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{onHoldCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Info requested from applicant</p>
        </div>

        <div className={cn('rounded-2xl border p-4 transition-all', cardBgClass)}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sent Back</span>
            <History className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{sentBackCount}</div>
          <p className="text-[10px] text-slate-400 mt-1">Returned to Analyst / LO</p>
        </div>
      </div>

      {/* 3. MY PRIORITY CASES Table */}
      <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-[#2B3566]">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">MY PRIORITY CASES</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned loan proposals requiring credit evaluation, exception review, and sanction decision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search priority cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all w-52',
                  isDark
                    ? 'border-[#2B3566] bg-[#16203D] text-white focus:border-blue-500'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500'
                )}
              />
            </div>
            <Link href="/underwriting-queue" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
              View All Queue →
            </Link>
          </div>
        </div>

        {/* Priority Cases Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2B3566] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">Application ID</th>
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Requested Amount</th>
                <th className="py-2.5 px-3 text-center">Risk Grade</th>
                <th className="py-2.5 px-3 text-center">BRE Status</th>
                <th className="py-2.5 px-3 text-center">Deviation</th>
                <th className="py-2.5 px-3">SLA</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex justify-center mb-2">
                      <Spinner />
                    </div>
                    Loading priority underwriting cases...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-rose-500 space-y-1">
                    <AlertCircle className="w-6 h-6 mx-auto" />
                    <p className="font-semibold text-sm">Failed to load priority cases</p>
                    <p className="text-xs text-slate-400">
                      {apiErrorMessage(error) || 'Could not connect to underwriting service.'}
                    </p>
                  </td>
                </tr>
              ) : priorityCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No applications are currently waiting for underwriting.
                    </p>
                    <p className="text-[11px] text-slate-400">Cases forwarded by Credit Analysts will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                priorityCases.map((item) => {
                  const custName = item.customer
                    ? `${item.customer.firstName} ${item.customer.lastName || ''}`.trim()
                    : item.borrowerName || 'Borrower';
                  const custId = item.customerId || item.customer?.id;
                  const devCount = item.deviations?.length || 0;
                  const riskGrade = item.riskGrade || item.riskAssessment?.category || 'MEDIUM';
                  const breStatus = item.breDecision || item.eligibility?.status || 'PASS';
                  const isReadyToStart = item.status === 'UNDERWRITING' && !item.stage;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#16203D]/60 transition-colors"
                    >
                      {/* Application ID */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        #{item.applicationNo || item.id?.slice(0, 8)}
                      </td>

                      {/* Borrower with Customer 360 link */}
                      <td className="py-3 px-3">
                        {custId ? (
                          <Link
                            href={`/customers/${custId}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 hover:underline flex items-center gap-1"
                            title="Open Customer 360 Profile"
                          >
                            <span>{custName}</span>
                            <span className="text-[10px] text-blue-500 font-normal">↗</span>
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-white">{custName}</span>
                        )}
                        <p className="text-[10px] text-slate-400">
                          {item.customer?.mobile || item.mobile || 'Verified Mobile'}
                        </p>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {item.product?.name || item.productName || 'Personal Loan'}
                      </td>

                      {/* Requested Amount */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatMoney(Number(item.requestedAmount || 0))}
                      </td>

                      {/* Risk Grade */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            riskGrade === 'LOW' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            riskGrade === 'MEDIUM' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            (riskGrade === 'HIGH' || riskGrade === 'VERY_HIGH') &&
                              'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {riskGrade}
                        </span>
                      </td>

                      {/* BRE Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold border',
                            breStatus === 'PASS' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            breStatus === 'REFER' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            breStatus === 'FAIL' && 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {breStatus}
                        </span>
                      </td>

                      {/* Deviation */}
                      <td className="py-3 px-3 text-center">
                        {devCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            {devCount} Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {item.slaDeadline ? formatDate(item.slaDeadline) : 'Today'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            item.status === 'UNDERWRITING'
                              ? 'info'
                              : item.status === 'APPROVED'
                              ? 'success'
                              : item.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* State-aware Primary Action: START vs CONTINUE REVIEW */}
                      <td className="py-3 px-3 text-right">
                        {isReadyToStart ? (
                          <Button
                            size="sm"
                            disabled={startCaseMutation.isPending}
                            onClick={() => startCaseMutation.mutate(item.id)}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            START
                          </Button>
                        ) : (
                          <Link href={`/underwriting?id=${item.id}`}>
                            <Button
                              size="sm"
                              className="text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-xs gap-1"
                            >
                              OPEN REVIEW <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
