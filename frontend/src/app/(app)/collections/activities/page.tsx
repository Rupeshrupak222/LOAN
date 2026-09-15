'use client';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionActivitiesPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Activities"
        title="Collection Activities"
        subtitle="Log of all collection calls, SMS, emails, and field visits."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Collection Activities feed and reports will render here]
        </div>
      </Card>
    </div>
  );
}
