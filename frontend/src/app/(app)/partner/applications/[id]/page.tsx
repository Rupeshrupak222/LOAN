'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PartnerApplicationDetail } from '@/features/partners';

export default function PartnerApplicationDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'APP-NEXUS-001';

  return <PartnerApplicationDetail partnerApplicationId={id} />;
}
