'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  ArrowRight,
  Search,
  Upload,
  UserPlus,
  Sparkles,
  FileCheck,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  PhoneCall,
  Lock,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Button, Badge, Card, Input, Spinner } from '@/components/ui';

export function LoanOfficerDashboardView() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ACTION_REQUIRED' | 'READY_TO_SUBMIT' | 'KYC_PENDING' | 'HANDED_OFF'>('ACTION_REQUIRED');

  // Fetch applications
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['loan-officer-dashboard-apps'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 50 } });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
    refetchInterval: 10000,
  });

  // Fetch returned applications
  const { data: returnedData } = useQuery({
    queryKey: ['loan-officer-returned-apps'],
    queryFn: async () => {
      const res = await api.get('/applications/returned', { params: { pageSize: 20 } });
      return res.data?.data || { data: [], metrics: {} };
    },
    refetchInterval: 10000,
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['loan-officer-dashboard-customers'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { pageSize: 30 } });
      return res.data?.data || [];
    },
    refetchInterval: 10000,
  });

  // Fetch leads
  const { data: leadsData } = useQuery({
    queryKey: ['loan-officer-dashboard-leads'],
    queryFn: async () => {
      const res = await api.get('/leads');
      return res.data?.data || [];
    },
    refetchInterval: 10000,
  });

  const apps = appsData || [];
  const returnedApps = returnedData?.data || [];
  const customers = customersData || [];
  const leads = leadsData || [];

  // Metrics computation
  const newApps = apps.filter((a) => a.status === 'DRAFT').length;
  const inProgressApps = apps.filter((a) => ['DRAFT', 'KYC_PENDING', 'UNDER_REVIEW'].includes(a.status)).length;
  const kycPendingCount = apps.filter((a) => a.kycStatus !== 'VERIFIED' && a.status !== 'APPROVED' && a.status !== 'DISBURSED').length;
  const docsPendingCount = returnedApps.filter((a: any) => !a.isComplete).length;
  const actionRequiredCount = returnedApps.length + apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'NOT_STARTED').length;
  const readyToSubmitCount = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED').length;
  const submittedCount = apps.filter((a) => a.status === 'SUBMITTED').length;
  const handedOffToCreditCount = apps.filter((a) => ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(a.status)).length;

  // Filtered lists for the operational desk
  const actionRequiredList = [
    ...returnedApps.map((r: any) => ({
      ...r,
      urgency: 'HIGH',
      actionLabel: 'Resolve Return Stipulations',
      actionHref: `/applications/${r.id}`,
    })),
    ...apps
      .filter((a) => a.status === 'DRAFT' && a.kycStatus !== 'VERIFIED')
      .map((a) => ({
        ...a,
        urgency: 'MEDIUM',
        actionLabel: 'Complete KYC & Documents',
        actionHref: `/applications/${a.id}`,
      })),
  ];

  const readyToSubmitList = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED');
  const kycPendingList = apps.filter((a) => a.kycStatus !== 'VERIFIED' && a.status !== 'DISBURSED');
  const handedOffList = apps.filter((a) => ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'APPROVED'].includes(a.status));

  return (
    <div className="space-y-6">
      {/* Origination Desk Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
              Origination Workspace
            </span>
            <span className="text-xs text-blue-300 font-mono">Branch: {user?.branchId || 'Headquarters'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Loan Officer Operational Desk</h1>
          <p className="text-xs text-blue-200/80 max-w-2xl">
            Streamlined loan intake, dynamic KYC document collection, lead sourcing, and workflow-gated handoff to Credit Analysts.
          </p>
        </div>

        {/* Primary Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/leads">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sourcing Leads ({leads.length})
            </Button>
          </Link>
          <Link href="/customers/new">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20">
              <UserPlus className="w-3.5 h-3.5 text-blue-300" /> Create Customer
            </Button>
          </Link>
          <Link href="/applications/new">
            <Button size="sm" className="gap-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg">
              <Plus className="w-3.5 h-3.5" /> Create Application
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">New Intake</span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{newApps}</p>
          <p className="text-[10px] text-slate-400">Draft proposals</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">In Progress</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400">{inProgressApps}</p>
          <p className="text-[10px] text-slate-400">Active onboarding</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">KYC Pending</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">{kycPendingCount}</p>
          <p className="text-[10px] text-amber-600/80">Awaiting identity</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Docs Missing</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">{docsPendingCount}</p>
          <p className="text-[10px] text-rose-600/80">Required upload</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/10 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">Action Req.</span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">{actionRequiredCount}</p>
          <p className="text-[10px] text-purple-600/80">Stipulations/fixes</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Ready to Submit</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{readyToSubmitCount}</p>
          <p className="text-[10px] text-emerald-600/80">All gates passed</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Submitted</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{submittedCount}</p>
          <p className="text-[10px] text-slate-400">In credit queue</p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Handed to Credit</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400">{handedOffToCreditCount}</p>
          <p className="text-[10px] text-slate-400">Under appraisal</p>
        </div>
      </div>

      {/* Main Operational Queues Desk */}
      <Card className="p-5 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Origination Action Queues</h2>
            <p className="text-xs text-slate-500">Prioritized workflow tasks requiring Loan Officer attention and follow-up.</p>
          </div>

          {/* Queue Tab Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ACTION_REQUIRED')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'ACTION_REQUIRED'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Action Required ({actionRequiredList.length})
            </button>
            <button
              onClick={() => setActiveTab('READY_TO_SUBMIT')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'READY_TO_SUBMIT'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Ready for Submission ({readyToSubmitList.length})
            </button>
            <button
              onClick={() => setActiveTab('KYC_PENDING')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'KYC_PENDING'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              KYC Pending ({kycPendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('HANDED_OFF')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'HANDED_OFF'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Handed to Credit ({handedOffList.length})
            </button>
          </div>
        </div>

        {/* Queue Table Display */}
        {appsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'ACTION_REQUIRED' && (
              actionRequiredList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  All return stipulations and missing document tasks are currently resolved.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="py-2.5 px-3">Application</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product & Amount</th>
                      <th className="py-2.5 px-3">Stipulation / Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {actionRequiredList.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <Link href={`/applications/${item.id}`} className="font-bold text-blue-600 hover:underline">
                            {item.applicationNo}
                          </Link>
                          <p className="text-[10px] text-slate-400">{formatDate(item.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{item.customerName}</p>
                          <p className="text-[10px] text-slate-400">{item.customer?.mobile || item.customerMobile || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{item.product}</p>
                          <p className="text-[10px] text-slate-400 font-mono">₹{formatMoney(item.requestedAmount)}</p>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium truncate">
                            {item.returnDetails?.reason || 'Dynamic KYC and income verification incomplete.'}
                          </p>
                          {item.missingLabels && item.missingLabels.length > 0 && (
                            <p className="text-[10px] text-rose-500 truncate">
                              Missing: {item.missingLabels.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge status={item.status} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/applications/${item.id}`}>
                            <Button size="sm" className="gap-1 text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                              Resolve <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'READY_TO_SUBMIT' && (
              readyToSubmitList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No draft applications are currently pending submission.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="py-2.5 px-3">Application</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product & Amount</th>
                      <th className="py-2.5 px-3">KYC & Document Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {readyToSubmitList.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline">
                            {app.applicationNo}
                          </Link>
                          <p className="text-[10px] text-slate-400">{formatDate(app.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{app.customerName}</p>
                          <p className="text-[10px] text-slate-400">{app.customer?.mobile}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{app.product}</p>
                          <p className="text-[10px] text-slate-400 font-mono">₹{formatMoney(app.requestedAmount)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> All Gates Verified
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/applications/${app.id}`}>
                            <Button size="sm" className="gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                              <Send className="w-3 h-3" /> Submit to Credit Analyst
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'KYC_PENDING' && (
              kycPendingList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  All active proposals have completed KYC identity verification.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="py-2.5 px-3">Application</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Current KYC Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {kycPendingList.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline">
                            {app.applicationNo}
                          </Link>
                          <p className="text-[10px] text-slate-400">{formatDate(app.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{app.customerName}</p>
                          <p className="text-[10px] text-slate-400">{app.customer?.mobile}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{app.product}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge status={app.kycStatus} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/customers/${app.customerId}`}>
                            <Button size="sm" variant="outline" className="gap-1 text-[11px] font-semibold">
                              <Upload className="w-3 h-3 text-blue-600" /> Collect KYC
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'HANDED_OFF' && (
              handedOffList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No applications are currently in downstream credit appraisal.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="py-2.5 px-3">Application</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product & Amount</th>
                      <th className="py-2.5 px-3">Current Operational Owner</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {handedOffList.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline">
                            {app.applicationNo}
                          </Link>
                          <p className="text-[10px] text-slate-400">{formatDate(app.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{app.customerName}</p>
                          <p className="text-[10px] text-slate-400">{app.customer?.mobile}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{app.product}</p>
                          <p className="text-[10px] text-slate-400 font-mono">₹{formatMoney(app.requestedAmount)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/40">
                            <Lock className="w-3 h-3 text-indigo-500" />
                            {app.status === 'UNDERWRITING' ? 'Underwriter' : app.status === 'APPROVED' ? 'Finance / Disbursement' : 'Credit Analyst'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge status={app.status} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/applications/${app.id}`}>
                            <Button size="sm" variant="ghost" className="gap-1 text-[11px] font-semibold text-slate-500">
                              View Status (Read-Only)
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
