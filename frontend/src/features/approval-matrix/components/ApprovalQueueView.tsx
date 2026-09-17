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
} from 'lucide-react';
import { useApprovalQueue, useApprovalPolicies } from '../hooks/useApprovalMatrix';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { ApprovalTask } from '../types';
import { Spinner, Badge, Button } from '@/components/ui';

export const ApprovalQueueView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tasks = [], isLoading, refetch } = useApprovalQueue({
    tab: selectedTab,
    search: searchTerm,
  });

  const { data: policies = [] } = useApprovalPolicies();
  const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0];
  const userLevel = activePolicy?.levels?.find((l) => l.roles?.includes('UNDERWRITER')) || activePolicy?.levels?.[0];
  const userAuthorityMaxLimit = userLevel?.maxAmount ?? Infinity;

  const pendingCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const highRiskCount = tasks.filter((t) => ['C', 'D', 'E'].includes(t.riskGrade as any)).length;
  const breachedCount = tasks.filter((t) => t.slaBreached).length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Approvals
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{pendingCount}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Awaiting sanction decision</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              High Risk Proposals
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-0.5">{highRiskCount}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Risk Grades C, D & E</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              SLA Breached
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-300 mt-0.5">{breachedCount}</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Exceeded turnaround threshold</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-2xl space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <select
              value={selectedTab}
              onChange={(e) => setSelectedTab(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="PENDING">Pending Authority Action</option>
              <option value="HIGH_RISK">High Risk Proposals</option>
              <option value="SLA_BREACHED">SLA Breached</option>
              <option value="COMPLETED">Sanction History</option>
              <option value="ALL">All Authority Tasks</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search applicant or loan #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tasks List Table */}
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
              There are no loan applications currently pending your delegated authority level.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const sanctionAmt = Number(task.eligibleAmount || task.amount || 0);
              const matchedLevel = activePolicy?.levels?.find((l) => l.level === task.level) || userLevel;
              const authorityLimit = matchedLevel?.maxAmount ?? userAuthorityMaxLimit;
              const isWithinAuthority = authorityLimit === Infinity || sanctionAmt <= authorityLimit;
              const isEscalated = task.status === 'ESCALATED' || (!isWithinAuthority && task.status !== 'APPROVED');

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    task.slaBreached
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                      : 'bg-slate-50/50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Application, Requested Amount, Proposed Sanction, Risk Grade */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{task.applicationNo || task.id.slice(0, 8)}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {task.customerName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {task.productCode || 'PERSONAL_LOAN'}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border',
                            (task.riskGrade as string) === 'A' || (task.riskGrade as string) === 'LOW'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : (task.riskGrade as string) === 'B' || (task.riskGrade as string) === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          Risk Grade: {task.riskGrade || 'MEDIUM'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                        <span>
                          Requested:{' '}
                          <strong className="text-slate-900 dark:text-white">{formatMoney(task.amount)}</strong>
                        </span>
                        <span>
                          Proposed Sanction:{' '}
                          <strong className="text-emerald-600 dark:text-emerald-300">
                            {formatMoney(task.eligibleAmount || task.amount)}
                          </strong>
                        </span>
                        <span>
                          Decision Status:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {task.status || 'PENDING'}
                          </strong>
                        </span>
                        <span>
                          Escalation Status:{' '}
                          <strong
                            className={
                              isEscalated
                                ? 'text-purple-600 dark:text-purple-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {isEscalated ? 'ESCALATED (Higher Level Required)' : 'None'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Underwriter Authority & Action Button (REVIEW vs ESCALATE) */}
                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right text-xs">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                            Authority:
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded font-bold border',
                              isWithinAuthority
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            )}
                          >
                            {isWithinAuthority
                              ? `Within Authority (${authorityLimit !== Infinity ? `≤ ${formatMoney(authorityLimit)}` : 'Full Scope'})`
                              : `Exceeds Authority (> ${formatMoney(authorityLimit)})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span className={task.slaBreached ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            {task.slaBreached ? 'SLA Breached' : `Due: ${new Date(task.slaDueAt || Date.now()).toLocaleTimeString()}`}
                          </span>
                        </div>
                      </div>

                      {/* Primary Action Button based on Authority Matrix */}
                      {isWithinAuthority ? (
                        <Link
                          href={`/underwriting?id=${task.applicationId || task.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                        >
                          REVIEW
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/underwriting?id=${task.applicationId || task.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          ESCALATE
                        </Link>
                      )}
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
