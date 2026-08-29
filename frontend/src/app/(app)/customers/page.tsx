'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
  email: string | null;
  kycStatus: string;
  riskCategory: string | null;
  status: string;
  activeLoans: number;
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search: search || undefined } });
      return res.data.data as CustomerRow[];
    },
  });

  const columns: Column<CustomerRow>[] = [
    { key: 'customerCode', header: 'Customer ID' },
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <Link href={`/customers/${r.id}`} className="font-medium text-brand-600 hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: 'mobile', header: 'Mobile' },
    { key: 'kycStatus', header: 'KYC', render: (r) => <Badge status={r.kycStatus} /> },
    { key: 'riskCategory', header: 'Risk', render: (r) => <Badge status={r.riskCategory} /> },
    { key: 'activeLoans', header: 'Loans' },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer records and KYC"
        action={
          <Link href="/customers/new">
            <Button>+ New Customer</Button>
          </Link>
        }
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, mobile, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={data} loading={isLoading} emptyTitle="No customers yet" />
    </div>
  );
}
