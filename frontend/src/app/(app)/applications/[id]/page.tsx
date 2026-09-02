'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Calculator,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Building,
  User,
  ArrowRight,
  RotateCcw,
  X,
  FileCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { CreditIntelligenceCard } from '@/components/CreditIntelligenceCard';
import { UnderwritingIntelligenceCard } from '@/components/UnderwritingIntelligenceCard';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Modals state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [conditions, setConditions] = useState('');

  // Credit Analyst Action Modals
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardReason, setForwardReason] = useState('Credit assessment verified & recommended for underwriting sanction');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['application', params.id],
    queryFn: async () => (await api.get(`/applications/${params.id}`)).data.data,
  });

  // Evaluate Eligibility
  const eligibilityMutation = useMutation({
    mutationFn: async () => api.post(`/eligibility/evaluate/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
    },
  });

  // Evaluate Risk
  const riskMutation = useMutation({
    mutationFn: async () => api.post(`/risk/evaluate/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
    },
  });

  // Forward to Underwriting Mutation
  const forwardMutation = useMutation({
    mutationFn: async () =>
      api.post(`/applications/${params.id}/transition`, {
        toStatus: 'UNDERWRITING',
        reason: forwardReason.trim() || 'Forwarded to Underwriting by Credit Analyst',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      setForwardModalOpen(false);
    },
    onError: (err: any) => {
      alert(apiErrorMessage(err));
    },
  });

  // Direct Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async () =>
      api.post(`/applications/${params.id}/transition`, {
        toStatus: 'REJECTED',
        reason: rejectReason.trim() || 'Application rejected by Credit Analyst',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      setRejectModalOpen(false);
    },
    onError: (err: any) => {
      alert(apiErrorMessage(err));
    },
  });

  // Submit Final Underwriting Decision (Approve/Reject/Send Back)
  const decisionMutation = useMutation({
    mutationFn: async () =>
      api.post(`/underwriting/${params.id}/decision`, {
        decision,
        reason,
        conditions: conditions || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', params.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setDecisionModalOpen(false);
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-slate-700 font-semibold">Application record not found or could not be loaded.</p>
        <p className="text-xs text-slate-400">{error ? apiErrorMessage(error) : 'Check application ID or permissions'}</p>
        <Link href="/applications">
          <Button size="sm" variant="secondary">Back to Applications Queue</Button>
        </Link>
      </div>
    );
  }

  const customer = data.customer || {};
  const product = data.product || {};
  const eligibility = data.eligibility;
  const riskAssessment = data.riskAssessment;

  const isStaff = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'LOAN_OFFICER'].includes(r)
  );

  const canForwardToUnderwriting =
    isStaff &&
    ['DRAFT', 'SUBMITTED', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT'].includes(data.status);

  const canReject =
    isStaff &&
    ['DRAFT', 'SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(data.status);

  const canMakeUnderwritingDecision =
    user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER'].includes(r)) &&
    ['UNDERWRITING', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW'].includes(data.status);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Applications / Review"
        title={`Application #${data.applicationNo || 'N/A'}`}
        subtitle={`Submitted on ${data.createdAt ? formatDate(data.createdAt) : 'N/A'} · Loan Product: ${product.name || 'General Loan'}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status={data.status} />

            {/* 1. Forward to Underwriting Button (Credit Analyst / Staff) */}
            {canForwardToUnderwriting && (
              <Button
                size="sm"
                onClick={() => setForwardModalOpen(true)}
                className="gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Forward to Underwriting
              </Button>
            )}

            {/* 2. Direct Underwriter Decision Actions (Approve / Reject / Detailed) */}
            {canMakeUnderwritingDecision && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setDecision('APPROVE');
                    setReason('Credit proposal verified and approved for sanction.');
                    setConditions('');
                    setDecisionModalOpen(true);
                  }}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Loan
                </Button>

                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    setDecision('REJECT');
                    setReason('');
                    setConditions('');
                    setDecisionModalOpen(true);
                  }}
                  className="gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Reject Loan
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDecisionModalOpen(true)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Full Decision / Conditions
                </Button>
              </>
            )}

            {/* 3. If already Approved/Rejected, allow Underwriter to Modify */}
            {['APPROVED', 'REJECTED'].includes(data.status) && isStaff && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDecision(data.status === 'APPROVED' ? 'APPROVE' : 'REJECT');
                  setReason(data.underwriting?.reason || '');
                  setConditions('');
                  setDecisionModalOpen(true);
                }}
                className="gap-1.5 text-xs cursor-pointer flex items-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                Modify Decision
              </Button>
            )}

            {/* 4. Proceed to Payout (Finance Officer / Admin) */}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'].includes(r)) &&
              data.status === 'APPROVED' && (
                <Link href="/disbursements">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    Proceed to Payout →
                  </Button>
                </Link>
              )}
          </div>
        }
      />

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Requested Sanction"
          value={formatMoney(data.requestedAmount || 0)}
          hint={`${data.tenureMonths || 0} Months tenure`}
          icon={<Calculator className="h-4 w-4" />}
        />
        <KpiCard
          label="Borrower"
          value={`${customer.firstName || 'Borrower'} ${customer.lastName || ''}`}
          hint={`ID: ${customer.customerCode || 'N/A'}`}
          icon={<User className="h-4 w-4" />}
        />
        <KpiCard
          label="Eligibility Assessment"
          value={eligibility?.result || 'NOT ASSESSED'}
          hint={eligibility ? 'Policy criteria evaluated' : 'Pending engine run'}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Credit Risk Score"
          value={riskAssessment ? `${riskAssessment.score}/100` : 'PENDING'}
          hint={riskAssessment?.category ? `${riskAssessment.category} Risk` : 'Awaiting credit scoring'}
          icon={<ShieldCheck className="h-4 w-4 text-brand-700" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Borrower & Terms */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Borrower Profile</h3>
            <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
              <Row label="Customer ID" value={<span className="font-mono font-bold text-blue-600">{customer.customerCode}</span>} />
              <Row label="Mobile" value={customer.mobile} />
              <Row label="Email" value={customer.email || '-'} />
              <Row label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : '-'} />
              <Row label="Existing Debt" value={customer.existingObligations ? formatMoney(customer.existingObligations) : '₹0.00'} />
              <Row label="KYC Status" value={<Badge status={customer.kycStatus || 'NOT_STARTED'} />} />
              <Row label="Risk Category" value={<Badge status={customer.riskCategory || 'PENDING'} />} />
            </dl>
            <div className="pt-2">
              <Link href={`/customers/${customer.id}`}>
                <Button size="sm" variant="ghost" className="w-full text-xs">View Customer 360 →</Button>
              </Link>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Product Terms</h3>
            <dl className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
              <Row label="Product Name" value={product.name || 'General Loan'} />
              <Row label="Product Code" value={<span className="font-mono">{product.code || '-'}</span>} />
              <Row label="Interest Rate" value={`${product.interestRate || '14.5'}% p.a.`} />
              <Row label="Tenure Boundaries" value={`${product.minTenureMonths || 6} - ${product.maxTenureMonths || 60} mos`} />
              <Row label="Method" value={product.interestMethod || 'REDUCING'} />
              <Row label="Processing Fee" value={`${product.processingFeePct || 0}%`} />
            </dl>
          </Card>
        </div>

        {/* Right Column: AI Decision Support, Rule Engine & Risk Model */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Underwriting Decision Support Briefing */}
          <UnderwritingIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

          {/* AI Credit Intelligence & Decision Support Card */}
          <CreditIntelligenceCard applicationId={params.id} applicationNo={data.applicationNo} />

          {/* 1. Rule-Based Eligibility Engine Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Rule-Based Eligibility Engine</h3>
                <p className="text-xs text-slate-400">Automated policy checks: Age, DTI, Income threshold, and Bureau history</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={eligibilityMutation.isPending}
                onClick={() => eligibilityMutation.mutate()}
              >
                {eligibilityMutation.isPending ? 'Evaluating...' : eligibility ? 'Re-Run Eligibility' : 'Run Eligibility Check'}
              </Button>
            </div>

            {eligibility ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">ENGINE RESULT:</span>
                  <Badge status={eligibility.result} />
                </div>

                <div className="space-y-2">
                  {Array.isArray(eligibility.factors) &&
                    eligibility.factors.map((f: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3 text-xs',
                          f.status === 'PASS'
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : f.status === 'WARNING'
                            ? 'border-amber-200 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                            : 'border-rose-200 bg-rose-50/50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300'
                        )}
                      >
                        {f.status === 'PASS' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {f.status === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                        {f.status === 'FAIL' && <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                        <div>
                          <p className="font-bold">{f.factor}</p>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">{f.detail}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-[#2B3566]">
                Click &quot;Run Eligibility Check&quot; to execute automated policy criteria against borrower attributes.
              </div>
            )}
          </Card>

          {/* 2. 4-Pillar Credit Risk Scoring Engine */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">4-Pillar Credit Risk Scoring Model</h3>
                <p className="text-xs text-slate-400">Vintage (25%), DTI Capacity (30%), Document KYC (20%), and Bureau Performance (25%)</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={riskMutation.isPending}
                onClick={() => riskMutation.mutate()}
              >
                {riskMutation.isPending ? 'Calculating...' : riskAssessment ? 'Re-Score Risk' : 'Calculate Risk Score'}
              </Button>
            </div>

            {riskAssessment ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#2563EB]">{riskAssessment.score}</span>
                    <span className="text-xs font-semibold text-slate-400">/ 100</span>
                  </div>
                  <Badge status={riskAssessment.category} />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Array.isArray(riskAssessment.factors) &&
                    riskAssessment.factors.map((rf: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-100 p-3 text-xs dark:border-[#2B3566] dark:bg-[#1E2445]/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{rf.name}</span>
                          <span className="font-mono font-bold text-blue-600">{rf.score} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{rf.remarks}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-[#2B3566]">
                Click &quot;Calculate Risk Score&quot; to generate automated score and risk tier categorization.
              </div>
            )}
          </Card>

          {/* 3. Status History Inspection Trail */}
          <Card className="space-y-3">
            <h3 className="text-sm font-bold">Lifecycle Audit Trail</h3>
            <div className="divide-y divide-slate-100 text-xs dark:divide-[#2B3566]">
              {Array.isArray(data.statusHistory) && data.statusHistory.length > 0 ? (
                data.statusHistory.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge status={h.toStatus} />
                        <span className="text-slate-400">by {h.changedBy || 'System Engine'}</span>
                      </div>
                      {h.reason && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">{h.reason}</p>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(h.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">No lifecycle events recorded yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL 1: FORWARD TO UNDERWRITING MODAL */}
      {forwardModalOpen && (
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
                  <h3 className="font-bold text-base">Forward to Underwriting</h3>
                  <p className="text-xs text-slate-400">Submit application to Underwriting Queue</p>
                </div>
              </div>
              <button
                onClick={() => setForwardModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#1E2445] text-xs space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Application: <span className="font-mono text-blue-600 font-bold">{data.applicationNo}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Borrower: {customer.firstName} {customer.lastName} ({formatMoney(data.requestedAmount)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Credit Analyst Assessment Note / Recommendation *
                </label>
                <textarea
                  rows={3}
                  value={forwardReason}
                  onChange={(e) => setForwardReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="Enter notes for Underwriter..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setForwardModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!forwardReason.trim() || forwardMutation.isPending}
                  onClick={() => forwardMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {forwardMutation.isPending ? 'Submitting...' : 'Confirm & Forward'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT APPLICATION MODAL */}
      {rejectModalOpen && (
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
                  <h3 className="font-bold text-base">Reject Loan Application</h3>
                  <p className="text-xs text-slate-400">Record formal decline rationale</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
                This action will mark Application <span className="font-bold font-mono">{data.applicationNo}</span> as REJECTED and notify the borrower.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Rejection Reason / Decline Rationale *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-rose-500 focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  placeholder="e.g. Inadequate debt service capacity (DTI > 55%), KYC discrepancy..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}
                  className="font-semibold gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UNDERWRITING SANCTION DECISION MODAL */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div>
                <h3 className="font-bold text-base">Underwriting Decision Desk</h3>
                <p className="text-xs text-slate-400">Record final credit sanction or rejection</p>
              </div>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Decision Outcome *
                </label>
                <select
                  className={cn(
                    'h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  )}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                >
                  <option value="APPROVE">APPROVE (Sanction Loan)</option>
                  <option value="APPROVE_WITH_CONDITIONS">APPROVE WITH CONDITIONS</option>
                  <option value="SEND_BACK">SEND BACK (Request Documents / Info)</option>
                  <option value="REJECT">REJECT (Decline Application)</option>
                </select>
              </div>

              {decision === 'APPROVE_WITH_CONDITIONS' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Conditions Required
                  </label>
                  <Input
                    placeholder="e.g. Requires co-applicant guarantee, PDC cheques"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Rationale / Remarks *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed credit assessment remarks..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-white' : 'border-slate-300 bg-white text-slate-900'
                  )}
                  required
                />
              </div>

              {decisionMutation.isError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 text-xs">
                  {apiErrorMessage(decisionMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setDecisionModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!reason.trim() || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
                >
                  {decisionMutation.isPending ? 'Recording...' : 'Commit Decision'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-500 font-medium">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-200">{value ?? '-'}</dd>
    </div>
  );
}
