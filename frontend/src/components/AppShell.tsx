'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Calculator,
  Wallet,
  ShieldCheck,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Spinner } from './ui';
import { Logo } from './Logo';
import { useEffect } from 'react';
import { NAV_ROUTES, NavKey, roleConfigFor } from '@/lib/roles';

const NAV_ICONS: Record<NavKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  customers: Users,
  'loan-products': Package,
  applications: FileText,
  'emi-calculator': Calculator,
  loans: Wallet,
  'audit-logs': ShieldCheck,
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    // Keep users out of features their role can't access.
    if (loading || !user) return;
    const allowedHrefs = roleConfigFor(user.roles).nav.map((k) => NAV_ROUTES[k].href);
    const matchesAllowed = allowedHrefs.some(
      (href) => pathname === href || pathname.startsWith(href + '/'),
    );
    if (!matchesAllowed) router.replace('/dashboard');
  }, [loading, user, pathname, router]);

  if (loading) return <Spinner />;
  if (!user) return null;

  const roleCfg = roleConfigFor(user.roles);
  const nav = roleCfg.nav.map((key) => ({
    key,
    href: NAV_ROUTES[key].href,
    label: NAV_ROUTES[key].label,
    icon: NAV_ICONS[key],
  }));

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-ink-900 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative flex h-16 items-center px-5">
          <div className="absolute inset-0 bg-brand-radial opacity-70" />
          <Logo variant="light" size={34} className="relative z-10" />
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-accent-400" />
                )}
                <Icon className={cn('h-4 w-4', active ? 'text-accent-400' : '')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-medium text-white/50">Signed in as</p>
          <p className="truncate text-sm font-semibold text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-[11px] text-accent-400">{roleCfg.label}</p>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-20 bg-ink-900/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-slate-400">{roleCfg.label}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-glow">
              {initials || 'A'}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div className="animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
