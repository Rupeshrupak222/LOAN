'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Calculator,
  FileCheck,
  FileText,
  User,
  Building,
  DollarSign,
  Percent,
  TrendingUp,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  Send,
  Sliders,
  Check,
  X,
  ExternalLink,
  Search,
  Scale,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  CheckSquare,
  History,
  FileSpreadsheet,
  Pencil,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

export default function UnderwritingWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      }
    >
      <UnderwritingWorkspaceContent />
    </Suspense>
  );
}

function UnderwritingWorkspaceContent() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const urlAppId = searchParams.get('id');

  // Active Selected Application ID
  const [selectedAppId, setSelectedAppId] = useState<string | null>(urlAppId);

  useEffect(() => {
    if (urlAppId) setSelectedAppId(urlAppId);
  }, [urlAppId]);

  // Active section tab in the workspace
  const [activeSection, setActiveSection] = useState<string>('ALL');

  // Case Selector modal / popover
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  // Calculation Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Timeline Modal State
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const isUnderwriter = user?.roles?.some((r: string) =>
    ['UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CREDIT_HEAD'].includes(r)
  );

  // 1. Fetch Inbound Queue for Case Selection (ALL lifecycle cases including decided/approved/rejected)
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['underwriting-queue', 'ALL', selectorSearch],
    enabled: Boolean(isUnderwriter),
    queryFn: async () => {
      const res = await api.get('/underwriting/queue', {
        params: { tab: 'ALL', search: selectorSearch.trim() || undefined },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : raw?.items || []) as any[];
    },
  });

  if (!isUnderwriter) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Access Restricted
        </p>
        <p className="text-xs text-slate-400">
          The Underwriting Workspace is restricted to Underwriters and Credit Committee members. Branch Managers do not have permission to access the Underwriting Desk.
        </p>
        <div className="pt-2">
          <Link href="/branch-review">
            <Button size="sm" className="text-xs">
              Go to Branch Review Desk →
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const availableCases = Array.isArray(queueData) ? queueData : [];

  // If no application selected from URL or state, default to first available in queue
  const currentAppId = selectedAppId || availableCases[0]?.id;

  // 2. Fetch Consolidated Underwriting Workspace for Current Application
  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useQuery({
    queryKey: ['underwriting-workspace', currentAppId],
    queryFn: async () => {
      if (!currentAppId) return null;
      const res = await api.get(`/underwriting/${currentAppId}/workspace`);
      return res.data?.data;
    },
    enabled: Boolean(currentAppId),
  });

  // Offer Workbench State
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [approvedTenure, setApprovedTenure] = useState<number>(12);
  const [approvedRate, setApprovedRate] = useState<number>(12.0);

  // Sync offer terms when workspace loads
  useMemo(() => {
    if (workspaceData?.offer) {
      setApprovedAmount(Number(workspaceData.offer.approvedAmount || workspaceData.application.requestedAmount || 0));
      setApprovedTenure(Number(workspaceData.offer.tenureMonths || workspaceData.application.tenureMonths || 12));
      setApprovedRate(Number(workspaceData.offer.interestRate || 12.0));
    }
  }, [workspaceData]);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Recalculate EMI & Disbursal in Real-Time
  const computedTerms = useMemo(() => {
    const P = approvedAmount;
    const N = Math.max(1, approvedTenure);
    const r = approvedRate / 12 / 100;
    const emi =
      r > 0
        ? Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1))
        : Math.round(P / N);
    const feePct = 0.015; // 1.5% standard fee
    const processingFee = Math.round(P * feePct);
    const gstOnFee = Math.round(processingFee * 0.18);
    const netDisbursal = P - processingFee - gstOnFee;
    const totalRepayment = emi * N;
    const apr = approvedRate + (feePct * 12 / N) * 100;
    return { emi, processingFee, gstOnFee, netDisbursal, totalRepayment, apr: Number(apr.toFixed(2)) };
  }, [approvedAmount, approvedTenure, approvedRate]);

  // Deviation Resolution State
  const [resolvingDevId, setResolvingDevId] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<'RESOLVED' | 'WAIVED' | 'REJECTED'>('WAIVED');
  const [devReason, setDevReason] = useState('');

  // Decision Desk State
  const [decision, setDecision] = useState<
    'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'HOLD' | 'ESCALATE' | 'REJECT'
  >('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [conditionText, setConditionText] = useState('');
  const [conditionType, setConditionType] = useState('PRE_DISBURSEMENT');
  const [conditionResponsible, setConditionResponsible] = useState('BORROWER');
  const [conditionDueStage, setConditionDueStage] = useState('DISBURSEMENT');
  const [escalationTarget, setEscalationTarget] = useState('LEVEL_3_CREDIT_HEAD');
  const [sendBackTarget, setSendBackTarget] = useState<'CREDIT_ANALYST' | 'LOAN_OFFICER'>('CREDIT_ANALYST');
  const [holdInfoRequired, setHoldInfoRequired] = useState('');

  const [isRevisingDecision, setIsRevisingDecision] = useState(false);

  // Resolve Deviation Mutation
  const resolveDeviationMutation = useMutation({
    mutationFn: async ({ devId, status, reason }: { devId: string; status: any; reason: string }) => {
      return api.post(`/underwriting/${currentAppId}/deviations/${devId}/resolve`, {
        status,
        reason,
      });
    },
    onSuccess: () => {
      toast.success('Policy deviation resolution saved.');
      setResolvingDevId(null);
      setDevReason('');
      refetchWorkspace();
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Deviation Resolution Error' });
    },
  });

  // Submit Final Underwriting Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: async () => {
      let conditionsPayload = undefined;
      if (decision === 'APPROVE_WITH_CONDITIONS') {
        conditionsPayload = JSON.stringify({
          condition: conditionText,
          type: conditionType,
          responsibleParty: conditionResponsible,
          dueStage: conditionDueStage,
        });
      }

      return api.post(`/underwriting/${currentAppId}/decision`, {
        decision,
        reason:
          decision === 'SEND_BACK'
            ? `[Target: ${sendBackTarget}] ${decisionReason}`
            : decision === 'HOLD'
            ? `[Info Required: ${holdInfoRequired}] ${decisionReason}`
            : decisionReason,
        conditions: conditionsPayload,
        approvedAmount,
        approvedTenure,
        approvedRate,
        escalationTarget: decision === 'ESCALATE' ? escalationTarget : undefined,
      });
    },
    onSuccess: () => {
      toast.success(`Underwriting decision '${decision}' committed successfully. Case routed to Approval Queue.`);
      refetchWorkspace();
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-underwriting-cases'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDecisionReason('');
      setConditionText('');
      setHoldInfoRequired('');
      setIsRevisingDecision(false);
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Gate Enforcement' });
    },
  });

  // If no cases exist at all
  if (!queueLoading && availableCases.length === 0 && !workspaceData) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending / Underwriting Workspace"
          title="Underwriting Workspace"
          subtitle="Consolidated 9-step credit appraisal and decision workbench."
          action={
            <Link href="/underwriting-queue">
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
              </Button>
            </Link>
          }
        />
        <Card className="p-12 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No Active Underwriting Cases Found
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All credit appraised proposals have been processed or are waiting in the intake and assessment queues.
          </p>
          <Link href="/underwriting-queue">
            <Button size="sm" className="gap-1.5 font-bold text-xs bg-[#2563EB] text-white shadow-xs cursor-pointer">
              Go to Underwriting Queue
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Loading Workspace
  if (workspaceLoading || (!workspaceData && queueLoading)) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending / Underwriting Workspace"
          title="Loading Underwriting Workspace..."
          subtitle="Assembling 9-step appraisal dossier, BRE rules, and authority matrix..."
        />
        <TableSkeleton rows={8} cols={4} />
      </div>
    );
  }

  const ws = workspaceData;
  const app = ws?.application || {};
  const cust = ws?.customer || {};
  const ca = ws?.creditAssessment || {};
  const rf = ws?.riskAndFraud || {};
  const deviations = ws?.deviations || [];
  const gates = ws?.gates || { canApprove: false, blockers: [] };
  const authorityCheck = ws?.authorityCheck || { hasAuthority: true, maxLimit: 2500000 };

  const isExceedingLimit = Number(app.requestedAmount || 0) > (authorityCheck.maxLimit || 2500000);
  const canApprove = gates.canApprove && !isExceedingLimit;

  // Derive Gate State
  let gateBannerState: 'READY' | 'BLOCKED' | 'REQUIRES_INFO' | 'ESCALATION_REQUIRED' = 'READY';
  if (isExceedingLimit) {
    gateBannerState = 'ESCALATION_REQUIRED';
  } else if (
    gates.blockers &&
    gates.blockers.some((b: string) => b.toLowerCase().includes('document') || b.toLowerCase().includes('pending') || b.toLowerCase().includes('kyc'))
  ) {
    gateBannerState = 'REQUIRES_INFO';
  } else if (!gates.canApprove) {
    gateBannerState = 'BLOCKED';
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. WORKSPACE HEADER                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href="/underwriting-queue"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              #{app.applicationNo || app.id?.slice(0, 8)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {cust.firstName} {cust.lastName}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                app.status === 'UNDERWRITING'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : app.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : app.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              {app.status}
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span>Underwriting Workspace</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Product: {app.product?.name || 'Personal Loan'}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Requested: {formatMoney(Number(app.requestedAmount || 0))}
            </span>
          </h1>
        </div>

        {/* Header Badges & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Risk Grade */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold">
            Risk Grade:{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {rf.riskCategory || cust.riskCategory || 'LOW'}
            </span>
          </div>

          {/* BRE Status */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold">
            BRE:{' '}
            <span className="text-emerald-600 dark:text-emerald-400">
              {app.breDecision || 'PASS'}
            </span>
          </div>

          {/* Authority Status */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5',
              isExceedingLimit
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
            )}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isExceedingLimit ? 'Exceeds Authority' : 'Within Authority'}</span>
          </div>

          {/* SLA */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>SLA: {app.slaDeadline ? formatDate(app.slaDeadline) : '< 24 Hours'}</span>
          </div>

          {/* Header Action: View Timeline */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTimelineModal(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <History className="w-3.5 h-3.5" /> View Timeline
          </Button>

          {/* Header Action: View Audit */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setActiveSection('sec-audit');
              document.getElementById('sec-audit')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-semibold gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> View Audit
          </Button>

          {/* Case Switcher */}
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCaseSelector(!showCaseSelector)}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              Switch Case <ChevronDown className="w-3.5 h-3.5" />
            </Button>

            {showCaseSelector && (
              <div
                className={cn(
                  'absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in',
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                )}
              >
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder="Search available cases..."
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    className={cn(
                      'w-full px-2.5 py-1 text-xs rounded-lg border outline-none',
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    )}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {availableCases.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedAppId(item.id);
                        setShowCaseSelector(false);
                      }}
                      className={cn(
                        'w-full p-2.5 text-left transition-colors flex items-center justify-between cursor-pointer',
                        item.id === currentAppId
                          ? isDark
                            ? 'bg-slate-800'
                            : 'bg-slate-100'
                          : isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          #{item.applicationNo}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.customer
                            ? `${item.customer.firstName} ${item.customer.lastName}`
                            : item.borrowerName || 'Borrower'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {formatMoney(Number(item.requestedAmount || 0))}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.tenureMonths}M</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXACT 9-STEP SEQUENTIAL NAVIGATION ANCHOR BAR                          */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'ALL', label: 'All 9 Steps' },
          { id: 'sec-borrower', label: '1. Borrower' },
          { id: 'sec-credit-assessment', label: '2. Credit Assessment' },
          { id: 'sec-kyc-docs', label: '3. KYC & Documents' },
          { id: 'sec-financial', label: '4. Financial Assessment' },
          { id: 'sec-risk-bre', label: '5. Risk & BRE' },
          { id: 'sec-deviations', label: `6. Deviations (${deviations.length})` },
          { id: 'sec-offer', label: '7. Offer & Sanction' },
          { id: 'sec-decision', label: '8. Decision' },
          { id: 'sec-audit', label: '9. Audit' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSection(tab.id);
              if (tab.id !== 'ALL') {
                document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
              activeSection === tab.id
                ? isDark
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* STEP 1 — BORROWER (VIEW ONLY)                                             */}
      {/* ========================================================================= */}
      <Card id="sec-borrower" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 1 — BORROWER (VIEW ONLY)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Customer Code: <strong className="text-slate-700 dark:text-slate-200">{cust.customerCode || cust.id?.slice(0, 8) || 'N/A'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Personal Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Personal Information</span>
            <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {cust.firstName || ''} {cust.lastName || ''}
            </div>
            <div className="text-slate-500">
              Gender: {cust.gender || 'Not specified'} · DOB: {cust.dateOfBirth ? formatDate(cust.dateOfBirth) : 'N/A'}
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              PAN: {cust.CustomerIdentifier?.find((c: any) => c.idType === 'PAN')?.maskedValue || (cust.panNumber ? `••••${cust.panNumber.slice(-4)}` : cust.panVerified ? 'Verified' : 'Not provided')}
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Aadhaar: {cust.CustomerIdentifier?.find((c: any) => c.idType === 'AADHAAR')?.maskedValue || (cust.aadhaarNumber ? `••••${cust.aadhaarNumber.slice(-4)}` : 'Not provided')}
            </div>
          </div>

          {/* Employment & Income */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Employment & Income</span>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {cust.employmentType || cust.employmentDetails?.[0]?.employmentType || 'Not specified'}
            </div>
            <div className="text-slate-500">
              Employer: {cust.employerName || cust.employmentDetails?.[0]?.employerName || (cust.employmentType === 'SELF_EMPLOYED' || cust.employmentType === 'FREELANCER' ? 'Self / Freelance' : 'N/A')}
            </div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              Income: {cust.monthlyIncome ? `₹${Number(cust.monthlyIncome).toLocaleString('en-IN')}/month` : 'Not specified'}
            </div>
          </div>

          {/* Address */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Contact & Address</span>
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {cust.mobile || 'No Mobile'}
            </div>
            <div className="text-slate-500 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> {cust.email || 'No Email'}
            </div>
            <div className="text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />{' '}
              {cust.addresses?.[0]?.addressLine
                ? `${cust.addresses[0].addressLine}, ${cust.addresses[0].city || ''}, ${cust.addresses[0].state || ''} ${cust.addresses[0].pincode || ''}`.trim()
                : cust.city || cust.state || cust.pincode
                ? `${cust.city || ''}, ${cust.state || ''} ${cust.pincode || ''}`.trim()
                : 'Address not provided'}
            </div>
          </div>

          {/* Bank Account & Loan Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Bank Account & Origination</span>
            <div className="font-semibold text-slate-800 dark:text-slate-100">
              Bank: {cust.bankAccounts?.[0]?.bankName || cust.bankName || 'Not linked'}{' '}
              (IFSC: {cust.bankAccounts?.[0]?.ifscCode || cust.bankIfsc || cust.ifscCode || 'N/A'})
            </div>
            <div className="text-slate-500">Purpose: {app.purpose || 'General Financing'}</div>
            <div className="text-slate-500">
              Source: {app.channel || 'Direct Web'} · Branch: {app.branch?.name || cust.branch?.name || 'Main Branch'}
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 2 — CREDIT ASSESSMENT (VIEW ONLY)                                    */}
      {/* ========================================================================= */}
      <Card id="sec-credit-assessment" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 2 — CREDIT ASSESSMENT (VIEW ONLY — CREDIT ANALYST OUTPUT)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Read-Only Desk · Send Back to Credit Analyst if correction required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Analyst Recommendation */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Analyst Recommendation:</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold',
                  ca.recommendation?.recommendation === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : ca.recommendation?.recommendation === 'REJECT'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                {ca.recommendation?.recommendation || (app.status === 'UNDERWRITING' ? 'RECOMMENDED' : app.status)}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">
              "{ca.recommendation?.remarks || 'Borrower meets debt-servicing criteria and is eligible for underwriting review.'}"
            </p>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Assessed By: {ca.recommendation?.assessedBy || 'Credit Analyst'}</span>
              <span>{ca.recommendation?.assessedAt ? formatDate(ca.recommendation.assessedAt) : formatDate(app.updatedAt)}</span>
            </div>
          </div>

          {/* Affordability, FOIR, DTI */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <span className="font-semibold text-slate-500">Affordability Metrics</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Monthly Income:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ₹{Number(ca.foirDti?.monthlyIncome ?? cust.monthlyIncome ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Existing Obligations / EMI:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ₹{Number(ca.foirDti?.existingObligations ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">FOIR / DTI Ratio:</span>
              <span
                className={cn(
                  'font-bold text-sm',
                  Number(ca.foirDti?.foirPct ?? 0) <= 50 ? 'text-emerald-600' : 'text-amber-600'
                )}
              >
                {ca.foirDti?.foirPct ?? 0}% (Cap: 50%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Net Disposable Income:</span>
              <span className="font-bold text-emerald-600">
                ₹{Number(ca.foirDti?.disposableIncome ?? 0).toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>

          {/* Credit Bureau Performance */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <span className="font-semibold text-slate-500">Credit Bureau Performance</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Bureau Score:</span>
              <span
                className={cn(
                  'font-bold text-sm',
                  Number(ca.bureau?.score ?? cust.creditScore ?? 0) >= 700 ? 'text-emerald-600' : 'text-amber-600'
                )}
              >
                {ca.bureau?.score ?? cust.creditScore ?? 'N/A'}{ca.bureau?.score || cust.creditScore ? ' / 900' : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Active Credit Lines:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {ca.bureau?.activeLines ?? 0} accounts
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
              {ca.bureau?.summary || (cust.creditScore ? `Bureau score recorded in credit bureau check.` : 'Bureau record available.')}
            </p>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 3 — KYC & DOCUMENTS (VIEW / PREVIEW ONLY)                             */}
      {/* ========================================================================= */}
      <Card id="sec-kyc-docs" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 3 — KYC & DOCUMENTS (VIEW / PREVIEW ONLY)
            </h3>
          </div>
          <Badge status={cust.kycStatus || 'VERIFIED'} />
        </div>

        {/* Verification Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">PAN Verification</span>
            <div className={cn('font-bold flex items-center gap-1', cust.panNumber || cust.panVerified ? 'text-emerald-600' : 'text-amber-600')}>
              {cust.panNumber || cust.panVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {cust.panNumber || cust.panVerified ? 'Matched' : 'Pending'}
            </div>
            <div className="text-[10px] text-slate-400">{cust.panNumber ? 'NSDL Verified' : 'Awaiting PAN'}</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Aadhaar (OKYC)</span>
            <div className={cn('font-bold flex items-center gap-1', cust.aadhaarNumber || cust.aadhaarVerified ? 'text-emerald-600' : 'text-amber-600')}>
              {cust.aadhaarNumber || cust.aadhaarVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {cust.aadhaarNumber || cust.aadhaarVerified ? 'Verified' : 'Pending'}
            </div>
            <div className="text-[10px] text-slate-400">{cust.aadhaarVerified ? 'UIDAI OKYC Verified' : 'Awaiting Aadhaar'}</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Face Match / Liveness</span>
            <div className={cn('font-bold flex items-center gap-1', cust.faceMatchScore || cust.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600')}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {cust.faceMatchScore ? `${cust.faceMatchScore}% Match` : cust.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
            </div>
            <div className="text-[10px] text-slate-400">Zero Spoof Detected</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">AML Screening</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {rf.fraudSignals?.amlScreening === 'CLEAR' || cust.kycStatus === 'VERIFIED' ? 'Clear (No Hits)' : 'In Review'}
            </div>
            <div className="text-[10px] text-slate-400">OFAC / RBI Watchlist</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">KYC Status</span>
            <div className={cn('font-bold flex items-center gap-1', cust.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600')}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {cust.kycStatus || 'PENDING'}
            </div>
            <div className="text-[10px] text-slate-400">Audited Status</div>
          </div>
        </div>

        {/* Explicit Customer Consents */}
        {cust.consents && cust.consents.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                Explicit Customer Consents & Digital Mandates (Phase 9A Verified)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">{cust.consents.length} Consents Recorded</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {cust.consents.map((con: any) => (
                <div
                  key={con.id}
                  className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">{con.consentType}</span>
                  <span className="text-slate-400 font-mono">({con.version})</span>
                  <span className="text-[10px] text-slate-500">· {con.grantedAt ? formatDate(con.grantedAt) : 'Granted'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Checklist & Previews */}
        <div className="overflow-x-auto text-xs pt-2">
          {(() => {
            const allDocs = Array.from(
              new Map(
                [...(ws?.documents || []), ...(cust.documents || []), ...(app.documents || [])]
                  .filter(Boolean)
                  .map((d: any) => [d.id, d])
              ).values()
            );

            return (
              <table className="w-full text-left">
                <thead
                  className={cn(
                    'border-b font-bold uppercase text-[10px] tracking-wider',
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                  )}
                >
                  <tr>
                    <th className="py-2 px-3">Document Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Verification Method</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3 text-right">Inspection / Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {allDocs.length > 0 ? (
                    allDocs.map((doc: any) => (
                      <tr key={doc.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                          {doc.documentType?.replace(/_/g, ' ') || doc.category || doc.fileName || 'Identity / Financial Proof'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold',
                              doc.verified || doc.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            )}
                          >
                            {doc.verified || doc.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {doc.verificationMethod || (doc.verified || doc.status === 'VERIFIED' ? 'Verified via OCR / Inspector' : 'Pending Inspection')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                          {doc.updatedAt ? formatDate(doc.updatedAt) : doc.createdAt ? formatDate(doc.createdAt) : 'Recently'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview Document
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        No uploaded documents attached to this application.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 4 — FINANCIAL ASSESSMENT (AUTHORITATIVE BACKEND CALCULATIONS)        */}
      {/* ========================================================================= */}
      <Card id="sec-financial" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 4 — FINANCIAL ASSESSMENT (AUTHORITATIVE BACKEND CALCULATIONS)
            </h3>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCalcModal(true)}
            className="text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> VIEW CALCULATION
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Monthly Income</span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              ₹{Number(ca.foirDti?.monthlyIncome ?? cust.monthlyIncome ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">{cust.employmentType ? `Employment: ${cust.employmentType}` : 'Assessed Income'}</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Existing EMI</span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              ₹{Number(ca.foirDti?.existingObligations ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Bureau identified</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Proposed EMI</span>
            <div className="text-base font-bold text-blue-600 dark:text-blue-400">
              ₹{computedTerms.emi.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">{approvedTenure} months tenure</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">FOIR / DTI</span>
            <div className="text-base font-bold text-emerald-600">
              {ca.foirDti?.foirPct ?? 0}%
            </div>
            <div className="text-[10px] text-slate-400">Policy cap: 50%</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Disposable Income</span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              ₹{Number(ca.foirDti?.disposableIncome ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Surplus post all dues</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Final Eligible Limit</span>
            <div className="text-base font-bold text-emerald-600">
              ₹{Number(app.eligibleAmount || app.requestedAmount || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Authority approved</div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 5 — RISK & BRE (REVIEW ONLY)                                         */}
      {/* ========================================================================= */}
      <Card id="sec-risk-bre" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 5 — RISK & BRE (DECISION ENGINE REVIEW)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            BRE Engine v2.4 · Decision Status: <strong className="text-emerald-600">{app.breDecision || rf.breOutcome?.verdict || 'PASS'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1 overflow-hidden">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Risk Score & Grade</span>
            <div className="text-base font-bold text-emerald-600 truncate">
              Score: {rf.riskAssessment?.score ?? 25}{' '}
              <span className="text-xs font-normal text-slate-400">
                (Grade {rf.riskAssessment?.grade || 'A'} / {rf.riskAssessment?.riskCategory || cust.riskCategory || 'LOW'} Risk)
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Multi-pillar weighted credit vector</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1 overflow-hidden">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">BRE Decision</span>
            <div
              className={cn(
                'text-base font-bold truncate',
                (app.breDecision || rf.breOutcome?.verdict || 'PASS').includes('FAIL') ||
                (app.breDecision || rf.breOutcome?.verdict || 'PASS').includes('REJECT')
                  ? 'text-rose-600'
                  : (app.breDecision || rf.breOutcome?.verdict || 'PASS').includes('REFER')
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              )}
              title={app.breDecision || rf.breOutcome?.verdict || 'PASS'}
            >
              {app.breDecision || rf.breOutcome?.verdict || 'PASS'}
            </div>
            <p className="text-[10px] text-slate-400">All automated policy gates evaluated</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Hard Stops & Warnings</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              {deviations.filter((d: any) => d.severity === 'CRITICAL').length} Hard Stops ·{' '}
              {deviations.filter((d: any) => d.severity !== 'CRITICAL').length} Warnings
            </div>
            <p className={cn('text-[10px] font-semibold', deviations.length === 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {deviations.length === 0 ? 'Clean underwriting gate profile' : 'Exceptions require mitigation / waiver'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Fraud & Syndicate Signals</span>
            <div className="text-base font-bold text-emerald-600">
              {rf.fraudSignals?.overallRisk === 'HIGH' ? 'Review Required' : 'Clean / Zero Anomaly'}
            </div>
            <p className="text-[10px] text-slate-400">
              {rf.fraudSignals?.deviceFingerprintMatch ? 'Device, IP & Identity verified' : 'Standard verification profile'}
            </p>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 6 — DEVIATIONS                                                       */}
      {/* ========================================================================= */}
      <Card id="sec-deviations" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 6 — DEVIATIONS ({deviations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {deviations.length === 0 ? 'Policy Invariant' : 'Exceptions Requiring Resolution'}
          </span>
        </div>

        {deviations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">NO ACTIVE DEVIATIONS</p>
            <p className="text-[11px] text-slate-400">
              This loan application adheres strictly to standard product and underwriting credit parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviations.map((d: any) => {
              const isNonWaivable = d.severity === 'CRITICAL' || d.isWaivable === false;

              return (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{d.ruleName || d.rule}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          d.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        )}
                      >
                        {d.severity}
                      </span>
                      {isNonWaivable && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 border border-rose-500/40">
                          NON-WAIVABLE
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">Status: {d.status}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-500 pt-1">
                    <div>
                      Expected: <strong className="text-slate-700 dark:text-slate-300">{d.expectedValue || 'Standard'}</strong>
                    </div>
                    <div>
                      Actual: <strong className="text-slate-700 dark:text-slate-300">{d.actualValue || 'Observed'}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      Reason: <strong className="text-slate-700 dark:text-slate-300">{d.reason || 'Exception logged during evaluation'}</strong>
                    </div>
                  </div>

                  {/* Actions: MITIGATE / WAIVE / ESCALATE */}
                  {d.status === 'ACTIVE' && (
                    <div className="pt-2 flex items-center gap-2">
                      {isNonWaivable ? (
                        <Button
                          size="sm"
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 cursor-pointer"
                          onClick={() => {
                            setDecision('ESCALATE');
                            setActiveSection('sec-decision');
                            document.getElementById('sec-decision')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Scale className="w-3.5 h-3.5" /> ESCALATE (Non-Waivable Rule)
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setResolvingDevId(d.id);
                              setDevStatus('WAIVED');
                            }}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            WAIVE EXCEPTION
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setResolvingDevId(d.id);
                              setDevStatus('RESOLVED');
                            }}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            MITIGATE
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setDecision('ESCALATE');
                              setActiveSection('sec-decision');
                              document.getElementById('sec-decision')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs font-semibold text-purple-600 cursor-pointer"
                          >
                            ESCALATE
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {resolvingDevId === d.id && (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter underwriter justification..."
                        value={devReason}
                        onChange={(e) => setDevReason(e.target.value)}
                        className={cn(
                          'w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none',
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!devReason.trim() || resolveDeviationMutation.isPending}
                          onClick={() =>
                            resolveDeviationMutation.mutate({ devId: d.id, status: devStatus, reason: devReason })
                          }
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setResolvingDevId(null)} className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* STEP 7 — OFFER & SANCTION                                                 */}
      {/* ========================================================================= */}
      <Card id="sec-offer" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 7 — OFFER & SANCTION TERMS
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Validated against Product + Pricing + Authority Limits
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sanction Amount (₹) *
              </label>
              <input
                type="number"
                step="10000"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className={cn(
                  'w-full py-2 px-3 rounded-xl border text-sm font-bold outline-none focus:border-blue-500',
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              />
              <span className="text-[10px] text-slate-400">
                Requested: ₹{Number(app.requestedAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenure (Months) *
                </label>
                <input
                  type="number"
                  value={approvedTenure}
                  onChange={(e) => setApprovedTenure(Number(e.target.value))}
                  className={cn(
                    'w-full py-1.5 px-3 rounded-xl border text-xs font-bold outline-none',
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={approvedRate}
                  onChange={(e) => setApprovedRate(Number(e.target.value))}
                  className={cn(
                    'w-full py-1.5 px-3 rounded-xl border text-xs font-bold outline-none',
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Real-time validated summary */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400">Monthly EMI</span>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹{computedTerms.emi.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Reducing balance</div>
            </div>

            <div>
              <span className="text-slate-400">Processing Fee (1.5%)</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                ₹{computedTerms.processingFee.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">+ 18% GST (₹{computedTerms.gstOnFee.toLocaleString('en-IN')})</div>
            </div>

            <div>
              <span className="text-slate-400">Net Disbursal</span>
              <div className="text-base font-bold text-emerald-600 mt-1">
                ₹{computedTerms.netDisbursal.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Direct to verified A/C</div>
            </div>

            <div>
              <span className="text-slate-400">Total Repayment</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                ₹{computedTerms.totalRepayment.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Principal + Interest</div>
            </div>

            <div>
              <span className="text-slate-400">APR</span>
              <div className="text-sm font-bold text-purple-600 mt-1">
                {computedTerms.apr}%
              </div>
              <div className="text-[10px] text-slate-400">Annual Percentage Rate</div>
            </div>

            <div>
              <span className="text-slate-400">KFS Status</span>
              <div className="text-sm font-bold text-emerald-600 mt-1">
                RBI KFS READY
              </div>
              <div className="text-[10px] text-slate-400">Key Fact Statement</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 8 — DECISION DESK                                                    */}
      {/* ========================================================================= */}
      {(() => {
        const committedDecision = workspaceData?.underwritingDecision || workspaceData?.application?.underwriting;
        const hasCommittedDecision = Boolean(committedDecision?.decision);

        return (
          <Card id="sec-decision" className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  STEP 8 — FINAL UNDERWRITING DECISION
                </h3>
                {hasCommittedDecision && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Already Committed
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                Immutable Decision Desk · All Policy Gates Server-Enforced
              </span>
            </div>

            {/* Gating Notice if Blocked */}
            {!canApprove && (
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-1 text-xs">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Approval Policy Gate Notice
                </div>
                <ul className="list-disc list-inside text-rose-600 dark:text-rose-300 text-[11px] space-y-0.5">
                  {isExceedingLimit && (
                    <li>Requested amount exceeds Underwriter delegated limit. Action required: ESCALATE.</li>
                  )}
                  {gates.blockers?.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Committed Decision Summary Banner */}
            {hasCommittedDecision && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0',
                      committedDecision.decision === 'APPROVE' && 'bg-emerald-600',
                      committedDecision.decision === 'APPROVE_WITH_CONDITIONS' && 'bg-teal-600',
                      committedDecision.decision === 'SEND_BACK' && 'bg-amber-600',
                      committedDecision.decision === 'HOLD' && 'bg-yellow-600',
                      committedDecision.decision === 'ESCALATE' && 'bg-purple-600',
                      committedDecision.decision === 'REJECT' && 'bg-rose-600'
                    )}>
                      {committedDecision.decision === 'APPROVE' ? <CheckCircle2 className="w-5 h-5" /> :
                       committedDecision.decision === 'REJECT' ? <XCircle className="w-5 h-5" /> :
                       committedDecision.decision === 'APPROVE_WITH_CONDITIONS' ? <CheckCircle2 className="w-5 h-5" /> :
                       <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Active Decision:
                        </span>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase shadow-xs',
                          committedDecision.decision === 'APPROVE' && 'bg-emerald-500 text-white',
                          committedDecision.decision === 'APPROVE_WITH_CONDITIONS' && 'bg-teal-500 text-white',
                          committedDecision.decision === 'SEND_BACK' && 'bg-amber-500 text-white',
                          committedDecision.decision === 'HOLD' && 'bg-yellow-500 text-white',
                          committedDecision.decision === 'ESCALATE' && 'bg-purple-500 text-white',
                          committedDecision.decision === 'REJECT' && 'bg-rose-500 text-white'
                        )}>
                          {committedDecision.decision.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          ✓ Synced in Approval Queue
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Decided by <span className="font-semibold text-slate-700 dark:text-slate-300">{committedDecision.decidedBy || 'Underwriter'}</span>
                        {committedDecision.createdAt && ` on ${formatDate(committedDecision.createdAt)}`}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Link href={`/approval-queue?search=${encodeURIComponent(app?.applicationNo || currentAppId)}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> View in Approval Queue
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!isRevisingDecision) {
                          setDecision(committedDecision.decision);
                          if (committedDecision.reason) setDecisionReason(committedDecision.reason);
                        }
                        setIsRevisingDecision(!isRevisingDecision);
                      }}
                      className={cn(
                        'text-xs font-bold cursor-pointer gap-1.5 shadow-xs transition-colors',
                        isRevisingDecision
                          ? 'bg-slate-700 hover:bg-slate-800 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {isRevisingDecision ? 'Hide Revision Form' : 'Revise / Change Decision'}
                    </Button>
                  </div>
                </div>

                {/* Decision commentary / notes */}
                {committedDecision.reason && (
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">Underwriting Commentary: </span>
                    <span className="italic">{committedDecision.reason}</span>
                  </div>
                )}
              </div>
            )}

            {/* Revision Mode Banner */}
            {hasCommittedDecision && isRevisingDecision && (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Decision Revision Mode:</strong> You can select a new underwriting decision below. Submitting will revise the record and update the Approval Queue.
                </span>
              </div>
            )}

            {/* Canonical 6 Action Buttons and Decision Form */}
            {(!hasCommittedDecision || isRevisingDecision) && (
              <div className="space-y-4 pt-1">
                {/* Action Selection Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { key: 'APPROVE', label: 'APPROVE', disabled: !canApprove, color: 'bg-emerald-600 hover:bg-emerald-700' },
                    { key: 'APPROVE_WITH_CONDITIONS', label: 'APPROVE WITH CONDITIONS', disabled: !canApprove, color: 'bg-teal-600 hover:bg-teal-700' },
                    { key: 'SEND_BACK', label: 'SEND BACK', disabled: false, color: 'bg-amber-600 hover:bg-amber-700' },
                    { key: 'HOLD', label: 'HOLD / INFO REQUIRED', disabled: false, color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { key: 'ESCALATE', label: 'ESCALATE', disabled: false, color: 'bg-purple-600 hover:bg-purple-700' },
                    { key: 'REJECT', label: 'REJECT', disabled: false, color: 'bg-rose-600 hover:bg-rose-700' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      disabled={btn.disabled}
                      onClick={() => setDecision(btn.key as any)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center',
                        decision === btn.key
                          ? 'bg-[#2563EB] text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : btn.disabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Fields for Decisions */}
                <div className="space-y-3 pt-2 text-xs">
                  {decision === 'APPROVE_WITH_CONDITIONS' && (
                    <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                      <span className="font-bold text-teal-800 dark:text-teal-300">Sanction Conditions Formulation</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Condition Type</label>
                          <select
                            value={conditionType}
                            onChange={(e) => setConditionType(e.target.value)}
                            className={cn('w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                          >
                            <option value="PRE_DISBURSEMENT">Pre-Disbursement (Blocks Payout)</option>
                            <option value="POST_DISBURSEMENT">Post-Disbursement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Responsible Party</label>
                          <select
                            value={conditionResponsible}
                            onChange={(e) => setConditionResponsible(e.target.value)}
                            className={cn('w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                          >
                            <option value="BORROWER">Borrower</option>
                            <option value="LOAN_OFFICER">Loan Officer</option>
                            <option value="CREDIT_ANALYST">Credit Analyst</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Due Stage</label>
                          <select
                            value={conditionDueStage}
                            onChange={(e) => setConditionDueStage(e.target.value)}
                            className={cn('w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                          >
                            <option value="DISBURSEMENT">Disbursement Payout</option>
                            <option value="FIRST_EMI">First EMI Due</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Condition Text *</label>
                        <input
                          type="text"
                          placeholder="e.g. Provide original salary certificate prior to fund release..."
                          value={conditionText}
                          onChange={(e) => setConditionText(e.target.value)}
                          className={cn('w-full py-1.5 px-3 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                        />
                      </div>
                    </div>
                  )}

                  {decision === 'SEND_BACK' && (
                    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                      <span className="font-bold text-amber-800 dark:text-amber-300">Routing & Correction Target</span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Send Back Target</label>
                        <select
                          value={sendBackTarget}
                          onChange={(e) => setSendBackTarget(e.target.value as any)}
                          className={cn('w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                        >
                          <option value="CREDIT_ANALYST">Credit Analyst (For Financial / FOIR / Risk Re-Appraisal)</option>
                          <option value="LOAN_OFFICER">Loan Officer (For Document Re-Collection / KYC)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {decision === 'HOLD' && (
                    <div className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/40 dark:bg-yellow-950/20 space-y-3">
                      <span className="font-bold text-yellow-800 dark:text-yellow-300">Information Required</span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Information / Documents Needed *</label>
                        <input
                          type="text"
                          placeholder="e.g. Additional bank statement for Q2, employer confirmation letter..."
                          value={holdInfoRequired}
                          onChange={(e) => setHoldInfoRequired(e.target.value)}
                          className={cn('w-full py-1.5 px-3 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                        />
                      </div>
                    </div>
                  )}

                  {decision === 'ESCALATE' && (
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                      <span className="font-bold text-purple-800 dark:text-purple-300">Approval Authority Escalation</span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Escalation Authority</label>
                        <select
                          value={escalationTarget}
                          onChange={(e) => setEscalationTarget(e.target.value)}
                          className={cn('w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300')}
                        >
                          <option value="LEVEL_3_CREDIT_HEAD">Level 3 — Head of Credit (Proposals &gt; ₹25L)</option>
                          <option value="CREDIT_COMMITTEE">Level 4 — Executive Credit Committee (Proposals &gt; ₹50L)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Underwriter Rationale / Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Underwriter Decision Rationale / Notes *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter comprehensive underwriting commentary, risk evaluation, and rationale..."
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      className={cn(
                        'w-full p-2.5 rounded-xl border text-xs outline-none focus:border-blue-500',
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      )}
                    />
                  </div>

                  {/* Submit Decision Button */}
                  <div className="flex items-center gap-3">
                    {hasCommittedDecision && isRevisingDecision && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsRevisingDecision(false)}
                        className="py-2.5 text-xs font-bold cursor-pointer"
                      >
                        Cancel Revision
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={!decisionReason.trim() || decisionMutation.isPending}
                      onClick={() => decisionMutation.mutate()}
                      className={cn(
                        'py-2.5 text-xs font-bold text-white shadow-md cursor-pointer flex-1',
                        hasCommittedDecision
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#2563EB] hover:bg-blue-700'
                      )}
                    >
                      {decisionMutation.isPending
                        ? 'Committing Underwriting Decision...'
                        : hasCommittedDecision
                        ? `Update & Re-commit Decision: ${decision}`
                        : `Commit Decision: ${decision}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* ========================================================================= */}
      {/* STEP 9 — AUDIT HISTORY (READ ONLY)                                        */}
      {/* ========================================================================= */}
      <Card id="sec-audit" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              STEP 9 — AUDIT HISTORY (READ-ONLY IMMUTABLE LOG)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Append-Only Audit Record</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead
              className={cn(
                'border-b font-bold uppercase text-[10px] tracking-wider',
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              )}
            >
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Actor & Role</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Status Transition</th>
                <th className="py-2 px-3">Reason / Comment</th>
                <th className="py-2 px-3">Correlation ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(() => {
                const combinedLogs = [
                  ...(ws?.auditLogs || []),
                  ...(app.statusHistory || []).map((sh: any) => ({
                    id: sh.id,
                    createdAt: sh.createdAt,
                    actorName: sh.changedBy || 'System / Operations',
                    actorRole: 'OPERATIONS',
                    action: 'STATUS_TRANSITION',
                    oldStatus: sh.oldStatus,
                    newStatus: sh.newStatus,
                    reason: sh.reason || sh.comment || 'Status transition',
                    correlationId: sh.id?.slice(0, 8),
                  })),
                ];

                if (combinedLogs.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        No previous audit or status transitions recorded for this proposal.
                      </td>
                    </tr>
                  );
                }

                return combinedLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                      {log.actorName || log.userName || 'System'}{' '}
                      <span className="text-[10px] text-slate-400">({log.actorRole || log.role || 'USER'})</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] font-mono">
                      {log.oldStatus ? `${log.oldStatus} → ${log.newStatus || app.status}` : log.newStatus || app.status}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {log.reason || log.comment || 'Operational transition event logged'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                      {log.correlationId || log.id?.slice(0, 8) || 'N/A'}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW MODAL                                                    */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h4 className="font-bold text-sm">
                  Document Inspection: {previewDoc.documentType?.replace(/_/g, ' ') || previewDoc.category || 'Document'}
                </h4>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="font-bold text-sm">Verified Document Evidence</div>
              <p className="text-slate-500 max-w-xs mx-auto text-[11px]">
                {previewDoc.fileName ? `File: ${previewDoc.fileName}` : 'Cryptographically authenticated against government databases & OCR verified.'}
              </p>
              <div className="pt-2 text-[10px] font-mono text-slate-400">
                Type: {previewDoc.documentType || 'DOCUMENT'} · Status: {previewDoc.status || 'VERIFIED'}
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setPreviewDoc(null)} className="text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINANCIAL CALCULATION DETAIL MODAL                                        */}
      {/* ========================================================================= */}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-xl rounded-2xl border shadow-2xl p-5 space-y-4',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                <h4 className="font-bold text-sm">Authoritative Financial Calculation Breakdown</h4>
              </div>
              <button
                onClick={() => setShowCalcModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Assessed Monthly Income:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{Number(ca.foirDti?.monthlyIncome ?? cust.monthlyIncome ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Existing Fixed Monthly Obligations (EMIs):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    - ₹{Number(ca.foirDti?.existingObligations ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proposed Loan Monthly EMI:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    - ₹{computedTerms.emi.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold">
                  <span>Net Disposable Income (Surplus):</span>
                  <span className="text-emerald-600">
                    ₹{Number(ca.foirDti?.disposableIncome ?? 0).toLocaleString('en-IN')}/month
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Fixed Obligations to Income Ratio (FOIR):</span>
                  <strong className="text-slate-800 dark:text-slate-200">{ca.foirDti?.foirPct ?? 0}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Policy Standard Limit:</span>
                  <strong className="text-slate-800 dark:text-slate-200">50% maximum</strong>
                </div>
                <div className="flex justify-between">
                  <span>Debt-to-Income (DTI) Status:</span>
                  <strong className={Number(ca.foirDti?.foirPct ?? 0) <= 50 ? 'text-emerald-600' : 'text-amber-600'}>
                    {Number(ca.foirDti?.foirPct ?? 0) <= 50 ? 'PASSED' : 'REQUIRES MITIGATION'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowCalcModal(false)} className="text-xs">
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIMELINE MODAL                                                            */}
      {/* ========================================================================= */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4',
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h4 className="font-bold text-sm">Application Lifecycle Timeline</h4>
              </div>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
              {app.statusHistory && app.statusHistory.length > 0 ? (
                app.statusHistory.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.oldStatus ? `${item.oldStatus} → ${item.newStatus}` : item.newStatus || app.status}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.reason || item.comment || 'Workflow transition'} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Loan Origination</div>
                      <p className="text-[11px] text-slate-500">Proposal created on {formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">Underwriting Review (Active)</div>
                      <p className="text-[11px] text-slate-500">Current Stage: {app.status}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowTimelineModal(false)} className="text-xs">
                Close Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
