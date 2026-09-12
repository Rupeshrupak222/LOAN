'use client';

import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  CreditCard,
  Building2,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { RiskEvaluationResult, RiskSignalCategory, RiskSignalItem, SignalSeverity } from '../types';

interface RiskSignalBreakdownProps {
  evaluation: RiskEvaluationResult;
}

const CATEGORY_META: Record<
  RiskSignalCategory,
  { label: string; icon: any; color: string; description: string }
> = {
  CUSTOMER: {
    label: '1. Customer Profile & Vintage',
    icon: Users,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900',
    description: 'Age stability, experience vintage, residence stability, customer relationship tier.',
  },
  FINANCIAL: {
    label: '2. Financial Capacity & FOIR',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
    description: 'Net disposable cash flow, monthly debt service burden, income consistency.',
  },
  CREDIT: {
    label: '3. Credit Bureau & Repayment History',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
    description: 'Normalized bureau score, past 12-month DPD delinquency, credit utilization.',
  },
  BANKING: {
    label: '4. Banking & Cash Flow Health',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900',
    description: 'Average monthly balance (AMB), cheque/NACH bounces, inward/outward liquidity.',
  },
  APPLICATION: {
    label: '5. Application & Channel Signals',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
    description: 'Requested amount vs income, loan tenure, submission velocity, channel risk.',
  },
  BEHAVIORAL: {
    label: '6. Intake Behavioral Signals',
    icon: Activity,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900',
    description: 'Session frequency, rapid form field changes, unusual journey navigation.',
  },
};

const SEVERITY_BADGES: Record<SignalSeverity, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Low Severity' },
  MEDIUM: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', label: 'Medium Severity' },
  HIGH: { bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400', label: 'High Severity' },
  CRITICAL: { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', text: 'text-rose-600 dark:text-rose-400', label: 'Critical Severity' },
};

export function RiskSignalBreakdown({ evaluation }: RiskSignalBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    CUSTOMER: true,
    FINANCIAL: true,
    CREDIT: true,
    BANKING: false,
    APPLICATION: false,
    BEHAVIORAL: false,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories = Object.keys(CATEGORY_META) as RiskSignalCategory[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            6-Pillar Risk Signal Breakdown & Explainability
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect contributing signals, observed vs benchmark thresholds, and risk score weights.
          </p>
        </div>
        <button
          onClick={() => {
            const allExpanded = Object.values(expandedCategories).every(Boolean);
            const next: Record<string, boolean> = {};
            categories.forEach((c) => (next[c] = !allExpanded));
            setExpandedCategories(next);
          }}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {Object.values(expandedCategories).every(Boolean) ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const summary = evaluation.categorySummaries?.[cat] || {
            category: cat,
            score: 0,
            weight: 0,
            contribution: 0,
            signalsCount: 0,
            criticalSignalsCount: 0,
            topReasons: [],
          };
          const isExpanded = expandedCategories[cat];
          const catSignals = evaluation.signals.filter((s) => s.category === cat);
          const Icon = meta.icon;

          return (
            <div
              key={cat}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              {/* Category Header Accordion Button */}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {meta.label}
                      </span>
                      {summary.criticalSignalsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {summary.criticalSignalsCount} Critical Signal(s)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Score: {summary.score}/100
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Weight: {summary.weight}% ({summary.contribution} pts)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Category Signals Table */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  {catSignals.length === 0 ? (
                    <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Clean signals in this pillar. All parameters are within prime underwriting benchmarks.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {catSignals.map((signal) => {
                        const sev = SEVERITY_BADGES[signal.severity] || SEVERITY_BADGES.LOW;
                        return (
                          <div
                            key={signal.id}
                            className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sev.bg} ${sev.text}`}>
                                  {sev.label}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {signal.name}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                +{signal.scoreContribution} Risk Points
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <div>
                                <span className="text-slate-400 font-medium">Observed Value: </span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{String(signal.actualValue)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Benchmark Ceiling: </span>
                                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{String(signal.benchmarkValue)}</strong>
                              </div>
                            </div>

                            <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs">
                              <p className="text-slate-700 dark:text-slate-300">
                                <strong className="text-slate-900 dark:text-slate-100">Driver: </strong>
                                {signal.reason}
                              </p>
                              <p className="text-blue-700 dark:text-blue-400 text-[11px]">
                                <strong className="text-blue-900 dark:text-blue-300">Action: </strong>
                                {signal.recommendation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
