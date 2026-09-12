'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function FollowUpModal({ isOpen, onClose, caseItem }: FollowUpModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [actionTitle, setActionTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [notes, setNotes] = useState('');

  const followUpMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.createFollowUp({
        caseId: caseItem.id,
        actionTitle,
        dueDate,
        priority,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Follow-up task scheduled.');
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      onClose();
      setActionTitle('');
      setDueDate('');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to Schedule Follow-up' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Schedule Follow-up Task
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Create operational task for <span className="font-semibold text-slate-200">{caseItem.customerName}</span> ({caseItem.caseNo}).
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Action Title / Task Goal *
            </label>
            <input
              type="text"
              placeholder="e.g. Call borrower to confirm salary credit and execute UPI link"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Task Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Notes & Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide checklist or previous interaction summary..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={followUpMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => followUpMutation.mutate()}
              disabled={!actionTitle || !dueDate || followUpMutation.isPending}
            >
              {followUpMutation.isPending ? 'Scheduling...' : 'Save Follow-Up'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
