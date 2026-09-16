'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  User,
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Send,
  AlertCircle,
  Briefcase,
  FileText,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export function CreditAnalystCustomersView() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  // Filter Options: 'ALL' | 'ACTION_REQUIRED' | 'FORWARDED_TO_UNDERWRITER'
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'FORWARDED_TO_UNDERWRITER'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch live queue from backend synced with database
  const { data: allData = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['credit-analyst-forwarded-customers', searchTerm],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/queue', {
        params: {
          tab: 'ALL',
          search: searchTerm || undefined,
        },
      });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    refetchInterval: 12000,
  });

  // 2. Classify items into Action Required vs Forwarded to Underwriter
  const { actionRequiredItems, forwardedToUnderwriterItems } = useMemo(() => {
    const actionRequired: any[] = [];
    const forwardedToUnderwriter: any[] = [];

    allData.forEach((item: any) => {
      const status = (item.status || '').toUpperCase();
      // Forwarded to Underwriter if status is in Underwriting or Post-Sanction stage
      const isUnderwritingStage = [
        'UNDERWRITING',
        'APPROVED',
        'REJECTED',
        'AGREEMENT_PENDING',
        'READY_FOR_DISBURSEMENT',
        'DISBURSED',
      ].includes(status);
      
      if (isUnderwritingStage) {
        forwardedToUnderwriter.push(item);
      } else {
        // Pending action by Credit Analyst (SUBMITTED, UNDER_REVIEW, CREDIT_ASSESSMENT, KYC_PENDING, etc.)
        actionRequired.push(item);
      }
    });

    return {
      actionRequiredItems: actionRequired,
      forwardedToUnderwriterItems: forwardedToUnderwriter,
    };
  }, [allData]);

  // 3. Filter displayed items based on active tab
  const displayItems = useMemo(() => {
    if (activeFilter === 'ACTION_REQUIRED') return actionRequiredItems;
    if (activeFilter === 'FORWARDED_TO_UNDERWRITER') return forwardedToUnderwriterItems;
    return allData;
  }, [activeFilter, allData, actionRequiredItems, forwardedToUnderwriterItems]);

  const totalForwarded = allData.length;
  const actionRequiredCount = actionRequiredItems.length;
  const forwardedToUnderwriterCount = forwardedToUnderwriterItems.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <PageHeader
        breadcrumb="Credit Assessment / Customer Proposals"
        title="Forwarded Customer Proposals"
        subtitle="Live database tracking of borrower proposals forwarded by Loan Officers and assessments forwarded to Underwriting"
        action={
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                refetch();
                toast.info('Refreshed', 'Customer proposals synchronized with core database.');
              }}
              disabled={isRefetching}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefetching && 'animate-spin')} />
              Sync Live Database
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Proposals</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalForwarded}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total cases in credit pipeline</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-amber-200/60 dark:border-amber-900/40">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Action Required</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{actionRequiredCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Forwarded by Loan Officers (Awaiting your assessment)</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-emerald-200/60 dark:border-emerald-900/40">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Forwarded to Underwriter</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{forwardedToUnderwriterCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Completed assessment sent to sanction authority</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Send className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 3. Filter Bar with Tabs & Search */}
      <Card noPadding className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1E2445] text-xs font-bold flex-wrap">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                activeFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Customers ({totalForwarded})</span>
            </button>

            <button
              onClick={() => setActiveFilter('ACTION_REQUIRED')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                activeFilter === 'ACTION_REQUIRED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Action Required ({actionRequiredCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('FORWARDED_TO_UNDERWRITER')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                activeFilter === 'FORWARDED_TO_UNDERWRITER'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Forwarded to Underwriter ({forwardedToUnderwriterCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, phone, or app #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-[#1E2445] rounded-xl text-xs bg-slate-50 dark:bg-[#0C152B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* 4. Customers Proposals Table */}
      <Card noPadding className="p-5">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : displayItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Customers Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeFilter === 'ACTION_REQUIRED'
                ? 'Great job! You have no pending proposals awaiting credit assessment.'
                : activeFilter === 'FORWARDED_TO_UNDERWRITER'
                ? 'No proposals have been forwarded to Underwriting yet.'
                : 'No customer proposals matched your search filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#2B3566] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-3 min-w-[170px]">Customer Profile</th>
                  <th className="py-3 px-3 min-w-[150px]">Loan Proposal</th>
                  <th className="py-3 px-3 min-w-[120px]">Requested Amount</th>
                  <th className="py-3 px-3 min-w-[110px]">KYC Status</th>
                  <th className="py-3 px-3 min-w-[170px]">Stage / Flow Status</th>
                  <th className="py-3 px-3 text-right min-w-[280px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566]">
                {displayItems.map((item: any) => {
                  const customerName = item.customerName || `${item.customer?.firstName || 'Borrower'} ${item.customer?.lastName || ''}`.trim();
                  const customerCode = item.customerCode || item.customer?.customerCode || 'KYC Vault';
                  const mobile = item.mobile || item.customer?.mobile || '-';
                  const appNo = item.applicationNo || `APP-${item.id?.slice(0, 6)?.toUpperCase()}`;
                  const requestedAmount = item.requestedAmount || item.amount || 0;
                  const kycStatus = (item.kycStatus || item.customer?.kycStatus || 'PENDING').toUpperCase();
                  const appStatus = (item.status || 'SUBMITTED').toUpperCase();

                  const isUnderwritingStage = [
                    'UNDERWRITING',
                    'APPROVED',
                    'REJECTED',
                    'AGREEMENT_PENDING',
                    'READY_FOR_DISBURSEMENT',
                    'DISBURSED',
                  ].includes(appStatus);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2445]/50 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                            appStatus === 'REJECTED'
                              ? 'bg-rose-600/10 text-rose-600 dark:text-rose-400'
                              : isUnderwritingStage
                              ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                          )}>
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{customerName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>{customerCode}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {mobile}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Application Info */}
                      <td className="py-3.5 px-3">
                        <div>
                          <p className="font-bold text-blue-600 dark:text-blue-400 font-mono text-xs">
                            #{appNo}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.productName || item.product?.name || 'Personal Loan'} · {formatDate(item.createdAt || new Date())}
                          </p>
                        </div>
                      </td>

                      {/* Requested Amount */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatMoney(requestedAmount)}
                        </span>
                      </td>

                      {/* KYC Status */}
                      <td className="py-3.5 px-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                          kycStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : kycStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        )}>
                          {kycStatus === 'VERIFIED' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : kycStatus === 'REJECTED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {kycStatus}
                        </span>
                      </td>

                      {/* Stage Badge: Exact Synced State */}
                      <td className="py-3.5 px-3">
                        {appStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            Rejected by Underwriter
                          </span>
                        ) : ['APPROVED', 'DISBURSED', 'READY_FOR_DISBURSEMENT', 'AGREEMENT_PENDING'].includes(appStatus) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved & Sanctioned
                          </span>
                        ) : appStatus === 'UNDERWRITING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Send className="w-3 h-3" />
                            Forwarded to Underwriter (In Review)
                          </span>
                        ) : appStatus === 'CREDIT_ASSESSMENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Clock className="w-3 h-3" />
                            Assessment In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            Action Required (Loan Officer Forwarded)
                          </span>
                        )}
                      </td>

                      {/* Two Action Buttons: View Profile & Start Credit Assessment */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap min-w-[360px]">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. View Profile Button (Directly opens Borrower 360) */}
                          <Link href={`/customers/${item.customerId || item.customer?.id || item.id}`}>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-[130px] h-9 justify-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 shadow-2xs"
                            >
                              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>View Profile</span>
                            </Button>
                          </Link>

                          {/* 2. Start Credit Assessment Button */}
                          <Link href={`/credit-assessment?applicationId=${item.id}`}>
                            <Button
                              size="sm"
                              className={cn(
                                'w-[205px] h-9 justify-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs whitespace-nowrap shrink-0',
                                isUnderwritingStage
                                  ? 'bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                                  : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                              )}
                            >
                              <span>{isUnderwritingStage ? 'View Assessment File' : 'Start Assessment'}</span>
                              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
