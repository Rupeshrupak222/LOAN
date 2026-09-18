'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  FileSearch,
  TrendingUp,
  RefreshCw,
  Search,
  ArrowRight,
  Target,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';

export function RiskAnalystDashboardView() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');

  // Fetch metrics
  const { data: portfolioData, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ['risk-portfolio-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/portfolio');
      return res.data?.data;
    },
  });

  // Fetch cases
  const { data: casesData, isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['risk-cases-summary'],
    queryFn: async () => {
      const res = await api.get('/risk-cases');
      return res.data?.data?.cases || [];
    },
  });

  // Fetch early warning stats
  const { data: ewStatsData, isLoading: ewLoading, refetch: refetchEw } = useQuery({
    queryKey: ['early-warning-stats'],
    queryFn: async () => {
      const res = await api.get('/early-warnings/stats');
      return res.data?.data;
    },
  });

  const handleRefreshAll = async () => {
    await Promise.all([refetchPortfolio(), refetchCases(), refetchEw()]);
    toast.info('Refreshed', 'Risk Analyst dashboard updated with latest data.');
  };

  const ewStats = ewStatsData || { totalActiveWarnings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 };
  const rawCases: any[] = Array.isArray(casesData) ? casesData : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#1E2445] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Risk Analyst Dashboard
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitor portfolio risk, emerging risk signals, risk cases, portfolio trends, and risk concentrations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefreshAll}
            disabled={portfolioLoading || casesLoading || ewLoading}
            className="w-[180px] h-9 justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', (portfolioLoading || casesLoading) && 'animate-spin')} />
            Refresh Data
          </Button>

          <Link href="/risk/early-warnings">
            <Button size="sm" className="w-[180px] h-9 justify-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm">
              <Activity className="h-3.5 w-3.5" />
              View All Signals
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Active Exposure */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Exposure</span>
            <Target className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {portfolioData?.totalExposure ? formatMoney(portfolioData.totalExposure) : '₹0'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across {portfolioData?.activeAccounts || 0} accounts</p>
        </div>

        {/* Critical Signals */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs ring-1 ring-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">Critical Signals</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {ewStats.criticalCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requiring immediate review</p>
        </div>

        {/* High Signals */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">High Signals</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {ewStats.highCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elevated risk detected</p>
        </div>

        {/* Open Cases */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Open Risk Cases</span>
            <FileSearch className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {rawCases.filter(c => c.status !== 'RESOLUTION').length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Under investigation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue / Recent Cases */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-[#1E2445] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Risk Cases</h2>
              <Link href="/risk/cases" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-[#1E2445]/60 border-b border-slate-200 dark:border-[#1E2445] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {casesLoading ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">Loading cases...</td></tr>
                  ) : rawCases.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No open risk cases.</td></tr>
                  ) : rawCases.slice(0, 5).map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1E2445]/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{c.id}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.riskType}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold tracking-tight',
                          c.severity === 'CRITICAL' && 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
                          c.severity === 'HIGH' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
                          c.severity === 'MEDIUM' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
                          c.severity === 'LOW' && 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
                        )}>
                          {c.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                        {c.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/risk/cases/${c.id}`} className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:underline">
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* AI Advisory Support Panel */}
          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-[#0C152B] shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Portfolio Insights</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Based on recent scans, there is a <span className="font-semibold text-amber-600 dark:text-amber-400">14% increase</span> in early warning signals in the SME Loan sector originating from the North branch. Investigation into underlying macroeconomic factors is suggested.
            </p>
            <Button size="sm" variant="outline" className="w-full text-xs font-semibold h-8 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              View Detailed Analytics
            </Button>
          </div>

          {/* Risk Concentration Snapshot */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0C152B] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exposure by Grade</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Grade A</span>
                <span className="text-slate-900 dark:text-white font-bold">45%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Grade B</span>
                <span className="text-slate-900 dark:text-white font-bold">30%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Grade C & D</span>
                <span className="text-slate-900 dark:text-white font-bold">20%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Grade E (High Risk)</span>
                <span className="text-slate-900 dark:text-white font-bold">5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
