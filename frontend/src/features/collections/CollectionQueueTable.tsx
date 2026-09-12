'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Calendar,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Filter,
  Search,
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import type { CollectionCaseSummary } from './types';

interface CollectionQueueTableProps {
  cases: CollectionCaseSummary[];
  isLoading: boolean;
  selectedBucket: string;
  onSelectBucket: (bucket: string) => void;
  queueType: 'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | 'ALL';
  onSelectQueueType: (type: 'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenActivity: (caseItem: CollectionCaseSummary) => void;
  onOpenPtp: (caseItem: CollectionCaseSummary) => void;
  onOpenAssign: (caseItem: CollectionCaseSummary) => void;
  onOpenEscalate: (caseItem: CollectionCaseSummary) => void;
}

export function CollectionQueueTable({
  cases,
  isLoading,
  selectedBucket,
  onSelectBucket,
  queueType,
  onSelectQueueType,
  searchQuery,
  onSearchChange,
  onOpenActivity,
  onOpenPtp,
  onOpenAssign,
  onOpenEscalate,
}: CollectionQueueTableProps) {
  const buckets = [
    { label: 'All Buckets', value: '' },
    { label: 'DPD 1–30', value: '0-30' },
    { label: 'DPD 31–60', value: '31-60' },
    { label: 'DPD 61–90', value: '61-90' },
    { label: 'DPD 91–180', value: '91-180' },
    { label: 'DPD 180+', value: '180+' },
  ];

  const getPriorityBadge = (priority: string, score: number) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="danger" className="font-semibold">CRITICAL ({score})</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className="font-semibold">HIGH ({score})</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" className="font-medium">MEDIUM ({score})</Badge>;
      default:
        return <Badge variant="default" className="font-medium">LOW ({score})</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return <Badge variant="success">{status}</Badge>;
      case 'PROMISED':
        return <Badge variant="info">PTP ACTIVE</Badge>;
      case 'ESCALATED':
      case 'LEGAL_REVIEW':
        return <Badge variant="danger">{status}</Badge>;
      case 'SETTLEMENT_REVIEW':
        return <Badge variant="warning">SETTLEMENT</Badge>;
      case 'WRITTEN_OFF':
        return <Badge variant="danger">WRITTEN OFF</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Queue Type Tabs */}
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/60 p-1">
          {[
            { id: 'ALL', label: 'All Queues' },
            { id: 'MY_QUEUE', label: 'My Queue' },
            { id: 'TEAM_QUEUE', label: 'Team Queue' },
            { id: 'UNASSIGNED', label: 'Unassigned' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectQueueType(tab.id as any)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                queueType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Buckets */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, loan, phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {buckets.map((b) => (
              <button
                key={b.value}
                onClick={() => onSelectBucket(b.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md border transition-all whitespace-nowrap',
                  selectedBucket === b.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Case / Customer</th>
                <th className="py-3 px-4">Loan Details</th>
                <th className="py-3 px-4">Overdue & DPD</th>
                <th className="py-3 px-4">Priority & Strategy</th>
                <th className="py-3 px-4">PTP / Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p className="text-xs">Loading collection queue...</p>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">No Delinquent Cases in Queue</p>
                    <p className="text-xs text-slate-500 mt-1">All accounts are currently in good standing or filter criteria returned zero results.</p>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Case & Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Link href={`/collections/${c.id}`} className="hover:text-blue-400 transition-colors">
                          {c.caseNo}
                        </Link>
                        {getStatusBadge(c.status)}
                      </div>
                      <div className="text-slate-300 font-medium mt-0.5">{c.customerName}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-2">
                        <span>{c.mobile}</span>
                        {c.city && <span>• {c.city}</span>}
                      </div>
                    </td>

                    {/* Loan Details */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200">{c.loanNo}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        EMI: ₹{Number(c.emiAmount).toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Due: {c.nextDueDate ? formatDate(c.nextDueDate) : 'N/A'}
                      </div>
                    </td>

                    {/* Overdue & DPD */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-rose-400 text-sm">
                        ₹{Number(c.overdueAmount).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          c.dpd > 90 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          c.dpd > 30 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-blue-950 text-blue-300 border border-blue-800'
                        )}>
                          DPD {c.dpd}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          Bucket {c.agingBucket}
                        </span>
                      </div>
                    </td>

                    {/* Priority & Strategy */}
                    <td className="py-3 px-4">
                      <div>{getPriorityBadge(c.priority, c.priorityScore)}</div>
                      <div className="text-[11px] text-slate-300 font-medium mt-1 truncate max-w-[180px]" title={c.recommendedAction}>
                        {c.recommendedAction}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Phase: {c.strategyPhase}
                      </div>
                    </td>

                    {/* PTP / Follow-up */}
                    <td className="py-3 px-4">
                      {c.latestPtpAmount ? (
                        <div>
                          <span className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                            c.latestPtpStatus === 'KEPT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            c.latestPtpStatus === 'BROKEN' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          )}>
                            PTP ₹{Number(c.latestPtpAmount).toLocaleString()}
                          </span>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            By {c.latestPtpDate ? formatDate(c.latestPtpDate) : 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[11px]">No active PTP</div>
                      )}
                      {c.nextFollowUpDate && (
                        <div className="text-slate-400 text-[10px] mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-400" />
                          Follow-up: {formatDate(c.nextFollowUpDate)}
                        </div>
                      )}
                    </td>

                    {/* Action Triggers */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenActivity(c)}
                          title="Log Contact Activity"
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenPtp(c)}
                          title="Record Promise to Pay"
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAssign(c)}
                          title="Assign Collector"
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEscalate(c)}
                          title="Escalate Case"
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 transition-colors"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/collections/${c.id}`}
                          className="p-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Case Docket"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
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
