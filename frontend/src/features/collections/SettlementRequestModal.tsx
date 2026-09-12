'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface SettlementRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function SettlementRequestModal({ isOpen, onClose, caseItem }: SettlementRequestModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [proposedSettlementAmount, setProposedSettlementAmount] = useState('');
  const [reason, setReason] = useState('');
  const [validityDays, setValidityDays] = useState('30');

  const totalOverdue = caseItem ? Number(caseItem.overdueAmount) : 0;
  const settlementVal = parseFloat(proposedSettlementAmount) || 0;
  const waiverAmount = Math.max(0, totalOverdue - settlementVal);
  const discountPct = totalOverdue > 0 ? ((waiverAmount / totalOverdue) * 100).toFixed(1) : '0';

  const settlementMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.proposeSettlement({
        caseId: caseItem.id,
        proposedSettlementAmount: settlementVal,
        reason,
        validityDays: parseInt(validityDays, 10) || 30,
      });
    },
    onSuccess: () => {
      toast.success('Settlement request submitted for Checker authorization.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      onClose();
      setProposedSettlementAmount('');
      setReason('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Settlement Proposal Failed' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-amber-400 mb-1 flex items-center gap-1.5">
          Propose One-Time Debt Settlement (OTS)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Initiate debt settlement for <span className="font-semibold text-slate-200">{caseItem.customerName}</span> ({caseItem.caseNo}). Subject to Maker-Checker approval.
        </p>

        <div className="space-y-4">
          {/* Outstanding Summary */}
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-500 text-[10px]">Total Overdue</div>
              <div className="font-bold text-rose-400 text-sm mt-0.5">₹{totalOverdue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Proposed Recovery</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">₹{settlementVal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Waiver / Discount</div>
              <div className="font-bold text-amber-400 text-sm mt-0.5">{discountPct}% (₹{waiverAmount.toLocaleString()})</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Agreed Settlement Lump-Sum Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="e.g. 35000"
              value={proposedSettlementAmount}
              onChange={(e) => setProposedSettlementAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Settlement Offer Validity (Days)
            </label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="15">15 Days</option>
              <option value="30">30 Days (Standard)</option>
              <option value="45">45 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Settlement Justification & Hardship Evidence *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document borrower hardship reasons (loss of job, medical emergency), recovery risk, and committee rationale..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={settlementMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => settlementMutation.mutate()}
              disabled={!settlementVal || !reason || settlementMutation.isPending}
            >
              {settlementMutation.isPending ? 'Submitting...' : 'Submit Settlement Request'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
