'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Users,
  PieChart,
  Settings,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, KpiCard } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { collectionsApi } from '@/features/collections/api';
import { CollectionQueueTable } from '@/features/collections/CollectionQueueTable';
import { CollectionAnalyticsView } from '@/features/collections/CollectionAnalyticsView';
import { ContactActivityModal } from '@/features/collections/ContactActivityModal';
import { PtpModal } from '@/features/collections/PtpModal';
import { AssignmentModal } from '@/features/collections/AssignmentModal';
import { EscalationModal } from '@/features/collections/EscalationModal';
import { StrategyConfigModal } from '@/features/collections/StrategyConfigModal';
import type { CollectionCaseSummary } from '@/features/collections/types';

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'ANALYTICS' | 'STRATEGIES'>('QUEUE');
  const [queueType, setQueueType] = useState<'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | 'ALL'>('ALL');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected case for action modals
  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);

  // Dashboard Data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['collection-dashboard'],
    queryFn: () => collectionsApi.getDashboard(),
  });

  // Cases List
  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['collection-cases', selectedBucket, queueType, searchQuery],
    queryFn: () =>
      collectionsApi.listCases({
        bucket: selectedBucket || undefined,
        queueType: queueType === 'ALL' ? undefined : queueType,
        search: searchQuery || undefined,
      }),
  });

  // Strategies List
  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ['collection-strategies'],
    queryFn: () => collectionsApi.listStrategies(),
    enabled: activeTab === 'STRATEGIES',
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
            <Button
              size="sm"
              variant="primary"
              onClick={() => setStrategyModalOpen(true)}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              New Strategy Version
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

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'QUEUE', label: 'Operational Work Queue' },
          { id: 'ANALYTICS', label: 'Delinquency & Migration Analytics' },
          { id: 'STRATEGIES', label: 'Strategy Policies & Versioning' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'py-2 px-1 border-b-2 text-xs font-semibold transition-all',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Queue Table */}
      {activeTab === 'QUEUE' && (
        <CollectionQueueTable
          cases={casesData?.data || []}
          isLoading={casesLoading}
          selectedBucket={selectedBucket}
          onSelectBucket={setSelectedBucket}
          queueType={queueType}
          onSelectQueueType={setQueueType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenActivity={(c) => {
            setSelectedCase(c);
            setActivityModalOpen(true);
          }}
          onOpenPtp={(c) => {
            setSelectedCase(c);
            setPtpModalOpen(true);
          }}
          onOpenAssign={(c) => {
            setSelectedCase(c);
            setAssignModalOpen(true);
          }}
          onOpenEscalate={(c) => {
            setSelectedCase(c);
            setEscalateModalOpen(true);
          }}
        />
      )}

      {/* Tab 2: Analytics & Migration */}
      {activeTab === 'ANALYTICS' && (
        <CollectionAnalyticsView />
      )}

      {/* Tab 3: Strategies */}
      {activeTab === 'STRATEGIES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100">Collection Strategies & Policy Versions</h3>
            <Button size="sm" variant="primary" onClick={() => setStrategyModalOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Draft New Strategy
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies?.map((strat) => (
              <Card key={strat.id} className="border-slate-800 bg-slate-900 p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">{strat.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{strat.description}</div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    strat.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    strat.status === 'DRAFT' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-800 text-slate-400'
                  )}>
                    {strat.status} (v{strat.version})
                  </span>
                </div>

                <div className="rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200">Priority Factor Weights:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <div>DPD Weight: <span className="text-slate-200">{strat.priorityWeights?.dpdWeight * 100}%</span></div>
                    <div>Overdue Weight: <span className="text-slate-200">{strat.priorityWeights?.overdueAmountWeight * 100}%</span></div>
                    <div>Risk Grade: <span className="text-slate-200">{strat.priorityWeights?.riskGradeWeight * 100}%</span></div>
                    <div>Broken PTPs: <span className="text-slate-200">{strat.priorityWeights?.brokenPtpWeight * 100}%</span></div>
                  </div>
                </div>

                <div className="text-slate-500 text-[11px] flex justify-between items-center pt-1">
                  <span>Effective Date: {new Date(strat.effectiveDate).toLocaleDateString()}</span>
                  {strat.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        await collectionsApi.activateStrategy(strat.id);
                        toast.success('Strategy activated.');
                        queryClient.invalidateQueries({ queryKey: ['collection-strategies'] });
                      }}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ContactActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        caseItem={selectedCase}
      />
      <PtpModal
        isOpen={ptpModalOpen}
        onClose={() => setPtpModalOpen(false)}
        caseItem={selectedCase}
      />
      <AssignmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        caseItem={selectedCase}
      />
      <EscalationModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        caseItem={selectedCase}
      />
      <StrategyConfigModal
        isOpen={strategyModalOpen}
        onClose={() => setStrategyModalOpen(false)}
      />
    </div>
  );
}
