'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
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
  kycStatus?: string;
  riskCategory?: string;
  product: string;
  requestedAmount: string;
  tenureMonths: number;
  status: string;
  createdAt: string;
}

const STATUS_TABS = [
  { key: '', label: 'All Applications' },
  { key: 'SUBMITTED', label: 'New Submissions (Action Required)', alert: true },
  { key: 'UNDERWRITING', label: 'Underwriting' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'READY_FOR_DISBURSEMENT', label: 'Ready for Disbursal' },
  { key: 'DISBURSED', label: 'Disbursed' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function ApplicationsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/applications', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          page,
          pageSize,
        },
      });
      return {
        rows: (Array.isArray(res.data?.data) ? res.data.data : []) as AppRow[],
        pagination: res.data?.pagination || { page: 1, pageSize, total: 0, totalPages: 1 },
      };
    },
  });

  const rows = queryResult?.rows || [];
  const pagination = queryResult?.pagination || { page: 1, pageSize, total: 0, totalPages: 1 };

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
      render: (r) => (
        <span className={cn('font-bold', isDark ? 'text-white' : 'text-slate-900')}>
          {formatMoney(r.requestedAmount || 0)}
        </span>
      ),
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

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
              statusFilter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            )}
          >
            <span>{tab.label}</span>
            {tab.alert && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Search Bar & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Search borrower name, email, application #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch(e => '');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className={cn(
              'h-9 rounded-xl border px-2.5 text-xs font-semibold shadow-2xs focus:border-[#2563EB] focus:outline-none',
              isDark
                ? 'border-[#2B3566] bg-[#1E2445] text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyTitle="No loan applications found"
        emptyDescription="No applications match your search or status filter."
        emptyAction={
          <Link href="/applications/new">
            <Button size="sm" className="text-white">+ Originate Application</Button>
          </Link>
        }
      />

      {/* Pagination Footer */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-1">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {(page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(page * pageSize, pagination.total)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {pagination.total}
            </span>{' '}
            applications
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>

            <span className="px-2 text-xs font-medium">
              Page {page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
