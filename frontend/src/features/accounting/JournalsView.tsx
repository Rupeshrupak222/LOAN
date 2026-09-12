'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';
import { ManualJournalRecord, ManualJournalStatus } from './types';
import { JournalCreateModal } from './JournalCreateModal';

export function JournalsView() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<ManualJournalRecord | null>(null);

  const [promptAction, setPromptAction] = useState<{
    type: 'REJECT' | 'REVERSE';
    journalId: string;
    journalNumber: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ['accounting-journals', statusFilter],
    queryFn: () =>
      accountingApi.getJournals({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as ManualJournalStatus),
      }),
  });

  const submitMutation = useMutation({
    mutationFn: accountingApi.submitJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: accountingApi.approveJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: accountingApi.postJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accountingApi.rejectJournal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      setPromptAction(null);
      setActionReason('');
    },
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accountingApi.reverseJournal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      setPromptAction(null);
      setActionReason('');
    },
  });

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.reference && j.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadge = (status: ManualJournalStatus) => {
    switch (status) {
      case 'POSTED':
        return <Badge variant="success">POSTED</Badge>;
      case 'APPROVED':
        return <Badge variant="default">APPROVED</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">SUBMITTED (CHECKER)</Badge>;
      case 'DRAFT':
        return <Badge variant="default">DRAFT</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      case 'REVERSED':
        return <Badge variant="default">REVERSED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by journal #, memo, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
              <option value="APPROVED">Approved (Ready to Post)</option>
              <option value="POSTED">Posted to GL</option>
              <option value="DRAFT">Drafts</option>
              <option value="REVERSED">Reversed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Draft Manual Journal
        </button>
      </div>

      {/* Journals Table Card */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Journal # / Date</th>
                <th className="p-3.5">Source / Memo</th>
                <th className="p-3.5 text-right">Debit / Credit</th>
                <th className="p-3.5">Maker / Checker</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading journal entries...</p>
                  </td>
                </tr>
              ) : filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No manual journals found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 font-mono">{j.journalNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {j.transactionDate.slice(0, 10)} &bull; {j.periodCode}
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="font-medium text-slate-200 truncate">{j.description}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-blue-400">{j.source}</span>
                        {j.reference && <span>&bull; Ref: {j.reference}</span>}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                      ₹{j.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200">{j.createdByUserName || j.createdByUserId}</div>
                      {j.approvedByUserName && (
                        <div className="text-[11px] text-slate-400">
                          Checker: {j.approvedByUserName}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center">{getStatusBadge(j.status)}</td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedJournal(j)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="View Lines"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Maker Submit */}
                        {j.status === 'DRAFT' && (
                          <button
                            onClick={() => submitMutation.mutate(j.id)}
                            disabled={submitMutation.isPending}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded transition-colors flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Submit
                          </button>
                        )}

                        {/* Checker Approve & Reject */}
                        {j.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(j.id)}
                              disabled={approveMutation.isPending}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                setPromptAction({
                                  type: 'REJECT',
                                  journalId: j.id,
                                  journalNumber: j.journalNumber,
                                })
                              }
                              className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Post to GL */}
                        {j.status === 'APPROVED' && (
                          <button
                            onClick={() => postMutation.mutate(j.id)}
                            disabled={postMutation.isPending}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <FileText className="h-3 w-3" />
                            Post to GL
                          </button>
                        )}

                        {/* Reverse Posted Journal */}
                        {j.status === 'POSTED' && !j.reversalJournalId && (
                          <button
                            onClick={() =>
                              setPromptAction({
                                type: 'REVERSE',
                                journalId: j.id,
                                journalNumber: j.journalNumber,
                              })
                            }
                            className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3 text-amber-400" />
                            Reverse
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

      {/* Creation Modal */}
      <JournalCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Line Details Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Journal #{selectedJournal.journalNumber}</span>
                  {getStatusBadge(selectedJournal.status)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedJournal.description}</p>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Account</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3">Line Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedJournal.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-sans font-medium text-slate-200">
                        {l.accountCode} - {l.accountName}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {l.direction === 'DEBIT' ? `₹${l.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-400">
                        {l.direction === 'CREDIT' ? `₹${l.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-sans text-slate-400">{l.description || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950 font-bold border-t border-slate-700">
                    <td className="p-3 font-sans">Total Balanced Amount</td>
                    <td className="p-3 text-right text-blue-400">
                      ₹{selectedJournal.totalDebit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-amber-400">
                      ₹{selectedJournal.totalCredit.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedJournal.glJournalId && (
              <div className="mt-4 p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 text-xs text-blue-300 flex items-center justify-between">
                <span>General Ledger Entry ID: <strong className="font-mono text-white">{selectedJournal.glJournalId}</strong></span>
                <span className="text-[11px] text-blue-400">Double-Entry Immutable Record</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject / Reverse Confirmation Prompt Modal */}
      {promptAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">
              {promptAction.type === 'REJECT' ? 'Reject Manual Journal' : 'Reverse Posted Manual Journal'}
            </h3>
            <p className="text-xs text-slate-400">
              {promptAction.type === 'REJECT'
                ? `Provide an audit reason for rejecting ${promptAction.journalNumber}:`
                : `Reversing ${promptAction.journalNumber} will generate an inverted compensating double-entry journal in the General Ledger. Please provide an audit justification:`}
            </p>

            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Audit reason (minimum 5 characters)..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPromptAction(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionReason.trim().length < 5}
                onClick={() => {
                  if (promptAction.type === 'REJECT') {
                    rejectMutation.mutate({ id: promptAction.journalId, reason: actionReason });
                  } else {
                    reverseMutation.mutate({ id: promptAction.journalId, reason: actionReason });
                  }
                }}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all ${
                  promptAction.type === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                } disabled:opacity-50`}
              >
                Confirm {promptAction.type === 'REJECT' ? 'Rejection' : 'Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
