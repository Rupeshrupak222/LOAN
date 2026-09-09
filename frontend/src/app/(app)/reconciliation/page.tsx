'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  FileCheck,
  Check,
  X,
  Lock,
  ExternalLink,
  Zap,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';

export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'EXCEPTIONS' | 'ADJUSTMENTS' | 'PILLARS'>('EXCEPTIONS');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');

  // Propose Adjustment Modal state
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [adjType, setAdjType] = useState<'REALLOCATION' | 'REVERSAL' | 'WAIVER' | 'LEDGER_CORRECTION'>('REALLOCATION');
  const [adjLoanId, setAdjLoanId] = useState('');
  const [adjExceptionId, setAdjExceptionId] = useState('');
  const [adjAmount, setAdjAmount] = useState<number>(1000);
  const [adjReason, setAdjReason] = useState('');

  // Reject Modal state
  const [rejectModalAdj, setRejectModalAdj] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reconciliation-dashboard'],
    queryFn: async () => (await api.get('/reconciliation/dashboard')).data.data,
  });

  // 2. Fetch Exceptions
  const { data: exceptions = [], isLoading: exceptionsLoading } = useQuery({
    queryKey: ['reconciliation-exceptions', severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await api.get(`/reconciliation/exceptions?${params.toString()}`);
      return res.data?.data || [];
    },
  });

  // 3. Fetch Adjustments
  const { data: adjustments = [], isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['reconciliation-adjustments'],
    queryFn: async () => (await api.get('/reconciliation/adjustments')).data.data,
  });

  // Run Reconciliation Pass Mutation
  const runMutation = useMutation({
    mutationFn: async () => (await api.post('/reconciliation/run')).data.data,
    onSuccess: (data) => {
      toast.success('Reconciliation Check Completed', `Scanned ${data.scannedCount} items, found ${data.exceptionsFound} discrepancies.`);
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
    },
    onError: (err: any) => {
      toast.error('Reconciliation Check Failed', apiErrorMessage(err));
    },
  });

  // Propose Adjustment Mutation
  const proposeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/reconciliation/adjustments', {
        type: adjType,
        loanId: adjLoanId,
        exceptionId: adjExceptionId || undefined,
        amount: Number(adjAmount),
        reason: adjReason,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setShowProposeModal(false);
      setAdjReason('');
      setAdjLoanId('');
      setAdjExceptionId('');
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-adjustments'] });
      if (data.requiresApproval) {
        toast.info('Submitted to Maker-Checker Queue', 'Requires dual-approval by Finance Officer or Admin.');
      } else {
        toast.success('Adjustment Approved', 'Adjustment under threshold auto-approved and applied to ledger.');
      }
    },
    onError: (err: any) => {
      toast.error('Propose Adjustment Failed', apiErrorMessage(err));
    },
  });

  // Approve Adjustment Mutation
  const approveMutation = useMutation({
    mutationFn: async (adjId: string) => (await api.post(`/reconciliation/adjustments/${adjId}/approve`)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-adjustments'] });
      toast.success('Adjustment Approved', 'Ledger records reconciled.');
    },
    onError: (err: any) => {
      toast.error('Approval Failed', apiErrorMessage(err));
    },
  });

  // Reject Adjustment Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ adjId, reason }: { adjId: string; reason: string }) =>
      (await api.post(`/reconciliation/adjustments/${adjId}/reject`, { rejectionReason: reason })).data.data,
    onSuccess: () => {
      setRejectModalAdj(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-adjustments'] });
      toast.info('Adjustment Rejected', 'The proposed ledger adjustment was rejected.');
    },
    onError: (err: any) => {
      toast.error('Rejection Failed', apiErrorMessage(err));
    },
  });

  const filteredExceptions = exceptions.filter((e: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.whatHappened && e.whatHappened.toLowerCase().includes(q)) ||
      (e.loanNo && e.loanNo.toLowerCase().includes(q)) ||
      (e.reference && e.reference.toLowerCase().includes(q)) ||
      (e.type && e.type.toLowerCase().includes(q))
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const willRequireApproval = adjAmount >= 5000 || adjType === 'REVERSAL' || adjType === 'LEDGER_CORRECTION';

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumb="Servicing / Accounting & Reconciliation"
        title="Bank Reconciliation & Ledger Audit Desk"
        subtitle="Detect bank-to-ledger mismatches, resolve payment discrepancies, and approve financial adjustments"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowProposeModal(true)}
              className="text-xs flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Propose Ledger Adjustment
            </Button>
            <Button
              size="md"
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs flex items-center gap-1.5 font-semibold cursor-pointer shadow-sm"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', runMutation.isPending && 'animate-spin')} />
              {runMutation.isPending ? 'Auditing Ledgers...' : 'Run Audit Check'}
            </Button>
          </div>
        }
      />

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Reconciliation Health"
          value={`${stats?.reconciliationHealthPercent ?? 100}%`}
          hint="Volume match rate across all loans"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Active Discrepancies"
          value={String(stats?.totalActiveExceptions ?? 0)}
          hint={
            stats?.criticalExceptionsCount && stats.criticalExceptionsCount > 0
              ? `${stats.criticalExceptionsCount} critical mismatch(es)`
              : 'All records balanced'
          }
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Discrepancy Value"
          value={`₹${(stats?.totalDiscrepancyAmount ?? 0).toLocaleString('en-IN')}`}
          hint="Unreconciled delta balance"
          icon={<Scale className="h-4 w-4 text-rose-500" />}
        />
        <KpiCard
          label="Pending Approvals"
          value={String(stats?.pendingAdjustmentsCount ?? 0)}
          hint="Maker-Checker dual control queue"
          icon={<UserCheck className="h-4 w-4 text-blue-600" />}
        />
      </div>

      {/* TABS HEADER */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#2B3566] pb-2">
        <button
          onClick={() => setActiveTab('EXCEPTIONS')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'EXCEPTIONS'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          1. Discrepancy & Mismatch Exceptions ({exceptions.length})
          {stats?.totalActiveExceptions > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
              {stats.totalActiveExceptions}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ADJUSTMENTS')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'ADJUSTMENTS'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <UserCheck className="w-3.5 h-3.5" />
          2. Maker-Checker Adjustments Queue ({adjustments.length})
          {stats?.pendingAdjustmentsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold">
              {stats.pendingAdjustmentsCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PILLARS')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'PILLARS'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          3. Automated 5-Pillar Audit Rules
        </button>
      </div>

      {/* CONTEXTUAL HELPER BANNER */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/60 border border-slate-200/60 dark:border-[#2B3566] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            {activeTab === 'EXCEPTIONS' && <AlertTriangle className="w-4 h-4" />}
            {activeTab === 'ADJUSTMENTS' && <UserCheck className="w-4 h-4" />}
            {activeTab === 'PILLARS' && <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {activeTab === 'EXCEPTIONS' && 'Financial Discrepancy & Exception Queue'}
              {activeTab === 'ADJUSTMENTS' && 'Maker-Checker Financial Adjustment Approval Queue'}
              {activeTab === 'PILLARS' && '5 Continuous Financial Integrity Verification Engines'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeTab === 'EXCEPTIONS' && 'Shows mismatches between bank UTRs, loan amortization schedules, and double-entry accounts. Click "Propose Remedial Adjustment" to resolve.'}
              {activeTab === 'ADJUSTMENTS' && 'Dual-authorization controls for fee waivers, payment reversals, and balance adjustments exceeding standard authority thresholds.'}
              {activeTab === 'PILLARS' && 'Active system audit rules monitoring allocation consistency, duplicate debits, amortization sync, and payout clearances.'}
            </p>
          </div>
        </div>

        {activeTab === 'EXCEPTIONS' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="OPEN">Open Only</option>
              <option value="ADJUSTED">Adjusted</option>
              <option value="DISMISSED">Dismissed</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        )}
      </div>

      {/* SEARCH BAR (FOR EXCEPTIONS) */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="max-w-sm">
          <Input
            placeholder="Search exceptions by loan #, UTR, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* TAB 1: FINANCIAL EXCEPTIONS QUEUE */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="space-y-3">
          {exceptionsLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Scanning ledger reconciliation exceptions...</p>
            </Card>
          ) : filteredExceptions.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Financial Exceptions
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All payment allocations, amortization schedules, gateway UTR proofs, and electronic disbursements reconcile cleanly against core ledger balances.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => runMutation.mutate()}
                disabled={runMutation.isPending}
                className="gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', runMutation.isPending && 'animate-spin')} />
                Re-Run Verification
              </Button>
            </Card>
          ) : (
            filteredExceptions.map((exc: any) => (
              <Card
                key={exc.exceptionId}
                className={cn(
                  'p-5 space-y-3.5 border transition-all',
                  exc.severity === 'CRITICAL' ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10' : ''
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2B3566] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase',
                        getSeverityBadge(exc.severity)
                      )}
                    >
                      {exc.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold">
                      {exc.type}
                    </span>
                    {exc.loanNo && (
                      <Link
                        href={`/loans/${exc.loanId}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        Loan #{exc.loanNo} <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                      Discrepancy: ₹{Number(exc.discrepancyAmount).toLocaleString('en-IN')}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(exc.detectedAt)}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        exc.status === 'ADJUSTED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : exc.status === 'DISMISSED'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {exc.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
                    {exc.whatHappened}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    <strong>Evidence / Trace:</strong> {exc.evidence} (Source: {exc.source})
                  </p>
                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-200">
                    <strong>Recommended Remedial Action:</strong> {exc.recommendedAction}
                  </div>
                </div>

                {exc.status === 'OPEN' && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#2B3566]">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAdjLoanId(exc.loanId || '');
                        setAdjExceptionId(exc.exceptionId);
                        setAdjAmount(exc.discrepancyAmount || 1000);
                        setAdjReason(`Resolution for ${exc.type}: ${exc.evidence}`);
                        setShowProposeModal(true);
                      }}
                      className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Propose Remedial Adjustment
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ADJUSTMENTS & MAKER-CHECKER QUEUE */}
      {activeTab === 'ADJUSTMENTS' && (
        <div className="space-y-3">
          {adjustmentsLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading ledger adjustment requests...</p>
            </Card>
          ) : adjustments.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-500">
                <FileCheck className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Zero Pending Adjustments
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No manual ledger corrections or Maker-Checker adjustment requests are currently in the approval queue.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowProposeModal(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Propose New Adjustment
              </Button>
            </Card>
          ) : (
            adjustments.map((adj: any) => (
              <Card key={adj.adjustmentId} className="p-5 space-y-3.5 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#2B3566] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold">
                      {adj.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      #{adj.adjustmentId}
                    </span>
                    <Link
                      href={`/loans/${adj.loanId}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold flex items-center gap-1"
                    >
                      Loan #{adj.loanNo} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ₹{Number(adj.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        adj.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : adj.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      )}
                    >
                      {adj.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Adjustment Rationale:</strong> {adj.reason}
                  </p>
                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
                    <span>Proposed by: <strong className="text-slate-700 dark:text-slate-300">{adj.proposedBy}</strong></span>
                    <span>Proposed at: {formatDateTime(adj.proposedAt)}</span>
                    {adj.approvedBy && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Approved by: {adj.approvedBy}
                      </span>
                    )}
                    {adj.rejectionReason && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        Rejection reason: {adj.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>

                {adj.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2B3566]">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRejectModalAdj(adj)}
                      className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Reject Adjustment
                    </Button>
                    <Button
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(adj.adjustmentId)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {approveMutation.isPending ? 'Applying...' : 'Approve & Apply to Ledger'}
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 3: 5-PILLAR RECONCILIATION OVERVIEW */}
      {activeTab === 'PILLARS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 space-y-2.5 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Repayment Allocation Consistency
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Verifies that the sum of payment allocation buckets (Principal, Interest, Fees, Penalty) precisely equals the captured transaction amount on every single payment record.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Outstanding Balance Consistency
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Cross-validates that the Loan Master total outstanding principal matches the exact sum of remaining unpaid principal installments across the amortization schedule.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Gateway & UTR Proof Reconciliation
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans verified borrower payment submissions and digital gateway webhooks to verify that every verified customer transfer has a corresponding ledger payment record.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Duplicate Transaction Detection
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Continuously scans for multiple successful payments that share identical bank references or UTR strings, preventing accidental double-credits or accounting inflation.
            </p>
          </Card>

          <Card className="p-5 space-y-2.5 border sm:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Disbursement Instruction vs Banking Rails
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ensures that all loans marked ACTIVE or OVERDUE in the lending portfolio have an electronic fund release instruction verified as COMPLETED by the core banking gateway.
            </p>
          </Card>
        </div>
      )}

      {/* MODAL 1: PROPOSE ADJUSTMENT */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B3566]">
              <div>
                <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                  Propose Controlled Ledger Adjustment
                </h3>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Submit balance re-allocation, fee waiver, or payment reversal request
                </p>
              </div>
              <button
                onClick={() => setShowProposeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Adjustment Type *
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                  )}
                >
                  <option value="REALLOCATION">Bucket Reallocation (Principal vs Interest)</option>
                  <option value="REVERSAL">Payment Reversal (Refund / Double Debit)</option>
                  <option value="WAIVER">Fee or Penalty Waiver</option>
                  <option value="LEDGER_CORRECTION">Manual Ledger Balance Correction</option>
                </select>
              </div>

              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Target Loan ID *
                </label>
                <Input
                  value={adjLoanId}
                  onChange={(e) => setAdjLoanId(e.target.value)}
                  placeholder="e.g. loan UUID or account string"
                  required
                />
              </div>

              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Adjustment Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Mandatory Audit Rationale *
                </label>
                <textarea
                  rows={3}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Detail the accounting reason and documentary proof for this adjustment..."
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  required
                />
              </div>

              <div
                className={cn(
                  'p-3 rounded-xl border text-[11px]',
                  willRequireApproval
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40'
                )}
              >
                {willRequireApproval ? (
                  <span>
                    <strong>Maker-Checker Dual Control:</strong> This adjustment exceeds ₹5,000 or is a reversal/correction, and will require formal dual-approval by another Finance Officer or Admin.
                  </span>
                ) : (
                  <span>
                    <strong>Delegated Authority:</strong> Standard adjustments below ₹5,000 are recorded and applied directly to the ledger.
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
              <Button variant="ghost" onClick={() => setShowProposeModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={!adjLoanId.trim() || adjReason.trim().length < 5 || proposeMutation.isPending}
                onClick={() => proposeMutation.mutate()}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
              >
                {proposeMutation.isPending ? 'Submitting...' : 'Submit Adjustment Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT ADJUSTMENT */}
      {rejectModalAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <h3 className="text-base font-bold">Reject Ledger Adjustment</h3>
            <p className="text-xs text-slate-400">
              Reject adjustment #{rejectModalAdj.adjustmentId} for ₹{Number(rejectModalAdj.amount).toLocaleString('en-IN')}.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Rejection Reason *</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State the audit / financial reason for rejection..."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
              <Button variant="ghost" onClick={() => setRejectModalAdj(null)}>
                Cancel
              </Button>
              <Button
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({
                    adjId: rejectModalAdj.adjustmentId,
                    reason: rejectionReason,
                  })
                }
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
