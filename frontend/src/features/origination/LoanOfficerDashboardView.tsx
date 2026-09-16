'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  RotateCcw,
  User,
  ShieldCheck,
  Building2,
  Smartphone,
  Globe,
  AlertCircle,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, formatDateTime, cn } from '@/lib/utils';
import { Button, Badge, Card, Input, Spinner } from '@/components/ui';

type OriginationTabKey =
  | 'READY_FOR_CREDIT'
  | 'ACTION_REQUIRED'
  | 'DOCUMENTS_MISSING'
  | 'RETURNED_BY_CREDIT'
  | 'RECENTLY_SUBMITTED';

export function LoanOfficerDashboardView() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // 1st tab default: Ready for Credit
  const [activeTab, setActiveTab] = useState<OriginationTabKey>('READY_FOR_CREDIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch applications
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['loan-officer-dashboard-apps'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 100 } });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
    refetchInterval: 10000,
  });

  // Fetch returned applications
  const { data: returnedData } = useQuery({
    queryKey: ['loan-officer-returned-apps'],
    queryFn: async () => {
      const res = await api.get('/applications/returned', { params: { pageSize: 50 } });
      return res.data?.data || { data: [], metrics: {} };
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
  const leads = leadsData || [];

  // Categorize queues strictly based on origination lifecycle rules
  // 1. Ready for Credit: Staff originated drafts with all mandatory documents complete
  const readyForCreditApps = useMemo(() => {
    return apps.filter((a) => {
      if (a.status !== 'DRAFT') return false;
      if (a.isOnline) return false;
      return a.isDocsComplete === true || (Array.isArray(a.missingDocs) && a.missingDocs.length === 0 && (a.documents?.length > 0 || a.customerDocuments?.length > 0));
    });
  }, [apps]);

  // 2. Action Required: Digital / Online Self-Applied borrowers ONLY (e.g. mPokket style)
  const actionRequiredApps = useMemo(() => {
    return apps.filter((a) => {
      return Boolean(a.isOnline) && ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'].includes(a.status);
    });
  }, [apps]);

  // 3. Docs Missing: Staff originated drafts where one or more required documents are missing
  const docsMissingApps = useMemo(() => {
    return apps.filter((a) => {
      if (a.status !== 'DRAFT') return false;
      if (a.isOnline) return false;
      return a.isDocsComplete === false || (Array.isArray(a.missingDocs) && a.missingDocs.length > 0) || (!a.documents?.length && !a.customerDocuments?.length);
    });
  }, [apps]);

  // 4. Returned by Credit Analyst / Underwriting
  const returnedByCreditApps = useMemo(() => {
    const combined = [...returnedApps];
    apps.forEach((a) => {
      if (a.status === 'RETURNED' || a.underwriting?.decision === 'SEND_BACK' || a.underwriting?.decision === 'REJECT') {
        if (!combined.some((c) => c.id === a.id)) {
          combined.push(a);
        }
      }
    });
    return combined;
  }, [apps, returnedApps]);

  // 5. Recently Submitted: Applications in review by Credit Analyst / Underwriter
  const recentlySubmittedApps = useMemo(() => {
    return apps.filter((a) =>
      ['SUBMITTED', 'CREDIT_ASSESSMENT', 'UNDER_REVIEW', 'UNDERWRITING', 'APPROVED'].includes(a.status)
    );
  }, [apps]);

  // Tab definitions in exact required order
  const tabs = [
    {
      id: 'READY_FOR_CREDIT' as OriginationTabKey,
      label: 'Ready for Credit',
      count: readyForCreditApps.length,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'ACTION_REQUIRED' as OriginationTabKey,
      label: 'Action Required (Online Applied)',
      count: actionRequiredApps.length,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    },
    {
      id: 'DOCUMENTS_MISSING' as OriginationTabKey,
      label: 'Docs Missing',
      count: docsMissingApps.length,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    {
      id: 'RETURNED_BY_CREDIT' as OriginationTabKey,
      label: 'Returned',
      count: returnedByCreditApps.length,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    },
    {
      id: 'RECENTLY_SUBMITTED' as OriginationTabKey,
      label: 'Recently Submitted',
      count: recentlySubmittedApps.length,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    },
  ];

  // Get current active raw list
  const currentRawList = useMemo(() => {
    switch (activeTab) {
      case 'READY_FOR_CREDIT':
        return readyForCreditApps;
      case 'ACTION_REQUIRED':
        return actionRequiredApps;
      case 'DOCUMENTS_MISSING':
        return docsMissingApps;
      case 'RETURNED_BY_CREDIT':
        return returnedByCreditApps;
      case 'RECENTLY_SUBMITTED':
        return recentlySubmittedApps;
      default:
        return [];
    }
  }, [
    activeTab,
    readyForCreditApps,
    actionRequiredApps,
    docsMissingApps,
    returnedByCreditApps,
    recentlySubmittedApps,
  ]);

  // Apply search query filter
  const activeList = useMemo(() => {
    if (!searchQuery.trim()) return currentRawList;
    const q = searchQuery.toLowerCase().trim();
    return currentRawList.filter((app: any) => {
      const name = (app.customerName || `${app.customer?.firstName || ''} ${app.customer?.lastName || ''}`).toLowerCase();
      const appNo = (app.applicationNo || app.id || '').toLowerCase();
      const mobile = (app.customer?.mobile || '').toLowerCase();
      const prod = (app.product || app.productDetail?.name || '').toLowerCase();
      return name.includes(q) || appNo.includes(q) || mobile.includes(q) || prod.includes(q);
    });
  }, [currentRawList, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(activeList.length / pageSize));
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return activeList.slice(startIndex, startIndex + pageSize);
  }, [activeList, currentPage, pageSize]);

  // Handler: Send to Credit Analyst
  const handleSendToCredit = async (app: any) => {
    try {
      setSubmittingId(app.id);
      await api.post(`/applications/${app.id}/submit`, {
        reason: 'Loan Officer verified all required documents and submitted for credit assessment',
      });
      toast.success(`Application ${app.applicationNo || ''} submitted to Credit Analyst!`);
      queryClient.invalidateQueries({ queryKey: ['loan-officer-dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['loan-officer-returned-apps'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (app.customerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', app.customerId] });
      }
    } catch (err: any) {
      toast.error(apiErrorMessage(err) || 'Failed to submit application to Credit Analyst');
    } finally {
      setSubmittingId(null);
    }
  };

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
            Lead sourcing, customer onboarding, document collection & validation, and structured credit submission.
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Origination Queues</h2>
            <p className="text-xs text-slate-500">
              Progress borrower profiles systematically through required document collection before credit handover.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in active queue..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs font-semibold">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap text-xs',
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    isActive ? tab.badgeColor : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Description / Help Banner */}
        <div className="px-3.5 py-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
          {activeTab === 'READY_FOR_CREDIT' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-none" />
              <span>
                <strong>Ready for Credit:</strong> All mandatory borrower documents are complete. Review customer 360 profile and forward to Credit Analyst.
              </span>
            </>
          )}
          {activeTab === 'ACTION_REQUIRED' && (
            <>
              <Smartphone className="w-4 h-4 text-blue-500 flex-none" />
              <span>
                <strong>Action Required:</strong> Digital/Online self-applied customers (e.g. mPokket style) requiring Loan Officer intake, document review, and profile enrichment.
              </span>
            </>
          )}
          {activeTab === 'DOCUMENTS_MISSING' && (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-none" />
              <span>
                <strong>Docs Missing:</strong> Borrower applications with pending mandatory KYC or income documents. Click <em>View Profile</em> to upload required documents in Customer 360.
              </span>
            </>
          )}
          {activeTab === 'RETURNED_BY_CREDIT' && (
            <>
              <RotateCcw className="w-4 h-4 text-rose-500 flex-none" />
              <span>
                <strong>Returned Queue:</strong> Applications returned by Credit Analysts or Underwriters for rework or missing clarifications.
              </span>
            </>
          )}
          {activeTab === 'RECENTLY_SUBMITTED' && (
            <>
              <Clock className="w-4 h-4 text-indigo-500 flex-none" />
              <span>
                <strong>Recently Submitted:</strong> Applications currently in progress with Credit Assessment and Underwriting.
              </span>
            </>
          )}
        </div>

        {/* Queue Table Display */}
        {appsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No applications currently in this queue.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {searchQuery ? 'Try changing your search term.' : 'Fresh applications will appear here as they progress.'}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Application No</th>
                      <th className="py-3 px-3">Customer Profile</th>
                      <th className="py-3 px-3">Product & Amount</th>
                      {activeTab === 'DOCUMENTS_MISSING' && <th className="py-3 px-3">Missing Requirements</th>}
                      {activeTab === 'RETURNED_BY_CREDIT' && <th className="py-3 px-3">Return Reason / Notes</th>}
                      {activeTab === 'ACTION_REQUIRED' && <th className="py-3 px-3">Sourcing Channel</th>}
                      {activeTab === 'RECENTLY_SUBMITTED' && <th className="py-3 px-3">Current Pipeline Stage</th>}
                      {activeTab === 'READY_FOR_CREDIT' && <th className="py-3 px-3">Document Status</th>}
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedList.map((app: any) => {
                      const customerId = app.customerId || app.customer?.id;
                      const customerName =
                        app.customerName ||
                        (app.customer ? `${app.customer.firstName || ''} ${app.customer.lastName || ''}`.trim() : 'Borrower');
                      const customerCode = app.customer?.customerCode || 'CUST-NEW';
                      const mobile = app.customer?.mobile || '-';
                      const productName = app.product || app.productDetail?.name || 'Personal Loan';
                      const amount = formatMoney(app.requestedAmount || 0);

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Application Column */}
                          <td className="py-3.5 px-3">
                            <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {app.applicationNo || app.id}
                            </Link>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{formatDate(app.createdAt)}</span>
                          </td>

                          {/* Customer Column */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] flex-none">
                                {customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <Link
                                  href={customerId ? `/customers/${customerId}` : '#'}
                                  className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {customerName}
                                </Link>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{customerCode}</span>
                                  <span>•</span>
                                  <span>{mobile}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Product & Amount */}
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{productName}</p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{amount}</p>
                            <p className="text-[10px] text-slate-400">{app.tenureMonths ? `${app.tenureMonths} mos` : ''}</p>
                          </td>

                          {/* Conditional Columns based on Tab */}
                          {activeTab === 'DOCUMENTS_MISSING' && (
                            <td className="py-3.5 px-3">
                              {app.missingDocLabels && app.missingDocLabels.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {app.missingDocLabels.slice(0, 3).map((lbl: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                    >
                                      {lbl}
                                    </span>
                                  ))}
                                  {app.missingDocLabels.length > 3 && (
                                    <span className="text-[10px] text-slate-400 self-center">
                                      +{app.missingDocLabels.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No missing items detected</span>
                              )}
                            </td>
                          )}

                          {activeTab === 'RETURNED_BY_CREDIT' && (
                            <td className="py-3.5 px-3">
                              <div className="max-w-xs space-y-0.5">
                                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                  {app.returnDetails?.returnedByRole || 'Credit Analyst'}
                                </span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                                  {app.returnDetails?.reason || app.underwriting?.reason || 'Clarifications requested on borrower details.'}
                                </p>
                              </div>
                            </td>
                          )}

                          {activeTab === 'ACTION_REQUIRED' && (
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <Globe className="w-3 h-3" /> Online Direct / mPokket
                              </span>
                            </td>
                          )}

                          {activeTab === 'RECENTLY_SUBMITTED' && (
                            <td className="py-3.5 px-3">
                              <Badge status={app.status} />
                              {app.submittedAt && (
                                <p className="text-[10px] text-slate-400 mt-1">Submitted: {formatDate(app.submittedAt)}</p>
                              )}
                            </td>
                          )}

                          {activeTab === 'READY_FOR_CREDIT' && (
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                All Docs Complete
                              </span>
                            </td>
                          )}

                          {/* Action Buttons Column */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Profile Button (Opens 360 Customer Profile) */}
                              {customerId && (
                                <Link
                                  href={`/customers/${customerId}`}
                                  className={cn(
                                    'inline-flex items-center justify-center gap-1.5 w-[130px] h-[34px] px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 transition-all shrink-0',
                                    activeTab === 'DOCUMENTS_MISSING' &&
                                      'border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  )}
                                >
                                  {activeTab === 'DOCUMENTS_MISSING' ? (
                                    <>
                                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                                      <span>View & Upload</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3.5 h-3.5 text-blue-500" />
                                      <span>View Profile</span>
                                    </>
                                  )}
                                </Link>
                              )}

                              {/* Ready for Credit: Send to Credit Analyst Button */}
                              {activeTab === 'READY_FOR_CREDIT' && (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center gap-1.5 w-[130px] h-[34px] px-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white shadow-2xs transition-all shrink-0 cursor-pointer"
                                  onClick={() => handleSendToCredit(app)}
                                  disabled={submittingId === app.id}
                                >
                                  {submittingId === app.id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  <span>Send to Credit</span>
                                </button>
                              )}

                              {/* Returned: Open Workspace Button */}
                              {activeTab === 'RETURNED_BY_CREDIT' && (
                                <Link href={`/applications/${app.id}`}>
                                  <Button size="sm" variant="secondary" className="gap-1 text-[11px] font-semibold">
                                    <RotateCcw className="w-3 h-3 text-rose-500" /> Resolve & Re-submit
                                  </Button>
                                </Link>
                              )}

                              {/* Action Required: Open Application */}
                              {activeTab === 'ACTION_REQUIRED' && (
                                <Link href={`/applications/${app.id}`}>
                                  <Button size="sm" className="gap-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                                    <FileText className="w-3 h-3" /> Open Application
                                  </Button>
                                </Link>
                              )}

                              {/* Recently Submitted: View Application */}
                              {activeTab === 'RECENTLY_SUBMITTED' && (
                                <Link href={`/applications/${app.id}`}>
                                  <Button size="sm" variant="outline" className="gap-1 text-[11px] font-semibold">
                                    <ArrowRight className="w-3 h-3" /> View Application
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Footer */}
                {activeList.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedList.length}</span> of{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{activeList.length}</span> applications
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
