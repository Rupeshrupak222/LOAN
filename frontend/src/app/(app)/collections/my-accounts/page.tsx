'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export default function CollectionMyAccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Collections / My Accounts"
        title="Assigned Accounts"
        subtitle="View borrower details, loan specifics, and repayment schedules for your assigned portfolio."
      />
      <Card className="p-6 border border-slate-800/80 bg-slate-900/50">
        <div className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-700/50 rounded-lg">
          [Assigned Accounts Table component goes here]
        </div>
      </Card>
    </div>
  );
}
