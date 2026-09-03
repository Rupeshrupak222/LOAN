'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Spinner } from './ui';

interface EarlyWarningWidgetProps {
  applicationId?: string;
  customerId?: string;
  loanId?: string;
  className?: string;
}

export function EarlyWarningWidget({
  applicationId,
  customerId,
  loanId,
  className,
}: EarlyWarningWidgetProps) {
  const queryClient = useQueryClient();
  const [resolveModalAlert, setResolveModalAlert] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const queryParams = new URLSearchParams();
  if (applicationId) queryParams.set('applicationId', applicationId);
  if (customerId) queryParams.set('customerId', customerId);
  if (loanId) queryParams.set('loanId', loanId);
  queryParams.set('status', 'OPEN');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['early-warnings', applicationId, customerId, loanId],
    queryFn: async () => {
      const res = await api.get(`/early-warnings?${queryParams.toString()}`);
      return res.data?.data || [];
    },
    enabled: Boolean(applicationId || customerId || loanId),
  });

  const ackMutation = useMutation({
    mutationFn: async (warningId: string) => {
      const res = await api.post(`/early-warnings/${warningId}/acknowledge`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['early-warnings'] });
    },
    onError: (err: any) => {
      alert(`Acknowledge failed: ${apiErrorMessage(err)}`);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ warningId, notes }: { warningId: string; notes: string }) => {
      const res = await api.post(`/early-warnings/${warningId}/resolve`, { resolutionNotes: notes });
      return res.data?.data;
    },
    onSuccess: () => {
      setResolveModalAlert(null);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['early-warnings'] });
    },
    onError: (err: any) => {
      alert(`Resolve failed: ${apiErrorMessage(err)}`);
    },
  });

  if (isLoading || alerts.length === 0) return null;

  const topAlert = alerts[0];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-200';
      case 'HIGH':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200';
      case 'MEDIUM':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-800 dark:text-blue-200';
      default:
        return 'border-slate-500/50 bg-slate-500/10 text-slate-800 dark:text-slate-200';
    }
  };

  return (
    <>
      <div
        className={cn(
          'p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all',
          getPriorityStyle(topAlert.priority),
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white">{topAlert.title}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-white/60 dark:bg-black/40">
                {topAlert.priority}
              </span>
              {alerts.length > 1 && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  +{alerts.length - 1} more alert(s)
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {topAlert.whatHappened} — <em>{topAlert.recommendedHumanAction}</em>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => ackMutation.mutate(topAlert.warningId)}
            disabled={ackMutation.isPending}
            className="text-[10px] h-7 px-2"
          >
            Acknowledge
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setResolveModalAlert(topAlert)}
            className="text-[10px] h-7 px-2"
          >
            Resolve
          </Button>
          <Link
            href="/early-warnings"
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center hover:underline pl-1"
          >
            Center <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Resolve Early Warning Alert
              </h3>
              <button
                type="button"
                onClick={() => setResolveModalAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {resolveModalAlert.title}
              </p>
              <p className="text-[11px] text-slate-500">{resolveModalAlert.evidence}</p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes * (Mandatory Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail actions taken to investigate and resolve this alert..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-transparent focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setResolveModalAlert(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={resolutionNotes.trim().length < 5 || resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({
                    warningId: resolveModalAlert.warningId,
                    notes: resolutionNotes,
                  })
                }
                className="text-xs cursor-pointer"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
