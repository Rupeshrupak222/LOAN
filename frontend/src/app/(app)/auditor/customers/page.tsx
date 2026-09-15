'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function AuditorCustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Auditor / Customers"
        title="Customer Profiles & KYC Audit"
        subtitle="Read-only view of customer directory and verification records."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Customers Table component goes here in read-only mode]
        </div>
      </Card>
    </div>
  );
}
