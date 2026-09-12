'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
  Plus,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';
import { AccountingPeriodRecord, PeriodStatus } from './types';
import { PeriodCloseModal } from './PeriodCloseModal';

export function PeriodsView() {
  const queryClient = useQueryClient();

  const [selectedPeriodForClose, setSelectedPeriodForClose] = useState<AccountingPeriodRecord | null>(null);
  const [reopenPrompt, setReopenPrompt] = useState<AccountingPeriodRecord | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New period state
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodCode, setNewPeriodCode] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['accounting-periods'],
    queryFn: () => accountingApi.getPeriods(),
  });

  const reopenMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accountingApi.reopenPeriod(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      setReopenPrompt(null);
      setReopenReason('');
    },
  });

  const createMutation = useMutation({
    mutationFn: accountingApi.createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setIsCreateOpen(false);
      setNewPeriodName('');
      setNewPeriodCode('');
      setNewStartDate('');
      setNewEndDate('');
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create period.');
    },
  });

  const getStatusBadge = (status: PeriodStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success">OPEN FOR POSTING</Badge>;
      case 'SOFT_CLOSED':
        return <Badge variant="warning">SOFT CLOSED (RESTRICTED)</Badge>;
      case 'CLOSED':
        return <Badge variant="danger">CLOSED (LOCKED)</Badge>;
      case 'REOPENED':
        return <Badge variant="default">REOPENED (AUDITED)</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate({
      name: newPeriodName,
      periodCode: newPeriodCode,
      startDate: new Date(newStartDate).toISOString(),
      endDate: new Date(newEndDate).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Fiscal Periods & Accounting Governance
          </h3>
          <p className="text-xs text-slate-400">
            Control fiscal month lifecycle, prevent unauthorized backdated postings, and manage period closing checklists.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Fiscal Period
        </button>
      </div>

      {/* Periods Table */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Period Code</th>
                <th className="p-3.5">Period Name</th>
                <th className="p-3.5">Date Range</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Close / Reopen Audit</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading accounting periods...</p>
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No accounting periods configured.
                  </td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-100">{p.periodCode}</td>
                    <td className="p-3.5 font-medium text-slate-200">{p.name}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {p.startDate.slice(0, 10)} to {p.endDate.slice(0, 10)}
                    </td>
                    <td className="p-3.5 text-center">{getStatusBadge(p.status)}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {p.closedAt ? (
                        <span>Closed: {p.closedAt.slice(0, 10)} by {p.closedByUserId}</span>
                      ) : p.reopenedAt ? (
                        <span className="text-amber-400">Reopened: {p.reopenReason}</span>
                      ) : (
                        <span className="text-slate-500">Active Open Period</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'CLOSED' && (
                          <button
                            onClick={() => setSelectedPeriodForClose(p)}
                            className="px-3 py-1 text-[11px] font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Lock className="h-3 w-3" />
                            Close Checklist
                          </button>
                        )}

                        {(p.status === 'CLOSED' || p.status === 'SOFT_CLOSED') && (
                          <button
                            onClick={() => setReopenPrompt(p)}
                            className="px-3 py-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Unlock className="h-3 w-3" />
                            Reopen Period
                          </button>
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

      {/* Period Close Modal */}
      <PeriodCloseModal
        isOpen={!!selectedPeriodForClose}
        period={selectedPeriodForClose}
        onClose={() => setSelectedPeriodForClose(null)}
      />

      {/* Reopen Audit Prompt Modal */}
      {reopenPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Audited Period Reopening</h3>
            </div>
            <p className="text-xs text-slate-400">
              Reopening period <strong className="text-slate-200">{reopenPrompt.name} ({reopenPrompt.periodCode})</strong> allows new transactions to be posted into this period. A mandatory audit justification is logged for regulatory compliance:
            </p>

            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Detailed justification for reopening period (min 10 characters)..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReopenPrompt(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reopenReason.trim().length < 10 || reopenMutation.isPending}
                onClick={() =>
                  reopenMutation.mutate({ id: reopenPrompt.id, reason: reopenReason })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Confirm Reopening
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fiscal Period Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Configure New Fiscal Period</h3>

            {createError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Period Code * (e.g. 2027-01)
                </label>
                <input
                  type="text"
                  value={newPeriodCode}
                  onChange={(e) => setNewPeriodCode(e.target.value)}
                  placeholder="2027-01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Period Name * (e.g. January 2027)
                </label>
                <input
                  type="text"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  placeholder="January 2027 (FY27 Q4)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
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
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
