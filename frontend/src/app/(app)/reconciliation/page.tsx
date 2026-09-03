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
} from 'lucide-react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      alert(`Reconciliation complete: ${data.scannedCount} ledger items scanned, ${data.exceptionsFound} exceptions identified.`);
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
    },
    onError: (err: any) => {
      alert(`Reconciliation run failed: ${apiErrorMessage(err)}`);
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
        alert('Adjustment submitted to Maker-Checker queue (requires approval by Finance Officer or Admin).');
      } else {
        alert('Adjustment under threshold auto-approved and applied to ledger.');
      }
    },
    onError: (err: any) => {
      alert(`Propose adjustment failed: ${apiErrorMessage(err)}`);
    },
  });

  // Approve Adjustment Mutation
  const approveMutation = useMutation({
    mutationFn: async (adjId: string) => (await api.post(`/reconciliation/adjustments/${adjId}/approve`)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-adjustments'] });
      alert('Adjustment approved and ledger records reconciled.');
    },
    onError: (err: any) => {
      alert(`Approval failed: ${apiErrorMessage(err)}`);
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
      alert('Adjustment rejected.');
    },
    onError: (err: any) => {
      alert(`Rejection failed: ${apiErrorMessage(err)}`);
    },
  });

  const filteredExceptions = exceptions.filter((e: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.whatHappened.toLowerCase().includes(q) ||
      (e.loanNo && e.loanNo.toLowerCase().includes(q)) ||
      (e.reference && e.reference.toLowerCase().includes(q))
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const willRequireApproval = adjAmount >= 5000 || adjType === 'REVERSAL' || adjType === 'LEDGER_CORRECTION';

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Servicing / Accounting & Reconciliation"
        title="Advanced Accounting & Reconciliation"
        subtitle="Automated 5-pillar ledger reconciliation, mismatch exception tracking, and Maker-Checker financial adjustment controls"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowProposeModal(true)}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Propose Adjustment
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', runMutation.isPending && 'animate-spin')} />
              {runMutation.isPending ? 'Reconciling...' : 'Run Reconciliation Engine'}
            </Button>
          </div>
        }
      />

      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <KpiCard
          title="Recon Health"
          value={`${stats?.reconciliationHealthPercent ?? 100}%`}
          subtext="Volume match rate"
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Reconciled Volume"
          value={`₹${(stats?.totalReconciledVolume ?? 0).toLocaleString('en-IN')}`}
          subtext="Total successful payments"
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
        />
        <KpiCard
          title="Active Exceptions"
          value={String(stats?.totalActiveExceptions ?? 0)}
          subtext={`${stats?.criticalExceptionsCount ?? 0} critical mismatches`}
          icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
        />
        <KpiCard
          title="Pending Approvals"
          value={String(stats?.pendingAdjustmentsCount ?? 0)}
          subtext="Maker-Checker queue"
          icon={<UserCheck className="h-5 w-5 text-amber-600" />}
        />
        <KpiCard
          title="Discrepancy Volume"
          value={`₹${(stats?.totalDiscrepancyAmount ?? 0).toLocaleString('en-IN')}`}
          subtext="Unreconciled delta"
          icon={<Scale className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Tabs Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2445] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('EXCEPTIONS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'EXCEPTIONS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Financial Exceptions Queue ({exceptions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ADJUSTMENTS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'ADJUSTMENTS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              Adjustments & Maker-Checker ({adjustments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PILLARS')}
              className={cn(
                'px-3.5 py-1.5 font-bold rounded-lg transition-colors cursor-pointer',
                activeTab === 'PILLARS'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
              )}
            >
              5-Pillar Ledger Verifiers
            </button>
          </div>

          {activeTab === 'EXCEPTIONS' && (
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
              >
                <option value="OPEN">Open Exceptions</option>
                <option value="ADJUSTED">Adjusted</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'EXCEPTIONS' && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search exceptions by loan #, reference, UTR, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        )}
      </Card>

      {/* TAB 1: FINANCIAL EXCEPTIONS QUEUE */}
      {activeTab === 'EXCEPTIONS' && (
        <div className="space-y-3">
          {exceptionsLoading ? (
            <Card className="p-8 text-center space-y-2">
              <Spinner />
              <p className="text-xs text-slate-400">Loading reconciliation exceptions...</p>
            </Card>
          ) : filteredExceptions.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Financial Exceptions
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All payment allocations, amortization schedules, gateway submissions, and disbursement instructions reconcile cleanly against core ledger balances.
              </p>
            </Card>
          ) : (
            filteredExceptions.map((exc: any) => (
              <Card
                key={exc.exceptionId}
                className={cn(
                  'p-4.5 space-y-3 border transition-all',
                  exc.severity === 'CRITICAL' && 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase',
                        getSeverityBadge(exc.severity)
                      )}
                    >
                      {exc.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {exc.type}
                    </span>
                    {exc.loanNo && (
                      <Link
                        href={`/loans/${exc.loanId}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        Loan #{exc.loanNo} <ArrowRight className="h-3 w-3" />
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

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {exc.whatHappened}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    <strong>Evidence:</strong> {exc.evidence} (Source: {exc.source})
                  </p>
                  <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-200">
                    <strong>Recommended Action:</strong> {exc.recommendedAction}
                  </div>
                </div>

                {exc.status === 'OPEN' && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setAdjLoanId(exc.loanId || '');
                        setAdjExceptionId(exc.exceptionId);
                        setAdjAmount(exc.discrepancyAmount || 1000);
                        setAdjReason(`Resolution for ${exc.type}: ${exc.evidence}`);
                        setShowProposeModal(true);
                      }}
                      className="text-xs flex items-center gap-1 cursor-pointer"
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
              <p className="text-xs text-slate-400">Loading ledger adjustments...</p>
            </Card>
          ) : adjustments.length === 0 ? (
            <Card className="p-12 text-center space-y-2">
              <FileCheck className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Ledger Adjustments
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No manual ledger corrections or Maker-Checker adjustment requests have been recorded yet.
              </p>
            </Card>
          ) : (
            adjustments.map((adj: any) => (
              <Card key={adj.adjustmentId} className="p-4.5 space-y-3 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold">
                      {adj.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      #{adj.adjustmentId}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Loan #{adj.loanNo}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ₹{Number(adj.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        adj.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : adj.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {adj.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Rationale:</strong> {adj.reason}
                  </p>
                  <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
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
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
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
                      variant="primary"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(adj.adjustmentId)}
                      className="text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve & Apply to Ledger
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
          <Card className="p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Repayment Allocation Consistency
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verifies that the sum of payment allocation buckets (Principal, Interest, Fees, Penalty) precisely equals the captured transaction amount on every payment record.
            </p>
          </Card>

          <Card className="p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Outstanding Balance Consistency
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cross-validates that the Loan Master total outstanding principal matches the exact sum of remaining unpaid principal installments across the amortization schedule.
            </p>
          </Card>

          <Card className="p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Gateway / Submission Reconciliation
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scans verified borrower payment submissions and digital gateway webhooks to verify that every verified customer transfer has a corresponding ledger payment.
            </p>
          </Card>

          <Card className="p-4.5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                4. Duplicate Transaction Detection
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Continuously scans for multiple successful payments that share identical bank references or UTR strings, preventing accidental double-credits or accounting inflation.
            </p>
          </Card>

          <Card className="p-4.5 space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Disbursement Instruction vs Bank Status
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensures that all loans marked ACTIVE or OVERDUE in the lending portfolio have an electronic fund release instruction verified as COMPLETED by the banking gateway.
            </p>
          </Card>
        </div>
      )}

      {/* MODAL 1: PROPOSE ADJUSTMENT */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Propose Controlled Ledger Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                >
                  <option value="REALLOCATION">Bucket Reallocation (Principal vs Interest)</option>
                  <option value="REVERSAL">Payment Reversal (Refund / Double Debit)</option>
                  <option value="WAIVER">Fee or Penalty Waiver</option>
                  <option value="LEDGER_CORRECTION">Manual Ledger Balance Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Loan ID *
                </label>
                <Input
                  value={adjLoanId}
                  onChange={(e) => setAdjLoanId(e.target.value)}
                  placeholder="e.g. loan-uuid-string"
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Audit Rationale *
                </label>
                <textarea
                  rows={3}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Detail the accounting reason and documentary proof for this adjustment..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-transparent focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div
                className={cn(
                  'p-2.5 rounded-lg border text-[11px]',
                  willRequireApproval
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/40'
                )}
              >
                {willRequireApproval ? (
                  <span>
                    <strong>Maker-Checker Control:</strong> This adjustment exceeds ₹5,000 or is a reversal/correction, and will require formal approval by a Finance Officer or Admin.
                  </span>
                ) : (
                  <span>
                    <strong>Auto-Approve Threshold:</strong> Standard adjustments below ₹5,000 are recorded and applied directly under delegated authority.
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setShowProposeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!adjLoanId.trim() || adjReason.trim().length < 5 || proposeMutation.isPending}
                onClick={() => proposeMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {proposeMutation.isPending ? 'Submitting...' : 'Submit Adjustment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT ADJUSTMENT */}
      {rejectModalAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reject Ledger Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalAdj(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Reject adjustment #{rejectModalAdj.adjustmentId} for ₹{Number(rejectModalAdj.amount).toLocaleString('en-IN')}.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the audit / financial reason for rejection..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-transparent focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setRejectModalAdj(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({
                    adjId: rejectModalAdj.adjustmentId,
                    reason: rejectionReason,
                  })
                }
                className="text-xs cursor-pointer text-rose-600"
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
