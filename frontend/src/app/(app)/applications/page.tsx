'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, formatDate } from '@/lib/utils';

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
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await api.get('/applications')).data.data as AppRow[],
  });

  const columns: Column<AppRow>[] = [
    { key: 'applicationNo', header: 'Application' },
    { key: 'customerName', header: 'Customer' },
    { key: 'product', header: 'Product' },
    { key: 'requestedAmount', header: 'Amount', render: (r) => formatMoney(r.requestedAmount) },
    { key: 'tenureMonths', header: 'Tenure', render: (r) => `${r.tenureMonths} mo` },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Loan Applications" subtitle="Track applications through the lifecycle" />
      <DataTable columns={columns} rows={data} loading={isLoading} emptyTitle="No applications" />
    </div>
  );
}
