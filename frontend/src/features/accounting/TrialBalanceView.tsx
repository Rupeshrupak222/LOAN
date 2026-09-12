'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  XCircle,
  Download,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';
import { PeriodTrialBalanceItem, GlAccountCategory } from './types';

export function TrialBalanceView() {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [drilldownAccount, setDrilldownAccount] = useState<{ code: string; name: string } | null>(null);

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['accounting-trial-balance'],
    queryFn: () => accountingApi.getTrialBalance(),
  });

  const { data: glDrilldown, isLoading: isGlLoading } = useQuery({
    queryKey: ['accounting-gl-drilldown', drilldownAccount?.code],
    queryFn: () =>
      drilldownAccount ? accountingApi.getAccountGeneralLedger(drilldownAccount.code) : null,
    enabled: !!drilldownAccount,
  });

  const accounts = report?.accounts || [];

  const filteredAccounts = accounts.filter((a) => {
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesSearch =
      a.accountCode.includes(searchTerm) ||
      a.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: GlAccountCategory) => {
    switch (category) {
      case 'ASSET':
        return <Badge variant="default">ASSET</Badge>;
      case 'LIABILITY':
        return <Badge variant="warning">LIABILITY</Badge>;
      case 'EQUITY':
        return <Badge variant="default">EQUITY</Badge>;
      case 'INCOME':
        return <Badge variant="success">INCOME</Badge>;
      case 'EXPENSE':
        return <Badge variant="danger">EXPENSE</Badge>;
      default:
        return <Badge variant="default">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Balanced Invariant Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Live Period-Aware Trial Balance</h3>
          </div>
          <p className="text-xs text-slate-400">
            Authoritative general ledger rollup displaying opening balances, period debit/credit movements, and closing net positions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {report?.isBalanced ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" />
              DOUBLE-ENTRY BALANCED
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 text-xs font-bold">
              <AlertTriangle className="h-4 w-4" />
              IMBALANCE DETECTED
            </div>
          )}
        </div>
      </div>

      {/* Summary Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Opening Balances</span>
          <div className="flex items-center justify-between font-mono text-xs pt-1">
            <span className="text-blue-400">Dr: ₹{(report?.totalOpeningDebits || 0).toLocaleString()}</span>
            <span className="text-amber-400">Cr: ₹{(report?.totalOpeningCredits || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Period Movement</span>
          <div className="flex items-center justify-between font-mono text-xs pt-1">
            <span className="text-blue-400">Dr: ₹{(report?.totalPeriodDebits || 0).toLocaleString()}</span>
            <span className="text-amber-400">Cr: ₹{(report?.totalPeriodCredits || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Closing Positions</span>
          <div className="flex items-center justify-between font-mono text-xs pt-1">
            <span className="text-blue-400 font-bold">Dr: ₹{(report?.totalClosingDebits || 0).toLocaleString()}</span>
            <span className="text-amber-400 font-bold">Cr: ₹{(report?.totalClosingCredits || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by code, account name, or subcategory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income / Revenue</option>
              <option value="EXPENSE">Expense / Provisions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Account Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Period Debit (₹)</th>
                <th className="p-3 text-right">Period Credit (₹)</th>
                <th className="p-3 text-right">Closing Net (₹)</th>
                <th className="p-3 text-center">GL Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Generating Trial Balance report...</p>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No accounts found matching filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.accountCode} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-bold text-slate-100">{acc.accountCode}</td>
                    <td className="p-3 font-sans font-medium text-slate-200">
                      <div>{acc.accountName}</div>
                      <div className="text-[11px] text-slate-400">{acc.subCategory}</div>
                    </td>
                    <td className="p-3 font-sans">{getCategoryBadge(acc.category)}</td>
                    <td className="p-3 text-right text-blue-400">
                      {acc.periodDebit > 0 ? `₹${acc.periodDebit.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-right text-amber-400">
                      {acc.periodCredit > 0 ? `₹${acc.periodCredit.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-100">
                      ₹{acc.netBalance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-sans">
                      <button
                        onClick={() =>
                          setDrilldownAccount({ code: acc.accountCode, name: acc.accountName })
                        }
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1 text-[11px]"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* General Ledger Drilldown Modal */}
      {drilldownAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>General Ledger: {drilldownAccount.code} - {drilldownAccount.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Transaction history with chronological running balance calculations.
                </p>
              </div>
              <button
                onClick={() => setDrilldownAccount(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Ref Type / Memo</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {isGlLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        Loading GL ledger transactions...
                      </td>
                    </tr>
                  ) : !glDrilldown || glDrilldown.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        No transactions recorded for this account.
                      </td>
                    </tr>
                  ) : (
                    glDrilldown.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 text-slate-400">{tx.transactionDate.slice(0, 10)}</td>
                        <td className="p-3 font-sans text-slate-200">
                          <span className="font-mono text-blue-400 block text-[11px]">
                            {tx.referenceType} &bull; {tx.entryNumber}
                          </span>
                          <span>{tx.description}</span>
                        </td>
                        <td className="p-3 text-right text-blue-400">
                          {tx.debit > 0 ? `₹${tx.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right text-amber-400">
                          {tx.credit > 0 ? `₹${tx.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          ₹{tx.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
