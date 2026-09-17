'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Building,
  DollarSign,
  Search,
  FileText,
  Send,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

type QueueTab =
  | 'READY_FOR_DISBURSEMENT'
  | 'PRE_CHECK_PENDING'
  | 'PENDING_CHECKER'
  | 'STP_ELIGIBLE'
  | 'ON_HOLD'
  | 'FAILED'
  | 'EXECUTED'
  | 'ALL';

export default function FinanceQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      }
    >
      <FinanceQueueContent />
    </Suspense>
  );
}

function FinanceQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get('id');

  // If id is in URL query parameter, redirect cleanly to the dedicated workspace page
  useEffect(() => {
    if (urlAppId) {
      router.replace(`/finance-queue/${urlAppId}`);
    }
  }, [urlAppId, router]);

  const [activeTab, setActiveTab] = useState<QueueTab>('READY_FOR_DISBURSEMENT');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Finance Queue (Real DB Records)
  const {
    data: queueData,
    isLoading: queueLoading,
    refetch: refetchQueue,
    isRefetching: queueRefetching,
  } = useQuery({
    queryKey: ['finance-queue', activeTab, searchQuery],
    queryFn: async () => {
      const res = await api.get('/finance/queue', {
        params: {
          tab: activeTab,
          search: searchQuery.trim() || undefined,
        },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : []) as any[];
    },
    refetchInterval: 10000,
  });

  // 1B. Fetch Master Queue Stats (Live across all finance stages)
  const { data: statsData } = useQuery({
    queryKey: ['finance-queue-stats'],
    queryFn: async () => {
      const res = await api.get('/finance/queue/stats');
      return res.data?.data;
    },
    refetchInterval: 10000,
  });

  // Computed KPIs
  const queueStats = useMemo(() => {
    if (statsData) {
      return {
        readyCount: statsData.readyCount ?? 0,
        pendingPreCheck: statsData.preCheckPending ?? 0,
        pendingChecker: statsData.pendingChecker ?? 0,
        stpCount: statsData.stpCount ?? 0,
        disbursedCount: statsData.disbursedCount ?? 0,
        totalVolume: statsData.totalVolume ?? 0,
      };
    }
    const list = queueData || [];
    const readyCount = list.filter((i) => i.status === 'READY_FOR_DISBURSEMENT').length;
    const pendingPreCheck = list.filter((i) => !i.bankAccount?.isVerified || !i.gatekeeperStatus?.canDisburse).length;
    const pendingChecker = list.filter(
      (i) => i.makerCheckerStatus?.hasActiveTask && i.makerCheckerStatus?.taskStatus === 'PENDING_CHECKER'
    ).length;
    const stpCount = list.filter((i) => i.isStpEligible).length;
    const totalVolume = list.reduce((sum, item) => sum + (Number(item.netDisbursalAmount) || 0), 0);

    return { readyCount, pendingPreCheck, pendingChecker, stpCount, disbursedCount: 0, totalVolume };
  }, [statsData, queueData]);

  const tabsConfig = [
    { id: 'READY_FOR_DISBURSEMENT', label: 'Ready for Payout', countBadge: queueStats.readyCount },
    { id: 'PRE_CHECK_PENDING', label: 'Pre-Check Pending', countBadge: queueStats.pendingPreCheck },
    { id: 'PENDING_CHECKER', label: 'Pending Checker', countBadge: queueStats.pendingChecker },
    { id: 'STP_ELIGIBLE', label: 'STP Fast-Track', countBadge: queueStats.stpCount },
    { id: 'ON_HOLD', label: 'On Hold' },
    { id: 'FAILED', label: 'Failed' },
    { id: 'EXECUTED', label: 'Disbursed', countBadge: queueStats.disbursedCount },
    { id: 'ALL', label: 'All Cases', countBadge: statsData?.totalCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Lending OS / Financial Operations"
        title="Finance & Disbursement Queue"
        subtitle="M2P Enterprise Financial Controls & mPokket High-Velocity Digital Payouts — Dual-Control Maker-Checker & 10-Point Pre-Disbursement Gates"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Ready for Payout"
          value={String(queueStats.readyCount)}
          icon={CheckCircle2}
          hint="Pre-checks & bank verified"
          trend="Actionable"
          trendPositive={true}
          variant="success"
        />
        <KpiCard
          label="Pre-Check Pending"
          value={String(queueStats.pendingPreCheck)}
          icon={Clock}
          hint="Awaiting penny drop/docs"
          variant="warning"
        />
        <KpiCard
          label="Pending Checker"
          value={String(queueStats.pendingChecker)}
          icon={ShieldCheck}
          hint="Dual-control second eye"
          variant="default"
        />
        <KpiCard
          label="STP Fast-Track"
          value={String(queueStats.stpCount)}
          icon={Zap}
          hint="Automated digital cases"
          trend="Direct"
          trendPositive={true}
          variant="default"
        />
        <KpiCard
          label="Queue Net Volume"
          value={formatMoney(queueStats.totalVolume)}
          icon={DollarSign}
          hint="Total net disbursable"
          variant="default"
        />
      </div>

      {/* Main Queue Card with Tabs */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs List */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as QueueTab)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.countBadge === 'number' && (
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {tab.countBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search & Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search app#, name, bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchQueue()}
                disabled={queueRefetching}
                className="h-9 px-2.5"
                title="Refresh Queue"
              >
                <RefreshCw className={cn('h-4 w-4', queueRefetching && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>

        {/* Queue Table */}
        {queueLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : !queueData || queueData.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Coins className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Applications in Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              There are no loan applications currently matching the &ldquo;{activeTab.replace(/_/g, ' ')}&rdquo; filter.
            </p>
            {activeTab !== 'READY_FOR_DISBURSEMENT' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setActiveTab('READY_FOR_DISBURSEMENT');
                    setSearchQuery('');
                  }}
                >
                  View Ready for Payout Queue
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                  }}
                >
                  View All Cases
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Application & Product</th>
                  <th className="py-3 px-4">Borrower & Destination Bank</th>
                  <th className="py-3 px-4 text-right">Sanctioned / Net Payout</th>
                  <th className="py-3 px-4 text-center">10-Point Gates</th>
                  <th className="py-3 px-4 text-center">Dual Control (SOD)</th>
                  <th className="py-3 px-4 text-center">Velocity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {queueData.map((item: any) => {
                  const canDisburse = item.gatekeeperStatus?.canDisburse;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Application & Product */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/finance-queue/${item.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          {item.applicationNo}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{item.loanProduct}</span>
                          <span>•</span>
                          <span>{item.tenureMonths}m @ {item.interestRate}%</span>
                        </div>
                      </td>

                      {/* Borrower & Destination Bank */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.borrowerName}
                        </div>
                        {item.bankAccount ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building className="h-3 w-3 text-slate-400 inline shrink-0" />
                            <span>{item.bankAccount.bankName}</span>
                            <span className="font-mono">{item.bankAccount.maskedAccountNumber}</span>
                            {item.bankAccount.isVerified ? (
                              <Badge variant="success" className="text-[9px] py-0 px-1 font-bold">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[9px] py-0 px-1 font-bold">
                                Penny Drop Pending
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-500">No bank account mapped</div>
                        )}
                      </td>

                      {/* Sanctioned / Net Payout */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          {formatMoney(item.netDisbursalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono line-through">
                          {formatMoney(item.approvedAmount)}
                        </div>
                      </td>

                      {/* 10-Point Gates */}
                      <td className="py-3 px-4 text-center">
                        {canDisburse ? (
                          <Badge variant="success" className="gap-1 inline-flex items-center font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>10/10 Passed</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 inline-flex items-center font-bold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{item.gatekeeperStatus?.passedChecksCount}/10 Passed</span>
                          </Badge>
                        )}
                      </td>

                      {/* Dual Control Status */}
                      <td className="py-3 px-4 text-center">
                        {item.makerCheckerStatus?.hasActiveTask ? (
                          <Badge
                            variant={
                              item.makerCheckerStatus.taskStatus === 'APPROVED'
                                ? 'success'
                                : item.makerCheckerStatus.taskStatus === 'PENDING_CHECKER'
                                ? 'warning'
                                : 'default'
                            }
                            className="text-[10px] font-bold"
                          >
                            {item.makerCheckerStatus.taskStatus === 'PENDING_CHECKER'
                              ? 'Waiting Checker'
                              : item.makerCheckerStatus.taskStatus}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px] text-slate-500 font-medium">
                            Maker Required
                          </Badge>
                        )}
                      </td>

                      {/* Velocity & STP */}
                      <td className="py-3 px-4 text-center">
                        {item.isStpEligible ? (
                          <Badge variant="info" className="gap-1 text-[10px] inline-flex items-center font-bold">
                            <Zap className="h-3 w-3" />
                            <span>STP Direct</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px]">
                            Standard LOS
                          </Badge>
                        )}
                      </td>

                      {/* Action -> Link to Dedicated Full-Page Workspace */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/finance-queue/${item.id}`}>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                          >
                            <Coins className="h-3.5 w-3.5" />
                            <span>Open Desk &rarr;</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
