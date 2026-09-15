'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionQueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / Collection Queue"
        title="Delinquency Collection Queue"
        subtitle="Manage assigned overdue accounts, prioritize by DPD, and track next actions."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Collection Queue Table component goes here]
        </div>
      </Card>
    </div>
  );
}
