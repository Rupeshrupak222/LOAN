'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CreditFacilityDetail } from '@/features/credit-limits';

export default function CreditFacilityDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CreditFacilityDetail facilityId={id} />
    </div>
  );
}
