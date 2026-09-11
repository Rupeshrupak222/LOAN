'use client';

import { use } from 'react';
import { TenantDetailView } from '@/features/tenants';

interface TenantPageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailPage({ params }: TenantPageProps) {
  const resolvedParams = use(params);
  return <TenantDetailView tenantId={resolvedParams.id} />;
}
