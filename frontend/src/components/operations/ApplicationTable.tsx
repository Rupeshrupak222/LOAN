'use client';

import React from 'react';
import Link from 'next/link';
import { User, ChevronLeft, ChevronRight, Eye, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  applications: any[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function ApplicationTable({ applications, meta, loading, onPageChange }: Props) {
  const priorityBadges: Record<string, { bg: string; text: string }> = {
    URGENT: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40', text: 'URGENT' },
    HIGH: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40', text: 'HIGH' },
    MEDIUM: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40', text: 'MEDIUM' },
    LOW: { bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800', text: 'LOW' },
  };

  const stageBadges: Record<string, { bg: string; text: string }> = {
    LEAD: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', text: 'Lead' },
    APPLICATION_STARTED: { bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300', text: 'Started' },
    APPLICATION_SUBMITTED: { bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300', text: 'Submitted' },
    DOCUMENT_VERIFICATION: { bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300', text: 'Docs Review' },
    CREDIT_ASSESSMENT: { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300', text: 'Credit Desk' },
    UNDERWRITING: { bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300', text: 'Underwriting' },
    APPROVAL: { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300', text: 'Approval' },
    SANCTION: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', text: 'Sanction' },
    DISBURSEMENT: { bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300', text: 'Disbursement' },
    DISBURSED: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', text: 'Disbursed' },
    ACTIVE: { bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', text: 'Active Loan' },
    REJECTED: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400', text: 'Rejected' },
    CLOSED: { bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', text: 'Closed' },
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Application No</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Product / Amount</th>
              <th className="py-3.5 px-4">Stage</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Assigned To</th>
              <th className="py-3.5 px-4">Updated</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  No applications match your filter criteria.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const priority = priorityBadges[app.priority || 'MEDIUM'] || priorityBadges.MEDIUM;
                const stage = stageBadges[app.stage || 'LEAD'] || { bg: 'bg-slate-100 text-slate-700', text: app.stage };

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <Link href={`/applications/${app.id}`} className="hover:underline flex items-center gap-1.5">
                        {app.applicationNo}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {app.customer?.firstName} {app.customer?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {app.customer?.customerCode} • {app.customer?.mobile}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₹{Number(app.requestedAmount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {app.product?.name || 'Personal Loan'} ({app.tenureMonths}m)
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${stage.bg}`}>
                        {stage.text}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${priority.bg}`}>
                        {priority.text}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {app.assignedToUser ? (
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{app.assignedToUser.firstName} {app.assignedToUser.lastName}</span>
                        </div>
                      ) : app.queue ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {app.queue.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(app.updatedAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{applications.length}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.total}</span> applications
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {meta.page} of {meta.totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
