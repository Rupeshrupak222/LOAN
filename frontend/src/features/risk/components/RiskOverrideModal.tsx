'use client';

import React, { useState } from 'react';
import { X, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RiskEvaluationResult, RiskGrade } from '../types';
import { overrideRiskScore } from '../api';
import { useToast } from '@/lib/toast';

interface RiskOverrideModalProps {
  evaluation: RiskEvaluationResult;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: RiskEvaluationResult) => void;
}

export function RiskOverrideModal({ evaluation, isOpen, onClose, onSuccess }: RiskOverrideModalProps) {
  const toast = useToast();
  const [newScore, setNewScore] = useState<number>(evaluation.riskScore);
  const [newGrade, setNewGrade] = useState<RiskGrade>(evaluation.riskGrade);
  const [reason, setReason] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please enter a valid override reason of at least 5 characters.', 'Justification Required');
      return;
    }

    setLoading(true);
    try {
      const res = await overrideRiskScore({
        applicationId: evaluation.applicationId,
        newScore,
        newGrade,
        reason,
        comments,
      });
      toast.success(`Successfully updated risk score to ${newScore} (Grade ${newGrade}).`, 'Risk Score Overridden');
      onSuccess(res);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit risk override.', 'Override Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Manual Risk Override (SoD Audited)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                App #{evaluation.applicationId} • Current Grade: {evaluation.riskGrade} (Score: {evaluation.riskScore})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              All manual risk adjustments are logged immutably with timestamp and reviewer identity for compliance audit reporting.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                New Risk Score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newScore}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNewScore(val);
                  if (val <= 20) setNewGrade('A');
                  else if (val <= 40) setNewGrade('B');
                  else if (val <= 60) setNewGrade('C');
                  else if (val <= 80) setNewGrade('D');
                  else setNewGrade('E');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                New Risk Grade
              </label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value as RiskGrade)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Grade A (Prime)</option>
                <option value="B">Grade B (Low Risk)</option>
                <option value="C">Grade C (Medium)</option>
                <option value="D">Grade D (High Risk)</option>
                <option value="E">Grade E (Subprime)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              Mandatory Justification Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Additional fixed deposit collateral submitted or spouse co-borrower income verified"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              Underwriter Investigation Comments
            </label>
            <textarea
              rows={3}
              placeholder="Detailed credit assessment remarks..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Audited Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
