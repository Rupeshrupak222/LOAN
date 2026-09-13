'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/utils';

export default function ReviewCompletePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications-review'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 50, status: 'DRAFT' } });
      return res.data?.data || [];
    },
  });

  const apps = Array.isArray(data) ? data : [];
  // For Review & Complete, show apps where KYC is verified
  const reviewApps = apps.filter(a => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED');

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Origination / Review & Complete"
        title="Review & Complete"
        subtitle="FINAL pre-submission verification desk. Verify documents and application details before submitting to credit."
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        {isLoading ? (
          <div className="py-10 text-center text-slate-500">Loading...</div>
        ) : reviewApps.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No applications pending review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Checklist Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reviewApps.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <Link href={`/applications/${app.id}`} className="font-bold text-blue-600 hover:underline">
                        {app.applicationNo}
                      </Link>
                      <p className="text-xs text-slate-500">{formatDate(app.createdAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold">{app.customerName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{app.product}</p>
                      <p className="text-xs text-slate-500">₹{formatMoney(app.requestedAmount)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Review
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/applications/${app.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
                          Review Checklist <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
