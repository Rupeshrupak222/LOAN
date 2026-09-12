'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  PieChart,
  Users,
  Award,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, KpiCard, Badge } from '@/components/ui';
import { collectionsApi } from './api';

export function CollectionAnalyticsView() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['collection-analytics'],
    queryFn: () => collectionsApi.getAnalytics(),
  });

  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['collector-performance'],
    queryFn: () => collectionsApi.getPerformance(),
  });

  if (analyticsLoading || perfLoading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-2"></div>
        <p className="text-xs">Loading delinquency portfolio analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Delinquent Portfolio"
          value={`₹${(analytics?.summary?.totalOverdueAmount || 0).toLocaleString()}`}
          subtext={`${analytics?.summary?.activeDelinquentCases || 0} Delinquent Cases`}
          icon={<AlertCircle className="h-5 w-5 text-rose-400" />}
          variant="danger"
        />
        <KpiCard
          title="Total Recovered (Period)"
          value={`₹${(analytics?.summary?.totalRecoveredAmount || 0).toLocaleString()}`}
          subtext={`Recovery Rate: ${analytics?.summary?.recoveryRatePct || 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Roll-Back Cure Volume"
          value={`₹${((analytics?.rollForwardMatrix || []).reduce((acc: number, r: any) => acc + r.rollBackAmount, 0)).toLocaleString()}`}
          subtext="Accounts cured to lower DPD"
          icon={<ArrowDownRight className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
        <KpiCard
          title="Roll-Forward Migration"
          value={`₹${((analytics?.rollForwardMatrix || []).reduce((acc: number, r: any) => acc + r.rollForwardAmount, 0)).toLocaleString()}`}
          subtext="Delinquency migration volume"
          icon={<ArrowUpRight className="h-5 w-5 text-amber-400" />}
          variant="warning"
        />
      </div>

      {/* Roll-Forward and Roll-Back Analysis Table */}
      <Card className="border-slate-800 bg-slate-900 p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-400" /> Delinquency Migration & Roll-Forward Matrix
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tracks transition between delinquency buckets and account cure rates across the portfolio.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">DPD Bucket</th>
                <th className="py-2.5 px-3 text-right">Beginning Accounts</th>
                <th className="py-2.5 px-3 text-right">Beginning Volume</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Roll-Back (Cured)</th>
                <th className="py-2.5 px-3 text-right text-rose-400">Roll-Forward (Worse)</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-100">Ending Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analytics?.rollForwardMatrix?.map((r: any) => (
                <tr key={r.bucket} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">DPD {r.bucket}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{r.beginningCount}</td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{r.beginningAmount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                    -₹{r.rollBackAmount.toLocaleString()} ({r.rollBackCount})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                    +₹{r.rollForwardAmount.toLocaleString()} ({r.rollForwardCount})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                    ₹{r.endingAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Collector Performance Scorecards */}
      <Card className="border-slate-800 bg-slate-900 p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" /> Collector Performance Scorecards
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Officer recovery efficiency, contact rate, PTP fulfillment percentage, and SLA compliance metrics.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Collector Officer</th>
                <th className="py-2.5 px-3 text-right">Assigned</th>
                <th className="py-2.5 px-3 text-right">Contact Rate</th>
                <th className="py-2.5 px-3 text-right">PTP Created</th>
                <th className="py-2.5 px-3 text-right">PTP Kept</th>
                <th className="py-2.5 px-3 text-right">Fulfillment %</th>
                <th className="py-2.5 px-3 text-right">Recovered Volume</th>
                <th className="py-2.5 px-3 text-center">SLA Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {performance?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No collector performance data available.
                  </td>
                </tr>
              ) : (
                performance?.map((off: any) => (
                  <tr key={off.officerId} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{off.officerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{off.officerEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{off.assignedCasesCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-400 font-semibold">{off.contactRatePct}%</td>
                    <td className="py-2.5 px-3 text-right font-mono">{off.ptpCreatedCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">{off.ptpKeptCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">{off.ptpFulfillmentRatePct}%</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                      ₹{off.totalRecoveredAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {off.slaAdherencePct}%
                      </span>
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
