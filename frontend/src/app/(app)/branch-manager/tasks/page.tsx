'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function BranchManagerTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Branch Manager / Team & Tasks"
        title="Team & Tasks"
        subtitle="View team workload and manage branch-level task assignments."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Team & Tasks Component]
        </div>
      </Card>
    </div>
  );
}
