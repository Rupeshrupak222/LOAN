'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
  Search,
  Scale,
  DollarSign,
  Building,
  UserCheck,
  AlertOctagon,
  History,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Spinner } from './ui';

interface AdvancedDecisionIntelligenceCardProps {
  applicationId: string;
  applicationNo: string;
}

export function AdvancedDecisionIntelligenceCard({
  applicationId,
  applicationNo,
}: AdvancedDecisionIntelligenceCardProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'FACTORS' | 'CONFLICTS' | 'QUESTIONS' | 'CHANGES'>('SUMMARY');
  const [factorFilter, setFactorFilter] = useState<'ALL' | 'POSITIVE' | 'ATTENTION' | 'HIGH_RISK' | 'BLOCKING'>('ALL');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['decision-intelligence', applicationId],
    queryFn: async () => {
      const res = await api.get(`/decision-intelligence/applications/${applicationId}`);
      return res.data?.data;
    },
    enabled: Boolean(applicationId),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/decision-intelligence/applications/${applicationId}/refresh`);
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success('Decision Intelligence refreshed.');
      refetch();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Decision Intelligence Notice' });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Spinner />
          <p className="text-xs text-slate-500 font-medium">Aggregating Holistic Decision Intelligence...</p>
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-5 border border-slate-200 dark:border-[#1E2445]">
        <div className="text-center py-4 space-y-2">
          <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Decision Intelligence Not Available
          </p>
          <p className="text-[11px] text-slate-500">{apiErrorMessage(error)}</p>
          <Button size="sm" variant="secondary" onClick={() => refetch()} className="text-xs">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const { context, readinessState, readinessReason, reviewPriority, factors, conflicts, changesDetected, narrative } = data;

  const positiveFactors = factors.filter((f: any) => f.status === 'POSITIVE');
  const attentionFactors = factors.filter((f: any) => f.status === 'ATTENTION' || f.status === 'HIGH_RISK');
  const blockingFactors = factors.filter((f: any) => f.status === 'BLOCKING');

  const filteredFactors = factors.filter((f: any) => {
    if (factorFilter === 'ALL') return true;
    return f.status === factorFilter;
  });

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200';
    }
  };

  const getReadinessBadgeStyle = (state: string) => {
    switch (state) {
      case 'READY_FOR_REVIEW':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'HIGH_RISK_REVIEW':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      case 'BLOCKED_BY_EXISTING_POLICY':
        return 'bg-rose-600/10 text-rose-700 border-rose-600/40';
      case 'POLICY_EXCEPTION_REQUIRES_REVIEW':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'MORE_INFORMATION_REQUIRED':
        return 'bg-sky-500/10 text-sky-600 border-sky-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/30';
    }
  };

  return (
    <Card className="p-5 space-y-5 border-2 border-brand-500/20 dark:border-blue-500/30 shadow-sm relative overflow-hidden bg-gradient-to-b from-blue-50/20 via-transparent to-transparent dark:from-blue-950/10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Advanced Decision Intelligence Cockpit
              </h3>
              <span
                className={cn(
                  'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider',
                  getReadinessBadgeStyle(readinessState)
                )}
              >
                {readinessState.replace(/_/g, ' ')}
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold px-2 py-0.5 rounded-full border',
                  getPriorityBadgeStyle(reviewPriority)
                )}
              >
                {reviewPriority} Priority
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Holistic synthesis across Identity, Financials, Credit, Risk, Underwriting, Bank Turnover, and Anomalies
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={refreshMutation.isPending || isFetching}
            onClick={() => refreshMutation.mutate()}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', (refreshMutation.isPending || isFetching) && 'animate-spin')} />
            {refreshMutation.isPending ? 'Re-Evaluating...' : 'Refresh Intelligence'}
          </Button>
        </div>
      </div>

      {/* Decision Readiness Explanation Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
        <Scale className="h-5 w-5 text-brand-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">Underwriting Adjudication Readiness Assessment</p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{readinessReason}</p>
        </div>
      </div>

      {/* Critical Conflict Banner if present */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-none" />
            <span>{conflicts.length} Data Conflict(s) Identified Across Sources</span>
          </div>
          <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            {narrative.conflictsExplanation}
          </p>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-[#1E2445] pb-2 text-xs flex-wrap">
        {[
          { id: 'SUMMARY', label: 'Executive Briefing' },
          { id: 'FACTORS', label: `Decision Factors (${factors.length})` },
          { id: 'CONFLICTS', label: `Data Conflicts (${conflicts.length})` },
          { id: 'QUESTIONS', label: `Underwriter Checklist (${narrative.humanInvestigationQuestions.length})` },
          { id: 'CHANGES', label: `Changes / Audit (${changesDetected.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-3 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE BRIEFING */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-4 text-xs">
          {/* Executive Summary Narrative */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-[#1E2445]/40 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>AI Advisory Executive Synthesis</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              {narrative.executiveSummary}
            </p>
          </div>

          {/* 2-Column Positive vs Attention Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Positive Factors */}
            <div className="p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-none" />
                <span>Primary Factual Strengths ({positiveFactors.length})</span>
              </div>
              <ul className="space-y-2">
                {positiveFactors.map((f: any) => (
                  <li key={f.factorId} className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{f.title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{f.evidence}</p>
                    <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 uppercase font-semibold">
                      Source: {f.source}
                    </span>
                  </li>
                ))}
                {positiveFactors.length === 0 && (
                  <li className="text-slate-400 italic">No positive factors verified yet.</li>
                )}
              </ul>
            </div>

            {/* Attention / Risk Factors */}
            <div className="p-4 rounded-xl border border-rose-200/70 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/10 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-none" />
                <span>Attention & Risk Vulnerabilities ({attentionFactors.length})</span>
              </div>
              <ul className="space-y-2">
                {attentionFactors.map((f: any) => (
                  <li key={f.factorId} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{f.title}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{f.evidence}</p>
                    <span className="text-[9px] font-mono text-rose-700 dark:text-rose-400 uppercase font-semibold">
                      Source: {f.source}
                    </span>
                  </li>
                ))}
                {attentionFactors.length === 0 && (
                  <li className="text-slate-400 italic">Zero attention or high risk factors identified.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DECISION FACTORS */}
      {activeTab === 'FACTORS' && (
        <div className="space-y-3.5 text-xs">
          {/* Factor Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'POSITIVE', 'ATTENTION', 'HIGH_RISK', 'BLOCKING'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFactorFilter(filter)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer',
                  factorFilter === filter
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-[#1E2445]/40 dark:text-slate-400 dark:border-slate-800'
                )}
              >
                {filter} ({filter === 'ALL' ? factors.length : factors.filter((f: any) => f.status === filter).length})
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredFactors.map((f: any) => (
              <div
                key={f.factorId}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-[#1E2445]/20 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        f.status === 'POSITIVE'
                          ? 'bg-emerald-500'
                          : f.status === 'BLOCKING'
                          ? 'bg-rose-600 ring-2 ring-rose-300'
                          : f.status === 'HIGH_RISK'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      )}
                    />
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{f.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400">[{f.category}]</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Impact: {f.impact}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        f.status === 'POSITIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : f.status === 'BLOCKING'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {f.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{f.evidence}</p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>Authoritative Provenance: <strong className="text-slate-600 dark:text-slate-300">{f.source}</strong></span>
                  <span>Confidence: <strong className="text-slate-600 dark:text-slate-300">{f.confidence}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATA CONFLICTS */}
      {activeTab === 'CONFLICTS' && (
        <div className="space-y-3 text-xs">
          {conflicts.map((c: any) => (
            <div
              key={c.conflictId}
              className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-amber-600 flex-none" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.title}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                  {c.severity} Severity
                </span>
              </div>

              {/* Factual comparison box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white/80 dark:bg-black/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Source A: {c.sourceA.module}</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {c.sourceA.field}: {typeof c.sourceA.value === 'number' ? `₹${c.sourceA.value.toLocaleString('en-IN')}` : c.sourceA.value}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Source B: {c.sourceB.module}</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {c.sourceB.field}: {typeof c.sourceB.value === 'number' ? `₹${c.sourceB.value.toLocaleString('en-IN')}` : c.sourceB.value}
                  </p>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                <strong>Empirical Fact:</strong> {c.fact}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Possible Benign Explanations:</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                    {c.possibleExplanations.map((exp: string, idx: number) => (
                      <li key={idx}>{exp}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Recommended Human Verification:</span>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">{c.recommendedHumanVerification}</p>
                </div>
              </div>
            </div>
          ))}

          {conflicts.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-1 bg-slate-50 dark:bg-[#1E2445]/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Zero Cross-Source Data Conflicts</p>
              <p className="text-[11px]">Declared profile income, obligations, and employment match verified bank turnover and bureau records.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UNDERWRITER CHECKLIST */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-3.5 text-xs">
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>Targeted Questions for Applicant Adjudication</span>
            </div>
            <ul className="space-y-2">
              {narrative.humanInvestigationQuestions.map((q: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="flex-none font-bold text-blue-600">{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E2445]/20 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">Data Freshness & Provenance Log</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
              {context.freshness.map((fr: any, idx: number) => (
                <div key={idx} className="p-1.5 rounded bg-white dark:bg-black/20 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block truncate">{fr.source}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{fr.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CHANGES / MUTATIONS */}
      {activeTab === 'CHANGES' && (
        <div className="space-y-3 text-xs">
          {changesDetected.map((ch: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-[#1E2445]/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{ch.field} modified</span>
                <span className="text-[10px] text-slate-400 font-mono">{ch.changedAt}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Previous: <strong className="font-mono">{ch.previousValue}</strong> → Current: <strong className="font-mono text-blue-600">{ch.currentValue}</strong>
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">Why it matters: {ch.whyItMatters}</p>
            </div>
          ))}

          {changesDetected.length === 0 && (
            <div className="p-6 text-center text-slate-400 space-y-1">
              <History className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs">No input mutations recorded since the previous decision intelligence snapshot.</p>
            </div>
          )}
        </div>
      )}

      {/* Governance & Human-In-The-Loop Safety Note */}
      <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-[#1E2445] flex items-center justify-between flex-wrap gap-2">
        <span>
          Decision Intelligence is strictly advisory. Authoritative credit sanctions remain governed by human credit committee policy.
        </span>
        <span className="font-mono">Engine: {context.model} · Cache TTL: 15m</span>
      </div>
    </Card>
  );
}
