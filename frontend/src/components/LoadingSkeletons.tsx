'use client';

import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Card } from './ui';

export function Skeleton({ className }: { className?: string }) {
  const { isDark } = useTheme();
  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        isDark ? 'bg-slate-800/80' : 'bg-slate-200/80',
        className
      )}
    />
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  const { isDark } = useTheme();

  return (
    <Card
      noPadding
      className={cn(
        'overflow-hidden border',
        isDark ? 'border-[#2B3566] bg-[#1E2445]' : 'border-slate-200/80 bg-white'
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 py-2.5 items-center">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={cn('h-4 flex-1', colIndex === 0 ? 'w-24' : '')}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function KpiCardSkeleton() {
  const { isDark } = useTheme();
  return (
    <Card className={cn('p-5 space-y-3', isDark ? 'border-[#2B3566] bg-[#1E2445]' : 'border-slate-200/80 bg-white')}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-40 mt-2" />
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Breadcrumb */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Main Tabbed Content */}
      <Card className="p-6 space-y-4">
        <div className="flex gap-4 border-b pb-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Card>
    </div>
  );
}
