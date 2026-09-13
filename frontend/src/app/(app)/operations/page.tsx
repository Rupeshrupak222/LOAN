'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  CheckSquare,
  Layers,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { useOperationsOverview, useOperationsApplications, useTeamQueue } from '@/lib/hooks/useOperations';
import { OverviewMetricsCards } from '@/components/operations/OverviewMetricsCards';
import { RequiresAttentionTable } from '@/components/operations/RequiresAttentionTable';
import { CreateApplicationModal } from '@/components/operations/CreateApplicationModal';

export default function OperationsOverviewPage() {
  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = useOperationsOverview();
  const { applications, loading: appsLoading, refetch: refetchApps } = useOperationsApplications({
    page: 1,
    pageSize: 8,
    priority: 'HIGH',
  });
  const { claim } = useTeamQueue();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleRefresh = () => {
    refetchMetrics();
    refetchApps();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Operations Cockpit
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 uppercase">
              Lending Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time pipeline metrics, high-priority intake queues, and operational dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Refresh Metrics"
            className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <OverviewMetricsCards metrics={metrics} loading={metricsLoading} />

      {/* Quick Access Desk Navigation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/applications"
          className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
            Applications Directory
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Search, filter & manage all loan applications</p>
        </Link>

        <Link
          href="/operations/queue"
          className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <Inbox className="h-5 w-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
            Team Work Queues
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Departmental queue pools & assignment claiming</p>
        </Link>

        <Link
          href="/operations/tasks/my"
          className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
            My Open Tasks
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">SLA-tracked operational verification tasks</p>
        </Link>

        <Link
          href="/customers"
          className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="mt-2 font-bold text-slate-900 dark:text-white text-xs">
            Customer Directory
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Customer 360 profiles, KYC & linked facilities</p>
        </Link>
      </div>

      {/* Main Requires Attention Queue */}
      <RequiresAttentionTable
        applications={applications}
        loading={appsLoading}
        onClaim={async (id) => {
          await claim(id);
          handleRefresh();
        }}
      />

      {/* Create Application Wizard Modal */}
      <CreateApplicationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => handleRefresh()}
      />
    </div>
  );
}
