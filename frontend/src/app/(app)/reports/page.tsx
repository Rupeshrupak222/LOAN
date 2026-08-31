'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, BarChart3, TrendingUp, ShieldAlert, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Spinner, Button } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

export default function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-reports'],
    queryFn: async () => (await api.get('/reports/portfolio')).data.data,
  });

  async function downloadCsv(type: 'loans' | 'payments' | 'disbursements' | 'collections') {
    try {
      setDownloadingType(type);
      const res = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Adyapan_${type.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${type} report:`, err);
    } finally {
      setDownloadingType(null);
    }
  }

  if (isLoading) return <Spinner />;

  const kpis = data?.kpis || {};
  const productData = Array.isArray(data?.productDistribution) ? data.productDistribution : [];
  const branchData = Array.isArray(data?.branchDistribution) ? data.branchDistribution : [];
  const delinquencyData = Array.isArray(data?.delinquencyBuckets) ? data.delinquencyBuckets : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Insights / Reports"
        title="Portfolio Analytics & Executive Reports"
        subtitle="Real-time loan asset performance, disbursement volumes, collection rates, and PAR metrics"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv('loans')}
              disabled={downloadingType === 'loans'}
              className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
            >
              <Download className="h-3.5 w-3.5" />
              {downloadingType === 'loans' ? 'Exporting...' : 'Export Loans Excel/CSV'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv('payments')}
              disabled={downloadingType === 'payments'}
              className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
            >
              <Download className="h-3.5 w-3.5" />
              {downloadingType === 'payments' ? 'Exporting...' : 'Export Repayments Excel/CSV'}
            </Button>
          </div>
        }
      />

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Principal Disbursed"
          value={formatMoney(kpis.totalDisbursed || 0)}
          hint={`${kpis.totalLoans || 0} lifetime loans`}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Active Outstanding Balance"
          value={formatMoney(kpis.totalOutstanding || 0)}
          hint={`${kpis.activeLoansCount || 0} active borrowing accounts`}
          icon={<BarChart3 className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
        <KpiCard
          label="Total Collections"
          value={formatMoney(kpis.totalCollected || 0)}
          hint="Cumulative repayments received"
          icon={<Building2 className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Portfolio at Risk (PAR)"
          value={`${kpis.parRatio || '0.00'}%`}
          hint={`Total overdue: ${formatMoney(kpis.totalOverdue || 0)}`}
          icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product Breakdown Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product-Wise Loan Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sanctioned volume by product line</p>
            </div>
            <BarChart3 className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>

          <div className="h-64 w-full">
            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} interval={0} angle={-12} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(value: any) => [formatMoney(value || 0), 'Sanctioned Amount']}
                    contentStyle={{
                      backgroundColor: isDark ? '#060F1B' : '#ffffff',
                      borderRadius: '12px',
                      border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No product distribution data available.
              </div>
            )}
          </div>
        </Card>

        {/* Branch Performance Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Branch Portfolio Origination</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Disbursed asset volume across regional branches</p>
            </div>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />
          </div>

          <div className="h-64 w-full">
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} interval={0} angle={-12} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(value: any) => [formatMoney(value || 0), 'Portfolio Volume']}
                    contentStyle={{
                      backgroundColor: isDark ? '#060F1B' : '#ffffff',
                      borderRadius: '12px',
                      border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No branch distribution data available.
              </div>
            )}
          </div>
        </Card>

        {/* Delinquency Aging Buckets Breakdown */}
        <Card className="p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Delinquency DPD Aging Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Days Past Due portfolio exposure</p>
            </div>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {delinquencyData.map((d: any) => (
              <div key={d.bucket} className="rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#16203D] p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">{d.bucket} DPD</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatMoney(d.amount || 0)}</p>
                <p className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] mt-0.5">{d.count || 0} Delinquent Accounts</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
