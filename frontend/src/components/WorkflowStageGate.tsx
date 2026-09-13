'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  ApplicationWorkflowStage,
  evaluateWorkflowStageGate,
} from '@/lib/navigation/workflow-gates';
import { cn } from '@/lib/utils';

interface WorkflowStageGateProps {
  stage: ApplicationWorkflowStage;
  context?: {
    isKycComplete?: boolean;
    isBureauChecked?: boolean;
    isCreditAssessed?: boolean;
    isUnderwritten?: boolean;
    isOfferAccepted?: boolean;
    isEsignComplete?: boolean;
    isMandateActive?: boolean;
    isDisbursementApproved?: boolean;
    dpd?: number;
    outstandingBalance?: number;
  };
  compact?: boolean;
  className?: string;
}

export function WorkflowStageGate({
  stage,
  context,
  compact = false,
  className,
}: WorkflowStageGateProps) {
  const gate = evaluateWorkflowStageGate(stage, context);

  if (compact) {
    return (
      <div className={cn('rounded-xl border border-slate-700/60 bg-slate-900/60 p-3.5 backdrop-blur-xs', className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{gate.stageLabel}</p>
              <p className="text-[10px] text-slate-400 truncate">{gate.stageDescription}</p>
            </div>
          </div>
          <Link
            href={gate.nextValidAction.targetRoute}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
              gate.nextValidAction.isBlocked
                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20'
            )}
          >
            <span>{gate.nextValidAction.actionLabel}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 backdrop-blur-md space-y-4', className)}>
      {/* Header with Current Status and Next Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
              Workflow Stage
            </span>
            <h3 className="text-sm font-bold text-white">{gate.stageLabel}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{gate.stageDescription}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={gate.nextValidAction.targetRoute}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm',
              gate.nextValidAction.isBlocked
                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'
            )}
          >
            <span>{gate.nextValidAction.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Prerequisites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completed Prerequisites */}
        <div className="space-y-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed Prerequisites ({gate.completedPrerequisites.length})</span>
          </div>
          {gate.completedPrerequisites.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">No prerequisites completed yet.</p>
          ) : (
            <ul className="space-y-1.5 pt-1">
              {gate.completedPrerequisites.map((p) => (
                <li key={p.key} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-none mt-0.5" />
                  <span className="truncate">{p.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Requirements */}
        <div className="space-y-2 rounded-xl border border-amber-900/30 bg-amber-950/20 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Clock className="h-4 w-4" />
            <span>Pending Requirements ({gate.pendingPrerequisites.length})</span>
          </div>
          {gate.pendingPrerequisites.length === 0 ? (
            <p className="text-[11px] text-emerald-400/80">All standard prerequisites fulfilled.</p>
          ) : (
            <ul className="space-y-1.5 pt-1">
              {gate.pendingPrerequisites.map((p) => (
                <li key={p.key} className="flex items-start gap-2 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-amber-400 flex-none mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-200">{p.label}</p>
                    <p className="text-[10px] text-slate-400">{p.requiredCondition}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Locked Downstream Actions Accordion/List */}
      {gate.lockedActions.some((a) => a.isLocked) && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Workflow-Locked Downstream Actions</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {gate.lockedActions
              .filter((a) => a.isLocked)
              .map((action) => (
                <div
                  key={action.actionKey}
                  className="flex items-start gap-2 rounded-lg border border-slate-800/80 bg-slate-900/50 p-2 text-xs text-slate-400"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-500 flex-none mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-300 truncate">{action.actionLabel}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{action.lockReason}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
