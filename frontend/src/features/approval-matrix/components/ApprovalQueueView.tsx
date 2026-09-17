'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Tag,
  RefreshCw,
  Scale,
  Award,
  FileCheck,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  DollarSign,
  Layers,
  Send,
  ArrowUpRight,
} from 'lucide-react';
import { useApprovalQueue, useApprovalPolicies } from '../hooks/useApprovalMatrix';
import { approvalAuthorityApi } from '../api';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { ApprovalTask } from '../types';
import { Spinner, Badge, Button } from '@/components/ui';

export const ApprovalQueueView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [forwardedMap, setForwardedMap] = useState<Record<string, boolean>>({});

  const toast = useToast();

  // Fetch all tasks for real-time KPI metrics banner
  const { data: allTasks = [], refetch: refetchAll } = useApprovalQueue({ tab: 'ALL' });

  // Fetch filtered tasks for current active view
  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useApprovalQueue({
    tab: selectedTab,
    search: searchTerm,
  });

  const { data: policies = [] } = useApprovalPolicies();
  const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0];
  const userLevel = activePolicy?.levels?.find((l) => l.roles?.includes('UNDERWRITER')) || activePolicy?.levels?.[0];
  const userAuthorityMaxLimit = userLevel?.maxAmount ?? Infinity;

  // Real-time calculated KPI metrics across all portfolio tasks
  const pendingCount = allTasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'HOLD'
  ).length;
  const sanctionedCount = allTasks.filter((t) => t.status === 'APPROVED').length;
  const highRiskCount = allTasks.filter((t) => ['C', 'D', 'E'].includes(t.riskGrade as any)).length;
  const breachedCount = allTasks.filter((t) => t.slaBreached && t.status === 'PENDING').length;

  const handleRefresh = () => {
    refetchAll();
    refetch();
  };

  const handleForwardToFinance = async (task: ApprovalTask) => {
    const targetAppId = task.applicationId || task.id;
    setForwardingId(targetAppId);
    try {
      const res = await approvalAuthorityApi.forwardToFinance(targetAppId);
      setForwardedMap((prev) => ({ ...prev, [targetAppId]: true }));
      const isReforward = res?.isReforward || forwardedMap[targetAppId];
      if (isReforward) {
        toast.success(`Proposal #${task.applicationNo} re-forwarded to Finance Officer for expedited disbursement.`);
      } else {
        toast.success(`Proposal #${task.applicationNo} successfully forwarded to Finance Officer queue.`);
      }
      refetchAll();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to forward proposal to Finance.');
    } finally {
      setForwardingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Sanctioned / Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Declined / Rejected
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 shadow-xs">
            <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Escalated to Committee
          </span>
        );
      case 'HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Under Information Hold
          </span>
        );
      case 'SENT_BACK':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 shadow-xs">
            <ArrowRight className="w-3.5 h-3.5 rotate-180 text-orange-600 dark:text-orange-400" />
            Sent Back for Rework
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-xs">
            <Inbox className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Pending Authority Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <div
          onClick={() => setSelectedTab('PENDING')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-xs',
            selectedTab === 'PENDING'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Action
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting sanction decision</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        {/* Sanctioned / Approved */}
        <div
          onClick={() => setSelectedTab('COMPLETED')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-xs',
            selectedTab === 'COMPLETED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Sanctioned Cases
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{sanctionedCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Approved under authority</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk */}
        <div
          onClick={() => setSelectedTab('HIGH_RISK')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-xs',
            selectedTab === 'HIGH_RISK'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              High Risk Proposals
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-300 mt-1">{highRiskCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Risk Grades C, D & E</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* SLA Breached */}
        <div
          onClick={() => setSelectedTab('SLA_BREACHED')}
          className={cn(
            'p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex items-center justify-between shadow-xs',
            selectedTab === 'SLA_BREACHED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          )}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              SLA Breached
            </span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-300 mt-1">{breachedCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Exceeded turnaround SLA</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedTab('ALL')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                selectedTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              All Authority Cases
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  selectedTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                {allTasks.length}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('PENDING')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                selectedTab === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Pending Action
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  selectedTab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('COMPLETED')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                selectedTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Sanctioned
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  selectedTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                {sanctionedCount}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab('HIGH_RISK')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                selectedTab === 'HIGH_RISK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              High Risk
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  selectedTab === 'HIGH_RISK' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                {highRiskCount}
              </span>
            </button>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search applicant or loan #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-60 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-3">Loading approval authority queue...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Proposals in Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no loan applications currently matching the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const targetAppId = task.applicationId || task.id;
              const sanctionAmt = Number(task.eligibleAmount || task.amount || 0);
              const matchedLevel = activePolicy?.levels?.find((l) => l.level === task.level) || userLevel;
              const authorityLimit = matchedLevel?.maxAmount ?? userAuthorityMaxLimit;
              const isWithinAuthority = authorityLimit === Infinity || sanctionAmt <= authorityLimit;
              const isApproved = task.status === 'APPROVED';
              const isEscalated = task.status === 'ESCALATED' || (!isWithinAuthority && !isApproved);
              const isForwarded = Boolean(forwardedMap[targetAppId]);
              const isCurrentlyForwarding = forwardingId === targetAppId;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-5 rounded-2xl border transition-all',
                    isApproved
                      ? 'bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/10 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400'
                      : task.slaBreached && task.status === 'PENDING'
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left Column: Applicant Info & Key Financial Metrics */}
                    <div className="space-y-3 flex-1">
                      {/* Top Badges & Name Row */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          #{task.applicationNo || task.id.slice(0, 8)}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {task.customerName}
                        </h4>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {task.productCode || 'PERSONAL_LOAN'}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                            (task.riskGrade as string) === 'A' || (task.riskGrade as string) === 'LOW'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : (task.riskGrade as string) === 'B' || (task.riskGrade as string) === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          )}
                        >
                          Risk Grade: {task.riskGrade || 'A'}
                        </span>
                        {getStatusBadge(task.status)}
                        {isForwarded && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Send className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            Forwarded to Finance Desk
                          </span>
                        )}
                      </div>

                      {/* Financial & Authority Info Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Requested Amount
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                            {formatMoney(task.amount)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Sanction Amount
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {formatMoney(task.eligibleAmount || task.amount)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Delegated Tier
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                            {task.levelName || `Level ${task.level || 1}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Authority Scope & Clean Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Authority Limit Tag */}
                      <div className="text-left lg:text-right">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>
                            {isWithinAuthority
                              ? `Within Authority (${authorityLimit !== Infinity ? `≤ ${formatMoney(authorityLimit)}` : 'Full Scope'})`
                              : `Exceeds Authority (> ${formatMoney(authorityLimit)})`}
                          </span>
                        </div>

                        {/* Status / Timing details */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 lg:justify-end">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Sanction Committed
                            </span>
                          ) : task.slaBreached ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                              <AlertCircle className="w-3 h-3" />
                              SLA Breached
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              SLA Target: 8 Hours
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Clean Action Buttons Row */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {isApproved ? (
                          <>
                            {/* Forward / Re-forward to Finance Button */}
                            <button
                              type="button"
                              onClick={() => handleForwardToFinance(task)}
                              disabled={isCurrentlyForwarding}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs',
                                isForwarded
                                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                              )}
                            >
                              {isCurrentlyForwarding ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isForwarded ? (
                                <RefreshCw className="w-3.5 h-3.5" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>{isForwarded ? 'Re-forward to Finance' : 'Forward to Finance Officer'}</span>
                            </button>

                            {/* View & Revise Decision */}
                            <Link
                              href={`/underwriting?id=${targetAppId}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 whitespace-nowrap transition-all cursor-pointer"
                            >
                              <FileCheck className="w-4 h-4" />
                              <span>View & Revise</span>
                            </Link>
                          </>
                        ) : isWithinAuthority ? (
                          <Link
                            href={`/underwriting?id=${targetAppId}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs shadow-blue-600/20 whitespace-nowrap transition-all cursor-pointer"
                          >
                            <span>Review & Sanction</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <Link
                            href={`/underwriting?id=${targetAppId}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-600/20 whitespace-nowrap transition-all cursor-pointer"
                          >
                            <Scale className="w-4 h-4" />
                            <span>Escalate to Committee</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
