'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card } from '@/components/ui';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { useMyTasks } from '@/lib/hooks/useOperations';
import { api } from '@/lib/api';

export default function OperationsMyTasksPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const {
    tasks,
    pagination,
    loading,
    error,
    params,
    setParams,
    completeTask,
    refetch,
  } = useMyTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page: 1,
  });

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      setCompletingTaskId(taskId);
      await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
        notes: `Task status transitioned to ${newStatus} by ${user?.firstName || 'Staff'} ${user?.lastName || ''}`.trim(),
      });
      toast.success(`Task marked as ${newStatus}`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const filteredTasks = (tasks || []).filter((t: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.application?.applicationNo && t.application.applicationNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Operations / My Assigned Tasks"
        title="My Operational Tasks"
        subtitle="Individual work tasks, field verification checklists, and application follow-ups assigned to you."
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
              placeholder="Search task title, notes, or application #..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                'text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium',
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending / In Progress</option>
              <option value="IN_PROGRESS">In Progress Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={cn(
                'text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium',
                isDark
                  ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">Loading your assigned tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            No Assigned Tasks
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You currently have no tasks matching the selected filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate).getTime() < Date.now() &&
              task.status !== 'COMPLETED';
            const isUpdating = completingTaskId === task.id;

            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 transition-all hover:border-blue-500/40',
                  isOverdue ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10' : ''
                )}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        status={
                          task.priority === 'URGENT'
                            ? 'REJECTED'
                            : task.priority === 'HIGH'
                            ? 'UNDER_REVIEW'
                            : 'SUBMITTED'
                        }
                      >
                        {task.priority || 'MEDIUM'}
                      </Badge>
                      <Badge
                        status={
                          task.status === 'COMPLETED'
                            ? 'APPROVED'
                            : task.status === 'IN_PROGRESS'
                            ? 'UNDERWRITING'
                            : 'SUBMITTED'
                        }
                      >
                        {task.status}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono flex-wrap pt-1">
                      {task.application && (
                        <Link
                          href={`/applications/${task.applicationId}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          App: {task.application.applicationNo}
                        </Link>
                      )}
                      {task.dueDate && (
                        <span
                          className={cn(
                            'flex items-center gap-1',
                            isOverdue ? 'text-rose-600 font-bold' : ''
                          )}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Due: {formatDate(task.dueDate)}
                          {isOverdue && ' (OVERDUE)'}
                        </span>
                      )}
                      <span>Created: {formatDateTime(task.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.applicationId && (
                      <Link href={`/applications/${task.applicationId}`}>
                        <Button variant="secondary" size="sm" className="text-xs">
                          Go to App 360
                        </Button>
                      </Link>
                    )}

                    {!isCompleted ? (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                        disabled={isUpdating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {isUpdating ? 'Marking...' : 'Mark Done'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                        disabled={isUpdating}
                        className="text-xs gap-1.5"
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
