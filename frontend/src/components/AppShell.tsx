'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { WorkspaceProvider, useWorkspace } from '@/lib/workspace/useWorkspace';
import { AppSidebar } from './workspace/AppSidebar';
import { AppHeader } from './workspace/AppHeader';
import { BorrowerShell } from './borrower/BorrowerShell';
import { NavigationProgressBar } from './NavigationProgressBar';
import { cn } from '@/lib/utils';

function InnerAppShell({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { loading: wsLoading, activeWorkspace } = useWorkspace();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Automatic redirect if unauthenticated without blank screen hang
  useEffect(() => {
    if (!authLoading && !user && pathname && !pathname.startsWith('/login')) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, user, pathname, router]);

  if (authLoading || wsLoading) {
    return (
      <div
        className={cn(
          'flex h-screen w-full items-center justify-center transition-colors',
          isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={cn(
          'flex h-screen w-full items-center justify-center transition-colors',
          isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Authenticating Session</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Redirecting to login portal...</p>
        </div>
      </div>
    );
  }

  // Borrower self-service portal layout delegation
  if (pathname.startsWith('/borrower')) {
    return <BorrowerShell>{children}</BorrowerShell>;
  }

  return (
    <div
      className={cn(
        'flex h-screen w-full overflow-hidden transition-colors duration-200',
        isDark ? 'dark bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      )}
    >
      {/* Route Transition Progress Bar */}
      <NavigationProgressBar />

      {/* Unified Configuration-Driven Sidebar */}
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-72">
        {/* Unified Application Header */}
        <AppHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <InnerAppShell>{children}</InnerAppShell>
    </WorkspaceProvider>
  );
}
