'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionPromiseToPayPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / Promise to Pay"
        title="Promise to Pay (PTP) Tracker"
        subtitle="Record commitments, track fulfillment, and manage broken promises."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [PTP Tracking Table component goes here]
        </div>
      </Card>
    </div>
  );
}
