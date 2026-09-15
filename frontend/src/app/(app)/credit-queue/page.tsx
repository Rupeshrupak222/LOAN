'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/LoadingSkeletons';

export default function CreditQueuePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['credit-queue-live', statusFilter, searchTerm],
    queryFn: async () => {
      const res = await api.get('/credit-assessment/queue', {
        params: {
          tab: statusFilter,
          search: searchTerm || undefined,
        },
      });
      return res.data?.data || [];
    },
  });

  const rawItems: any[] = Array.isArray(data) ? data : [];

  const queueItems = rawItems.filter((item) => {
    if (customerTypeFilter === 'ALL') return true;
    const emp = (item.employmentType || '').toUpperCase();
    return emp.includes(customerTypeFilter);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Credit Queue</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
              {queueItems.length} Applications Actionable
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Real-time assigned applications awaiting sequential credit assessment, KYC verification, and recommendation handoff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetch();
              toast.info('Refreshed', 'Credit queue updated with latest live proposals.');
            }}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-[#1E2445] border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E2445]/80 shadow-xs cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#0C152B] border border-gray-200 dark:border-[#1E2445] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Awaiting Assessment</span>
            <Inbox className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
            {queueItems.filter((i) => ['SUBMITTED', 'UNDER_REVIEW'].includes(i.status)).length}
          </div>
          <p className="text-xs text-gray-400 mt-1">Pending Initial Credit Intake</p>
        </div>

        <div className="p-4 bg-white dark:bg-[#0C152B] border border-gray-200 dark:border-[#1E2445] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Assessment In Progress</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
            {queueItems.filter((i) => i.status === 'CREDIT_ASSESSMENT').length}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active Financial &amp; Risk Scoring</p>
        </div>

        <div className="p-4 bg-white dark:bg-[#0C152B] border border-gray-200 dark:border-[#1E2445] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">KYC Pending</span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {queueItems.filter((i) => i.kycStatus !== 'VERIFIED').length}
          </div>
          <p className="text-xs text-rose-400 mt-1">Unverified Aadhaar/PAN Verification</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-[#0C152B] p-4 rounded-xl border border-gray-200 dark:border-[#1E2445] shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search queue by applicant, code, or application #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1E2445] text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-[#1E2445] focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Borrower Types</option>
            <option value="SALARIED">Salaried</option>
            <option value="SELF">Self-Employed / Non-Salaried</option>
            <option value="STUDENT">Student</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-[#1E2445] focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Queue Items</option>
            <option value="PENDING">Pending Assessment Intake</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="KYC_PENDING">KYC Pending</option>
            <option value="COMPLETED">Ready / Completed</option>
            <option value="SENT_BACK">Returned to Loan Officer</option>
          </select>
        </div>
      </div>

      {/* Applications Queue Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : queueItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0C152B] border border-gray-200 dark:border-[#1E2445] rounded-xl space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">No Applications in Credit Queue</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            There are currently no proposals matching your filter. Submitting proposals from the Loan Officer portal will automatically populate this queue in real-time.
          </p>
          <Link href="/applications">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer">
              <FileText className="w-4 h-4" /> View All Applications Repository
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0C152B] border border-gray-200 dark:border-[#1E2445] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 dark:bg-[#1E2445]/60 border-b border-gray-200 dark:border-[#1E2445] text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Application #</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Product &amp; Amount</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Docs Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {queueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-[#1E2445]/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">{item.applicationNo || 'N/A'}</div>
                      <div className="text-xs text-gray-400">
                        {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{item.applicantName || 'Applicant'}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.employmentType || 'GENERAL'}
                        </span>
                        {item.mobile && <span>· {item.mobile}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-900 dark:text-slate-100 font-bold">{formatMoney(item.requestedAmount || 0)}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{item.productName || 'Loan Product'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : item.kycStatus === 'UNDER_REVIEW'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                          : item.kycStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          : item.kycStatus === 'NOT_STARTED'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}>
                        {item.kycStatus === 'VERIFIED'
                          ? '✓ VERIFIED'
                          : item.kycStatus === 'UNDER_REVIEW'
                          ? 'UNDER REVIEW'
                          : item.kycStatus === 'REJECTED'
                          ? '✕ REJECTED'
                          : item.kycStatus === 'NOT_STARTED'
                          ? 'NOT STARTED'
                          : 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {Number(item.documentsCount || 0) === 0
                          ? '0 Uploaded'
                          : `${item.verifiedDocumentsCount || 0} / ${item.documentsCount} Verified`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/credit-assessment?applicationId=${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
                      >
                        Start Assessment
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

