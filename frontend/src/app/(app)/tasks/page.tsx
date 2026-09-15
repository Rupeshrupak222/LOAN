'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Send,
  Upload,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Button, Card, Badge, Input, Spinner } from '@/components/ui';

interface TaskItem {
  id: string;
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  taskType: 'KYC_PENDING' | 'DOC_MISSING' | 'DOC_REUPLOAD' | 'READY_TO_SUBMIT' | 'CUSTOMER_FOLLOWUP';
  title: string;
  reason: string;
  stage: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  actionLabel: string;
  actionHref: string;
}

export default function TasksPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch applications & returned items to assemble task desk
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['loan-officer-tasks-apps'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 100 } });
      return (res.data?.data || []) as any[];
    },
    refetchInterval: 10000,
  });

  const { data: returnedData } = useQuery({
    queryKey: ['loan-officer-tasks-returned'],
    queryFn: async () => {
      const res = await api.get('/applications/returned', { params: { pageSize: 50 } });
      return res.data?.data || { data: [] };
    },
    refetchInterval: 10000,
  });

  const apps = appsData || [];
  const returned = returnedData?.data || [];

  // Generate actionable tasks from live data
  const tasks: TaskItem[] = [];

  // 1. Returned applications requiring fix / re-upload
  returned.forEach((r: any) => {
    tasks.push({
      id: `task-return-${r.id}`,
      applicationId: r.id,
      applicationNo: r.applicationNo,
      customerId: r.customerId,
      customerName: r.customerName,
      customerMobile: r.customerMobile || r.customer?.mobile || 'N/A',
      taskType: 'DOC_REUPLOAD',
      title: 'Resolve Return Stipulations & Re-upload Documents',
      reason: r.returnDetails?.reason || 'Credit Analyst or Underwriter returned proposal for corrections.',
      stage: r.returnDetails?.returnStage || 'UNDERWRITING',
      priority: 'HIGH',
      createdAt: r.updatedAt || r.createdAt,
      actionLabel: 'Resolve Stipulations',
      actionHref: `/applications/${r.id}`,
    });
  });

  // 2. Applications with KYC Pending
  apps
    .filter((a) => a.kycStatus !== 'VERIFIED' && a.status !== 'DISBURSED' && a.status !== 'APPROVED')
    .forEach((a) => {
      tasks.push({
        id: `task-kyc-${a.id}`,
        applicationId: a.id,
        applicationNo: a.applicationNo,
        customerId: a.customerId,
        customerName: a.customerName,
        customerMobile: a.customer?.mobile || 'N/A',
        taskType: 'KYC_PENDING',
        title: 'Customer Identity & Dynamic KYC Verification Pending',
        reason: 'Aadhaar XML, PAN record verification, or selfie photo is incomplete.',
        stage: 'INTAKE',
        priority: a.status === 'DRAFT' ? 'HIGH' : 'MEDIUM',
        createdAt: a.createdAt,
        actionLabel: 'Collect KYC',
        actionHref: `/customers/${a.customerId}`,
      });
    });

  // 3. Applications Ready for Submission
  apps
    .filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED')
    .forEach((a) => {
      tasks.push({
        id: `task-submit-${a.id}`,
        applicationId: a.id,
        applicationNo: a.applicationNo,
        customerId: a.customerId,
        customerName: a.customerName,
        customerMobile: a.customer?.mobile || 'N/A',
        taskType: 'READY_TO_SUBMIT',
        title: 'Application Ready for Submission to Credit Analyst',
        reason: 'All dynamic KYC gates passed. Proposal ready for formal handoff.',
        stage: 'INTAKE',
        priority: 'MEDIUM',
        createdAt: a.createdAt,
        actionLabel: 'Submit Application',
        actionHref: `/applications/${a.id}`,
      });
    });

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (typeFilter && t.taskType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.applicationNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerMobile.includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const highPriorityCount = tasks.filter((t) => t.priority === 'HIGH').length;
  const mediumPriorityCount = tasks.filter((t) => t.priority === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              Operational Task Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            Origination Tasks & Action Desk
          </h1>
          <p className="text-xs text-slate-500">
            Actionable tasks across missing documents, KYC follow-ups, return corrections, and submission gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600">
            {highPriorityCount} Urgent Tasks
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs font-bold text-blue-600">
            {tasks.length} Total Open Tasks
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search tasks, applicants, application ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Task Types</option>
              <option value="DOC_REUPLOAD">Return Corrections & Re-uploads</option>
              <option value="KYC_PENDING">KYC Verification Pending</option>
              <option value="READY_TO_SUBMIT">Ready for Submission</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High / Urgent</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 flex justify-center items-center">
            <Spinner />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="py-16 text-center text-xs text-slate-400 space-y-2 border border-slate-200 dark:border-slate-800">
            <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No pending origination tasks!</p>
            <p className="text-[11px] text-slate-400">All applications and customer verification queues are up to date.</p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                'p-4 transition-all hover:shadow-md border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                task.priority === 'HIGH'
                  ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      task.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    )}
                  >
                    {task.priority} Priority
                  </span>

                  <Link href={`/applications/${task.applicationId}`} className="font-bold text-xs text-blue-600 hover:underline">
                    {task.applicationNo}
                  </Link>

                  <span className="text-slate-300 dark:text-slate-700">•</span>

                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {task.customerName}
                  </span>

                  <span className="text-[11px] text-slate-400">({task.customerMobile})</span>
                </div>

                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{task.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{task.reason}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto">
                <Link href={task.actionHref} className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    className={cn(
                      'w-full sm:w-auto min-w-[195px] h-10 px-4 text-xs font-bold justify-center flex items-center gap-2 text-white shadow-xs cursor-pointer',
                      task.taskType === 'DOC_REUPLOAD'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : task.taskType === 'READY_TO_SUBMIT'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#2563EB] hover:bg-blue-700'
                    )}
                  >
                    <span>{task.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
