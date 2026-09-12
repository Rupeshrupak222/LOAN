'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Clock, User, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  activityLogs: any[];
  onAddNote?: (message: string, title?: string) => Promise<void>;
  submitting?: boolean;
}

export function ActivityTimelineLedger({ activityLogs, onAddNote, submitting }: Props) {
  const [noteMessage, setNoteMessage] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteMessage.trim() || !onAddNote) return;
    try {
      setIsSubmitting(true);
      await onAddNote(noteMessage, noteTitle || 'Operational Note');
      setNoteMessage('');
      setNoteTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Activity Ledger & Operational Notes
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">{activityLogs.length} events</span>
      </div>

      {/* Note Composer */}
      {onAddNote && (
        <form onSubmit={handleNoteSubmit} className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note subject (optional)..."
            className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <textarea
            value={noteMessage}
            onChange={(e) => setNoteMessage(e.target.value)}
            placeholder="Record operational observations, customer callback notes, or verification remarks..."
            rows={2}
            className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || submitting || !noteMessage.trim()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="h-3 w-3" />
              <span>Add Note</span>
            </button>
          </div>
        </form>
      )}

      {/* Chronological Feed */}
      <div className="space-y-4">
        {activityLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No activity logged yet.</p>
        ) : (
          activityLogs.map((log) => (
            <div key={log.id} className="flex gap-3 text-xs group">
              <div className="mt-1 h-6 w-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {log.activityType === 'NOTE' ? (
                  <MessageSquare className="h-3 w-3" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {log.title || log.activityType}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{log.message}</p>
                {log.createdByUser && (
                  <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1">
                    <User className="h-2.5 w-2.5" />
                    <span>{log.createdByUser.firstName} {log.createdByUser.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
