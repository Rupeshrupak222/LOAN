'use client';

import React, { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { canAccessRoute } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === 'dark';

  if (loading) {
    return <>{children}</>;
  }

  // If unauthenticated or no user, AppShell handles login redirection
  if (!user) {
    return <>{children}</>;
  }

  // Super Admin can access everything
  if (user.roles?.includes('SUPER_ADMIN')) {
    return <>{children}</>;
  }

  // Check if route is permitted
  const hasAccess = canAccessRoute(user, pathname);

  if (!hasAccess) {
    return (
      <div
        className={cn(
          'flex min-h-[70vh] w-full flex-col items-center justify-center p-6 text-center transition-colors',
          isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        )}
      >
        <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">
              403 • Access Restricted
            </span>
            <h2 className="text-lg font-bold text-white">Unauthorized Workspace Area</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your assigned role <span className="font-semibold text-slate-200">({user.roles?.join(', ')})</span> does not have the required permissions to access <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-blue-400">{pathname}</code>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security & Governance Policy</p>
            <p className="text-xs text-slate-400 mt-1">
              Adyapan Lending OS enforces strict banking RBAC and Segregation of Duties (SoD). If you require access, please contact your Tenant Administrator or Compliance Officer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Go Back</span>
            </button>
            <button
              onClick={() => router.push(user.roles?.includes('CUSTOMER') ? '/customer/dashboard' : '/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/30"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
