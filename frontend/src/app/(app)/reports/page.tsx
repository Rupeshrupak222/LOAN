'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  FileSpreadsheet,
  Plus,
  Play,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, Spinner, Button, Badge, Input } from '@/components/ui';

const REPORT_TYPES = [
  { id: 'PORTFOLIO', label: 'Portfolio Asset Quality & AUM' },
  { id: 'ORIGINATIONS', label: 'Origination & Funnel Conversion' },
  { id: 'CREDIT_BRE', label: 'Credit Decisioning & BRE Policy' },
  { id: 'RISK_FRAUD', label: 'Risk Grade & Fraud Analytics' },
  { id: 'DISBURSEMENTS', label: 'Disbursement & Payout Rail Audit' },
  { id: 'COLLECTIONS', label: 'Collections, PTP & Recovery Rate' },
  { id: 'FINANCIAL', label: 'Financial Statements & GL Balances' },
  { id: 'PARTNERS', label: 'Partner Sourcing & Channel Commission' },
  { id: 'BRANCHES', label: 'Branch Performance & TAT Leaderboard' },
  { id: 'OPERATIONS_SLA', label: 'Operations SLA & Stage Cycle Times' },
];

export default function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'BUILDER' | 'SAVED'>('BUILDER');
  const [selectedReportType, setSelectedReportType] = useState('PORTFOLIO');
  const [timeRange, setTimeRange] = useState('this_month');
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Save report modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportDesc, setNewReportDesc] = useState('');
  const [newReportVisibility, setNewReportVisibility] = useState<'PRIVATE' | 'TEAM' | 'TENANT'>('PRIVATE');

  // Fetch saved reports
  const { data: savedReports = [], isLoading: savedLoading } = useQuery({
    queryKey: ['saved-reports-list'],
    queryFn: async () => (await api.get('/analytics/saved-reports')).data.data,
  });

  // Run report mutation
  async function runReport(type: string, range: string) {
    try {
      setExecuting(true);
      const res = await api.get(`/analytics/${type.toLowerCase().replace('_', '-')}?timeRange=${range}`);
      setReportResult({
        type,
        data: res.data.data,
        executedAt: new Date().toISOString(),
      });
      toast.success('Report Generated', `Generated ${type} report for selected date range.`);
    } catch (err: any) {
      toast.error('Execution Failed', apiErrorMessage(err));
    } finally {
      setExecuting(false);
    }
  }

  // Save report mutation
  const saveReportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/analytics/saved-reports', {
        name: newReportName,
        description: newReportDesc,
        reportType: selectedReportType,
        metricKeys: ['all'],
        filters: { timeRange },
        visibility: newReportVisibility,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports-list'] });
      setSaveModalOpen(false);
      setNewReportName('');
      setNewReportDesc('');
      toast.success('Report Saved', 'Report configuration saved to your library.');
    },
    onError: (err: any) => {
      toast.error('Save Failed', apiErrorMessage(err));
    },
  });

  // Run saved report
  async function handleRunSaved(id: string) {
    try {
      setExecuting(true);
      const res = await api.post(`/analytics/saved-reports/${id}/run`, {});
      setReportResult({
        type: res.data.data.reportType,
        data: res.data.data.data,
        name: res.data.data.reportName,
        executedAt: res.data.data.executedAt,
      });
      setActiveTab('BUILDER');
      toast.success('Report Executed', `Executed saved report.`);
    } catch (err: any) {
      toast.error('Execution Failed', apiErrorMessage(err));
    } finally {
      setExecuting(false);
    }
  }

  // Delete saved report
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/analytics/saved-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports-list'] });
      toast.success('Report Deleted', 'Saved report removed.');
    },
    onError: (err: any) => {
      toast.error('Delete Failed', apiErrorMessage(err));
    },
  });

  // Export CSV handler
  async function handleExport(type: string) {
    try {
      setExporting(true);
      const exportType = type === 'PORTFOLIO' ? 'LOANS' : type;
      const res = await api.post(
        '/analytics/export',
        {
          reportType: exportType,
          filters: { timeRange },
          maskPii: true,
        },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Adyapan_${exportType}_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export Successful', `Exported ${exportType} report.`);
    } catch (err: any) {
      toast.error('Export Failed', apiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Insights / Reports"
        title="MIS Report Builder & Query Center"
        subtitle="Construct parameterized reporting queries, run saved reports, and export compliance datasets"
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant={activeTab === 'BUILDER' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('BUILDER')}
              className="text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Report Builder
            </Button>
            <Button
              variant={activeTab === 'SAVED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('SAVED')}
              className="text-xs"
            >
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              Saved Reports ({savedReports.length})
            </Button>
          </div>
        }
      />

      {activeTab === 'BUILDER' && (
        <div className="space-y-6">
          {/* Builder Controls */}
          <Card className="p-5">
            <h3 className="font-semibold text-base text-foreground mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Query Parameters & Whitelisted Dimensions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Report Type / Domain
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-muted/40 border border-border rounded-lg outline-none text-foreground"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t.id} value={t.id} className="dark:bg-slate-900">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Date Range Interval
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full p-2.5 text-xs bg-muted/40 border border-border rounded-lg outline-none text-foreground"
                >
                  <option value="all_time" className="dark:bg-slate-900">All Time</option>
                  <option value="today" className="dark:bg-slate-900">Today</option>
                  <option value="last_7_days" className="dark:bg-slate-900">Last 7 Days</option>
                  <option value="last_30_days" className="dark:bg-slate-900">Last 30 Days</option>
                  <option value="this_month" className="dark:bg-slate-900">This Month</option>
                  <option value="last_month" className="dark:bg-slate-900">Last Month</option>
                  <option value="this_quarter" className="dark:bg-slate-900">This Quarter</option>
                  <option value="this_financial_year" className="dark:bg-slate-900">FY 2026-27</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="primary"
                  onClick={() => runReport(selectedReportType, timeRange)}
                  disabled={executing}
                  className="flex-1 text-xs font-semibold"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {executing ? 'Executing...' : 'Run Query'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSaveModalOpen(true)}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </div>
            </div>
          </Card>

          {/* Report Execution Output */}
          {reportResult && (
            <Card className="p-5">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {reportResult.name || `${reportResult.type} Report Output`}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Executed at {new Date(reportResult.executedAt).toLocaleTimeString()} IST
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={exporting}
                  onClick={() => handleExport(reportResult.type)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {exporting ? 'Exporting...' : 'Export CSV / Excel'}
                </Button>
              </div>

              {/* Formatted Preview */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-xs overflow-x-auto font-mono">
                <pre className="text-foreground">{JSON.stringify(reportResult.data, null, 2)}</pre>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB: SAVED REPORTS */}
      {activeTab === 'SAVED' && (
        <Card className="p-5">
          <h3 className="font-semibold text-base text-foreground mb-4">Saved Report Configurations</h3>

          {savedLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner />
            </div>
          ) : savedReports.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No saved reports found. Use the Report Builder to create and save custom reports.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">Report Name</th>
                    <th className="p-2.5">Domain</th>
                    <th className="p-2.5">Visibility</th>
                    <th className="p-2.5">Last Run</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {savedReports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">
                        {r.name}
                        {r.description && (
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {r.description}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <Badge variant="default">{r.reportType}</Badge>
                      </td>
                      <td className="p-2.5">
                        <Badge variant="info">{r.visibility}</Badge>
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-2.5 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunSaved(r.id)}
                          className="text-xs"
                        >
                          <Play className="h-3 w-3 mr-1 text-emerald-600" /> Run
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteMutation.mutate(r.id)}
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SAVE REPORT MODAL */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card dark:bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-foreground">Save Custom Report Configuration</h3>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Report Name</label>
              <Input
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="e.g. Monthly Branch Performance Audit"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Description (Optional)</label>
              <Input
                value={newReportDesc}
                onChange={(e) => setNewReportDesc(e.target.value)}
                placeholder="Brief description of report purpose"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Visibility Scope</label>
              <select
                value={newReportVisibility}
                onChange={(e) => setNewReportVisibility(e.target.value as any)}
                className="w-full p-2 text-xs bg-muted/40 border border-border rounded-lg outline-none text-foreground"
              >
                <option value="PRIVATE" className="dark:bg-slate-900">Private (Only Me)</option>
                <option value="TEAM" className="dark:bg-slate-900">Team</option>
                <option value="TENANT" className="dark:bg-slate-900">Entire Institution (Tenant)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newReportName.trim() || saveReportMutation.isPending}
                onClick={() => saveReportMutation.mutate()}
                className="font-semibold"
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
