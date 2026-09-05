'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  ExternalLink,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from './ui';

export interface FraudSignalItem {
  signalId: string;
  category:
    | 'CUSTOMER'
    | 'APPLICATION'
    | 'LOAN'
    | 'DOCUMENT'
    | 'BANK_DISBURSEMENT'
    | 'REPAYMENT_COLLECTION'
    | 'EMPLOYEE_BRANCH'
    | 'RELATIONSHIP_NETWORK';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  summary: string;
  entityType: string;
  entityId: string;
  evidence: string[];
  relatedEntities?: {
    entityType: string;
    entityId: string;
    label: string;
    relationship: string;
  }[];
  impact: string;
  possibleExplanations?: string[];
  recommendedInvestigation?: string[];
  confidence?: number;
  detectedAt?: string;
  dataAsOf?: string;
}

export interface NetworkClusterItem {
  clusterId: string;
  pivotType: 'BANK_ACCOUNT' | 'MOBILE' | 'EMAIL' | 'ADDRESS' | 'DOCUMENT';
  pivotValue: string;
  customerIds: string[];
  customerNames: string[];
  applicationIds: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
}

export interface FraudIntelligenceData {
  signals: FraudSignalItem[];
  summary?: string;
  executiveSummary?: string;
  investigationPriority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Review Required' | 'Routine';
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  relationshipSignals?: FraudSignalItem[];
  behavioralSignals?: FraudSignalItem[];
  documentSignals?: FraudSignalItem[];
  bankSignals?: FraudSignalItem[];
  disbursementSignals?: FraudSignalItem[];
  repaymentSignals?: FraudSignalItem[];
  employeeBranchSignals?: FraudSignalItem[];
  networkClusters?: NetworkClusterItem[];
  assessmentId?: string;
  scope?: 'APPLICATION' | 'CUSTOMER' | 'PORTFOLIO';
  targetId?: string;
  targetRef?: string;
  compositeFraudScore?: number;
  riskCategory?: 'CLEARED' | 'SUSPICIOUS' | 'HIGH_RISK_FRAUD' | 'CONFIRMED_FRAUD';
  generatedAt?: string;
  model?: string;
  syntheticIdentity?: any;
  networkCollusion?: any;
  investigationSteps?: string[];
  recommendedInvestigations?: string[];
  dataGaps?: string[];
  isCached?: boolean;
  dataAsOf?: string;
}

interface Props {
  applicationId?: string;
  customerId?: string;
  applicationNo?: string;
  customerCode?: string;
  initialData?: FraudIntelligenceData | null;
}

export function FraudIntelligenceCard({ applicationId, customerId, applicationNo, customerCode, initialData }: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const [data, setData] = useState<FraudIntelligenceData | null>(initialData || null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [showFullAssessment, setShowFullAssessment] = useState(false);

  const mutation = useMutation({
    mutationFn: async (forceRefresh: boolean = false) => {
      let endpoint = '/ai/fraud/portfolio';
      if (applicationId) endpoint = `/ai/fraud/applications/${applicationId}`;
      else if (customerId) endpoint = `/ai/fraud/customers/${customerId}`;

      const res = await api.post(endpoint, { forceRefresh });
      return res.data?.data as FraudIntelligenceData;
    },
    onSuccess: (result) => {
      setData(result);
      toast.success('Fraud Intelligence Complete', 'Scan evaluated portfolio fraud risk.');
    },
    onError: (err: any) => {
      toast.error('Fraud Intelligence Notice', apiErrorMessage(err));
    },
  });

  const priorityColor =
    data?.investigationPriority === 'Critical'
      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
      : data?.investigationPriority === 'High'
      ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
      : data?.investigationPriority === 'Medium'
      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : data?.investigationPriority === 'Low'
      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400';

  const filteredSignals = (data?.signals || []).filter((s) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CRITICAL_HIGH') return s.severity === 'Critical' || s.severity === 'High';
    if (activeTab === 'RELATIONSHIP') return s.category === 'RELATIONSHIP_NETWORK';
    if (activeTab === 'DOCUMENT') return s.category === 'DOCUMENT';
    if (activeTab === 'BANK') return s.category === 'BANK_DISBURSEMENT';
    if (activeTab === 'BEHAVIORAL') return s.category === 'APPLICATION' || s.category === 'LOAN';
    if (activeTab === 'EMPLOYEE') return s.category === 'EMPLOYEE_BRANCH';
    return true;
  });

  return (
    <Card className="space-y-4 border-2 border-rose-500/20 dark:border-rose-500/30 overflow-hidden relative">
      {/* Top red/amber accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-indigo-600" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-sm shadow-rose-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fraud & Anomaly Intelligence
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                LMS Copilot Guard
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Deterministic rule detection + Centralized Gemini synthesis for{' '}
              <span className="font-semibold">{applicationNo || customerCode || 'Subject Account'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!data ? (
            <Button
              size="sm"
              variant="primary"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              <Sparkles className={cn('h-3.5 w-3.5 mr-1.5', mutation.isPending && 'animate-spin')} />
              {mutation.isPending ? 'Scanning Signals...' : 'Analyze with AI'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(true)}
              className="text-xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', mutation.isPending && 'animate-spin')} />
              {mutation.isPending ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Analysis Body */}
      {data && (
        <div className="space-y-4 pt-1">
          {/* Priority & Metrics Banner */}
          <div
            className={cn(
              'flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border',
              priorityColor
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs">
                {data.investigationPriority === 'Critical' || data.investigationPriority === 'High' ? (
                  <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  AI Investigation Priority
                </p>
                <p className="text-base font-extrabold leading-tight">
                  {data.investigationPriority} Priority
                </p>
              </div>
            </div>

            {/* Counts breakdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300">
                Critical: {data.criticalCount}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-700 dark:text-orange-300">
                High: {data.highCount}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Medium: {data.mediumCount}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Low: {data.lowCount}
              </span>
              {data.isCached && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  CACHED
                </span>
              )}
            </div>
          </div>

          {/* Executive AI Synthesis */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#1E2445]/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>AI Executive Synthesis</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.summary}
            </p>

            {/* Recommended Human Investigations */}
            {data.recommendedInvestigations && data.recommendedInvestigations.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-[#1E2445]">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recommended Human Verification Checklist:
                </p>
                <ul className="space-y-1">
                  {data.recommendedInvestigations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-none mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Relational Network Clusters (if present) */}
          {data.networkClusters && data.networkClusters.length > 0 && (
            <div className="p-3.5 rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Relational Network Clusters ({data.networkClusters.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Shared Identifiers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.networkClusters.map((cluster) => (
                  <div
                    key={cluster.clusterId}
                    className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#0A1226] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {cluster.pivotType}: {cluster.pivotValue}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase',
                          cluster.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        )}
                      >
                        {cluster.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {cluster.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cluster.customerNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#1E2445]">
            {[
              { id: 'ALL', label: `All (${(data.signals || []).length})` },
              { id: 'CRITICAL_HIGH', label: `Critical & High (${(data.criticalCount || 0) + (data.highCount || 0)})` },
              { id: 'RELATIONSHIP', label: `Network (${(data.relationshipSignals || []).length})` },
              { id: 'DOCUMENT', label: `Documents (${(data.documentSignals || []).length})` },
              { id: 'BANK', label: `Bank / Payout (${(data.bankSignals || []).length})` },
              { id: 'BEHAVIORAL', label: `Behavioral (${(data.behavioralSignals || []).length})` },
              { id: 'EMPLOYEE', label: `Operational (${(data.employeeBranchSignals || []).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Signals List */}
          <div className="space-y-2.5">
            {filteredSignals.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No signals found in this filter category.
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
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-[#060F1B] space-y-2 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div
                      className="flex items-start justify-between gap-2 cursor-pointer"
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
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {signal.title}
                          </h4>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{signal.summary}</p>
                      </div>

                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Detailed Accordion Content */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-[#1E2445] space-y-2.5 text-xs">
                        {/* Factual Evidence */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Factual Authoritative Evidence:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300 mt-1">
                            {(signal.evidence || []).map((ev, idx) => (
                              <li key={idx} className="font-mono text-[11px]">
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Hypotheses / Possible Explanations */}
                        {signal.possibleExplanations && signal.possibleExplanations.length > 0 && (
                          <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              Investigative Hypotheses (Potential Explanations):
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200 text-[11px] mt-0.5">
                              {signal.possibleExplanations.map((exp, idx) => (
                                <li key={idx}>{exp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {signal.recommendedInvestigation && signal.recommendedInvestigation.length > 0 && (
                          <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                              Action Required by Human Officer:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-emerald-900 dark:text-emerald-200 text-[11px] mt-0.5">
                              {signal.recommendedInvestigation.map((act, idx) => (
                                <li key={idx}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Card Footer: Metadata & Safe Governance Notice */}
          <div className="pt-2 border-t border-slate-200 dark:border-[#1E2445] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>Model: {data.model || 'Gemini 2.5'}</span>
              <span>•</span>
              <span>Data As Of: {data.dataAsOf ? new Date(data.dataAsOf).toLocaleTimeString() : 'Current Session'}</span>
            </div>
            <p className="italic">
              Human In The Loop: AI outputs are advisory hypotheses and never alter financial or loan status records.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
