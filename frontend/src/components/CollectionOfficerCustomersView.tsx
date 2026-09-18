'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  AlertTriangle,
  Clock,
  Coins,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  CreditCard,
  Layers,
  XCircle,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { ContactActivityModal } from '@/features/collections/ContactActivityModal';
import { PtpModal } from '@/features/collections/PtpModal';

export function CollectionOfficerCustomersView() {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OVERDUE' | 'SMA_0' | 'SMA_1' | 'SMA_2_NPA' | 'HEALTHY'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected case for Activity & PTP modals
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [ptpModalOpen, setPtpModalOpen] = useState(false);

  // Direct Repayment Modal state
  const [directPayModalOpen, setDirectPayModalOpen] = useState(false);
  const [directLoanId, setDirectLoanId] = useState('');
  const [directAmount, setDirectAmount] = useState('');
  const [directMethod, setDirectMethod] = useState('UPI');
  const [directRef, setDirectRef] = useState('');
  const [directNotes, setDirectNotes] = useState('');

  // 1. Fetch Disbursed Borrowers strictly from /customers
  const { data: responseData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['collection-officer-customers', searchTerm, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: {
          search: searchTerm || undefined,
          page,
          pageSize,
        },
      });
      const rows = res.data?.data;
      const pagination = res.data?.pagination || {
        page,
        pageSize,
        total: Array.isArray(rows) ? rows.length : 0,
        totalPages: 1,
      };
      return {
        rows: (Array.isArray(rows) ? rows : []) as any[],
        pagination,
      };
    },
    refetchInterval: 15000,
  });

  // Direct Repayment Mutation
  const directPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!directLoanId || !directAmount) return;
      return api.post(`/loans/${directLoanId}/payments`, {
        amount: parseFloat(directAmount),
        channel: directMethod,
        reference: directRef || `COLLECT-${Date.now()}`,
        notes: directNotes || 'Direct collection payment posted by Collection Officer',
      });
    },
    onSuccess: () => {
      toast.success('Repayment successfully posted and auto-allocated to loan schedule!');
      setDirectPayModalOpen(false);
      setDirectLoanId('');
      setDirectAmount('');
      setDirectRef('');
      setDirectNotes('');
      queryClient.invalidateQueries({ queryKey: ['collection-officer-customers'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['collection-dashboard-cases'] });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err));
    },
  });

  const allCustomers = responseData?.rows || [];
  const pagination = responseData?.pagination;

  // Filter customers by selected status tab
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((c: any) => {
      if (activeFilter === 'OVERDUE') return c.hasOverdue || c.dpd > 0;
      if (activeFilter === 'SMA_0') return c.dpd >= 1 && c.dpd <= 30;
      if (activeFilter === 'SMA_1') return c.dpd >= 31 && c.dpd <= 60;
      if (activeFilter === 'SMA_2_NPA') return c.dpd > 60;
      if (activeFilter === 'HEALTHY') return !c.hasOverdue && c.dpd === 0;
      return true;
    });
  }, [allCustomers, activeFilter]);

  // Aggregate Metrics
  const totalBorrowers = allCustomers.length;
  const overdueBorrowers = allCustomers.filter((c: any) => c.hasOverdue || c.dpd > 0).length;
  const sma0Count = allCustomers.filter((c: any) => c.dpd >= 1 && c.dpd <= 30).length;
  const sma1Count = allCustomers.filter((c: any) => c.dpd >= 31 && c.dpd <= 60).length;
  const npaCount = allCustomers.filter((c: any) => c.dpd > 60).length;
  const healthyCount = allCustomers.filter((c: any) => !c.hasOverdue && c.dpd === 0).length;

  const cardBgClass = isDark
    ? 'border-[#1E2445] bg-[#0C152B] text-white'
    : 'border-slate-200/80 bg-white text-slate-900';

  const openDirectPay = (customer: any) => {
    setDirectLoanId(customer.activeLoanId || '');
    if (customer.overdueAmount) {
      setDirectAmount(String(customer.overdueAmount));
    } else if (customer.emiAmount) {
      setDirectAmount(String(customer.emiAmount));
    }
    setDirectPayModalOpen(true);
  };

  const openActivityLog = (customer: any) => {
    setSelectedCase({
      id: customer.collectionCaseId || customer.activeLoanId,
      customerName: customer.name,
      loanNo: customer.activeLoanNo,
    });
    setActivityModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Disbursed Borrowers & Delinquency Directory"
        subtitle="Live portfolio of customers who have been disbursed loans by Finance Officer, EMI repayment status, and delinquency tracking."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
              {isRefetching ? 'Refreshing...' : 'Refresh Portfolio'}
            </Button>
            <Link href="/collections">
              <Button size="sm" className="text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white gap-1.5">
                Delinquency Desk →
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Top Portfolio Status Telemetry Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'ALL'
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ALL BORROWERS
          </span>
          <p className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">
            {totalBorrowers}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('OVERDUE')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'OVERDUE'
              ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
            OVERDUE / UNPAID
          </span>
          <p className="text-lg font-extrabold mt-1 text-rose-600 dark:text-rose-400">
            {overdueBorrowers}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('SMA_0')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'SMA_0'
              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            1–30 DPD (SMA-0)
          </span>
          <p className="text-lg font-extrabold mt-1 text-amber-600 dark:text-amber-400">
            {sma0Count}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('SMA_1')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'SMA_1'
              ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
            31–60 DPD (SMA-1)
          </span>
          <p className="text-lg font-extrabold mt-1 text-orange-600 dark:text-orange-400">
            {sma1Count}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('SMA_2_NPA')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'SMA_2_NPA'
              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            61+ DPD (NPA)
          </span>
          <p className="text-lg font-extrabold mt-1 text-purple-600 dark:text-purple-400">
            {npaCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('HEALTHY')}
          className={cn(
            'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
            activeFilter === 'HEALTHY'
              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
              : cardBgClass
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            ON-TIME / HEALTHY
          </span>
          <p className="text-lg font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
            {healthyCount}
          </p>
        </button>
      </div>

      {/* 3. Main Data Card */}
      <Card className={cn('rounded-2xl border p-5 space-y-4 overflow-hidden', cardBgClass)}>
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by borrower name, customer code (CUST-..), mobile, loan #..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={cn(
                'w-full h-9 rounded-xl border pl-9 pr-4 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500',
                isDark ? 'border-[#1E2445] bg-[#1E2445]/50 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
              )}
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredCustomers.length}</strong> active borrower profiles
          </div>
        </div>

        {/* Borrowers Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredCustomers.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={cn(
                  'border-b text-[10px] font-bold uppercase tracking-wider text-slate-400',
                  isDark ? 'border-[#1E2445]' : 'border-slate-100'
                )}>
                  <th className="py-3 px-3">Borrower & Code</th>
                  <th className="py-3 px-3">Disbursed Loan</th>
                  <th className="py-3 px-3">EMI Payment Health</th>
                  <th className="py-3 px-3">DPD Staging</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2445]">
                {filteredCustomers.map((cust: any) => {
                  const initial = (cust.firstName?.[0] || cust.name?.[0] || 'B').toUpperCase();
                  const isDelinquent = cust.hasOverdue || cust.dpd > 0;

                  return (
                    <tr
                      key={cust.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-[#1E2445]/40"
                    >
                      {/* Borrower Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white',
                            isDelinquent ? 'bg-rose-600' : 'bg-[#2563EB]'
                          )}>
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/customers/${cust.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-500 hover:underline"
                            >
                              {cust.name}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono">{cust.customerCode}</span>
                              <span>·</span>
                              <span>📞 {cust.mobile || '-'}</span>
                              {cust.city && (
                                <>
                                  <span>·</span>
                                  <span>{cust.city}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Disbursed Loan Details */}
                      <td className="py-3.5 px-3">
                        {cust.activeLoanNo ? (
                          <div>
                            <span className="font-mono font-bold text-blue-500">
                              Loan #{cust.activeLoanNo}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {cust.emiAmount ? (
                                <span>EMI: {formatMoney(cust.emiAmount)}</span>
                              ) : null}
                              <span className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase",
                                cust.loanStatus === 'OVERDUE'
                                  ? "bg-rose-500/10 text-rose-500"
                                  : "bg-emerald-500/10 text-emerald-500"
                              )}>
                                {cust.loanStatus || 'ACTIVE'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Active Loan Active</span>
                        )}
                      </td>

                      {/* EMI Payment Health */}
                      <td className="py-3.5 px-3">
                        {isDelinquent ? (
                          <div>
                            <p className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                              {formatMoney(cust.overdueAmount || 0)}
                            </p>
                            <p className="text-[10px] text-rose-500 font-semibold">Unpaid Overdue EMI</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>On-Time Paid</span>
                          </div>
                        )}
                      </td>

                      {/* DPD Staging */}
                      <td className="py-3.5 px-3">
                        {cust.dpd > 0 ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block",
                            cust.dpd > 90
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : cust.dpd > 60
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : cust.dpd > 30
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          )}>
                            {cust.dpd} DPD · {cust.agingBucket || 'SMA'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-block">
                            0 DPD (Current)
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3">
                        {cust.priority ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase",
                            cust.priority === 'CRITICAL' || cust.priority === 'HIGH'
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}>
                            {cust.priority}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">NORMAL</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDelinquent && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openActivityLog(cust)}
                              className="h-7.5 px-2 text-[11px] font-semibold"
                              title="Log Call / Follow-up"
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Log Call
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => openDirectPay(cust)}
                            className="h-7.5 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Record Collected Repayment"
                          >
                            <Coins className="h-3 w-3 mr-1" />
                            Collect
                          </Button>

                          <Link href={`/customers/${cust.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7.5 px-2 text-[11px] text-blue-500"
                              title="View Customer Profile"
                            >
                              View →
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                No disbursed borrower profiles matching the selected filter.
              </p>
              <p className="text-slate-400 text-[11px]">
                Only borrowers with active disbursed loans appear in the Collection Officer directory.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1E2445] text-xs">
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total borrowers)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. MODALS */}
      {/* Activity Modal */}
      {selectedCase && (
        <ContactActivityModal
          isOpen={activityModalOpen}
          onClose={() => {
            setActivityModalOpen(false);
            setSelectedCase(null);
          }}
          caseItem={selectedCase}
        />
      )}

      {/* Direct Repayment Modal */}
      {directPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-all',
              isDark ? 'bg-[#0C152B] border-[#1E2445] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2445]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    Record Direct EMI Repayment
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Post borrower repayment and settle against active loan installment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Repayment Amount (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Payment Channel *
                </label>
                <select
                  value={directMethod}
                  onChange={(e) => setDirectMethod(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none',
                    isDark ? 'border-[#1E2445] bg-[#1E2445] text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                  )}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="IMPS">IMPS Instant Transfer</option>
                  <option value="CASH">Branch Cash Counter</option>
                  <option value="CHEQUE">Cheque / DD</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Bank Transaction / UTR Reference
                </label>
                <Input
                  value={directRef}
                  onChange={(e) => setDirectRef(e.target.value)}
                  placeholder="e.g. UPI-9988771122 or BANK-NEFT-5544"
                />
              </div>

              <div>
                <label className={cn('block font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Settlement Notes
                </label>
                <Input
                  value={directNotes}
                  onChange={(e) => setDirectNotes(e.target.value)}
                  placeholder="e.g. Installment collected on follow-up"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1E2445] border border-blue-100 dark:border-[#1E2445] text-[11px] text-blue-900 dark:text-blue-200">
                <p className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                  <Layers className="w-3.5 h-3.5" /> Automated Waterfall Allocation:
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  1. Fees ➔ 2. Penalties ➔ 3. Overdue Interest ➔ 4. Principal
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1E2445]">
                <Button variant="ghost" size="sm" onClick={() => setDirectPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!directLoanId || !directAmount || directPaymentMutation.isPending}
                  onClick={() => directPaymentMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {directPaymentMutation.isPending ? 'Recording...' : 'Confirm & Post Repayment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
