'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface AppRow {
  id: string;
  applicationNo: string;
  customerName: string;
  product: string;
  requestedAmount: string;
  tenureMonths: number;
  status: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      render: (r) => (
        <Link href={`/applications/${r.id}`}>
          <Button size="sm" variant="secondary" className="text-xs">
            Review 360 →
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Lending / Applications"
        title="Loan Applications Queue"
        subtitle="Manage and track borrowing requests through eligibility, scoring, and underwriting"
        action={
          <Link href="/applications/new">
            <Button className="flex items-center gap-1.5 text-white">
              <Plus className="h-4 w-4" /> Originate Application
            </Button>
          </Link>
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
    </div>
  );
}
