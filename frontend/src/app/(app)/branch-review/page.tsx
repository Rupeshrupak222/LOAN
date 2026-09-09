'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Send,
  Search,
  Users,
  FileText,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

type TabKey = 'ALL' | 'PENDING' | 'APPROVED' | 'SENT_BACK' | 'ESCALATED' | 'AWAITING_CREDIT';

export default function BranchReviewQueuePage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const isBranchManager = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(r)
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branch-manager-queue', activeTab],
    enabled: Boolean(isBranchManager),
    queryFn: async () => {
      const res = await api.get('/branch-manager/queue', { params: { tab: activeTab } });
      return res.data?.data;
    },
  });

  if (!isBranchManager) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Access Restricted
        </p>
        <p className="text-xs text-slate-400">
          Branch Management review queue is restricted to Branch Managers and Administrators.
        </p>
      </Card>
    );
  }

  if (isLoading) return <TableSkeleton rows={6} cols={7} />;

  const items = Array.isArray(data?.items) ? data.items : [];
  const metrics = data?.metrics || {
    totalBranchApplications: items.length,
    pendingManagerReview: 0,
    approvedWithinLimit: 0,
    sentBackForCorrection: 0,
    escalatedToUnderwriter: 0,
    awaitingDocuments: 0,
    awaitingCreditAssessment: 0,
    delegatedLimit: 500000,
  };

  const delegatedLimit = data?.delegatedAuthorityLimit || metrics.delegatedLimit || 500000;

  const filteredItems = items.filter((app: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const appNo = (app.applicationNo || '').toLowerCase();
    const name = `${app.customer?.firstName || ''} ${app.customer?.lastName || ''}`.toLowerCase();
    const code = (app.customer?.customerCode || '').toLowerCase();
    const product = (app.product?.name || '').toLowerCase();
    return appNo.includes(term) || name.includes(term) || code.includes(term) || product.includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Branch Management / Review Desk"
        title="Branch Applications & Management Review Desk"
        subtitle="Review completed credit assessments, approve proposals within delegated authority limit (₹5,00,000), send back for corrections, or escalate to Underwriting"
      />

      {/* Delegated Authority Policy Banner */}
      <div
        className={cn(
          'rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
          isDark
            ? 'bg-[#171B36] border-[#2B3566] text-slate-200'
            : 'bg-blue-50/70 border-blue-200 text-slate-800'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Delegated Approval Authority Limit:</span>
              <span className="font-mono font-extrabold text-[#2563EB] text-sm">
                {formatMoney(delegatedLimit)} (₹5 Lakhs)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proposals up to ₹5,00,000 can be approved directly after Credit Analyst assessment. Larger or high-risk loans must be escalated to Underwriting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ≤ ₹5L: BM Approval
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            &gt; ₹5L: Underwriter Escalation
          </span>
        </div>
      </div>

      {/* Branch Manager KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          label="Total Applications"
          value={String(metrics.totalBranchApplications)}
          hint="Branch portfolio"
          icon={<FileText className="h-4 w-4 text-[#2563EB]" />}
        />
        <KpiCard
          label="Pending Review"
          value={String(metrics.pendingManagerReview)}
          hint="Action required"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Approved In Limit"
          value={String(metrics.approvedWithinLimit)}
          hint="≤ ₹5 Lakh limit"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Sent Back"
          value={String(metrics.sentBackForCorrection)}
          hint="Correction needed"
          icon={<RotateCcw className="h-4 w-4 text-blue-500" />}
        />
        <KpiCard
          label="Escalated to UW"
          value={String(metrics.escalatedToUnderwriter)}
          hint="Above limit / High risk"
          icon={<Send className="h-4 w-4 text-purple-500" />}
        />
        <KpiCard
          label="Awaiting Docs"
          value={String(metrics.awaitingDocuments)}
          hint="Incomplete KYC/proofs"
          icon={<FileCheck className="h-4 w-4 text-amber-500" />}
        />
        <KpiCard
          label="Awaiting Credit"
          value={String(metrics.awaitingCreditAssessment)}
          hint="Credit analyst stage"
          icon={<AlertCircle className="h-4 w-4 text-slate-400" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-slate-100 dark:border-[#2B3566]">
          <div>
            <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Branch Applications Pipeline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredItems.length} of {items.length} loan applications in your branch desk
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search app no, borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-[#2563EB]',
                  isDark
                    ? 'bg-[#1E2445] border-[#2B3566] text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                )}
              />
            </div>
            <Button size="sm" variant="secondary" onClick={() => refetch()} className="text-xs shrink-0">
              Refresh
            </Button>
          </div>
        </div>

        {/* Workflow Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { key: 'ALL', label: 'All Proposals', count: metrics.totalBranchApplications },
            { key: 'PENDING', label: 'Pending Review', count: metrics.pendingManagerReview },
            { key: 'APPROVED', label: 'Approved Within Limit', count: metrics.approvedWithinLimit },
            { key: 'SENT_BACK', label: 'Sent Back', count: metrics.sentBackForCorrection },
            { key: 'ESCALATED', label: 'Escalated to Underwriter', count: metrics.escalatedToUnderwriter },
            { key: 'AWAITING_CREDIT', label: 'Awaiting Credit Assessment', count: metrics.awaitingCreditAssessment },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={cn(
                'px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer',
                activeTab === tab.key
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : isDark
                  ? 'bg-[#1E2445] text-slate-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : isDark
                    ? 'bg-black/30 text-slate-400'
                    : 'bg-slate-200 text-slate-700'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr
                className={cn(
                  'border-b text-[11px] font-bold uppercase tracking-wider',
                  isDark ? 'border-[#2B3566] text-slate-400 bg-[#171B36]' : 'border-slate-200 text-slate-500 bg-slate-50/50'
                )}
              >
                <th className="py-3 px-3">Application ID</th>
                <th className="py-3 px-3">Borrower Details</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Requested Amount</th>
                <th className="py-3 px-3">Authority Check</th>
                <th className="py-3 px-3">Credit Analyst Assessment</th>
                <th className="py-3 px-3">Risk Tier</th>
                <th className="py-3 px-3">FOIR / DTI</th>
                <th className="py-3 px-3">Workflow Status</th>
                <th className="py-3 px-3 text-right">Required Action</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-[#2B3566]' : 'divide-slate-100')}>
              {filteredItems.length > 0 ? (
                filteredItems.map((app: any) => {
                  const customer = app.customer || {};
                  const isWithinLimit = Number(app.requestedAmount) <= delegatedLimit;
                  const creditAssessmentDone = !!app.eligibility;
                  const eligibilityResult = app.eligibility?.result;

                  return (
                    <tr
                      key={app.id}
                      className={cn(
                        'transition-colors',
                        isDark ? 'hover:bg-[#1E2445]/50' : 'hover:bg-slate-50/80'
                      )}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#2563EB] dark:text-blue-400">
                          {app.applicationNo || app.id?.slice(0, 8)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {app.createdAt ? formatDate(app.createdAt) : '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {customer.customerCode || customer.mobile || '-'}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold">{app.product?.name || 'Standard Loan'}</span>
                        <div className="text-[10px] text-slate-400">{app.tenureMonths || 12} Months</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {formatMoney(app.requestedAmount)}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {isWithinLimit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Within Limit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" /> &gt; ₹5L (Escalate)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {creditAssessmentDone ? (
                          <div className="space-y-0.5">
                            <Badge
                              status={
                                eligibilityResult === 'ELIGIBLE'
                                  ? 'APPROVED'
                                  : eligibilityResult === 'NOT_ELIGIBLE'
                                  ? 'REJECTED'
                                  : 'UNDER_REVIEW'
                              }
                            />
                            <div className="text-[10px] text-slate-400">
                              {app.eligibility?.recommendation || (eligibilityResult === 'ELIGIBLE' ? 'Recommended' : 'Not Recommended')}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Clock className="w-3 h-3" /> Awaiting Credit
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {app.riskAssessment ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-600">
                              {app.riskAssessment.score}/100
                            </span>
                            <Badge status={app.riskAssessment.category || 'LOW'} />
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={cn('font-mono font-bold text-xs', (app.foirPct || 0) <= 50 ? 'text-emerald-600' : 'text-amber-600')}>
                          {app.foirPct != null ? `${app.foirPct}%` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <Badge status={app.reviewStatus || app.status} />
                      </td>

                      <td className="py-3 px-3 text-right">
                        {(() => {
                          const isFinished = ['APPROVED', 'DISBURSED', 'REJECTED', 'CANCELLED'].includes(app.status);
                          return (
                            <Link href={`/applications/${app.id}`}>
                              <Button
                                size="sm"
                                variant={isFinished ? 'secondary' : 'primary'}
                                className={cn(
                                  'text-xs gap-1 shadow-sm',
                                  isFinished
                                    ? 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2B3566]'
                                    : 'text-white bg-[#2563EB] hover:bg-blue-700'
                                )}
                              >
                                <span>{isFinished ? 'View Details' : 'Review Application'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-semibold">No applications found for current filter.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Applications assigned to your branch will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
