'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Users,
  CreditCard,
  Building,
  FileText,
  Activity,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  Landmark,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge } from '@/components/ui';
import {
  FraudIntelligenceData,
  FraudSignalItem,
  NetworkClusterItem,
} from '@/components/FraudIntelligenceCard';

export default function FraudIntelligencePage() {
  const { isDark } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<FraudIntelligenceData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (forceRefresh: boolean = false) => {
      const res = await api.post('/ai/fraud/portfolio', { forceRefresh });
      return res.data?.data as FraudIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
      toast.success('Portfolio Scan Complete', 'AI Fraud Intelligence evaluated portfolio risk.');
    },
    onError: (err: any) => {
      toast.error('Fraud Intelligence Error', apiErrorMessage(err));
    },
  });

  const filteredSignals = (data?.signals || []).filter((s) => {
    if (selectedSeverity !== 'ALL' && s.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchSummary = s.summary.toLowerCase().includes(q);
      const matchEvidence = s.evidence.some((e) => e.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchEvidence) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Insights / Fraud & Anomaly Intelligence"
        title="Fraud & Anomaly Intelligence Console"
        subtitle="Deterministic signal detection & Centralized Gemini synthesis across borrowers, applications, disbursements, and branch activity"
        action={
          <div className="flex items-center gap-2">
            {!data ? (
              <Button
                variant="primary"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className={cn('h-3.5 w-3.5', mutation.isPending && 'animate-spin')} />
                {mutation.isPending ? 'Scanning Entire Portfolio...' : 'Run Portfolio Anomaly Scan'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(true)}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', mutation.isPending && 'animate-spin')} />
                {mutation.isPending ? 'Re-analyzing...' : 'Refresh Analysis'}
              </Button>
            )}
          </div>
        }
      />

      {/* Empty State / Prompt to Run Analysis */}
      {!data && !mutation.isPending && (
        <Card className="p-8 text-center space-y-4 border-2 border-dashed border-slate-200 dark:border-[#1E2445]">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Fraud Analysis Generated Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              In accordance with LMS performance and governance principles, AI fraud scans are not
              automatically triggered on page load. Click the button below to initiate a deterministic
              scan and AI relationship analysis.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => mutation.mutate(false)}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md mx-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Run Portfolio Anomaly Scan
          </Button>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto text-left text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#1E2445]/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" /> Duplicate Attributes
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Detects shared mobile numbers, emails, addresses, and multi-borrower bank accounts.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#1E2445]/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-purple-500" /> Network Clustering
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Identifies coordinated borrowing syndicates and shared physical address hubs.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#1E2445]/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Human in the Loop
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Explainable decision support without autonomous account freezing or credit alteration.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {mutation.isPending && (
        <Card className="p-12 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Scanning Authoritative LMS Data & Running Gemini Synthesis...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Inspecting cross-customer duplicate attributes, disbursement bank records, repayment
            patterns, and operational turnaround latencies.
          </p>
        </Card>
      )}

      {/* Main Analysis Dashboard */}
      {data && !mutation.isPending && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Investigation Priority"
              value={data.investigationPriority || 'Routine'}
              hint="Overall AI Risk Posture"
              icon={ShieldAlert}
              trend={data.investigationPriority === 'Critical' ? 'Urgent Action' : 'Monitored'}
              trendPositive={data.investigationPriority === 'Low' || data.investigationPriority === 'Review Required'}
            />
            <KpiCard
              title="Critical Red Flags"
              value={String(data.criticalCount ?? 0)}
              hint="Multi-borrower accounts & contact pools"
              icon={AlertTriangle}
            />
            <KpiCard
              title="High Priority Signals"
              value={String(data.highCount ?? 0)}
              hint="Velocity spikes & recycled documents"
              icon={Activity}
            />
            <KpiCard
              title="Network Clusters"
              value={String(data.networkClusters?.length || 0)}
              hint="Shared entity relationship chains"
              icon={Layers}
            />
          </div>

          {/* AI Executive Synthesis & Investigation Briefing */}
          <Card className="p-5 space-y-4 border-2 border-rose-500/20 dark:border-rose-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#1E2445] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Investigation Briefing & Executive Summary
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Model: {data.model || 'Gemini 2.5'}</span>
                <span>•</span>
                <span>Data As Of: {data.dataAsOf ? new Date(data.dataAsOf).toLocaleTimeString() : 'Current Session'}</span>
                {data.isCached && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                    CACHED
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {data.summary || data.executiveSummary}
            </p>

            {/* Recommended Human Actions & Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recommended Human Verification Steps:
                </p>
                <ul className="space-y-1.5">
                  {(data.recommendedInvestigations || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-none mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Information Gaps Requiring Investigation:
                </p>
                <ul className="space-y-1.5">
                  {(data.dataGaps || []).map((gap: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-500 flex-none mt-0.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Relational Network Clusters */}
          {data.networkClusters && data.networkClusters.length > 0 && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Relational Network Clusters ({data.networkClusters.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Detected multi-borrower connection hubs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.networkClusters.map((cluster) => (
                  <div
                    key={cluster.clusterId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/60 dark:bg-[#1E2445]/30 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {cluster.pivotType.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cluster.pivotValue}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          cluster.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        )}
                      >
                        {cluster.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {cluster.description}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Linked Borrowers:</span>
                      {cluster.customerNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Signals Explorer */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detected Signals Explorer ({filteredSignals.length} of {data.signals.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Filter by severity, category, or search authoritative evidence
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search signals, evidence, mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/70 dark:bg-[#1E2445]/60 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Severity:</span>
              {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                    selectedSeverity === sev
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
                  )}
                >
                  {sev}
                </button>
              ))}

              <span className="text-[11px] font-semibold text-slate-400 ml-3">Category:</span>
              {[
                { id: 'ALL', label: 'All Categories' },
                { id: 'CUSTOMER', label: 'Customer / Identity' },
                { id: 'RELATIONSHIP_NETWORK', label: 'Relationship' },
                { id: 'APPLICATION', label: 'Application' },
                { id: 'DOCUMENT', label: 'KYC / Documents' },
                { id: 'BANK_DISBURSEMENT', label: 'Bank & Payout' },
                { id: 'REPAYMENT_COLLECTION', label: 'Repayment' },
                { id: 'EMPLOYEE_BRANCH', label: 'Operational' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filtered Signals Table / List */}
            <div className="space-y-3 pt-2">
              {filteredSignals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No signals match your filter criteria.
                </div>
              ) : (
                filteredSignals.map((signal) => {
                  const isExpanded = expandedSignalId === signal.signalId;
                  const badgeColor =
                    signal.severity === 'Critical'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      : signal.severity === 'High'
                      ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800'
                      : signal.severity === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

                  return (
                    <div
                      key={signal.signalId}
                      className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-[#060F1B] space-y-2.5 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedSignalId(isExpanded ? null : signal.signalId)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                                badgeColor
                              )}
                            >
                              {signal.severity}
                            </span>
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              {signal.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">•</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Target: {signal.entityType} ({signal.entityId.slice(0, 8)}...)
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {signal.title}
                            </h4>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {signal.summary}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex-none"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Accordion Expansion */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 dark:border-[#1E2445] space-y-3">
                          {/* Factual Evidence */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Authoritative LMS Evidence:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-200 font-mono text-[11px]">
                              {signal.evidence.map((ev, idx) => (
                                <li key={idx}>{ev}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Related Entities */}
                          {signal.relatedEntities && signal.relatedEntities.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Related Entities:
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {signal.relatedEntities.map((ent, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  >
                                    {ent.entityType}: {ent.label} ({ent.relationship})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1E2445]/40 border border-slate-200/80 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                              Operational Impact:
                            </p>
                            <p className="text-slate-700 dark:text-slate-200 text-xs">
                              {signal.impact}
                            </p>
                          </div>

                          {/* Hypotheses & Human Investigation Actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
                                Hypotheses (Potential Explanations):
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-amber-900 dark:text-amber-200 text-[11px]">
                                {(signal.possibleExplanations || []).map((exp, idx) => (
                                  <li key={idx}>{exp}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                                Recommended Action by Officer:
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-emerald-900 dark:text-emerald-200 text-[11px]">
                                {(signal.recommendedInvestigation || []).map((act, idx) => (
                                  <li key={idx}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
