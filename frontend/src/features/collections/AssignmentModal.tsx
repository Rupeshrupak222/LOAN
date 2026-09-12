'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Button, Card, Input } from '@/components/ui';
import { collectionsApi } from './api';
import type { CollectionCaseSummary } from './types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CollectionCaseSummary | null;
}

export function AssignmentModal({ isOpen, onClose, caseItem }: AssignmentModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [strategy, setStrategy] = useState<'MANUAL' | 'ROUND_ROBIN' | 'WORKLOAD_BALANCED' | 'PRODUCT_SPECIALIST' | 'HIGH_TICKET'>('MANUAL');
  const [notes, setNotes] = useState('');

  // Fetch active users with collection roles
  const { data: usersData } = useQuery({
    queryKey: ['collection-officers'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { pageSize: 50 } });
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!caseItem) return;
      return collectionsApi.assignCase(caseItem.id, {
        assignedToUserId,
        strategy,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Case assigned successfully.');
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['collection-case-detail', caseItem?.id] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Assignment Failed' });
    },
  });

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Assign Collection Case
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Assign case <span className="font-mono text-blue-400 font-semibold">{caseItem.caseNo}</span> ({caseItem.customerName}, DPD {caseItem.dpd}) to a collection officer.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Collection Officer *
            </label>
            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Choose Officer --</option>
              {usersData?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assignment Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="MANUAL">Manual Direct Assignment</option>
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="WORKLOAD_BALANCED">Workload Capacity Balanced</option>
              <option value="PRODUCT_SPECIALIST">Product Specialist</option>
              <option value="HIGH_TICKET">High Ticket Prioritization</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assignment Instructions / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority customer, negotiate PTP or field visit if unresponsive"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={assignMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => assignMutation.mutate()}
              disabled={!assignedToUserId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
