'use client';

import React from 'react';
import { CreditLimitPolicyManagement } from '@/features/credit-limits';

export default function CreditPoliciesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CreditLimitPolicyManagement />
    </div>
  );
}
