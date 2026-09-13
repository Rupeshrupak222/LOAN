'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Mail } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/useWorkspace';

export function UnauthorizedPage({ moduleName }: { moduleName?: string }) {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-3xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xl shadow-rose-500/5">
          <ShieldAlert className="h-10 w-10 stroke-[1.75]" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-[10px] font-bold text-white border-2 border-white dark:border-slate-950">
          403
        </div>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl mb-2">
        Access Restricted
      </h1>

      <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        You do not have the required permissions or role assignments to view{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-200">{moduleName || 'this module'}</span>.
        Please contact your institutional administrator or switch to an authorized workspace.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        <button
          type="button"
          onClick={() => router.push(activeWorkspace?.defaultRoute || '/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all"
        >
          <Home className="h-4 w-4" />
          Go to My Workspace
        </button>

        <a
          href="mailto:admin@adyapan.com?subject=Access%20Request%20for%20Module"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm transition-all"
        >
          <Mail className="h-4 w-4" />
          Contact Administrator
        </a>
      </div>
    </div>
  );
}
