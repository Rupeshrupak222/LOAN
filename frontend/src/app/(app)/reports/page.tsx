'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  Filter,
  Bookmark,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Building2,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Spinner, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

const AVAILABLE_DIMENSIONS = [
  { id: 'PRODUCT', label: 'Lending Product' },
  { id: 'BRANCH', label: 'Branch / Office' },
  { id: 'CHANNEL', label: 'Sourcing Channel (Direct / Partner / Branch)' },
  { id: 'PARTNER', label: 'LSP / Channel Partner' },
  { id: 'RISK_GRADE', label: 'Borrower Risk Grade (A - E)' },
  { id: 'LOAN_STATUS', label: 'Loan Lifecycle Status' },
  { id: 'DPD_BUCKET', label: 'DPD Delinquency Bucket' },
  { id: 'MONTH', label: 'Origination Month' },
];

const AVAILABLE_METRICS = [
  { id: 'APPLICATION_COUNT', label: 'Applications Count' },
  { id: 'APPROVAL_RATE', label: 'Approval Rate (%)' },
  { id: 'REQUESTED_AMOUNT', label: 'Requested Amount (INR)' },
  { id: 'APPROVED_AMOUNT', label: 'Approved Amount (INR)' },
  { id: 'DISBURSED_AMOUNT', label: 'Disbursed Amount (INR)' },
  { id: 'OUTSTANDING_PRINCIPAL', label: 'Outstanding Principal (INR)' },
  { id: 'OVERDUE_AMOUNT', label: 'Overdue Amount (INR)' },
  { id: 'COLLECTED_AMOUNT', label: 'Collected Amount (INR)' },
  { id: 'COLLECTION_EFFICIENCY', label: 'Collection Efficiency (%)' },
  { id: 'INTEREST_INCOME', label: 'Interest Revenue (INR)' },
  { id: 'FEE_INCOME', label: 'Processing & Doc Fees (INR)' },
  { id: 'COMMISSION_AMOUNT', label: 'Partner Commission (INR)' },
];

export default function ReportsAndMisPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'builder' | 'saved' | 'snapshots'>('builder');

  // Report Builder State
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['PRODUCT', 'CHANNEL']);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'APPLICATION_COUNT',
    'APPROVAL_RATE',
    'REQUESTED_AMOUNT',
    'DISBURSED_AMOUNT',
  ]);
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');
  const [reportTitle, setReportTitle] = useState<string>('Custom Sourcing & Portfolio Report');

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState<string>('');
  const [saveVisibility, setSaveVisibility] = useState<'PRIVATE' | 'TEAM' | 'TENANT'>('TEAM');

  // 1. Run Dynamic Report Query
  const {
    data: queryResult,
    isLoading: queryLoading,
    refetch: runQuery,
  } = useQuery({
    queryKey: ['report-query', selectedDimensions, selectedMetrics, datePreset],
    queryFn: async () => {
      const res = await api.post('/analytics/reports/query', {
        title: reportTitle,
        dimensions: selectedDimensions,
        metrics: selectedMetrics,
        filters: { preset: datePreset },
      });
      return res.data.data;
    },
  });

  // 2. Fetch Saved Reports
  const { data: savedReports = [], isLoading: savedLoading } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: async () => (await api.get('/analytics/reports/saved')).data.data,
  });

  // 3. Fetch Reporting Snapshots
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['reporting-snapshots'],
    queryFn: async () => (await api.get('/analytics/snapshots')).data.data,
  });

  // Save Report Mutation
  const saveReportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/analytics/reports/saved', {
        name: saveName,
        description: saveDescription,
        visibility: saveVisibility,
        queryConfig: {
          title: saveName,
          dimensions: selectedDimensions,
          metrics: selectedMetrics,
          filters: { preset: datePreset },
        },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      setIsSaveModalOpen(false);
      setSaveName('');
      setSaveDescription('');
      toast.success('Report Saved', 'Report configuration saved to library successfully.');
    },
    onError: (err: any) => {
      toast.error('Failed to Save', err?.response?.data?.message || 'Error saving report.');
    },
  });

  // Delete Saved Report Mutation
  const deleteSavedReportMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/analytics/reports/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast.success('Report Deleted', 'Saved report removed from catalog.');
    },
  });

  // Export CSV Handler
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await api.post(
        '/analytics/reports/export',
        {
          title: reportTitle,
          dimensions: selectedDimensions,
          metrics: selectedMetrics,
          filters: { preset: datePreset },
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export Successful', 'Audited CSV MIS dataset downloaded.');
    } catch (err: any) {
      toast.error('Export Failed', 'Could not export reporting dataset.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate Snapshot Mutation
  const generateSnapshotMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/analytics/snapshots/generate', {
        snapshotDate: new Date().toISOString().slice(0, 10),
        snapshotType: 'DAILY',
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporting-snapshots'] });
      toast.success('Snapshot Generated', 'Immutable daily reporting snapshot captured.');
    },
    onError: (err: any) => {
      toast.error('Snapshot Failed', err?.response?.data?.message || 'Failed to capture snapshot.');
    },
  });

  const toggleDimension = (dim: string) => {
    if (selectedDimensions.includes(dim)) {
      if (selectedDimensions.length > 1) {
        setSelectedDimensions(selectedDimensions.filter((d) => d !== dim));
      }
    } else {
      setSelectedDimensions([...selectedDimensions, dim]);
    }
  };

  const toggleMetric = (met: string) => {
    if (selectedMetrics.includes(met)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== met));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, met]);
    }
  };

  const formatCurrency = (val: any) => {
    if (typeof val !== 'number') return val;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Insights / MIS & Reports"
        title="MIS Report Builder & Analytics Library"
        subtitle="Dynamic dimension slicing, saved report workflows, and immutable regulatory reporting snapshots"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSnapshotMutation.mutate()}
              disabled={generateSnapshotMutation.isPending}
              className="text-xs gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Capture Daily Snapshot
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting || queryLoading}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export CSV (Audited)'}
            </Button>
          </div>
        }
      />

      {/* Main Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('builder')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'builder' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-4 h-4" />
          Dynamic Report Builder
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Reports Library ({savedReports.length})
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'snapshots' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          Immutable Reporting Snapshots ({snapshots.length})
        </button>
      </div>

      {/* TAB 1: DYNAMIC REPORT BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Builder Controls Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="w-full md:w-56">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reporting Period</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="TODAY">Today</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="LAST_MONTH">Last Month</option>
                  <option value="THIS_QUARTER">This Quarter</option>
                  <option value="THIS_FINANCIAL_YEAR">This Financial Year</option>
                </select>
              </div>
            </div>

            {/* Dimension Multi-Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                1. Select Reporting Dimensions (Group By)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_DIMENSIONS.map((dim) => {
                  const isSelected = selectedDimensions.includes(dim.id);
                  return (
                    <button
                      key={dim.id}
                      onClick={() => toggleDimension(dim.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {dim.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metric Multi-Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                2. Select Key Aggregation Metrics
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_METRICS.map((met) => {
                  const isSelected = selectedMetrics.includes(met.id);
                  return (
                    <button
                      key={met.id}
                      onClick={() => toggleMetric(met.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {met.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{selectedDimensions.length} dimensions</span>
                <span>•</span>
                <span>{selectedMetrics.length} metrics</span>
                <span>•</span>
                <span>Data Freshness: {queryResult?.freshness?.dataFreshnessText || 'Live'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(true)} className="text-xs gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  Save as Report
                </Button>
                <Button variant="primary" size="sm" onClick={() => runQuery()} className="text-xs gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run Report Query
                </Button>
              </div>
            </div>
          </div>

          {/* Results Table Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-sm">{reportTitle}</h3>
                <p className="text-xs text-muted-foreground">Generated {queryResult?.totalRecords || 0} aggregated record rows</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </div>

            {queryLoading ? (
              <div className="p-12 flex justify-center items-center">
                <Spinner />
              </div>
            ) : queryResult?.rows?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold">
                      {Object.keys(queryResult.rows[0]).map((h) => (
                        <th key={h} className="p-3 whitespace-nowrap">
                          {h.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        {Object.keys(queryResult.rows[0]).map((k) => (
                          <td key={k} className="p-3 whitespace-nowrap font-medium">
                            {formatCurrency(row[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No matching records found for the selected dimensions and date range.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SAVED REPORTS LIBRARY */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedReports.map((rep: any) => (
            <div key={rep.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-sm text-foreground">{rep.name}</h3>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                    {rep.visibility}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{rep.description || 'Custom institutional MIS report.'}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {rep.queryConfig?.dimensions?.map((d: string) => (
                    <span key={d} className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] text-muted-foreground">Owner: {rep.ownerName}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDimensions(rep.queryConfig.dimensions);
                      setSelectedMetrics(rep.queryConfig.metrics);
                      setReportTitle(rep.name);
                      setActiveTab('builder');
                    }}
                    className="text-xs"
                  >
                    Open & Run
                  </Button>
                  <button
                    onClick={() => deleteSavedReportMutation.mutate(rep.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: IMMUTABLE REPORTING SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Regulatory & Historical Snapshot Ledger</h3>
              <p className="text-xs text-muted-foreground">Immutable historical reporting state for audits and period reconciliations</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold">
                  <th className="p-3">Snapshot Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Total AUM</th>
                  <th className="p-3">Active Loans</th>
                  <th className="p-3">Disbursed (Month)</th>
                  <th className="p-3">Collected (Month)</th>
                  <th className="p-3">Overdue Balance</th>
                  <th className="p-3">Gross Revenue</th>
                  <th className="p-3">Audit Verification</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 font-bold">{s.snapshotDate}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-muted rounded font-semibold text-[10px]">{s.snapshotType}</span>
                    </td>
                    <td className="p-3 font-semibold text-primary">{formatCurrency(s.totalAum)}</td>
                    <td className="p-3 font-medium">{s.activeLoansCount}</td>
                    <td className="p-3 font-medium text-emerald-600">{formatCurrency(s.totalDisbursedMonth)}</td>
                    <td className="p-3 font-medium text-sky-500">{formatCurrency(s.totalCollectedMonth)}</td>
                    <td className="p-3 font-medium text-amber-500">{formatCurrency(s.totalOverdue)}</td>
                    <td className="p-3 font-medium text-emerald-600">{formatCurrency(s.totalRevenueMonth)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Immutable
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Report Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base">Save Report to Library</h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground uppercase">Report Name</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Branch Sourcing Scorecard"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  placeholder="Summary of metrics and business purpose..."
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase">Visibility</label>
                <select
                  value={saveVisibility}
                  onChange={(e) => setSaveVisibility(e.target.value as any)}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="TEAM">Team (Shared across department)</option>
                  <option value="TENANT">Tenant (All institution staff)</option>
                  <option value="PRIVATE">Private (Only me)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => saveReportMutation.mutate()}
                disabled={!saveName || saveReportMutation.isPending}
              >
                {saveReportMutation.isPending ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
