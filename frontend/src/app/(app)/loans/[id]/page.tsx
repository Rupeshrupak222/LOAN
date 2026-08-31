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
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payReference, setPayReference] = useState('');

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

  // Make Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: async () =>
      api.post('/payments', {
        loanId: params.id,
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setPayModalOpen(false);
      setPayAmount('');
      setPayReference('');
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
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setRestructureModalOpen(false);
    },
  });

  // Settlement Mutation
  const settlementMutation = useMutation({
    mutationFn: async () =>
      api.post('/restructuring/settlement', {
        loanId: params.id,
        settlementAmount: Number(settleAmount),
        reason: settleReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setSettleModalOpen(false);
    },
  });

  if (isLoading) return <Spinner />;
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
                <Button
                  size="sm"
                  onClick={() => {
                    setPayAmount(String(data.emiAmount || ''));
                    setPayModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Collect Repayment
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRestructureModalOpen(true)}>
                  Restructure
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setSettleModalOpen(true)}>
                  Settlement
                </Button>
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
              <Row
                label="Borrower"
                value={
                  customer.id ? (
                    <Link href={`/customers/${customer.id}`} className="text-brand-700 font-semibold hover:underline">
                      {customer.firstName} {customer.lastName}
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
              <Row label="Mobile" value={customer.mobile} />
              <Row label="Disbursed Date" value={data.disbursementDate ? formatDate(data.disbursementDate) : '-'} />
              <Row label="Maturity Date" value={data.maturityDate ? formatDate(data.maturityDate) : '-'} />
              <Row label="Branch Office" value={branch.name || 'Head Office'} />
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

        {/* Amortization Schedule Table */}
        <div className="space-y-6 lg:col-span-2">
          <Card noPadding className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Amortization Repayment Schedule
                </h3>
                <p className="text-xs text-slate-500">Scheduled principal, reducing interest, and installment status</p>
              </div>
              <Button size="sm" onClick={() => setPayModalOpen(true)}>
                + Record Payment
              </Button>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3">Interest</th>
                    <th className="py-2.5 px-3">Total Due</th>
                    <th className="py-2.5 px-3">Paid Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {schedule.map((item: any) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.status === 'PAID'
                          ? 'bg-emerald-50/20'
                          : item.status === 'OVERDUE'
                          ? 'bg-rose-50/30'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{item.emiNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.dueDate ? formatDate(item.dueDate) : '-'}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{formatMoney(item.principal)}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{formatMoney(item.interest)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{formatMoney(item.totalDue)}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-700">{formatMoney(item.paidAmount)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Repayment Collection</h3>
              <p className="text-xs text-slate-500">
                Waterfall allocation: <span className="font-semibold text-brand-700">Fees → Penalty → Interest → Principal</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (INR)</label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel / Mode</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / BHIM)</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                  <option value="IMPS">IMPS Immediate Transfer</option>
                  <option value="CASH">Cash Collection (Branch Desk)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference / UTR Number</label>
                <Input
                  placeholder="e.g. UPI/60281904821 or CHEQUE#904812"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  required
                />
              </div>

              {paymentMutation.isError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {apiErrorMessage(paymentMutation.error)}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!payAmount || !payReference.trim() || paymentMutation.isPending}
                  onClick={() => paymentMutation.mutate()}
                  className="flex-1"
                >
                  {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment & Settle'}
                </Button>
                <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
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
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-500 font-medium">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}
