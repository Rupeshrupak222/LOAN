'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CollectionAnalyticsView } from '@/features/collections/CollectionAnalyticsView';

export default function CollectionsAnalyticsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Delinquency & Portfolio Analytics"
        subtitle="Monitor macro roll-forward migration, recovery efficiency, and individual collector performance scorecards."
      />

      <CollectionAnalyticsView />
    </div>
  );
}
