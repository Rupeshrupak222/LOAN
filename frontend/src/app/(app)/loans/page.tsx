'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, EmptyState } from '@/components/ui';

export default function LoansPage() {
  return (
    <div>
      <PageHeader title="Loans" subtitle="Active loan accounts" />
      <Card>
        <EmptyState
          title="Loan accounts appear here after disbursement"
          description="This module is scaffolded. Disbursement wiring comes next."
        />
      </Card>
    </div>
  );
}
