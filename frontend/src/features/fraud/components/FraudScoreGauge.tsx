'use client';

import React from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, AlertTriangle, Eye, Lock, ArrowUpRight } from 'lucide-react';
import { FraudEvaluationResult, FraudOutcome, FraudScoreBand } from '../types';

interface FraudScoreGaugeProps {
  evaluation: FraudEvaluationResult;
  onViewGraph?: () => void;
  onOpenCase?: () => void;
}

const OUTCOME_CONFIG: Record<
  FraudOutcome,
  { label: string; bg: string; text: string; border: string; icon: any; action: string }
> = {
  CLEAR: {
    label: 'CLEAR — Low Fraud Risk',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    action: 'Standard Automated Verification',
  },
  LOW_RISK: {
    label: 'LOW RISK — Minor Signals',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    icon: CheckCircle2,
    action: 'Standard Digital Onboarding',
  },
  REVIEW: {
    label: 'REVIEW — Secondary Verification',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
    action: 'Penny Drop / KYC Document Cross-Check Required',
  },
  HIGH_RISK: {
    label: 'HIGH RISK — Fraud Desk Review',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    icon: ShieldAlert,
    action: 'Mandatory Fraud Desk Investigation Case',
  },
  BLOCK: {
    label: 'BLOCK — Hard Stop Rejection',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertOctagon,
    action: 'Application Blocked Due to Critical Synthetic/Duplicate Fraud',
  },
};

export function FraudScoreGauge({ evaluation, onViewGraph, onOpenCase }: FraudScoreGaugeProps) {
  const outcome = OUTCOME_CONFIG[evaluation.outcome] || OUTCOME_CONFIG.CLEAR;
  const Icon = outcome.icon;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Fraud & Anomaly Intelligence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic 5-Pillar Detection & Identity Cluster Analysis (v{evaluation.evaluationVersion})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewGraph && (
            <button
              onClick={onViewGraph}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Identity Graph
            </button>
          )}
          {onOpenCase && (
            <button
              onClick={onOpenCase}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
            >
              <Lock className="h-3.5 w-3.5" />
              Investigation Desk
            </button>
          )}
        </div>
      </div>

      {/* Main Score & Decision */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Fraud Gauge Dial */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/40 dark:from-slate-800/40 dark:to-slate-900/40 border border-slate-200/70 dark:border-slate-800">
          <div className="relative flex items-center justify-center">
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
                strokeDashoffset={326 - (326 * evaluation.fraudScore) / 100}
                strokeLinecap="round"
                className={`${outcome.text} fill-none transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {evaluation.fraudScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fraud Index
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${outcome.bg} ${outcome.text} ${outcome.border} flex items-center gap-1.5`}>
              <Icon className="h-3.5 w-3.5" />
              {evaluation.outcome}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
              0 (Clean) to 100 (Critical Fraud)
            </span>
          </div>
        </div>

        {/* Outcome Description & Anomaly Flags */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className={`p-4 rounded-xl border ${outcome.border} ${outcome.bg} space-y-1.5`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${outcome.text}`} />
              <span className={`text-xs font-bold uppercase tracking-wide ${outcome.text}`}>
                {outcome.label}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {evaluation.recommendation}
            </p>
            <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <strong className="text-slate-800 dark:text-slate-200">Recommended Action: </strong>
              <span>{outcome.action}</span>
            </div>
          </div>

          {/* Triggered Rule Count & Cluster stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block">Triggered Fraud Rules</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                {evaluation.rulesTriggered?.length || 0} Rule(s)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block">Identity Cluster Links</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                {evaluation.identityClusterSummary?.linkedCustomersCount || 0} Profile(s)
              </span>
            </div>
          </div>

          {/* Key Flags */}
          {evaluation.keyFraudFlags && evaluation.keyFraudFlags.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Critical Anomaly Flags:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {evaluation.keyFraudFlags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                  >
                    ⚠ {flag}
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
