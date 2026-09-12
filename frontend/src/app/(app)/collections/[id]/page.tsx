'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { PageHeader } from '@/components/PageHeader';
import { collectionsApi } from '@/features/collections/api';
import { CollectionCaseDetail } from '@/features/collections/CollectionCaseDetail';

export default function CollectionCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ['collection-case-detail', caseId],
    queryFn: () => collectionsApi.getCaseDetail(caseId),
    enabled: Boolean(caseId),
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium">Loading collection case docket...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-3">
        <p className="text-sm font-medium text-rose-400">Collection case not found or unauthorized.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/collections')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Collections Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => router.push('/collections')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Queue
        </Button>
      </div>

      <CollectionCaseDetail caseData={caseData} />
    </div>
  );
}
