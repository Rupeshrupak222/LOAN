'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Search,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Filter,
  Play,
  Send,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, Spinner } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function MyCasesPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch all underwriting queue cases and filter to current underwriter
  const {
    data: casesData,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-underwriting-cases', searchQuery, user?.id],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue', {
        params: {
          search: searchQuery.trim() || undefined,
        },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : raw?.items || []) as any[];
    },
    refetchInterval: 10000,
  });

  const rawCases = Array.isArray(casesData) ? casesData : [];

  // Filter to cases assigned/relevant to current logged-in underwriter
  const myAssignedCases = rawCases.filter((item: any) => {
    const isAssigned =
      !item.assignedToId || // In queue for underwriter pool
      item.assignedToId === user?.id ||
      item.assignedTo === user?.email ||
      item.underwriterId === user?.id ||
      item.statusHistory?.some((sh: any) => sh.changedBy === user?.email);
    return isAssigned;
  });

  // Start Case Mutation
  const startCaseMutation = useMutation({
    mutationFn: async (appId: string) => {
      return api.post(`/underwriting/${appId}/start`);
    },
    onSuccess: (res, appId) => {
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['underwriter-dashboard-queue'] });
      queryClient.invalidateQueries({ queryKey: ['my-underwriting-cases'] });
      toast.success('Underwriting case started. In-depth review initiated.');
      router.push(`/underwriting?id=${appId}`);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err), { title: 'Could not start case' });
    },
  });

  // Filter by status dropdown
  const filteredCases = myAssignedCases.filter((item) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_REVIEW') {
        const inReview = item.status === 'UNDER_REVIEW' || item.stage === 'IN_REVIEW' || item.status === 'UNDERWRITING';
        if (!inReview) return false;
      } else if (statusFilter === 'HOLD') {
        const isHold = item.status === 'HOLD' || item.stage === 'HOLD' || item.underwriting?.decision === 'HOLD';
        if (!isHold) return false;
      } else if (statusFilter === 'APPROVED') {
        const isApp = item.status === 'APPROVED' || item.underwriting?.decision === 'APPROVE' || item.underwriting?.decision === 'APPROVE_WITH_CONDITIONS';
        if (!isApp) return false;
      } else if (statusFilter === 'REJECTED') {
        const isRej = item.status === 'REJECTED' || item.underwriting?.decision === 'REJECT';
        if (!isRej) return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }
    return true;
  });

  // Sort latest updated first
  filteredCases.sort((a, b) => {
    const timeA = new Date(a.forwardedAt || a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.forwardedAt || b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Underwriting / My Cases"
        title="My Underwriting Cases"
        subtitle="Active credit appraisal proposals assigned and routed to your individual underwriting workbench."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Link href="/underwriting-queue">
              <Button size="sm" className="gap-1.5 text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs cursor-pointer">
                Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main Direct Cases Container */}
      <Card noPadding className="p-5 space-y-4">
        {/* Compact Filters & Search Bar - No Secondary Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by proposal #, borrower name, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border font-medium outline-none transition-colors',
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                'py-1.5 px-2.5 text-xs rounded-lg border font-medium outline-none cursor-pointer',
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
              )}
            >
              <option value="ALL">All Statuses ({myAssignedCases.length})</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="HOLD">On Hold</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Real Cases Direct List */}
        {isLoading ? (
          <TableSkeleton rows={6} cols={13} />
        ) : isError ? (
          <div className="py-12 text-center text-xs text-rose-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-bold text-sm">Failed to load your assigned cases.</p>
            <p className="text-slate-400">{apiErrorMessage(error) || 'Could not connect to service.'}</p>
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead
                className={cn(
                  'border-b text-[10px] font-bold uppercase tracking-wider',
                  isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Requested Amount</th>
                  <th className="py-2.5 px-3 text-right">Eligible Amount</th>
                  <th className="py-2.5 px-3 text-center">Risk Grade</th>
                  <th className="py-2.5 px-3 text-center">BRE</th>
                  <th className="py-2.5 px-3 text-center">Deviation</th>
                  <th className="py-2.5 px-3 text-center">Current Stage</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">SLA</th>
                  <th className="py-2.5 px-3">Last Updated</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredCases.map((item: any) => {
                  const custName = item.customer
                    ? `${item.customer.firstName} ${item.customer.lastName || ''}`.trim()
                    : item.borrowerName || 'Borrower';
                  const custId = item.customerId || item.customer?.id;
                  const reqAmt = Number(item.requestedAmount || 0);
                  const elAmt = Number(item.eligibility?.maxEligibleAmount || item.eligibleAmount || reqAmt);
                  const riskGrade = item.riskGrade || item.riskAssessment?.category || 'MEDIUM';
                  const breVal = item.breDecision || item.eligibility?.status || 'PASS';
                  const devCount = item.deviations?.length || 0;
                  const curStage = item.stage || item.status || 'UNDERWRITING';

                  const isApproved =
                    item.status === 'APPROVED' ||
                    item.underwriting?.decision === 'APPROVE' ||
                    item.underwriting?.decision === 'APPROVE_WITH_CONDITIONS';
                  const isReadyForDisbursement = item.status === 'READY_FOR_DISBURSEMENT' || item.status === 'DISBURSED';
                  const isRejected = item.status === 'REJECTED' || item.underwriting?.decision === 'REJECT';
                  const isReadyToStart = (item.status === 'UNDERWRITING' || item.stage === 'READY') && !item.stage?.includes('IN_REVIEW');

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors',
                        isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/70'
                      )}
                    >
                      {/* 1. Application ID */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/underwriting?id=${item.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          #{item.applicationNo || item.id?.slice(0, 8)}
                        </Link>
                      </td>

                      {/* 2. Borrower */}
                      <td className="py-3 px-3">
                        {custId ? (
                          <Link
                            href={`/customers/${custId}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 hover:underline flex items-center gap-1"
                            title="Open Customer 360 Profile"
                          >
                            <span>{custName}</span>
                            <span className="text-[10px] text-blue-500 font-normal">↗</span>
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-white">{custName}</span>
                        )}
                        <p className="text-[10px] text-slate-400">
                          {item.customer?.mobile || item.mobile || 'Verified'}
                        </p>
                      </td>

                      {/* 3. Product */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {item.product?.name || item.loanProduct || 'Personal Loan'}
                      </td>

                      {/* 4. Requested Amount */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatMoney(reqAmt)}
                      </td>

                      {/* 5. Eligible Amount */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(elAmt)}
                      </td>

                      {/* 6. Risk Grade */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold border',
                            riskGrade === 'LOW' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            riskGrade === 'MEDIUM' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            (riskGrade === 'HIGH' || riskGrade === 'VERY_HIGH') &&
                              'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {riskGrade}
                        </span>
                      </td>

                      {/* 7. BRE */}
                      <td className="py-3 px-2.5 text-center">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold border',
                            breVal === 'PASS' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            breVal === 'REFER' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                            breVal === 'FAIL' && 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          )}
                        >
                          {breVal}
                        </span>
                      </td>

                      {/* 8. Deviation */}
                      <td className="py-3 px-2.5 text-center">
                        {devCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            {devCount} Act
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">0</span>
                        )}
                      </td>

                      {/* 9. Current Stage */}
                      <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {curStage}
                      </td>

                      {/* 10. Status */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            item.status === 'UNDERWRITING'
                              ? 'info'
                              : item.status === 'APPROVED' || item.status === 'READY_FOR_DISBURSEMENT'
                              ? 'success'
                              : item.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* 11. SLA */}
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {item.slaDeadline ? formatDate(item.slaDeadline) : '< 24h'}
                      </td>

                      {/* 12. Last Updated */}
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {item.updatedAt ? formatDate(item.updatedAt) : 'Today'}
                      </td>

                      {/* 13. State-Aware Action: START, CONTINUE REVIEW, or VIEW IN APPROVAL QUEUE */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isApproved ? (
                          <Link href={`/approval-queue?search=${encodeURIComponent(item.applicationNo || item.id)}`}>
                            <Button
                              size="sm"
                              className="text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-xs gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              APPROVAL QUEUE
                            </Button>
                          </Link>
                        ) : isRejected ? (
                          <Link href={`/approval-queue?search=${encodeURIComponent(item.applicationNo || item.id)}`}>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              View Decision
                            </Button>
                          </Link>
                        ) : isReadyToStart ? (
                          <Button
                            size="sm"
                            disabled={startCaseMutation.isPending}
                            onClick={() => startCaseMutation.mutate(item.id)}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            START
                          </Button>
                        ) : (
                          <Link href={`/underwriting?id=${item.id}`}>
                            <Button
                              size="sm"
                              className="text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-xs gap-1"
                            >
                              CONTINUE REVIEW <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
            <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No cases are assigned to you.
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You have processed all proposals assigned to your queue or no applications currently match your filters.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
