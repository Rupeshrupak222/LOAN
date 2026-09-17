'use client';

import { useState, use, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  Layers,
  Calculator,
  History,
  User,
  ExternalLink,
  Lock,
  ArrowRight,
  Landmark,
  Building2,
  Wallet,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, Spinner, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default function FinanceWorkspacePage({ params }: Props) {
  const unwrappedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const applicationId = unwrappedParams.id;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      }
    >
      <FinanceWorkspaceContent applicationId={applicationId} />
    </Suspense>
  );
}

function FinanceWorkspaceContent({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [workspaceSection, setWorkspaceSection] = useState<'ALL' | 'GATES' | 'WORKBENCH' | 'DUAL_CONTROL' | 'AUDIT'>('ALL');

  // Execution modal state
  const [paymentRail, setPaymentRail] = useState<'IMPS' | 'NEFT' | 'RTGS'>('IMPS');
  const [transactionReference, setTransactionReference] = useState('');
  const [executionComments, setExecutionComments] = useState('');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [makerNotes, setMakerNotes] = useState('');
  const [checkerComments, setCheckerComments] = useState('');
  const [showDualControl, setShowDualControl] = useState(false);

  // 1. Fetch Selected Application Financial Workspace (100% Real Live DB Data)
  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    refetch: refetchWorkspace,
    isRefetching,
  } = useQuery({
    queryKey: ['finance-workspace', applicationId],
    enabled: Boolean(applicationId),
    queryFn: async () => {
      if (!applicationId) return null;
      const res = await api.get(`/finance/applications/${applicationId}/workspace`);
      return res.data?.data;
    },
    refetchInterval: 10000,
  });

  // 2. Finance Verification & Clearance Mutation (Saves remarks to DB & forwards to Disbursement Desk)
  const verifyClearanceMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId) throw new Error('No application selected');
      return api.post(`/finance/applications/${applicationId}/verify-clearance`, {
        remarks: verificationRemarks.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Customer verified & successfully forwarded to Disbursement Desk!');
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Finance Verification Error' });
    },
  });

  // 3. Maker Submit Mutation
  const makerSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId) throw new Error('No application selected');
      return api.post(`/finance/applications/${applicationId}/maker-submit`, {
        notes: makerNotes,
        reason: 'Dual-control disbursement maker submission.',
      });
    },
    onSuccess: () => {
      toast.success('Disbursement proposed for dual-control Checker approval.');
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', applicationId] });
      setMakerNotes('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Maker Submission Error' });
    },
  });

  // 3. Checker Approve Mutation
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
      queryClient.invalidateQueries({ queryKey: ['finance-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', applicationId] });
      setCheckerComments('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Checker Approval Error' });
    },
  });

  // 4. Execute Payout Mutation
  const executeDisbursementMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId) throw new Error('No application selected');
      return api.post(`/finance/applications/${applicationId}/execute`, {
        paymentRail,
        transactionReference: transactionReference.trim() || undefined,
        comments: executionComments.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Disbursement executed successfully! Core banking loan account activated.');
      queryClient.invalidateQueries({ queryKey: ['finance-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-workspace', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-history'] });
      setTransactionReference('');
      setExecutionComments('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Disbursement Execution Blocked' });
    },
  });

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending OS / Financial Operations / Workspace"
          title="Loading Financial Workspace..."
          subtitle="Fetching 10-point gate checks, borrower bank verification and dual-control ledgers"
        />
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Spinner />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Loading Authoritative Financial Workspace from Database...
          </p>
        </div>
      </div>
    );
  }

  if (!workspaceData) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending OS / Financial Operations / Workspace"
          title="Application Unavailable"
          subtitle="The requested proposal is not available or has not been forwarded to the Finance Desk."
          action={
            <Link href="/finance-queue">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Finance Queue</span>
              </Button>
            </Link>
          }
        />
        <Card className="p-12 text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Application Not Found in Finance Desk</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This application has either not been forwarded by an authorized Sanction Officer or does not exist.
          </p>
          <Link href="/finance-queue">
            <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Go to Finance Queue
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const appSummary = workspaceData.loanApprovalSummary;
  const borrower = workspaceData.borrowerBankDetails;
  const bankAccount = borrower?.bankAccount;
  const terms = workspaceData.approvedTerms;
  const gates = workspaceData.preDisbursementChecks;
  const calc = workspaceData.financialCalculations;
  const repayment = workspaceData.repaymentSetup;
  const mandate = workspaceData.mandateSetup;
  const ctrl = workspaceData.financialControlStatus;
  const desk = workspaceData.disbursementDesk;
  const sourceNodal = workspaceData.sourceNodalAccount;
  const financeVerification = workspaceData.financeVerification;
  const history = workspaceData.financialHistory;

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Breadcrumbs & Action Bar */}
      <PageHeader
        breadcrumb="Lending OS / Financial Operations / Financial Workspace"
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900 text-lg font-bold">
              {appSummary?.applicationNo}
            </span>
            <span className="text-slate-900 dark:text-white font-bold">{borrower?.borrowerName}</span>
            <Badge
              variant={appSummary?.status === 'DISBURSED' ? 'success' : 'info'}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {appSummary?.status}
            </Badge>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Customer ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{borrower?.customerCode}</strong></span>
            <span>•</span>
            <span>Product: <strong className="text-slate-700 dark:text-slate-300">{appSummary?.loanProduct || appSummary?.purpose}</strong></span>
            <span>•</span>
            <span>Sanction: <strong className="text-slate-900 dark:text-white">{formatMoney(terms?.approvedAmount)}</strong></span>
            <span>•</span>
            <span>Tenure: <strong className="text-slate-700 dark:text-slate-300">{terms?.tenureMonths} Months @ {terms?.annualRate}% p.a.</strong></span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/finance-queue">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Queue</span>
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchWorkspace()}
              disabled={isRefetching}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Sanctioned Principal</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatMoney(terms?.approvedAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{terms?.tenureMonths}m @ {terms?.annualRate}% p.a.</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Net Electronic Disbursal</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatMoney(calc?.netDisbursalAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Less: Fee {formatMoney(calc?.processingFee)} + GST {formatMoney(calc?.gstOnFee)}</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Monthly EMI Repayment</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {formatMoney(repayment?.monthlyEmi)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">First Due: {formatDate(repayment?.firstDueDate)}</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">10-Point Pre-Checks</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            {gates?.canDisburse ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-base font-bold">
                <CheckCircle2 className="h-5 w-5" /> 10/10 Passed
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-base font-bold">
                <AlertTriangle className="h-5 w-5" /> Gates Pending
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Bank: {bankAccount?.isVerified ? 'Penny Drop Verified' : 'Penny Drop Pending'}</span>
        </Card>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl flex gap-6 text-xs font-semibold overflow-x-auto shadow-2xs">
        {[
          { id: 'ALL', label: 'Overview', icon: Layers },
          { id: 'GATES', label: '10-Point Pre-Checks', icon: ShieldCheck },
          { id: 'WORKBENCH', label: 'Fees & Calculations', icon: Calculator },
          { id: 'DUAL_CONTROL', label: 'Finance Verification Desk', icon: ShieldCheck },
          { id: 'AUDIT', label: 'Audit Timeline', icon: History },
        ].map((subTab) => {
          const Icon = subTab.icon;
          const isActive = workspaceSection === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setWorkspaceSection(subTab.id as any)}
              className={cn(
                'py-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Full Workspace Sections */}
      <div className="space-y-6">
        {/* SECTION 1: LOAN & SANCTION SUMMARY */}
        {(workspaceSection === 'ALL' || workspaceSection === 'GATES') && (
          <Card className="p-5 border-l-4 border-l-blue-600 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                1. Loan & Sanction Summary (LOS Credit Appraisal)
              </h3>
              <Badge variant="success" className="text-[10px] font-bold">
                Credit Approved & Sanctioned
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <div className="text-slate-500">Sanctioned By</div>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {appSummary?.sanctionedBy || 'Credit Underwriter'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Sanction Decision</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {appSummary?.sanctionDecision || 'APPROVE'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Sanction Date</div>
                <div className="font-medium text-slate-900 dark:text-white mt-1">
                  {formatDate(appSummary?.sanctionedAt)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Sanction Remarks</div>
                <div className="text-slate-700 dark:text-slate-300 mt-1 truncate" title={appSummary?.sanctionRemarks}>
                  {appSummary?.sanctionRemarks || 'Approved as per institutional credit policy.'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 2: DESTINATION BANK & PENNY DROP */}
        {(workspaceSection === 'ALL' || workspaceSection === 'GATES' || workspaceSection === 'DUAL_CONTROL') && (
          <Card className="p-5 border-l-4 border-l-emerald-600 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600" />
                2. Destination Borrower Bank Account (Penny Drop Verified)
              </h3>
              {bankAccount?.isVerified ? (
                <Badge variant="success" className="text-[10px] gap-1 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Penny Drop Matched ({bankAccount.nameMatchScore}%)</span>
                </Badge>
              ) : (
                <Badge variant="danger" className="text-[10px] gap-1 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Penny Drop Pending Verification</span>
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <div className="text-slate-500">Account Holder Name</div>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {bankAccount?.accountHolderName || borrower?.borrowerName}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Bank Name & Branch</div>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {bankAccount?.bankName || 'Not Linked'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Account Number</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {bankAccount?.maskedAccountNumber || '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">IFSC Code</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {bankAccount?.ifsc || '—'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* SECTION 3 & 5: SANCTIONED TERMS & FEES WORKBENCH */}
        {(workspaceSection === 'ALL' || workspaceSection === 'WORKBENCH') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sanctioned Terms */}
            <Card className="p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                3. Sanctioned Terms (Immutable Agreement)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Sanctioned Principal:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {formatMoney(terms?.approvedAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Annual Interest Rate:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {terms?.annualRate}% p.a.
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Tenure:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {terms?.tenureMonths} Months
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Key Fact Statement (KFS):</span>
                  <Badge variant="success" className="text-[10px] font-bold">
                    {terms?.kfsStatus || 'ACCEPTED_BY_BORROWER'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Fees, Taxes & Net Payout Workbench */}
            <Card className="p-5 border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                5. Fees, Taxes & Net Disbursal Workbench
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-slate-600 dark:text-slate-400">Sanctioned Principal:</span>
                  <span className="font-semibold font-mono">{formatMoney(calc?.sanctionedPrincipal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-slate-600 dark:text-slate-400">Processing Fee (1.5%):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    - {formatMoney(calc?.processingFee)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-slate-600 dark:text-slate-400">GST on Fee (18%):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    - {formatMoney(calc?.gstOnFee)}
                  </span>
                </div>
                <div className="flex justify-between py-2 pt-2.5 font-bold text-sm bg-emerald-100/60 dark:bg-emerald-900/50 px-3 rounded-lg">
                  <span className="text-emerald-900 dark:text-emerald-200">Net Electronic Disbursal:</span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-300 text-base">
                    {formatMoney(calc?.netDisbursalAmount)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* SECTION 4: 10-POINT PRE-DISBURSEMENT GATEKEEPER */}
        {(workspaceSection === 'ALL' || workspaceSection === 'GATES') && (
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                4. Statutory Pre-Disbursement Gatekeeper (10-Point Production Verification)
              </h3>
              {gates?.canDisburse ? (
                <Badge variant="success" className="text-[10px] gap-1.5 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All 10 Gates Passed</span>
                </Badge>
              ) : (
                <Badge variant="danger" className="text-[10px] gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Payout Blocked ({gates?.failedChecks?.length || 1} Gates Pending)</span>
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {gates?.checks?.map((gate: any) => (
                <div
                  key={gate.name || gate.code}
                  className={cn(
                    'p-3 rounded-xl border flex items-center justify-between transition-colors',
                    gate.passed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-300'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {gate.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-xs">{gate.description}</span>
                  </div>
                  <Badge variant={gate.passed ? 'success' : 'danger'} className="text-[9px] py-0 font-bold">
                    {gate.passed ? 'PASSED' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>

            {!gates?.canDisburse && (
              <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Disbursement Gate Block:</strong>{' '}
                  {gates?.blockReason || 'One or more statutory pre-checks require verification before fund release.'}
                </span>
              </div>
            )}
          </Card>
        )}

        {/* SECTION 6 & 7: REPAYMENT SETUP & MANDATE */}
        {(workspaceSection === 'ALL' || workspaceSection === 'WORKBENCH') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Repayment Setup */}
            <Card className="p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                6. Repayment Setup & Amortization
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Monthly EMI:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {formatMoney(repayment?.monthlyEmi)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">First Due Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(repayment?.firstDueDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Amortization Method:</span>
                  <span className="text-emerald-600 font-semibold">Standard Reducing Balance</span>
                </div>
              </div>
            </Card>

            {/* Mandate Setup */}
            <Card className="p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-600" />
                7. Mandate Setup (NPCI e-NACH)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Mandate Type:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{mandate?.mandateType || 'E_NACH_NPCI'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Mandate Status:</span>
                  <Badge variant="success" className="text-[10px] font-bold">
                    {mandate?.mandateStatus || 'ACTIVE'}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">NPCI UMRN:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {mandate?.umrn}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* SECTION 8: FINANCE OFFICER VERIFICATION & CLEARANCE DESK */}
        {(workspaceSection === 'ALL' || workspaceSection === 'DUAL_CONTROL') && (
          <Card className="p-6 border-2 border-blue-500/40 dark:border-blue-700/60 shadow-sm bg-linear-to-b from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-2 w-2 rounded-full', financeVerification?.isVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    8. Finance Officer Verification & Clearance Desk
                  </h3>
                  {financeVerification?.isVerified ? (
                    <Badge variant="success" className="text-[10px] font-bold gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verified & Cleared</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] font-bold gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Verification Pending</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Perform statutory verification and audit clearance. Once verified, this customer profile is forwarded to the Disbursement Desk.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="font-mono text-xs font-bold border-slate-300 dark:border-slate-700">
                  Officer Limit: {formatMoney(desk?.officerLimit || 10000000)}
                </Badge>
                <Badge variant={desk?.exceedsAuthority ? 'danger' : 'success'} className="text-xs font-bold">
                  {desk?.exceedsAuthority ? 'Exceeds Limit' : 'Within Authority'}
                </Badge>
              </div>
            </div>

            {/* Verified Banner if already completed */}
            {financeVerification?.isVerified ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Customer Profile Verified & Forwarded to Disbursement Desk
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Verified by <strong className="font-semibold">{financeVerification.verifiedBy || 'Finance Officer'}</strong> on{' '}
                        <strong className="font-semibold">{formatDate(financeVerification.verifiedAt)}</strong>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 italic mt-2 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                        &ldquo;{financeVerification.remarks || 'Finance verification completed and approved for disbursement by Finance Officer.'}&rdquo;
                      </div>
                    </div>
                  </div>
                  <Link href="/disbursements" className="shrink-0">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-sm cursor-pointer">
                      <span>Open in Disbursement Desk</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Pending Verification Form */
              <div className="space-y-5">
                {/* 4-Item Verification Summary Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">1. Borrower Identity</span>
                    <div className="font-bold text-slate-900 dark:text-white truncate">{borrower?.borrowerName}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> KYC Status Verified
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">2. Destination Bank</span>
                    <div className="font-bold text-slate-900 dark:text-white truncate">{bankAccount?.bankName || 'Not Linked'}</div>
                    <div className={cn('text-[11px] font-semibold flex items-center gap-1', bankAccount?.isVerified ? 'text-emerald-600' : 'text-rose-600')}>
                      {bankAccount?.isVerified ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      <span>{bankAccount?.isVerified ? 'Penny-Drop Matched' : 'Pending Verification'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">3. Sanction Terms</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(terms?.approvedAmount)}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> KFS Accepted
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">4. Statutory Gates</span>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {gates?.canDisburse ? '10/10 Checks' : `${10 - (gates?.failedChecks?.length || 1)}/10 Checks`}
                    </div>
                    <div className={cn('text-[11px] font-semibold flex items-center gap-1', gates?.canDisburse ? 'text-emerald-600' : 'text-rose-600')}>
                      {gates?.canDisburse ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      <span>{gates?.canDisburse ? 'All Gates Passed' : 'Gates Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Remarks Input and Action Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Finance Officer Verification Remarks & Compliance Notes
                    </label>
                    <Input
                      placeholder="e.g. All documents, penny-drop bank account, and KYC verified compliant with credit policy. Approved and forwarded for disbursement..."
                      value={verificationRemarks}
                      onChange={(e) => setVerificationRemarks(e.target.value)}
                      className="text-xs h-10"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      These remarks will be permanently recorded in the immutable institutional audit trail and forwarded to the Disbursement Desk.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span>Only verified customer profiles will be unlocked in the Disbursement Desk.</span>
                    </div>

                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md h-10 px-6 transition-all cursor-pointer"
                      onClick={() => verifyClearanceMutation.mutate()}
                      disabled={verifyClearanceMutation.isPending || !gates?.canDisburse}
                    >
                      {verifyClearanceMutation.isPending ? (
                        <span>Saving Verification...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          <span>Verify & Forward to Disbursement Desk</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* SECTION 10: IMMUTABLE AUDIT TIMELINE */}
        {(workspaceSection === 'ALL' || workspaceSection === 'AUDIT') && (
          <Card className="p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              10. Financial Audit Trail & Lifecycle Status History
            </h3>
            <div className="space-y-3 text-xs">
              {history?.statusHistory?.length === 0 ? (
                <p className="text-slate-500">No status transitions recorded yet.</p>
              ) : (
                history?.statusHistory?.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.fromStatus} &rarr; {item.toStatus}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.reason || 'Status updated.'}</p>
                      <span className="text-[10px] text-slate-400">By: {item.changedBy || 'System'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
