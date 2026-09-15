'use client';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionPaymentsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Payments"
        title="Payments"
        subtitle="Read-only view of recorded payments, allocations, and recovered amounts."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Read-only payments ledger view will render here. Modifications are not authorized.]
        </div>
      </Card>
    </div>
  );
}
