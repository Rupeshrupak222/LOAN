'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  RefreshCw,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  User,
  ArrowRight,
  ShieldAlert,
  Receipt,
  Scale,
  Clock,
  XCircle,
  Send,
  History,
  AlertTriangle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { DetailPageSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  // Role separation checks
  const isCustomer = user?.roles?.includes('CUSTOMER');
  const isCollectionOfficer = user?.roles?.includes('COLLECTION_OFFICER');
  const isFinanceOfficer =
    user?.roles?.includes('FINANCE_OFFICER') &&
    !user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
  const canCollectRepayment =
    isCustomer || user?.roles?.some((r: string) => ['COLLECTION_OFFICER', 'SUPER_ADMIN', 'ADMIN'].includes(r));
  const canVerifyFinance =
    user?.roles?.some((r: string) => ['FINANCE_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(r));

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payReference, setPayReference] = useState('');
  const [payMobile, setPayMobile] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Rejection/Exception modal for Finance Officer
  const [rejectModalSubId, setRejectModalSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment mismatch with bank credit records');

  const [restructureModalOpen, setRestructureModalOpen] = useState(false);
  const [newTenure, setNewTenure] = useState(36);
  const [newRate, setNewRate] = useState(13.5);
  const [restructureReason, setRestructureReason] = useState('');

  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleReason, setSettleReason] = useState('');

  const [nocModalOpen, setNocModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['loan', params.id],
    queryFn: async () => (await api.get(`/loans/${params.id}`)).data.data,
  });

  // 1. Borrower Payment Submission Mutation (for customer self-intimation)
  const submissionMutation = useMutation({
    mutationFn: async () =>
      api.post('/payments/submissions', {
        loanId: params.id,
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference,
        payerMobile: payMobile || (data?.customer?.mobile || undefined),
        notes: payNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Repayment submission initiated successfully.');
      setSubmitSuccess(true);
      setTimeout(() => {
        setPayModalOpen(false);
        setSubmitSuccess(false);
        setPayAmount('');
        setPayReference('');
        setPayNotes('');
      }, 1500);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Repayment Submission Notice' });
    },
  });

  // 2. Collection Officer Collect Repayment Mutation (submits to Finance verification)
  const collectRepaymentMutation = useMutation({
    mutationFn: async () =>
      api.post('/payments/collect', {
        loanId: params.id,
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference,
        payerMobile: payMobile || (data?.customer?.mobile || undefined),
        notes: payNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(
        'Repayment Recorded',
        `Repayment collection of ₹${Number(payAmount).toLocaleString('en-IN')} recorded successfully. Submitted for Finance verification & reconciliation.`
      );
      setSubmitSuccess(true);
      setTimeout(() => {
        setPayModalOpen(false);
        setSubmitSuccess(false);
        setPayAmount('');
        setPayReference('');
        setPayNotes('');
      }, 1500);
    },
    onError: (err: any) => {
      toast.error('Collection Recording Failed', apiErrorMessage(err));
    },
  });

  // 3. Finance Officer Verify Submission Mutation
  const verifySubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) =>
      api.post(`/payments/submissions/${submissionId}/verify`),
    onSuccess: () => {
      toast.success(
        'Payment Verified & Settled',
        'Payment verified and settled into double-entry accounting ledger via waterfall allocation.'
      );
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error('Verification Failed', apiErrorMessage(err));
    },
  });

  // 4. Finance Officer Reject / Exception Mutation
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) =>
      api.post(`/payments/submissions/${submissionId}/reject`, { reason }),
    onSuccess: () => {
      toast.warning('Payment Submission Rejected', 'Payment exception recorded and borrower/collector notified.');
      setRejectModalSubId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
    },
    onError: (err: any) => {
      toast.error('Exception Handling Failed', apiErrorMessage(err));
    },
  });

  // Restructure Mutation
  const restructureMutation = useMutation({
    mutationFn: async () =>
      api.post('/restructuring/restructure', {
        loanId: params.id,
        newTenureMonths: Number(newTenure),
        newInterestRate: Number(newRate),
        reason: restructureReason,
      }),
    onSuccess: () => {
      toast.success('Loan restructuring applied successfully.');
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRestructureModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Restructuring Notice' });
    },
  });

  // Settlement Mutation
  const settlementMutation = useMutation({
    mutationFn: async () =>
      api.post('/restructuring/settle', {
        loanId: params.id,
        settlementAmount: Number(settleAmount),
        reason: settleReason,
      }),
    onSuccess: () => {
      toast.success('One-Time Settlement applied. Loan account status updated.');
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSettleModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Settlement Processing Notice' });
    },
  });

  if (isLoading) return <DetailPageSkeleton />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-slate-700 font-semibold">Loan account not found or could not be loaded.</p>
        <p className="text-xs text-slate-400">{error ? apiErrorMessage(error) : 'Check loan ID or permissions'}</p>
        <Link href="/loans">
          <Button size="sm" variant="secondary">Back to Loan Accounts</Button>
        </Link>
      </div>
    );
  }

  const customer = data.customer || {};
  const product = data.product || {};
  const branch = data.branch || {};
  const metrics = data.metrics || {};
  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  const submissions = Array.isArray(data.paymentSubmissions) ? data.paymentSubmissions : [];
  const settledPayments = Array.isArray(data.payments) ? data.payments : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Lending / Loan Accounts"
        title={`Loan Account #${data.loanNo || 'N/A'}`}
        subtitle={`${product.name || 'Loan'} · Borrower: ${customer.firstName || 'Customer'} ${customer.lastName || ''} (${customer.customerCode || 'N/A'})`}
        action={
          <div className="flex items-center gap-2">
            <Badge status={data.status} />
            {data.status !== 'CLOSED' && data.status !== 'SETTLED' && (
              <>
                {/* Collection Officer / Customer: Primary Repayment Collection Action */}
                {(canCollectRepayment || user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER'].includes(r))) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPayAmount(String(data.emiAmount || ''));
                      setPayModalOpen(true);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 text-white font-semibold shadow-sm",
                      isCustomer ? "bg-[#2563EB] hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {isCustomer ? 'Submit EMI Payment Proof' : 'Collect Repayment'}
                  </Button>
                )}

                {/* Finance Officer: Accounting & Verification Actions (NOT primary collection) */}
                {isFinanceOfficer && (
                  <>
                    <Link href={`/payments?loanId=${data.id}`}>
                      <Button size="sm" variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold">
                        <Receipt className="h-3.5 w-3.5 text-[#2563EB]" />
                        Verify Payments & Ledger
                      </Button>
                    </Link>
                    <Link href="/reconciliation">
                      <Button size="sm" variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold">
                        <Scale className="h-3.5 w-3.5 text-purple-600" />
                        Reconcile
                      </Button>
                    </Link>
                  </>
                )}

                {/* Branch Manager / Admin / Finance Actions */}
                {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'FINANCE_OFFICER'].includes(r)) && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setRestructureModalOpen(true)}>
                      Restructure
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSettleModalOpen(true)}>
                      Settlement
                    </Button>
                  </>
                )}
              </>
            )}
            {data.status === 'CLOSED' && (
              <Button size="sm" onClick={() => setNocModalOpen(true)} className="flex items-center gap-1.5 bg-brand-700">
                <FileCheck className="h-3.5 w-3.5" /> View Digital NOC
              </Button>
            )}
          </div>
        }
      />

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Sanctioned Principal"
          value={formatMoney(data.principal || 0)}
          hint={`${data.tenureMonths || 0} Months @ ${data.interestRate || 0}% p.a.`}
          icon={<Award className="h-4 w-4" />}
        />
        <KpiCard
          label="Monthly EMI"
          value={formatMoney(data.emiAmount || 0)}
          hint={`Next due: ${data.nextDueDate ? formatDate(data.nextDueDate) : 'N/A'}`}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatMoney(data.outstandingPrincipal || 0)}
          hint={`Total Repaid: ${formatMoney(metrics.totalPaid || 0)}`}
          icon={<CreditCard className="h-4 w-4 text-brand-700" />}
        />
        <KpiCard
          label="Repayment Progress"
          value={`${metrics.progressPercent || 0}%`}
          hint={`${metrics.paidInstallments || 0}/${metrics.totalInstallments || 0} EMIs settled`}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account Specifications */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Account Specifications
            </h3>
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <Row label="Loan ID" value={<span className="font-mono text-brand-700 font-bold">{data.loanNo}</span>} />
              <Row label="Customer ID" value={<span className="font-mono text-slate-700 font-semibold">{customer.customerCode || 'N/A'}</span>} />
              <Row
                label="Borrower"
                value={
                  customer.id ? (
                    <Link href={`/customers/${customer.id}`} className="text-brand-700 font-semibold hover:underline">
                      {customer.firstName} {customer.lastName}
                    </Link>
                  ) : (
                    'N/A'
                  )
                }
              />
              <Row label="Product Type" value={product.name || 'Personal Loan'} />
              <Row label="Branch" value={branch.name || 'Main Branch'} />
              <Row label="Sanctioned Amount" value={formatMoney(data.principal || 0)} />
              <Row label="Interest Rate" value={`${data.interestRate || 0}% p.a.`} />
              <Row label="Tenure Period" value={`${data.tenureMonths || 0} Months`} />
              <Row label="Monthly EMI" value={<span className="font-bold text-emerald-600">{formatMoney(data.emiAmount || 0)}</span>} />
              <Row label="Disbursed Date" value={data.disbursementDate ? formatDate(data.disbursementDate) : '-'} />
              <Row label="Next Due Date" value={data.nextDueDate ? formatDate(data.nextDueDate) : 'N/A'} />
              <Row
                label="Overdue Amount"
                value={
                  metrics.overdueAmount && Number(metrics.overdueAmount) > 0 ? (
                    <span className="font-bold text-rose-600 font-mono">
                      {formatMoney(metrics.overdueAmount)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">₹0.00 (Current)</span>
                  )
                }
              />
              <Row
                label="Days Past Due (DPD)"
                value={
                  metrics.dpd && Number(metrics.dpd) > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {metrics.dpd} DPD
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      0 DPD (Standard)
                    </span>
                  )
                }
              />
              <Row label="Account Status" value={<Badge status={data.status} />} />
            </dl>
          </Card>

          {data.closure && (
            <Card className="p-5 bg-emerald-50/50 border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider">Loan Account Settled & Closed</h4>
              </div>
              <p className="text-xs text-slate-700 font-mono">NOC Number: {data.closure.nocNumber}</p>
              <p className="text-[11px] text-slate-500">Issued by {data.closure.closedBy} on {data.closure.closedAt ? formatDate(data.closure.closedAt) : 'N/A'}</p>
            </Card>
          )}
        </div>

        {/* Schedule & Breakdown Tabs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Amortization Schedule */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Repayment Amortization Schedule</h3>
                <p className="text-xs text-slate-400">Total {schedule.length} installments scheduled across {data.tenureMonths} months</p>
              </div>
              {isCustomer ? (
                <Button size="sm" onClick={() => { setPayAmount(String(data.emiAmount || '')); setPayModalOpen(true); }} className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold gap-1 shadow-sm">
                  <CreditCard className="w-3.5 h-3.5" /> Submit Payment Proof
                </Button>
              ) : canCollectRepayment ? (
                <Button size="sm" variant="secondary" onClick={() => { setPayAmount(String(data.emiAmount || '')); setPayModalOpen(true); }} className="text-xs">
                  Collect EMI
                </Button>
              ) : isFinanceOfficer ? (
                <Link href={`/payments?loanId=${data.id}`}>
                  <Button size="sm" variant="secondary" className="text-xs text-[#2563EB] font-bold">
                    Verify & Reconcile Payments →
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3">Interest</th>
                    <th className="py-2.5 px-3">Total EMI</th>
                    <th className="py-2.5 px-3">Paid Amount</th>
                    <th className="py-2.5 px-3">Outstanding</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {schedule.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{item.emiNumber}</td>
                      <td className="py-2.5 px-3">{item.dueDate ? formatDate(item.dueDate) : '-'}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(item.principal)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(item.interest)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatMoney(item.totalDue)}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600">{formatMoney(item.paidAmount || 0)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(item.outstanding)}</td>
                      <td className="py-2.5 px-3"><Badge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recorded Collections & Payment Submissions Section */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recorded Collections & Payment Submissions</h3>
                <p className="text-xs text-slate-400">
                  Collections recorded by Collection Officers awaiting Finance verification and ledger settlement
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {submissions.length} Total Records
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No payment collections or submissions recorded for this loan yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Ref / Sub #</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">UTR / Reference</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Notes / Collector</th>
                      <th className="py-2.5 px-3">Status</th>
                      {canVerifyFinance && <th className="py-2.5 px-3 text-right">Finance Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {submissions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                          {sub.submissionNo || sub.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">
                          {formatMoney(sub.amount || 0)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{sub.method}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                          {sub.reference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {sub.paidAt ? formatDate(sub.paidAt) : formatDate(sub.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-slate-500">
                          {sub.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {sub.status === 'PENDING_VERIFICATION' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Awaiting Finance Verification
                            </span>
                          ) : sub.status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Verified & Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>
                        {canVerifyFinance && (
                          <td className="py-2.5 px-3 text-right">
                            {sub.status === 'PENDING_VERIFICATION' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => verifySubmissionMutation.mutate(sub.id)}
                                  disabled={verifySubmissionMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-1 py-1 px-2.5 h-7"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {verifySubmissionMutation.isPending ? 'Verifying...' : 'Verify & Settle'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setRejectModalSubId(sub.id)}
                                  className="text-[11px] text-rose-600 hover:bg-rose-50 py-1 px-2 h-7"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {sub.status === 'VERIFIED' ? 'Settled in Ledger' : 'Rejected'}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Settled Repayments & Allocation History */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Settled Repayment Transactions</h3>
                <p className="text-xs text-slate-400">
                  Double-entry accounting ledger entries applied via waterfall hierarchy (Fees → Penalty → Interest → Principal)
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {settledPayments.length} Settled
              </span>
            </div>

            {settledPayments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No finalized repayment transactions settled in accounting ledger yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Settled Amount</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">UTR / Ref</th>
                      <th className="py-2.5 px-3">Settlement Date</th>
                      <th className="py-2.5 px-3">Waterfall Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {settledPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.paymentNo}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{formatMoney(p.amount)}</td>
                        <td className="py-2.5 px-3 font-semibold">{p.method}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.reference || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.paidAt ? formatDate(p.paidAt) : '-'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {Array.isArray(p.allocations) && p.allocations.length > 0 ? (
                              p.allocations.map((a: any, idx: number) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded font-mono font-semibold",
                                    a.bucket === 'PRINCIPAL'
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : a.bucket === 'INTEREST'
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : a.bucket === 'PENALTY'
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-purple-50 text-purple-700 border border-purple-200"
                                  )}
                                >
                                  {a.bucket}: {formatMoney(a.amount)}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 font-mono">Standard Waterfall Applied</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Collect / Submit Payment Modal (Primary for Collection Officer & Customer) */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isCustomer ? 'Submit EMI Payment Details / Proof' : 'Record Repayment Collection'}
              </h3>
              <p className="text-xs text-slate-500">
                {isCustomer
                  ? 'Submit your transaction reference for verification by Finance & Collections'
                  : 'Record customer payment collection. Submits to Finance verification and reconciliation queue.'}
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">Repayment Collection Recorded!</p>
                <p className="text-xs text-slate-500">Submitted for Finance Officer verification and ledger reconciliation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (INR) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel / Mode *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                    <option value="NEFT">NEFT Electronic Bank Transfer</option>
                    <option value="IMPS">IMPS Immediate Transfer</option>
                    <option value="NET_BANKING">Net Banking Core Transfer</option>
                    <option value="CASH">Cash Collection (Branch Desk)</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference / UTR Number *</label>
                  <Input
                    placeholder="e.g. UPI/60281904821 or CMS-NEFT-99281726"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payer Mobile / Contact</label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={payMobile}
                    onChange={(e) => setPayMobile(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                  <Input
                    placeholder="e.g. Received EMI via UPI QR code"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                  />
                </div>

                {(collectRepaymentMutation.isError || submissionMutation.isError) && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    {apiErrorMessage(collectRepaymentMutation.error || submissionMutation.error)}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <Button
                    disabled={
                      !payAmount ||
                      !payReference.trim() ||
                      collectRepaymentMutation.isPending ||
                      submissionMutation.isPending
                    }
                    onClick={() => {
                      if (isCustomer) {
                        submissionMutation.mutate();
                      } else {
                        collectRepaymentMutation.mutate();
                      }
                    }}
                    className={cn(
                      "flex-1 text-white font-semibold",
                      isCustomer ? "bg-[#2563EB] hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {isCustomer
                      ? submissionMutation.isPending
                        ? 'Submitting...'
                        : 'Submit for Verification'
                      : collectRepaymentMutation.isPending
                      ? 'Recording Collection...'
                      : 'Confirm & Record Collection'}
                  </Button>
                  <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finance Officer Exception / Rejection Modal */}
      {rejectModalSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Exception / Rejection</h3>
              <p className="text-xs text-slate-500">Record reason for rejecting payment submission</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="Payment mismatch with bank credit records">Payment mismatch with bank credit records</option>
                  <option value="Incorrect UTR / Reference number">Incorrect UTR / Reference number</option>
                  <option value="Duplicate payment submission intimation">Duplicate payment submission intimation</option>
                  <option value="Cheque bounced / Transaction reversed">Cheque bounced / Transaction reversed</option>
                  <option value="Partial / Incomplete payment amount">Partial / Incomplete payment amount</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Exception Notes</label>
                <Input
                  placeholder="e.g. Bank statement on 08/09 does not reflect credit for this UTR"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!rejectReason || rejectSubmissionMutation.isPending}
                  onClick={() =>
                    rejectSubmissionMutation.mutate({
                      submissionId: rejectModalSubId,
                      reason: rejectReason,
                    })
                  }
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {rejectSubmissionMutation.isPending ? 'Rejecting...' : 'Confirm Exception & Reject'}
                </Button>
                <Button variant="secondary" onClick={() => setRejectModalSubId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restructure Modal */}
      {restructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Loan Restructuring Request</h3>
              <p className="text-xs text-slate-500">Recalculate remaining schedule terms</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Tenure (Remaining Months)</label>
                <Input
                  type="number"
                  value={newTenure}
                  onChange={(e) => setNewTenure(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Revised Interest Rate (% p.a.)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Restructure Justification</label>
                <Input
                  placeholder="e.g. Borrower hardship relief agreement"
                  value={restructureReason}
                  onChange={(e) => setRestructureReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!restructureReason || restructureMutation.isPending}
                  onClick={() => restructureMutation.mutate()}
                  className="flex-1"
                >
                  {restructureMutation.isPending ? 'Processing...' : 'Authorize Restructuring'}
                </Button>
                <Button variant="secondary" onClick={() => setRestructureModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {settleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">One-Time Loan Settlement (OTS)</h3>
              <p className="text-xs text-slate-500">Total Outstanding: {formatMoney(data.outstandingPrincipal || 0)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Payoff Amount (INR)</label>
                <Input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Rationale</label>
                <Input
                  placeholder="e.g. Approved compromise settlement"
                  value={settleReason}
                  onChange={(e) => setSettleReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!settleAmount || !settleReason || settlementMutation.isPending}
                  onClick={() => settlementMutation.mutate()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                >
                  {settlementMutation.isPending ? 'Settling...' : 'Execute Settlement'}
                </Button>
                <Button variant="secondary" onClick={() => setSettleModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital NOC Modal */}
      {nocModalOpen && data.closure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-dropdown border border-slate-200 animate-fade-in space-y-5">
            <div className="text-center border-b border-slate-200 pb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">ADYAPAN IT SOLUTION LMS</span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">NO OBJECTION CERTIFICATE (NOC)</h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">Certificate No: {data.closure.nocNumber}</p>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
              <p>This is to certify that <strong>{customer.firstName} {customer.lastName}</strong> (Customer ID: <code>{customer.customerCode}</code>) has completely paid all outstanding dues towards Loan Account <strong>{data.loanNo}</strong>.</p>
              <p>As on <strong>{data.closure.closedAt ? formatDate(data.closure.closedAt) : 'N/A'}</strong>, the outstanding principal, interest and fee balances stand at <strong>INR 0.00</strong> (Zero).</p>
              <p>There are no further liabilities or claims on this loan account.</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
              <span>Authorized Signatory: {data.closure.closedBy || 'Operations Lead'}</span>
              <Button size="sm" onClick={() => setNocModalOpen(false)}>Close Certificate</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2 min-w-0">
      <dt className="text-slate-500 font-medium shrink-0">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-200 min-w-0 break-words">{value ?? '-'}</dd>
    </div>
  );
}
