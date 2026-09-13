'use client';

import React from 'react';
import Link from 'next/link';
import { Send, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/utils';

export default function SubmitToCreditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['applications-submit'],
    queryFn: async () => {
      const res = await api.get('/applications', { params: { pageSize: 50, status: 'DRAFT' } });
      return res.data?.data || [];
    },
  });

  const apps = Array.isArray(data) ? data : [];
  // For Submit to Credit, show apps where KYC is verified and all mandatory gates passed
  // (Assuming backend will authoritative block if something is missing, but frontend can filter optimistic)
  const submitApps = apps.filter(a => a.status === 'DRAFT' && a.kycStatus === 'VERIFIED');

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Origination / Submit to Credit"
        title="Submit to Credit"
        subtitle="Mandatory gateway for submitting completed application packages to the Credit Analyst queue."
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        {isLoading ? (
          <div className="py-10 text-center text-slate-500">Loading...</div>
        ) : submitApps.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No applications ready for submission.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submitApps.map((app: any) => (
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
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Send className="w-3.5 h-3.5" /> Ready for Submission
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/applications/${app.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                          Open Submission <ArrowRight className="w-3.5 h-3.5" />
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
