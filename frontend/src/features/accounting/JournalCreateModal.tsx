'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
} from 'lucide-react';
import { accountingApi } from './api';
import { ManualJournalLineInput, JournalSourceType } from './types';

interface JournalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JournalCreateModal({ isOpen, onClose }: JournalCreateModalProps) {
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [source, setSource] = useState<JournalSourceType>('MANUAL');
  const [reference, setReference] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(true);

  const [lines, setLines] = useState<ManualJournalLineInput[]>([
    { accountCode: '1010', direction: 'DEBIT', amount: 0, description: '' },
    { accountCode: '4010', direction: 'CREDIT', amount: 0, description: '' },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounting-coa'],
    queryFn: () => accountingApi.getAccounts({ activeOnly: true }),
  });

  const createMutation = useMutation({
    mutationFn: accountingApi.createJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create journal.');
    },
  });

  const resetForm = () => {
    setDescription('');
    setReference('');
    setErrorMsg(null);
    setLines([
      { accountCode: '1010', direction: 'DEBIT', amount: 0, description: '' },
      { accountCode: '4010', direction: 'CREDIT', amount: 0, description: '' },
    ]);
  };

  if (!isOpen) return null;

  // Calculate totals
  const totalDebit = lines
    .filter((l) => l.direction === 'DEBIT')
    .reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

  const totalCredit = lines
    .filter((l) => l.direction === 'CREDIT')
    .reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '1010', direction: 'DEBIT', amount: 0, description: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (
    idx: number,
    field: keyof ManualJournalLineInput,
    value: any
  ) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg('Journal description is required.');
      return;
    }

    if (!isBalanced) {
      setErrorMsg(`Cannot save out-of-balance journal. Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)}).`);
      return;
    }

    createMutation.mutate({
      description,
      transactionDate: new Date(transactionDate).toISOString(),
      source,
      reference: reference || undefined,
      lines: lines.map((l) => ({
        ...l,
        amount: Number(l.amount),
      })),
      submitImmediately,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Draft Manual Journal Entry</h3>
              <p className="text-xs text-slate-400">
                Multi-line double-entry journal with real-time balance validation and Maker-Checker submission.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Journal Source / Type
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as JournalSourceType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="MANUAL">MANUAL (Standard Operating Journal)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audited Year/Month End)</option>
                <option value="ACCRUAL_REVERSAL">ACCRUAL_REVERSAL</option>
                <option value="TAX_ADJUSTMENT">TAX_ADJUSTMENT (GST / TDS)</option>
                <option value="SUSPENSE_RESOLUTION">SUSPENSE_RESOLUTION</option>
                <option value="CORRECTION">CORRECTION</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Reference / Invoice No.
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-2026-992 or RECON-TX-88"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Journal Description & Business Rationale *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly interest accrual adjustment or partner commission clearing"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Journal Line Items
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md border border-blue-500/20 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Account (COA)</th>
                    <th className="p-2.5 w-28">Direction</th>
                    <th className="p-2.5 w-32">Amount (₹)</th>
                    <th className="p-2.5">Line Description</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-2">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name} ({acc.category})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={line.direction}
                          onChange={(e) =>
                            handleLineChange(idx, 'direction', e.target.value as 'DEBIT' | 'CREDIT')
                          }
                          className={`w-full font-bold text-xs rounded px-2 py-1.5 border focus:outline-none ${
                            line.direction === 'DEBIT'
                              ? 'bg-blue-950/60 text-blue-400 border-blue-700/60'
                              : 'bg-amber-950/60 text-amber-400 border-amber-700/60'
                          }`}
                        >
                          <option value="DEBIT">DEBIT</option>
                          <option value="CREDIT">CREDIT</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.amount || ''}
                          onChange={(e) =>
                            handleLineChange(idx, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={line.description || ''}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          placeholder="Optional line memo"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length <= 2}
                          className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Summary Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Total Debits:</span>
                <span className="text-sm font-bold text-blue-400">₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Credits:</span>
                <span className="text-sm font-bold text-amber-400">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Difference:</span>
                <span className={`text-sm font-bold ${diff > 0.001 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{diff.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isBalanced ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/60">
                  <CheckCircle2 className="h-4 w-4" />
                  BALANCED (Double-Entry Invariant Met)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-800/60">
                  <AlertTriangle className="h-4 w-4" />
                  OUT OF BALANCE
                </div>
              )}
            </div>
          </div>

          {/* Maker-Checker Workflow Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="submitImmediately"
              checked={submitImmediately}
              onChange={(e) => setSubmitImmediately(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="submitImmediately" className="text-xs text-slate-300 font-medium cursor-pointer">
              Submit immediately for Checker approval (Maker-Checker workflow)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced || createMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {submitImmediately ? 'Create & Submit Journal' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
