'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function FraudInvestigatorCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fraud Investigator / My Cases"
        title="My Cases"
        subtitle="Manage and track your active fraud investigations and their outcomes."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [My Cases Table Component]
        </div>
      </Card>
    </div>
  );
}
