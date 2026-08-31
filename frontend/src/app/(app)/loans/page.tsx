'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface LoanRow {
  id: string;
  loanNo: string;
  customerName: string;
  customerCode: string;
  mobile: string;
  productName: string;
  branchName?: string;
  principal: string;
  interestRate: string;
  tenureMonths: number;
  emiAmount: string;
  outstandingPrincipal: string;
  nextDueDate: string | null;
  status: string;
  disbursementDate: string | null;
}

export default function LoansPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loans', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/loans', {
        params: { search: search || undefined, status: statusFilter || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as LoanRow[];
    },
  });

  const columns: Column<LoanRow>[] = [
    {
      key: 'loanNo',
      header: 'Loan Account #',
      render: (r) => (
        <Link href={`/loans/${r.id}`} className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.loanNo}
        </Link>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-slate-100" : "text-slate-900")}>{r.customerName || 'Borrower'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
        </div>
      ),
    },
    { key: 'productName', header: 'Product' },
    { key: 'principal', header: 'Principal', render: (r) => formatMoney(r.principal || 0) },
    { key: 'emiAmount', header: 'Monthly EMI', render: (r) => formatMoney(r.emiAmount || 0) },
    {
      key: 'outstandingPrincipal',
      header: 'Outstanding Balance',
      render: (r) => <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(r.outstandingPrincipal || 0)}</span>,
    },
    {
      key: 'nextDueDate',
      header: 'Next Due',
      render: (r) => (r.nextDueDate ? formatDate(r.nextDueDate) : '-'),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    {
      key: 'id',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Link href={`/loans/${r.id}`}>
          <Button size="sm" variant="secondary" className="text-xs">
            Amortization & Pay →
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Lending / Loans"
        title="Loan Accounts & Portfolio"
        subtitle="Manage active borrowing accounts, repayment schedules, and loan balances"
        action={
          <Link href="/disbursements">
            <Button variant="secondary" size="md">
              Disbursement Queue
            </Button>
          </Link>
        }
      />

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
          <option value="">All Loan Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OVERDUE">OVERDUE</option>
          <option value="RESTRUCTURED">RESTRUCTURED</option>
          <option value="SETTLED">SETTLED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No loan accounts found"
        emptyDescription="Loans will appear here once applications are approved and disbursed."
      />
    </div>
  );
}
