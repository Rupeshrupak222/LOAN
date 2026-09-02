'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, ShieldCheck, Phone, Trash2, CheckSquare, X, AlertTriangle } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const customersList = data || [];
  const allIds = customersList.map((r) => r.id);
  const isAllSelected = customersList.length > 0 && selectedIds.length === customersList.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...allIds]);
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/customers/${id}`)));
      setSelectedIds([]);
      setDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      setDeleteError(apiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: Column<CustomerRow>[] = [
    {
      key: 'select',
      header: (
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={toggleSelectAll}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            aria-label="Select all customers"
            className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
          />
        </div>
      ),
      className: 'w-10 text-center',
      render: (r) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedIds.includes(r.id)}
            onChange={() => toggleSelectOne(r.id)}
            aria-label={`Select ${r.name}`}
            className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
          />
        </div>
      ),
    },
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
      render: (r) => formatDateTime(r.createdAt),
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

      {/* Floating Selection Toolbar when 1+ candidates are selected */}
      {selectedIds.length > 0 && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-200',
            isDark
              ? 'border-blue-900/60 bg-[#16203D] text-white shadow-black/40'
              : 'border-blue-200 bg-blue-50/90 text-blue-950 shadow-blue-100/50'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-bold shadow-2xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">
              {selectedIds.length === 1
                ? '1 Candidate selected'
                : `${selectedIds.length} Candidates selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected Candidate{selectedIds.length > 1 ? 's' : ''}</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Selection</span>
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
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

      {/* Data Table */}
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

      {/* Bulk Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Selected Candidates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanently erase {selectedIds.length} candidate(s) from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the <strong>{selectedIds.length} selected customer(s)</strong>? This will permanently wipe their customer profiles, uploaded documents, bank details, and borrower portal logins from the database.
            </p>

            {deleteError && (
              <p className="text-xs text-rose-600">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : `Yes, Delete (${selectedIds.length}) Candidates`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
