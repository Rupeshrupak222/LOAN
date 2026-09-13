'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Building,
  DollarSign,
  Search,
  FileText,
  Send,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Calendar,
  Zap,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

type QueueTab =
  | 'READY_FOR_DISBURSEMENT'
  | 'PRE_CHECK_PENDING'
  | 'PENDING_CHECKER'
  | 'STP_ELIGIBLE'
  | 'ON_HOLD'
  | 'FAILED'
  | 'EXECUTED'
  | 'ALL';

export default function FinanceQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      }
    >
      <FinanceQueueContent />
    </Suspense>
  );
}

function FinanceQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const urlAppId = searchParams.get('id');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(urlAppId);
  const [activeTab, setActiveTab] = useState<QueueTab>('READY_FOR_DISBURSEMENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceSection, setWorkspaceSection] = useState<'ALL' | 'GATES' | 'WORKBENCH' | 'DUAL_CONTROL' | 'AUDIT'>('ALL');

  // Execution modal state
  const [paymentRail, setPaymentRail] = useState<'IMPS' | 'NEFT' | 'RTGS'>('IMPS');
  const [transactionReference, setTransactionReference] = useState('');
  const [executionComments, setExecutionComments] = useState('');
  const [makerNotes, setMakerNotes] = useState('');
  const [checkerComments, setCheckerComments] = useState('');

  // 1. Fetch Finance Queue
  const {
    data: queueData,
    isLoading: queueLoading,
    refetch: refetchQueue,
    isRefetching: queueRefetching,
  } = useQuery({
    queryKey: ['finance-queue', activeTab, searchQuery],
    queryFn: async () => {
      const res = await api.get('/finance/queue', {
        params: {
          tab: activeTab,
          search: searchQuery.trim() || undefined,
        },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : []) as any[];
    },
  });

  // 2. Fetch Selected Application Financial Workspace
  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    refetch: refetchWorkspace,
  } = useQuery({
    queryKey: ['finance-workspace', selectedAppId],
    enabled: Boolean(selectedAppId),
    queryFn: async () => {
      if (!selectedAppId) return null;
      const res = await api.get(`/finance/applications/${selectedAppId}/workspace`);
      return res.data?.data;
    },
  });

  // 3. Maker Submit Mutation
  const makerSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppId) throw new Error('No application selected');
      return api.post(`/finance/applications/${selectedAppId}/maker-submit`, {
        notes: makerNotes,
        reason: 'Dual-control disbursement maker submission.',
      });
    },
    onSuccess: () => {
      toast.success('Disbursement proposed for dual-control Checker approval.');
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', selectedAppId] });
      setMakerNotes('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Maker Submission Error' });
    },
  });

  // 4. Checker Approve Mutation
  const checkerApproveMutation = useMutation({
    mutationFn: async ({ taskId, decision }: { taskId: string; decision: 'APPROVE' | 'REJECT' }) => {
      return api.post(`/finance/tasks/${taskId}/checker-approve`, {
        decision,
        comments: checkerComments || `Checker ${decision.toLowerCase()}d disbursement.`,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Disbursement proposal ${variables.decision.toLowerCase()}d successfully.`);
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', selectedAppId] });
      setCheckerComments('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Checker Approval Error' });
    },
  });

  // 5. Execute Payout Mutation
  const executeDisbursementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAppId) throw new Error('No application selected');
      return api.post(`/finance/applications/${selectedAppId}/execute`, {
        paymentRail,
        transactionReference: transactionReference.trim() || undefined,
        comments: executionComments.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Disbursement executed successfully! Loan account activated.');
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', selectedAppId] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-history'] });
      setTransactionReference('');
      setExecutionComments('');
      setActiveTab('EXECUTED');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Disbursement Execution Blocked' });
    },
  });

  // Computed KPIs
  const queueStats = useMemo(() => {
    const list = queueData || [];
    const readyCount = list.filter((i) => i.gatekeeperStatus?.canDisburse && i.bankAccount?.isVerified).length;
    const pendingPreCheck = list.filter((i) => !i.bankAccount?.isVerified || !i.gatekeeperStatus?.canDisburse).length;
    const pendingChecker = list.filter(
      (i) => i.makerCheckerStatus?.hasActiveTask && i.makerCheckerStatus?.taskStatus === 'PENDING_CHECKER'
    ).length;
    const stpCount = list.filter((i) => i.isStpEligible).length;
    const totalVolume = list.reduce((sum, item) => sum + (Number(item.netDisbursalAmount) || 0), 0);

    return { readyCount, pendingPreCheck, pendingChecker, stpCount, totalVolume };
  }, [queueData]);

  const tabsConfig = [
    { id: 'READY_FOR_DISBURSEMENT', label: 'Ready for Payout', countBadge: queueStats.readyCount },
    { id: 'PRE_CHECK_PENDING', label: 'Pre-Check Pending', countBadge: queueStats.pendingPreCheck },
    { id: 'PENDING_CHECKER', label: 'Pending Checker', countBadge: queueStats.pendingChecker },
    { id: 'STP_ELIGIBLE', label: 'STP Fast-Track', countBadge: queueStats.stpCount },
    { id: 'ON_HOLD', label: 'On Hold' },
    { id: 'FAILED', label: 'Failed' },
    { id: 'EXECUTED', label: 'Disbursed' },
    { id: 'ALL', label: 'All Cases' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb="Lending OS / Financial Operations"
        title="Finance & Disbursement Queue"
        subtitle="M2P Enterprise Financial Controls & mPokket High-Velocity Digital Payouts — Dual-Control Maker-Checker & 10-Point Pre-Disbursement Gates"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Ready for Payout"
          value={String(queueStats.readyCount)}
          icon={CheckCircle2}
          hint="Pre-checks & bank verified"
          trend="Actionable"
          trendPositive={true}
          variant="success"
        />
        <KpiCard
          label="Pre-Check Pending"
          value={String(queueStats.pendingPreCheck)}
          icon={Clock}
          hint="Awaiting penny drop/docs"
          variant="warning"
        />
        <KpiCard
          label="Pending Checker"
          value={String(queueStats.pendingChecker)}
          icon={ShieldCheck}
          hint="Dual-control second eye"
          variant="default"
        />
        <KpiCard
          label="STP Fast-Track"
          value={String(queueStats.stpCount)}
          icon={Zap}
          hint="Automated digital cases"
          trend="Direct"
          trendPositive={true}
          variant="default"
        />
        <KpiCard
          label="Queue Net Volume"
          value={formatMoney(queueStats.totalVolume)}
          icon={DollarSign}
          hint="Total net disbursable"
          variant="default"
        />
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 gap-6">
        <Card noPadding className="overflow-hidden">
          {/* Tab Navigation & Controls */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
                {tabsConfig.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as QueueTab)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-2',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                      )}
                    >
                      {tab.label}
                      {typeof tab.countBadge === 'number' && (
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-full text-[10px]',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {tab.countBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search & Refresh */}
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search app#, name, bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchQueue()}
                  disabled={queueRefetching}
                  className="h-9 px-2.5"
                  title="Refresh Queue"
                >
                  <RefreshCw className={cn('h-4 w-4', queueRefetching && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </div>

          {/* Queue Table */}
          {queueLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={7} />
            </div>
          ) : !queueData || queueData.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Coins className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Applications in Queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                There are no loan applications currently matching the &ldquo;{activeTab.replace(/_/g, ' ')}&rdquo; filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Application & Product</th>
                    <th className="py-3 px-4">Borrower & Destination Bank</th>
                    <th className="py-3 px-4 text-right">Sanctioned / Net Payout</th>
                    <th className="py-3 px-4 text-center">10-Point Gates</th>
                    <th className="py-3 px-4 text-center">Dual Control (SOD)</th>
                    <th className="py-3 px-4 text-center">Velocity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {queueData.map((item: any) => {
                    const isSelected = selectedAppId === item.id;
                    const canDisburse = item.gatekeeperStatus?.canDisburse;

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors',
                          isSelected && 'bg-blue-50/40 dark:bg-blue-900/10'
                        )}
                      >
                        {/* Application & Product */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.applicationNo}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{item.loanProduct}</span>
                            <span>•</span>
                            <span>{item.tenureMonths}m @ {item.interestRate}%</span>
                          </div>
                        </td>

                        {/* Borrower & Destination Bank */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {item.borrowerName}
                          </div>
                          {item.bankAccount ? (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Building className="h-3 w-3 text-slate-400 inline" />
                              <span>{item.bankAccount.bankName}</span>
                              <span className="font-mono">{item.bankAccount.maskedAccountNumber}</span>
                              {item.bankAccount.isVerified ? (
                                <Badge variant="success" className="text-[9px] py-0 px-1">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-[9px] py-0 px-1">
                                  Penny Drop Pending
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-500">No bank account mapped</div>
                          )}
                        </td>

                        {/* Sanctioned / Net Payout */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatMoney(item.netDisbursalAmount)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono line-through">
                            {formatMoney(item.approvedAmount)}
                          </div>
                        </td>

                        {/* 10-Point Gates */}
                        <td className="py-3 px-4 text-center">
                          {canDisburse ? (
                            <Badge variant="success" className="gap-1 inline-flex items-center">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>10/10 Passed</span>
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="gap-1 inline-flex items-center">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{item.gatekeeperStatus?.passedChecksCount}/10 Passed</span>
                            </Badge>
                          )}
                        </td>

                        {/* Dual Control Status */}
                        <td className="py-3 px-4 text-center">
                          {item.makerCheckerStatus?.hasActiveTask ? (
                            <Badge
                              variant={
                                item.makerCheckerStatus.taskStatus === 'APPROVED'
                                  ? 'success'
                                  : item.makerCheckerStatus.taskStatus === 'PENDING_CHECKER'
                                  ? 'warning'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {item.makerCheckerStatus.taskStatus === 'PENDING_CHECKER'
                                ? 'Waiting Checker'
                                : item.makerCheckerStatus.taskStatus}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-[10px] text-slate-400">
                              Maker Required
                            </Badge>
                          )}
                        </td>

                        {/* Velocity & STP */}
                        <td className="py-3 px-4 text-center">
                          {item.isStpEligible ? (
                            <Badge variant="info" className="gap-1 text-[10px] inline-flex items-center">
                              <Zap className="h-3 w-3" />
                              <span>STP Direct</span>
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-[10px]">
                              Standard LOS
                            </Badge>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant={isSelected ? 'primary' : 'outline'}
                            onClick={() => {
                              setSelectedAppId(item.id);
                              router.replace(`/finance-queue?id=${item.id}`);
                            }}
                            className="h-7 text-xs gap-1.5"
                          >
                            <Coins className="h-3.5 w-3.5" />
                            <span>Workspace</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CONSOLIDATED FINANCIAL APPLICATION WORKSPACE MODAL / DRAWER               */}
      {/* ========================================================================= */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div
            className={cn(
              'w-full max-w-4xl bg-white dark:bg-slate-900 min-h-screen shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col',
              'animate-in slide-in-from-right duration-200'
            )}
          >
            {/* Workspace Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAppId(null);
                    router.replace('/finance-queue');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Financial Workspace: {workspaceData?.loanApprovalSummary?.applicationNo || selectedAppId}
                    </h2>
                    <Badge variant="default" className="text-[10px]">
                      {workspaceData?.loanApprovalSummary?.status || 'REVIEW'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Borrower: {workspaceData?.borrowerBankDetails?.borrowerName} • Product:{' '}
                    {workspaceData?.loanApprovalSummary?.purpose}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchWorkspace()}
                  disabled={workspaceLoading}
                  className="h-8 text-xs gap-1"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', workspaceLoading && 'animate-spin')} />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAppId(null);
                    router.replace('/finance-queue');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sub-navigation tabs inside Workspace */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex gap-4 text-xs font-semibold">
              {[
                { id: 'ALL', label: '10-Section Overview' },
                { id: 'GATES', label: '10-Point Pre-Checks' },
                { id: 'WORKBENCH', label: 'Fees & Workbench' },
                { id: 'DUAL_CONTROL', label: 'Dual-Control & Payout' },
                { id: 'AUDIT', label: 'Audit Timeline' },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setWorkspaceSection(subTab.id as any)}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors',
                    workspaceSection === subTab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Workspace Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {workspaceLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner />
                  <p className="text-xs text-slate-500 mt-2">Loading Authoritative Financial Workspace...</p>
                </div>
              ) : !workspaceData ? (
                <div className="text-center py-16">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Application Details Unavailable</p>
                </div>
              ) : (
                <>
                  {/* SECTION 1: LOAN & APPROVAL SUMMARY */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'GATES') && (
                    <Card className="p-4 border-l-4 border-l-blue-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-blue-600" />
                          1. Loan & Sanction Summary (LOS)
                        </h3>
                        <Badge variant="success" className="text-[10px]">
                          Credit Approved
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-slate-500">Sanctioned By</div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {workspaceData.loanApprovalSummary.sanctionedBy}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Sanction Decision</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {workspaceData.loanApprovalSummary.sanctionDecision}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Sanctioned Date</div>
                          <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                            {formatDate(workspaceData.loanApprovalSummary.sanctionedAt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Remarks</div>
                          <div className="text-slate-700 dark:text-slate-300 truncate mt-0.5" title={workspaceData.loanApprovalSummary.sanctionRemarks}>
                            {workspaceData.loanApprovalSummary.sanctionRemarks}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* SECTION 2: BORROWER & DESTINATION BANK ACCOUNT */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'GATES' || workspaceSection === 'DUAL_CONTROL') && (
                    <Card className="p-4 border-l-4 border-l-emerald-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-emerald-600" />
                          2. Destination Borrower Bank Account (Penny Drop Verified)
                        </h3>
                        {workspaceData.borrowerBankDetails.bankAccount.isVerified ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Penny Drop Matched ({workspaceData.borrowerBankDetails.bankAccount.nameMatchScore}%)</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Penny Drop Pending</span>
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <div>
                          <div className="text-slate-500">Account Holder</div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {workspaceData.borrowerBankDetails.bankAccount.accountHolderName}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Bank Name & Branch</div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {workspaceData.borrowerBankDetails.bankAccount.bankName}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Account Number</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {workspaceData.borrowerBankDetails.bankAccount.maskedAccountNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">IFSC Code</div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                            {workspaceData.borrowerBankDetails.bankAccount.ifsc}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* SECTION 3 & 5: SANCTIONED TERMS & FEES/TAXES WORKBENCH */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'WORKBENCH') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section 3: Sanctioned Terms */}
                      <Card className="p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          3. Sanctioned Terms (Immutable)
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Sanctioned Principal:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatMoney(workspaceData.approvedTerms.approvedAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Interest Rate:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {workspaceData.approvedTerms.annualRate}% p.a.
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Tenure:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {workspaceData.approvedTerms.tenureMonths} Months
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Key Fact Statement (KFS):</span>
                            <Badge variant="success" className="text-[10px]">
                              {workspaceData.approvedTerms.kfsStatus}
                            </Badge>
                          </div>
                        </div>
                      </Card>

                      {/* Section 5: Authoritative Fees & Net Disbursal Workbench */}
                      <Card className="p-4 border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-emerald-600" />
                          5. Fees, Taxes & Net Disbursal
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-slate-600 dark:text-slate-400">Sanctioned Principal:</span>
                            <span className="font-semibold">{formatMoney(workspaceData.financialCalculations.sanctionedPrincipal)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-slate-600 dark:text-slate-400">Processing Fee (1.5%):</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">
                              - {formatMoney(workspaceData.financialCalculations.processingFee)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                            <span className="text-slate-600 dark:text-slate-400">GST on Fee (18%):</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">
                              - {formatMoney(workspaceData.financialCalculations.gstOnFee)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 pt-2 font-bold text-sm bg-emerald-100/50 dark:bg-emerald-900/40 px-2 rounded">
                            <span className="text-emerald-900 dark:text-emerald-200">Net Electronic Disbursal:</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                              {formatMoney(workspaceData.financialCalculations.netDisbursalAmount)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* SECTION 4: PRE-DISBURSEMENT GATES (10-POINT CHECKLIST) */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'GATES') && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-indigo-600" />
                          4. Statutory Pre-Disbursement Gatekeeper (10-Point Verification)
                        </h3>
                        {workspaceData.preDisbursementChecks.canDisburse ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>All 10 Gates Passed</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Payout Blocked</span>
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {workspaceData.preDisbursementChecks.checks.map((gate: any) => (
                          <div
                            key={gate.name}
                            className={cn(
                              'p-2.5 rounded-lg border flex items-center justify-between',
                              gate.passed
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-300'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {gate.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                              )}
                              <span className="font-medium text-[11px]">{gate.description}</span>
                            </div>
                            <Badge variant={gate.passed ? 'success' : 'danger'} className="text-[9px] py-0">
                              {gate.passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {!workspaceData.preDisbursementChecks.canDisburse && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>
                            <strong>Disbursement Block Reason:</strong>{' '}
                            {workspaceData.preDisbursementChecks.blockReason || 'One or more statutory gates failed.'}
                          </span>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* SECTION 6 & 7: REPAYMENT SETUP & MANDATE */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'WORKBENCH') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Repayment Setup */}
                      <Card className="p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          6. Repayment Setup & Amortization
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Monthly EMI:</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              {formatMoney(workspaceData.repaymentSetup.monthlyEmi)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">First Due Date:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formatDate(workspaceData.repaymentSetup.firstDueDate)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Amortization Engine:</span>
                            <span className="text-emerald-600 font-medium">Standard Reducing Balance</span>
                          </div>
                        </div>
                      </Card>

                      {/* Mandate Setup */}
                      <Card className="p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-purple-600" />
                          7. Mandate Setup (NPCI e-NACH)
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Mandate Type:</span>
                            <span className="font-semibold">{workspaceData.mandateSetup.mandateType}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">Mandate Status:</span>
                            <Badge variant="success" className="text-[10px]">
                              {workspaceData.mandateSetup.mandateStatus}
                            </Badge>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">UMRN:</span>
                            <span className="font-mono text-slate-900 dark:text-white font-semibold">
                              {workspaceData.mandateSetup.umrn}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* SECTION 8 & 9: FINANCIAL CONTROL DUAL-CONTROL (SOD) & DISBURSEMENT DESK */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'DUAL_CONTROL') && (
                    <Card className="p-5 border-2 border-indigo-200 dark:border-indigo-800/60">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-600" />
                            8 & 9. P5 Dual-Control Maker-Checker & Electronic Disbursement Desk
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Strict Segregation of Duties (SOD): Maker cannot approve as Checker. Limits enforced.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="font-mono text-[11px]">
                            Officer Limit: {formatMoney(workspaceData.disbursementDesk.officerLimit)}
                          </Badge>
                        </div>
                      </div>

                      {/* Dual-Control Task State Banner */}
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="text-slate-500">Maker-Checker State:</span>
                            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                              {workspaceData.financialControlStatus.taskStatus}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Maker:</span>
                            <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                              {workspaceData.financialControlStatus.makerEmail || 'None'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Checker:</span>
                            <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                              {workspaceData.financialControlStatus.checkerEmail || 'Pending'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Authority Limit Check:</span>
                            <div className="mt-0.5">
                              {workspaceData.disbursementDesk.exceedsAuthority ? (
                                <Badge variant="danger" className="text-[10px]">Exceeds Limit</Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px]">Within Limit</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MAKER ACTION CONTROLS */}
                      {!workspaceData.financialControlStatus.hasTask && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                            <Send className="h-4 w-4 text-blue-600" />
                            <span>Step 1: Maker Submission for Dual-Control Disbursement</span>
                          </div>
                          <Input
                            placeholder="Maker notes / disbursement rationale..."
                            value={makerNotes}
                            onChange={(e) => setMakerNotes(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => makerSubmitMutation.mutate()}
                            disabled={makerSubmitMutation.isPending || !workspaceData.preDisbursementChecks.canDisburse}
                            className="text-xs gap-1.5"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Submit for Checker Approval</span>
                          </Button>
                        </div>
                      )}

                      {/* CHECKER ACTION CONTROLS */}
                      {workspaceData.financialControlStatus.taskStatus === 'PENDING_CHECKER' && (
                        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40 mb-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-amber-600" />
                              Step 2: Dual-Control Checker Verification (Maker != Checker)
                            </span>
                            {workspaceData.financialControlStatus.isActorMaker && (
                              <Badge variant="danger" className="text-[10px]">
                                SOD Block: You are the Maker of this task
                              </Badge>
                            )}
                          </div>
                          <Input
                            placeholder="Checker review remarks..."
                            value={checkerComments}
                            onChange={(e) => setCheckerComments(e.target.value)}
                            className="text-xs"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                checkerApproveMutation.mutate({
                                  taskId: workspaceData.financialControlStatus.taskId,
                                  decision: 'APPROVE',
                                })
                              }
                              disabled={
                                checkerApproveMutation.isPending ||
                                workspaceData.financialControlStatus.isActorMaker
                              }
                              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve Payout Proposal</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                checkerApproveMutation.mutate({
                                  taskId: workspaceData.financialControlStatus.taskId,
                                  decision: 'REJECT',
                                })
                              }
                              disabled={
                                checkerApproveMutation.isPending ||
                                workspaceData.financialControlStatus.isActorMaker
                              }
                              className="text-xs gap-1.5"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject / Send Back</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: ATOMIC ELECTRONIC DISBURSEMENT EXECUTION DESK */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Coins className="h-4 w-4 text-emerald-600" />
                            <span>Step 3: Execute Authoritative Electronic Transfer</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">Payment Rail:</span>
                            {(['IMPS', 'NEFT', 'RTGS'] as const).map((rail) => (
                              <button
                                key={rail}
                                onClick={() => setPaymentRail(rail)}
                                className={cn(
                                  'px-2.5 py-1 text-xs font-semibold rounded',
                                  paymentRail === rail
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                )}
                              >
                                {rail}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-slate-500 font-medium mb-1 block">
                              UTR / Bank Transaction Reference (Optional - Auto-generated if blank)
                            </label>
                            <Input
                              placeholder="e.g. HDFC202609139821"
                              value={transactionReference}
                              onChange={(e) => setTransactionReference(e.target.value)}
                              className="text-xs h-9 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 font-medium mb-1 block">
                              Audit / Ledger Comments
                            </label>
                            <Input
                              placeholder="e.g. Direct borrower account electronic transfer"
                              value={executionComments}
                              onChange={(e) => setExecutionComments(e.target.value)}
                              className="text-xs h-9"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-xs text-slate-500">
                            Net Transfer:{' '}
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                              {formatMoney(workspaceData.financialCalculations.netDisbursalAmount)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => executeDisbursementMutation.mutate()}
                            disabled={
                              executeDisbursementMutation.isPending ||
                              !workspaceData.disbursementDesk.canDisburse
                            }
                            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold px-4"
                          >
                            <Coins className="h-4 w-4" />
                            <span>
                              {executeDisbursementMutation.isPending
                                ? 'Executing Fund Release...'
                                : 'Release & Disburse Funds Now'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* SECTION 10: FINANCIAL HISTORY & AUDIT */}
                  {(workspaceSection === 'ALL' || workspaceSection === 'AUDIT') && (
                    <Card className="p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                        10. Financial Audit & Lifecycle History
                      </h3>
                      <div className="space-y-2 text-xs">
                        {workspaceData.financialHistory.statusHistory?.length > 0 ? (
                          workspaceData.financialHistory.statusHistory.map((hist: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between py-1.5 border-b border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {hist.status}
                                </span>
                                {hist.remarks && (
                                  <span className="text-slate-500 text-[11px] ml-2">• {hist.remarks}</span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {formatDate(hist.createdAt)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 py-2">No historical status transitions recorded yet.</div>
                        )}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
