'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Search,
  Filter,
  ArrowRight,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Send,
  TrendingUp,
  Calculator,
  User,
  ExternalLink,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  XCircle,
  FileCheck2,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

type TabKey =
  | 'READY'
  | 'IN_REVIEW'
  | 'SENT_BACK'
  | 'HOLD'
  | 'DECISION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'ALL';

interface QueueTabConfig {
  key: TabKey;
  label: string;
  badgeVariant?: string;
}

const TABS: QueueTabConfig[] = [
  { key: 'READY', label: 'Ready for Review' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'SENT_BACK', label: 'Sent Back' },
  { key: 'HOLD', label: 'Awaiting Info' },
  { key: 'DECISION_REQUIRED', label: 'Decision Required' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ESCALATED', label: 'Escalated (L3+)' },
  { key: 'ALL', label: 'All Cases' },
];

export default function UnderwritingQueuePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('READY');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Fetch Underwriting Queue
  const { data: queueData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['underwriting-queue', activeTab, searchQuery],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue', {
        params: {
          tab: activeTab,
          search: searchQuery.trim() || undefined,
        },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : (raw?.items || [])) as any[];
    },
  });

  const queueItems = Array.isArray(queueData) ? queueData : [];

  // Filter queue by severity if selected
  const filteredItems = queueItems.filter((item) => {
    if (severityFilter === 'ALL') return true;
    const maxSeverity = item.deviations?.reduce((max: string, d: any) => {
      if (d.severity === 'CRITICAL') return 'CRITICAL';
      if (d.severity === 'HIGH' && max !== 'CRITICAL') return 'HIGH';
      if (d.severity === 'MEDIUM' && !['CRITICAL', 'HIGH'].includes(max)) return 'MEDIUM';
      return max;
    }, 'LOW');
    return maxSeverity === severityFilter;
  });

  // Calculate Metrics from Queue
  const totalCases = queueItems.length;
  const readyCount = queueItems.filter((i) => i.status === 'UNDERWRITING' || i.stage === 'UNDERWRITING_REVIEW').length;
  const highRiskCount = queueItems.filter((i) => i.riskGrade === 'HIGH' || i.riskGrade === 'VERY_HIGH').length;
  const withDeviationsCount = queueItems.filter((i) => (i.deviations?.length || 0) > 0).length;
  const totalPipelineAmount = queueItems.reduce((sum, i) => sum + Number(i.requestedAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Underwriting Queue"
        title="Underwriting Work Queue"
        subtitle="M2P + mPokket Hybrid Lending Queue: Enterprise LOS workflows, automated BRE risk gating, and exceptions workbench."
        action={
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
            <Link href="/underwriting">
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer shadow-xs">
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Queue Volume"
          value={String(totalCases)}
          hint={activeTab === 'READY' ? 'Ready for Underwriter' : `Active in ${activeTab}`}
          icon={<Clock className="h-4 w-4 text-indigo-500" />}
        />
        <KpiCard
          label="Ready Cases"
          value={String(readyCount)}
          hint="Appraisal passed"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <KpiCard
          label="High Risk Proposals"
          value={String(highRiskCount)}
          hint="Grade C/D / High DTI"
          icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
        />
        <KpiCard
          label="With Deviations"
          value={String(withDeviationsCount)}
          hint="Requires mitigation"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Delegated Limit"
          value="₹25,00,000"
          hint="Level 2 UW Limit"
          icon={<Calculator className="h-4 w-4 text-blue-500" />}
        />
        <KpiCard
          label="Pipeline Exposure"
          value={formatMoney(totalPipelineAmount)}
          hint="Total requested sum"
          icon={<TrendingUp className="h-4 w-4 text-cyan-500" />}
        />
      </div>

      {/* Main Queue Card */}
      <Card noPadding className="p-5 space-y-4">
        {/* Controls: Search, Severity Filter, Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search proposal #, borrower name, mobile, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border font-medium outline-none transition-colors',
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-brand-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-brand-500'
                )}
              />
            </div>

            {/* Severity Quick Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={cn(
                'py-1.5 px-2 text-xs rounded-lg border font-medium outline-none cursor-pointer',
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
              )}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          {/* Workflow Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === tab.key
                    ? isDark
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && queueItems.length > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    isDark ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  )}>
                    {queueItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={cn(
                  'border-b text-[11px] font-bold uppercase tracking-wider',
                  isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Borrower Profile</th>
                  <th className="py-2.5 px-3">Product & Ticket</th>
                  <th className="py-2.5 px-3">Analyst Finding</th>
                  <th className="py-2.5 px-3">Bureau & Risk</th>
                  <th className="py-2.5 px-3">Deviations</th>
                  <th className="py-2.5 px-3">TAT / Priority</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredItems.map((item: any) => {
                  const deviations = item.deviations || [];
                  const hasCriticalDev = deviations.some((d: any) => d.severity === 'CRITICAL');
                  const hasHighDev = deviations.some((d: any) => d.severity === 'HIGH');

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors',
                        isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/70'
                      )}
                    >
                      {/* 1. Application # & Stage */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/underwriting?id=${item.id}`}
                          className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer block"
                        >
                          #{item.applicationNo || item.id.slice(0, 8)}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            'px-1.5 py-0.2 rounded text-[10px] font-semibold',
                            item.status === 'UNDERWRITING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                            item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          )}>
                            {item.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.channel || 'DIGITAL'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Borrower Profile */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : (item.borrowerName || 'Borrower')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.customer?.customerCode || item.customerCode || 'N/A'} · ₹{Number(item.customer?.monthlyIncome || item.monthlyIncome || 0).toLocaleString('en-IN')}/mo
                        </div>
                      </td>

                      {/* 3. Product & Amount */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {formatMoney(Number(item.requestedAmount || 0))}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.product?.name || item.loanProduct || 'Personal Loan'} · {item.tenureMonths || 12}M
                        </div>
                      </td>

                      {/* 4. Analyst Finding */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            item.analystRecommendation === 'APPROVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.analystRecommendation === 'REJECT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          )}>
                            {item.analystRecommendation || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          FOIR: {item.foir ? `${item.foir}%` : '42%'}
                        </div>
                      </td>

                      {/* 5. Bureau & Risk */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'font-bold text-xs',
                            (item.bureauScore || 720) >= 700 ? 'text-emerald-600' : (item.bureauScore || 720) >= 650 ? 'text-amber-600' : 'text-rose-600'
                          )}>
                            CIBIL {item.bureauScore || 745}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <span className={cn(
                            'px-1.5 py-0.2 rounded text-[9px] font-bold',
                            item.riskGrade === 'LOW' || item.riskGrade === 'A' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.riskGrade === 'MEDIUM' || item.riskGrade === 'B' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          )}>
                            Grade {item.riskGrade || 'A'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Deviations */}
                      <td className="py-3 px-3">
                        {deviations.length === 0 ? (
                          <span className="text-[10px] text-slate-400 font-normal">None (Clean)</span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1',
                              hasCriticalDev
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : hasHighDev
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            )}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {deviations.length} Deviation{deviations.length > 1 ? 's' : ''}
                            </span>
                            <div className="text-[9px] text-slate-400 truncate max-w-[130px]">
                              {deviations[0]?.ruleName}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 7. TAT / Priority */}
                      <td className="py-3 px-3">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          item.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          item.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        )}>
                          {item.priority || 'MEDIUM'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.tatHoursRemaining !== undefined ? `${item.tatHoursRemaining}h SLA left` : 'Within SLA'}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3 px-3 text-right">
                        <Link href={`/underwriting?id=${item.id}`}>
                          <Button
                            size="sm"
                            className="gap-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                          >
                            Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No applications found in {activeTab} queue.
            </p>
            <p className="text-xs text-slate-400">
              Proposals requiring underwriting decisions or exception sign-off will automatically appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
