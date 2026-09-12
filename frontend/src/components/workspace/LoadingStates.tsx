'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function WorkspaceLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Top metric cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
        ))}
      </div>

      {/* Main chart / table skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800/60 lg:col-span-2" />
        <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
      </div>

      {/* Bottom table skeleton */}
      <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800/60 mb-4" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-850" />
      ))}
    </div>
  );
}
