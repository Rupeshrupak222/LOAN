'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  ArrowRight,
  Search,
  RefreshCw,
  FileText,
  Building,
  CreditCard,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Activity,
  Award,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';

export function CreditAnalystDashboardView() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  type QueueTab = 'ALL' | 'AWAITING_INTAKE' | 'IN_ASSESSMENT' | 'KYC_PENDING' | 'UNDERWRITING' | 'SENT_BACK' | 'APPROVED';
  const [activeTab, setActiveTab] = useState<QueueTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch live metrics from credit assessment backend
  const { data: metricsData, isLoading: metricsLoading, isRefetching: metricsRefetching, refetch: refetchMetrics } = useQuery({
    queryKey: ['credit-dashboard-metrics'],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/dashboard');
      return res.data?.data;
    },
    refetchInterval: 8000,
  });

  // 2. Fetch live active proposals in credit queue
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['credit-dashboard-queue', activeTab, searchTerm],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/queue', {
        params: {
          tab: activeTab,
          search: searchTerm || undefined,
        },
      });
      return res.data?.data || [];
    },
    refetchInterval: 8000,
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetchMetrics(), refetchQueue()]);
    toast.info('Refreshed', 'Credit assessment workspace updated with latest data.');
  };

  const metrics = metricsData || {
    allProposals: 0,
    pendingAssessment: 0,
    inProgress: 0,
    kycPending: 0,
    inUnderwriting: 0,
    completedAssessment: 0,
    sentBack: 0,
    readyForUnderwriter: 0,
    approved: 0,
    totalVolume: 0,
    avgTicketSize: 0,
    riskDistribution: { lowRisk: 0, mediumRisk: 0, highRisk: 0 },
  };

  const rawQueue: any[] = Array.isArray(queueData) ? queueData : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#1E2445] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Credit Assessment &amp; Verification Desk
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Welcome back, {user?.firstName} {user?.lastName} · Dedicated Workspace for KYC verification, FOIR calculations &amp; underwriting recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefreshAll}
            disabled={metricsRefetching}
            className="w-[180px] h-9 justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', metricsRefetching && 'animate-spin')} />
            Refresh Queue
          </Button>

          <Link href="/customers">
            <Button size="sm" className="w-[180px] h-9 justify-center gap-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-sm">
              <Users className="h-3.5 w-3.5" />
              Forwarded Customers
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (Role-Specific: Only Credit KPIs) */}
      {/* 2. Top Metric Cards (Role-Specific: Only Credit KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Awaiting Intake */}
        <div
          onClick={() => setActiveTab('AWAITING_INTAKE')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'AWAITING_INTAKE'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-blue-300 dark:hover:border-blue-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Awaiting Intake</span>
            <Inbox className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {metrics.pendingAssessment ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Submitted proposals</p>
        </div>

        {/* Active In Assessment */}
        <div
          onClick={() => setActiveTab('IN_ASSESSMENT')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'IN_ASSESSMENT'
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-amber-300 dark:hover:border-amber-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Assessment</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {metrics.inProgress ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active FOIR checks</p>
        </div>

        {/* KYC Pending */}
        <div
          onClick={() => setActiveTab('KYC_PENDING')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'KYC_PENDING'
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-rose-300 dark:hover:border-rose-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">KYC Pending</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">
            {metrics.kycPending ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Unverified docs/KYC</p>
        </div>

        {/* In Underwriting */}
        <div
          onClick={() => setActiveTab('UNDERWRITING')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'UNDERWRITING'
              ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-purple-300 dark:hover:border-purple-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Underwriting</span>
            <Building className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">
            {metrics.inUnderwriting ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Underwriter queue</p>
        </div>

        {/* Returned for Corrections */}
        <div
          onClick={() => setActiveTab('SENT_BACK')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'SENT_BACK'
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-rose-300 dark:hover:border-rose-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sent Back</span>
            <RotateCcw className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {metrics.sentBack ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Needs correction</p>
        </div>

        {/* Approved Sanctions */}
        <div
          onClick={() => setActiveTab('APPROVED')}
          className={cn(
            'p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs',
            activeTab === 'APPROVED'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] hover:border-emerald-300 dark:hover:border-emerald-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 truncate">
            {metrics.approved ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sanctioned loans</p>
        </div>
      </div>

      {/* 3. Operational Quick Action Tabs & Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs with clean labels and live count badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: 'ALL', label: 'All Proposals', count: metrics.allProposals ?? 0 },
              { key: 'AWAITING_INTAKE', label: 'Awaiting Intake', count: metrics.pendingAssessment ?? 0 },
              { key: 'IN_ASSESSMENT', label: 'In Assessment', count: metrics.inProgress ?? 0 },
              { key: 'KYC_PENDING', label: 'KYC Pending', count: metrics.kycPending ?? 0 },
              { key: 'UNDERWRITING', label: 'In Underwriting', count: metrics.inUnderwriting ?? 0 },
              { key: 'SENT_BACK', label: 'Sent Back', count: metrics.sentBack ?? 0 },
              { key: 'APPROVED', label: 'Approved', count: metrics.approved ?? 0 },
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E2445]'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight',
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, app # or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#1E2445]/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Active Applications Queue Table */}
      {queueLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : rawQueue.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] space-y-3">
          <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 dark:bg-[#1E2445] flex items-center justify-center text-slate-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Applications Found in Selected Tab
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Proposals submitted by Loan Officers will automatically appear here for your credit assessment.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-[#1E2445]/60 border-b border-slate-200 dark:border-[#1E2445] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[140px]">Application #</th>
                  <th className="py-3 px-4 min-w-[160px]">Applicant Profile</th>
                  <th className="py-3 px-4 min-w-[130px]">Product &amp; Amount</th>
                  <th className="py-3 px-4 min-w-[110px]">KYC Status</th>
                  <th className="py-3 px-4 min-w-[150px]">Documents Verified</th>
                  <th className="py-3 px-4 min-w-[120px]">Workflow Status</th>
                  <th className="py-3 px-4 text-right min-w-[220px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {rawQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1E2445]/40 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-blue-600 dark:text-blue-400">{item.applicationNo || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.createdAt ? formatDate(item.createdAt) : 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{item.applicantName || item.borrowerName || 'Applicant'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.employmentType || 'SALARIED'}
                        </span>
                        {item.mobile && <span className="text-[10px] text-slate-400">· {item.mobile}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{formatMoney(item.requestedAmount || 0)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.productName || item.loanProduct || 'Loan Product'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight',
                        item.kycStatus === 'VERIFIED' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
                        item.kycStatus === 'UNDER_REVIEW' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
                        item.kycStatus === 'REJECTED' && 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
                        item.kycStatus === 'NOT_STARTED' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                        (!item.kycStatus || item.kycStatus === 'PENDING' || item.kycStatus === 'SUBMITTED') && 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      )}>
                        {item.kycStatus === 'VERIFIED'
                          ? '✓ VERIFIED'
                          : item.kycStatus === 'UNDER_REVIEW'
                          ? 'UNDER REVIEW'
                          : item.kycStatus === 'REJECTED'
                          ? '✕ REJECTED'
                          : item.kycStatus === 'NOT_STARTED'
                          ? 'NOT STARTED'
                          : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {Number(item.documentsCount || 0) === 0 ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-400 dark:text-slate-500">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>0 Uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-semibold">
                          <FileCheck
                            className={cn(
                              'h-3.5 w-3.5',
                              item.verifiedDocumentsCount === item.documentsCount
                                ? 'text-emerald-500'
                                : item.verifiedDocumentsCount > 0
                                ? 'text-blue-500'
                                : 'text-amber-500'
                            )}
                          />
                          <span
                            className={cn(
                              item.verifiedDocumentsCount === item.documentsCount
                                ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            )}
                          >
                            {item.verifiedDocumentsCount || 0} of {item.documentsCount} Verified
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        let badgeLabel = item.status.replace(/_/g, ' ');
                        let badgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

                        if (item.status === 'REJECTED' || item.eligibilityCheck === 'NOT_ELIGIBLE') {
                          badgeLabel = 'NOT ELIGIBLE';
                          badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                        } else if (item.underwriterStatus === 'SENT_BACK' || item.creditAnalysisStatus === 'SENT_BACK') {
                          badgeLabel = 'SENT BACK';
                          badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                        } else if (item.status === 'APPROVED') {
                          badgeLabel = 'APPROVED';
                          badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                        } else if (item.status === 'UNDERWRITING') {
                          badgeLabel = 'IN UNDERWRITING';
                          badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
                        } else if (item.status === 'UNDER_REVIEW') {
                          badgeLabel = 'AT BRANCH MANAGER';
                          badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                        } else if (item.isReadyForUnderwriter) {
                          badgeLabel = 'READY FOR BM';
                          badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                        } else if (item.kycStatus !== 'VERIFIED' || (Number(item.documentsCount || 0) > 0 && Number(item.verifiedDocumentsCount || 0) < Number(item.documentsCount || 0))) {
                          badgeLabel = 'KYC / DOCS PENDING';
                          badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                        } else if (item.status === 'CREDIT_ASSESSMENT') {
                          badgeLabel = 'IN ASSESSMENT';
                          badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                        }

                        return (
                          <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight inline-block whitespace-nowrap', badgeClass)}>
                            {badgeLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[220px]">
                      {(() => {
                        let actionLabel = 'Start Assessment';
                        let actionHref = `/credit-assessment?applicationId=${item.id}`;
                        let actionClass = 'bg-[#2563EB] hover:bg-blue-700 text-white';

                        if (item.status === 'REJECTED' || item.eligibilityCheck === 'NOT_ELIGIBLE') {
                          actionLabel = 'View Assessment';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=3`;
                          actionClass = 'bg-slate-700 hover:bg-slate-800 text-white';
                        } else if (item.underwriterStatus === 'SENT_BACK' || item.creditAnalysisStatus === 'SENT_BACK') {
                          actionLabel = 'Review Corrections';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=2`;
                          actionClass = 'bg-amber-600 hover:bg-amber-700 text-white';
                        } else if (item.status === 'APPROVED') {
                          actionLabel = 'View Sanction';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=6`;
                          actionClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                        } else if (item.stage === 'BRANCH_MANAGER_REVIEW') {
                          actionLabel = 'Under BM Review';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=6`;
                          actionClass = 'bg-blue-700 hover:bg-blue-800 text-white';
                        } else if (item.status === 'UNDERWRITING') {
                          actionLabel = 'In Underwriting';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=6`;
                          actionClass = 'bg-purple-700 hover:bg-purple-800 text-white';
                        } else if (item.status === 'UNDER_REVIEW') {
                          actionLabel = 'Forwarded to BM';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=6`;
                          actionClass = 'bg-slate-700 hover:bg-slate-800 text-white';
                        } else if (item.isReadyForUnderwriter) {
                          actionLabel = 'Forward to Branch Manager';
                          actionHref = `/credit-assessment?applicationId=${item.id}&step=6`;
                          actionClass = 'bg-[#2563EB] hover:bg-blue-700 text-white';
                        } else if (item.status === 'CREDIT_ASSESSMENT') {
                          actionLabel = 'Continue Assessment';
                          actionHref = `/credit-assessment?applicationId=${item.id}`;
                          actionClass = 'bg-[#2563EB] hover:bg-blue-700 text-white';
                        }

                        return (
                          <Link
                            href={actionHref}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 w-[205px] h-9 px-3 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0',
                              actionClass
                            )}
                          >
                            <span>{actionLabel}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                          </Link>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
