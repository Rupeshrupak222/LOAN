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
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Building,
  HelpCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card, Spinner, KpiCard } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const isCustomer = user?.roles?.includes('CUSTOMER');
  const isStaff = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST'].includes(r)
  );
  const canVerify = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'FINANCE_OFFICER'].includes(r)
  );

  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'ALL' | 'REPAYMENTS' | 'DISBURSEMENTS'>(
    'SUBMISSIONS'
  );
  const [search, setSearch] = useState('');

  // 1. Submit Payment Proof Modal state (Intimations)
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subMethod, setSubMethod] = useState('UPI');
  const [subRef, setSubRef] = useState('');
  const [subMobile, setSubMobile] = useState('');
  const [subNotes, setSubNotes] = useState('');

  // 2. Direct Repayment Entry Modal state (Staff Direct Recording)
  const [directPayModalOpen, setDirectPayModalOpen] = useState(false);
  const [directLoanId, setDirectLoanId] = useState('');
  const [directAmount, setDirectAmount] = useState('');
  const [directMethod, setDirectMethod] = useState('UPI');
  const [directRef, setDirectRef] = useState('');
  const [directNotes, setDirectNotes] = useState('');

  // 3. Reject Modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  // 1. All Transactions (Master Ledger)
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

  // 4. Active Loans dropdown for recording
  const { data: loansData } = useQuery({
    queryKey: ['loans-dropdown'],
    queryFn: async () => {
      const res = await api.get('/loans');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
    enabled: submitModalOpen || directPayModalOpen,
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
      toast.success('Payment receipt submitted for verification.');
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSubmitModalOpen(false);
      setSelectedLoanId('');
      setSubAmount('');
      setSubRef('');
      setSubNotes('');
      setActiveTab('SUBMISSIONS');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Submission Notice' });
    },
  });

  // Mutation: Direct Payment Recording (Staff)
  const directPaymentMutation = useMutation({
    mutationFn: async () =>
      api.post('/payments', {
        loanId: directLoanId,
        amount: Number(directAmount),
        method: directMethod,
        reference: directRef || `MANUAL-${Date.now().toString().slice(-6)}`,
        notes: directNotes || 'Direct repayment posted by Finance Officer',
      }),
    onSuccess: () => {
      toast.success('Repayment recorded & allocated across loan ledger successfully.');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] });
      setDirectPayModalOpen(false);
      setDirectLoanId('');
      setDirectAmount('');
      setDirectRef('');
      setDirectNotes('');
      setActiveTab('REPAYMENTS');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Payment Recording Notice' });
    },
  });

  // Mutation: Verify Submission
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/payments/submissions/${id}/verify`),
    onSuccess: () => {
      toast.success('Payment verified & settled into double-entry ledger.');
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan'] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Verification Notice' });
    },
  });

  // Mutation: Reject Submission
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/payments/submissions/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.warning('Payment submission rejected.');
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setRejectModalId(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Rejection Notice' });
    },
  });

  const allTx = Array.isArray(txData) ? txData : [];
  const repayments = Array.isArray(payData) ? payData : [];
  const submissions = Array.isArray(subData) ? subData : [];
  const disbursements = allTx.filter((t) => t.type === 'DISBURSEMENT');
  const availableLoans = Array.isArray(loansData) ? loansData : [];

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING_VERIFICATION').length;
  const totalRepaymentsAmount = repayments.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalDisbursementsAmount = disbursements.reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const displayedTx =
    activeTab === 'ALL'
      ? allTx
      : activeTab === 'DISBURSEMENTS'
      ? disbursements
      : allTx.filter((t) => t.type === 'PAYMENT');

  // COLUMNS DEFINITION: 1. Submissions (Receipts queue)
  const submissionColumns: Column<any>[] = [
    {
      key: 'submissionNo',
      header: 'Receipt #',
      render: (r) => (
        <span className={cn('font-bold font-mono text-xs', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>
          {r.submissionNo || '-'}
        </span>
      ),
    },
    {
      key: 'loanNo',
      header: 'Loan Account',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-semibold text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.loanNo || '-'}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower Profile',
      render: (r) => {
        const custId = r.customerId || r.loan?.customerId;
        return (
          <div>
            {custId ? (
              <Link
                href={`/customers/${custId}`}
                className="group block hover:opacity-90"
                title="Click to view Customer 360 Profile"
              >
                <p className={cn('font-semibold leading-tight group-hover:underline text-[#2563EB] dark:text-[#60A5FA]')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  {r.payerMobile ? `Mob: ${r.payerMobile}` : r.customerCode || '-'}
                  <span className="text-[10px] text-blue-500 font-sans font-medium flex items-center gap-0.5">
                    360 <ExternalLink className="w-2.5 h-2.5 inline" />
                  </span>
                </p>
              </Link>
            ) : (
              <div>
                <p className={cn('font-semibold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {r.payerMobile ? `Mob: ${r.payerMobile}` : r.customerCode || '-'}
                </p>
              </div>
            )}
          </div>
        );
      },
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
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800', isDark ? 'text-slate-300' : 'text-slate-700')}>
          {r.method}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Bank Ref / UTR',
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
      header: 'Verification State',
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
        <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {r.createdAt ? formatDate(r.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => {
        if (r.status !== 'PENDING_VERIFICATION') {
          return (
            <span className="text-xs text-slate-400 font-medium">
              {r.status === 'VERIFIED' ? 'Settled' : 'Closed'}
            </span>
          );
        }
        if (canVerify) {
          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="sm"
                onClick={() => verifyMutation.mutate(r.id)}
                disabled={verifyMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {verifyMutation.isPending ? 'Settling...' : 'Verify & Settle'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejectModalId(r.id)}
                className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                Reject
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-amber-500 font-semibold">Awaiting Verification</span>;
      },
    },
  ];

  // COLUMNS DEFINITION: 2. Master Transactions Ledger
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
      header: 'Loan Account',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.loanNo || '-'}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower Profile',
      render: (r) => {
        const custId = r.customerId || r.loan?.customerId;
        return (
          <div>
            {custId ? (
              <Link
                href={`/customers/${custId}`}
                className="group block hover:opacity-90"
                title="Click to view Customer 360 Profile"
              >
                <p className={cn('font-semibold leading-tight group-hover:underline text-[#2563EB] dark:text-[#60A5FA]')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  {r.customerCode || '-'}
                  <span className="text-[10px] text-blue-500 font-sans font-medium flex items-center gap-0.5">
                    360 <ExternalLink className="w-2.5 h-2.5 inline" />
                  </span>
                </p>
              </Link>
            ) : (
              <div>
                <p className={cn('font-semibold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Accounting Amount',
      render: (r) => (
        <span
          className={cn(
            'font-bold text-sm',
            r.direction === 'DEBIT'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-emerald-600 dark:text-emerald-400'
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
        <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
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
            Loan Account →
          </Button>
        </Link>
      ),
    },
  ];

  // COLUMNS DEFINITION: 3. Repayments with Waterfall Allocation
  const repaymentColumns: Column<any>[] = [
    {
      key: 'paymentNo',
      header: 'Receipt #',
      render: (r) => (
        <span className={cn('font-bold font-mono text-xs', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>
          {r.paymentNo || '-'}
        </span>
      ),
    },
    {
      key: 'loanNo',
      header: 'Loan Account',
      render: (r) => (
        <Link href={`/loans/${r.loanId}`} className="font-semibold text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.loanNo}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower Profile',
      render: (r) => {
        const custId = r.customerId || r.loan?.customerId;
        return (
          <div>
            {custId ? (
              <Link
                href={`/customers/${custId}`}
                className="group block hover:opacity-90"
                title="Click to view Customer 360 Profile"
              >
                <p className={cn('font-semibold leading-tight group-hover:underline text-[#2563EB] dark:text-[#60A5FA]')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  {r.customerCode || '-'}
                  <span className="text-[10px] text-blue-500 font-sans font-medium flex items-center gap-0.5">
                    360 <ExternalLink className="w-2.5 h-2.5 inline" />
                  </span>
                </p>
              </Link>
            ) : (
              <div>
                <p className={cn('font-semibold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  {r.customerName || 'Borrower'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Total Repayment',
      render: (r) => (
        <span className="font-bold text-emerald-600 dark:text-[#10B981] text-sm">{formatMoney(r.amount || 0)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (r) => <span className={cn('text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800', isDark ? 'text-slate-300' : 'text-slate-700')}>{r.method}</span>,
    },
    {
      key: 'allocations',
      header: 'Waterfall Settlement Breakdown',
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {Array.isArray(r.allocations) && r.allocations.length > 0 ? (
            r.allocations.map((a: any, i: number) => (
              <span
                key={i}
                className={cn(
                  'px-2 py-0.5 rounded font-medium border text-[11px]',
                  a.bucket === 'PRINCIPAL'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : a.bucket === 'INTEREST'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                <strong>{a.bucket}:</strong> {formatMoney(a.amount || 0)}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs">Direct EMI Settlement</span>
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'UTR / Ref',
      render: (r) => (
        <span className={cn('font-mono text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
          {r.reference || '-'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    {
      key: 'paidAt',
      header: 'Paid At',
      render: (r) => (
        <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {r.paidAt ? formatDate(r.paidAt) : '-'}
        </span>
      ),
    },
  ];

  const isLoading = txLoading || payLoading || subLoading;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumb="Servicing / Payments & Ledger"
        title="Payments & Financial Ledger Desk"
        subtitle="Verify borrower payment receipts, record manual collections, and monitor double-entry transaction ledgers"
        action={
          <div className="flex items-center gap-2">
            {!isCustomer && (
              <Button
                size="md"
                onClick={() => setDirectPayModalOpen(true)}
                className="flex items-center gap-1.5 text-white bg-[#2563EB] hover:bg-blue-700 shadow-sm font-semibold cursor-pointer text-xs"
              >
                <Plus className="h-4 w-4" /> Record EMI Repayment
              </Button>
            )}
            <Button
              size="md"
              variant={isCustomer ? 'primary' : 'secondary'}
              onClick={() => setSubmitModalOpen(true)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold cursor-pointer',
                isCustomer ? 'text-white bg-[#2563EB] hover:bg-blue-700' : ''
              )}
            >
              <Send className="h-3.5 w-3.5" /> Submit Payment Proof
            </Button>
          </div>
        }
      />

      {/* TOP 4 FINANCIAL OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Pending Verification"
          value={String(pendingSubmissionsCount)}
          hint={pendingSubmissionsCount > 0 ? 'Borrower receipts awaiting check' : 'All receipts verified'}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Total EMI Collections"
          value={formatMoney(totalRepaymentsAmount)}
          hint={`${repayments.length} settled repayments`}
          icon={<ArrowDownLeft className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Disbursed Principal"
          value={formatMoney(totalDisbursementsAmount)}
          hint={`${disbursements.length} loan releases`}
          icon={<ArrowUpRight className="h-4 w-4 text-blue-600" />}
        />
        <KpiCard
          label="Settlement Engine"
          value="4-Tier Waterfall"
          hint="Fees → Penalty → Interest → Principal"
          icon={<Layers className="h-4 w-4 text-indigo-500" />}
        />
      </div>

      {/* TABS HEADER WITH CLEAR CONCISE LABELS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#2B3566] pb-2">
        <button
          onClick={() => setActiveTab('SUBMISSIONS')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'SUBMISSIONS'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          1. Borrower Payment Proofs ({submissions.length})
          {pendingSubmissionsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold">
              {pendingSubmissionsCount} Pending
            </span>
          )}
        </button>

        {!isCustomer && (
          <>
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'ALL'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              2. Master Financial Ledger ({allTx.length})
            </button>

            <button
              onClick={() => setActiveTab('REPAYMENTS')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'REPAYMENTS'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              3. EMI Repayments & Allocations ({repayments.length})
            </button>

            <button
              onClick={() => setActiveTab('DISBURSEMENTS')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'DISBURSEMENTS'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              4. Loan Disbursements ({disbursements.length})
            </button>
          </>
        )}
      </div>

      {/* CONTEXTUAL HELPER BANNER FOR THE ACTIVE TAB */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/60 border border-slate-200/60 dark:border-[#2B3566] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            {activeTab === 'SUBMISSIONS' && <FileCheck2 className="w-4 h-4" />}
            {activeTab === 'ALL' && <Layers className="w-4 h-4" />}
            {activeTab === 'REPAYMENTS' && <ArrowDownLeft className="w-4 h-4" />}
            {activeTab === 'DISBURSEMENTS' && <ArrowUpRight className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {activeTab === 'SUBMISSIONS' && 'Borrower UTR Receipts Verification Desk'}
              {activeTab === 'ALL' && 'Master Double-Entry Financial Accounting Ledger'}
              {activeTab === 'REPAYMENTS' && 'EMI Collections Ledger with Waterfall Split'}
              {activeTab === 'DISBURSEMENTS' && 'Principal Fund Release (Outflow) Timeline'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeTab === 'SUBMISSIONS' && 'Review borrower-submitted UTR proofs. Click "Verify & Settle" to confirm bank credit and settle into active loan schedule.'}
              {activeTab === 'ALL' && 'Real-time double-entry timeline of all credit inflows (repayments) and debit outflows (disbursements).'}
              {activeTab === 'REPAYMENTS' && 'Settled EMI installments showing automated breakdown across Late Fees, Penalty, Regular Interest, and Principal balance.'}
              {activeTab === 'DISBURSEMENTS' && 'Historical electronic fund transfers released to borrower bank accounts via NEFT/RTGS/IMPS.'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72 shrink-0">
          <Input
            placeholder="Search reference #, UTR, loan #, or borrower..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ACTIVE TAB TABLE */}
      {activeTab === 'SUBMISSIONS' ? (
        <DataTable
          columns={submissionColumns}
          rows={submissions}
          loading={isLoading}
          emptyTitle="No payment submission proofs pending"
          emptyDescription="When a borrower or collection officer submits a payment intimation with UTR/Receipt, it appears here for verification and automated ledger settlement."
        />
      ) : activeTab === 'REPAYMENTS' ? (
        <DataTable
          columns={repaymentColumns}
          rows={repayments}
          loading={isLoading}
          emptyTitle="No repayment collections recorded yet"
          emptyDescription="All settled borrower repayments with waterfall allocations appear here."
        />
      ) : (
        <DataTable
          columns={txColumns}
          rows={displayedTx}
          loading={isLoading}
          emptyTitle="No ledger transactions found"
          emptyDescription="Disbursements and repayment entries appear automatically in this double-entry financial ledger."
        />
      )}

      {/* MODAL 1: DIRECT REPAYMENT ENTRY (STAFF) */}
      {directPayModalOpen && (
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
                  Record Direct EMI Repayment
                </h3>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Post direct customer collection and auto-settle loan balance via waterfall
                </p>
              </div>
              <button
                onClick={() => setDirectPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Select Loan */}
              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Select Loan Account *
                </label>
                <select
                  value={directLoanId}
                  onChange={(e) => {
                    setDirectLoanId(e.target.value);
                    const chosen = availableLoans.find((l) => l.id === e.target.value);
                    if (chosen?.emiAmount && !directAmount) {
                      setDirectAmount(String(chosen.emiAmount));
                    }
                  }}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
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
                  <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Repayment Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    placeholder="e.g. 5000.00"
                    required
                  />
                </div>
                <div>
                  <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Payment Mode *
                  </label>
                  <select
                    value={directMethod}
                    onChange={(e) => setDirectMethod(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                      isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                    )}
                  >
                    <option value="UPI">UPI / PhonePe / GPay / Paytm</option>
                    <option value="NEFT">NEFT Electronic Bank Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="RTGS">RTGS High Value Transfer</option>
                    <option value="CASH">Cash Collection at Branch</option>
                    <option value="CHEQUE">Account Payee Cheque</option>
                  </select>
                </div>
              </div>

              {/* UTR / Reference */}
              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Bank Transaction Reference / UTR Number
                </label>
                <Input
                  value={directRef}
                  onChange={(e) => setDirectRef(e.target.value)}
                  placeholder="e.g. CMS-NEFT-994821034"
                />
              </div>

              {/* Notes */}
              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Payment Notes / Allocation Remarks
                </label>
                <Input
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  placeholder="e.g. Monthly EMI settlement recorded by finance officer"
                />
              </div>

              {/* Waterfall Info Alert */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                  <Layers className="w-3.5 h-3.5" /> Automated Waterfall Allocation:
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300">
                  Funds will settle automatically in order: <strong>1. Fees</strong> → <strong>2. Penalty Interest</strong> → <strong>3. Regular EMI Interest</strong> → <strong>4. Principal Reduction</strong>.
                </p>
              </div>

              {directPaymentMutation.isError && (
                <div
                  className={cn(
                    'rounded-xl p-3 text-xs border',
                    isDark ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' : 'bg-rose-50 text-rose-700 border-rose-200'
                  )}
                >
                  {apiErrorMessage(directPaymentMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setDirectPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!directLoanId || !directAmount || directPaymentMutation.isPending}
                  onClick={() => directPaymentMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {directPaymentMutation.isPending ? 'Posting...' : 'Confirm & Post Repayment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT PAYMENT PROOF / DETAILS */}
      {submitModalOpen && (
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
                  Submit Payment Details / Proof
                </h3>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
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
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
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
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
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
                  <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
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
                  <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Payment Channel *
                  </label>
                  <select
                    value={subMethod}
                    onChange={(e) => setSubMethod(e.target.value)}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                      isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
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
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
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
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
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
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
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
                    'rounded-xl p-3 text-xs border',
                    isDark ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' : 'bg-rose-50 text-rose-700 border-rose-200'
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

      {/* MODAL 3: REJECT SUBMISSION */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4',
              isDark ? 'bg-[#171B36] border-[#2B3566] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
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
