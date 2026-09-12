'use client';

import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <Icon className="h-7 w-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{description}</p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
