'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Flame,
  Scale,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

export default function EarlyWarningsPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAlertForAi, setSelectedAlertForAi] = useState<any | null>(null);
  const [resolveModalAlert, setResolveModalAlert] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [dismissModalAlert, setDismissModalAlert] = useState<any | null>(null);
  const [dismissalReason, setDismissalReason] = useState('');

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['early-warnings-stats'],
    queryFn: async () => (await api.get('/early-warnings/stats')).data.data,
  });

  // Fetch Alerts
  const { data: alerts = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['early-warnings-list', domainFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (domainFilter !== 'ALL') params.set('domain', domainFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await api.get(`/early-warnings?${params.toString()}`);
      return res.data?.data || [];
    },
  });

  // Proactive Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async () => (await api.post('/early-warnings/scan')).data.data,
    onSuccess: (data) => {
      alert(`System scan complete: ${data.scannedEntities} entities evaluated, ${data.alertsCreated} new early warnings identified.`);
      queryClient.invalidateQueries({ queryKey: ['early-warnings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['early-warnings-list'] });
    },
    onError: (err: any) => {
      alert(`System scan failed: ${apiErrorMessage(err)}`);
    },
  });

  // Acknowledge Mutation
  const ackMutation = useMutation({
    mutationFn: async (warningId: string) => (await api.post(`/early-warnings/${warningId}/acknowledge`)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['early-warnings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['early-warnings-list'] });
    },
    onError: (err: any) => {
      alert(`Acknowledge failed: ${apiErrorMessage(err)}`);
    },
  });

  // Resolve Mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ warningId, notes }: { warningId: string; notes: string }) =>
      (await api.post(`/early-warnings/${warningId}/resolve`, { resolutionNotes: notes })).data.data,
    onSuccess: () => {
      setResolveModalAlert(null);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['early-warnings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['early-warnings-list'] });
    },
    onError: (err: any) => {
      alert(`Resolution failed: ${apiErrorMessage(err)}`);
    },
  });

  // Dismiss Mutation
  const dismissMutation = useMutation({
    mutationFn: async ({ warningId, reason }: { warningId: string; reason: string }) =>
      (await api.post(`/early-warnings/${warningId}/dismiss`, { dismissalReason: reason })).data.data,
    onSuccess: () => {
      setDismissModalAlert(null);
      setDismissalReason('');
      queryClient.invalidateQueries({ queryKey: ['early-warnings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['early-warnings-list'] });
    },
    onError: (err: any) => {
      alert(`Dismissal failed: ${apiErrorMessage(err)}`);
    },
  });

  // Filter by search query
  const filteredAlerts = alerts.filter((a: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.customerName && a.customerName.toLowerCase().includes(q)) ||
      (a.customerCode && a.customerCode.toLowerCase().includes(q)) ||
      (a.applicationNo && a.applicationNo.toLowerCase().includes(q)) ||
      (a.loanNo && a.loanNo.toLowerCase().includes(q))
    );
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Risk & Surveillance / Early Warning Center"
        title="Early Warning & Real-Time Event Surveillance"
        subtitle="Proactive multi-domain risk detection across Application SLAs, Inflow Volatility, Credit Delinquency, Fraud Clusters, and Broken PTPs"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={scanMutation.isPending}
              onClick={() => scanMutation.mutate()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', scanMutation.isPending && 'animate-spin')} />
              {scanMutation.isPending ? 'Scanning...' : 'Run Portfolio Scan'}
            </Button>
          </div>
        }
      />

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <KpiCard
          title="Active Warnings"
          value={String(stats?.totalActiveWarnings ?? 0)}
          subtext="Open surveillance alerts"
          icon={<AlertTriangle className="h-5 w-5 text-brand-600" />}
        />
        <KpiCard
          title="Critical Alerts"
          value={String(stats?.criticalCount ?? 0)}
          subtext="Immediate intervention needed"
          icon={<Flame className="h-5 w-5 text-rose-600" />}
        />
        <KpiCard
          title="High Priority"
          value={String(stats?.highCount ?? 0)}
          subtext="Material operational/credit risk"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        />
        <KpiCard
          title="Medium Priority"
          value={String(stats?.mediumCount ?? 0)}
          subtext="Watchlist & liquidity strain"
          icon={<Scale className="h-5 w-5 text-blue-600" />}
        />
        <KpiCard
          title="Resolved"
          value={String(stats?.byStatus?.RESOLVED ?? 0)}
          subtext="Successfully mitigated"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Filter and Control Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Domain Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'All Domains' },
              { id: 'APPLICATION', label: 'Application SLA' },
              { id: 'FINANCIAL', label: 'Financial & Cash Flow' },
              { id: 'CREDIT', label: 'Credit & Delinquency' },
              { id: 'FRAUD', label: 'Fraud & Anomaly' },
              { id: 'COLLECTIONS', label: 'Collections & PTP' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDomainFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                  domainFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="OPEN">Open Alerts</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search alerts by customer name, code, application #, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Alert Feed */}
      {isLoading ? (
        <Card className="p-8 text-center space-y-3">
          <Spinner />
          <p className="text-xs text-slate-400">Loading active surveillance alerts...</p>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <Card className="p-12 text-center space-y-2">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zero Active Early Warnings</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All lending operations, cash-flow thresholds, and delinquency migration indicators are currently operating within normal risk parameters.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert: any) => (
            <Card
              key={alert.warningId}
              className={cn(
                'p-4.5 space-y-3 border transition-all',
                alert.priority === 'CRITICAL' && 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase',
                      getPriorityStyle(alert.priority)
                    )}
                  >
                    {alert.priority}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {alert.domain}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {alert.title}
                  </span>
                  {alert.triggerCount > 1 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Triggered {alert.triggerCount}x
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(alert.detectedAt)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      alert.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : alert.status === 'DISMISSED'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {alert.status}
                  </span>
                </div>
              </div>

              {/* Entity Context Links */}
              <div className="flex items-center gap-3 text-xs flex-wrap font-medium">
                {alert.customerName && (
                  <span className="text-slate-600 dark:text-slate-300">
                    Customer: <strong className="text-slate-900 dark:text-white">{alert.customerName}</strong>{' '}
                    <span className="font-mono text-[11px] text-slate-400">({alert.customerCode})</span>
                  </span>
                )}
                {alert.applicationNo && (
                  <Link
                    href={`/applications/${alert.applicationId}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-mono"
                  >
                    App #{alert.applicationNo} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
                {alert.loanNo && (
                  <Link
                    href={`/loans/${alert.loanId}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-mono"
                  >
                    Loan #{alert.loanNo} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {/* What Happened & Evidence */}
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>What Happened:</strong> {alert.whatHappened}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  <strong>Evidence:</strong> {alert.evidence} (Source: {alert.source})
                </p>
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-200">
                  <strong>Recommended Human Action:</strong> {alert.recommendedHumanAction}
                </div>
                {alert.resolutionNotes && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-[11px] text-emerald-900 dark:text-emerald-200">
                    <strong>Resolution Audit Trail:</strong> {alert.resolutionNotes} (by {alert.resolvedBy})
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedAlertForAi(alert)}
                  className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> AI Advisory
                </Button>

                {alert.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => ackMutation.mutate(alert.warningId)}
                    disabled={ackMutation.isPending}
                    className="text-xs cursor-pointer"
                  >
                    Acknowledge
                  </Button>
                )}

                {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDismissModalAlert(alert)}
                      className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setResolveModalAlert(alert)}
                      className="text-xs cursor-pointer"
                    >
                      Resolve Warning
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: RESOLVE ALERT */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Resolve Early Warning Alert
              </h3>
              <button
                type="button"
                onClick={() => setResolveModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {resolveModalAlert.title}
              </p>
              <p className="text-[11px] text-slate-500">{resolveModalAlert.evidence}</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes * (Mandatory Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail actions taken to mitigate or resolve this operational early warning..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-transparent focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setResolveModalAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={resolutionNotes.trim().length < 5 || resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({
                    warningId: resolveModalAlert.warningId,
                    notes: resolutionNotes,
                  })
                }
                className="text-xs cursor-pointer"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISMISS ALERT */}
      {dismissModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dismiss Early Warning Alert
              </h3>
              <button
                type="button"
                onClick={() => setDismissModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {dismissModalAlert.title}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dismissal Justification * (Mandatory Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={dismissalReason}
                  onChange={(e) => setDismissalReason(e.target.value)}
                  placeholder="Explain why this alert is dismissed (e.g., false positive, verified benign)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-transparent focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setDismissModalAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={dismissalReason.trim().length < 5 || dismissMutation.isPending}
                onClick={() =>
                  dismissMutation.mutate({
                    warningId: dismissModalAlert.warningId,
                    reason: dismissalReason,
                  })
                }
                className="text-xs cursor-pointer text-rose-600"
              >
                {dismissMutation.isPending ? 'Dismissing...' : 'Confirm Dismissal'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AI ADVISORY INVESTIGATION */}
      {selectedAlertForAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Early Warning Advisory Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForAi(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 space-y-1">
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Alert Rule</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedAlertForAi.title}</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{selectedAlertForAi.evidence}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Root Cause Analysis</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedAlertForAi.aiAdvisory?.rootCauseAnalysis || selectedAlertForAi.whyItMatters}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Benign vs Credit Risk Hypotheses</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedAlertForAi.aiAdvisory?.benignVsRiskHypothesis || 'Evaluate whether temporary operational friction or structural default risk exists.'}
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Targeted Investigation Checklist
                </span>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  {(selectedAlertForAi.aiAdvisory?.investigationQuestions || [
                    'Verify direct borrower contactability.',
                    'Inspect recent 3 months primary bank turnover.',
                  ]).map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedAlertForAi(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
