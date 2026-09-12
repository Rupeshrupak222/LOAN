'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Layers,
  X,
} from 'lucide-react';
import { Card, Badge, KpiCard } from '@/components/ui';
import { accountingApi } from './api';
import { SuspenseEntryRecord, SuspenseStatus } from './types';

export function FinanceControlsView() {
  const queryClient = useQueryClient();

  const [selectedSuspenseForResolve, setSelectedSuspenseForResolve] = useState<SuspenseEntryRecord | null>(null);
  const [targetAccountCode, setTargetAccountCode] = useState('1020');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New suspense state
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [reason, setReason] = useState('');

  const { data: suspenseEntries = [], isLoading } = useQuery({
    queryKey: ['accounting-suspense'],
    queryFn: () => accountingApi.getSuspenseEntries(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounting-coa'],
    queryFn: () => accountingApi.getAccounts({ activeOnly: true }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { targetAccountCode: string; resolutionNotes: string } }) =>
      accountingApi.resolveSuspenseEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-suspense'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      setSelectedSuspenseForResolve(null);
      setResolutionNotes('');
    },
  });

  const createSuspenseMutation = useMutation({
    mutationFn: accountingApi.createSuspenseEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-suspense'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      setIsAddOpen(false);
      setReference('');
      setAmount('');
      setReason('');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSuspenseMutation.mutate({
      reference,
      amount: parseFloat(amount) || 0,
      direction,
      reason,
      postGl: true,
    });
  };

  const getStatusBadge = (status: SuspenseStatus) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="success">RESOLVED (CLEARED)</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="warning">INVESTIGATING</Badge>;
      case 'OPEN':
        return <Badge variant="danger">OPEN SUSPENSE</Badge>;
      case 'WRITTEN_OFF':
        return <Badge variant="default">WRITTEN OFF</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const openSuspenseSum = suspenseEntries
    .filter((s) => s.status === 'OPEN' || s.status === 'INVESTIGATING')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Suspense Clearing Desk & Financial Controls
          </h3>
          <p className="text-xs text-slate-400">
            Investigate unidentified bank debits/credits parked in Account 1099 and execute audited double-entry reallocations.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Park Unallocated Suspense Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Open Suspense Clearing (1099)"
          value={`₹${openSuspenseSum.toLocaleString()}`}
          subtext={`${suspenseEntries.filter((s) => s.status === 'OPEN').length} Unallocated Inbound/Outbound Items`}
          icon={<AlertTriangle className={`h-5 w-5 ${openSuspenseSum > 0 ? 'text-amber-400' : 'text-slate-400'}`} />}
          variant={openSuspenseSum > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title="Resolved Suspense Volume"
          value={`₹${suspenseEntries.filter((s) => s.status === 'RESOLVED').reduce((sum, s) => sum + s.amount, 0).toLocaleString()}`}
          subtext={`${suspenseEntries.filter((s) => s.status === 'RESOLVED').length} Successfully Allocated Transactions`}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Accounting Period Invariant"
          value="ENFORCED"
          subtext="Backdated Closed Period Posting Blocked"
          icon={<ShieldAlert className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
      </div>

      {/* Suspense Table Card */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Unallocated Suspense Clearing Register
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Reference / Date</th>
                <th className="p-3.5">Direction</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5">Discrepancy Reason</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Resolution Journal</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading suspense clearing items...</p>
                  </td>
                </tr>
              ) : suspenseEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Zero items parked in suspense clearing.
                  </td>
                </tr>
              ) : (
                suspenseEntries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-100">{s.reference}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.entryDate.slice(0, 10)}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          s.direction === 'CREDIT'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {s.direction === 'CREDIT' ? 'INBOUND RECEIPT' : 'OUTBOUND DEBIT'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                      ₹{s.amount.toLocaleString()}
                    </td>

                    <td className="p-3.5 max-w-xs text-slate-300 truncate">{s.reason}</td>

                    <td className="p-3.5 text-center">{getStatusBadge(s.status)}</td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      {s.resolutionJournalId ? (
                        <span className="text-blue-400">{s.resolutionJournalId}</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      {s.status !== 'RESOLVED' && (
                        <button
                          onClick={() => setSelectedSuspenseForResolve(s)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1 ml-auto"
                        >
                          <ArrowRight className="h-3 w-3" />
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resolve Suspense Modal */}
      {selectedSuspenseForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Resolve Suspense Clearing Item</h3>
            <p className="text-xs text-slate-400">
              Clear <strong className="text-slate-200">₹{selectedSuspenseForResolve.amount.toLocaleString()}</strong> from suspense account 1099 and transfer to target Chart of Accounts:
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Allocation Account (COA) *
              </label>
              <select
                value={targetAccountCode}
                onChange={(e) => setTargetAccountCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name} ({acc.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Resolution Rationale & Audit Note *
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Matched with borrower repayment on loan LN-2026-0091"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSuspenseForResolve(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resolutionNotes.trim() || resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({
                    id: selectedSuspenseForResolve.id,
                    data: { targetAccountCode, resolutionNotes },
                  })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all"
              >
                Post Resolution Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Suspense Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Park Unidentified Bank Entry</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Bank Reference / UTR *
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UTR-AXIS-992182"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Transaction Direction *
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'DEBIT' | 'CREDIT')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="CREDIT">CREDIT (Inbound Receipt from Customer/Bank)</option>
                  <option value="DEBIT">DEBIT (Outbound Clearing Debit)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amount (₹) *
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
                  Suspense / Mismatch Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Direct NEFT received with missing loan reference in remarks"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!amount || !reference || createSuspenseMutation.isPending}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Park in Suspense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
