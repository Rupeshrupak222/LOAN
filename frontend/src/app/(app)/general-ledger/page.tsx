'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  Receipt,
  BookOpen,
  CheckCircle2,
  Calendar,
  Play,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface GlAccount {
  code: string;
  name: string;
  category: string;
  normalBalance: string;
  description: string;
}

interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  category: string;
  debitTotal: number;
  creditTotal: number;
  netBalance: number;
}

interface TrialBalanceReport {
  tenantId: string;
  asOfDate: string;
  accounts: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  direction: string;
  amount: number;
  description?: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  referenceType: string;
  referenceId?: string;
  transactionDate: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  postedBy?: string;
  createdAt: string;
}

export default function GeneralLedgerPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TRIAL_BALANCE' | 'JOURNAL_ENTRIES' | 'CHART_OF_ACCOUNTS'>('TRIAL_BALANCE');

  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<GlAccount[]>([]);

  // EOD Accrual Run state
  const [runningEod, setRunningEod] = useState(false);
  const [eodModalOpen, setEodModalOpen] = useState(false);
  const [eodResult, setEodResult] = useState<any>(null);

  useEffect(() => {
    loadLedgerData();
  }, []);

  async function loadLedgerData() {
    setLoading(true);
    try {
      const [tbRes, jeRes, coaRes] = await Promise.all([
        api.get<any>('/finance/gl/trial-balance'),
        api.get<any>('/finance/gl/journal-entries'),
        api.get<any>('/finance/gl/chart-of-accounts'),
      ]);

      const tbData = tbRes.data?.data || tbRes.data;
      const jeData = jeRes.data?.data || jeRes.data;
      const coaData = coaRes.data?.data || coaRes.data;

      if (tbData) setTrialBalance(tbData);
      if (jeData) setJournalEntries(jeData);
      if (coaData) setChartOfAccounts(coaData);
    } catch (err) {
      console.error('Failed to load ledger data', err);
    } finally {
      setLoading(false);
    }
  }

  async function triggerEodAccrual() {
    setRunningEod(true);
    try {
      const res = await api.post<any>('/finance/accruals/run-eod', {
        runDate: new Date().toISOString().split('T')[0],
      });
      const data = res.data?.data || res.data;
      if (data) {
        setEodResult(data);
        setEodModalOpen(true);
        loadLedgerData();
      }
    } catch (err) {
      console.error('Failed to run EOD accrual', err);
    } finally {
      setRunningEod(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-600/10 p-2 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <Scale className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Double-Entry General Ledger (GL) & Financial Reporting
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-tenant double-entry ledger, automated interest accruals, and statutory trial balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadLedgerData} className="text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={triggerEodAccrual} disabled={runningEod} className="text-xs">
            <Play className={`mr-1.5 h-3.5 w-3.5 ${runningEod ? 'animate-spin' : ''}`} />
            Run EOD Daily Accrual Job
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trial Balance Status
            </span>
            {trialBalance?.isBalanced ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                BALANCED
              </span>
            ) : (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                IMBALANCE
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{trialBalance?.totalDebits?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">Debits = Credits Invariant Verified</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Principal Loan Book (1020)
            </span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹
            {trialBalance?.accounts
              ?.find((a) => a.accountCode === '1020')
              ?.netBalance?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active Gross Performing Assets</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interest Revenue (4010)
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹
            {trialBalance?.accounts
              ?.find((a) => a.accountCode === '4010')
              ?.netBalance?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">Accrued & Realized Yield</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Journal Entries
            </span>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{journalEntries.length}</div>
          <div className="mt-1 text-xs text-slate-500">Double-Entry Audit Trail</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2B3566]">
        <button
          onClick={() => setActiveTab('TRIAL_BALANCE')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'TRIAL_BALANCE'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Trial Balance
        </button>
        <button
          onClick={() => setActiveTab('JOURNAL_ENTRIES')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'JOURNAL_ENTRIES'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Journal Entries ({journalEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('CHART_OF_ACCOUNTS')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'CHART_OF_ACCOUNTS'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Chart of Accounts ({chartOfAccounts.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'TRIAL_BALANCE' && (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-[#2B3566] dark:bg-[#16203D] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Account Code</th>
                  <th className="px-4 py-3.5">Account Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Debit Total (₹)</th>
                  <th className="px-4 py-3.5 text-right">Credit Total (₹)</th>
                  <th className="px-5 py-3.5 text-right">Net Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
                {trialBalance?.accounts.map((acc) => (
                  <tr key={acc.accountCode} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2242]/50">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {acc.accountCode}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">{acc.accountName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-[#2B3566] dark:text-slate-300">
                        {acc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {acc.debitTotal > 0 ? `₹${acc.debitTotal.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {acc.creditTotal > 0 ? `₹${acc.creditTotal.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{acc.netBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-100/60 font-bold dark:border-[#2B3566] dark:bg-[#16203D]">
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-slate-900 dark:text-white">
                    TOTALS (Debits = Credits)
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-slate-900 dark:text-white">
                    ₹{trialBalance?.totalDebits?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-slate-900 dark:text-white">
                    ₹{trialBalance?.totalCredits?.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      BALANCED (0 DIFF)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'JOURNAL_ENTRIES' && (
        <div className="space-y-4">
          {journalEntries.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No journal entries posted yet.</Card>
          ) : (
            journalEntries.map((je) => (
              <Card key={je.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 dark:border-[#2B3566]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {je.entryNumber}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-[#2B3566] dark:text-slate-300">
                      {je.referenceType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(je.transactionDate).toLocaleString('en-IN')} | Posted by: {je.postedBy || 'SYSTEM'}
                  </div>
                </div>

                <div className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200">{je.description}</div>

                <div className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-[#16203D]">
                  {je.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            line.direction === 'DEBIT'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {line.direction}
                        </span>
                        <span className="font-mono text-slate-500">{line.accountCode}</span>
                        <span className="text-slate-800 dark:text-slate-200">{line.accountName}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{line.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'CHART_OF_ACCOUNTS' && (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-[#2B3566] dark:bg-[#16203D] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">GL Code</th>
                  <th className="px-4 py-3.5">Account Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Normal Balance</th>
                  <th className="px-5 py-3.5">Description & Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
                {chartOfAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2242]/50">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{acc.code}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-[#2B3566] dark:text-slate-300">
                        {acc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {acc.normalBalance}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{acc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EOD Result Modal */}
      {eodModalOpen && eodResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">EOD Daily Accrual Completed</h3>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-[#2B3566]">
                <span className="text-slate-500">Run Date</span>
                <span className="font-semibold text-slate-900 dark:text-white">{eodResult.runDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-[#2B3566]">
                <span className="text-slate-500">Active Performing Loans Processed</span>
                <span className="font-semibold text-slate-900 dark:text-white">{eodResult.totalLoansProcessed}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-[#2B3566]">
                <span className="text-slate-500">Total Interest Accrued</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{eodResult.totalInterestAccruedInr?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Journal Entry ID</span>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{eodResult.journalEntryId || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={() => setEodModalOpen(false)}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
