'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Calculator,
  UserCheck,
  Clock,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface PendingWorkItem {
  id: string;
  title: string;
  description: string;
  category: 'KYC' | 'DOCUMENTS' | 'RISK_SCORE' | 'RECOMMENDATION' | 'BANKING';
  isDone: boolean;
}

interface PendingWorkWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationNo: string;
  customerName: string;
  customerCode?: string;
  sourceDepartment: string;
  targetDepartment: string;
  pendingItems: PendingWorkItem[];
  /** null = hard-blocked by unverified documents; forward button disabled */
  onCompleteAndForward: (() => Promise<void>) | null;
  onManualFix?: () => void;
}

export function PendingWorkWarningModal({
  isOpen,
  onClose,
  applicationId,
  applicationNo,
  customerName,
  customerCode,
  sourceDepartment,
  targetDepartment,
  pendingItems,
  onCompleteAndForward,
  onManualFix,
}: PendingWorkWarningModalProps) {
  const { isDark } = useTheme();
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen) return null;

  const incompleteItems = pendingItems.filter((item) => !item.isDone);
  const completedCount = pendingItems.filter((item) => item.isDone).length;
  const totalCount = pendingItems.length;

  const handleAutoResolveAndForward = async () => {
    if (!onCompleteAndForward) return;
    setIsResolving(true);
    try {
      await onCompleteAndForward();
      onClose();
    } catch (err) {
      console.error('Failed to auto-complete pending work & forward:', err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className={cn(
        'w-full max-w-2xl rounded-2xl p-6 shadow-2xl transition-all border space-y-5',
        isDark ? 'bg-[#141A36] border-[#2B3566]' : 'bg-white border-slate-200'
      )}>
        {/* Header Alert Banner */}
        <div className={cn(
          'p-4 rounded-xl border flex items-start gap-3.5',
          incompleteItems.length > 0
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30'
            : 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30'
        )}>
          <div className={cn(
            'p-2.5 rounded-lg text-white shrink-0 shadow-xs',
            incompleteItems.length > 0 ? 'bg-rose-600' : 'bg-emerald-600'
          )}>
            {incompleteItems.length > 0 ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className={cn(
              'text-base font-bold',
              incompleteItems.length > 0 ? 'text-rose-900 dark:text-rose-200' : 'text-emerald-900 dark:text-emerald-200'
            )}>
              {incompleteItems.length > 0
                ? 'Forwarding Blocked — Pending Work / Documents Required'
                : 'All Work Completed — Ready for Handoff'}
            </h3>
            <p className={cn(
              'text-xs mt-1 leading-relaxed',
              incompleteItems.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
            )}>
              {incompleteItems.length > 0 ? (
                <>
                  This application has <strong className="font-semibold text-rose-800 dark:text-rose-200">{incompleteItems.length} incomplete item(s)</strong>. All uploaded borrower documents and compliance checks must be fully completed and verified by staff before forwarding to <span className="underline font-bold">{targetDepartment}</span>.
                </>
              ) : (
                <>
                  All borrower documents and appraisal tests are verified. You can now forward this proposal to <span className="underline font-bold">{targetDepartment}</span>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Customer & Application Summary Card */}
        <div className={cn(
          'p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs',
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        )}>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Borrower Profile</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-0.5">
              <span>{customerName || 'Borrower'}</span>
              {customerCode && (
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  {customerCode}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Application #{applicationNo}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0">
            <span className="font-semibold text-xs">{sourceDepartment}</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-bold text-xs">{targetDepartment}</span>
          </div>
        </div>

        {/* Pending Work Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department Task Verification ({completedCount}/{totalCount} Completed)
            </h4>
            <span className={cn(
              'text-xs font-bold',
              incompleteItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            )}>
              {incompleteItems.length > 0 ? `${incompleteItems.length} Action(s) Required` : 'Fully Verified'}
            </span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-xl border flex items-center justify-between gap-3 transition-all',
                  item.isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {item.isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      'text-xs font-bold',
                      item.isDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                    )}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.isDone ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" /> Pending Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto text-xs text-slate-500">
            Close
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {incompleteItems.length > 0 ? (
              onCompleteAndForward === null ? (
                // Hard-blocked: documents are unverified — forward is disabled
                <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                  <div className={cn(
                    'text-[11px] font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5',
                    'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
                  )}>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Forwarding is disabled until all documents are verified
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { onClose(); if (onManualFix) onManualFix(); }}
                    className="w-full sm:w-auto gap-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-white" /> Go to Document Workspace to Verify →
                  </Button>
                </div>
              ) : (
                // Other pending items — allow manual fix
                <Button
                  size="sm"
                  onClick={() => { onClose(); if (onManualFix) onManualFix(); }}
                  className="w-full sm:w-auto gap-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-white" /> Complete Pending Items in Workspace →
                </Button>
              )
            ) : (
              // All items done — show forward button
              <Button
                size="sm"
                onClick={handleAutoResolveAndForward}
                disabled={isResolving}
                className="w-full sm:w-auto gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                {isResolving ? (
                  <><Sparkles className="w-4 h-4 animate-spin text-white" /> Forwarding...</>
                ) : (
                  <><Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Forward to {targetDepartment} →</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
