'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge } from '@/components/ui';
import { collectionsApi } from '@/features/collections/api';

export default function EscalationsPage() {
  const { data: casesData, isLoading } = useQuery({
    queryKey: ['collection-cases-escalated'],
    queryFn: () => collectionsApi.listCases({ status: 'ESCALATED', pageSize: 50 }),
  });

  const escalatedCases = casesData?.data || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Escalated Delinquency Desk"
        subtitle="Review high-risk collection cases escalated to supervisory tiers or legal recovery desks."
      />

      <Card className="border-slate-800 bg-slate-900 p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-left">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Case / Customer</th>
                <th className="py-3 px-4">Loan No</th>
                <th className="py-3 px-4">Overdue Amount</th>
                <th className="py-3 px-4">DPD & Bucket</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading escalated accounts...</td>
                </tr>
              ) : escalatedCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No active escalated cases requiring supervisory review.</td>
                </tr>
              ) : (
                escalatedCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{c.customerName}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{c.caseNo}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{c.loanNo}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">₹{Number(c.overdueAmount).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        DPD {c.dpd} ({c.agingBucket})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="danger">{c.priority}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/collections/${c.id}`} className="text-blue-400 hover:underline">
                        Review Case
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
