'use client';

import React, { useState } from 'react';
import { X, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  currentStage: string;
  allowedNextStages: string[];
  onTransition: (stage: string, status?: string, reason?: string) => Promise<void>;
  submitting: boolean;
}

export function StageTransitionModal({
  open,
  onClose,
  currentStage,
  allowedNextStages,
  onTransition,
  submitting,
}: Props) {
  const [selectedStage, setSelectedStage] = useState<string>(allowedNextStages[0] || '');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) {
      setError('Please select a target stage');
      return;
    }
    try {
      setError(null);
      await onTransition(selectedStage, undefined, reason);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Transition failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Controlled Stage Transition
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs Next */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Current Stage</span>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{currentStage}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Target Stage</span>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{selectedStage || 'Select...'}</div>
            </div>
          </div>

          {/* Stage Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Available Forward Transitions (Backend Governed)
            </label>
            <div className="space-y-2">
              {allowedNextStages.map((stage) => (
                <label
                  key={stage}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStage === stage
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{stage}</span>
                  <input
                    type="radio"
                    name="targetStage"
                    value={stage}
                    checked={selectedStage === stage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transition Reason / Comments
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide operational context or verification remarks..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStage}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-sm transition-colors"
            >
              {submitting ? 'Transitioning...' : 'Confirm Stage Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
