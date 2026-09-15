'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, KpiCard } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { collectionsApi } from '@/features/collections/api';
import { CollectionAnalyticsView } from '@/features/collections/CollectionAnalyticsView';

export default function CollectionsDashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Dashboard Data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['collection-dashboard'],
    queryFn: () => collectionsApi.getDashboard(),
  });

  // Auto Assign Mutation
  const autoAssignMutation = useMutation({
    mutationFn: async () => collectionsApi.autoAssign(),
    onSuccess: (res: any) => {
      toast.success(`Auto-assigned ${res?.assignedCount || 0} delinquent cases across active officers.`);
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Collections & Recovery Management Platform"
        subtitle="End-to-end post-disbursement delinquency management, multi-factor priority scoring, PTP tracking, and automated recovery orchestration."
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => autoAssignMutation.mutate()}
              disabled={autoAssignMutation.isPending}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", autoAssignMutation.isPending && "animate-spin")} />
              {autoAssignMutation.isPending ? 'Assigning...' : 'Auto-Assign Queue'}
            </Button>
          </div>
        }
      />

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Delinquent Accounts"
          value={dashboardLoading ? '...' : (dashboard?.summary?.activeCases || 0).toString()}
          subtext={`Total Overdue: ₹${(dashboard?.summary?.totalOverdueAmount || 0).toLocaleString()}`}
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          variant="danger"
        />
        <KpiCard
          title="Promises to Pay (PTP)"
          value={dashboardLoading ? '...' : (dashboard?.summary?.pendingPtps || 0).toString()}
          subtext={`Due Today: ${dashboard?.summary?.dueTodayPtps || 0} • Broken: ${dashboard?.summary?.brokenPtps || 0}`}
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Collections Recovered"
          value={dashboardLoading ? '...' : `₹${(dashboard?.summary?.collectionsRecovered || 0).toLocaleString()}`}
          subtext={`Kept PTPs: ${dashboard?.summary?.keptPtps || 0}`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Cured / Kept PTP Ratio"
          value={dashboardLoading ? '...' : `${dashboard?.summary?.keptPtps ? Math.round((dashboard.summary.keptPtps / (dashboard.summary.keptPtps + (dashboard.summary.brokenPtps || 1))) * 100) : 100}%`}
          subtext="Commitment fulfillment rate"
          icon={<CheckCircle2 className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
      </div>

      <CollectionAnalyticsView />
    </div>
  );
}
