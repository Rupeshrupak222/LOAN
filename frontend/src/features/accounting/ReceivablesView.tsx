'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  TrendingUp,
  AlertCircle,
  Clock,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import { Card, KpiCard, Badge } from '@/components/ui';
import { accountingApi } from './api';

export function ReceivablesView() {
  const { data: receivables, isLoading } = useQuery({
    queryKey: ['accounting-receivables'],
    queryFn: () => accountingApi.getReceivablesSummary(),
  });

  const buckets = receivables?.agingBuckets || [];
  const totalReceivables = receivables?.totalReceivables || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Financial Receivables & Portfolio Aging Tiers
          </h3>
          <p className="text-xs text-slate-400">
            Authoritative general ledger loan book receivables categorized across post-disbursement delinquency tiers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Receivables Book"
          value={`₹${(receivables?.totalReceivables || 0).toLocaleString()}`}
          subtext="Principal + Interest + Penalties + Fees"
          icon={<Layers className="h-5 w-5 text-blue-400" />}
          variant="default"
        />
        <KpiCard
          title="Principal Outstanding"
          value={`₹${(receivables?.totalPrincipalOutstanding || 0).toLocaleString()}`}
          subtext="Performing + Delinquent Capital"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <KpiCard
          title="Interest Receivable"
          value={`₹${(receivables?.totalInterestReceivable || 0).toLocaleString()}`}
          subtext="Accrued & Due Yield"
          icon={<Clock className="h-5 w-5 text-indigo-400" />}
          variant="default"
        />
        <KpiCard
          title="Overdue Delinquency"
          value={`₹${(receivables?.totalOverdueAmount || 0).toLocaleString()}`}
          subtext="Accounts with DPD >= 1"
          icon={<AlertCircle className="h-5 w-5 text-rose-400" />}
          variant="danger"
        />
      </div>

      {/* DPD Aging Breakdown Table */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Days Past Due (DPD) Aging Matrix
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            As of: {receivables?.asOfDate ? receivables.asOfDate.slice(0, 10) : 'Today'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Aging Tier</th>
                <th className="p-3.5 text-center">Accounts</th>
                <th className="p-3.5 text-right">Principal (₹)</th>
                <th className="p-3.5 text-right">Interest (₹)</th>
                <th className="p-3.5 text-right">Penalties / Fees (₹)</th>
                <th className="p-3.5 text-right">Total Exposure (₹)</th>
                <th className="p-3.5 text-right">Portfolio Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Aggregating portfolio aging matrix...</p>
                  </td>
                </tr>
              ) : (
                buckets.map((b) => {
                  const sharePct =
                    totalReceivables > 0
                      ? ((b.totalAmount / totalReceivables) * 100).toFixed(1)
                      : '0.0';

                  const getTierBadge = (bucket: string) => {
                    switch (bucket) {
                      case 'CURRENT':
                        return <Badge variant="success">CURRENT (0 DPD)</Badge>;
                      case '1-30':
                        return <Badge variant="default">1-30 DPD (SMA-0)</Badge>;
                      case '31-60':
                        return <Badge variant="warning">31-60 DPD (SMA-1)</Badge>;
                      case '61-90':
                        return <Badge variant="warning">61-90 DPD (SMA-2)</Badge>;
                      case '91-180':
                        return <Badge variant="danger">91-180 DPD (SUBSTANDARD)</Badge>;
                      case '180+':
                        return <Badge variant="danger">180+ DPD (DOUBTFUL/LOSS)</Badge>;
                      default:
                        return <Badge variant="default">{bucket}</Badge>;
                    }
                  };

                  return (
                    <tr key={b.bucket} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-sans font-medium">{getTierBadge(b.bucket)}</td>
                      <td className="p-3.5 text-center font-bold text-slate-200">
                        {b.accountsCount}
                      </td>
                      <td className="p-3.5 text-right text-slate-200">
                        ₹{b.principalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        ₹{b.interestAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        ₹{(b.feeAmount + b.penaltyAmount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-100">
                        ₹{b.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-blue-400 font-bold">
                        {sharePct}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
