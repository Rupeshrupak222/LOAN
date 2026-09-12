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
} from 'lucide-react';
import { useApprovalQueue } from '../hooks/useApprovalMatrix';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { ApprovalTask } from '../types';
import { Spinner } from '@/components/ui';

export const ApprovalQueueView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tasks = [], isLoading, refetch } = useApprovalQueue({
    tab: selectedTab,
    search: searchTerm,
  });

  const pendingCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const highRiskCount = tasks.filter((t) => ['C', 'D', 'E'].includes(t.riskGrade)).length;
  const breachedCount = tasks.filter((t) => t.slaBreached).length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Approvals
            </span>
            <div className="text-2xl font-black text-white mt-0.5">{pendingCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting sanction decision</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              High Risk Proposals
            </span>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{highRiskCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Risk Grades C, D & E</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              SLA Breached
            </span>
            <div className="text-2xl font-black text-rose-300 mt-0.5">{breachedCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Exceeded turnaround threshold</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'PENDING', label: 'Pending Action' },
              { id: 'HIGH_RISK', label: 'High Risk' },
              { id: 'SLA_BREACHED', label: 'SLA Breached' },
              { id: 'COMPLETED', label: 'Sanction History' },
              { id: 'ALL', label: 'All Tasks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  selectedTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search applicant or loan #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
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
          <div className="p-12 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Proposals in Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no loan applications currently pending your delegated authority level.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.slaBreached
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Applicant & Amount Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {task.applicationNo}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {task.customerName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {task.productCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span>
                        Requested: <strong className="text-white">{formatMoney(task.amount)}</strong>
                      </span>
                      <span>
                        Eligible: <strong className="text-emerald-300">{formatMoney(task.eligibleAmount)}</strong>
                      </span>
                      <span>
                        BRE Verdict:{' '}
                        <strong
                          className={
                            task.breDecision === 'APPROVE'
                              ? 'text-emerald-400'
                              : task.breDecision === 'REFER'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {task.breDecision}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Level, SLA & Action Link */}
                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Authority:</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          L{task.level} • {task.levelName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span className={task.slaBreached ? 'text-rose-400 font-bold' : ''}>
                          {task.slaBreached ? 'SLA Breached' : `Due: ${new Date(task.slaDueAt).toLocaleTimeString()}`}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/approval-tasks/${task.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      Review Proposal
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
