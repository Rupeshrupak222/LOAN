'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Download,
  Receipt,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Layers,
  History,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card, Spinner } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isCustomer = user?.roles?.includes('CUSTOMER');
  const isStaff = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST'].includes(r)
  );
  const canVerify = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'].includes(r)
  );

  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBMISSIONS' | 'DISBURSEMENTS' | 'REPAYMENTS'>(
    isCustomer ? 'SUBMISSIONS' : 'ALL'
  );
  const [search, setSearch] = useState('');

  // Submit Payment Proof Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subMethod, setSubMethod] = useState('UPI');
  const [subRef, setSubRef] = useState('');
  const [subMobile, setSubMobile] = useState('');
  const [subNotes, setSubNotes] = useState('');

  // Reject Modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. All Transactions (Ledger)
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['payments-transactions', search],
    queryFn: async () => {
      const res = await api.get('/payments/transactions', {
        params: { search: search || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  // 2. Repayment Payments (with bucket allocation)
  const { data: payData, isLoading: payLoading } = useQuery({
    queryKey: ['payments', search],
    queryFn: async () => {
      const res = await api.get('/payments', {
        params: { search: search || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  // 3. Payment Submissions / Proofs
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['payment-submissions', search],
    queryFn: async () => {
      const res = await api.get('/payments/submissions', {
        params: { search: search || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  // 4. Loans for Submission dropdown
  const { data: loansData } = useQuery({
    queryKey: ['loans-dropdown'],
    queryFn: async () => {
      const res = await api.get('/loans');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
    enabled: submitModalOpen,
  });

  // Mutation: Submit Payment Intimation
  const submitPaymentMutation = useMutation({
    mutationFn: async () =>
      api.post('/payments/submissions', {
        loanId: selectedLoanId,
        amount: Number(subAmount),
        method: subMethod,
        reference: subRef,
        payerMobile: subMobile,
        notes: subNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSubmitModalOpen(false);
      setSelectedLoanId('');
      setSubAmount('');
      setSubRef('');
      setSubNotes('');
      setActiveTab('SUBMISSIONS');
    },
  });

  // Mutation: Verify Submission
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/payments/submissions/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation: Reject Submission
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/payments/submissions/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setRejectModalId(null);
      setRejectReason('');
    },
  });

  const allTx = Array.isArray(txData) ? txData : [];
  const repayments = Array.isArray(payData) ? payData : [];
  const submissions = Array.isArray(subData) ? subData : [];
  const disbursements = allTx.filter((t) => t.type === 'DISBURSEMENT');
  const availableLoans = Array.isArray(loansData) ? loansData : [];

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING_VERIFICATION').length;

  const displayedTx =
    activeTab === 'ALL'
      ? allTx
      : activeTab === 'DISBURSEMENTS'
      ? disbursements
      : allTx.filter((t) => t.type === 'PAYMENT');

  const submissionColumns: Column<any>[] = [
    {
      key: 'submissionNo',
      header: 'Submission #',
      render: (r) => (
        <span className={cn("font-bold font-mono text-xs", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
          {r.submissionNo || '-'}
        </span>
      ),
    },
    {
      key: 'loanNo',
      header: 'Loan Account #',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-bold text-xs hover:underline">
          {r.loanNo || '-'}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            {r.customerName || 'Borrower'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {r.payerMobile ? `Mob: ${r.payerMobile}` : r.customerCode || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (r) => (
        <span className="font-bold text-emerald-600 dark:text-[#10B981] text-sm">
          {formatMoney(r.amount || 0)}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Payment Channel',
      render: (r) => (
        <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>
          {r.method}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'UTR / Transaction Ref',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
            {r.reference || '-'}
          </span>
          {r.notes && <span className="text-[10px] block text-slate-400 truncate max-w-xs">{r.notes}</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        if (r.status === 'PENDING_VERIFICATION') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" /> Under Verification
            </span>
          );
        }
        if (r.status === 'VERIFIED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Verified & Settled
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Submitted At',
      render: (r) => (
        <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
          {r.createdAt ? formatDate(r.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Staff Actions',
      align: 'right',
      render: (r) => {
        if (r.status !== 'PENDING_VERIFICATION') {
          return (
            <span className="text-xs text-slate-400">
              {r.status === 'VERIFIED' ? 'Settled' : 'Closed'}
            </span>
          );
        }
        if (canVerify) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                onClick={() => verifyMutation.mutate(r.id)}
                disabled={verifyMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {verifyMutation.isPending ? 'Verifying...' : 'Verify & Settle'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejectModalId(r.id)}
                className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Reject
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">Awaiting Finance Desk</span>;
      },
    },
  ];

  const txColumns: Column<any>[] = [
    {
      key: 'type',
      header: 'Transaction Type',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.direction === 'DEBIT' ? (
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <span className="font-bold text-xs">{r.type}</span>
            <span className="text-[10px] block text-slate-400 font-mono">
              {r.direction === 'DEBIT' ? 'OUTFLOW (FUND RELEASE)' : 'INFLOW (REPAYMENT)'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'loanNo',
      header: 'Loan Account #',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.loanNo || '-'}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            {r.customerName || 'Borrower'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => (
        <span
          className={cn(
            "font-bold text-sm",
            r.direction === 'DEBIT'
              ? "text-blue-600 dark:text-blue-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {r.direction === 'DEBIT' ? '-' : '+'}{formatMoney(r.amount || 0)}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Payment Reference / UTR',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
            {r.reference || '-'}
          </span>
          <span className="text-[10px] block text-slate-400 truncate max-w-xs">{r.description || ''}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => (
        <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
          {r.createdAt ? formatDate(r.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`}>
          <Button size="sm" variant="secondary" className="text-xs">
            Loan Details →
          </Button>
        </Link>
      ),
    },
  ];

  const repaymentColumns: Column<any>[] = [
    {
      key: 'paymentNo',
      header: 'Receipt #',
      render: (r) => (
        <span className={cn("font-bold font-mono text-xs", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
          {r.paymentNo || '-'}
        </span>
      ),
    },
    {
      key: 'loanNo',
      header: 'Loan Account #',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-semibold text-xs hover:underline">
          {r.loanNo}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            {r.customerName || 'Borrower'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (r) => (
        <span className="font-bold text-emerald-600 dark:text-[#10B981]">{formatMoney(r.amount || 0)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (r) => <span className={cn("text-xs", isDark ? "text-slate-300" : "text-slate-700")}>{r.method}</span>,
    },
    {
      key: 'allocations',
      header: 'Waterfall Allocations',
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {Array.isArray(r.allocations) &&
            r.allocations.map((a: any, i: number) => (
              <span
                key={i}
                className={cn(
                  "px-2 py-0.5 rounded font-medium border text-xs",
                  isDark ? "bg-[#16203D] text-slate-300 border-[#2B3566]" : "bg-slate-100 text-slate-700 border-slate-200"
                )}
              >
                {a.bucket}: {formatMoney(a.amount || 0)}
              </span>
            ))}
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'UTR / Ref',
      render: (r) => (
        <span className={cn("font-mono text-xs", isDark ? "text-slate-300" : "text-slate-600")}>
          {r.reference || '-'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    {
      key: 'paidAt',
      header: 'Timestamp',
      render: (r) => (
        <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
          {r.paidAt ? formatDate(r.paidAt) : '-'}
        </span>
      ),
    },
  ];

  const isLoading = txLoading || payLoading || subLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Servicing / Payments"
        title="Financial Ledger & Payment Submissions"
        subtitle="Manage borrower payment intimations, verification workflows, and immutable double-entry ledger"
        action={
          isCustomer ? (
            <Button
              size="md"
              onClick={() => {
                setSubmitModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-white bg-[#2563EB] hover:bg-blue-700 shadow-sm"
            >
              <Send className="h-4 w-4" /> Submit Payment Proof
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="md"
                onClick={() => setSubmitModalOpen(true)}
                variant="secondary"
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Intimation
              </Button>
              <Link href="/loans">
                <Button size="md" className="flex items-center gap-1.5 text-white bg-[#2563EB] hover:bg-blue-700 shadow-sm">
                  <Plus className="h-4 w-4" /> Direct Repayment Entry
                </Button>
              </Link>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#2B3566] pb-1">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'SUBMISSIONS'
              ? "bg-[#2563EB] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          {isCustomer ? 'My Submitted Payments' : 'Payment Submissions / Proofs'} ({submissions.length})
          {pendingSubmissionsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        {!isCustomer && (
          <>
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'ALL'
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              All Ledger Transactions ({allTx.length})
            </button>

            <button
              onClick={() => setActiveTab('DISBURSEMENTS')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'DISBURSEMENTS'
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              Disbursements Outflow ({disbursements.length})
            </button>

            <button
              onClick={() => setActiveTab('REPAYMENTS')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'REPAYMENTS'
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              Repayment Inflows ({repayments.length})
            </button>
          </>
        )}
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search reference #, UTR, loan #, or borrower..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeTab === 'SUBMISSIONS' ? (
        <DataTable
          columns={submissionColumns}
          rows={submissions}
          loading={isLoading}
          emptyTitle="No payment submissions recorded"
          emptyDescription="When a borrower submits payment transaction details (UTR/Receipt), they appear here for verification and automated settlement."
        />
      ) : activeTab === 'REPAYMENTS' ? (
        <DataTable
          columns={repaymentColumns}
          rows={repayments}
          loading={isLoading}
          emptyTitle="No payment repayments recorded yet"
          emptyDescription="Collected EMI repayments with waterfall allocations will appear in this table."
        />
      ) : (
        <DataTable
          columns={txColumns}
          rows={displayedTx}
          loading={isLoading}
          emptyTitle="No ledger transactions found"
          emptyDescription="Disbursements and repayment entries appear automatically in this immutable financial ledger."
        />
      )}

      {/* MODAL: SUBMIT PAYMENT PROOF / DETAILS */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-all",
              isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B3566]">
              <div>
                <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>
                  Submit Payment Details / Proof
                </h3>
                <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                  Enter the transaction UTR number & payment mode for verification
                </p>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Select Loan Account */}
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Select Loan Account *
                </label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => {
                    setSelectedLoanId(e.target.value);
                    const chosen = availableLoans.find((l) => l.id === e.target.value);
                    if (chosen?.emiAmount && !subAmount) {
                      setSubAmount(String(chosen.emiAmount));
                    }
                  }}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                  required
                >
                  <option value="">-- Choose Loan Account --</option>
                  {availableLoans.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.loanNo} - {l.productName || 'Loan'} (EMI: {formatMoney(l.emiAmount || 0)}) - {l.customerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    Amount Paid (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    placeholder="e.g. 4730.73"
                    required
                  />
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    Payment Channel *
                  </label>
                  <select
                    value={subMethod}
                    onChange={(e) => setSubMethod(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                      isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                    )}
                  >
                    <option value="UPI">UPI / PhonePe / GPay / Paytm</option>
                    <option value="NEFT">NEFT Electronic Bank Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="NET_BANKING">Net Banking Core Transfer</option>
                    <option value="BANK_DEPOSIT">Direct Branch Cash Deposit</option>
                    <option value="CHEQUE">Account Payee Cheque</option>
                  </select>
                </div>
              </div>

              {/* UTR / Transaction Reference */}
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Transaction Reference / UTR Number *
                </label>
                <Input
                  value={subRef}
                  onChange={(e) => setSubRef(e.target.value)}
                  placeholder="e.g. UPI/423456789012 or CMS-NEFT-99281726"
                  required
                />
              </div>

              {/* Payer Mobile Number */}
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Payer Mobile / Contact Number
                </label>
                <Input
                  value={subMobile}
                  onChange={(e) => setSubMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              {/* Notes */}
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Notes / Payment Remarks
                </label>
                <Input
                  value={subNotes}
                  onChange={(e) => setSubNotes(e.target.value)}
                  placeholder="e.g. Paid EMI #1 via GooglePay"
                />
              </div>

              {submitPaymentMutation.isError && (
                <div
                  className={cn(
                    "rounded-xl p-3 text-xs border",
                    isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {apiErrorMessage(submitPaymentMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!selectedLoanId || !subAmount || !subRef.trim() || submitPaymentMutation.isPending}
                  onClick={() => submitPaymentMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitPaymentMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT SUBMISSION */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4",
              isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <h3 className="text-base font-bold">Reject Payment Intimation</h3>
            <p className="text-xs text-slate-400">
              Provide a clear rejection reason. The borrower will receive an automated notification.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Rejection Reason *</label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not matching bank statement credit"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
              <Button variant="ghost" onClick={() => setRejectModalId(null)}>
                Cancel
              </Button>
              <Button
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectModalId, reason: rejectReason })}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
