'use client';

import { PageHeader } from '@/components/PageHeader';
import { Card, EmptyState } from '@/components/ui';

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Append-only record of system actions" />
      <Card>
        <EmptyState
          title="No audit entries to display"
          description="Audit entries are recorded as domain actions occur."
        />
      </Card>
    </div>
  );
}
