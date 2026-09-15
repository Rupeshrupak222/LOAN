'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function RiskAnalystSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Risk Analyst / Support"
        title="Support Tickets"
        subtitle="View and raise support tickets for internal system issues or risk escalations."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Support Tickets Component]
        </div>
      </Card>
    </div>
  );
}
