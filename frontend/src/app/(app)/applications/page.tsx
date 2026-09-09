'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Send, RotateCcw, XCircle, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface AppRow {
  id: string;
  applicationNo: string;
  customerName: string;
  kycStatus?: string;
  riskCategory?: string;
  product: string;
  requestedAmount: string;
  tenureMonths: number;
  status: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Queue Modals State
  const [selectedAppForForward, setSelectedAppForForward] = useState<AppRow | null>(null);
  const [forwardReason, setForwardReason] = useState('Credit assessment verified & recommended for underwriting sanction');

  const [selectedAppForReject, setSelectedAppForReject] = useState<AppRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Loan Officer Submission Modal State
  const [selectedLoanOfficerApp, setSelectedLoanOfficerApp] = useState<AppRow | null>(null);
  const [loanOfficerSubmitReason, setLoanOfficerSubmitReason] = useState('Borrower intake & KYC documents completed. Submitted for credit appraisal.');

  const isCreditAnalyst = user?.roles?.includes('CREDIT_ANALYST');
  const isLoanOfficer = user?.roles?.includes('LOAN_OFFICER');
  const isCreditAnalystOrStaff = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'COMPANY_ADMIN'].includes(r)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/applications', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as AppRow[];
    },
  });

  // Loan Officer Forward / Resend Mutation
  const forwardMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason?: string }) => {
      return api.post(`/applications/${appId}/transition`, {
        toStatus: 'SUBMITTED',
        reason: reason || 'Application submitted to Credit Analyst queue by Loan Officer',
      });
    },
    onSuccess: () => {
      toast.success('Application submitted/forwarded to Credit Analyst queue.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedLoanOfficerApp(null);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Forward Application Notice' });
    },
  });

  // Forward / Re-Forward to Underwriting Mutation
  const forwardToUnderwritingMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      return api.post(`/applications/${appId}/transition`, {
        toStatus: 'UNDERWRITING',
        reason: reason || 'Application forwarded to Underwriting queue from applications list',
      });
    },
    onSuccess: () => {
      toast.success('Application successfully forwarded to Underwriting queue.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      setSelectedAppForForward(null);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriter Handoff Notice' });
    },
  });

  // Reject Application Mutation
  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      return api.post(`/applications/${appId}/transition`, {
        toStatus: 'REJECTED',
        reason: reason.trim() || 'Proposal rejected by reviewer from queue',
      });
    },
    onSuccess: () => {
      toast.success('Application proposal marked as REJECTED.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      setSelectedAppForReject(null);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Rejection Notice' });
    },
  });

  const columns: Column<AppRow>[] = [
    {
      key: 'applicationNo',
      header: 'Application No',
      render: (r) => (
        <Link href={`/applications/${r.id}`} className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.applicationNo}
        </Link>
      ),
    },
    { key: 'customerName', header: 'Borrower' },
    {
      key: 'kycStatus' as any,
      header: 'KYC Status',
      render: (r) => <Badge status={r.kycStatus || 'NOT_STARTED'} />,
    },
    { key: 'product', header: 'Loan Product' },
    {
      key: 'requestedAmount',
      header: 'Sanction Amount',
      render: (r) => <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{formatMoney(r.requestedAmount || 0)}</span>,
    },
    { key: 'tenureMonths', header: 'Tenure', render: (r) => `${r.tenureMonths || 0} mos` },
    { key: 'status', header: 'Lifecycle Status', render: (r) => <Badge status={r.status} /> },
    { key: 'createdAt', header: 'Submitted On', render: (r) => (r.createdAt ? formatDate(r.createdAt) : '-') },
    {
      key: 'id',
      header: 'Action',
      align: 'right',
      className: 'min-w-[340px] text-right',
      render: (r) => {
        const canForwardToUnderwriter =
          isCreditAnalystOrStaff &&
          ['DRAFT', 'SUBMITTED', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(r.status);
        const canReject =
          isCreditAnalystOrStaff &&
          !['REJECTED', 'DISBURSED', 'CANCELLED', 'APPROVED'].includes(r.status);

        return (
          <div className="flex flex-row items-center justify-end gap-2 whitespace-nowrap">
            {/* 1. Review Button */}
            <Link href={`/applications/${r.id}`}>
              <Button size="sm" variant="secondary" className="h-8 px-3 text-xs font-semibold shrink-0 cursor-pointer">
                Review
              </Button>
            </Link>

            {/* 2. Forward to Underwriter / Re-Forward Button */}
            {canForwardToUnderwriter && (
              <Button
                size="sm"
                disabled={forwardToUnderwritingMutation.isPending}
                onClick={() => {
                  setSelectedAppForForward(r);
                  setForwardReason(
                    r.status === 'UNDERWRITING'
                      ? 'Application re-forwarded to Underwriting queue for re-appraisal'
                      : 'Credit assessment verified & recommended for underwriting sanction'
                  );
                }}
                className={cn(
                  'h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs whitespace-nowrap transition-all',
                  r.status === 'UNDERWRITING'
                    ? 'bg-slate-700 hover:bg-slate-800 text-white'
                    : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                )}
                title={r.status === 'UNDERWRITING' ? 'Re-Forward to Underwriter' : 'Forward to Underwriter'}
              >
                {r.status === 'UNDERWRITING' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Re-Forward
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Forward to Underwriter
                  </>
                )}
              </Button>
            )}

            {/* Loan Officer Forward / Resend to Credit Analyst */}
            {isLoanOfficer && (
              r.status === 'DRAFT' ? (
                <Button
                  size="sm"
                  disabled={forwardMutation.isPending}
                  onClick={() => {
                    setSelectedLoanOfficerApp(r);
                    setLoanOfficerSubmitReason('Borrower intake & KYC documents completed. Submitted for credit appraisal.');
                  }}
                  className="h-8 px-3 text-xs bg-[#2563EB] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Forward application to Credit Analyst queue"
                >
                  <Send className="w-3.5 h-3.5" /> Forward to Credit Analyst
                </Button>
              ) : ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW', 'UNDERWRITING'].includes(r.status) ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={forwardMutation.isPending}
                  onClick={() => {
                    setSelectedLoanOfficerApp(r);
                    setLoanOfficerSubmitReason('Application re-forwarded to Credit Analyst queue for re-evaluation');
                  }}
                  className="h-8 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Proposal submitted. Click to resend / re-forward to Credit Analyst queue."
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Resend to Credit Analyst
                </Button>
              ) : null
            )}

            {/* 3. Reject Application Button */}
            {canReject && (
              <Button
                size="sm"
                variant="outline-danger"
                disabled={rejectApplicationMutation.isPending}
                onClick={() => {
                  setSelectedAppForReject(r);
                  setRejectReason('');
                }}
                className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 whitespace-nowrap"
                title="Reject this loan application proposal"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Reject
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Lending / Applications"
        title={isCreditAnalyst ? 'Credit Analyzed Applications' : 'Loan Applications Queue'}
        subtitle={
          isCreditAnalyst
            ? 'Monitor proposal lifecycle across appraisal, credit recommendations, and underwriter handoffs'
            : 'Manage and track borrowing requests through eligibility, scoring, and underwriting'
        }
        action={
          !isCreditAnalyst ? (
            <Link href="/applications/new">
              <Button className="flex items-center gap-1.5 text-white">
                <Plus className="h-4 w-4" /> Originate Application
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search application # or borrower..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "h-9 rounded-xl border px-3 text-xs font-semibold shadow-sm focus:border-[#2563EB] focus:outline-none",
            isDark
              ? "border-[#2B3566] bg-[#1E2445] text-slate-200"
              : "border-slate-200 bg-white text-slate-700"
          )}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="UNDERWRITING">UNDERWRITING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="READY_FOR_DISBURSEMENT">READY_FOR_DISBURSEMENT</option>
          <option value="DISBURSED">DISBURSED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No loan applications found"
        emptyDescription="Originate a new application using the loan intake wizard."
        emptyAction={
          <Link href="/applications/new">
            <Button size="sm" className="text-white">+ Originate Application</Button>
          </Link>
        }
      />

      {/* FORWARD / RE-FORWARD TO UNDERWRITER MODAL */}
      {selectedAppForForward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {selectedAppForForward.status === 'UNDERWRITING'
                      ? 'Re-Forward to Underwriter'
                      : 'Forward to Underwriter'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Handoff appraised proposal to Underwriting sanction queue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForForward(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono text-blue-600 font-bold">{selectedAppForForward.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: {selectedAppForForward.customerName} ({formatMoney(selectedAppForForward.requestedAmount)})
                </p>
                <p className="text-[11px] text-slate-400">
                  Current Status: <span className="font-bold">{selectedAppForForward.status}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Credit Appraisal Notes & Recommendation *
                </label>
                <textarea
                  rows={3}
                  value={forwardReason}
                  onChange={(e) => setForwardReason(e.target.value)}
                  placeholder="Summarize appraisal verdict, policy exceptions, or sanction recommendations..."
                  className={cn(
                    'w-full text-xs rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedAppForForward(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={forwardToUnderwritingMutation.isPending}
                  onClick={() =>
                    forwardToUnderwritingMutation.mutate({
                      appId: selectedAppForForward.id,
                      reason: forwardReason,
                    })
                  }
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  {forwardToUnderwritingMutation.isPending ? (
                    'Forwarding...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Confirm & Forward
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT APPLICATION MODAL */}
      {selectedAppForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">
                    Reject Loan Application
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide reason to decline proposal #{selectedAppForReject.applicationNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForReject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-[#2A1520] text-xs space-y-1 border border-rose-200/50 dark:border-rose-900/40">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono font-bold text-rose-600">{selectedAppForReject.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: {selectedAppForReject.customerName} ({formatMoney(selectedAppForReject.requestedAmount)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Decline Reason / Policy Violation *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. High FOIR > 70%, poor repayment history, unverified KYC documents, or policy breach..."
                  className={cn(
                    'w-full text-xs rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-rose-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedAppForReject(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!rejectReason.trim() || rejectApplicationMutation.isPending}
                  onClick={() =>
                    rejectApplicationMutation.mutate({
                      appId: selectedAppForReject.id,
                      reason: rejectReason,
                    })
                  }
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {rejectApplicationMutation.isPending ? (
                    'Rejecting...'
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOAN OFFICER FORWARD / RESEND MODAL */}
      {selectedLoanOfficerApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {selectedLoanOfficerApp.status === 'DRAFT'
                      ? 'Forward to Credit Analyst'
                      : 'Resend to Credit Analyst'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedLoanOfficerApp.status === 'DRAFT'
                      ? 'Submit completed intake for credit appraisal'
                      : 'Re-submit application to Credit Analyst queue'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLoanOfficerApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono text-blue-600 font-bold">{selectedLoanOfficerApp.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: {selectedLoanOfficerApp.customerName} ({formatMoney(selectedLoanOfficerApp.requestedAmount)})
                </p>
                <p className="text-[11px] text-slate-400">
                  Current Status: <span className="font-bold">{selectedLoanOfficerApp.status}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Intake & Field Verification Note *
                </label>
                <textarea
                  rows={3}
                  value={loanOfficerSubmitReason}
                  onChange={(e) => setLoanOfficerSubmitReason(e.target.value)}
                  placeholder="Field verification remarks, document completeness notes, or branch observations..."
                  className={cn(
                    'w-full text-xs rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark ? 'bg-[#101326] border-[#2B3566] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedLoanOfficerApp(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={forwardMutation.isPending}
                  onClick={() =>
                    forwardMutation.mutate({
                      appId: selectedLoanOfficerApp.id,
                      reason: loanOfficerSubmitReason,
                    })
                  }
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  {forwardMutation.isPending ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {selectedLoanOfficerApp.status === 'DRAFT' ? 'Confirm & Forward' : 'Confirm & Resend'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
