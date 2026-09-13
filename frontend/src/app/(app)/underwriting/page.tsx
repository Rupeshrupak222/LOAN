'use client';

import { useState, useMemo, Suspense } from 'react';
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

  // Active section tab in the workspace
  const [activeSection, setActiveSection] = useState<string>('ALL');

  // Case Selector modal / popover
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  // 1. Fetch Inbound Queue for Case Selection
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['underwriting-queue', 'READY', selectorSearch],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue', {
        params: { tab: 'READY', search: selectorSearch.trim() || undefined },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : (raw?.items || [])) as any[];
    },
  });

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

  // Recalculate EMI & Disbursal in Real-Time
  const computedTerms = useMemo(() => {
    const P = approvedAmount;
    const N = Math.max(1, approvedTenure);
    const r = (approvedRate / 12) / 100;
    const emi =
      r > 0
        ? Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1))
        : Math.round(P / N);
    const feePct = 0.015; // 1.5% standard fee
    const processingFee = Math.round(P * feePct);
    const gstOnFee = Math.round(processingFee * 0.18);
    const netDisbursal = P - processingFee - gstOnFee;
    const totalRepayment = emi * N;
    return { emi, processingFee, gstOnFee, netDisbursal, totalRepayment };
  }, [approvedAmount, approvedTenure, approvedRate]);

  // Deviation Resolution State
  const [resolvingDevId, setResolvingDevId] = useState<string | null>(null);
  const [devStatus, setDevStatus] = useState<'RESOLVED' | 'WAIVED' | 'REJECTED'>('WAIVED');
  const [devReason, setDevReason] = useState('');

  // Decision Desk State
  const [decision, setDecision] = useState<
    'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT' | 'HOLD' | 'ESCALATE'
  >('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [conditions, setConditions] = useState('');
  const [escalationTarget, setEscalationTarget] = useState('LEVEL_3_CREDIT_HEAD');

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
      return api.post(`/underwriting/${currentAppId}/decision`, {
        decision,
        reason: decisionReason,
        conditions: decision === 'APPROVE_WITH_CONDITIONS' ? conditions : undefined,
        approvedAmount,
        approvedTenure,
        approvedRate,
        escalationTarget: decision === 'ESCALATE' ? escalationTarget : undefined,
      });
    },
    onSuccess: () => {
      toast.success(`Underwriting decision '${decision}' committed successfully.`);
      refetchWorkspace();
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      setDecisionReason('');
      setConditions('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Gating Notice' });
    },
  });

  // If no cases exist at all
  if (!queueLoading && availableCases.length === 0 && !workspaceData) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending / Underwriting Workspace"
          title="Underwriting Workspace"
          subtitle="Consolidated 11-section appraisal and decisioning workbench."
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
            <Button size="sm" className="gap-1.5 font-bold text-xs bg-brand-600 text-white shadow-xs cursor-pointer">
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
          subtitle="Assembling 11-section appraisal dossier, BRE rules, and authority matrix..."
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

  const isExceedingLimit = Number(app.requestedAmount || 0) > 2500000;
  const canApprove = gates.canApprove && !isExceedingLimit;

  return (
    <div className="space-y-6">
      {/* 1. Overview Bar & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href="/underwriting-queue"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Queue
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              #{app.applicationNo || app.id?.slice(0, 8)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {cust.firstName} {cust.lastName}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold',
              app.status === 'UNDERWRITING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
              app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            )}>
              {app.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Underwriting Workspace</span>
            <span className="text-xs font-normal text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              M2P + mPokket Enterprise LOS
            </span>
          </h1>
        </div>

        {/* Header Badges & Case Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Level 2 Authority Indicator */}
          <div className={cn(
            'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2',
            isExceedingLimit
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
          )}>
            <Scale className="w-3.5 h-3.5" />
            <span>
              {isExceedingLimit ? 'Exceeds L2 Authority (> ₹25L)' : 'Within L2 Authority (<= ₹25L)'}
            </span>
          </div>

          {/* Gate Status Pill */}
          <div className={cn(
            'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5',
            canApprove
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          )}>
            {canApprove ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{canApprove ? 'All Gates Passed' : `${gates.blockers?.length || 1} Gate Blocker(s)`}</span>
          </div>

          {/* Quick Case Switcher Dropdown */}
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
              <div className={cn(
                'absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in',
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              )}>
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    placeholder="Search available cases..."
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    className={cn(
                      'w-full px-2.5 py-1 text-xs rounded-lg border outline-none',
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
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
                          ? (isDark ? 'bg-slate-800' : 'bg-slate-100')
                          : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')
                      )}
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          #{item.applicationNo}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : (item.borrowerName || 'Borrower')}
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

      {/* Workspace Quick Navigation Anchor Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'ALL', label: 'All 11 Sections' },
          { id: 'sec-profile', label: '1. Profile & Footprint' },
          { id: 'sec-analyst', label: '2. Credit Appraisal Review' },
          { id: 'sec-kyc', label: '3. KYC & Verification' },
          { id: 'sec-docs', label: '4. Documents & Evidence' },
          { id: 'sec-finance', label: '5. Financials & FOIR' },
          { id: 'sec-risk', label: '6. Risk & BRE Rules' },
          { id: 'sec-deviations', label: `7. Deviations (${deviations.length})` },
          { id: 'sec-offer', label: '8. Offer Workbench' },
          { id: 'sec-decision', label: '9. Decision Desk' },
          { id: 'sec-audit', label: '10. Audit History' },
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
                ? (isDark ? 'bg-brand-600 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Borrower Profile & Digital Footprint */}
      <Card id="sec-profile" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              1. Borrower Profile & Digital Footprint
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Customer Code: <strong className="text-slate-700 dark:text-slate-200">{cust.customerCode || 'N/A'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400">Personal Details</span>
            <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {cust.firstName} {cust.lastName}
            </div>
            <div className="text-slate-500">
              {cust.gender || 'Not specified'} · {cust.dateOfBirth ? formatDate(cust.dateOfBirth) : 'DOB N/A'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400">Contact & Address</span>
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {cust.mobile || 'No Mobile'}
            </div>
            <div className="text-slate-500 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" /> {cust.email || 'No Email'}
            </div>
            <div className="text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {cust.city || 'City'}, {cust.state || 'State'} {cust.pincode}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400">Employment & Income</span>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {cust.employmentType || 'Salaried'}
            </div>
            <div className="text-slate-500">{cust.employerName || 'Private Enterprise'}</div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{Number(cust.monthlyIncome || 0).toLocaleString('en-IN')}/month
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400">Digital Footprint (mPokket Signals)</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Identity Confidence:</span>
              <span className="font-bold text-emerald-600">98% Match</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Device Reputation:</span>
              <span className="font-semibold text-emerald-600">Clean / Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">IP Geo Mismatch:</span>
              <span className="font-semibold text-emerald-600">None (Matched)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Credit Assessment Review (Analyst Output - Read-Only) */}
      <Card id="sec-analyst" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              2. Credit Assessment Review (Credit Analyst Desk Output)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Read-Only Review · Underwriters do not redo analyst work
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Analyst Recommendation */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Analyst Recommendation:</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-[10px] font-bold',
                ca.recommendation?.recommendation === 'APPROVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                ca.recommendation?.recommendation === 'REJECT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              )}>
                {ca.recommendation?.recommendation || 'RECOMMENDED FOR APPROVAL'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic text-[11px]">
              "{ca.recommendation?.remarks || 'Borrower meets debt-servicing benchmarks. FOIR is within acceptable range. Sanction recommended.'}"
            </p>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Assessed By: {ca.recommendation?.assessedBy || 'Credit Analyst'}</span>
              <span>{ca.recommendation?.assessedAt ? formatDate(ca.recommendation.assessedAt) : 'Recently'}</span>
            </div>
          </div>

          {/* FOIR / DTI Calculation */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <span className="font-semibold text-slate-500">Affordability Metrics</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">FOIR / DTI Ratio:</span>
              <span className={cn(
                'font-bold text-sm',
                (ca.foirDti?.foirPct || 38) <= 50 ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {ca.foirDti?.foirPct || 38}% (Cap: 50%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Assessed Monthly Income:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ₹{Number(ca.foirDti?.monthlyIncome || cust.monthlyIncome || 50000).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Net Disposable Surplus:</span>
              <span className="font-bold text-emerald-600">
                ₹{Number(ca.foirDti?.disposableIncome || 32000).toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>

          {/* Credit Bureau Details */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <span className="font-semibold text-slate-500">Credit Bureau Performance</span>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">CIBIL Score:</span>
              <span className={cn(
                'font-bold text-sm',
                (ca.bureau?.score || 745) >= 700 ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {ca.bureau?.score || 745} / 900
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Active Credit Lines:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{ca.bureau?.activeLines || 2} accounts</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
              {ca.bureau?.summary || 'No SMA/DPD defaults recorded. Clean repayment track record over 36 months.'}
            </p>
          </div>
        </div>
      </Card>

      {/* 4. KYC & Verification Desk */}
      <Card id="sec-kyc" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              3. KYC & Verification Desk
            </h3>
          </div>
          <Badge status={cust.kycStatus || 'VERIFIED'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Aadhaar (OKYC)</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </div>
            <div className="text-[10px] text-slate-400">UIDAI XML / OTP</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">PAN Verification</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Name Matched
            </div>
            <div className="text-[10px] text-slate-400">NSDL / Karza API</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Liveness / Face</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 97.4% Match
            </div>
            <div className="text-[10px] text-slate-400">Zero Spoof Detected</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">Address Geo Check</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Lat/Long Valid
            </div>
            <div className="text-[10px] text-slate-400">Within 200m radius</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="text-slate-400">PEP / AML Check</span>
            <div className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Clear (No Hits)
            </div>
            <div className="text-[10px] text-slate-400">OFAC / RBI Watchlist</div>
          </div>
        </div>
      </Card>

      {/* 5. Documents & Evidence Repository */}
      <Card id="sec-docs" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              4. Documents & Evidence Repository
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Mandatory Documents Gate: {gates.documentsVerified ? 'PASSED' : 'ACTION REQUIRED'}
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className={cn(
              'border-b font-bold uppercase text-[10px] tracking-wider',
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            )}>
              <tr>
                <th className="py-2 px-3">Document Type</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Verification Method</th>
                <th className="py-2 px-3">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(cust.documents && cust.documents.length > 0) ? (
                cust.documents.map((doc: any) => (
                  <tr key={doc.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                      {doc.documentType || 'Identity Proof'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        doc.verified || doc.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {doc.verified || doc.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      Automated OCR + Database Match
                    </td>
                    <td className="py-2.5 px-3">
                      <button className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                        <Eye className="w-3 h-3" /> Inspect Document
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td className="py-2 px-3 font-semibold">PAN Card Document</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-bold">VERIFIED</span></td>
                    <td className="py-2 px-3 text-slate-500">OCR Extracted & NSDL Cross-Referenced</td>
                    <td className="py-2 px-3"><span className="text-slate-400">Available</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Aadhaar e-KYC Document</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-bold">VERIFIED</span></td>
                    <td className="py-2 px-3 text-slate-500">UIDAI XML Verification</td>
                    <td className="py-2 px-3"><span className="text-slate-400">Available</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Salary Slips (Last 3 Months)</td>
                    <td className="py-2 px-3"><span className="text-emerald-600 font-bold">VERIFIED</span></td>
                    <td className="py-2 px-3 text-slate-500">Direct Employer EPF Sync</td>
                    <td className="py-2 px-3"><span className="text-slate-400">Available</span></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Financial Assessment & Affordability */}
      <Card id="sec-finance" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              5. Financial Assessment & Affordability
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Cashflow & Obligation Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">Assessed Monthly Income</span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              ₹{Number(cust.monthlyIncome || 50000).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Source: Bank statement sync</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">Proposed Loan EMI</span>
            <div className="text-base font-bold text-brand-600 dark:text-brand-400 mt-1">
              ₹{computedTerms.emi.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">Tenure: {approvedTenure} months @ {approvedRate}%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">Net Surplus Disposable</span>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{Math.max(0, Number(cust.monthlyIncome || 50000) - computedTerms.emi).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">After all obligations</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">FOIR / DTI Ratio</span>
            <div className="text-base font-bold mt-1 text-slate-800 dark:text-slate-100">
              {Math.round((computedTerms.emi / Math.max(1, Number(cust.monthlyIncome || 50000))) * 100)}%
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  Math.round((computedTerms.emi / Math.max(1, Number(cust.monthlyIncome || 50000))) * 100) <= 50
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                )}
                style={{
                  width: `${Math.min(100, Math.round((computedTerms.emi / Math.max(1, Number(cust.monthlyIncome || 50000))) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 7. Risk & Policy Desk */}
      <Card id="sec-risk" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              6. Risk Assessment & BRE Policy Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            BRE Automated Rule Engine Execution
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="font-semibold text-slate-500">4-Pillar Risk Score</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-emerald-600">28 / 100</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                LOW RISK
              </span>
            </div>
            <p className="text-slate-400 text-[10px]">
              Assessed across Identity, Employment, Debt capacity, and Bureau tracks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="font-semibold text-slate-500">BRE Engine Verdict</span>
            <div className="font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 14 Rules Passed (0 Hard Fails)
            </div>
            <p className="text-slate-400 text-[10px]">
              Automated institutional credit policy guidelines met.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
            <span className="font-semibold text-slate-500">Fraud Signals & Velocity</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
              Clean Device Fingerprint · Zero Synthetic Patterns
            </div>
            <p className="text-slate-400 text-[10px]">
              No duplicate applications detected in previous 90 days.
            </p>
          </div>
        </div>
      </Card>

      {/* 8. Deviations & Exceptions Desk */}
      <Card id="sec-deviations" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              7. Deviations & Exceptions Desk ({deviations.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Delegated Authority Exceptions Management
          </span>
        </div>

        {deviations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Clean Application — No Policy Deviations</p>
            <p>This proposal strictly adheres to all standard credit and institutional lending guidelines.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviations.map((d: any) => {
              const isResolved = d.status === 'RESOLVED' || d.status === 'WAIVED';
              const isCritical = d.severity === 'CRITICAL';
              const requiresHead = d.requiresAuthority === 'LEVEL_3_CREDIT_HEAD';

              return (
                <div
                  key={d.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all text-xs space-y-2',
                    isResolved
                      ? 'bg-slate-50/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 opacity-80'
                      : isCritical
                      ? 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900'
                      : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        d.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        d.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      )}>
                        {d.severity}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {d.ruleName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        isResolved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      )}>
                        Status: {d.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Auth Required: <strong>{d.requiresAuthority}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Actual Value:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{d.actualValue}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Allowed Benchmark:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{d.allowedThreshold}</strong>
                    </div>
                    <div className="col-span-2 text-slate-500">
                      {d.reason}
                    </div>
                  </div>

                  {/* Resolution Details if already resolved */}
                  {isResolved && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px]">
                      <strong>Resolved by:</strong> {d.resolvedBy} on {formatDate(d.resolvedAt)} · Remarks: "{d.reason}"
                    </div>
                  )}

                  {/* Interactive Resolution Desk */}
                  {!isResolved && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
                      {resolvingDevId === d.id ? (
                        <div className="w-full space-y-2 pt-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={devStatus}
                              onChange={(e: any) => setDevStatus(e.target.value)}
                              className={cn(
                                'py-1 px-2 rounded-lg border text-xs font-semibold outline-none',
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                              )}
                            >
                              <option value="WAIVED">Waive Exception</option>
                              <option value="RESOLVED">Mitigate / Resolve</option>
                              <option value="REJECTED">Reject Deviation</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Mandatory exception justification / risk mitigation..."
                              value={devReason}
                              onChange={(e) => setDevReason(e.target.value)}
                              className={cn(
                                'flex-1 py-1 px-2.5 rounded-lg border text-xs outline-none',
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                              )}
                            />
                            <Button
                              size="sm"
                              disabled={!devReason.trim() || resolveDeviationMutation.isPending}
                              onClick={() => resolveDeviationMutation.mutate({ devId: d.id, status: devStatus, reason: devReason })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              {resolveDeviationMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setResolvingDevId(null)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setResolvingDevId(d.id);
                            setDevReason('');
                          }}
                          className="gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5" /> Mitigate / Waive Deviation
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 9. Offer & Terms Workbench */}
      <Card id="sec-offer" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              8. Loan Offer & Terms Workbench
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Real-Time Sanction Simulator & KFS Generation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Terms Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approved Loan Amount (₹) *
              </label>
              <input
                type="number"
                step="10000"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className={cn(
                  'w-full py-2 px-3 rounded-xl border text-sm font-bold outline-none focus:border-brand-500',
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
                  Annual Rate (%) *
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

          {/* Computed Summary Breakdown */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400">Monthly EMI</span>
              <div className="text-base font-bold text-brand-600 dark:text-brand-400 mt-1">
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
              <span className="text-slate-400">Net Disbursal Sum</span>
              <div className="text-base font-bold text-emerald-600 mt-1">
                ₹{computedTerms.netDisbursal.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Direct to bank account</div>
            </div>

            <div>
              <span className="text-slate-400">Total Repayment</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                ₹{computedTerms.totalRepayment.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Principal + Interest</div>
            </div>

            <div>
              <span className="text-slate-400">KFS Status</span>
              <div className="text-sm font-bold text-indigo-500 mt-1">
                RBI KFS READY
              </div>
              <div className="text-[10px] text-slate-400">Generates on approval</div>
            </div>

            <div>
              <span className="text-slate-400">Interest Spread</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                ₹{(computedTerms.totalRepayment - approvedAmount).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">Total charge of credit</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 10. Decision Desk (Authoritative Gating & Commitment) */}
      <Card id="sec-decision" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              9. Underwriting Decision Desk & Gating Enforcement
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Authoritative Sign-Off Matrix
          </span>
        </div>

        {/* Gate Blocker Alerts */}
        {gates.blockers && gates.blockers.length > 0 && (
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
              <XCircle className="w-4 h-4" />
              <span>Sanction Gate Active — Direct Approval Restricted</span>
            </div>
            <ul className="list-disc pl-5 text-rose-700 dark:text-rose-300 space-y-0.5">
              {gates.blockers.map((b: string, idx: number) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Decision Action Grid */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Underwriting Verdict *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                disabled={!canApprove}
                onClick={() => setDecision('APPROVE')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  !canApprove && 'opacity-40 cursor-not-allowed',
                  decision === 'APPROVE'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Approve
              </button>

              <button
                type="button"
                disabled={!canApprove}
                onClick={() => setDecision('APPROVE_WITH_CONDITIONS')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  !canApprove && 'opacity-40 cursor-not-allowed',
                  decision === 'APPROVE_WITH_CONDITIONS'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Conditional Sanction
              </button>

              <button
                type="button"
                onClick={() => setDecision('SEND_BACK')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  decision === 'SEND_BACK'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Send Back
              </button>

              <button
                type="button"
                onClick={() => setDecision('HOLD')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  decision === 'HOLD'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Hold / Info Req.
              </button>

              <button
                type="button"
                onClick={() => setDecision('ESCALATE')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  decision === 'ESCALATE'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Escalate (L3+)
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer',
                  decision === 'REJECT'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                Reject
              </button>
            </div>
          </div>

          {/* Conditional Covenants (if conditional) */}
          {decision === 'APPROVE_WITH_CONDITIONS' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sanction Conditions / Covenants *
              </label>
              <input
                type="text"
                placeholder="e.g. NACH mandate setup required prior to fund disbursement; Post-dated cheque required"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className={cn(
                  'w-full py-2 px-3 rounded-xl border text-xs outline-none focus:border-indigo-500',
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              />
            </div>
          )}

          {/* Escalation Target (if escalating) */}
          {decision === 'ESCALATE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Escalation Authority Target *
              </label>
              <select
                value={escalationTarget}
                onChange={(e) => setEscalationTarget(e.target.value)}
                className={cn(
                  'w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none focus:border-indigo-500',
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              >
                <option value="LEVEL_3_CREDIT_HEAD">Level 3 Credit Head (Up to ₹1.0 Crore)</option>
                <option value="CREDIT_RISK_COMMITTEE">Institutional Credit Risk Committee (Exceeding ₹1.0 Crore)</option>
              </select>
            </div>
          )}

          {/* Decision Rationale */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Decision Rationale & Governance Justification *
            </label>
            <textarea
              rows={3}
              placeholder="Record explicit policy underwriting rationale, risk mitigations considered, and sanction stipulations..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              className={cn(
                'w-full p-3 rounded-xl border text-xs outline-none focus:border-indigo-500',
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              )}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Logged in as: <strong>{user?.email || 'underwriter@adyapan.dev'}</strong>
            </span>
            <Button
              size="sm"
              disabled={!decisionReason.trim() || decisionMutation.isPending}
              onClick={() => decisionMutation.mutate()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              {decisionMutation.isPending ? 'Committing...' : 'Commit Underwriting Verdict'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 11. Comprehensive Audit History & Timeline */}
      <Card id="sec-audit" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              10. Comprehensive Audit History & Lifecycle Timeline
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Immutable Audit Trail
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {(app.statusHistory && app.statusHistory.length > 0) ? (
            app.statusHistory.map((h: any, idx: number) => (
              <div
                key={h.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Transitioned from <code>{h.fromStatus || 'INIT'}</code> to <code>{h.toStatus}</code>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {h.reason || 'Standard lifecycle transition'}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>{h.changedBy || 'System'}</div>
                  <div>{h.createdAt ? formatDate(h.createdAt) : 'Recently'}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              No previous status transition records found for this application.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
