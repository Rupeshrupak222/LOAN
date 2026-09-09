'use client';

import { useState } from 'react';
import Link from 'next/link';
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

type TabKey =
  | 'ALL'
  | 'PENDING_KYC'
  | 'PENDING_DOCS'
  | 'PENDING_FINANCIAL'
  | 'PENDING_CREDIT'
  | 'FURTHER_REVIEW'
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE';

export default function CreditAssessmentQueuePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const isCreditAllowed = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'BRANCH_MANAGER'].includes(r)
  );

  const { data, isLoading } = useQuery({
    queryKey: ['credit-queue', activeTab],
    enabled: Boolean(isCreditAllowed),
    queryFn: async () => {
      const res = await api.get('/credit/queue', { params: { tab: activeTab } });
      return res.data?.data;
    },
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

  if (isLoading) return <TableSkeleton rows={6} cols={8} />;

  const items = Array.isArray(data?.items) ? data.items : [];
  const metrics = data?.metrics || {
    applicationsAssigned: items.length,
    pendingKyc: 0,
    pendingDocs: 0,
    pendingFinancial: 0,
    pendingCredit: 0,
    furtherReview: 0,
    eligibleApplications: 0,
    notEligibleApplications: 0,
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

  // Determines current workflow checkpoint for each application
  const getAppWorkflowStage = (app: any) => {
    if (app.status === 'UNDERWRITING' || (app.eligibility?.factors as any)?.decision === 'ELIGIBLE') {
      return { label: 'Ready for Underwriter', color: 'emerald', step: 7 };
    }
    if (app.eligibility?.result === 'NOT_ELIGIBLE' || app.status === 'REJECTED') {
      return { label: 'Not Eligible', color: 'rose', step: 6 };
    }
    if (app.eligibility?.result === 'FURTHER_REVIEW' || app.underwriting?.decision === 'SEND_BACK') {
      return { label: 'Further Review', color: 'amber', step: 6 };
    }
    if (app.customer?.kycStatus !== 'VERIFIED') {
      return { label: 'Step 2: KYC Pending', color: 'amber', step: 2 };
    }
    // Check if mandatory documents are verified
    const allDocs = [...(app.customer?.documents || []), ...(app.documents || [])];
    const hasUnverifiedDocs = allDocs.some((d: any) => !d.verified || d.status !== 'VERIFIED');
    if (hasUnverifiedDocs || allDocs.length < 3) {
      return { label: 'Step 3: Docs Pending', color: 'amber', step: 3 };
    }
    if (!app.eligibility) {
      return { label: 'Step 4: Financial Check', color: 'blue', step: 4 };
    }
    if (!app.riskAssessment || app.status === 'CREDIT_ASSESSMENT') {
      return { label: 'Step 5: Credit Risk Check', color: 'blue', step: 5 };
    }
    return { label: 'Step 6: Decision Pending', color: 'purple', step: 6 };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Credit Assessment Desk"
        title="Credit Analyst Sequential Assessment Desk"
        subtitle="Step-by-step review: KYC verification, mandatory document check, FOIR capacity & policy rules, 4-pillar risk assessment, and recommendation handover"
      />

      {/* Credit Analyst KPI Cards Grouped by Stage */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Inflow"
          value={String(metrics.applicationsAssigned)}
          hint="Assigned proposals"
          icon={<FileText className="h-4 w-4 text-[#2563EB]" />}
        />
        <KpiCard
          label="Pending KYC"
          value={String(metrics.pendingKyc)}
          hint="Step 2 checkpoint"
          icon={<UserCheck className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Pending Docs"
          value={String(metrics.pendingDocs)}
          hint="Step 3 checklist"
          icon={<FileCheck className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Pending Financial"
          value={String(metrics.pendingFinancial)}
          hint="Step 4 FOIR & DTI"
          icon={<Calculator className="h-4 w-4 text-[#2563EB]" />}
        />
        <KpiCard
          label="Further Review"
          value={String(metrics.furtherReview)}
          hint="Clarifications requested"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Ready for Underwriter"
          value={String(metrics.eligibleApplications)}
          hint="Forwarded for sanction"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-slate-100 dark:border-[#2B3566]">
          <div>
            <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Credit Assessment Queue ({filteredItems.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a workflow stage below to inspect proposals awaiting specific verification steps
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search borrower or app #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-[#2563EB] transition-colors',
                isDark
                  ? 'bg-[#1E2445] border-[#2B3566] text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              )}
            />
          </div>
        </div>

        {/* Workflow Grouping Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-semibold overflow-x-auto">
          {[
            { key: 'ALL', label: `All Proposals (${metrics.applicationsAssigned})` },
            { key: 'PENDING_KYC', label: `Pending KYC (${metrics.pendingKyc})` },
            { key: 'PENDING_DOCS', label: `Pending Documents (${metrics.pendingDocs})` },
            { key: 'PENDING_FINANCIAL', label: `Pending Financial (${metrics.pendingFinancial})` },
            { key: 'PENDING_CREDIT', label: `Pending Risk/Decision (${metrics.pendingCredit})` },
            { key: 'FURTHER_REVIEW', label: `Further Review (${metrics.furtherReview})` },
            { key: 'ELIGIBLE', label: `Eligible / Ready for Underwriter (${metrics.eligibleApplications})` },
            { key: 'NOT_ELIGIBLE', label: `Not Eligible (${metrics.notEligibleApplications})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                activeTab === t.key
                  ? isDark
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
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
            <table className="w-full text-left border-collapse">
              <thead
                className={cn(
                  'border-b text-[11px] font-bold uppercase',
                  isDark ? 'border-[#2B3566] bg-[#16203D] text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
                )}
              >
                <tr>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Requested Loan</th>
                  <th className="py-2.5 px-3">Workflow Stage</th>
                  <th className="py-2.5 px-3">Eligibility Check</th>
                  <th className="py-2.5 px-3">Credit Risk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Sequential Action</th>
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
                      <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        <Link href={`/applications/${app.id}`} className="hover:underline">
                          {app.applicationNo || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className={cn('font-semibold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                          {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{app.customer?.customerCode || '-'}</p>
                      </td>
                      <td className={cn('py-3 px-3 font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        {app.product?.name || 'Loan'}
                      </td>
                      <td className={cn('py-3 px-3 font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatMoney(app.requestedAmount || 0)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-bold border inline-block whitespace-nowrap',
                            stage.color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : stage.color === 'rose'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                              : stage.color === 'amber'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                          )}
                        >
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {app.eligibility?.result ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-bold border',
                              isEligible
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                : isNotEligible
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            )}
                          >
                            {app.eligibility.result}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Step 4 Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {app.riskAssessment ? (
                          <span className="font-bold text-[#2563EB] dark:text-[#60A5FA] text-xs">
                            {app.riskAssessment.score}/100 ({app.riskAssessment.category || 'LOW'})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Step 5 Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={app.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/applications/${app.id}`}>
                          <Button
                            size="sm"
                            className={cn(
                              'text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1 ml-auto',
                              stage.step === 7
                                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-[#1E2445] dark:text-slate-200 dark:hover:bg-[#2B3566]'
                                : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                            )}
                          >
                            {stage.step === 7 ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>View Ledger</span>
                              </>
                            ) : stage.step === 2 ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Verify KYC →</span>
                              </>
                            ) : stage.step === 3 ? (
                              <>
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Verify Docs →</span>
                              </>
                            ) : stage.step === 4 ? (
                              <>
                                <Calculator className="w-3.5 h-3.5" />
                                <span>Assess Capacity →</span>
                              </>
                            ) : stage.step === 5 ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Assess Risk →</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Make Decision →</span>
                              </>
                            )}
                          </Button>
                        </Link>
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
