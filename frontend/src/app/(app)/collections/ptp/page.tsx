'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { collectionsApi } from '@/features/collections/api';
import Link from 'next/link';

export default function PromisesToPayPage() {
  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases-ptp'],
    queryFn: () => collectionsApi.listCases({ pageSize: 50 }),
  });

  const ptpCases = (casesData?.data || []).filter((c) => Boolean(c.latestPtpAmount));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Promises to Pay (PTP) Tracker"
        subtitle="Monitor active borrower payment commitments, upcoming due dates, and track broken promise histories."
      />

      <Card className="p-5 shadow-sm dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700 dark:text-slate-300 text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Case / Customer</th>
                <th className="py-3 px-4">Loan No</th>
                <th className="py-3 px-4">Promised Amount</th>
                <th className="py-3 px-4">Promised Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading PTP records...</td>
                </tr>
              ) : ptpCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No active promises to pay on record.</td>
                </tr>
              ) : (
                ptpCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.customerName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{c.caseNo}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">{c.loanNo}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{Number(c.latestPtpAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{c.latestPtpDate ? formatDate(c.latestPtpDate) : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={c.latestPtpStatus === 'KEPT' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : c.latestPtpStatus === 'BROKEN' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                        {c.latestPtpStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/collections/${c.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                        View Case Docket
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
