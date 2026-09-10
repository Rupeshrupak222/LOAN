'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
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
  Search,
  Percent,
  TrendingUp,
  User,
  Send,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { CreditAssessmentWorkspace } from '@/components/CreditAssessmentWorkspace';

type TabKey = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'KYC_PENDING';

export default function UnderwritingAndCreditAssessmentPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // Role permissions
  const isCreditAnalyst = user?.roles?.includes('CREDIT_ANALYST');
  const isUnderwriter = user?.roles?.some((r: string) => ['UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r));

  // Quick Underwriting Decision Modal State (Underwriters only)
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'SEND_BACK' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [conditions, setConditions] = useState('');

  // 1. Fetch Real Database Dashboard Metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['credit-assessment-dashboard'],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/dashboard');
      return res.data?.data;
    },
  });

  // 2. Fetch Real Queue Data
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['credit-assessment-queue', activeTab, searchQuery],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/queue', {
        params: {
          tab: activeTab,
          search: searchQuery.trim() || undefined,
        },
      });
      const raw = res.data?.data;
      return (Array.isArray(raw) ? raw : (raw?.items || [])) as any[];
    },
  });

  // Underwriter Decision Mutation
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
      toast.success(`Underwriting decision '${decision}' recorded successfully.`);
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['credit-assessment-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      setSelectedApp(null);
      setReason('');
      setConditions('');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Underwriting Decision Notice' });
    },
  });

  const m = metricsData || {};
  const pendingCount = m.pendingAssessment ?? 0;
  const inProgressCount = m.inAssessment ?? m.inProgress ?? 0;
  const kycPendingCount = m.kycPending ?? 0;
  const completedCount = m.completedProposals ?? m.completedAssessment ?? 0;
  const readyCount = m.readyForUnderwriter ?? 0;
  const totalVolume = m.totalVolume ?? m.financials?.totalRequestedAmount ?? 0;
  const avgTicket = m.avgTicketSize ?? m.financials?.averageRequestedAmount ?? 0;
  const lowRiskCount = m.riskBreakdown?.LOW ?? m.riskDistribution?.lowRisk ?? 0;
  const mediumRiskCount = m.riskBreakdown?.MEDIUM ?? m.riskDistribution?.mediumRisk ?? 0;
  const highRiskCount =
    (m.riskBreakdown?.HIGH ?? m.riskDistribution?.highRisk ?? 0) + (m.riskBreakdown?.VERY_HIGH ?? 0);

  const queueItems = Array.isArray(queueData) ? queueData : [];

  // IF AN APPLICATION IS ACTIVELY BEING APPRAISED IN THE WORKSPACE
  if (activeAppId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setActiveAppId(null);
                queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
                queryClient.invalidateQueries({ queryKey: ['credit-assessment-dashboard'] });
              }}
              className="gap-1.5 font-semibold text-xs cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment Queue
            </Button>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Credit Assessment & Testing Lab
              </h2>
              <p className="text-xs text-slate-400">
                Execute policy rules, stress-test debt capacity, evaluate 4-pillar risk, and save credit recommendation
              </p>
            </div>
          </div>
        </div>

        <CreditAssessmentWorkspace
          applicationId={activeAppId}
          onForwardSuccess={() => {
            setActiveAppId(null);
            queryClient.invalidateQueries({ queryKey: ['credit-assessment-queue'] });
            queryClient.invalidateQueries({ queryKey: ['credit-assessment-dashboard'] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={isCreditAnalyst ? 'Lending / Credit Assessment Desk' : 'Lending / Underwriting & Credit Desk'}
        title={isCreditAnalyst ? 'Credit Assessment Desk' : 'Credit Assessment & Underwriting Desk'}
        subtitle={
          isCreditAnalyst
            ? 'Review inbound loan proposals, verify KYC compliance, calculate FOIR/DTI, appraise risk pillars, and record credit recommendations'
            : 'Evaluate credit appraised proposals, assess risk mitigations, and execute final sanction decisions'
        }
      />

      {/* KPI Overview Cards - Real Database Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Pending Assessment"
          value={String(pendingCount)}
          hint="Awaiting initial appraisal"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="In Progress"
          value={String(inProgressCount)}
          hint="Active credit reviews"
          icon={<Layers className="h-4 w-4 text-blue-500" />}
        />
        <KpiCard
          label="KYC Incomplete"
          value={String(kycPendingCount)}
          hint="Pending KYC verification"
          icon={<UserCheck className="h-4 w-4 text-rose-500" />}
        />
        <KpiCard
          label="Proposals Assessed"
          value={String(completedCount)}
          hint="Recommendation recorded"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <KpiCard
          label="Ready for Underwriter"
          value={String(readyCount)}
          hint="All gates passed"
          icon={<Send className="h-4 w-4 text-indigo-500" />}
        />
        <KpiCard
          label="Proposal Pipeline"
          value={formatMoney(totalVolume)}
          hint={`Avg ₹${Math.round(avgTicket).toLocaleString('en-IN')}`}
          icon={<Calculator className="h-4 w-4 text-cyan-500" />}
        />
      </div>

      {/* Risk Profile Distribution Bar */}
      <div className={cn(
        'p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs',
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Portfolio Risk Distribution:</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Low Risk:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{lowRiskCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-500">Medium Risk:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{mediumRiskCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-500">High Risk:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{highRiskCount}</span>
          </div>
        </div>
      </div>

      {/* Main Queue Card */}
      <Card noPadding className="p-5 space-y-4">
        {/* Search and Tabs Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search proposal #, borrower, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border font-medium outline-none transition-colors',
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-brand-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-brand-500'
                )}
              />
            </div>
          </div>

          {/* Workflow Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                activeTab === 'ALL'
                  ? (isDark ? 'bg-brand-600 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              All Proposals ({queueItems.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'PENDING'
                  ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('IN_PROGRESS')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                activeTab === 'IN_PROGRESS'
                  ? (isDark ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('KYC_PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                activeTab === 'KYC_PENDING'
                  ? (isDark ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs')
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              KYC Incomplete
            </button>
          </div>
        </div>

        {/* Table */}
        {queueLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : queueItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={cn(
                  'border-b text-[11px] font-bold uppercase tracking-wider',
                  isDark ? 'border-slate-800 bg-slate-900/80 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Product & Amount</th>
                  <th className="py-2.5 px-3">KYC Status</th>
                  <th className="py-2.5 px-3">FOIR / DTI</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Credit Status</th>
                  <th className="py-2.5 px-3">Underwriter Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {queueItems.map((item: any) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors',
                      isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/70'
                    )}
                  >
                    {/* Application # */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setActiveAppId(item.id)}
                        className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer text-left"
                      >
                        #{item.applicationNo}
                      </button>
                      <div className="text-[10px] text-slate-400">
                        {item.applicationAgeDays === 0 ? 'Today' : `${item.applicationAgeDays}d ago`}
                      </div>
                    </td>

                    {/* Borrower */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.borrowerName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.customerCode} · {item.mobile || 'No Mobile'}
                      </div>
                    </td>

                    {/* Product & Amount */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {formatMoney(item.requestedAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.loanProduct} · {item.tenureMonths}M
                      </div>
                    </td>

                    {/* KYC */}
                    <td className="py-3 px-3">
                      <Badge status={item.kycStatus} />
                    </td>

                    {/* FOIR */}
                    <td className="py-3 px-3">
                      {item.foir !== null ? (
                        <span className={cn(
                          'font-bold',
                          item.foir <= 50 ? 'text-emerald-600' : item.foir <= 65 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {item.foir}%
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Risk Tier */}
                    <td className="py-3 px-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        item.riskGrade === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.riskGrade === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        item.riskGrade === 'HIGH' || item.riskGrade === 'VERY_HIGH' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}>
                        {item.riskGrade}
                      </span>
                    </td>

                    {/* Credit Assessment Status */}
                    <td className="py-3 px-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        item.creditAnalysisStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.creditAnalysisStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        item.creditAnalysisStatus === 'SENT_BACK' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {item.creditAnalysisStatus}
                      </span>
                    </td>

                    {/* Underwriter Status */}
                    <td className="py-3 px-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        item.underwriterStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.underwriterStatus === 'PENDING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                        item.underwriterStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      )}>
                        {item.underwriterStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setActiveAppId(item.id)}
                          className="gap-1.5 font-semibold text-xs bg-brand-600 text-white hover:bg-brand-700 shadow-xs cursor-pointer"
                        >
                          Start Credit Appraisal <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No loan proposals found in this assessment queue.
            </p>
            <p className="text-xs text-slate-400">
              Inbound proposals submitted by Loan Officers will automatically appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
