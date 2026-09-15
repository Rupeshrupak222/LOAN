'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function RiskFraudApplicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk & Fraud / Applications"
        title="Application Risk Review"
        subtitle="Read-only risk and fraud assessment view of loan applications."
      />
      <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
        <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
          [Applications Table Component - Read Only]
        </div>
      </Card>
    </div>
  );
}
