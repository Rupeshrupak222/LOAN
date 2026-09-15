'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionDueOverduePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / Due & Overdue"
        title="Due & Overdue Servicing"
        subtitle="Monitor upcoming dues, early delinquency, and severe delinquency cases."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Due and Overdue Accounts Table component goes here]
        </div>
      </Card>
    </div>
  );
}
