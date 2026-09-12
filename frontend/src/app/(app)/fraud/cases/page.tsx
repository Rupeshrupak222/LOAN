'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Search, ArrowRight, Eye, Plus, Lock, CheckCircle2, Clock } from 'lucide-react';
import { FraudCase, FraudCaseStatus } from '@/features/fraud/types';
import { getFraudCases } from '@/features/fraud/api';

export default function FraudCasesPage() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await getFraudCases(statusFilter !== 'ALL' ? { status: statusFilter as any } : undefined);
      setCases(res.cases || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const filtered = cases.filter((c) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.caseNo.toLowerCase().includes(q) ||
        c.applicationNo.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fraud Investigation Cases
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active fraud investigations, evidence attachment vault, and resolution workflows.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Case No, App No, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {['ALL', 'OPEN', 'IN_REVIEW', 'ESCALATED', 'CLEARED', 'CONFIRMED_FRAUD'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-400">Loading Fraud Cases...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-bold">Case No</th>
                  <th className="px-4 py-3 font-bold">Application No</th>
                  <th className="px-4 py-3 font-bold">Borrower Details</th>
                  <th className="px-4 py-3 font-bold">Fraud Score</th>
                  <th className="px-4 py-3 font-bold">Outcome</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Assigned Investigator</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-bold font-mono text-rose-600 dark:text-rose-400">
                      {c.caseNo}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {c.applicationNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <strong className="text-slate-900 dark:text-slate-100 block font-bold">{c.customerName}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{c.customerCode}</span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-rose-600 dark:text-rose-400 text-sm">
                      {c.fraudScore}/100
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.outcome === 'BLOCK'
                            ? 'bg-rose-500/10 text-rose-600'
                            : c.outcome === 'HIGH_RISK'
                            ? 'bg-orange-500/10 text-orange-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {c.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'CONFIRMED_FRAUD'
                            ? 'bg-rose-600 text-white'
                            : c.status === 'CLEARED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                      {c.assignedToName || 'Unassigned Queue'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/fraud/cases/${c.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Workbench
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
