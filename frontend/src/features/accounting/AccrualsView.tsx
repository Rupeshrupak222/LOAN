'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  RotateCcw,
  Clock,
  DollarSign,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';
import { AccrualEntryRecord, AccrualType, AccrualStatus } from './types';

export function AccrualsView() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accrualType, setAccrualType] = useState<AccrualType>('INTEREST_ACCRUAL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));

  const [reversalPrompt, setReversalPrompt] = useState<AccrualEntryRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const { data: accruals = [], isLoading } = useQuery({
    queryKey: ['accounting-accruals'],
    queryFn: () => accountingApi.getAccruals(),
  });

  const createMutation = useMutation({
    mutationFn: accountingApi.createAccrual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-accruals'] });
      setIsCreateOpen(false);
      setDescription('');
      setAmount('');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => accountingApi.approveAndPostAccrual(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-accruals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accountingApi.reverseAccrual(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-accruals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      setReversalPrompt(null);
      setReversalReason('');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      accrualType,
      description,
      amount: parseFloat(amount) || 0,
      effectiveDate: new Date(effectiveDate).toISOString(),
    });
  };

  const getStatusBadge = (status: AccrualStatus) => {
    switch (status) {
      case 'POSTED':
        return <Badge variant="success">POSTED TO GL</Badge>;
      case 'APPROVED':
        return <Badge variant="default">APPROVED</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">DRAFT (PENDING APPROVAL)</Badge>;
      case 'REVERSED':
        return <Badge variant="default">REVERSED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-indigo-400" />
            Accruals & EOD Provisions Engine
          </h3>
          <p className="text-xs text-slate-400">
            Daily interest yield accruals, partner commission bookings, and automated month-end expense reversals.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Accrual Entry
        </button>
      </div>

      {/* Accruals Table Card */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Effective Date / ID</th>
                <th className="p-3.5">Accrual Type</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading accrual schedules...</p>
                  </td>
                </tr>
              ) : accruals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No accrual entries found.
                  </td>
                </tr>
              ) : (
                accruals.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-100">{a.id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {a.effectiveDate.slice(0, 10)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="default" className="font-mono text-[11px]">
                        {a.accrualType}
                      </Badge>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-200 truncate">{a.description}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                      ₹{a.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">{getStatusBadge(a.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === 'DRAFT' && (
                          <button
                            onClick={() => approveMutation.mutate(a.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve & Post
                          </button>
                        )}

                        {a.status === 'POSTED' && !a.reversalJournalId && (
                          <button
                            onClick={() => setReversalPrompt(a)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reverse
                          </button>
                        )}

                        {a.status === 'REVERSED' && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Reversed in GL
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Accrual Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Accrual Entry</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Accrual Type *
                </label>
                <select
                  value={accrualType}
                  onChange={(e) => setAccrualType(e.target.value as AccrualType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="INTEREST_ACCRUAL">INTEREST_ACCRUAL (Dr 1030 / Cr 4010)</option>
                  <option value="COMMISSION_ACCRUAL">COMMISSION_ACCRUAL (Dr 5040 / Cr 2030)</option>
                  <option value="EXPENSE_ACCRUAL">EXPENSE_ACCRUAL (Dr 5070 / Cr 2050)</option>
                  <option value="FEE_ACCRUAL">FEE_ACCRUAL (Dr 1060 / Cr 4020)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Accrual Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Accrual Description & Rationale *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Month-end unbilled interest yield accrual across active retail loans"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !amount}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Create Accrual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reverse Accrual Prompt Modal */}
      {reversalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Reverse Accrual Entry</h3>
            <p className="text-xs text-slate-400">
              Reversing accrual <strong className="text-slate-200">[{reversalPrompt.id}] ₹{reversalPrompt.amount.toLocaleString()}</strong> will post an inverted double-entry compensating entry to the General Ledger. Please provide an audit reason:
            </p>

            <textarea
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Month-end reversal after actual billing generated"
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReversalPrompt(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reversalReason.trim() || reverseMutation.isPending}
                onClick={() =>
                  reverseMutation.mutate({ id: reversalPrompt.id, reason: reversalReason })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
