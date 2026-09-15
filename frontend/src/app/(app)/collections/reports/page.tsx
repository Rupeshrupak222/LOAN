'use client';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionReportsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Reports"
        title="Reports"
        subtitle="View and export collection performance and recovery metrics."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Collection reports dashboard will render here]
        </div>
      </Card>
    </div>
  );
}
