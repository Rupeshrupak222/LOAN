'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, User, AlertCircle, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  applications: any[];
  loading: boolean;
  onClaim?: (id: string) => void;
}

export function RequiresAttentionTable({ applications, loading, onClaim }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const priorityBadges: Record<string, { bg: string; text: string }> = {
    URGENT: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40', text: 'URGENT' },
    HIGH: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40', text: 'HIGH' },
    MEDIUM: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40', text: 'MEDIUM' },
    LOW: { bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800', text: 'LOW' },
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Operational Work Queue — Requires Attention
          </h3>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {applications.length} items
          </span>
        </div>
        <Link
          href="/applications"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Full Directory <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Immediate Attention Items</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All high-priority queues and assignments are up to date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Queue / Owner</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {applications.slice(0, 8).map((app) => {
                const p = priorityBadges[app.priority || 'MEDIUM'] || priorityBadges.MEDIUM;
                return (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <Link href={`/applications/${app.id}`} className="hover:underline">
                        {app.applicationNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {app.customer?.firstName} {app.customer?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {app.customer?.customerCode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {app.stage || 'LEAD'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${p.bg}`}>
                        {p.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {app.assignedToUser ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User className="h-3 w-3 text-slate-400" />
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
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(app.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!app.assignedToUserId && onClaim && (
                          <button
                            onClick={() => onClaim(app.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 transition-colors"
                          >
                            Claim
                          </button>
                        )}
                        <Link
                          href={`/applications/${app.id}`}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                        >
                          Review
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
    </div>
  );
}
