'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function FraudInvestigatorApplicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fraud Investigator / Applications"
        title="Application Investigation"
        subtitle="Read-only view for investigating suspicious loan applications."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Applications Table Component - Read Only]
        </div>
      </Card>
    </div>
  );
}
