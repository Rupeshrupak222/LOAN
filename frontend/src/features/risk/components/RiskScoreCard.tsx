'use client';

import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, History, Scale } from 'lucide-react';
import { RiskEvaluationResult, RiskBand, RiskGrade } from '../types';

interface RiskScoreCardProps {
  evaluation: RiskEvaluationResult;
  onReEvaluate?: () => void;
  onOpenOverride?: () => void;
}

const BAND_COLORS: Record<RiskBand, { bg: string; text: string; border: string; label: string }> = {
  LOW: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'Low Risk Tier' },
  MODERATE: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', label: 'Moderate Risk Tier' },
  MEDIUM: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', label: 'Medium Risk Tier' },
  HIGH: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', label: 'High Risk Tier' },
  VERY_HIGH: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'Very High Risk Tier' },
};

const GRADE_BADGES: Record<RiskGrade, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-emerald-500 text-white', text: 'text-emerald-600', label: 'Grade A — Prime Borrower' },
  B: { bg: 'bg-blue-600 text-white', text: 'text-blue-600', label: 'Grade B — Standard Low Risk' },
  C: { bg: 'bg-amber-500 text-white', text: 'text-amber-600', label: 'Grade C — Medium Risk' },
  D: { bg: 'bg-orange-500 text-white', text: 'text-orange-600', label: 'Grade D — Cautious Underwriting' },
  E: { bg: 'bg-rose-600 text-white', text: 'text-rose-600', label: 'Grade E — Subprime Profile' },
};

export function RiskScoreCard({ evaluation, onReEvaluate, onOpenOverride }: RiskScoreCardProps) {
  const band = BAND_COLORS[evaluation.riskBand] || BAND_COLORS.LOW;
  const grade = GRADE_BADGES[evaluation.riskGrade] || GRADE_BADGES.A;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Risk Intelligence Assessment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic 6-Pillar Evaluation Snapshot (v{evaluation.evaluationVersion}) • Policy #{evaluation.policyCode} (v{evaluation.policyVersion})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReEvaluate && (
            <button
              onClick={onReEvaluate}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              Re-Evaluate
            </button>
          )}
          {onOpenOverride && (
            <button
              onClick={onOpenOverride}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <Scale className="h-3.5 w-3.5" />
              Override Grade
            </button>
          )}
        </div>
      </div>

      {/* Main Score Showcase */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Score Dial / Visual Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-900/40 border border-slate-200/70 dark:border-slate-800">
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-200 dark:text-slate-800 fill-none"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * evaluation.riskScore) / 100}
                strokeLinecap="round"
                className={`${band.text} fill-none transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {evaluation.riskScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Risk Score
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${band.bg} ${band.text} ${band.border}`}>
              {band.label}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
              0 (Safest Prime) to 100 (Subprime Default)
            </span>
          </div>
        </div>

        {/* Risk Grade & Recommendation */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authoritative Risk Grade</span>
              <div className="flex items-center gap-2.5 mt-1">
                <span className={`h-8 px-3 rounded-lg flex items-center justify-center text-sm font-black ${grade.bg}`}>
                  {evaluation.riskGrade}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {grade.label}
                </span>
              </div>
            </div>

            {evaluation.override && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Overridden from {evaluation.override.previousGrade} ({evaluation.override.previousScore})</span>
              </div>
            )}
          </div>

          {/* Underwriting Recommendation */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/20">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Policy Sanction Guidance
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {evaluation.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Key Risk Drivers */}
          {evaluation.keyRiskDrivers && evaluation.keyRiskDrivers.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Primary Risk Signals Detected:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {evaluation.keyRiskDrivers.map((driver, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                  >
                    • {driver}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
