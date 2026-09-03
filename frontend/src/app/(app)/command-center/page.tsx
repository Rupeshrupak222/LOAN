'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  FileCheck,
  Ban,
  Check,
  HelpCircle,
  BarChart3,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function CommandCenterPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // NLQ State
  const [nlqInput, setNlqInput] = useState('');
  const [nlqResult, setNlqResult] = useState<any | null>(null);

  // Human Oversight Modal state
  const [actionModalAnomaly, setActionModalAnomaly] = useState<any | null>(null);
  const [actionChoice, setActionChoice] = useState<'INVESTIGATE' | 'RESOLVE' | 'DISMISS'>('INVESTIGATE');
  const [actionNote, setActionNote] = useState('');

  // 1. Fetch Operational Health
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['command-center-health'],
    queryFn: async () => (await api.get('/command-center/health')).data.data,
    refetchInterval: 30000,
  });

  // 2. Fetch Policy Anomalies
  const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery({
    queryKey: ['command-center-anomalies'],
    queryFn: async () => (await api.get('/command-center/anomalies')).data.data,
  });

  // Natural Language Query Mutation
  const nlqMutation = useMutation({
    mutationFn: async (queryText: string) => {
      const res = await api.post('/command-center/query', { query: queryText });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setNlqResult(data);
    },
    onError: (err: any) => {
      alert(`Query failed: ${apiErrorMessage(err)}`);
    },
  });

  // Autonomous Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/command-center/scan');
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['command-center-anomalies'] });
      alert('Autonomous operational policy anomaly scan completed successfully.');
    },
    onError: (err: any) => {
      alert(`Scan failed: ${apiErrorMessage(err)}`);
    },
  });

  // Human Oversight Action Mutation
  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!actionModalAnomaly) return;
      const res = await api.post(`/command-center/anomalies/${actionModalAnomaly.id}/action`, {
        action: actionChoice,
        note: actionNote,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setActionModalAnomaly(null);
      setActionNote('');
      queryClient.invalidateQueries({ queryKey: ['command-center-anomalies'] });
      alert(`Anomaly #${data.id} updated to '${data.status}' with recorded human oversight rationale.`);
    },
    onError: (err: any) => {
      alert(`Action failed: ${apiErrorMessage(err)}`);
    },
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
    }
  };

  const samplePrompts = [
    'What was our disbursement volume this week by branch?',
    'Show me all high-risk loans approved with exceptions.',
    'Which partners have the highest 90-day delinquency rate?',
    'How many reconciliation discrepancies are pending approval?',
    'What is our current portfolio PAR 30 and PAR 90?',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Executive / AI Command Center"
        title="AI Command Center & Operations Monitor"
        subtitle="Real-time operational health telemetry, natural language executive query console, and autonomous policy anomaly governance"
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={scanMutation.isPending}
            onClick={() => scanMutation.mutate()}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {scanMutation.isPending ? 'Scanning Operations...' : 'Run Autonomous Scan'}
          </Button>
        }
      />

      {/* 6-PILLAR OPERATIONAL HEALTH TELEMETRY COCKPIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pillar 1: Originations Velocity */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Originations Velocity
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                health?.originationsVelocity?.velocityStatus === 'SURGING'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {health?.originationsVelocity?.velocityStatus || 'NORMAL'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Pipeline</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.originationsVelocity?.totalApplications || 0} Apps
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">24h Velocity</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                +{health?.originationsVelocity?.submitted24h || 0} Today
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Requested: ₹{Number(health?.originationsVelocity?.totalRequestedAmount || 0).toLocaleString('en-IN')}
          </p>
        </Card>

        {/* Pillar 2: Underwriting Queue */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-emerald-600" /> Underwriting Queue
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                health?.underwritingBottlenecks?.bottleneckRisk === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {health?.underwritingBottlenecks?.bottleneckRisk || 'LOW'} RISK
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Active Review</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.underwritingBottlenecks?.pendingReview || 0} Cases
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Stale &gt; 48 Hours</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.underwritingBottlenecks?.staleOver48h || 0} Bottlenecks
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Average committee decision turnaround: 4.2 hours
          </p>
        </Card>

        {/* Pillar 3: Disbursements Queue */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-teal-600" /> Disbursements Status
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
              {health?.disbursementsQueue?.pendingDisbursements || 0} Pending
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Released</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                ₹{Number(health?.disbursementsQueue?.totalDisbursedVolume || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Active Loans</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.disbursementsQueue?.activeDisbursedLoans || 0} Accounts
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Direct-to-bank electronic release via Integration Hub</p>
        </Card>

        {/* Pillar 4: Portfolio Delinquency */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-purple-600" /> Portfolio Delinquency
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                health?.portfolioDelinquency?.delinquencyRiskTier === 'HIGH'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {health?.portfolioDelinquency?.delinquencyRiskTier || 'LOW'} TIER
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">PAR 30 (30+ DPD)</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.portfolioDelinquency?.par30RatePct || 0}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                ₹{Number(health?.portfolioDelinquency?.par30Amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">PAR 90 (NPA)</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.portfolioDelinquency?.par90RatePct || 0}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                ₹{Number(health?.portfolioDelinquency?.par90Amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Active Principal: ₹{Number(health?.portfolioDelinquency?.totalActivePrincipal || 0).toLocaleString('en-IN')}
          </p>
        </Card>

        {/* Pillar 5: Fraud & Anomaly Signals */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Fraud & Clusters
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              {health?.fraudClusterAlerts?.unresolvedFraudSignals || 0} Signals
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Active Clusters</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.fraudClusterAlerts?.activeClusters || 0} Network
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Peak Risk Score</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.fraudClusterAlerts?.highestRiskScore || 0} / 100
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Deterministic shared attribute and synthetic graph analysis</p>
        </Card>

        {/* Pillar 6: Integration Hub Health */}
        <Card className="p-4 space-y-2 border">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-[#1E2445]">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-blue-600" /> Integration Gateway
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                health?.integrationHealth?.status === 'DEGRADED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
            >
              {health?.integrationHealth?.status || 'OPTIMAL'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Gateway Uptime</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.integrationHealth?.overallUptimePct || 100}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Circuit Breakers</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {health?.integrationHealth?.circuitBreakersTripped || 0} Tripped
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Reconciliation: {health?.reconciliationSummary?.unresolvedExceptions || 0} Exceptions,{' '}
            {health?.reconciliationSummary?.pendingAdjustmentApprovals || 0} Pending Approvals
          </p>
        </Card>
      </div>

      {/* NATURAL LANGUAGE EXECUTIVE QUERY CONSOLE */}
      <Card className="p-5 space-y-4 border">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Executive Natural Language Query Console
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask operational questions in plain English. Powered by Google Gemini and real-time database queries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="e.g. 'What was our disbursement volume this week by branch?'"
              value={nlqInput}
              onChange={(e) => setNlqInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nlqInput.trim()) {
                  nlqMutation.mutate(nlqInput);
                }
              }}
              className="pl-9 text-xs"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={!nlqInput.trim() || nlqMutation.isPending}
            onClick={() => nlqMutation.mutate(nlqInput)}
            className="text-xs cursor-pointer shrink-0"
          >
            {nlqMutation.isPending ? 'Analyzing...' : 'Ask System'}
          </Button>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setNlqInput(p);
                nlqMutation.mutate(p);
              }}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Query Result Card */}
        {nlqResult && (
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900 pb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold">
                Intent: {nlqResult.intent}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Generated: {formatDateTime(nlqResult.generatedAt)}
              </span>
            </div>

            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {nlqResult.answerSummary}
            </div>

            {nlqResult.evidenceTable && nlqResult.evidenceTable.length > 0 && (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                      {Object.keys(nlqResult.evidenceTable[0]).map((col) => (
                        <th key={col} className="pb-1 px-2">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nlqResult.evidenceTable.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                        {Object.values(row).map((val: any, vIdx: number) => (
                          <td key={vIdx} className="py-1.5 px-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            {typeof val === 'number' && val > 1000 ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* AUTONOMOUS POLICY ANOMALY DETECTOR & HUMAN OVERSIGHT QUEUE */}
      <Card className="p-5 space-y-4 border">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Autonomous Policy Anomaly Detector & Human Oversight Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous background operational scanning. Zero automated overrides: all anomalies produce explainable evidence for human review.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {anomaliesLoading ? (
            <div className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading policy anomalies...</p>
            </div>
          ) : anomalies.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Zero Policy Anomalies Detected
              </h4>
              <p className="text-xs text-slate-500">
                Operations, approval limits, and gateway error distributions remain within normal policy parameters.
              </p>
            </div>
          ) : (
            anomalies.map((anom: any) => (
              <Card key={anom.id} className="p-4 space-y-3 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getSeverityBadge(anom.severity))}>
                      {anom.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {anom.patternType}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {anom.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        anom.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : anom.status === 'DISMISSED'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : anom.status === 'INVESTIGATING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {anom.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(anom.detectedAt)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0E1528] border border-slate-100 dark:border-[#1E2445] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Explainable Evidence</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      Entity: <strong>{anom.entityName}</strong> ({anom.entityType})
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {anom.explainableEvidence?.description || JSON.stringify(anom.explainableEvidence)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-1">
                    <span className="text-[10px] font-bold text-blue-500 uppercase block">Recommended Governance Action</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      {anom.recommendedAction}
                    </p>
                    {anom.actionTaken && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pt-1 font-semibold">
                        Actioned by {anom.actionTaken.officerEmail}: &ldquo;{anom.actionTaken.actionNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {anom.status === 'OPEN' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActionModalAnomaly(anom);
                        setActionChoice('DISMISS');
                      }}
                      className="text-xs h-7 px-2 cursor-pointer"
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setActionModalAnomaly(anom);
                        setActionChoice('INVESTIGATE');
                      }}
                      className="text-xs h-7 px-3 cursor-pointer"
                    >
                      Investigate Anomaly
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* HUMAN OVERSIGHT ACTION MODAL */}
      {actionModalAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Human Oversight: Action Policy Anomaly
              </h3>
              <button
                type="button"
                onClick={() => setActionModalAnomaly(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Alert</span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {actionModalAnomaly.title}
                </div>
                <p className="text-[11px] text-slate-500">
                  Entity: {actionModalAnomaly.entityName}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Oversight Decision *
                </label>
                <select
                  value={actionChoice}
                  onChange={(e) => setActionChoice(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                >
                  <option value="INVESTIGATE">Investigate (Open Audit Case)</option>
                  <option value="RESOLVE">Resolve (Remediation Complete)</option>
                  <option value="DISMISS">Dismiss (False Positive / Accepted Risk)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Governance Rationale *
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Record mandatory operational justification for the audit trail..."
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setActionModalAnomaly(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!actionNote.trim() || actionMutation.isPending}
                onClick={() => actionMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {actionMutation.isPending ? 'Recording...' : 'Confirm Oversight Action'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
