'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/ui';
import { collectionsApi } from '@/features/collections/api';

export default function CollectionsDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['collection-dashboard'],
    queryFn: () => collectionsApi.getDashboard(),
  });

  const summary = (dashboard?.summary || {}) as any;
  const activeCases = summary.activeCases || 0;
  const totalDue = summary.totalDueAmount || 0;
  const totalOverdue = summary.totalOverdueAmount || 0;
  const pendingPtps = summary.pendingPtps || 0;
  const brokenPtps = summary.brokenPtps || 0;
  const collectionsRecovered = summary.collectionsRecovered || 0;
  const keptPtps = summary.keptPtps || 0;
  
  const recoveryRate = keptPtps ? Math.round((keptPtps / (keptPtps + brokenPtps)) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Dashboard"
        subtitle="Overall collection portfolio, overdue amount, PTP, recovery and pending actions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Collection Cases"
          value={isLoading ? '...' : activeCases.toString()}
          subtext="Accounts Requiring Action"
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          variant="danger"
        />
        <KpiCard
          title="Total Overdue"
          value={isLoading ? '...' : `₹${totalOverdue.toLocaleString()}`}
          subtext={`Total Due: ₹${totalDue.toLocaleString()}`}
          icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
          variant="warning"
        />
        <KpiCard
          title="Promises to Pay (PTP)"
          value={isLoading ? '...' : pendingPtps.toString()}
          subtext={`Broken PTPs: ${brokenPtps}`}
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
        <KpiCard
          title="Payments Collected"
          value={isLoading ? '...' : `₹${collectionsRecovered.toLocaleString()}`}
          subtext={`Recovery Rate: ${recoveryRate}%`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
      </div>
    </div>
  );
}
