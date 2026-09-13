'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Layers } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { useOperationsApplications } from '@/lib/hooks/useOperations';
import { ApplicationFilters } from '@/components/operations/ApplicationFilters';
import { ApplicationTable } from '@/components/operations/ApplicationTable';
import { CreateApplicationModal } from '@/components/operations/CreateApplicationModal';
import { ListApplicationsQuery } from '@/lib/api/operations';
import { useAuth } from '@/lib/auth';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    applications,
    meta,
    loading,
    query,
    updateFilters,
    changePage,
    refetch,
  } = useOperationsApplications({
    page: 1,
    pageSize: 15,
    search: '',
    stage: '',
    priority: '',
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });

  const canCreate = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'LOAN_OFFICER', 'OPERATIONS_MANAGER', 'OPERATIONS_OFFICER', 'BRANCH_MANAGER'].includes(r)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations / Applications"
        title="Loan Applications Directory"
        subtitle="Search, filter, assign, and track all lending applications across their end-to-end lifecycle."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Originate Application
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Control Bar */}
      <ApplicationFilters
        filters={query}
        onFilterChange={updateFilters}
        onReset={() => updateFilters({ search: '', stage: '', priority: '', startDate: '', endDate: '' })}
      />

      {/* Application Master Table */}
      <ApplicationTable
        applications={applications}
        meta={meta}
        loading={loading}
        onPageChange={changePage}
      />

      {/* Originate Application Wizard Modal */}
      <CreateApplicationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          refetch();
        }}
      />
    </div>
  );
}
