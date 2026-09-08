'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Calculator,
  FileCheck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  X,
  Filter,
  Layers,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { UnderwritingVerificationWizard } from '@/components/UnderwritingVerificationWizard';

type TabKey = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function UnderwritingQueuePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');

  // Quick Underwriting Decision Modal State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [conditions, setConditions] = useState('');

  const canDecide = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CREDIT_ANALYST', 'UNDERWRITER'].includes(r)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['underwriting-queue'],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue');
      const rows = res.data?.data?.items ?? res.data?.data ?? [];
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  // Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApp) return;
      return api.post(`/underwriting/${selectedApp.id}/decision`, {
        decision,
        reason,
        conditions: conditions || undefined,
      });
    },
    onSuccess: () => {
      toast.success(`Decision '${decision}' recorded successfully.`);
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedApp(null);
      setReason('');
      setConditions('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Decision Notice' });
    },
  });

  if (isLoading) return <TableSkeleton rows={6} cols={6} />;

  const allItems = Array.isArray(data) ? data : [];

  // Metrics
  const pendingItems = allItems.filter((q: any) => q.status === 'UNDERWRITING');
  const approvedItems = allItems.filter((q: any) =>
    ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(q.status)
  );
  const rejectedItems = allItems.filter((q: any) => q.status === 'REJECTED');

  // Filtered display items
  const displayItems =
    activeTab === 'PENDING'
      ? pendingItems
      : activeTab === 'APPROVED'
      ? approvedItems
      : activeTab === 'REJECTED'
      ? rejectedItems
      : allItems;

  const totalValueInQueue = pendingItems.reduce(
    (acc: number, q: any) => acc + Number(q.requestedAmount || 0),
    0
  );
  const totalApprovedValue = approvedItems.reduce(
    (acc: number, q: any) => acc + Number(q.requestedAmount || 0),
    0
  );

  const handleOpenDecision = (app: any) => {
    setSelectedApp(app);
    if (app.status === 'APPROVED') {
      setDecision('APPROVE');
      setReason(app.underwriting?.reason || 'Sanction approved within limits');
    } else if (app.status === 'REJECTED') {
      setDecision('REJECT');
      setReason(app.underwriting?.reason || 'Decline confirmed');
    } else {
      setDecision('APPROVE');
      setReason('Application verified and recommended for sanction');
    }
    setConditions('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Underwriting"
        title="Underwriting & Credit Assessment Desk"
        subtitle="Review loan proposals forwarded for underwriting, commit sanction decisions, and manage underwritten portfolio"
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiCard
          label="Pending Underwriting"
          value={String(pendingItems.length)}
          hint="Forwarded proposals awaiting decision"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Sanctioned Volume"
          value={formatMoney(totalApprovedValue)}
          hint={`${approvedItems.length} proposals approved`}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Pending Queue Pipeline"
          value={formatMoney(totalValueInQueue)}
          hint="Awaiting underwriting sign-off"
          icon={<Calculator className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        {/* Top Filter & Tabs Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-slate-100 dark:border-[#2B3566]">
          <div>
            <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Underwriting Desk Proposals ({displayItems.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing active proposals and underwritten history records
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                activeTab === 'ALL'
                  ? (isDark ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              All Proposals ({allItems.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'PENDING'
                  ? (isDark ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span>Awaiting Decision</span>
              {pendingItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                  {pendingItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                activeTab === 'APPROVED'
                  ? (isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Sanctioned ({approvedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                activeTab === 'REJECTED'
                  ? (isDark ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              Declined ({rejectedItems.length})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {displayItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={cn(
                  'border-b text-[11px] font-bold uppercase',
                  isDark ? 'border-[#2B3566] bg-[#16203D] text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Requested Sanction</th>
                  <th className="py-2.5 px-3">Eligibility</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  'divide-y text-xs',
                  isDark ? 'divide-[#2B3566] text-slate-200' : 'divide-slate-100 text-slate-700'
                )}
              >
                {displayItems.map((app: any) => {
                  const isPending = app.status === 'UNDERWRITING';
                  const isApproved = ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status);
                  const isRejected = app.status === 'REJECTED';

                  return (
                    <tr
                      key={app.id}
                      className={cn('transition-colors', isDark ? 'hover:bg-[#16203D]/60' : 'hover:bg-slate-50/70')}
                    >
                      <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        <Link href={`/applications/${app.id}`} className="hover:underline">
                          {app.applicationNo || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className={cn('font-semibold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                          {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{app.customer?.customerCode || '-'}</p>
                      </td>
                      <td className={cn('py-3 px-3 font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        {app.product?.name || 'Loan'}
                      </td>
                      <td className={cn('py-3 px-3 font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatMoney(app.requestedAmount || 0)}
                      </td>
                      <td className="py-3 px-3">
                        {app.eligibility?.result ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-bold border',
                              app.eligibility.result === 'ELIGIBLE'
                                ? isDark
                                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isDark
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}
                          >
                            {app.eligibility.result}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pending Run</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {app.riskAssessment ? (
                          <span className="font-bold text-[#2563EB] dark:text-[#60A5FA] text-xs">
                            {app.riskAssessment.score}/100 ({app.riskAssessment.category || 'LOW'})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Unscored</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={app.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canDecide ? (
                            isPending ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setDecision('APPROVE');
                                    setReason('Credit proposal verified and approved for sanction.');
                                    setConditions('');
                                  }}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-sm flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setDecision('REJECT');
                                    setReason('');
                                    setConditions('');
                                  }}
                                  className="text-xs cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenDecision(app)}
                                className="text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-slate-300 dark:border-[#2B3566]"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-500" />
                                Modify Decision
                              </Button>
                            )
                          ) : null}
                          <Link href={`/applications/${app.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs">
                              Review →
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <ClipboardCheck className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No proposals found under &quot;{activeTab}&quot;.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Applications forwarded by Credit Analysts will appear here for underwriting review and sanctioning.
            </p>
          </div>
        )}
      </Card>

      {/* STEP-BY-STEP UNDERWRITING VERIFICATION WIZARD MODAL */}
      <UnderwritingVerificationWizard
        application={selectedApp}
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}
