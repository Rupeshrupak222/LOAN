'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useTeamQueue } from '@/lib/hooks/useOperations';
import { operationsApi } from '@/lib/api/operations';

export default function OperationsTeamQueuePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const [queueKey, setQueueKey] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const {
    items,
    queues,
    meta,
    loading,
    error,
    params,
    setParams,
    claim,
    refetch,
  } = useTeamQueue({
    queueKey: queueKey || undefined,
    priority: priority || undefined,
    page: 1,
  });

  const handleClaim = async (applicationId: string, itemTitle: string) => {
    try {
      setClaimingId(applicationId);
      await claim(applicationId);
      toast.success('Application Claimed', `Claimed ${itemTitle} for immediate processing.`);
    } catch (err: any) {
      toast.error('Claim Failed', err?.response?.data?.message || err.message || 'Failed to claim item');
    } finally {
      setClaimingId(null);
    }
  };

  const queueItems = items || [];

  // Filter queue items by search locally
  const filteredItems = queueItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custName = `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.toLowerCase();
    const prodName = (item.product?.name || '').toLowerCase();
    const appNo = (item.applicationNo || '').toLowerCase();
    return appNo.includes(q) || custName.includes(q) || prodName.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations / Work Queues"
        title="Team Work Queues"
        subtitle="Shared departmental intake and processing queues. Claim pending tasks to begin verification."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Link href="/operations">
              <Button size="sm" variant="outline" className="text-xs">
                Back to Cockpit
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by App No, Borrower name, or Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              )}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={queueKey}
              onChange={(e) => setQueueKey(e.target.value)}
              className={cn(
                'text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium',
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              <option value="">All Queue Pools</option>
              <option value="OPERATIONS_QUEUE">Operations & Intake Pool</option>
              <option value="CREDIT_REVIEW_QUEUE">Credit Assessment Pool</option>
              <option value="RISK_QUEUE">Risk & Fraud Pool</option>
              <option value="APPROVAL_QUEUE">Sanction Approval Pool</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={cn(
                'text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium',
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent (SLA &lt; 2h)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Queue List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">Loading unassigned team items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Queue is Clear!
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            There are no pending unassigned applications in this queue pool matching your filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isClaiming = claimingId === item.id;
            const isAssigned = Boolean(item.assignedToUserId);
            const isAssignedToMe = item.assignedToUserId === user?.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  'p-4 flex flex-col justify-between space-y-4 transition-all hover:border-blue-500/40 hover:shadow-md',
                  item.priority === 'URGENT'
                    ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10'
                    : ''
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        {item.product?.name || 'Loan Application'}
                      </span>
                      <Link
                        href={`/applications/${item.id}`}
                        className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {item.applicationNo}
                      </Link>
                    </div>
                    <Badge
                      status={
                        item.priority === 'URGENT'
                          ? 'REJECTED'
                          : item.priority === 'HIGH'
                          ? 'UNDER_REVIEW'
                          : 'SUBMITTED'
                      }
                    >
                      {item.priority || 'MEDIUM'}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {item.customer?.firstName} {item.customer?.lastName}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {formatMoney(item.requestedAmount || 0)} · {item.stage}
                    </p>
                  </div>

                  {item.assignedToUser ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span>Assigned to: {item.assignedToUser.firstName} {item.assignedToUser.lastName}</span>
                    </div>
                  ) : item.queue ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Queue: {item.queue.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Unassigned in pool</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link href={`/applications/${item.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      View 360
                    </Button>
                  </Link>

                  {!isAssigned ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(item.id, item.applicationNo)}
                      disabled={isClaiming}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1"
                    >
                      {isClaiming ? 'Claiming...' : 'Claim Application'}
                    </Button>
                  ) : isAssignedToMe ? (
                    <Link href={`/applications/${item.id}`}>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1"
                      >
                        Resume Task <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic px-2">Assigned</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
