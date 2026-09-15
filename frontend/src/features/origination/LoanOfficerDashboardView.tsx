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

  const [activeTab, setActiveTab] = useState<'ACTION_REQUIRED' | 'KYC_PENDING' | 'DOCUMENTS_MISSING' | 'DOCUMENTS_UNDER_REVIEW' | 'APPLICATIONS_INCOMPLETE' | 'READY_FOR_REVIEW' | 'READY_FOR_CREDIT' | 'RETURNED_BY_CREDIT' | 'RECENTLY_SUBMITTED'>('ACTION_REQUIRED');

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

  // Categorize apps for specific queues
  const actionRequiredApps = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'NOT_STARTED');
  const kycPendingApps = apps.filter((a) => a.status === 'DRAFT' && ['PENDING', 'NOT_STARTED'].includes(a.kycStatus));
  const docsMissingApps = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED'); // Simplify docs check
  const readyForReviewApps = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED'); // Placeholder condition
  const readyForCreditApps = apps.filter((a) => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED'); // Placeholder condition
  const recentlySubmittedApps = apps.filter((a) => a.status === 'SUBMITTED');
  const returnedByCreditApps = returnedApps;

  const getListForTab = () => {
    switch (activeTab) {
      case 'ACTION_REQUIRED': return actionRequiredApps;
      case 'KYC_PENDING': return kycPendingApps;
      case 'DOCUMENTS_MISSING': return docsMissingApps;
      case 'READY_FOR_REVIEW': return readyForReviewApps;
      case 'READY_FOR_CREDIT': return readyForCreditApps;
      case 'RETURNED_BY_CREDIT': return returnedByCreditApps;
      case 'RECENTLY_SUBMITTED': return recentlySubmittedApps;
      default: return [];
    }
  };

  const activeList = getListForTab();

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
            Strict document-gated loan origination pipeline. Process applications systematically before credit handover.
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

      {/* Main Operational Queues Desk */}
      <Card className="p-5 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Origination Queues</h2>
            <p className="text-xs text-slate-500">Structured workflow stages. Applications must progress through all stages.</p>
          </div>

          {/* Queue Tab Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold overflow-x-auto pb-2">
            {[
              { id: 'ACTION_REQUIRED', label: 'Action Required' },
              { id: 'KYC_PENDING', label: 'KYC Pending' },
              { id: 'DOCUMENTS_MISSING', label: 'Docs Missing' },
              { id: 'DOCUMENTS_UNDER_REVIEW', label: 'Docs Review' },
              { id: 'APPLICATIONS_INCOMPLETE', label: 'Incomplete' },
              { id: 'READY_FOR_REVIEW', label: 'Ready for Review' },
              { id: 'READY_FOR_CREDIT', label: 'Ready for Credit' },
              { id: 'RETURNED_BY_CREDIT', label: 'Returned' },
              { id: 'RECENTLY_SUBMITTED', label: 'Recently Submitted' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-md transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Table Display */}
        {appsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                No applications currently in this queue.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="py-2.5 px-3">Application</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product & Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {activeList.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline">
                          {app.applicationNo || app.id.slice(0, 8)}
                        </Link>
                        <p className="text-[10px] text-slate-400">{formatDate(app.createdAt)}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{app.customerName || app.customer?.firstName}</p>
                        <p className="text-[10px] text-slate-400">{app.customer?.mobile}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{app.product || app.product?.name || 'Personal Loan'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">₹{formatMoney(app.requestedAmount)}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={app.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/applications/${app.id}`}>
                          <Button size="sm" variant="outline" className="gap-1 text-[11px] font-semibold">
                            Open Workspace <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
