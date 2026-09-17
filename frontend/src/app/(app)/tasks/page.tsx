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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
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
  taskType:
    | 'DOC_MISSING'
    | 'DOC_REUPLOAD'
    | 'READY_TO_SUBMIT'
    | 'KYC_VERIFICATION'
    | 'CREDIT_ASSESSMENT'
    | 'UNDERWRITING_DECISION';
  title: string;
  reason: string;
  stage: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  actionLabel: string;
  actionHref: string;
}

export default function TasksPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const roles = user?.roles || ['LOAN_OFFICER'];
  const isLoanOfficer = roles.includes('LOAN_OFFICER');
  const isCreditAnalyst = roles.includes('CREDIT_ANALYST');
  const isUnderwriter = roles.includes('UNDERWRITER');
  const isFinanceOfficer = roles.some((r) =>
    ['FINANCE_OFFICER', 'FINANCE_CONTROLLER', 'DISBURSEMENT_OFFICER'].includes(r)
  );
  const isManagerOrAdmin = roles.some((r) =>
    ['BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
  );

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

  // Generate actionable tasks strictly by user role
  const tasks: TaskItem[] = [];

  // ─── 1. LOAN OFFICER TASKS ───
  if (isLoanOfficer || isManagerOrAdmin) {
    // 1A. Returned applications requiring corrections / re-upload
    returned.forEach((r: any) => {
      tasks.push({
        id: `task-return-${r.id}`,
        applicationId: r.id,
        applicationNo: r.applicationNo,
        customerId: r.customerId,
        customerName: r.customerName || (r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'Applicant'),
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

    // 1B. Draft applications with all documents complete -> Ready to Forward to Credit
    apps
      .filter((a) => a.status === 'DRAFT' && a.isDocsComplete)
      .forEach((a) => {
        tasks.push({
          id: `task-submit-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName,
          customerMobile: a.customer?.mobile || 'N/A',
          taskType: 'READY_TO_SUBMIT',
          title: 'Application Ready for Forwarding to Credit Analyst',
          reason: 'All mandatory profile documents are attached. Ready for formal credit handoff.',
          stage: 'INTAKE',
          priority: 'HIGH',
          createdAt: a.createdAt,
          actionLabel: 'Forward to Credit',
          actionHref: `/applications/${a.id}`,
        });
      });

    // 1C. Draft applications with missing intake documents -> Collect Missing Documents
    apps
      .filter((a) => a.status === 'DRAFT' && !a.isDocsComplete)
      .forEach((a) => {
        const missingList = a.missingDocLabels?.length ? a.missingDocLabels.join(', ') : 'Mandatory proofs incomplete';
        tasks.push({
          id: `task-missing-docs-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName,
          customerMobile: a.customer?.mobile || 'N/A',
          taskType: 'DOC_MISSING',
          title: 'Collect Mandatory Customer Intake Documents',
          reason: `Missing required profile documents: ${missingList}.`,
          stage: 'INTAKE',
          priority: 'MEDIUM',
          createdAt: a.createdAt,
          actionLabel: 'Upload Missing Proofs',
          actionHref: `/customers/${a.customerId}`,
        });
      });
  }

  // ─── 2. CREDIT ANALYST TASKS ───
  if (isCreditAnalyst || isManagerOrAdmin) {
    // 2A. Submitted applications pending document verification / KYC
    apps
      .filter((a) => ['SUBMITTED', 'CREDIT_ASSESSMENT'].includes(a.status) && a.kycStatus !== 'VERIFIED')
      .forEach((a) => {
        tasks.push({
          id: `task-ca-verify-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName,
          customerMobile: a.customer?.mobile || 'N/A',
          taskType: 'KYC_VERIFICATION',
          title: 'Inspect & Verify KYC / Proof Documents',
          reason: 'Borrower identity proofs and uploaded documents pending analyst review & verification.',
          stage: 'CREDIT_ASSESSMENT',
          priority: 'HIGH',
          createdAt: a.submittedAt || a.createdAt,
          actionLabel: 'Verify Documents',
          actionHref: `/verifications`,
        });
      });

    // 2B. Submitted applications with verified docs ready for Credit Assessment / CAM
    apps
      .filter((a) => ['SUBMITTED', 'CREDIT_ASSESSMENT'].includes(a.status) && a.kycStatus === 'VERIFIED')
      .forEach((a) => {
        tasks.push({
          id: `task-ca-assess-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName,
          customerMobile: a.customer?.mobile || 'N/A',
          taskType: 'CREDIT_ASSESSMENT',
          title: 'Complete Credit Assessment & Risk Rating',
          reason: 'KYC verified. Proposal ready for financial appraisal and underwriting recommendation.',
          stage: 'CREDIT_ASSESSMENT',
          priority: 'MEDIUM',
          createdAt: a.submittedAt || a.createdAt,
          actionLabel: 'Open Assessment',
          actionHref: `/credit-assessment?applicationId=${a.id}`,
        });
      });
  }

  // ─── 3. UNDERWRITER TASKS ───
  if (isUnderwriter || isManagerOrAdmin) {
    apps
      .filter((a) =>
        ['UNDERWRITING', 'IN_REVIEW', 'READY_FOR_SANCTION', 'DEVIATION', 'ESCALATED', 'AWAITING_INFO'].includes(a.status)
      )
      .forEach((a) => {
        const isDev = a.status === 'DEVIATION' || a.status === 'ESCALATED';
        const isAwaiting = a.status === 'AWAITING_INFO';
        const isReady = a.status === 'READY_FOR_SANCTION';
        tasks.push({
          id: `task-uw-sanction-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName,
          customerMobile: a.customer?.mobile || 'N/A',
          taskType: 'UNDERWRITING_DECISION',
          title: isDev
            ? 'Deviation & Escalation Authority Review'
            : isAwaiting
            ? 'Additional Information & Stipulations Review'
            : isReady
            ? 'Sanction Approval & Decision Finalization'
            : 'Underwriting Appraisal & Sanction Decision',
          reason: isDev
            ? 'Policy deviation or threshold breach requires authority review.'
            : isAwaiting
            ? 'Clarification pending underwriter review.'
            : 'Credit Assessment complete. Proposal pending final sanction, return, or rejection.',
          stage: a.status || 'UNDERWRITING',
          priority: isDev ? 'HIGH' : a.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          createdAt: a.updatedAt || a.createdAt,
          actionLabel: 'Open Workspace',
          actionHref: `/underwriting?id=${a.id}`,
        });
      });
  }

  // ─── 4. FINANCE OFFICER TASKS ───
  if (isFinanceOfficer || isManagerOrAdmin) {
    apps
      .filter((a) => a.status === 'READY_FOR_DISBURSEMENT')
      .forEach((a) => {
        const isPennyDropPending = !a.customer?.bankAccounts?.[0]?.isVerified;
        tasks.push({
          id: `task-fin-disburse-${a.id}`,
          applicationId: a.id,
          applicationNo: a.applicationNo,
          customerId: a.customerId,
          customerName: a.customerName || (a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : 'Borrower'),
          customerMobile: a.customerMobile || a.customer?.mobile || 'N/A',
          taskType: isPennyDropPending ? 'KYC_VERIFICATION' : 'READY_TO_SUBMIT',
          title: isPennyDropPending
            ? 'Verify Bank Penny Drop & Authorize Pre-Disbursement Gates'
            : 'Authorize Dual-Control Payout & Execute Fund Release',
          reason: isPennyDropPending
            ? 'Sanctioned loan requires penny drop account verification before fund release.'
            : 'Loan sanctioned and forwarded to Finance Desk. 10-point gates ready for disbursement execution.',
          stage: 'READY_FOR_DISBURSEMENT',
          priority: 'HIGH',
          createdAt: a.updatedAt || a.createdAt,
          actionLabel: 'Open Finance Desk',
          actionHref: `/finance-queue/${a.id}`,
        });
      });
  }

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

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Task Types</option>
              <option value="READY_TO_SUBMIT">Ready for Forwarding to Credit</option>
              <option value="DOC_MISSING">Missing Intake Documents</option>
              <option value="DOC_REUPLOAD">Return Corrections & Re-uploads</option>
              <option value="KYC_VERIFICATION">KYC & Proof Verification</option>
              <option value="CREDIT_ASSESSMENT">Credit Assessment & Rating</option>
              <option value="UNDERWRITING_DECISION">Underwriting Decisions</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
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
            <p className="font-semibold text-slate-600 dark:text-slate-300">No pending tasks in your queue!</p>
            <p className="text-[11px] text-slate-400">All applications and operational queues for your role are up to date.</p>
          </Card>
        ) : (
          <>
            {paginatedTasks.map((task) => (
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
                          : task.taskType === 'KYC_VERIFICATION'
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : task.taskType === 'UNDERWRITING_DECISION'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#2563EB] hover:bg-blue-700'
                      )}
                    >
                      <span>{task.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {/* Pagination Controls */}
            {filteredTasks.length > 0 && (
              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedTasks.length}</span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredTasks.length}</span> tasks
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-medium text-slate-700 dark:text-slate-300 px-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
