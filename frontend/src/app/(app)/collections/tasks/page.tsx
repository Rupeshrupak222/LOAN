'use client';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionTasksPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Tasks"
        title="Tasks"
        subtitle="Manage follow-ups, field visit assignments, and escalations."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Task management list will render here]
        </div>
      </Card>
    </div>
  );
}
