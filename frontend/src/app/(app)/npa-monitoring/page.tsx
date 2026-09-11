'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  PieChart,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PortfolioNpaSummary {
  tenantId: string;
  totalActiveLoans: number;
  totalBookOutstanding: number;
  standardLoansCount: number;
  standardLoansBook: number;
  smaLoansCount: number;
  smaLoansBook: number;
  npaLoansCount: number;
  npaLoansBook: number;
  grossNpaPct: number;
  netNpaPct: number;
  totalProvisionRequired: number;
  provisionCoverageRatioPct: number;
  generatedAt: string;
}

interface LoanAssetClassification {
  loanId: string;
  loanNo: string;
  borrowerName: string;
  principalOutstanding: number;
  interestOutstanding: number;
  dpd: number;
  classification: string;
  provisionPct: number;
  provisionRequired: number;
  isNpa: boolean;
}

export default function NpaMonitoringPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioNpaSummary | null>(null);
  const [classifications, setClassifications] = useState<LoanAssetClassification[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NPA_ONLY' | 'SMA_ONLY' | 'STANDARD'>('ALL');

  useEffect(() => {
    loadNpaData();
  }, []);

  async function loadNpaData() {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.all([
        api.get<any>('/finance/npa/portfolio-summary'),
        api.get<any>('/finance/npa/classifications'),
      ]);

      const sumData = sumRes.data?.data || sumRes.data;
      const listData = listRes.data?.data || listRes.data;

      if (sumData) setSummary(sumData);
      if (listData) setClassifications(listData);
    } catch (err) {
      console.error('Failed to load NPA data', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredList = classifications.filter((c) => {
    const matchesSearch =
      c.loanNo.toLowerCase().includes(search.toLowerCase()) ||
      c.borrowerName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'NPA_ONLY') return c.isNpa;
    if (selectedFilter === 'SMA_ONLY') return c.classification.startsWith('SMA');
    if (selectedFilter === 'STANDARD') return c.classification === 'STANDARD_REGULAR';
    return true;
  });

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
            <span className="rounded-lg bg-amber-600/10 p-2 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              NPA & Asset Quality Monitoring (RBI Master Directions)
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Automated DPD aging classification, statutory provisioning calculation, and delinquency heatmaps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadNpaData} className="text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh Classifications
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross NPA %
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                (summary?.grossNpaPct || 0) <= 2
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {(summary?.grossNpaPct || 0) <= 2 ? 'HEALTHY (<2%)' : 'ELEVATED'}
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary?.grossNpaPct || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            NPA Book: ₹{summary?.npaLoansBook?.toLocaleString('en-IN') || '0'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net NPA %
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary?.netNpaPct || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">Net of Required Provisions</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Provision Coverage (PCR)
            </span>
            <PieChart className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {summary?.provisionCoverageRatioPct || 100}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Total Provisions: ₹{summary?.totalProvisionRequired?.toLocaleString('en-IN') || '0'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Active Portfolio
            </span>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{summary?.totalBookOutstanding?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">{summary?.totalActiveLoans || 0} Total Active Accounts</div>
        </Card>
      </div>

      {/* Asset Quality Distribution Bar */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Asset Classification Distribution</h3>
        <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#16203D]">
          <div
            style={{
              width: `${
                summary?.totalBookOutstanding
                  ? ((summary.standardLoansBook / summary.totalBookOutstanding) * 100)
                  : 100
              }%`,
            }}
            className="bg-emerald-500 transition-all"
            title="Standard Assets"
          />
          <div
            style={{
              width: `${
                summary?.totalBookOutstanding
                  ? ((summary.smaLoansBook / summary.totalBookOutstanding) * 100)
                  : 0
              }%`,
            }}
            className="bg-amber-500 transition-all"
            title="Special Mention Accounts (SMA 0/1/2)"
          />
          <div
            style={{
              width: `${
                summary?.totalBookOutstanding
                  ? ((summary.npaLoansBook / summary.totalBookOutstanding) * 100)
                  : 0
              }%`,
            }}
            className="bg-rose-500 transition-all"
            title="Non-Performing Assets (NPA 90+ DPD)"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Standard Performing (0 DPD):</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{summary?.standardLoansBook?.toLocaleString('en-IN') || '0'} ({summary?.standardLoansCount || 0} accounts)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">Special Mention (SMA 1-90 DPD):</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{summary?.smaLoansBook?.toLocaleString('en-IN') || '0'} ({summary?.smaLoansCount || 0} accounts)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400">NPA Default (&gt;90 DPD):</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{summary?.npaLoansBook?.toLocaleString('en-IN') || '0'} ({summary?.npaLoansCount || 0} accounts)
            </span>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by loan number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              selectedFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-[#1E2445] dark:text-slate-300'
            }`}
          >
            All Accounts ({classifications.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SMA_ONLY')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              selectedFilter === 'SMA_ONLY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-[#1E2445] dark:text-slate-300'
            }`}
          >
            SMA (1-90 DPD)
          </button>
          <button
            onClick={() => setSelectedFilter('NPA_ONLY')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              selectedFilter === 'NPA_ONLY'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-[#1E2445] dark:text-slate-300'
            }`}
          >
            NPA Default (&gt;90 DPD)
          </button>
        </div>
      </div>

      {/* Classifications Table */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-[#2B3566] dark:bg-[#16203D] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Loan & Borrower</th>
                <th className="px-4 py-3.5">Days Past Due (DPD)</th>
                <th className="px-4 py-3.5">Asset Classification</th>
                <th className="px-4 py-3.5 text-right">Principal Outstanding (₹)</th>
                <th className="px-4 py-3.5 text-right">Statutory Provision %</th>
                <th className="px-5 py-3.5 text-right">Provision Required (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No loan accounts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.loanId} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2242]/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.loanNo}</div>
                      <div className="text-xs text-slate-500">{item.borrowerName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-mono text-xs font-bold ${
                          item.dpd === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.dpd <= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.dpd} DPD
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.classification === 'STANDARD_REGULAR'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : item.classification.startsWith('SMA')
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {item.classification.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      ₹{item.principalOutstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.provisionPct}%
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{item.provisionRequired.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
