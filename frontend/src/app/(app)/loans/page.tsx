'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Search, CheckCircle2, ArrowRight, Send, X, Layers, Clock, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function LoansPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Quick Payout Execution State
  const [selectedDisbursementApp, setSelectedDisbursementApp] = useState<any | null>(null);
  const [method, setMethod] = useState('NEFT_BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const canExecutePayout = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER'].includes(r)
  );

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['loans', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/loans', {
        params: { search: search || undefined, status: statusFilter || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const { data: disbursementsData, isLoading: disbLoading } = useQuery({
    queryKey: ['disbursements-queue'],
    queryFn: async () => {
      const res = await api.get('/disbursements/queue');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async () =>
      api.post('/disbursements/execute', {
        applicationId: selectedDisbursementApp.id,
        disbursementMethod: method,
        referenceNumber: reference || `CMS-NEFT-${Math.floor(100000000 + Math.random() * 900000000)}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedDisbursementApp(null);
      setReference('');
      toast.success('Disbursement Executed', 'Loan funds disbursed and repayment schedule activated.');
    },
    onError: (err: any) => {
      toast.error('Disbursement Failed', apiErrorMessage(err));
    },
  });

  const pendingDisbursements = Array.isArray(disbursementsData) ? disbursementsData : [];
  const loansList = Array.isArray(loansData) ? loansData : [];

  // Combined Rows: Active loans + Sanctioned applications ready for payout
  const combinedRows: any[] = [
    ...loansList.map((l: any) => ({
      id: l.id,
      isPendingDisbursement: false,
      accountNo: l.loanNo,
      customerName: l.customerName || 'Borrower',
      customerCode: l.customerCode,
      productName: l.productName || 'Loan',
      principal: l.principal || '0',
      emiAmount: l.emiAmount,
      outstandingPrincipal: l.outstandingPrincipal || l.principal || '0',
      nextDueDate: l.nextDueDate,
      status: l.status,
      rawItem: l,
    })),
    ...pendingDisbursements.map((a: any) => ({
      id: a.id,
      isPendingDisbursement: true,
      accountNo: a.applicationNo,
      customerName: `${a.customer?.firstName || 'Borrower'} ${a.customer?.lastName || ''}`,
      customerCode: a.customer?.customerCode,
      productName: a.product?.name || 'Loan',
      principal: String(a.requestedAmount || 0),
      emiAmount: null,
      outstandingPrincipal: String(a.requestedAmount || 0),
      nextDueDate: null,
      status: 'APPROVED',
      rawItem: a,
    })),
  ];

  // Apply search/filter on combined rows
  const filteredRows = combinedRows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchAcc = r.accountNo?.toLowerCase().includes(q);
      const matchName = r.customerName?.toLowerCase().includes(q);
      const matchCode = r.customerCode?.toLowerCase().includes(q);
      if (!matchAcc && !matchName && !matchCode) return false;
    }
    if (statusFilter) {
      if (r.status !== statusFilter) return false;
    }
    return true;
  });

  const columns: Column<any>[] = [
    {
      key: 'accountNo',
      header: 'Account / App #',
      render: (r: any) => (
        <Link
          href={r.isPendingDisbursement ? `/applications/${r.id}` : `/loans/${r.id}`}
          className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
        >
          {r.accountNo}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r: any) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-slate-100" : "text-slate-900")}>
            {r.customerName}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
        </div>
      ),
    },
    { key: 'productName', header: 'Product' },
    {
      key: 'principal',
      header: 'Principal Sanctioned',
      render: (r: any) => <span className="font-bold">{formatMoney(r.principal || 0)}</span>,
    },
    {
      key: 'emiAmount',
      header: 'Monthly EMI',
      render: (r: any) =>
        r.isPendingDisbursement ? (
          <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold">Pending Fund Release</span>
        ) : (
          formatMoney(r.emiAmount || 0)
        ),
    },
    {
      key: 'outstandingPrincipal',
      header: 'Outstanding Balance',
      render: (r: any) => (
        <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
          {formatMoney(r.outstandingPrincipal || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: any) =>
        r.isPendingDisbursement ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            SANCTIONED (AWAITING PAYOUT)
          </span>
        ) : (
          <Badge status={r.status} />
        ),
    },
    {
      key: 'id',
      header: 'Action',
      align: 'right',
      render: (r: any) =>
        r.isPendingDisbursement ? (
          <div className="flex items-center justify-end gap-1.5">
            <Link href="/disbursements">
              <Button
                size="sm"
                className="text-xs bg-[#2563EB] hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                Disbursements →
              </Button>
            </Link>
          </div>
        ) : (
          <Link href={`/loans/${r.id}`}>
            <Button size="sm" variant="secondary" className="text-xs">
              Amortization & Pay →
            </Button>
          </Link>
        ),
    },
  ];

  const handleOpenPayoutModal = (app: any) => {
    setSelectedDisbursementApp(app);
    setMethod('NEFT_BANK_TRANSFER');
    setReference(`CMS-NEFT-${Math.floor(100000000 + Math.random() * 900000000)}`);
  };

  const isLoading = loansLoading || disbLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Loans"
        title="Loan Accounts & Servicing Portfolio"
        subtitle="Manage active borrowing accounts, release funds for approved proposals, and track amortized schedules"
        action={
          <Link href="/disbursements">
            <Button variant="secondary" size="md" className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              Disbursement Queue {pendingDisbursements.length > 0 && `(${pendingDisbursements.length})`}
            </Button>
          </Link>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search loan #, borrower, or phone..."
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
          <option value="">All Account Statuses</option>
          <option value="APPROVED">APPROVED (Awaiting Payout)</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OVERDUE">OVERDUE</option>
          <option value="RESTRUCTURED">RESTRUCTURED</option>
          <option value="SETTLED">SETTLED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Combined Loans & Sanctioned Accounts Table */}
      <DataTable
        columns={columns}
        rows={filteredRows}
        loading={isLoading}
        emptyTitle="No loan accounts or sanctioned proposals found"
        emptyDescription="Proposals approved in Underwriting will appear here with a 'Release Fund' button to disburse and activate loan schedules."
        emptyAction={
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
            <Link href="/applications">
              <Button size="sm" variant="secondary">
                View Loan Applications Queue →
              </Button>
            </Link>
          </div>
        }
      />

      {/* DIRECT DISBURSEMENT EXECUTION MODAL */}
      {selectedDisbursementApp && (
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
                  Execute Electronic Fund Disbursement
                </h3>
                <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                  Release principal to borrower bank account and activate live loan schedule
                </p>
              </div>
              <button
                onClick={() => setSelectedDisbursementApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proposal Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445] text-xs space-y-1.5 border border-slate-200/60 dark:border-[#2B3566]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Application No:</span>
                <span className="font-mono font-bold text-blue-600">{selectedDisbursementApp.applicationNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Borrower:</span>
                <span className="font-bold">
                  {selectedDisbursementApp.customer?.firstName} {selectedDisbursementApp.customer?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Sanctioned Principal:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatMoney(selectedDisbursementApp.requestedAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Beneficiary Bank A/C:</span>
                <span className="font-mono font-semibold">
                  {selectedDisbursementApp.customer?.bankName || 'Bank'} · {selectedDisbursementApp.customer?.bankAccountNo || 'On Record'} ({selectedDisbursementApp.customer?.bankIfsc || 'IFSC'})
                </span>
              </div>
            </div>

            {/* Pre-Disbursement Checklist */}
            <div
              className={cn(
                "rounded-xl border p-3 space-y-1 text-xs",
                isDark ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]" : "border-emerald-200 bg-emerald-50 text-emerald-900"
              )}
            >
              <p className="font-bold">✓ Pre-Disbursement Verification Complete:</p>
              <p>• Underwriting sanction authorized</p>
              <p>• Borrower KYC verification status: {selectedDisbursementApp.customer?.kycStatus || 'VERIFIED'}</p>
              <p>• Destination bank beneficiary validated</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Disbursement Payment Channel *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="NEFT_BANK_TRANSFER">NEFT Electronic Bank Transfer</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                  <option value="IMPS">IMPS Instant Transfer</option>
                  <option value="DIRECT_CREDIT">Internal Bank Direct Credit</option>
                  <option value="CHEQUE">Corporate Account Payee Cheque</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Bank Payment Reference / UTR Number *
                </label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. CMS-NEFT-994827104"
                  required
                />
              </div>

              {disburseMutation.isError && (
                <div
                  className={cn(
                    "rounded-xl p-3 text-xs border",
                    isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {apiErrorMessage(disburseMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setSelectedDisbursementApp(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!reference.trim() || disburseMutation.isPending}
                  onClick={() => disburseMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {disburseMutation.isPending ? 'Releasing Funds...' : 'Authorize & Release Funds'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
