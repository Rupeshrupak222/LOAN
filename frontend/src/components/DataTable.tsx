'use client';

import { ReactNode } from 'react';
import { Card, EmptyState } from './ui';
import { Skeleton } from './LoadingSkeletons';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyAction,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const { isDark } = useTheme();

  return (
    <Card
      noPadding
      className={cn(
        "overflow-hidden border transition-all",
        isDark ? "border-[#2B3566] bg-[#1E2445]" : "border-slate-200/80 bg-white shadow-2xs"
      )}
    >
      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn(
              "border-b text-[11px] font-bold uppercase tracking-wider",
              isDark
                ? "border-[#2B3566] bg-[#16203D] text-slate-400"
                : "border-slate-200 bg-slate-50/80 text-slate-500"
            )}>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-4 py-3.5 whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.className ?? ''
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y",
              isDark
                ? "divide-[#2B3566] text-slate-200"
                : "divide-slate-100 text-slate-700"
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-row-${i}`} className="animate-pulse">
                  {columns.map((c, colIndex) => (
                    <td
                      key={`skeleton-cell-${i}-${c.key}`}
                      className={cn(
                        'px-4 py-3.5 whitespace-nowrap',
                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                        c.className ?? ''
                      )}
                    >
                      <Skeleton className={cn("h-4", colIndex === 0 ? "w-28" : colIndex === columns.length - 1 ? "w-16" : "w-20")} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn(
              "border-b text-[11px] font-bold uppercase tracking-wider",
              isDark
                ? "border-[#2B3566] bg-[#16203D] text-slate-400"
                : "border-slate-200 bg-slate-50/80 text-slate-500"
            )}>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-4 py-3.5 whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.className ?? ''
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn(
              "divide-y",
              isDark
                ? "divide-[#2B3566] text-slate-200"
                : "divide-slate-100 text-slate-700"
            )}>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70"
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 py-3.5 text-xs sm:text-sm whitespace-nowrap',
                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                        c.className ?? ''
                      )}
                    >
                      {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
