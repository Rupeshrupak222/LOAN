'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  TrendingUp,
  Download,
  AlertCircle,
  FileCheck,
  Building2,
  X,
} from 'lucide-react';
import { Card, KpiCard, Badge } from '@/components/ui';
import { accountingApi } from './api';

export function TaxAccountingView() {
  const queryClient = useQueryClient();

  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [taxableAmount, setTaxableAmount] = useState('');
  const [isInterstate, setIsInterstate] = useState(false);
  const [refType, setRefType] = useState('LOAN_PROCESSING_FEE');
  const [refId, setRefId] = useState('');

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['accounting-tax-summary', selectedPeriod],
    queryFn: () => accountingApi.getTaxPeriodSummary({ taxPeriod: selectedPeriod }),
  });

  const { data: entries = [], isLoading: isEntriesLoading } = useQuery({
    queryKey: ['accounting-tax-entries', selectedPeriod],
    queryFn: () => accountingApi.getTaxEntries({ taxPeriod: selectedPeriod }),
  });

  const addTaxMutation = useMutation({
    mutationFn: accountingApi.recordOutputTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-tax-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-tax-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      setIsAddOpen(false);
      setTaxableAmount('');
      setRefId('');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTaxMutation.mutate({
      referenceType: refType,
      referenceId: refId || `TX-${Date.now().toString().slice(-6)}`,
      taxableAmount: parseFloat(taxableAmount) || 0,
      isInterstate,
      taxRatePct: 18,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            Statutory GST Accounting & GSTR Summary
          </h3>
          <p className="text-xs text-slate-400">
            Multi-tier GST (CGST/SGST/IGST 18%) recognized on processing charges, doc fees, and Input Tax Credit (ITC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Record Tax Entry
          </button>
        </div>
      </div>

      {/* GSTR KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Taxable Fee Volume"
          value={`₹${(summary?.totalTaxableFeeVolume || 0).toLocaleString()}`}
          subtext={`Period: ${selectedPeriod}`}
          icon={<Receipt className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
        <KpiCard
          title="Output GST Collected"
          value={`₹${(summary?.outputGstCollected?.total || 0).toLocaleString()}`}
          subtext={`CGST: ₹${(summary?.outputGstCollected?.cgst || 0).toLocaleString()} | SGST: ₹${(summary?.outputGstCollected?.sgst || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Input GST (ITC)"
          value={`₹${(summary?.inputGstEligible?.total || 0).toLocaleString()}`}
          subtext="Eligible Vendor Input Credits"
          icon={<FileCheck className="h-5 w-5 text-indigo-400" />}
          variant="default"
        />
        <KpiCard
          title="Net GST Payable"
          value={`₹${(summary?.netGstPayable || 0).toLocaleString()}`}
          subtext="Output Tax minus Eligible ITC"
          icon={<Building2 className="h-5 w-5 text-amber-400" />}
          variant={summary?.netGstPayable ? 'warning' : 'default'}
        />
      </div>

      {/* Tax Entries Table */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            GST Transaction Register ({selectedPeriod})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Date / Ref ID</th>
                <th className="p-3.5">Tax Type / Fee Category</th>
                <th className="p-3.5 text-right">Taxable Amount (₹)</th>
                <th className="p-3.5 text-right">CGST (9%)</th>
                <th className="p-3.5 text-right">SGST (9%)</th>
                <th className="p-3.5 text-right">IGST (18%)</th>
                <th className="p-3.5 text-right">Total GST (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isEntriesLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading tax register...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No tax transactions recorded for period {selectedPeriod}.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{e.referenceId}</div>
                      <div className="text-[11px] text-slate-400">{e.transactionDate.slice(0, 10)}</div>
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className="font-semibold text-slate-200">{e.referenceType}</span>
                      <div className="text-[11px] text-blue-400 font-mono">{e.taxType}</div>
                    </td>
                    <td className="p-3.5 text-right text-slate-200">
                      ₹{e.taxableAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {e.cgstAmount > 0 ? `₹${e.cgstAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {e.sgstAmount > 0 ? `₹${e.sgstAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {e.igstAmount > 0 ? `₹${e.igstAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-400">
                      ₹{e.totalTaxAmount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Tax Entry Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Output GST on Lending Fee</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reference Type / Fee Category *
                </label>
                <select
                  value={refType}
                  onChange={(e) => setRefType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="LOAN_PROCESSING_FEE">LOAN_PROCESSING_FEE (Upfront 18% GST)</option>
                  <option value="DOCUMENTATION_CHARGE">DOCUMENTATION_CHARGE</option>
                  <option value="FORECLOSURE_CHARGE">FORECLOSURE_CHARGE</option>
                  <option value="DEFAULT_PENALTY_GST">DEFAULT_PENALTY_GST</option>
                  <option value="PLATFORM_CONVENIENCE_FEE">PLATFORM_CONVENIENCE_FEE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Loan ID / Ref Identifier *
                </label>
                <input
                  type="text"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  placeholder="e.g. LN-2026-0042"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Taxable Fee Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isInterstate"
                  checked={isInterstate}
                  onChange={(e) => setIsInterstate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isInterstate" className="text-xs text-slate-300 cursor-pointer">
                  Inter-state transaction (apply 18% IGST instead of 9% CGST + 9% SGST)
                </label>
              </div>

              {taxableAmount && parseFloat(taxableAmount) > 0 && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Rate:</span>
                    <span>18.00%</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Calculated Total GST:</span>
                    <span>₹{(parseFloat(taxableAmount) * 0.18).toFixed(2)}</span>
                  </div>
                </div>
              )}

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
                  disabled={!taxableAmount || addTaxMutation.isPending}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Save Tax Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
