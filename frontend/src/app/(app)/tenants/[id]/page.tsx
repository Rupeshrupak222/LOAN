'use client';

import { TenantDetailView } from '@/features/tenants';

interface TenantPageProps {
  params: { id: string };
}

export default function TenantDetailPage({ params }: TenantPageProps) {
  return <TenantDetailView tenantId={params.id} />;
}
