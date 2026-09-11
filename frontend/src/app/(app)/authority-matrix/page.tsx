'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthorityMatrixManagement } from '@/features/approval-matrix';

export default function AuthorityMatrixPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AuthorityMatrixManagement />
    </div>
  );
}
