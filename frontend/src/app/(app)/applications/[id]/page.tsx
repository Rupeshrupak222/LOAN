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
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [conditions, setConditions] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['application', params.id],
    queryFn: async () => (await api.get(`/applications/${params.id}`)).data.data,
  });

  // Evaluate Eligibility
  const eligibilityMutation = useMutation({
    mutationFn: async () => api.post(`/eligibility/evaluate/${params.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['application', params.id] }),
  });

  // Evaluate Risk
  const riskMutation = useMutation({
    mutationFn: async () => api.post(`/risk/evaluate/${params.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['application', params.id] }),
  });

  // Submit Decision
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-count'] });
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Applications / Review"
        title={`Application #${data.applicationNo || 'N/A'}`}
        subtitle={`Submitted on ${data.createdAt ? formatDate(data.createdAt) : 'N/A'} · Loan Product: ${product.name || 'General Loan'}`}
        action={
          <div className="flex items-center gap-2">
            <Badge status={data.status} />
            {['SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(data.status) && (
              <Button size="sm" onClick={() => setDecisionModalOpen(true)}>
                Underwriting Decision
              </Button>
            )}
            {data.status === 'APPROVED' && (
              <Link href="/disbursements">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
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
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Borrower Profile</h3>
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <Row
                label="Customer ID"
                value={
                  customer.id ? (
                    <Link href={`/customers/${customer.id}`} className="text-brand-700 font-bold hover:underline">
                      {customer.customerCode || 'View'}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <Row label="Mobile" value={customer.mobile} />
              <Row label="Email" value={customer.email || '-'} />
              <Row label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : '-'} />
              <Row label="Existing Debt" value={customer.existingObligations ? formatMoney(customer.existingObligations) : '₹0.00'} />
              <Row label="KYC Status" value={<Badge status={customer.kycStatus} />} />
              <Row label="Risk Category" value={<Badge status={customer.riskCategory || 'PENDING'} />} />
            </div>
            {customer.id && (
              <div className="pt-2">
                <Link href={`/customers/${customer.id}`}>
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    View Customer 360 →
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Loan Product Terms</h3>
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <Row label="Product Name" value={product.name || 'Standard Loan'} />
              <Row label="Interest Rate" value={`${product.interestRate || '14.5'}% p.a.`} />
              <Row label="Processing Fee" value={`${product.processingFeePct || '1.5'}%`} />
              <Row label="Purpose" value={data.purpose || '-'} />
            </div>
          </Card>
        </div>

        {/* Right Column: Engines & Decisioning */}
        <div className="space-y-6 lg:col-span-2">
          {/* Eligibility Engine Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rule-Based Eligibility Engine
                </h3>
                <p className="text-xs text-slate-500">Automated policy checks: Age, DTI, Income threshold, and Bureau history</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={eligibilityMutation.isPending}
                onClick={() => eligibilityMutation.mutate()}
                className="text-xs"
              >
                {eligibilityMutation.isPending ? 'Evaluating...' : 'Re-Run Eligibility'}
              </Button>
            </div>

            {eligibility ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Engine Result:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      eligibility.result === 'ELIGIBLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : eligibility.result === 'CONDITIONALLY_ELIGIBLE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {eligibility.result}
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.isArray(eligibility.factors) &&
                    eligibility.factors.map((f: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                        {f.status === 'PASS' && <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-none mt-0.5" />}
                        {f.status === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-500 flex-none mt-0.5" />}
                        {f.status === 'FAIL' && <XCircle className="h-4 w-4 text-rose-600 flex-none mt-0.5" />}
                        <div>
                          <p className="font-semibold text-slate-900">{f.factor}</p>
                          <p className="text-slate-500 mt-0.5">{f.detail}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-500 mb-2">Eligibility engine has not been evaluated for this application.</p>
                <Button size="sm" onClick={() => eligibilityMutation.mutate()}>
                  Run Eligibility Engine Now
                </Button>
              </div>
            )}
          </Card>

          {/* Credit Risk Scoring Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credit Risk Model</h3>
                <p className="text-xs text-slate-500">4-Pillar weighted score based on debt burden, income stability, and track record</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={riskMutation.isPending}
                onClick={() => riskMutation.mutate()}
                className="text-xs"
              >
                {riskMutation.isPending ? 'Scoring...' : 'Compute Risk Score'}
              </Button>
            </div>

            {riskAssessment ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-lg shadow-sm">
                    {riskAssessment.score}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Risk Categorization</p>
                    <p className="text-sm font-bold text-slate-900">{riskAssessment.category} RISK</p>
                    <p className="text-xs text-slate-500">Score evaluated across 4 credit risk pillars</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                  {Array.isArray(riskAssessment.factors) &&
                    riskAssessment.factors.map((f: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-slate-800">{f.name}</span>
                          <span className="font-bold text-brand-700">{f.score}/100</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{f.remarks}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-500 mb-2">Risk model has not been executed.</p>
                <Button size="sm" onClick={() => riskMutation.mutate()}>
                  Calculate Credit Risk Score
                </Button>
              </div>
            )}
          </Card>

          {/* Underwriting Decision Summary */}
          {data.underwriting && (
            <Card className="p-5 border-l-4 border-l-brand-600 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Underwriter Sanction Record</h4>
                <span className="text-xs font-bold text-brand-700 px-2.5 py-0.5 bg-brand-50 border border-brand-200 rounded-md">
                  {data.underwriting.decision}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-medium">{data.underwriting.reason}</p>
              <p className="text-[11px] text-slate-400">Decided by: {data.underwriting.decidedBy} · {formatDate(data.underwriting.createdAt)}</p>
            </Card>
          )}

          {/* Lifecycle Status Timeline */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status Audit History</h3>
            <div className="space-y-3">
              {Array.isArray(data.statusHistory) && data.statusHistory.length > 0 ? (
                data.statusHistory.map((h: any) => (
                  <div key={h.id} className="flex gap-3 text-xs">
                    <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold mt-0.5">
                      •
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {h.fromStatus ? `${h.fromStatus} → ` : ''}
                        <span className="text-brand-700 font-bold">{h.toStatus}</span>
                      </p>
                      {h.reason && <p className="text-slate-600 mt-0.5">{h.reason}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">By {h.changedBy || 'System'} on {formatDate(h.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Initial submission record created.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Underwriting Decision Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Underwriter Sanction Decision</h3>
              <p className="text-xs text-slate-500">Record credit decision and sanction limits</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="APPROVE">APPROVE (Sanction Loan)</option>
                  <option value="APPROVE_WITH_CONDITIONS">APPROVE WITH CONDITIONS</option>
                  <option value="SEND_BACK">SEND BACK (Request Documents / Info)</option>
                  <option value="REJECT">REJECT (Decline Application)</option>
                </select>
              </div>

              {decision === 'APPROVE_WITH_CONDITIONS' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conditions Required</label>
                  <Input
                    placeholder="e.g. Requires co-applicant guarantee, PDC cheques"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rationale / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Detailed credit assessment remarks..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              {decisionMutation.isError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {apiErrorMessage(decisionMutation.error)}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!reason.trim() || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate()}
                  className="flex-1"
                >
                  {decisionMutation.isPending ? 'Recording...' : 'Commit Decision'}
                </Button>
                <Button variant="secondary" onClick={() => setDecisionModalOpen(false)}>
                  Cancel
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
      <dd className="text-right font-medium text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}
