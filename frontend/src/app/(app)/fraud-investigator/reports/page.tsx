'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function FraudInvestigatorReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fraud Investigator / Reports"
        title="Fraud Reporting"
        subtitle="View reports on fraud case volumes, investigation SLAs, and outcomes."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Fraud Reports Component]
        </div>
      </Card>
    </div>
  );
}
