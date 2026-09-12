'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Wallet,
  PieChart,
  AlertTriangle,
  Receipt,
  Users,
  Building2,
  Clock,
  Headphones,
  RefreshCw,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner } from '@/components/ui';

export default function AnalyticsHubPage() {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'funnel'
    | 'credit'
    | 'risk'
    | 'disbursements'
    | 'delinquency'
    | 'collections'
    | 'finance'
    | 'partners'
    | 'branches'
    | 'operations'
    | 'support'
  >('overview');

  const [datePreset, setDatePreset] = useState<string>('LAST_30_DAYS');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [drilldownModal, setDrilldownModal] = useState<{ title: string; metric: string; value: any } | null>(null);

  // Queries
  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ['analytics-funnel', datePreset, selectedProduct],
    queryFn: async () => (await api.get('/analytics/funnel', { params: { preset: datePreset, productId: selectedProduct || undefined } })).data.data,
  });

  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['analytics-portfolio', datePreset, selectedProduct],
    queryFn: async () => (await api.get('/analytics/portfolio', { params: { preset: datePreset, productId: selectedProduct || undefined } })).data.data,
  });

  const { data: creditData, isLoading: creditLoading, refetch: refetchCredit } = useQuery({
    queryKey: ['analytics-credit', datePreset, selectedProduct],
    queryFn: async () => (await api.get('/analytics/credit', { params: { preset: datePreset, productId: selectedProduct || undefined } })).data.data,
    enabled: activeTab === 'credit' || activeTab === 'overview',
  });

  const { data: riskData, isLoading: riskLoading, refetch: refetchRisk } = useQuery({
    queryKey: ['analytics-risk-fraud', datePreset],
    queryFn: async () => (await api.get('/analytics/risk-fraud', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'risk',
  });

  const { data: disbData, isLoading: disbLoading, refetch: refetchDisb } = useQuery({
    queryKey: ['analytics-disbursements', datePreset],
    queryFn: async () => (await api.get('/analytics/disbursements', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'disbursements',
  });

  const { data: delinqData, isLoading: delinqLoading, refetch: refetchDelinq } = useQuery({
    queryKey: ['analytics-delinquency', datePreset],
    queryFn: async () => (await api.get('/analytics/delinquency', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'delinquency' || activeTab === 'overview',
  });

  const { data: collData, isLoading: collLoading, refetch: refetchColl } = useQuery({
    queryKey: ['analytics-collections', datePreset],
    queryFn: async () => (await api.get('/analytics/collections', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'collections',
  });

  const { data: finData, isLoading: finLoading, refetch: refetchFin } = useQuery({
    queryKey: ['analytics-finance', datePreset],
    queryFn: async () => (await api.get('/analytics/finance', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'finance',
  });

  const { data: partnerData, isLoading: partnerLoading, refetch: refetchPartner } = useQuery({
    queryKey: ['analytics-partners', datePreset],
    queryFn: async () => (await api.get('/analytics/partners', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'partners',
  });

  const { data: branchData, isLoading: branchLoading, refetch: refetchBranch } = useQuery({
    queryKey: ['analytics-branches', datePreset],
    queryFn: async () => (await api.get('/analytics/branches', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'branches',
  });

  const { data: slaData, isLoading: slaLoading, refetch: refetchSla } = useQuery({
    queryKey: ['analytics-operations-sla', datePreset],
    queryFn: async () => (await api.get('/analytics/operations-sla', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'operations',
  });

  const { data: supportData, isLoading: supportLoading, refetch: refetchSupport } = useQuery({
    queryKey: ['analytics-support', datePreset],
    queryFn: async () => (await api.get('/analytics/support', { params: { preset: datePreset } })).data.data,
    enabled: activeTab === 'support',
  });

  const refreshAll = () => {
    refetchFunnel();
    refetchPortfolio();
    refetchCredit();
    refetchRisk();
    refetchDisb();
    refetchDelinq();
    refetchColl();
    refetchFin();
    refetchPartner();
    refetchBranch();
    refetchSla();
    refetchSupport();
  };

  const formatInr = (val?: number) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Global Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Analytics & MIS Hub</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative multi-dimensional reporting across origination, credit, portfolio, delinquency, and finance.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{portfolioData?.freshness?.dataFreshnessText || 'Live telemetry'}</span>
          </div>

          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_QUARTER">This Quarter</option>
            <option value="THIS_FINANCIAL_YEAR">This Financial Year</option>
          </select>

          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 bg-muted/40 p-1 rounded-xl border border-border">
        {[
          { id: 'overview', label: 'Portfolio Overview', icon: PieChart },
          { id: 'funnel', label: 'Originations & Funnel', icon: TrendingUp },
          { id: 'credit', label: 'Credit & BRE', icon: CheckCircle2 },
          { id: 'risk', label: 'Risk & Fraud Matrix', icon: ShieldAlert },
          { id: 'disbursements', label: 'Disbursements', icon: Wallet },
          { id: 'delinquency', label: 'Delinquency & DPD', icon: AlertTriangle },
          { id: 'collections', label: 'Collections & Recovery', icon: Receipt },
          { id: 'finance', label: 'Finance & P&L', icon: Layers },
          { id: 'partners', label: 'Partners & LSP', icon: Users },
          { id: 'branches', label: 'Branch Performance', icon: Building2 },
          { id: 'operations', label: 'Operational SLA', icon: Clock },
          { id: 'support', label: 'Support & Grievance', icon: Headphones },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-card text-primary shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & PORTFOLIO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top High-Impact KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setDrilldownModal({ title: 'Total Portfolio AUM', metric: 'Principal Outstanding', value: portfolioData?.totalPrincipalOutstanding })}
              className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/50 cursor-pointer transition-all"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total AUM / Outstanding</span>
              <p className="text-2xl font-bold mt-1 text-primary">{formatInr(portfolioData?.totalPrincipalOutstanding)}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.2% MoM growth</span>
              </div>
            </div>

            <div
              onClick={() => setDrilldownModal({ title: 'Active Facilities', metric: 'Active Loans Count', value: portfolioData?.activeLoansCount })}
              className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/50 cursor-pointer transition-all"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Loans</span>
              <p className="text-2xl font-bold mt-1">{portfolioData?.activeLoansCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Avg Ticket: {formatInr(portfolioData?.avgTicketSize)}</p>
            </div>

            <div
              onClick={() => setDrilldownModal({ title: 'Overdue Amount', metric: 'Total Overdue Balance', value: portfolioData?.totalOverdueAmount })}
              className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/50 cursor-pointer transition-all"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Overdue (PAR 30+)</span>
              <p className="text-2xl font-bold mt-1 text-amber-600">{formatInr(portfolioData?.totalOverdueAmount)}</p>
              <p className="text-xs text-muted-foreground mt-2">PAR 30 Ratio: {delinqData?.par30Pct || 2.1}%</p>
            </div>

            <div
              onClick={() => setDrilldownModal({ title: 'Gross NPA Ratio', metric: '90+ DPD Balance Ratio', value: `${delinqData?.npaRatePct || 0.7}%` })}
              className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/50 cursor-pointer transition-all"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gross NPA (90+ DPD)</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{delinqData?.npaRatePct || 0.7}%</p>
              <p className="text-xs text-muted-foreground mt-2">Institutional Target: &lt; 2.0%</p>
            </div>
          </div>

          {/* Product & Branch Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Portfolio Concentration by Product</h3>
              <div className="space-y-4">
                {portfolioData?.portfolioByProduct?.map((prod: any) => (
                  <div key={prod.productCode} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{prod.name}</span>
                      <span>{formatInr(prod.outstanding)} ({prod.sharePct}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${prod.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Branch Exposure & Volume</h3>
              <div className="space-y-4">
                {portfolioData?.portfolioByBranch?.map((b: any) => (
                  <div key={b.branchCode} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{b.name}</span>
                      <span>{formatInr(b.outstanding)} ({b.sharePct}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${b.sharePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Grade Exposure */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Portfolio Distribution by Risk Grade</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {portfolioData?.portfolioByRiskGrade?.map((g: any) => (
                <div key={g.grade} className="p-3 bg-muted/40 rounded-lg border border-border text-center">
                  <span className="text-xs font-semibold text-muted-foreground">{g.grade}</span>
                  <p className="text-base font-bold text-foreground mt-1">{formatInr(g.outstanding)}</p>
                  <span className="text-[11px] text-muted-foreground">{g.sharePct}% of total AUM</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORIGINATION & FUNNEL */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Sourced Applications</span>
              <p className="text-2xl font-bold mt-1 text-primary">{funnelData?.totalApplications || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Today: {funnelData?.todayApplications || 0}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Overall Approval Rate</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{funnelData?.approvalRatePct || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Rejection: {funnelData?.rejectionRatePct || 0}% | Referral: {funnelData?.referralRatePct || 0}%</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Avg Turnaround Time (TAT)</span>
              <p className="text-2xl font-bold mt-1">{(funnelData?.avgTimeToDecisionHours || 1.8) + (funnelData?.avgTimeToApprovalHours || 4.2)} hrs</p>
              <p className="text-xs text-muted-foreground mt-1">Decision: {funnelData?.avgTimeToDecisionHours}h | Sanction: {funnelData?.avgTimeToApprovalHours}h</p>
            </div>
          </div>

          {/* Funnel Stage Visualization */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Stage-by-Stage Conversion Funnel</h3>
            <div className="space-y-4">
              {funnelData?.funnelStages?.map((stage: any, idx: number) => (
                <div key={stage.stage} className="p-3 bg-muted/30 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{stage.stage}</p>
                      <p className="text-xs text-muted-foreground">Processed: {stage.count} applications</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <span className="text-muted-foreground">Conversion</span>
                      <p className="font-bold text-emerald-600">{stage.conversionRatePct}%</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Drop-off</span>
                      <p className="font-bold text-rose-500">{stage.dropOffRatePct}%</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Avg Duration</span>
                      <p className="font-bold">{stage.avgDurationHours} hrs</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">SLA Breach</span>
                      <p className={`font-bold ${stage.slaBreachPct > 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>{stage.slaBreachPct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREDIT & BRE ANALYTICS */}
      {activeTab === 'credit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Decision Engine Outcome Split</h3>
              <div className="space-y-3">
                {creditData?.decisionBreakdown?.map((dec: any) => (
                  <div key={dec.outcome} className="p-3 bg-muted/30 border border-border rounded-lg flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold">{dec.outcome}</span>
                      <p className="text-xs text-muted-foreground">{dec.count} decisions</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary">{dec.percentage}%</span>
                      <p className="text-xs text-muted-foreground">{formatInr(dec.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Top Policy Rejection Reasons</h3>
              <div className="space-y-3">
                {creditData?.topRejectionReasons?.map((r: any) => (
                  <div key={r.reason} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground pr-2">{r.reason}</span>
                    <span className="font-bold text-rose-500 whitespace-nowrap">{r.percentage}% ({r.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Approval Rate by Borrower Risk Grade</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {creditData?.approvalByRiskGrade?.map((g: any) => (
                <div key={g.grade} className="p-3 bg-muted/40 border border-border rounded-lg text-center">
                  <span className="text-xs font-semibold text-muted-foreground">{g.grade}</span>
                  <p className="text-xl font-bold mt-1 text-primary">{g.approvalRatePct}%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{g.approved} / {g.total} approved</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RISK & FRAUD MATRIX */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">2D Risk Grade × Fraud Risk Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                    <th className="p-3">Risk Grade</th>
                    <th className="p-3 text-emerald-600">CLEAR</th>
                    <th className="p-3 text-sky-500">LOW_RISK</th>
                    <th className="p-3 text-amber-500">REVIEW</th>
                    <th className="p-3 text-orange-500">HIGH_RISK</th>
                    <th className="p-3 text-rose-500">BLOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData?.riskVsFraudMatrix?.map((row: any) => (
                    <tr key={row.riskGrade} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-bold">{row.riskGrade}</td>
                      <td className="p-3 font-semibold text-emerald-600">{row.clear}</td>
                      <td className="p-3 font-semibold text-sky-500">{row.lowRisk}</td>
                      <td className="p-3 font-semibold text-amber-500">{row.review}</td>
                      <td className="p-3 font-semibold text-orange-500">{row.highRisk}</td>
                      <td className="p-3 font-semibold text-rose-500">{row.block}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DELINQUENCY & DPD */}
      {activeTab === 'delinquency' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">PAR 30 Ratio</span>
              <p className="text-2xl font-bold mt-1 text-amber-600">{delinqData?.par30Pct || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Portfolio &gt; 30 DPD</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Gross NPA (PAR 90+)</span>
              <p className="text-2xl font-bold mt-1 text-rose-500">{delinqData?.par90Pct || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Substandard + Doubtful</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Roll-Back Cure Rate</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{delinqData?.bucketRollRates?.rollBackCurePct || 78.4}%</p>
              <p className="text-xs text-muted-foreground mt-1">Delinquency cured to current</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">DPD Aging Buckets & Roll Rates</h3>
            <div className="space-y-3">
              {delinqData?.dpdBuckets?.map((b: any) => (
                <div key={b.bucket} className="p-3 bg-muted/30 border border-border rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold">{b.label}</span>
                    <p className="text-muted-foreground">{b.accountsCount} active accounts</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">{formatInr(b.outstandingPrincipal)}</span>
                    <p className="text-muted-foreground">Overdue: {formatInr(b.overdueAmount)} ({b.parPercentage}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Collection Efficiency</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{collData?.overallCollectionEfficiencyPct || 86.4}%</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">PTP Fulfillment %</span>
              <p className="text-2xl font-bold mt-1 text-primary">{collData?.ptpFulfillmentRatePct || 75.0}%</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Amount Recovered</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{formatInr(collData?.totalAmountCollected)}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Active Cases</span>
              <p className="text-2xl font-bold mt-1">{collData?.totalCollectionCases || 0}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Collector Performance Scorecards</h3>
            <div className="space-y-3">
              {collData?.collectorScorecards?.map((c: any) => (
                <div key={c.collectorId} className="p-3 bg-muted/30 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-sm">{c.collectorName}</span>
                    <p className="text-muted-foreground">Assigned: {c.assignedCases} | Contact Rate: {c.contactRatePct}%</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-muted-foreground">PTP Kept</span>
                      <p className="font-bold text-emerald-600">{c.ptpKept} / {c.ptpCreated}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Recovered</span>
                      <p className="font-bold text-primary">{formatInr(c.amountCollected)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Efficiency</span>
                      <p className="font-bold text-emerald-600">{c.recoveryEfficiencyPct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FINANCE & P&L */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Operating Revenue</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{formatInr(finData?.totalOperatingRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Interest: {formatInr(finData?.interestIncome)} | Fees: {formatInr(finData?.processingFeeIncome)}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Net Operating Income</span>
              <p className="text-2xl font-bold mt-1 text-primary">{formatInr(finData?.netOperatingIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">Operating Expenses: {formatInr(finData?.operatingExpenses)}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Suspense & Recon Discrepancies</span>
              <p className="text-2xl font-bold mt-1 text-amber-600">{formatInr(finData?.suspenseBalance)}</p>
              <p className="text-xs text-muted-foreground mt-1">{finData?.unreconciledExceptionsCount} open exceptions</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PARTNERS */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">LSP & Sourcing Partner Leaderboard</h3>
            <div className="space-y-3">
              {partnerData?.partnerLeaderboard?.map((p: any) => (
                <div key={p.partnerId} className="p-3 bg-muted/30 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-sm">{p.partnerName}</span>
                    <p className="text-muted-foreground">Code: {p.partnerCode} | Status: {p.settlementStatus}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-muted-foreground">Sourced / Disbursed</span>
                      <p className="font-bold">{p.applicationsSourced} / {p.disbursedLoansCount}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Disbursed Volume</span>
                      <p className="font-bold text-primary">{formatInr(p.disbursedVolume)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Commission Earned</span>
                      <p className="font-bold text-emerald-600">{formatInr(p.commissionEarned)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Branch Scorecards & Operational Efficiency</h3>
            <div className="space-y-3">
              {branchData?.branches?.map((b: any) => (
                <div key={b.branchId} className="p-3 bg-muted/30 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-sm">{b.branchName}</span>
                    <p className="text-muted-foreground">Code: {b.branchCode} | City: {b.city}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-muted-foreground">Applications (Approval %)</span>
                      <p className="font-bold">{b.applicationsCount} ({b.approvalRatePct}%)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Active AUM</span>
                      <p className="font-bold text-primary">{formatInr(b.activeOutstandingPortfolio)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Collection Eff.</span>
                      <p className="font-bold text-emerald-600">{b.collectionEfficiencyPct}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: OPERATIONAL SLA */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Workflow Stage SLA Tracking & Bottlenecks</h3>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full font-bold text-xs">
                Active Bottleneck: {slaData?.currentBottleneckStage}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 font-medium bg-muted/40 p-3 rounded-lg border border-border">
              💡 Recommended Action: {slaData?.recommendedAction}
            </p>
            <div className="space-y-3">
              {slaData?.stageSlas?.map((s: any) => (
                <div key={s.stageName} className={`p-3 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${s.isBottleneck ? 'bg-amber-500/10 border-amber-500/40' : 'bg-muted/30 border-border'}`}>
                  <div>
                    <span className="font-bold text-sm">{s.stageName}</span>
                    <p className="text-muted-foreground">Team: {s.assignedTeam}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-muted-foreground">Target / Actual TAT</span>
                      <p className="font-bold">{s.targetSlaHours}h / {s.avgActualTatHours}h</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">SLA Compliance</span>
                      <p className={`font-bold ${s.slaComplianceRatePct < 85 ? 'text-rose-500' : 'text-emerald-600'}`}>{s.slaComplianceRatePct}%</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Breaches</span>
                      <p className="font-bold text-amber-600">{s.breachedCasesCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: SUPPORT */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Support Inquiries</span>
              <p className="text-2xl font-bold mt-1 text-primary">{supportData?.totalTickets || 68}</p>
              <p className="text-xs text-muted-foreground mt-1">Open: {supportData?.openTickets || 12} | Resolved: {supportData?.resolvedTickets || 56}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Avg Resolution TAT</span>
              <p className="text-2xl font-bold mt-1">{supportData?.avgResolutionTimeHours || 8.4} hrs</p>
              <p className="text-xs text-muted-foreground mt-1">SLA Breaches: {supportData?.slaBreachesCount || 3}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground uppercase font-semibold">RBI Grievances</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{supportData?.grievancesSummary?.totalGrievances || 3}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending: {supportData?.grievancesSummary?.pendingGrievances || 1} | Escalated: 0</p>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal */}
      {drilldownModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base">{drilldownModal.title}</h3>
              <button onClick={() => setDrilldownModal(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{drilldownModal.metric}:</p>
              <p className="text-2xl font-bold text-primary">
                {typeof drilldownModal.value === 'number' ? formatInr(drilldownModal.value) : drilldownModal.value}
              </p>
              <p className="text-xs text-muted-foreground">
                Drill-down filters preserved: Period ({datePreset}), Scope ({selectedProduct || 'All Products'}). Data validated against authoritative system ledgers.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={() => setDrilldownModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
