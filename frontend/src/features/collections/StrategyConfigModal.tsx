'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card } from '@/components/ui';
import { collectionsApi } from './api';

interface StrategyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StrategyConfigModal({ isOpen, onClose }: StrategyConfigModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dpdWeight, setDpdWeight] = useState('35');
  const [overdueWeight, setOverdueWeight] = useState('25');
  const [riskGradeWeight, setRiskGradeWeight] = useState('15');
  const [brokenPtpWeight, setBrokenPtpWeight] = useState('15');
  const [contactWeight, setContactWeight] = useState('10');

  const createMutation = useMutation({
    mutationFn: async () => {
      return collectionsApi.createStrategy({
        name,
        description,
        priorityWeights: {
          dpdWeight: parseFloat(dpdWeight) / 100,
          overdueAmountWeight: parseFloat(overdueWeight) / 100,
          riskGradeWeight: parseFloat(riskGradeWeight) / 100,
          brokenPtpWeight: parseFloat(brokenPtpWeight) / 100,
          contactabilityWeight: parseFloat(contactWeight) / 100,
        },
      });
    },
    onSuccess: () => {
      toast.success('Collection Strategy draft created successfully.');
      queryClient.invalidateQueries({ queryKey: ['collection-strategies'] });
      onClose();
      setName('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Strategy Creation Failed' });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Draft Collection Strategy Version
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Configure multi-factor priority weights and bucket outreach rules.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Strategy Policy Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Instant Micro-Loan Aggressive Recovery v2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Policy Description & Target Segments
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail delinquency triggers, communication cadences, and target loan products..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Priority Weighting Sliders / Percentages */}
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
            <h4 className="font-semibold text-slate-200 text-xs mb-2">Priority Score Calibration Weights (Total = 100%)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">DPD Factor (%)</label>
                <input
                  type="number"
                  value={dpdWeight}
                  onChange={(e) => setDpdWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Overdue Amount (%)</label>
                <input
                  type="number"
                  value={overdueWeight}
                  onChange={(e) => setOverdueWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Risk Grade / Score (%)</label>
                <input
                  type="number"
                  value={riskGradeWeight}
                  onChange={(e) => setRiskGradeWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 mt-0.5"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Broken PTPs (%)</label>
                <input
                  type="number"
                  value={brokenPtpWeight}
                  onChange={(e) => setBrokenPtpWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 mt-0.5"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Failed Contactability (%)</label>
              <input
                type="number"
                value={contactWeight}
                onChange={(e) => setContactWeight(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 mt-0.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Draft Strategy'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
