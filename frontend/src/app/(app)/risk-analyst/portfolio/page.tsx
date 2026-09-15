'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function RiskAnalystPortfolioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk Analyst / Portfolio Risk"
        title="Portfolio Risk Analytics"
        subtitle="Read-only analysis of portfolio distribution, DPD trends, and high-risk segments."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Portfolio Risk Component]
        </div>
      </Card>
    </div>
  );
}
