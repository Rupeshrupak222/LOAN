'use client';

import React from 'react';
import {
  FileText,
  Clock,
  UserCheck,
  AlertTriangle,
  FolderCheck,
  Zap,
} from 'lucide-react';
import { OperationsOverviewMetrics } from '@/lib/api/operations';

interface Props {
  metrics: OperationsOverviewMetrics | null;
  loading: boolean;
}

export function OverviewMetricsCards({ metrics, loading }: Props) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/60 dark:border-slate-800"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Applications Today',
      value: metrics.applicationsToday,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-200 dark:border-blue-900/40',
    },
    {
      title: 'Pending In Pipeline',
      value: metrics.pendingApplications,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-900/40',
    },
    {
      title: 'Assigned to Me',
      value: metrics.assignedToMe,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasks,
      icon: AlertTriangle,
      color: metrics.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400',
      bg: metrics.overdueTasks > 0 ? 'bg-red-500/10' : 'bg-slate-500/10',
      border: metrics.overdueTasks > 0 ? 'border-red-200 dark:border-red-900/40' : 'border-slate-200 dark:border-slate-800',
    },
    {
      title: 'Pending Documents',
      value: metrics.pendingDocuments,
      icon: FolderCheck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-200 dark:border-indigo-900/40',
    },
    {
      title: 'Requires Action',
      value: metrics.requiresAction,
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-200 dark:border-purple-900/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900/60 border ${card.border} shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
