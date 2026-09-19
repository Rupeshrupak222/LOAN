'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { collectionsApi } from '@/features/collections/api';
import { CollectionQueueTable } from '@/features/collections/CollectionQueueTable';
import { ContactActivityModal } from '@/features/collections/ContactActivityModal';
import { PtpModal } from '@/features/collections/PtpModal';
import { AssignmentModal } from '@/features/collections/AssignmentModal';
import { EscalationModal } from '@/features/collections/EscalationModal';
import type { CollectionCaseSummary } from '@/features/collections/types';

export default function CollectionQueuePage() {
  const queryClient = useQueryClient();
  const [queueType, setQueueType] = useState<'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | 'ALL'>('ALL');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected case for action modals
  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  // Cases List
  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['collection-cases', selectedBucket, queueType, searchQuery],
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
        title="Collection Queue"
        subtitle="All collection cases that currently require collection action."
      />

      <CollectionQueueTable
        cases={casesData?.data || []}
        isLoading={casesLoading}
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

      {/* Action Modals */}
      <ContactActivityModal
        isOpen={activityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
      />
      <PtpModal
        isOpen={ptpModalOpen}
        onClose={() => {
          setPtpModalOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
      />
      <AssignmentModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
      />
      <EscalationModal
        isOpen={escalateModalOpen}
        onClose={() => {
          setEscalateModalOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
      />
    </div>
  );
}
