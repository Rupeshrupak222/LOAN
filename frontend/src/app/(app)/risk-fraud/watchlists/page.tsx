'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function RiskFraudWatchlistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk & Fraud / Watchlists"
        title="Regulatory Watchlists"
        subtitle="Review and manage entries in high-risk or sanctioned identity watchlists."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Watchlists Component]
        </div>
      </Card>
    </div>
  );
}
