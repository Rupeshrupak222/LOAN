'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface WriteOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function WriteOffRequestModal({ isOpen, onClose, caseItem }: WriteOffRequestModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState('UNTRACEABLE_BORROWER');
  const [recoveryExhaustionSummary, setRecoveryExhaustionSummary] = useState('');

  const writeOffMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.proposeWriteOff({
        caseId: caseItem.id,
        reason,
        recoveryExhaustionSummary,
      });
    },
    onSuccess: () => {
      toast.success('Write-off request submitted to Credit Committee.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      onClose();
      setRecoveryExhaustionSummary('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Write-off Proposal Failed' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-rose-500 mb-1 flex items-center gap-1.5">
          Propose Bad Debt Write-Off
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Propose full accounting charge-off for <span className="font-semibold text-slate-200">{caseItem.customerName}</span> ({caseItem.caseNo}, DPD {caseItem.dpd}). Requires Credit Committee approval.
        </p>

        <div className="space-y-4">
          <div className="rounded-md border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
            <p className="font-bold text-sm">Write-off Balance: ₹{Number(caseItem.overdueAmount).toLocaleString()}</p>
            <p className="text-[11px] text-rose-400/80 mt-1">
              Upon approval, this will generate a balanced Double-Entry GL Journal entry debiting account 5030 (Bad Debts Expense) and crediting 1020 (Principal Book).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Primary Write-Off Classification Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="UNTRACEABLE_BORROWER">Untraceable / Absconding Borrower (Skip Tracing Exhausted)</option>
              <option value="BORROWER_DECEASED_NO_ESTATE">Borrower Deceased with No Recoverable Estate</option>
              <option value="BANKRUPTCY_INSOLVENCY">Legal Bankruptcy / Insolvency Adjudicated</option>
              <option value="LEGAL_RECOVERY_UNVIABLE">Legal Recovery Costs Exceed Claim Value</option>
              <option value="FRAUD_SYNDICATE_LOSS">Confirmed Fraud Syndicate Loss</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recovery Exhaustion Summary & Evidence Docket *
            </label>
            <textarea
              value={recoveryExhaustionSummary}
              onChange={(e) => setRecoveryExhaustionSummary(e.target.value)}
              placeholder="Detail all historical recovery attempts (field visits, demand notices, legal arbitration, skip tracing results) confirming exhaustion of standard remedies..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={writeOffMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => writeOffMutation.mutate()}
              disabled={!recoveryExhaustionSummary || writeOffMutation.isPending}
            >
              {writeOffMutation.isPending ? 'Submitting...' : 'Submit to Credit Committee'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
