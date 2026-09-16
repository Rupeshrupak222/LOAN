'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Settings } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { collectionsApi } from '@/features/collections/api';
import { StrategyConfigModal } from '@/features/collections/StrategyConfigModal';

export default function CollectionStrategiesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: strategies, isLoading } = useQuery({
    queryKey: ['collection-strategies-page'],
    queryFn: () => collectionsApi.listStrategies(),
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Collection Strategies & Policies"
        subtitle="Configure institutional delinquency recovery policies, priority weightings, and versioning."
        action={
          <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Draft New Strategy
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies?.map((strat) => (
          <Card key={strat.id} className="p-5 space-y-3 shadow-sm dark:shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{strat.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{strat.description}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                {strat.status} (v{strat.version})
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-200">Priority Score Calibration Weights:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <div>DPD Factor: <span className="text-slate-800 dark:text-slate-200 font-medium">{strat.priorityWeights?.dpdWeight * 100}%</span></div>
                <div>Overdue Factor: <span className="text-slate-800 dark:text-slate-200 font-medium">{strat.priorityWeights?.overdueAmountWeight * 100}%</span></div>
                <div>Risk Grade: <span className="text-slate-800 dark:text-slate-200 font-medium">{strat.priorityWeights?.riskGradeWeight * 100}%</span></div>
                <div>Broken PTPs: <span className="text-slate-800 dark:text-slate-200 font-medium">{strat.priorityWeights?.brokenPtpWeight * 100}%</span></div>
              </div>
            </div>

            <div className="text-slate-500 text-[11px] flex justify-between items-center pt-1">
              <span>Effective: {new Date(strat.effectiveDate).toLocaleDateString()}</span>
              {strat.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={async () => {
                    await collectionsApi.activateStrategy(strat.id);
                    toast.success('Strategy activated.');
                    queryClient.invalidateQueries({ queryKey: ['collection-strategies-page'] });
                  }}
                >
                  Activate
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <StrategyConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
