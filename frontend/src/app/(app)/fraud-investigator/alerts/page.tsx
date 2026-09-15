'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function FraudInvestigatorAlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Fraud Investigator / Alerts"
        title="Fraud Alerts"
        subtitle="Monitor identity mismatches, velocity anomalies, and suspected fraudulent patterns."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Alerts Table Component]
        </div>
      </Card>
    </div>
  );
}
