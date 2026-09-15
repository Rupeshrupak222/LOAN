'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionCustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / Customers"
        title="Borrower Directory"
        subtitle="Search and view contact information for borrowers in your assigned collection portfolio."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Customers Table component goes here]
        </div>
      </Card>
    </div>
  );
}
