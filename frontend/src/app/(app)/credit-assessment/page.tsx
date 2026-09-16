'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Calculator,
  Search,
  Users,
  FileText,
  Filter,
  UserCheck,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { CreditAssessmentWorkspace } from '@/components/CreditAssessmentWorkspace';

type TabKey =
  | 'ALL'
  | 'PENDING_VERIFICATION'
  | 'PENDING_FINANCIAL'
  | 'PENDING_CREDIT'
  | 'ELIGIBLE'
  | 'FURTHER_REVIEW'
  | 'NOT_ELIGIBLE'
  | 'COMPLETED';

function CreditAssessmentQueueContent() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedAppId = searchParams.get('applicationId');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const isCreditAllowed = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'BRANCH_MANAGER'].includes(r)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['credit-queue', activeTab],
    enabled: Boolean(isCreditAllowed) && !selectedAppId,
    queryFn: async () => {
      const res = await api.get('/credit/queue', { params: { tab: activeTab } });
      return res.data?.data;
    },
    refetchInterval: 5000,
  });

  if (!isCreditAllowed) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Access Restricted
        </p>
        <p className="text-xs text-slate-400">
          Credit assessment workspace is restricted to Credit Analysts and Reviewing Authorities.
        </p>
      </Card>
    );
  }

  // If an application is selected, render the dedicated assessment workspace
  if (selectedAppId) {
    return (
      <CreditAssessmentWorkspace
        applicationId={selectedAppId}
        onBack={() => router.push('/credit-assessment')}
        onForwardSuccess={() => router.push('/credit-assessment')}
      />
    );
  }

  if (isLoading) return <TableSkeleton rows={6} cols={8} />;

  const items = Array.isArray(data?.items) ? data.items : [];
  const metrics = data?.metrics || {
    applicationsAssigned: items.length,
    pendingVerification: 0,
    pendingKyc: 0,
    pendingDocs: 0,
    pendingFinancial: 0,
    pendingCredit: 0,
    furtherReview: 0,
    eligibleApplications: 0,
    notEligibleApplications: 0,
    completedApplications: 0,
  };

  const filteredItems = items.filter((app: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const appNo = (app.applicationNo || '').toLowerCase();
    const name = `${app.customer?.firstName || ''} ${app.customer?.lastName || ''}`.toLowerCase();
    const code = (app.customer?.customerCode || '').toLowerCase();
    const product = (app.product?.name || '').toLowerCase();
    return appNo.includes(term) || name.includes(term) || code.includes(term) || product.includes(term);
  });

  // Determines current workflow checkpoint for each application (6-step flow)
  const getAppWorkflowStage = (app: any) => {
    // 1. Completed / Sanctioned / Disbursed
    if (['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status)) {
      if (app.status === 'DISBURSED') {
        return { label: 'Disbursed', color: 'emerald', step: 6, actionText: 'View Dossier' };
      }
      if (app.status === 'READY_FOR_DISBURSEMENT') {
        return { label: 'Ready for Payout', color: 'blue', step: 6, actionText: 'View Dossier' };
      }
      if (app.status === 'AGREEMENT_PENDING') {
        return { label: 'Agreement Signing', color: 'indigo', step: 6, actionText: 'View Dossier' };
      }
      return { label: 'Approved by Underwriter', color: 'emerald', step: 6, actionText: 'View Dossier' };
    }

    // 2. Sent Back or Clarifications
    if (
      app.eligibility?.result === 'FURTHER_REVIEW' ||
      (app.eligibility?.result as string) === 'REQUEST_ADDITIONAL_DOCS' ||
      app.underwriting?.decision === 'SEND_BACK'
    ) {
      return { label: 'Further Review (Send Back)', color: 'amber', step: 5, actionText: 'Review Corrections' };
    }

    // 3. Not Eligible / Declined
    if (app.eligibility?.result === 'NOT_ELIGIBLE' || (app.eligibility?.factors as any)?.decision === 'NOT_ELIGIBLE' || app.status === 'REJECTED') {
      return { label: 'Not Eligible / Declined', color: 'rose', step: 5, actionText: 'View Assessment' };
    }

    // 4. Ready for Underwriting (Passed Financials and Risk Score)
    if (
      app.status === 'UNDERWRITING' ||
      (app.eligibility?.result === 'ELIGIBLE' && app.riskAssessment?.score != null) ||
      (app.eligibility?.factors as any)?.decision === 'ELIGIBLE'
    ) {
      return { label: 'Ready for Underwriter', color: 'emerald', step: 6, actionText: 'Forward to Underwriter' };
    }

    // 5. Verification Check (KYC and Documents)
    const allDocs = [...(app.customer?.documents || []), ...(app.documents || [])];
    const hasUnverifiedDocs = allDocs.some((d: any) => !d.verified && d.status !== 'VERIFIED');
    if (app.customer?.kycStatus !== 'VERIFIED') {
      return { label: 'Step 2: KYC Pending', color: 'amber', step: 2, actionText: 'Verify KYC' };
    }
    if (allDocs.length === 0 || hasUnverifiedDocs) {
      return { label: 'Step 2: Docs Pending', color: 'amber', step: 2, actionText: 'Verify Documents' };
    }

    // 6. Financial Check Pending
    if (!app.eligibility) {
      return { label: 'Step 3: Financial Check', color: 'blue', step: 3, actionText: 'Evaluate Financials' };
    }

    // 7. Risk Scoring Pending
    if (!app.riskAssessment || app.riskAssessment?.score == null) {
      return { label: 'Step 4: Risk Scoring', color: 'blue', step: 4, actionText: 'Assess Risk' };
    }

    return { label: 'Step 5: Decision Pending', color: 'purple', step: 5, actionText: 'Submit Decision' };
  };

  const formatStatusLabel = (val: string) => {
    if (!val) return '';
    return val
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Credit Assessment Desk"
        title="Credit Analyst Sequential Assessment Desk"
        subtitle="Step-by-step review: KYC verification, mandatory document check, FOIR capacity & policy rules, 4-pillar risk assessment, and recommendation handover"
      />

      {/* Credit Analyst KPI Cards Grouped by Stage */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Total Inflow"
          value={String(metrics.applicationsAssigned)}
          hint="All active proposals"
          icon={<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />
        <KpiCard
          label="Pending KYC & Docs"
          value={String(metrics.pendingVerification ?? (metrics.pendingKyc + metrics.pendingDocs))}
          hint="Step 2 verification checkpoint"
          icon={<FileCheck className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Pending Financial"
          value={String(metrics.pendingFinancial)}
          hint="Step 3 FOIR & capacity check"
          icon={<Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />
        <KpiCard
          label="Further Review"
          value={String(metrics.furtherReview)}
          hint="Underwriter corrections / send back"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Ready for Underwriter"
          value={String(metrics.eligibleApplications)}
          hint="Completed & ready for sanction"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <KpiCard
          label="Sanctioned / Disbursed"
          value={String(metrics.completedApplications ?? 0)}
          hint="Approved & portfolio loans"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4 border-slate-100 dark:border-[#2B3566]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                Credit Assessment Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-[#1E2445] dark:text-blue-400 dark:border-[#2B3566]">
                {filteredItems.length} shown · {metrics.applicationsAssigned} total
              </span>
            </div>

            {/* Search Input proximate to heading */}
            <div className="relative w-full sm:w-64 ml-0 sm:ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search borrower or app #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-blue-600 transition-colors',
                  isDark
                    ? 'bg-[#1E2445] border-[#2B3566] text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                )}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Select a workflow stage below to inspect proposals awaiting specific verification steps
          </p>
        </div>

        {/* Workflow Grouping Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-semibold overflow-x-auto">
          {[
            { key: 'ALL', label: `All Proposals (${metrics.applicationsAssigned})` },
            {
              key: 'PENDING_VERIFICATION',
              label: `Pending KYC & Docs (${metrics.pendingVerification ?? (metrics.pendingKyc + metrics.pendingDocs)})`,
            },
            { key: 'PENDING_FINANCIAL', label: `Pending Financial (${metrics.pendingFinancial})` },
            { key: 'PENDING_CREDIT', label: `Pending Risk Scoring (${metrics.pendingCredit})` },
            { key: 'ELIGIBLE', label: `Ready for Underwriter (${metrics.eligibleApplications})` },
            { key: 'FURTHER_REVIEW', label: `Further Review (${metrics.furtherReview})` },
            { key: 'NOT_ELIGIBLE', label: `Not Eligible (${metrics.notEligibleApplications})` },
            { key: 'COMPLETED', label: `Sanctioned & Disbursed (${metrics.completedApplications ?? 0})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0',
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Proposals Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No proposals match the selected workflow filter.
            </div>
          ) : (
            <table className="min-w-[1050px] w-full text-left border-collapse">
              <thead
                className={cn(
                  'border-b text-xs font-bold uppercase',
                  isDark ? 'border-[#2B3566] bg-[#16203D] text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3 min-w-[140px]">Application</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Borrower</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Product</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Requested Loan</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Workflow Stage</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Eligibility Check</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Credit Risk</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Status</th>
                  <th className="py-2.5 px-3 text-right w-[190px]">Action</th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  'divide-y text-xs',
                  isDark ? 'divide-[#2B3566] text-slate-200' : 'divide-slate-100 text-slate-700'
                )}
              >
                {filteredItems.map((app: any) => {
                  const stage = getAppWorkflowStage(app);
                  const isEligible = app.eligibility?.result === 'ELIGIBLE';
                  const isNotEligible = app.eligibility?.result === 'NOT_ELIGIBLE';

                  return (
                    <tr
                      key={app.id}
                      className={cn('transition-colors', isDark ? 'hover:bg-[#16203D]/60' : 'hover:bg-slate-50/70')}
                    >
                      <td className="py-3.5 px-3 font-semibold text-blue-600 dark:text-blue-400 align-top">
                        {(() => {
                          const fullAppNo = app.applicationNo || 'N/A';
                          const displayAppNo =
                            fullAppNo.length > 14
                              ? `${fullAppNo.slice(0, 4)}...${fullAppNo.slice(-6)}`
                              : fullAppNo;
                          return (
                            <button
                              onClick={() => router.push(`/credit-assessment?applicationId=${app.id}&step=${stage.step}`)}
                              className="hover:underline cursor-pointer text-left font-mono text-xs"
                              title={`Full Application ID: ${fullAppNo}`}
                              aria-label={`Open Application ${fullAppNo}`}
                            >
                              {displayAppNo}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1.5">
                          <p className={cn('font-semibold text-sm leading-snug', isDark ? 'text-white' : 'text-slate-900')}>
                            {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 text-xs">
                            <span
                              className="text-xs text-slate-400 font-mono tracking-normal"
                              title={app.customer?.customerCode ? `Customer ID: ${app.customer.customerCode}` : undefined}
                              aria-label={app.customer?.customerCode ? `Customer ID ${app.customer.customerCode}` : undefined}
                            >
                              {app.customer?.customerCode || '-'}
                            </span>
                            {app.customer?.kycStatus === 'VERIFIED' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                KYC Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={cn('py-3.5 px-3 font-medium align-top', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        {app.product?.name || 'Loan'}
                      </td>
                      <td className={cn('py-3.5 px-3 font-bold align-top', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatMoney(app.requestedAmount || 0)}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-block whitespace-nowrap',
                            stage.color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : stage.color === 'rose'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                              : stage.color === 'amber'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              : stage.color === 'indigo'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                          )}
                        >
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        {app.eligibility?.result ? (
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap',
                              isEligible
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                : isNotEligible
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            )}
                          >
                            {formatStatusLabel(app.eligibility.result)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status)
                              ? 'Pre-approved'
                              : 'Step 3 Pending'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        {app.riskAssessment?.score != null ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                            {app.riskAssessment.score}/100 ({app.riskAssessment.category || 'LOW'})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(app.status)
                              ? 'Evaluated'
                              : 'Step 4 Pending'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <Badge status={app.status} />
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap w-[190px] align-top">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => router.push(`/credit-assessment?applicationId=${app.id}&step=${stage.step}`)}
                          className="w-44 justify-center text-xs font-semibold cursor-pointer shadow-sm inline-flex items-center gap-1.5 ml-auto shrink-0"
                        >
                          <Calculator className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{stage.actionText} &rarr;</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function CreditAssessmentQueuePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} cols={8} />}>
      <CreditAssessmentQueueContent />
    </Suspense>
  );
}
