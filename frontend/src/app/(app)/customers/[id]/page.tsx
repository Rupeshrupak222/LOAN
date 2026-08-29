'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => (await api.get(`/customers/${params.id}`)).data.data,
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={`${data.firstName} ${data.lastName}`}
        subtitle={`${data.customerCode} · ${data.mobile}`}
        action={<Badge status={data.status} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Active Loans" value={String(data.summary.activeLoans)} />
        <KpiCard label="Closed Loans" value={String(data.summary.closedLoans)} />
        <KpiCard label="Current Outstanding" value={formatMoney(data.summary.currentOutstanding)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Personal Information</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={data.email} />
            <Row label="City" value={data.city} />
            <Row label="State" value={data.state} />
            <Row label="Employment" value={data.employmentType} />
            <Row label="Employer" value={data.employerName} />
            <Row label="Monthly Income" value={data.monthlyIncome ? formatMoney(data.monthlyIncome) : '-'} />
            <Row label="KYC Status" value={<Badge status={data.kycStatus} />} />
            <Row label="Risk Category" value={<Badge status={data.riskCategory} />} />
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Applications</h3>
          {data.applications?.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {data.applications.map((a: { id: string; applicationNo: string; product: { name: string }; requestedAmount: string; status: string }) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-slate-800">{a.applicationNo}</p>
                    <p className="text-xs text-slate-400">
                      {a.product?.name} · {formatMoney(a.requestedAmount)}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No applications yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value ?? '-'}</dd>
    </div>
  );
}
