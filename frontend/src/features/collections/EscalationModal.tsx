'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary, EscalationTier } from './types';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function EscalationModal({ isOpen, onClose, caseItem }: EscalationModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [triggerReason, setTriggerReason] = useState('REPEATED_CONTACT_FAILURE');
  const [toTier, setToTier] = useState<EscalationTier>('TIER_2_SUPERVISOR');
  const [notes, setNotes] = useState('');

  const escalationMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.escalateCase(caseItem.id, {
        triggerReason,
        toTier,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Case escalated successfully.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      onClose();
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Escalation Failed' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-rose-400 mb-1 flex items-center gap-1.5">
          Escalate Delinquent Case
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Escalate case <span className="font-mono text-slate-200 font-semibold">{caseItem.caseNo}</span> ({caseItem.customerName}, DPD {caseItem.dpd}, Overdue ₹{Number(caseItem.overdueAmount).toLocaleString()}) to a supervisory tier.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escalation Trigger Reason *
            </label>
            <select
              value={triggerReason}
              onChange={(e) => setTriggerReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="REPEATED_CONTACT_FAILURE">Repeated Contact Failure / Unreachable</option>
              <option value="CONSECUTIVE_BROKEN_PTPS">Consecutive Broken Promises (PTPs)</option>
              <option value="DPD_THRESHOLD_BREACH">DPD Threshold Breach (Crossing 30/60/90 Days)</option>
              <option value="HIGH_TICKET_EXPOSURE">High Ticket Principal Exposure</option>
              <option value="WILLFUL_DEFAULT">Suspected Willful Default / Refusal</option>
              <option value="LEGAL_DEMAND_REQUIRED">Statutory Demand Notice / Legal Action Required</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escalation Target Tier *
            </label>
            <select
              value={toTier}
              onChange={(e) => setToTier(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="TIER_2_SUPERVISOR">Tier 2: Collection Supervisor / Team Lead</option>
              <option value="TIER_3_COLLECTION_MANAGER">Tier 3: Branch / Collection Manager</option>
              <option value="TIER_4_LEGAL_RECOVERY">Tier 4: Specialized Legal & Recovery Desk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escalation Justification & Background Notes *
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail reasons for escalation, previous agent efforts, summary of calls/notices..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={escalationMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => escalationMutation.mutate()}
              disabled={!notes || escalationMutation.isPending}
            >
              {escalationMutation.isPending ? 'Escalating...' : 'Confirm Escalation'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
