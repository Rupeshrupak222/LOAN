'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PartnerConfigurationStudio } from '@/features/partners';

export default function PartnerStudioPage() {
  const params = useParams();
  const id = (params?.id as string) || 'part-demo-001';

  return <PartnerConfigurationStudio partnerId={id} />;
}
