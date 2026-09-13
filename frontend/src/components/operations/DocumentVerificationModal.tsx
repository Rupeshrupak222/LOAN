'use client';

import React, { useState } from 'react';
import { X, FileCheck, ShieldAlert, Check, Ban, ExternalLink } from 'lucide-react';
import { DocumentVerificationPayload } from '@/lib/api/operations';

interface Props {
  open: boolean;
  onClose: () => void;
  document: any;
  onVerify: (documentId: string, payload: DocumentVerificationPayload) => Promise<void>;
  submitting: boolean;
}

export function DocumentVerificationModal({
  open,
  onClose,
  document,
  onVerify,
  submitting,
}: Props) {
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Illegible / Blur copy');
  const [error, setError] = useState<string | null>(null);

  if (!open || !document) return null;

  const rejectionReasons = [
    'Illegible / Blur copy',
    'Document expired / Outdated',
    'Name mismatch with application',
    'Incomplete document / missing pages',
    'Tampered or forged proof',
    'Incorrect document type uploaded',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await onVerify(document.id, {
        status: decision,
        notes,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Verification update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Document Verification Review
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{document.fileName || document.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Details Snapshot */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Category</span>
              <div className="font-semibold text-slate-900 dark:text-white">{document.category}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Status</span>
              <div className="font-semibold text-amber-600 dark:text-amber-400">{document.status}</div>
            </div>
            {document.storageKey && (
              <div className="col-span-2 pt-1">
                <a
                  href={document.storageKey.startsWith('http') ? document.storageKey : `#`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="h-3 w-3" /> Preview Document in New Tab
                </a>
              </div>
            )}
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Verification Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision('VERIFIED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  decision === 'VERIFIED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Verify & Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  decision === 'REJECTED'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                <Ban className="h-4 w-4 text-red-500" />
                <span>Reject Document</span>
              </button>
            </div>
          </div>

          {/* Rejection reason if rejected */}
          {decision === 'REJECTED' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {rejectionReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Verification Remarks / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified with PAN database check, details match..."
              rows={2}
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
              disabled={submitting}
              className={`px-4 py-2 rounded-xl font-semibold shadow-sm text-white transition-colors ${
                decision === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Submitting...' : decision === 'VERIFIED' ? 'Confirm Verification' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
