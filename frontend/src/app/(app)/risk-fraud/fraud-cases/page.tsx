'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function RiskFraudCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk & Fraud / Fraud Cases"
        title="Fraud Case Management"
        subtitle="Manage and track active and historical fraud investigations and their outcomes."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Fraud Cases Table Component]
        </div>
      </Card>
    </div>
  );
}
