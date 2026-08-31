'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Search, ShieldCheck, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatDate, cn } from '@/lib/utils';

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  branchName?: string;
  kycStatus: string;
  status: string;
  riskCategory?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, kycFilter],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: {
          search: search || undefined,
          kycStatus: kycFilter || undefined,
        },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as CustomerRow[];
    },
  });

  const columns: Column<CustomerRow>[] = [
    {
      key: 'customerCode',
      header: 'Customer ID',
      render: (r) => (
        <Link href={`/customers/${r.id}`} className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
          {r.customerCode}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Borrower Name',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-slate-100" : "text-slate-900")}>{r.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">{r.email || 'No email'}</p>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (r) => (
        <span className={cn("flex items-center gap-1 font-mono text-xs", isDark ? "text-slate-300" : "text-slate-700")}>
          <Phone className="h-3 w-3 text-slate-400" />
          {r.mobile}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'City / State',
      render: (r) => (
        <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>
          {r.city || '-'}{r.state ? `, ${r.state}` : ''}
        </span>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC Status',
      render: (r) => <Badge status={r.kycStatus} />,
    },
    {
      key: 'riskCategory',
      header: 'Risk',
      render: (r) => (
        r.riskCategory ? <Badge status={r.riskCategory} /> : <span className="text-slate-400 text-xs">-</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarded',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'id',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Link href={`/customers/${r.id}`}>
          <Button size="sm" variant="secondary" className="text-xs">
            Borrower 360 →
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Customers / Directory"
        title="Borrower Directory & KYC Profiles"
        subtitle="Manage customer registrations, identity verification status, and borrower credit histories"
        action={
          <Link href="/customers/new">
            <Button className="flex items-center gap-1.5 text-white">
              <UserPlus className="h-4 w-4" /> Add Customer
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search by name, ID, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className={cn(
            "h-9 rounded-xl border px-3 text-xs font-semibold shadow-sm focus:border-[#2563EB] focus:outline-none",
            isDark
              ? "border-[#2B3566] bg-[#1E2445] text-slate-200"
              : "border-slate-200 bg-white text-slate-700"
          )}
        >
          <option value="">All KYC Statuses</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No borrowers found"
        emptyDescription="Start by onboarding a new customer into the LMS."
        emptyAction={
          <Link href="/customers/new">
            <Button size="sm" className="text-white">+ Add Customer</Button>
          </Link>
        }
      />
    </div>
  );
}
