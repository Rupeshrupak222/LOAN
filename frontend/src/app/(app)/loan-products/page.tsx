'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney } from '@/lib/utils';

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
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/loan-products')).data.data as Product[],
  });

  const columns: Column<Product>[] = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'productType', header: 'Type' },
    { key: 'range', header: 'Amount Range', render: (r) => `${formatMoney(r.minAmount)} - ${formatMoney(r.maxAmount)}` },
    { key: 'interestRate', header: 'Rate', render: (r) => `${r.interestRate}%` },
    { key: 'tenure', header: 'Tenure', render: (r) => `${r.minTenureMonths}-${r.maxTenureMonths} mo` },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => <Badge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Loan Products" subtitle="Configurable loan product catalog" />
      <DataTable columns={columns} rows={data} loading={isLoading} emptyTitle="No products" />
    </div>
  );
}
