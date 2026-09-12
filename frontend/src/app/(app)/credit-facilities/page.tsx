'use client';

import React from 'react';
import { CreditFacilityList } from '@/features/credit-limits';

export default function CreditFacilitiesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CreditFacilityList />
    </div>
  );
}
