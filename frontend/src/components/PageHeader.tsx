'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumb?: string;
}) {
  const { isDark } = useTheme();

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {breadcrumb}
          </p>
        )}
        <h1 className={cn("text-xl font-bold tracking-tight break-words", isDark ? "text-white" : "text-slate-900")}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn("mt-0.5 text-xs break-words", isDark ? "text-slate-400" : "text-slate-500")}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}
