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

export default function CollectionDueOverduePage() {
  const [selectedBucket, setSelectedBucket] = useState('SMA-0');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCase, setSelectedCase] = useState<CollectionCaseSummary | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases', selectedBucket, 'ALL', searchQuery],
    queryFn: () => collectionsApi.listCases({ bucket: selectedBucket, search: searchQuery || undefined }),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        breadcrumb="Collections / Due & Overdue"
        title="Due & Overdue Cases"
        subtitle="View and manage cases based on delinquency buckets (SMA-0, SMA-1, SMA-2)."
      />

      <CollectionQueueTable
        cases={casesData?.data || []}
        isLoading={isLoading}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
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
