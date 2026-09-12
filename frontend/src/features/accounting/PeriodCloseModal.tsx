'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { accountingApi } from './api';
import { AccountingPeriodRecord, PeriodCloseChecklistItem } from './types';

interface PeriodCloseModalProps {
  isOpen: boolean;
  period: AccountingPeriodRecord | null;
  onClose: () => void;
}

export function PeriodCloseModal({ isOpen, period, onClose }: PeriodCloseModalProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: checklist = [],
    isLoading: isChecklistLoading,
    refetch: runChecklist,
  } = useQuery({
    queryKey: ['period-checklist', period?.id],
    queryFn: () => (period ? accountingApi.runPeriodChecklist(period.id) : Promise.resolve([])),
    enabled: !!period && isOpen,
  });

  const softCloseMutation = useMutation({
    mutationFn: (id: string) => accountingApi.softClosePeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to soft close period.');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => accountingApi.closePeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to close period.');
    },
  });

  if (!isOpen || !period) return null;

  const allPassed = checklist.length > 0 && checklist.every((item) => item.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Period Close Governance & Pre-Flight</h3>
              <p className="text-xs text-slate-400">
                Period: <strong className="text-slate-200">{period.name} ({period.periodCode})</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Pre-Flight Validation Checklist
            </h4>
            <button
              onClick={() => runChecklist()}
              disabled={isChecklistLoading}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecklistLoading ? 'animate-spin' : ''}`} />
              Re-run Checklist
            </button>
          </div>

          <div className="space-y-2.5">
            {checklist.map((item) => (
              <div
                key={item.code}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 ml-6">{item.description}</p>
                  {item.details && (
                    <p className="text-[11px] text-blue-400/90 font-mono ml-6 mt-1">
                      {item.details}
                    </p>
                  )}
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    item.passed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {item.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              Accounting Close Guard
            </div>
            <p className="text-[11px] text-amber-400/80">
              Closing this fiscal period permanently prevents subsequent manual journals, loan postings, or backdated transactions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          {period.status === 'OPEN' && (
            <button
              type="button"
              disabled={softCloseMutation.isPending}
              onClick={() => softCloseMutation.mutate(period.id)}
              className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all"
            >
              Soft Close (Restrict Posting)
            </button>
          )}
          <button
            type="button"
            disabled={!allPassed || closeMutation.isPending}
            onClick={() => closeMutation.mutate(period.id)}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Finalize Period Close
          </button>
        </div>
      </div>
    </div>
  );
}
