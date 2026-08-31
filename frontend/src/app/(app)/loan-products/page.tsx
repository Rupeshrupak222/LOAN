'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, cn } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  productType: string;
  minAmount: string;
  maxAmount: string;
  interestRate: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  isActive: boolean;
}

export default function LoanProductsPage() {
  const { isDark } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/loan-products');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as Product[];
    },
  });

  const columns: Column<Product>[] = [
    {
      key: 'code',
      header: 'Product Code',
      render: (r) => (
        <span className={cn("font-mono font-bold text-xs", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (r) => (
        <div>
          <p className={cn("font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            {r.name}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">{r.productType}</p>
        </div>
      ),
    },
    {
      key: 'productType',
      header: 'Category',
      render: (r) => (
        <span className={cn("text-xs font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>
          {r.productType}
        </span>
      ),
    },
    {
      key: 'range',
      header: 'Sanction Range',
      render: (r) => (
        <span className={cn("font-semibold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>
          {formatMoney(r.minAmount || 0)} – {formatMoney(r.maxAmount || 0)}
        </span>
      ),
    },
    {
      key: 'interestRate',
      header: 'Annual Rate',
      render: (r) => (
        <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-slate-900")}>
          {r.interestRate || '0'}% p.a.
        </span>
      ),
    },
    {
      key: 'tenure',
      header: 'Tenure Limits',
      render: (r) => (
        <span className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
          {r.minTenureMonths || 0} – {r.maxTenureMonths || 0} mos
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'right',
      render: (r) => <Badge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Lending / Catalog"
        title="Loan Products & Policy Terms"
        subtitle="Configurable lending catalog with interest rates, tenure boundaries, and processing fees"
      />

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No loan products configured"
      />
    </div>
  );
}
