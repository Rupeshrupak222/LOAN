'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { Badge, Input, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface AuditRow {
  id: string;
  user: string;
  userEmail?: string;
  role?: string;
  action: string;
  entity: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, entityFilter],
    queryFn: async () => {
      const res = await api.get('/audit', {
        params: {
          search: search || undefined,
          entity: entityFilter || undefined,
        },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as AuditRow[];
    },
  });

  const columns: Column<AuditRow>[] = [
    {
      key: 'action',
      header: 'Action / Event',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-[#2563EB]/20 border border-blue-200 dark:border-[#2B3566] px-2 py-0.5 rounded">
          {r.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (r) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {r.entity} {r.entityId ? `(#${r.entityId.slice(0, 8)})` : ''}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Performed By',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight text-xs">{r.user || 'System'}</p>
          <p className="text-[10px] text-slate-400 font-mono">{r.role || 'SYSTEM'}</p>
        </div>
      ),
    },
    {
      key: 'newValue',
      header: 'Event Payload / Changes',
      render: (r) => (
        <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-w-xs truncate bg-slate-50 dark:bg-[#060F1B] p-1 rounded border border-slate-100 dark:border-[#2B3566]">
          {r.newValue ? JSON.stringify(r.newValue) : '-'}
        </pre>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{r.createdAt ? formatDate(r.createdAt) : '-'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Administration / Compliance"
        title="Immutable Audit Trail & Compliance"
        subtitle="Append-only log of all financial disbursements, underwriting decisions, payment allocations, and customer updates"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search action, entity, or officer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:border-[#2563EB] focus:outline-none"
        >
          <option value="">All Entities</option>
          <option value="Loan">Loan Accounts</option>
          <option value="LoanApplication">Loan Applications</option>
          <option value="Payment">Payments & Repayments</option>
          <option value="Customer">Customer 360</option>
          <option value="CollectionCase">Collections</option>
          <option value="SystemSetting">System Settings</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No audit records found"
        emptyDescription="System actions and financial events will appear here in chronological order."
      />
    </div>
  );
}
