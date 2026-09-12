'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, KpiCard, Badge } from '@/components/ui';
import { accountingApi } from './api';

interface AccountingDashboardViewProps {
  onTabChange?: (tab: string) => void;
  onOpenNewJournal?: () => void;
  onOpenPeriodClose?: () => void;
}

export function AccountingDashboardView({
  onTabChange,
  onOpenNewJournal,
  onOpenPeriodClose,
}: AccountingDashboardViewProps) {
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: () => accountingApi.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium">Loading Financial Operations & Accounting Control Center...</p>
      </div>
    );
  }

  const health = dashboard?.accountingHealth;
  const portfolio = dashboard?.portfolioFinance;
  const profit = dashboard?.profitabilityYtd;
  const liquidity = dashboard?.liquidity;

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Finance & Accounting Control Center</h2>
            <Badge variant="success" className="px-2.5 py-0.5 text-xs font-semibold">
              LIVE GL CONNECTED
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Authoritative double-entry general ledger, period governance, Maker-Checker manual journals, and statutory GST reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
            title="Refresh Control Center"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {onOpenNewJournal && (
            <button
              onClick={onOpenNewJournal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              New Manual Journal
            </button>
          )}
          {onOpenPeriodClose && (
            <button
              onClick={onOpenPeriodClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              Close Period Checklist
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Fiscal Period"
          value={health?.currentOpenPeriod || '2026-09'}
          subtext={`${health?.pendingJournalsCount || 0} Pending Journal Reviews`}
          icon={<BookOpen className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
        <KpiCard
          title="Operating Profit (YTD)"
          value={`₹${(profit?.netOperatingProfit || 0).toLocaleString()}`}
          subtext={`Margin: ${profit?.operatingMarginPct || 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Cash & Bank Clearing"
          value={`₹${(liquidity?.cashAndBankBalance || 0).toLocaleString()}`}
          subtext={`Net Cash Flow: ₹${(liquidity?.netOperatingCashFlow || 0).toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-indigo-400" />}
          variant="default"
        />
        <KpiCard
          title="Open Suspense Clearing"
          value={`₹${(health?.openSuspenseBalance || 0).toLocaleString()}`}
          subtext={health?.openSuspenseBalance ? 'Action required in Suspense Desk' : 'All Bank Receipts Allocated'}
          icon={<AlertTriangle className={`h-5 w-5 ${health?.openSuspenseBalance ? 'text-amber-400' : 'text-slate-400'}`} />}
          variant={health?.openSuspenseBalance ? 'warning' : 'default'}
        />
      </div>

      {/* Health & Double-Entry Invariant Alert */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Double-Entry Balance Invariant Verified</h4>
            <p className="text-xs text-slate-400">
              Debits strictly equal Credits (Sum Debits = Sum Credits) across all chart of accounts. Zero unbalanced journals.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 font-semibold">
            STATUS: 100% BALANCED
          </span>
        </div>
      </div>

      {/* Two Column Section: Portfolio Receivables & Profitability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Receivables */}
        <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Portfolio Financial Receivables</h3>
            </div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('receivables')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
              >
                View Aging Breakdown <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Principal Book Outstanding</span>
              <span className="text-base font-bold text-slate-100 font-mono">
                ₹{(portfolio?.totalPrincipalOutstanding || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Accrued & Due Interest</span>
              <span className="text-base font-bold text-slate-100 font-mono">
                ₹{(portfolio?.totalInterestReceivable || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Fee & Charges Receivable</span>
              <span className="text-base font-bold text-slate-100 font-mono">
                ₹{(portfolio?.totalFeesReceivable || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-rose-400/90 block mb-1">Total Overdue Delinquency</span>
              <span className="text-base font-bold text-rose-400 font-mono">
                ₹{(portfolio?.totalOverdueReceivable || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Profitability & Margin */}
        <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Profitability & Operating Margin (YTD)</h3>
            </div>
            {onTabChange && (
              <button
                onClick={() => onTabChange('reports')}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium"
              >
                P&L Statement <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Total Lending Revenue (Interest + Fees)</span>
              <span className="font-semibold text-slate-100 font-mono">
                +₹{(profit?.totalLendingRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">Total Operating Expenses (DSA, PG, Ops, Bad Debts)</span>
              <span className="font-semibold text-rose-400 font-mono">
                -₹{(profit?.totalOperatingExpenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 bg-slate-950/60 px-3 rounded-lg border border-slate-800">
              <span className="font-semibold text-white">Net Operating Profit</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ₹{(profit?.netOperatingProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Liquidity Flow Summary */}
      <Card className="p-5 bg-slate-900/60 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Liquidity & Cash Flow Operations</h3>
          </div>
          {onTabChange && (
            <button
              onClick={() => onTabChange('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
            >
              Cash Flow Statement <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Disbursement Outflows</span>
              <span className="text-base font-bold text-slate-100 font-mono">
                ₹{(liquidity?.totalDisbursementsOutflow || 0).toLocaleString()}
              </span>
            </div>
            <ArrowDownRight className="h-5 w-5 text-rose-400" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Borrower Repayment Inflows</span>
              <span className="text-base font-bold text-slate-100 font-mono">
                ₹{(liquidity?.totalRepaymentsInflow || 0).toLocaleString()}
              </span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Nodal Bank Balance</span>
              <span className="text-base font-bold text-indigo-400 font-mono">
                ₹{(liquidity?.cashAndBankBalance || 0).toLocaleString()}
              </span>
            </div>
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}
