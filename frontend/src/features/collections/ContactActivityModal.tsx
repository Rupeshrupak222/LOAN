'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface ContactActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function ContactActivityModal({ isOpen, onClose, caseItem }: ContactActivityModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activityType, setActivityType] = useState('CALL');
  const [outcome, setOutcome] = useState('CONTACTED');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const activityMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.logActivity({
        caseId: caseItem.id,
        activityType,
        outcome,
        notes,
        nextFollowUpDate: nextFollowUpDate || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Contact activity logged.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      onClose();
      setNotes('');
      setNextFollowUpDate('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to Log Activity' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Log Customer Contact Activity
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Record interaction for <span className="font-semibold text-slate-200">{caseItem.customerName}</span> ({caseItem.mobile}, DPD {caseItem.dpd}).
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Channel *
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CALL">Phone Call</option>
                <option value="SMS">SMS Message</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App Notification</option>
                <option value="FIELD_VISIT">Field Recovery Visit</option>
                <option value="NOTICE">Demand Notice</option>
                <option value="LEGAL">Legal Communication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Outcome *
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CONTACTED">Customer Contacted</option>
                <option value="PROMISE_TO_PAY">Promise To Pay Given</option>
                <option value="NO_ANSWER">No Answer / Busy</option>
                <option value="WRONG_NUMBER">Wrong Number</option>
                <option value="DISPUTE">Loan Disputed</option>
                <option value="REFUSED">Refused to Pay</option>
                <option value="SETTLEMENT_REQUESTED">Settlement Requested</option>
                <option value="ESCALATED">Escalation Required</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Next Follow-Up Date
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Conversation Notes & Context *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record borrower conversation, reasons for non-payment, financial difficulty, commitments..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={activityMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => activityMutation.mutate()}
              disabled={!notes || activityMutation.isPending}
            >
              {activityMutation.isPending ? 'Logging...' : 'Save Activity'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
