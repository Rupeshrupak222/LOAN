'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Building2,
  DollarSign,
  Receipt,
  AlertCircle,
  BarChart3,
  KeyRound,
  ShieldCheck,
  ScrollText,
  LogOut,
  Menu,
  Search,
  Bell,
  Layers,
  Sun,
  Moon,
  Wallet,
  Calculator,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, NAV_ITEMS, RoleName, NavItemConfig } from '@/lib/roles';
import { Spinner } from './ui';
import { NotificationBell } from './NotificationBell';

const NAV_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  customers: Users,
  applications: FileText,
  products: Building2,
  'loan-products': Building2,
  underwriting: FileCheck,
  loans: DollarSign,
  disbursements: Wallet,
  payments: Receipt,
  collections: AlertCircle,
  reports: BarChart3,
  'emi-calculator': Calculator,
  users: KeyRound,
  roles: KeyRound,
  settings: ShieldCheck,
  permissions: ShieldCheck,
  branches: Building2,
  'audit-logs': ScrollText,
};

const GROUP_ORDER = ['OVERVIEW', 'CUSTOMERS', 'LENDING', 'SERVICING', 'INSIGHTS', 'ADMINISTRATION'] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) return <Spinner />;
  if (!user) return null;

  const primaryRole = (user.roles?.[0] || 'CUSTOMER') as RoleName;
  const roleCfg = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.CUSTOMER;
  const accessibleNav = roleCfg.nav.map((k) => NAV_ITEMS[k]).filter(Boolean);

  const groupedNav: Record<string, NavItemConfig[]> = {
    OVERVIEW: [],
    CUSTOMERS: [],
    LENDING: [],
    SERVICING: [],
    INSIGHTS: [],
    ADMINISTRATION: [],
  };

  accessibleNav.forEach((item) => {
    if (groupedNav[item.group]) {
      groupedNav[item.group].push(item);
    }
  });

  const currentItem = accessibleNav.find(
    (item) => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );
  const isDashboard = pathname === '/dashboard';
  const isAccessibleRoute = isDashboard || accessibleNav.some(
    (item) => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );
  const currentLabel = currentItem?.label || 'Dashboard';
  const CurrentIcon = NAV_ICONS[currentItem?.key || 'dashboard'] || LayoutDashboard;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    if (/^APP-/i.test(q)) {
      router.push(`/applications?search=${encodeURIComponent(q)}`);
    } else if (/^LN-/i.test(q)) {
      router.push(`/loans?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/customers?search=${encodeURIComponent(q)}`);
    }
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'AD';

  return (
    <div className={cn("flex h-screen w-full overflow-hidden transition-colors duration-200", isDark ? "dark bg-[#060F1B] text-slate-100" : "bg-[#f8fafc] text-slate-900")}>
      {/* Sidebar - Always Sleek Dark Navy */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex h-full w-64 flex-col flex-none border-r border-[#1E2445]/80 bg-[#060F1B] transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 flex-none items-center justify-between px-5 border-b border-[#1E2445]/80">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold shadow-sm shadow-[#2563EB]/25">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none">
                {primaryRole === 'CUSTOMER' ? 'ADYAPAN PORTAL' : primaryRole === 'AUDITOR' ? 'ADYAPAN AUDIT' : 'ADYAPAN LMS'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                {primaryRole === 'CUSTOMER'
                  ? 'Borrower Self-Service'
                  : primaryRole === 'AUDITOR'
                  ? 'Compliance & Audit'
                  : roleCfg.label}
              </p>
            </div>
          </Link>
        </div>

        {/* Grouped Nav List */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-[#1E2445]">
          {GROUP_ORDER.map((group) => {
            const items = groupedNav[group];
            if (!items.length) return null;

            return (
              <div key={group} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group}
                </p>
                <div className="space-y-0.5 pt-1">
                  {items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = NAV_ICONS[item.key] || LayoutDashboard;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
                          active
                            ? 'bg-[#2563EB] text-white font-bold shadow-sm shadow-[#2563EB]/30'
                            : 'text-slate-300 font-medium hover:bg-white/6 hover:text-white'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-none transition-colors stroke-[2]',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="m-3 flex-none rounded-xl border border-[#1E2445] bg-[#1E2445]/60 p-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white shadow-sm shadow-[#2563EB]/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-400 mt-0.5">{roleCfg.label}</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-[#10B981]" title="Online" />
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area with independent scroll */}
      <div className={cn("flex flex-1 flex-col h-full min-w-0 overflow-y-auto overscroll-contain transition-colors", isDark ? "bg-[#060F1B]" : "bg-[#f8fafc]")}>
        {/* Top Header */}
        <header className={cn(
          "sticky top-0 z-10 flex h-16 flex-none items-center justify-between border-b px-4 sm:px-6 backdrop-blur transition-colors",
          isDark ? "border-[#1E2445] bg-[#060F1B]/95" : "border-slate-200/80 bg-white/95"
        )}>
          {/* Left: Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border lg:hidden",
                isDark ? "border-[#1E2445] text-slate-300 hover:bg-[#1E2445]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs",
              isDark ? "border-[#1E2445] bg-[#1E2445]/70 text-white" : "border-slate-200/80 bg-slate-50/90 text-slate-800"
            )}>
              <CurrentIcon className={cn("h-3.5 w-3.5", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")} />
              <span>{currentLabel}</span>
            </div>
          </div>

          {/* Center: Global Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className={cn("absolute left-3.5 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-slate-400")} />
              <input
                type="text"
                placeholder="Search borrower, customer ID (CUST-1), loan # (LN-..), application..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-xl border pl-9 pr-14 text-xs placeholder:text-slate-400 transition-all focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10",
                  isDark
                    ? "border-[#1E2445] bg-[#1E2445]/60 text-slate-100 focus:bg-[#1E2445]"
                    : "border-slate-200/90 bg-slate-50/70 text-slate-800 focus:bg-white"
                )}
              />
              <kbd className={cn(
                "absolute right-3 top-2 rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-semibold",
                isDark ? "border-[#1E2445] bg-[#060F1B] text-slate-400" : "border-slate-300/60 bg-slate-200/60 text-slate-500"
              )}>
                ctrl /
              </kbd>
            </div>
          </form>

          {/* Right Controls */}
          <div className="flex items-center gap-3.5">
            {/* Role-Specific Status Badge */}
            <div className={cn(
              "hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold shadow-2xs",
              primaryRole === 'AUDITOR'
                ? (isDark ? "border-slate-700 bg-slate-800/80 text-slate-300" : "border-slate-300 bg-slate-100 text-slate-700")
                : (isDark ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]" : "border-emerald-200/70 bg-emerald-50 text-emerald-700")
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                primaryRole === 'AUDITOR' ? "bg-slate-400" : "bg-[#10B981] animate-pulse"
              )} />
              {primaryRole === 'CUSTOMER' ? 'Borrower Account Active' : primaryRole === 'AUDITOR' ? 'Read-Only Audit Mode' : 'Core Banking Live'}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition-colors shadow-2xs",
                isDark
                  ? "border-[#1E2445] bg-[#1E2445] text-amber-400 hover:bg-[#1E2445]/80"
                  : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* Live Interactive Notification Bell */}
            <NotificationBell />

            {/* User Profile Badge */}
            <div className={cn("flex items-center gap-2 pl-2 border-l", isDark ? "border-[#1E2445]" : "border-slate-200")}>
              <div className="hidden sm:block text-right">
                <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{roleCfg.label}</p>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isDark ? "text-slate-400 hover:text-rose-400 hover:bg-rose-950/30" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                )}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-fade-in">
          {!isAccessibleRoute ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                403 — Workspace Access Restricted
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                Your current role <span className="font-semibold text-slate-700 dark:text-slate-200">({roleCfg.label})</span> does not have authorized permission to view or operate in the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-rose-500">{pathname}</code> module.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-[#2563EB]/25 hover:bg-[#1D4ED8] transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Return to My Dashboard
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
