'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  ShieldAlert,
  DollarSign,
  Users,
  Building2,
  Clock,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  Sliders,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Spinner, Button, Badge } from '@/components/ui';
import { formatMoney, cn } from '@/lib/utils';

type AnalyticsTab =
  | 'overview'
  | 'funnel'
  | 'credit'
  | 'risk'
  | 'disbursements'
  | 'portfolio'
  | 'delinquency'
  | 'collections'
  | 'finance'
  | 'partners'
  | 'branches'
  | 'operations';

const TIME_RANGES = [
  { value: 'all_time', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_financial_year', label: 'FY 2026-27' },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [timeRange, setTimeRange] = useState('all_time');
  const [exporting, setExporting] = useState(false);

  // Drilldown state
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    dimension: 'APPLICATIONS' | 'LOANS' | 'DISBURSEMENTS';
    title: string;
    filters?: Record<string, any>;
  }>({
    isOpen: false,
    dimension: 'APPLICATIONS',
    title: '',
  });

  // Queries for active tabs
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview', timeRange],
    queryFn: async () => (await api.get(`/analytics/overview?timeRange=${timeRange}`)).data.data,
  });

  const { data: funnelData = [] } = useQuery({
    queryKey: ['analytics-funnel', timeRange],
    queryFn: async () => (await api.get(`/analytics/funnel?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'funnel' || activeTab === 'overview',
  });

  const { data: creditData } = useQuery({
    queryKey: ['analytics-credit', timeRange],
    queryFn: async () => (await api.get(`/analytics/credit?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'credit',
  });

  const { data: riskData } = useQuery({
    queryKey: ['analytics-risk-fraud', timeRange],
    queryFn: async () => (await api.get(`/analytics/risk-fraud?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'risk',
  });

  const { data: disbursementData } = useQuery({
    queryKey: ['analytics-disbursements', timeRange],
    queryFn: async () => (await api.get(`/analytics/disbursements?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'disbursements',
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['analytics-portfolio', timeRange],
    queryFn: async () => (await api.get(`/analytics/portfolio?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'portfolio',
  });

  const { data: delinquencyData } = useQuery({
    queryKey: ['analytics-delinquency', timeRange],
    queryFn: async () => (await api.get(`/analytics/delinquency?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'delinquency',
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['analytics-collections', timeRange],
    queryFn: async () => (await api.get(`/analytics/collections?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'collections',
  });

  const { data: financeData } = useQuery({
    queryKey: ['analytics-finance', timeRange],
    queryFn: async () => (await api.get(`/analytics/finance?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'finance',
  });

  const { data: partnerData } = useQuery({
    queryKey: ['analytics-partners', timeRange],
    queryFn: async () => (await api.get(`/analytics/partners?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'partners',
  });

  const { data: branchData } = useQuery({
    queryKey: ['analytics-branches', timeRange],
    queryFn: async () => (await api.get(`/analytics/branches?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'branches',
  });

  const { data: operationsData } = useQuery({
    queryKey: ['analytics-operations', timeRange],
    queryFn: async () => (await api.get(`/analytics/operations?timeRange=${timeRange}`)).data.data,
    enabled: activeTab === 'operations',
  });

  // Drilldown data query
  const { data: drilldownResult, isLoading: drilldownLoading } = useQuery({
    queryKey: ['analytics-drilldown', drilldownModal.dimension, drilldownModal.filters],
    queryFn: async () => {
      if (!drilldownModal.isOpen) return null;
      const res = await api.post('/analytics/drilldown', {
        dimension: drilldownModal.dimension,
        filters: drilldownModal.filters || {},
        page: 1,
        pageSize: 15,
      });
      return res.data.data;
    },
    enabled: drilldownModal.isOpen,
  });

  // Export handler
  async function handleExport(type: string) {
    try {
      setExporting(true);
      const res = await api.post(
        '/analytics/export',
        {
          reportType: type,
          filters: { timeRange },
          maskPii: true,
        },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Adyapan_${type.toUpperCase()}_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export Successful', `Exported ${type.toUpperCase()} analytics report.`);
    } catch (err: any) {
      toast.error('Export Failed', apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const kpis = overviewData?.kpis || {};

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Insights / Analytics"
        title="Institutional Analytics & Intelligence Hub"
        subtitle="Authoritative portfolio telemetry, origination funnel, decision engine performance, and DPD risk intelligence"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time range selector */}
            <div className="flex items-center gap-1.5 bg-card dark:bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-0 font-medium text-foreground outline-none cursor-pointer"
              >
                {TIME_RANGES.map((r) => (
                  <option key={r.value} value={r.value} className="dark:bg-slate-900 text-foreground">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOverview()}
              className="flex items-center gap-1.5 text-xs shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={exporting}
              onClick={() => handleExport(activeTab === 'overview' ? 'LOANS' : activeTab.toUpperCase())}
              className="flex items-center gap-1.5 text-xs shadow-sm font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* Freshness Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Authoritative Reporting Layer: Active Real-time Stream
        </div>
        <span className="text-muted-foreground">
          Snapshot captured at {new Date().toLocaleTimeString('en-IN', { hour12: false })} IST
        </span>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border text-sm scrollbar-none">
        {[
          { id: 'overview', label: 'Executive Overview', icon: Activity },
          { id: 'funnel', label: 'Origination Funnel', icon: Layers },
          { id: 'credit', label: 'Credit & BRE', icon: CheckCircle2 },
          { id: 'risk', label: 'Risk & Fraud', icon: ShieldAlert },
          { id: 'disbursements', label: 'Disbursements', icon: DollarSign },
          { id: 'portfolio', label: 'Portfolio Intelligence', icon: BarChart3 },
          { id: 'delinquency', label: 'DPD & Delinquency', icon: AlertTriangle },
          { id: 'collections', label: 'Collections', icon: TrendingUp },
          { id: 'finance', label: 'Finance & GL', icon: DollarSign },
          { id: 'partners', label: 'Partners & DSAs', icon: Users },
          { id: 'branches', label: 'Branch Leaderboard', icon: Building2 },
          { id: 'operations', label: 'Operations SLA', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticsTab)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 font-medium whitespace-nowrap rounded-t-lg transition-colors border-b-2',
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="cursor-pointer"
              onClick={() =>
                setDrilldownModal({
                  isOpen: true,
                  dimension: 'LOANS',
                  title: 'Active Portfolio Loan Accounts',
                })
              }
            >
              <KpiCard
                label="Active Portfolio (AUM)"
                value={formatMoney(kpis.totalPrincipalOutstanding || 0)}
                hint={`${kpis.activeLoanCount || 0} active loan accounts`}
                icon={<DollarSign className="h-4 w-4 text-primary" />}
              />
            </div>
            <div
              className="cursor-pointer"
              onClick={() =>
                setDrilldownModal({
                  isOpen: true,
                  dimension: 'APPLICATIONS',
                  title: 'All Originating Applications',
                })
              }
            >
              <KpiCard
                label="Applications Sourced"
                value={String(kpis.totalApplications || 0)}
                hint={`${kpis.approvalRatePct || 0}% credit approval rate`}
                icon={<Layers className="h-4 w-4 text-blue-600" />}
              />
            </div>
            <div
              className="cursor-pointer"
              onClick={() =>
                setDrilldownModal({
                  isOpen: true,
                  dimension: 'DISBURSEMENTS',
                  title: 'Completed Disbursement Payouts',
                })
              }
            >
              <KpiCard
                label="Total Disbursed Volume"
                value={formatMoney(kpis.totalDisbursedAmount || 0)}
                hint={`${kpis.disbursementCount || 0} completed payouts`}
                icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              />
            </div>
            <KpiCard
              label="Active Collections Queue"
              value={String(kpis.activeCollectionCases || 0)}
              hint="Delinquent overdue cases"
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            />
          </div>

          {/* Quick Funnel preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base text-foreground">Origination Funnel Conversion</h3>
                <p className="text-xs text-muted-foreground">End-to-end stage conversion rates and drop-off analysis</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('funnel')}
                className="text-xs flex items-center gap-1"
              >
                Full Funnel Details <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
                  <XAxis dataKey="label" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 2. ORIGINATION FUNNEL */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">7-Stage Lending Conversion Waterfall</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Track conversion efficiency, drop-off rates, and turnaround times per stage
            </p>

            <div className="space-y-4">
              {funnelData.map((stage: any, idx: number) => (
                <div
                  key={stage.stage}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{stage.label}</h4>
                        <span className="text-xs text-muted-foreground">
                          Avg Stage TAT: {stage.avgDurationHours} hrs • SLA Breach: {stage.slaBreachPct}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-foreground">{stage.count}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({stage.conversionPct}% conversion)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.max(4, stage.conversionPct)}%` }}
                    />
                  </div>

                  {stage.dropOffPct > 0 && (
                    <div className="flex justify-end mt-1 text-[11px] text-red-500 font-medium">
                      ↓ {stage.dropOffPct}% drop-off from previous stage
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 3. CREDIT & BRE */}
      {activeTab === 'credit' && creditData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Total Evaluated"
              value={String(creditData.totalDecisions)}
              hint="Decision engine executions"
              icon={<Activity className="h-4 w-4 text-blue-600" />}
            />
            <KpiCard
              label="Approval Rate"
              value={`${creditData.approvalRatePct}%`}
              hint={`${creditData.approveCount} approved`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="Rejection Rate"
              value={`${creditData.rejectionRatePct}%`}
              hint={`${creditData.rejectCount} rejected`}
              icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
            />
            <KpiCard
              label="Referral Rate"
              value={`${creditData.referralRatePct}%`}
              hint={`${creditData.referCount} under review`}
              icon={<Clock className="h-4 w-4 text-amber-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-base text-foreground mb-1">Approval Rate by Risk Grade</h3>
              <p className="text-xs text-muted-foreground mb-4">Graduated approval percentages across Prime to Distressed</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creditData.approvalByRiskGrade}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="grade" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
                    <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="ratePct" fill="#10B981" radius={[4, 4, 0, 0]} name="Approval Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-base text-foreground mb-1">Top Policy Rejection Reasons</h3>
              <p className="text-xs text-muted-foreground mb-4">Root causes for adverse credit decisions</p>
              <div className="space-y-3">
                {creditData.topRejectionReasons.map((r: any) => (
                  <div key={r.reason} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
                    <span className="font-medium text-foreground">{r.reason}</span>
                    <Badge variant="danger" className="font-semibold">
                      {r.percentage}% ({r.count})
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. RISK & FRAUD */}
      {activeTab === 'risk' && riskData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-base text-foreground mb-1">Portfolio Risk Grade Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">Prime (A) to Distressed (E) concentration</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData.riskDistribution}
                      dataKey="count"
                      nameKey="grade"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                    >
                      {riskData.riskDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-base text-foreground mb-1">Fraud Classification Outcomes</h3>
              <p className="text-xs text-muted-foreground mb-4">Automated fraud detection engine distribution</p>
              <div className="space-y-3">
                {riskData.fraudDistribution.map((f: any) => (
                  <div key={f.category} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
                    <span className="font-medium text-foreground">{f.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{f.count} applications</span>
                      <Badge variant="default" className="font-semibold">
                        {f.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. DISBURSEMENTS */}
      {activeTab === 'disbursements' && disbursementData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <KpiCard
              label="Total Disbursed"
              value={formatMoney(disbursementData.totalDisbursedAmount)}
              hint={`${disbursementData.disbursementCount} completed transfers`}
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="Average Ticket Size"
              value={formatMoney(disbursementData.averageDisbursement)}
              hint="Per loan disbursement"
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
            <KpiCard
              label="Payout Turnaround Time"
              value={`${disbursementData.payoutStatus?.avgTatMinutes || 14} mins`}
              hint="Approval to bank credit"
              icon={<Clock className="h-4 w-4 text-primary" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Disbursement Volume Trajectory</h3>
            <p className="text-xs text-muted-foreground mb-4">Daily fund movement across payout rails</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={disbursementData.disbursementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
                  <XAxis dataKey="date" stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '8px',
                    }}
                    formatter={(val: any) => [formatMoney(val), 'Disbursed']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 6. PORTFOLIO INTELLIGENCE */}
      {activeTab === 'portfolio' && portfolioData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Total Active Loans"
              value={String(portfolioData.totalActiveLoans)}
              hint="Live customer accounts"
              icon={<Users className="h-4 w-4 text-primary" />}
            />
            <KpiCard
              label="Principal Outstanding"
              value={formatMoney(portfolioData.totalPrincipalOutstanding)}
              hint="Active debt principal"
              icon={<DollarSign className="h-4 w-4 text-blue-600" />}
            />
            <KpiCard
              label="Total Overdue / Penalty"
              value={formatMoney(portfolioData.totalOverdueAmount)}
              hint="Accrued overdue charges"
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            />
            <KpiCard
              label="Total Exposure (AUM)"
              value={formatMoney(portfolioData.totalExposure)}
              hint="Gross balance sheet exposure"
              icon={<Activity className="h-4 w-4 text-emerald-600" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Portfolio Breakdown by Product</h3>
            <p className="text-xs text-muted-foreground mb-4">AUM distribution across institutional product lines</p>
            <div className="space-y-3">
              {portfolioData.portfolioByProduct.map((p: any) => (
                <div key={p.product} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-foreground">{p.product}</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(p.outstanding)} ({p.sharePct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.sharePct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 7. DPD & DELINQUENCY */}
      {activeTab === 'delinquency' && delinquencyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="PAR 30 Rate"
              value={`${delinquencyData.par30RatePct}%`}
              hint={formatMoney(delinquencyData.par30Amount)}
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            />
            <KpiCard
              label="PAR 60 Rate"
              value={`${delinquencyData.par60RatePct}%`}
              hint={formatMoney(delinquencyData.par60Amount)}
              icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
            />
            <KpiCard
              label="PAR 90 (NPA) Rate"
              value={`${delinquencyData.par90RatePct}%`}
              hint={formatMoney(delinquencyData.par90Amount)}
              icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
            />
            <KpiCard
              label="Cure Rate (%)"
              value={`${delinquencyData.cureRatePct}%`}
              hint="Delinquent rollback rate"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">DPD Aging Buckets Waterfall</h3>
            <p className="text-xs text-muted-foreground mb-4">Statutory SMA-0, SMA-1, SMA-2 and NPA classifications</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {delinquencyData.buckets.map((b: any) => (
                <div key={b.bucket} className="p-3.5 rounded-lg border border-border bg-card text-center">
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">{b.label}</span>
                  <span className="text-lg font-bold text-foreground block mb-1">{formatMoney(b.outstandingAmount)}</span>
                  <Badge variant="default" className="text-[10px]">
                    {b.loanCount} loans ({b.percentageOfPortfolio}%)
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 8. COLLECTIONS */}
      {activeTab === 'collections' && collectionsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <KpiCard
              label="Collection Efficiency"
              value={`${collectionsData.collectionEfficiencyPct}%`}
              hint="Target vs realized collections"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="PTP Fulfillment"
              value={`${collectionsData.ptpFulfillmentRatePct}%`}
              hint={`${collectionsData.ptpKeptCount} kept / ${collectionsData.ptpCreatedCount} created`}
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
            <KpiCard
              label="Total Recovered"
              value={formatMoney(collectionsData.totalAmountCollected)}
              hint="This reporting period"
              icon={<DollarSign className="h-4 w-4 text-primary" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Collector Performance Scorecard</h3>
            <p className="text-xs text-muted-foreground mb-4">Productivity metrics and recovery conversion per officer</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Collector Name</th>
                    <th className="p-2.5">Assigned Cases</th>
                    <th className="p-2.5">Contacted</th>
                    <th className="p-2.5">PTP Kept</th>
                    <th className="p-2.5">Recovery Amount</th>
                    <th className="p-2.5">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {collectionsData.collectorScorecard.map((c: any) => (
                    <tr key={c.collectorId} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{c.collectorName}</td>
                      <td className="p-2.5">{c.assignedCases}</td>
                      <td className="p-2.5">{c.contactedCount}</td>
                      <td className="p-2.5 font-medium text-emerald-600">{c.keptPtpCount}</td>
                      <td className="p-2.5 font-semibold">{formatMoney(c.recoveryAmount)}</td>
                      <td className="p-2.5">
                        <Badge variant="success" className="text-xs">
                          {c.efficiencyPct}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 9. FINANCE & GL */}
      {activeTab === 'finance' && financeData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <KpiCard
              label="Disbursement Outflow"
              value={formatMoney(financeData.disbursementOutflow)}
              hint="Gross loan drawdowns"
              icon={<DollarSign className="h-4 w-4 text-red-600" />}
            />
            <KpiCard
              label="Repayment Inflow"
              value={formatMoney(financeData.repaymentInflow)}
              hint="Gross customer collections"
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="Interest Income"
              value={formatMoney(financeData.interestIncome)}
              hint="P&L interest revenue"
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
            <KpiCard
              label="Net Cash Movement"
              value={formatMoney(financeData.netCashFlow)}
              hint="Net operating liquidity"
              icon={<Activity className="h-4 w-4 text-primary" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Key General Ledger Balances</h3>
            <p className="text-xs text-muted-foreground mb-4">Management balance sheet snapshot</p>
            <div className="space-y-2">
              {financeData.glBalancesSummary.map((gl: any) => (
                <div key={gl.code} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
                  <div>
                    <span className="font-semibold text-foreground mr-2">{gl.accountName}</span>
                    <Badge variant="default" className="text-[10px]">
                      {gl.accountCategory}
                    </Badge>
                  </div>
                  <span className="font-bold text-foreground">{formatMoney(gl.balance)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 10. PARTNERS */}
      {activeTab === 'partners' && partnerData && (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Partner & Embedded Sourcing Performance</h3>
            <p className="text-xs text-muted-foreground mb-4">Originating distribution channels and commission settlements</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Partner Name</th>
                    <th className="p-2.5">Channel</th>
                    <th className="p-2.5">Sourced</th>
                    <th className="p-2.5">Approval %</th>
                    <th className="p-2.5">Disbursed Volume</th>
                    <th className="p-2.5">PAR 30 %</th>
                    <th className="p-2.5">Commission Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {partnerData.partners.map((p: any) => (
                    <tr key={p.partnerId} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{p.partnerName}</td>
                      <td className="p-2.5 text-muted-foreground">{p.channelType}</td>
                      <td className="p-2.5 font-medium">{p.applicationsSourced}</td>
                      <td className="p-2.5 text-emerald-600 font-medium">{p.approvalRatePct}%</td>
                      <td className="p-2.5 font-bold">{formatMoney(p.disbursedAmount)}</td>
                      <td className="p-2.5 font-medium text-amber-600">{p.par30RatePct}%</td>
                      <td className="p-2.5 font-medium">{formatMoney(p.commissionPaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 11. BRANCHES */}
      {activeTab === 'branches' && branchData && (
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Branch Performance Leaderboard</h3>
            <p className="text-xs text-muted-foreground mb-4">Turnaround time, productivity, and volume comparison across branches</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Branch Name</th>
                    <th className="p-2.5">City</th>
                    <th className="p-2.5">Applications</th>
                    <th className="p-2.5">Approval %</th>
                    <th className="p-2.5">Disbursements</th>
                    <th className="p-2.5">Avg TAT</th>
                    <th className="p-2.5">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {branchData.branches.map((b: any) => (
                    <tr key={b.branchId} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{b.branchName}</td>
                      <td className="p-2.5 text-muted-foreground">{b.city}</td>
                      <td className="p-2.5 font-medium">{b.applications}</td>
                      <td className="p-2.5 text-emerald-600 font-medium">{b.approvalRatePct}%</td>
                      <td className="p-2.5 font-bold">{formatMoney(b.disbursedAmount)}</td>
                      <td className="p-2.5">{b.avgTatHours} hrs</td>
                      <td className="p-2.5">
                        <Badge variant="success">
                          {b.collectionEfficiencyPct}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 12. OPERATIONS SLA */}
      {activeTab === 'operations' && operationsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <KpiCard
              label="Overall SLA Compliance"
              value={`${operationsData.overallSlaCompliancePct}%`}
              hint="Stage-gated workflow compliance"
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              label="Active SLA Breaches"
              value={String(operationsData.totalSlaBreaches)}
              hint="Cases past service threshold"
              icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            />
            <KpiCard
              label="Current Bottleneck"
              value={operationsData.currentBottleneckStage}
              hint={operationsData.nextRecommendedAction}
              icon={<Clock className="h-4 w-4 text-amber-600" />}
            />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-1">Stage Cycle Time & SLA Performance</h3>
            <p className="text-xs text-muted-foreground mb-4">Target vs actual processing durations across stages</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Workflow Stage</th>
                    <th className="p-2.5">Responsible Desk</th>
                    <th className="p-2.5">Target SLA</th>
                    <th className="p-2.5">Avg TAT</th>
                    <th className="p-2.5">Compliance %</th>
                    <th className="p-2.5">Queue Backlog</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {operationsData.stageCycleTimes.map((s: any) => (
                    <tr key={s.stage} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{s.stageName}</td>
                      <td className="p-2.5 text-muted-foreground">{s.responsibleRole}</td>
                      <td className="p-2.5">{s.slaTargetHours} hrs</td>
                      <td className="p-2.5 font-medium">{s.avgTatHours} hrs</td>
                      <td className="p-2.5 font-bold text-emerald-600">{s.slaCompliancePct}%</td>
                      <td className="p-2.5">
                        <Badge variant="default">{s.activeQueueCount} items</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* DRILLDOWN MODAL */}
      {drilldownModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card dark:bg-card border border-border w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div>
                <h3 className="font-semibold text-base text-foreground">{drilldownModal.title}</h3>
                <p className="text-xs text-muted-foreground">Authorized individual record drill-down view</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrilldownModal({ isOpen: false, dimension: 'APPLICATIONS', title: '' })}
              >
                Close
              </Button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {drilldownLoading ? (
                <div className="py-12 flex justify-center">
                  <Spinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold">
                      <tr>
                        {drilldownModal.dimension === 'APPLICATIONS' && (
                          <>
                            <th className="p-2.5">App No</th>
                            <th className="p-2.5">Applicant</th>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5">Requested Amount</th>
                            <th className="p-2.5">Risk Grade</th>
                            <th className="p-2.5">Status</th>
                          </>
                        )}
                        {drilldownModal.dimension === 'LOANS' && (
                          <>
                            <th className="p-2.5">Loan No</th>
                            <th className="p-2.5">Borrower</th>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5">Principal</th>
                            <th className="p-2.5">Outstanding</th>
                            <th className="p-2.5">Status</th>
                          </>
                        )}
                        {drilldownModal.dimension === 'DISBURSEMENTS' && (
                          <>
                            <th className="p-2.5">Ref No</th>
                            <th className="p-2.5">Beneficiary</th>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {drilldownResult?.records?.map((rec: any, idx: number) => (
                        <tr key={rec.id || idx} className="hover:bg-muted/20">
                          {drilldownModal.dimension === 'APPLICATIONS' && (
                            <>
                              <td className="p-2.5 font-mono font-semibold text-primary">{rec.applicationNo}</td>
                              <td className="p-2.5 font-medium">{rec.applicantName}</td>
                              <td className="p-2.5 text-muted-foreground">{rec.product}</td>
                              <td className="p-2.5 font-bold">{formatMoney(rec.requestedAmount)}</td>
                              <td className="p-2.5">
                                <Badge variant="default">{rec.riskGrade}</Badge>
                              </td>
                              <td className="p-2.5">
                                <Badge variant="info">{rec.status}</Badge>
                              </td>
                            </>
                          )}
                          {drilldownModal.dimension === 'LOANS' && (
                            <>
                              <td className="p-2.5 font-mono font-semibold text-primary">{rec.loanNo}</td>
                              <td className="p-2.5 font-medium">{rec.borrower}</td>
                              <td className="p-2.5 text-muted-foreground">{rec.product}</td>
                              <td className="p-2.5">{formatMoney(rec.principal)}</td>
                              <td className="p-2.5 font-bold text-emerald-600">{formatMoney(rec.outstandingPrincipal)}</td>
                              <td className="p-2.5">
                                <Badge variant="success">{rec.status}</Badge>
                              </td>
                            </>
                          )}
                          {drilldownModal.dimension === 'DISBURSEMENTS' && (
                            <>
                              <td className="p-2.5 font-mono font-semibold text-primary">{rec.reference}</td>
                              <td className="p-2.5 font-medium">{rec.borrower}</td>
                              <td className="p-2.5 text-muted-foreground">{rec.product}</td>
                              <td className="p-2.5 font-bold text-emerald-600">{formatMoney(rec.amount)}</td>
                              <td className="p-2.5">{rec.method}</td>
                              <td className="p-2.5">
                                <Badge variant="success">{rec.status}</Badge>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
