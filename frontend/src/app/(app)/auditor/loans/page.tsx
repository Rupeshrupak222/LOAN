'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function AuditorLoansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Auditor / Loans"
        title="Loan Servicing & Accounts"
        subtitle="Read-only view of active loan accounts and repayment schedules."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Loans Table component goes here in read-only mode]
        </div>
      </Card>
    </div>
  );
}
