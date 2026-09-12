'use client';

import React from 'react';
import { CustomerCreditLineView } from '@/features/credit-limits';

export default function CustomerCreditPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <CustomerCreditLineView />
    </div>
  );
}
