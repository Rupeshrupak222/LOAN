'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ApprovalDetailView } from '@/features/approval-matrix';

export default function ApprovalTaskDetailPage() {
  const params = useParams();
  const taskId = (params?.id as string) || '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ApprovalDetailView taskId={taskId} />
    </div>
  );
}
