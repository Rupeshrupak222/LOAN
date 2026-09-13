'use client';

import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  currentAssignedUser?: any;
  currentQueue?: any;
  onAssign: (payload: { userId?: string; queueKey?: string; notes?: string; priority?: string }) => Promise<void>;
  submitting: boolean;
}

export function AssignmentModal({
  open,
  onClose,
  applicationId,
  currentAssignedUser,
  currentQueue,
  onAssign,
  submitting,
}: Props) {
  const [assignmentType, setAssignmentType] = useState<'USER' | 'QUEUE'>('USER');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetQueueKey, setTargetQueueKey] = useState<string>('OPERATIONS_QUEUE');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const queues = [
    { key: 'OPERATIONS_QUEUE', label: 'Operations Verification Queue' },
    { key: 'CREDIT_REVIEW_QUEUE', label: 'Credit Assessment Desk' },
    { key: 'RISK_QUEUE', label: 'Risk & Fraud Investigation' },
    { key: 'APPROVAL_QUEUE', label: 'Sanction Approval Committee' },
    { key: 'FINANCE_QUEUE', label: 'Treasury & Disbursement Queue' },
    { key: 'COLLECTIONS_QUEUE', label: 'Delinquency & Recovery Queue' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (assignmentType === 'USER' && !targetUserId) {
        setError('Please provide or select a target user ID');
        return;
      }
      await onAssign({
        userId: assignmentType === 'USER' ? targetUserId : undefined,
        queueKey: assignmentType === 'QUEUE' ? targetQueueKey : undefined,
        notes,
        priority,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Assignment failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Application Assignment & Routing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Assignment Snapshot */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Current User</span>
              <div className="font-semibold text-slate-900 dark:text-white">
                {currentAssignedUser ? `${currentAssignedUser.firstName} ${currentAssignedUser.lastName}` : 'Unassigned'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Current Queue</span>
              <div className="font-semibold text-amber-600 dark:text-amber-400">
                {currentQueue?.name || 'None'}
              </div>
            </div>
          </div>

          {/* Toggle Assignment Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setAssignmentType('USER')}
              className={`py-1.5 rounded-lg font-semibold transition-all ${
                assignmentType === 'USER'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Assign to User
            </button>
            <button
              type="button"
              onClick={() => setAssignmentType('QUEUE')}
              className={`py-1.5 rounded-lg font-semibold transition-all ${
                assignmentType === 'QUEUE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Route to Queue
            </button>
          </div>

          {/* User ID or Queue Selection */}
          {assignmentType === 'USER' ? (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target User / Officer ID
              </label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter officer User ID or UUID..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Departmental Work Queue
              </label>
              <select
                value={targetQueueKey}
                onChange={(e) => setTargetQueueKey(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {queues.map((q) => (
                  <option key={q.key} value={q.key}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Assignment Note */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Note / Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context or operational instructions..."
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-sm transition-colors"
            >
              {submitting ? 'Assigning...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
