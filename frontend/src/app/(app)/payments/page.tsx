'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Download, Receipt, Search, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate, cn } from '@/lib/utils';

interface PaymentRow {
  id: string;
  paymentNo: string;
  loanNo: string;
  customerName: string;
  customerCode: string;
  amount: string;
  method: string;
  reference: string;
  status: string;
  allocations: { bucket: string; amount: string }[];
  paidAt: string;
}

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', search],
    queryFn: async () => {
      const res = await api.get('/payments', {
        params: { search: search || undefined },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as PaymentRow[];
    },
  });

  const columns: Column<PaymentRow>[] = [
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
        <span className={cn("font-semibold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>
          {r.loanNo}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>{r.customerName || 'Borrower'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{r.customerCode || '-'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (r) => <span className="font-bold text-emerald-600 dark:text-[#10B981]">{formatMoney(r.amount || 0)}</span>,
    },
    {
      key: 'method',
      header: 'Payment Method',
      render: (r) => <span className={cn("text-xs", isDark ? "text-slate-300" : "text-slate-700")}>{r.method}</span>,
    },
    {
      key: 'allocations',
      header: 'Waterfall Allocations',
      render: (r) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {Array.isArray(r.allocations) &&
            r.allocations.map((a, i) => (
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
    { key: 'reference', header: 'UTR / Ref', render: (r) => <span className={cn("font-mono text-xs", isDark ? "text-slate-300" : "text-slate-600")}>{r.reference || '-'}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'paidAt', header: 'Timestamp', render: (r) => <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>{r.paidAt ? formatDate(r.paidAt) : '-'}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Servicing / Payments"
        title="Repayment Transactions & Ledger"
        subtitle="Immutable financial audit trail of collected EMIs and waterfall bucket allocations"
        action={
          <Link href="/loans">
            <Button size="md" className="flex items-center gap-1.5 text-white">
              <Plus className="h-4 w-4" /> Record Repayment
            </Button>
          </Link>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search receipt #, UTR, or borrower..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No payment transactions recorded"
        emptyDescription="Collected EMI repayments and settlements will appear in this ledger."
      />
    </div>
  );
}
