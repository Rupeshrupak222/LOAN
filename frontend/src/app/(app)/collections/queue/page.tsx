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

export default function CollectionsQueuePage() {
  const [queueType, setQueueType] = useState<'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | 'ALL'>('MY_QUEUE');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases-queue', selectedBucket, queueType, searchQuery],
    queryFn: () =>
      collectionsApi.listCases({
        bucket: selectedBucket || undefined,
        queueType: queueType === 'ALL' ? undefined : queueType,
        search: searchQuery || undefined,
      }),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Collector Work Queue"
        subtitle="Operational delinquent case queue with DPD aging, risk-calibrated priority scores, and follow-up triggers."
      />

      <CollectionQueueTable
        cases={casesData?.data || []}
        isLoading={isLoading}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
        queueType={queueType}
        onSelectQueueType={setQueueType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenActivity={(c) => {
          setSelectedCase(c);
          setActivityModalOpen(true);
        }}
        onOpenPtp={(c) => {
          setSelectedCase(c);
          setPtpModalOpen(true);
        }}
        onOpenAssign={(c) => {
          setSelectedCase(c);
          setAssignModalOpen(true);
        }}
        onOpenEscalate={(c) => {
          setSelectedCase(c);
          setEscalateModalOpen(true);
        }}
      />

      <ContactActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        caseItem={selectedCase}
      />
      <PtpModal
        isOpen={ptpModalOpen}
        onClose={() => setPtpModalOpen(false)}
        caseItem={selectedCase}
      />
      <AssignmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        caseItem={selectedCase}
      />
      <EscalationModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        caseItem={selectedCase}
      />
    </div>
  );
}
