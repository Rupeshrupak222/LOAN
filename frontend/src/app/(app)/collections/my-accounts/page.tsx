'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { collectionsApi } from '@/features/collections/api';
import { CollectionQueueTable } from '@/features/collections/CollectionQueueTable';
import { ContactActivityModal } from '@/features/collections/ContactActivityModal';
import { PtpModal } from '@/features/collections/PtpModal';
import { AssignmentModal } from '@/features/collections/AssignmentModal';
import { EscalationModal } from '@/features/collections/EscalationModal';
import type { CollectionCaseSummary } from '@/features/collections/types';

export default function CollectionMyAccountsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases', 'MY_QUEUE', searchQuery],
    queryFn: () => collectionsApi.listCases({ queueType: 'MY_QUEUE', search: searchQuery || undefined }),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / My Accounts"
        title="My Assigned Accounts"
        subtitle="Manage your personal portfolio of overdue accounts."
      />
      <Card className="p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm">
        <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
          [Assigned Accounts Table component goes here]
        </div>
      </Card>
    </div>
  );
}
