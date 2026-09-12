'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card, Input } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface PtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function PtpModal({ isOpen, onClose, caseItem }: PtpModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [promisedAmount, setPromisedAmount] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');

  const ptpMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.recordPtp({
        caseId: caseItem.id,
        promisedAmount: parseFloat(promisedAmount),
        promisedDate,
        paymentMode,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Promise to Pay recorded successfully.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      onClose();
      setPromisedAmount('');
      setPromisedDate('');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to Record PTP' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Record Promise to Pay (PTP)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Record borrower payment commitment for <span className="font-semibold text-slate-200">{caseItem.customerName}</span>. Total overdue: <span className="text-rose-400 font-bold">₹{Number(caseItem.overdueAmount).toLocaleString()}</span>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Promised Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={promisedAmount}
              onChange={(e) => setPromisedAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Promise Date *
              </label>
              <input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Planned Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="NEFT_IMPS">NEFT / IMPS Transfer</option>
                <option value="CASH">Cash Deposit</option>
                <option value="CHEQUE">Cheque / NACH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              PTP Notes / Source of Funds
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Borrower expects salary credit on 10th; will pay full EMI"
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={ptpMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => ptpMutation.mutate()}
              disabled={!promisedAmount || !promisedDate || ptpMutation.isPending}
            >
              {ptpMutation.isPending ? 'Recording...' : 'Save Promise to Pay'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
