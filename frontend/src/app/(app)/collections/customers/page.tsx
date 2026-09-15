'use client';
import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionCustomersPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Customers"
        title="Customers"
        subtitle="View borrower profiles, contact details, and interaction history."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Customer search and directory view will render here]
        </div>
      </Card>
    </div>
  );
}
